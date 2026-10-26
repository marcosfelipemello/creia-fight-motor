'use strict';
// Relay X1 e ranking. Apenas o anfitrião publica estados da simulação.
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const jev = require('./jev').createJev();

const HOST = '127.0.0.1';
const PORT = Number(process.env.BANGU_PORT || 8790);
const DATA_DIR = process.env.BANGU_DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'ranking.json');
const MAX_MESSAGE = 8192;
const MAX_ROOMS = 512;
const WAIT_TIMEOUT = 180000;
const FIGHT_TIMEOUT = 60000;
const ROOM_MAX_AGE = 2 * 60 * 60 * 1000;
const SCORE_CAP = 3000000; // 10 fases: ~400 lacaios, 11.160 HP de chefes, bônus de 2.000 por fase; multiplicador <=4.
const CHARACTERS = new Set(['nutri','lutador','emanuelly','enzo','pedro','naju','grazi','bispo',
  'lohan','rafinha','douglas','fidelis','arthur','lucas','duda','cardoso','th','douglinhas','ricardo','adriene']);
const rooms = new Map();
const scoreRate = new Map();
let ranking = [];
let writing = Promise.resolve();

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Content-Length':Buffer.byteLength(body),
    'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
  res.end(body);
}
function ip(req) {
  // Só o Caddy alcança esta porta. Ele define X-Forwarded-For ao encaminhar.
  const forwarded = req.headers['x-forwarded-for'];
  return typeof forwarded === 'string' ? forwarded.split(',')[0].trim().slice(0, 80) : req.socket.remoteAddress;
}
async function loadRanking() {
  await fs.mkdir(DATA_DIR, { recursive:true });
  try {
    const parsed = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('ranking.json não é uma lista');
    ranking = parsed.filter(row => row && typeof row.name === 'string' && Number.isSafeInteger(row.score))
      .sort((a,b) => b.score-a.score || a.at-b.at).slice(0,100);
  } catch (err) {
    if (err.code !== 'ENOENT') { console.error('Ranking inválido:', err); throw err; }
  }
}
function scoreBody(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (typeof raw.name !== 'string') return null;
  const name = raw.name.normalize('NFC').trim().replace(/ +/g, ' ');
  if (Array.from(name).length < 1 || Array.from(name).length > 12 || !/^[\p{L}\p{N} ]+$/u.test(name)) return null;
  if (!Number.isSafeInteger(raw.score) || raw.score < 1 || raw.score > SCORE_CAP) return null;
  if (!Number.isInteger(raw.stage) || raw.stage < 1 || raw.stage > 10) return null;
  if (raw.score > raw.stage * 300000) return null;
  if (!CHARACTERS.has(raw.character)) return null;
  return { name, score:raw.score, stage:raw.stage, character:raw.character, at:Date.now() };
}
function saveScore(row) {
  writing = writing.catch(err => { console.error('Falha anterior de gravação:', err); }).then(async () => {
    const next = ranking.concat(row).sort((a,b) => b.score-a.score || a.at-b.at).slice(0,100);
    const temp = path.join(DATA_DIR, '.ranking-' + process.pid + '-' + crypto.randomBytes(6).toString('hex') + '.tmp');
    try {
      await fs.writeFile(temp, JSON.stringify(next));
      await fs.rename(temp, DATA_FILE);
      ranking = next;
    } catch (err) { await fs.unlink(temp).catch(() => {}); throw err; }
  });
  return writing;
}
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.headers.origin === 'http://127.0.0.1:8765' || req.headers.origin === 'http://localhost:8765') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS' && url.pathname.startsWith('/api/')) { res.writeHead(204); return res.end(); }
  if (req.method === 'GET' && url.pathname === '/api/ai/status') return json(res,200,jev.status());
  if (req.method === 'POST' && url.pathname === '/api/ai/tactics') {
    const origin=req.headers.origin;
    if(origin){let host;try{host=new URL(origin).host;}catch(_){req.resume();return json(res,403,{fallback:true});}
      if(host!==(req.headers['x-forwarded-host']||req.headers.host)&&host!=='localhost:8765'&&host!=='127.0.0.1:8765'){req.resume();return json(res,403,{fallback:true});}}
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){req.resume();return json(res,415,{fallback:true});}
    let raw='',size=0;
    try{for await(const chunk of req){size+=chunk.length;if(size>8192){req.resume();return json(res,413,{fallback:true});}raw+=chunk.toString('utf8');}}
    catch(_){if(!res.destroyed)return json(res,400,{fallback:true});return;}
    let body;try{body=JSON.parse(raw);}catch(_){return json(res,400,{fallback:true});}
    const answer=await jev.decide(body,ip(req));return json(res,answer.status,answer.body);
  }
  if (req.method === 'GET' && url.pathname === '/api/characters') return json(res,200,{characters:Array.from(CHARACTERS)});
  if (req.method === 'GET' && url.pathname === '/api/ranking') {
    return json(res,200,{ ranking: ranking.slice(0,10).map(({name,score,stage,character}) => ({name,score,stage,character})) });
  }
  if (req.method === 'POST' && url.pathname === '/api/score') {
    const now = Date.now(), who = ip(req);
    if (now - (scoreRate.get(who) || 0) < 30000) { req.resume(); return json(res,429,{error:'Aguarde 30 segundos'}); }
    if (req.headers['content-type'] !== 'application/json') { req.resume(); return json(res,415,{error:'Use JSON'}); }
    let chunks = [], size = 0;
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024) { req.resume(); return json(res,413,{error:'Mensagem grande demais'}); }
        chunks.push(chunk);
      }
    } catch (err) {
      if (!res.destroyed) return json(res,400,{error:'Envio interrompido'});
      return;
    }
    let value;
    try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch (_) { return json(res,400,{error:'JSON inválido'}); }
    const row = scoreBody(value);
    if (!row) return json(res,400,{error:'Pontuação inválida'});
    scoreRate.set(who,now);
    try { await saveScore(row); return json(res,201,{ok:true}); }
    catch (err) { console.error('Falha ao gravar ranking:',err); scoreRate.delete(who); return json(res,503,{error:'Ranking indisponível'}); }
  }
  json(res,404,{error:'Não encontrado'});
});

function code() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let tries=0; tries<100; tries++) {
    let result=''; for (let i=0;i<5;i++) result += chars[crypto.randomInt(chars.length)];
    if (!rooms.has(result)) return result;
  }
  throw new Error('Sem códigos disponíveis');
}
function wsFrame(op,payload) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(payload || '');
  const header = data.length < 126 ? Buffer.from([0x80|op,data.length]) : Buffer.from([0x80|op,126,data.length>>8,data.length&255]);
  return Buffer.concat([header,data]);
}
function send(peer,value) {
  if (!peer || peer.closed || peer.socket.destroyed) return;
  if (value.type==='away' || value.type==='back' || value.type==='left') {
    clearTimeout(peer.realtimeTimer); peer.realtimeTimer=null; peer.realtime=null;
  }
  if (value.type==='snapshot' || value.type==='input') {
    // TCP não permite remover bytes já escritos. Não acrescente uma fila de
    // estados obsoletos: substitua o pendente antes de escrever no socket.
    if (peer.socket.writableLength>0 || peer.realtimeTimer) {
      if (!peer.realtime) peer.realtime={};
      const previous=peer.realtime[value.type];
      if (value.type==='input' && previous && value.input.matchId===previous.input.matchId) {
        value={type:'input',input:{...value.input}};
        for (const k of ['atk','jump','spc','alt','use']) value.input[k] ||= previous.input[k];
      }
      peer.realtime[value.type]=value;
      if (!peer.realtimeTimer) scheduleRealtime(peer);
      return;
    }
  }
  const data = Buffer.from(JSON.stringify(value));
  if (data.length > MAX_MESSAGE || peer.socket.writableLength > 65536) return close(peer,1009);
  peer.socket.write(wsFrame(1,data));
}
function scheduleRealtime(peer) {
  peer.realtimeTimer=setTimeout(() => {
    peer.realtimeTimer=null;
    if (peer.closed || peer.socket.destroyed) { peer.realtime=null; return; }
    if (peer.socket.writableLength>0) { scheduleRealtime(peer); return; }
    const latest=peer.realtime; peer.realtime=null;
    for (const value of Object.values(latest || {})) send(peer,value);
  },8);
  peer.realtimeTimer.unref();
}
function slotOf(peer) {
  return peer.room && peer.room[peer.role] || null;
}
function otherSlot(room,role) { return room[role==='host' ? 'guest' : 'host']; }
function expireRoom(room) {
  if (rooms.get(room.code)!==room) return;
  rooms.delete(room.code);
  for (const slot of [room.host,room.guest]) {
    if (!slot || !slot.peer) continue;
    const peer=slot.peer;
    slot.peer=null; peer.room=null; peer.role=null;
    send(peer,{type:'left'});
    close(peer);
  }
}
function expireRooms(now=Date.now()) {
  for (const room of rooms.values()) {
    const timeout=room.started ? FIGHT_TIMEOUT : WAIT_TIMEOUT;
    if (now-room.createdAt>ROOM_MAX_AGE ||
        [room.host,room.guest].some(slot=>slot && slot.awayAt!==null && now-slot.awayAt>=timeout)) expireRoom(room);
  }
}
function close(peer,status=1000) {
  if (peer.closed) return;
  peer.closed=true;
  clearTimeout(peer.realtimeTimer); peer.realtimeTimer=null; peer.realtime=null;
  if (peer.room) {
    const room=peer.room, slot=slotOf(peer), other=otherSlot(room,peer.role);
    if (slot && slot.peer===peer) { slot.peer=null; slot.awayAt=Date.now(); send(other && other.peer,{type:'away'}); }
    peer.room=null; peer.role=null;
  }
  try { peer.socket.end(wsFrame(8,Buffer.from([status>>8,status&255]))); } catch (_) { peer.socket.destroy(); }
}
function relay(peer,msg) {
  const room=peer.room;
  if (!room) return;
  const other=otherSlot(room,peer.role);
  const host=peer.role==='host';
  if (msg.type==='choice' && typeof msg.who==='string' && CHARACTERS.has(msg.who)) {
    if(room.started||(room.selecting&&msg.matchId!==room.matchId))return;
    slotOf(peer).choice=msg.who;
    return send(other && other.peer,{type:'choice',who:msg.who});
  }
  if (!other) return;
  if ((msg.type==='net-probe'||msg.type==='net-pong') && Number.isSafeInteger(msg.id) && msg.id>=0 && msg.id<1000000000) return send(other.peer,{type:msg.type,id:msg.id});
  if(msg.type==='rematch' && room.finished && msg.matchId===(room.matchId||1)){
    room.votes=room.votes||{};room.votes[peer.role]=msg.mode==='select'?'select':room.votes[peer.role]||'rematch';
    for(const role of ['host','guest']){const slot=room[role],rival=role==='host'?'guest':'host';send(slot&&slot.peer,{type:'rematch-state',matchId:room.matchId,self:!!room.votes[role],other:!!room.votes[rival],selfMode:room.votes[role],otherMode:room.votes[rival]});}
    if(room.votes.host&&room.votes.guest){
      if(room.votes.host==='select'||room.votes.guest==='select'){
        room.matchId++;room.started=false;room.selecting=true;room.finished=false;room.winner=null;room.votes={};room.snapshot=null;room.team=null;room.host.choice=null;room.guest.choice=null;
        for(const slot of [room.host,room.guest])send(slot.peer,{type:'reselect',matchId:room.matchId});
      }else send(room.host&&room.host.peer,{type:'rematch-ready',matchId:room.matchId});
    }
    return;
  }
  if (msg.type==='signal' && msg.signal && typeof msg.signal==='object') {
    return send(other.peer,{type:'signal',signal:msg.signal});
  }
  if (!host && msg.type==='input' && msg.input && typeof msg.input==='object') {
    if(!room.started||room.finished)return;
    const x=Number(msg.input.x), y=Number(msg.input.y);
    if (![x,y].every(Number.isFinite) || Math.abs(x)>1 || Math.abs(y)>1) return;
    if(msg.input.matchId!=null && msg.input.matchId!==room.matchId)return;
    const input={x,y};if(msg.input.matchId!=null)input.matchId=msg.input.matchId;
    if (Number.isSafeInteger(msg.input.seq) && msg.input.seq>=0 && msg.input.seq<1000000000) input.seq=msg.input.seq;
    for (const k of ['atk','jump','spc','alt','use']) input[k]=msg.input[k]===true;
    return send(other.peer,{type:'input',input});
  }
  if (host && msg.type==='snapshot' && msg.state && typeof msg.state==='object') {
    if(!room.started)return;
    if(msg.state.matchId!=null && msg.state.matchId!==room.matchId)return;
    room.snapshot=msg.state; return send(other.peer,{type:'snapshot',state:msg.state});
  }
  if (host && msg.type==='start' && Array.isArray(msg.team) && msg.team.length===2 && msg.team.every(w=>CHARACTERS.has(w))) {
    if(room.selecting&&(!room.host.choice||!room.guest.choice||room.host.choice===room.guest.choice||msg.team[0]!==room.host.choice||msg.team[1]!==room.guest.choice))return;
    if(room.started && !(room.finished&&room.votes&&room.votes.host&&room.votes.guest))return;
    room.matchId=(room.matchId||0)+1;room.finished=false;room.votes={};room.snapshot=null;
    room.started=true;room.selecting=false; room.team=msg.team;send(peer,{type:'match-started',matchId:room.matchId});
    return send(other.peer,{type:'start',team:msg.team,matchId:room.matchId});
  }
  if (host && msg.type==='result' && room.started && (msg.matchId==null||msg.matchId===room.matchId)) {room.finished=true;room.winner=msg.winner===0||msg.winner===1?msg.winner:null;return send(other.peer,{type:'result',matchId:room.matchId,winner:msg.winner===0||msg.winner===1?msg.winner:null});}
}
function message(peer,msg) {
  if (!msg || typeof msg!=='object' || Array.isArray(msg)) return;
  expireRooms();
  if (msg.type==='leave' && peer.room) { expireRoom(peer.room); return; }
  if (msg.type==='create' && !peer.room) {
    if (rooms.size>=MAX_ROOMS) return send(peer,{type:'error',message:'SERVIDOR CHEIO'});
    const id=code(), token=crypto.randomBytes(32).toString('hex');
    const room={code:id,host:{peer,token,choice:null,awayAt:null},guest:null,started:false,team:null,snapshot:null,createdAt:Date.now()};
    rooms.set(id,room); peer.room=room; peer.role='host';
    return send(peer,{type:'created',code:id,token});
  }
  if (msg.type==='join' && !peer.room) {
    const id=String(msg.code||'').toUpperCase(), room=rooms.get(id);
    if (!room || room.guest || room.host.peer===peer) return send(peer,{type:'error',message:'SALA INDISPONÍVEL'});
    const token=crypto.randomBytes(32).toString('hex');
    room.guest={peer,token,choice:null,awayAt:null}; peer.room=room; peer.role='guest';
    send(peer,{type:'joined',code:id,token}); send(room.host.peer,{type:'peer'});
    if (!room.host.peer) send(peer,{type:'away'});
    return;
  }
  if (msg.type==='resume' && !peer.room) {
    const id=typeof msg.code==='string' ? msg.code.toUpperCase() : '';
    const room=rooms.get(id), supplied=typeof msg.token==='string' && /^[0-9a-f]{64}$/.test(msg.token) ? Buffer.from(msg.token,'hex') : null;
    let role=null;
    if (room && supplied) for (const name of ['host','guest']) {
      const slot=room[name];
      if (slot && crypto.timingSafeEqual(Buffer.from(slot.token,'hex'),supplied)) role=name;
    }
    if (!role) return send(peer,{type:'error',message:'SALA INDISPONÍVEL'});
    const slot=room[role], old=slot.peer, other=otherSlot(room,role);
    if (old && old!==peer) { old.room=null; old.role=null; close(old); }
    slot.peer=peer; slot.awayAt=null; peer.room=room; peer.role=role;
    send(peer,{type:'resumed',code:id,role,token:slot.token,peerReady:!!other,otherAway:!!other&&!other.peer,
      started:room.started,selecting:!!room.selecting,matchId:room.matchId,finished:!!room.finished,winner:room.winner,rematchSelf:!!(room.votes&&room.votes[role]),rematchOther:!!(room.votes&&room.votes[role==='host'?'guest':'host']),selfMode:room.votes&&room.votes[role],otherMode:room.votes&&room.votes[role==='host'?'guest':'host'],choice:slot.choice,otherChoice:other&&other.choice,team:room.team,snapshot:room.snapshot});
    send(other && other.peer,{type:'back'});
    if (role==='host' && other) send(peer,{type:'peer'});
    return;
  }
  relay(peer,msg);
}
function receive(peer,chunk) {
  peer.lastSeen=Date.now(); peer.buffer=Buffer.concat([peer.buffer,chunk]);
  // O limite é por frame, conferido abaixo. Um chunk TCP pode conter vários.
  while (peer.buffer.length>=2) {
    const b0=peer.buffer[0], b1=peer.buffer[1];
    if ((b0&0x70)!==0 || !(b0&0x80) || !(b1&0x80)) return close(peer,1002);
    const op=b0&15, len7=b1&127;
    let len=len7, offset=2;
    if (len7===126) { if (peer.buffer.length<4) return; len=peer.buffer.readUInt16BE(2); offset=4; }
    if (len7===127 || len>MAX_MESSAGE) return close(peer,1009);
    if (peer.buffer.length<offset+4+len) return;
    const mask=peer.buffer.subarray(offset,offset+4); offset+=4;
    const data=Buffer.from(peer.buffer.subarray(offset,offset+len));
    peer.buffer=peer.buffer.subarray(offset+len);
    for (let i=0;i<data.length;i++) data[i]^=mask[i&3];
    if (op===8) return close(peer);
    if (op===9) { peer.socket.write(wsFrame(10,data)); continue; }
    if (op===10) continue;
    if (op!==1) return close(peer,1003);
    const now=Date.now();
    if (now-peer.rateTime>1000) { peer.rateTime=now; peer.rateCount=0; }
    if (++peer.rateCount>60) return close(peer,1008);
    try { message(peer,JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data))); }
    catch (_) { return close(peer,1007); }
  }
}
server.on('upgrade',(req,socket,head) => {
  const url=new URL(req.url,'http://localhost');
  const key=req.headers['sec-websocket-key'];
  const origin=req.headers.origin || '';
  const host=req.headers.host || '';
  let originHost='';
  try { originHost=new URL(origin).host; } catch (_) {}
  if (url.pathname!=='/ws' || req.headers.upgrade?.toLowerCase()!=='websocket' ||
      typeof key!=='string' || !/^[A-Za-z0-9+/]{22}==$/.test(key) ||
      !originHost || (originHost!==host && !/^(127\.0\.0\.1|localhost):8765$/.test(originHost))) {
    socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
  }
  const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.setNoDelay(true);
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
  const peer={socket,buffer:Buffer.alloc(0),room:null,lastSeen:Date.now(),rateTime:0,rateCount:0,closed:false};
  socket.on('data',c=>receive(peer,c)); socket.on('error',()=>close(peer)); socket.on('close',()=>close(peer));
  if (head.length) receive(peer,head);
});
setInterval(() => expireRooms(),1000).unref();
setInterval(() => {
  const now=Date.now();
  for (const room of rooms.values()) for (const slot of [room.host,room.guest]) {
    const peer=slot && slot.peer;
    if (!peer) continue;
    if (now-peer.lastSeen>45000) close(peer,1001);
    else if (!peer.socket.destroyed) peer.socket.write(wsFrame(9,Buffer.alloc(0)));
  }
  for (const [address,at] of scoreRate) if (now-at>60000) scoreRate.delete(address);
},15000).unref();
if (require.main === module) {
  server.on('error', err => { console.error('Falha no servidor:',err); process.exitCode=1; });
  loadRanking().then(() => server.listen(PORT,HOST,()=>console.log(`Bangu online em ${HOST}:${PORT}`)))
    .catch(err=>{console.error(err);process.exitCode=1;});
}
module.exports = { server, scoreBody, loadRanking, saveScore, message, receive, close, rooms,
  expireRooms, getRanking: () => ranking };
