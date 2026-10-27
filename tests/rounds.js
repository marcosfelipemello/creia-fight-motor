// Exercita o motor com dois contextos independentes e canvas sem desenho.
// Uso: node tests/rounds.js
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const relay = require('../server/index.js');

const scripts = ['sprites','backgrounds','bosses','viloes','cenarios-arte',
  'criancas','bichos','objetos','rig','combate-config','ia-tatica','hud-combate','game'];
const root = path.resolve(__dirname,'..');
const noop = () => {};
let clock = 0;

function client() {
  const events = {}, received = [], sent = [], textSeen = new Set();
  let nextFrame, peer;
  const ctx = new Proxy({}, { get(_,key) {
    if (key === 'measureText') return value => ({width:String(value).length*8});
    if (key === 'fillText') return value => { textSeen.add(String(value)); };
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({addColorStop:noop});
    return noop;
  }, set:() => true });
  function canvas() { return {width:480,height:270,getContext:() => ctx,
    getBoundingClientRect:() => ({width:480,height:270})}; }
  const cv = canvas();
  function socketPeer() {
    return {room:null,closed:false,buffer:Buffer.alloc(0),rateTime:0,rateCount:0,lastSeen:0,
      socket:{destroyed:false,writableLength:0,
      write(frame) {
        const offset=(frame[1]&127)===126 ? 4 : 2;
        const msg=JSON.parse(frame.subarray(offset).toString('utf8'));
        received.push(msg);
        if (msg.type==='created' || msg.type==='joined') {
          transport.code=msg.code; transport.token=msg.token;
        }
        transport.onMessage(msg);
      },
      end() { this.destroyed=true; }
    }};
  }
  const transport = {
    onMessage:null, pendingCode:null, received, sent, code:null, token:null,
    get peer() { return peer; },
    create() { peer=socketPeer(); relay.message(peer,{type:'create'}); },
    join(code) { peer=socketPeer(); relay.message(peer,{type:'join',code}); },
    drop() { if (peer && !peer.closed) { relay.close(peer); transport.onMessage({type:'reconnecting'}); } },
    resume() { peer=socketPeer(); relay.message(peer,{type:'resume',code:transport.code,token:transport.token}); },
    send(msg) {
      if (!peer || peer.closed) return false;
      sent.push(msg);
      if (msg.type==='input') {
        const data=Buffer.from(JSON.stringify(msg)), mask=Buffer.from([17,31,53,71]);
        const head=data.length<126 ? Buffer.from([0x81,0x80|data.length])
          : Buffer.from([0x81,0xfe,data.length>>8,data.length&255]);
        const frame=Buffer.concat([head,mask,Buffer.from(data.map((v,i)=>v^mask[i&3]))]);
        relay.receive(peer,frame);
      } else relay.message(peer,msg);
      return !peer.closed;
    },
    leave() { const current=peer; peer=null; if (current && !current.closed) { relay.message(current,{type:'leave'}); relay.close(current); } },
    showLink:noop, hideOverlay:noop,
    askText:() => Promise.resolve(null), ranking:() => Promise.resolve({ranking:[]}),
    score:() => Promise.resolve({ok:true})
  };
  const env = {console,Math,Date,TextEncoder,URLSearchParams,performance:{now:() => clock},
    location:{search:'',hostname:'127.0.0.1'},navigator:{maxTouchPoints:0},devicePixelRatio:1,
    Image:class { set src(value) { this.complete=true; this.naturalWidth=100; } },
    localStorage:{getItem:() => JSON.stringify({tut:true,best:10}),setItem:noop},
    document:{getElementById:() => cv,createElement:canvas,head:{appendChild:noop},body:{appendChild:noop}},
    addEventListener:(name,fn) => { events[name]=fn; },
    requestAnimationFrame:fn => { nextFrame=fn; },setTimeout,clearTimeout,BanguOnline:transport};
  env.window=env;
  vm.createContext(env);
  for (const name of scripts) vm.runInContext(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'),env,{filename:name+'.js'});
  return {
    transport, textSeen,
    get state() { return env.__bangu.state; },
    get online() { return env.__bangu.online; },
    tick(count=1) { for(let i=0;i<count;i++) { clock+=1000/60; nextFrame(clock); } },
    key(code) { events.keydown({code,preventDefault:noop}); this.tick(); events.keyup({code}); },
    until(check,limit=500) { for(let i=0;i<limit && !check(this.state);i++) this.tick();
      assert(check(this.state),'estado esperado não chegou'); }
  };
}

function startLocal() {
  const c=client();
  c.key('Enter'); c.key('Enter'); // menu X1 > X1 local
  assert.equal(c.state.scene,'select');
  c.key('KeyJ'); c.key('KeyJ'); c.key('Enter'); c.key('Enter'); // P1, CPU, INICIAR e cenário
  c.until(s => s.scene==='play');
  assert.equal(c.state.players[1].ai,true);
  return c;
}
function fight(c) { c.until(s => s.round && s.round.phase==='fight'); }
function ko(c,winner) {
  fight(c);
  const p=c.state.players;
  if (winner===null) { p[0].hp=p[1].hp=0; p[0].dead=p[1].dead=true; }
  else { p[1-winner].hp=0; p[1-winner].dead=true; }
  c.tick();
  assert.equal(c.state.round.phase,'ko');
  assert.equal(c.state.round.roundWinner,winner);
}

// Sem movimento antes de LUTEM; 2x0 e limpeza integral entre rounds.
const straight=startLocal();
const x0=straight.state.players[0].x;
straight.key('KeyD'); straight.tick(30);
assert.equal(straight.state.players[0].x,x0);
ko(straight,0);
const old=straight.state.players[0]; old.sp=100; old.hp=5; old.maxHp=150;
old.turbo=8; old.spinT=8; old.shield=8; old.cd=9; old.altCd=9;
straight.state.shots.push({x:1}); straight.state.eshots.push({x:1}); straight.state.parts.push({x:1});
straight.until(s => s.round.phase==='intro' && s.round.number===2);
assert.deepEqual(Array.from(straight.state.round.wins),[1,0]);
assert.equal(straight.state.players[0].hp,100);
assert.equal(straight.state.players[0].maxHp,100);
assert.equal(straight.state.players[0].sp,0);
for(const field of ['turbo','spinT','shield','cd','altCd']) assert.equal(straight.state.players[0][field]||0,0);
for(const field of ['shots','eshots','parts']) assert.equal(straight.state[field].length,0);
assert.equal(straight.state.players[0].x,x0);
ko(straight,0);
straight.until(s => s.round.phase==='match');
assert.deepEqual(Array.from(straight.state.round.wins),[2,0]);
for(const label of ['ROUND 1','ROUND 2','LUTEM!','K.O.!','BISPO ANDRE VENCEU O X1!','2 x 0'])
  assert(straight.textSeen.has(label),'faixa ausente: '+label);
straight.until(s => s.scene==='menu');
console.log('CPU 2x0 e reset: OK');

const comeback=startLocal();
ko(comeback,1); comeback.until(s => s.round.phase==='intro' && s.round.number===2);
ko(comeback,0); comeback.until(s => s.round.phase==='intro' && s.round.number===3);
assert.deepEqual(Array.from(comeback.state.round.wins),[1,1]);
assert(comeback.textSeen.has('ROUND FINAL'));
ko(comeback,null); comeback.until(s => s.round.phase==='intro' && s.round.number===3);
assert.deepEqual(Array.from(comeback.state.round.wins),[1,1]);
ko(comeback,0); comeback.until(s => s.round.phase==='match');
assert.deepEqual(Array.from(comeback.state.round.wins),[2,1]);
console.log('CPU 2x1 e ROUND FINAL: OK');

const draw=startLocal();
ko(draw,null);
draw.until(s => s.round.phase==='intro' && s.round.t===0);
assert.equal(draw.state.round.number,1);
assert.deepEqual(Array.from(draw.state.round.wins),[0,0]);
console.log('Empate repete round: OK');

const keyboard=client();
keyboard.key('Enter'); keyboard.key('KeyD'); keyboard.key('Enter');
keyboard.key('KeyJ'); keyboard.key('Comma'); keyboard.key('Comma'); keyboard.key('KeyL'); keyboard.key('Enter');   // L inicia, Enter confirma o cenário
keyboard.until(s => s.scene==='play');
assert.equal(keyboard.state.players[0].ai,false);
assert.equal(keyboard.state.players[1].ai,false);
ko(keyboard,1); keyboard.until(s => s.round.phase==='intro' && s.round.number===2);
assert.equal(keyboard.state.players[1].ai,false);
assert.equal(keyboard.state.players[1].ctl,1);
console.log('Dois jogadores no teclado: OK');

const host=client(),guest=client();
host.key('Enter'); host.key('KeyD');host.key('KeyD');host.key('KeyD'); host.key('Enter');
guest.transport.join(host.transport.code);
host.key('Enter'); guest.key('KeyD'); guest.key('Enter'); host.tick();
assert.equal(host.state.scene,'play'); assert.equal(guest.state.scene,'onlinePlay');
assert.equal(guest.state.players.length,0); // convidado não simula
const guestX=host.state.players[1].x;
guest.key('KeyA'); guest.key('KeyJ'); host.tick(); guest.tick(3); host.tick();
assert.equal(host.state.players[1].x,guestX); // entrada na contagem não move nem fica na fila
host.until(s => s.round.phase==='fight');
assert.equal(host.state.players[1].state,'idle');
ko(host,0);
host.until(s => s.round.phase==='intro' && s.round.number===2);
host.tick(4);
guest.tick();
assert(guest.transport.received.some(m => m.type==='snapshot' && m.state.round.wins[0]===1));
guest.tick();
assert(guest.textSeen.has('ROUND 2'),'convidado não desenhou o segundo round');
ko(host,0); host.until(s => s.round.phase==='match'); host.tick(4); guest.tick();
assert(guest.transport.received.some(m => m.type==='result' && m.winner===0));
assert(guest.transport.received.some(m => m.type==='snapshot' && m.state.round.phase==='match' && m.state.round.wins[0]===2));
assert(guest.textSeen.has('BISPO ANDRE VENCEU O X1!'),'convidado não desenhou o resultado');
host.tick(300);guest.tick();assert.equal(host.state.scene,'play','sala encerrou antes da revanche');assert.equal(guest.state.scene,'onlinePlay');
const roomCode=host.transport.code;
guest.transport.send({type:'rematch',matchId:0});assert.equal(host.online.rematchOther,false,'aceitou voto de outra partida');
host.key('Enter');host.tick(4);assert.equal(host.state.round.phase,'match','revanche começou sem o rival');
host.transport.send({type:'start',team:[host.online.choice,host.online.other]});assert.equal(relay.rooms.get(roomCode).matchId,1,'servidor aceitou revanche unilateral');
guest.key('Enter');host.tick(4);guest.tick(2);
assert.equal(host.transport.code,roomCode,'revanche trocou a sala');assert.equal(host.state.round.number,1);assert.deepEqual(Array.from(host.state.round.wins),[0,0]);
assert.equal(guest.state.scene,'onlinePlay');assert(guest.transport.received.some(m=>m.type==='start'&&m.matchId===2),'rival não recebeu início da revanche');
const oldCount=host.transport.received.length;
guest.transport.send({type:'input',input:{matchId:1,x:1,y:0,atk:true,seq:100}});
assert.equal(host.transport.received.length,oldCount,'comando da partida anterior chegou ao anfitrião');
ko(host,0);host.until(s=>s.round.phase==='intro'&&s.round.number===2);ko(host,0);host.until(s=>s.round.phase==='match');host.tick(4);guest.tick();
const finishedId=host.online.matchId;
host.transport.send({type:'rematch',mode:'select',matchId:finishedId});
assert.equal(host.state.scene,'play','troca começou sem consentimento');assert.equal(guest.online.otherMode,'select');
guest.transport.drop();guest.transport.resume();assert.equal(guest.online.otherMode,'select','reconexão perdeu pedido de troca');
guest.key('Enter');host.tick();guest.tick();
assert.equal(host.state.scene,'onlineSelect');assert.equal(guest.state.scene,'onlineSelect');assert.equal(host.transport.code,roomCode);
assert.equal(host.online.choice,null);assert.equal(guest.online.other,null);assert.equal(relay.rooms.get(roomCode).snapshot,null);
guest.transport.send({type:'choice',who:'pedro',matchId:finishedId});assert.equal(host.online.other,null,'escolha antiga contaminou nova seleção');
host.transport.send({type:'result',winner:1,matchId:finishedId});assert.equal(relay.rooms.get(roomCode).finished,false);
guest.transport.drop();guest.transport.resume();assert.equal(guest.state.scene,'onlineSelect','retomada saiu da seleção');
host.key('KeyD');host.key('Enter');guest.key('KeyD');guest.key('KeyD');guest.key('Enter');host.tick(4);guest.tick(2);
assert.equal(host.state.scene,'play');assert.equal(guest.state.scene,'onlinePlay');assert.equal(host.state.round.number,1);
assert.deepEqual(Array.from(host.state.players,p=>p.who),['lucas','lutador']);assert.deepEqual(Array.from(host.state.round.wins),[0,0]);
assert(host.online.matchId>finishedId);assert.equal(host.transport.code,roomCode);
host.transport.leave();assert.equal(host.state.scene,'menu');assert.equal(guest.state.scene,'menu');
console.log('Online: revanche, troca de lutadores na mesma sala, consentimento, reconexão e mensagens antigas rejeitadas: OK');

const pauseHost=client(),pauseGuest=client();
pauseHost.key('Enter');pauseHost.key('KeyD');pauseHost.key('KeyD');pauseHost.key('KeyD');pauseHost.key('Enter');
pauseGuest.transport.join(pauseHost.transport.code);
pauseHost.key('Enter');pauseGuest.key('KeyD');pauseGuest.key('Enter');pauseHost.tick();
pauseHost.until(s=>s.round&&s.round.phase==='fight');
const frozenSt=pauseHost.state.players[0].st;
pauseGuest.transport.drop();
pauseHost.tick(90);pauseGuest.tick();
assert.equal(pauseHost.state.players[0].st,frozenSt,'luta avançou durante a ausência');
assert(pauseHost.textSeen.has('RECONECTANDO...'));
assert(pauseGuest.textSeen.has('RECONECTANDO...'));
pauseGuest.transport.resume();
pauseHost.tick(4);
assert(pauseHost.state.players[0].st>frozenSt,'luta não retomou após reconexão');
console.log('Online, pausa e retomada no mesmo estado: OK');
pauseHost.transport.leave();

const hostExit=client(),guestExit=client();
hostExit.key('Enter'); hostExit.key('KeyD');hostExit.key('KeyD');hostExit.key('KeyD'); hostExit.key('Enter');
guestExit.transport.join(hostExit.transport.code);
hostExit.key('Enter'); guestExit.key('KeyD'); guestExit.key('Enter'); hostExit.tick();
hostExit.key('KeyP');
hostExit.key('KeyS'); hostExit.key('KeyS'); hostExit.key('KeyS'); hostExit.key('Enter');
assert.equal(hostExit.state.scene,'menu');
assert.equal(guestExit.state.scene,'menu');
assert.equal(relay.rooms.size,0);
console.log('Online, saída no meio da luta: OK');

// 15 toques por segundo durante 10 segundos passam pelo parser e limitador WebSocket reais.
const fastHost=client(),fastGuest=client();
fastHost.key('Enter'); fastHost.key('KeyD');fastHost.key('KeyD');fastHost.key('KeyD'); fastHost.key('Enter');
fastGuest.transport.join(fastHost.transport.code);
fastHost.key('Enter'); fastGuest.key('KeyD'); fastGuest.key('Enter'); fastHost.tick();
const firstInput=fastGuest.transport.sent.filter(m=>m.type==='input').length;
for(let i=0;i<600;i++) {
  if(i%60===0) { fastGuest.transport.peer.rateTime=Date.now(); fastGuest.transport.peer.rateCount=0; }
  if(i%4===0) fastGuest.key('KeyJ'); else fastGuest.tick();
}
const commands=fastGuest.transport.sent.filter(m=>m.type==='input').slice(firstInput);
assert.equal(fastGuest.transport.peer.closed,false);
// Mantém o envio periódico a 20/s, antecipando comandos novos até o teto de 30/s.
assert(commands.length<=300 && commands.length>=190,'comandos fora de 20–30/s: '+commands.length);
assert(commands.filter(m=>m.input.atk).length>=145,'toques de ataque perdidos');
console.log('15 ataques/s por 10 s, '+commands.length+' comandos, sem queda: OK');
fastGuest.transport.peer.rateTime=Date.now(); fastGuest.transport.peer.rateCount=0;
for(let i=0;i<60;i++) fastGuest.transport.send({type:'input',input:{x:0,y:0}});
assert.equal(fastGuest.transport.peer.closed,false,'servidor recusou 60 mensagens/s');
fastGuest.transport.send({type:'input',input:{x:0,y:0}});
assert.equal(fastGuest.transport.peer.closed,true,'servidor aceitou mais de 60 mensagens/s');

const hitHost=client(),hitGuest=client();
hitHost.key('Enter'); hitHost.key('KeyD');hitHost.key('KeyD');hitHost.key('KeyD'); hitHost.key('Enter');
hitGuest.transport.join(hitHost.transport.code);
hitHost.key('Enter'); hitGuest.key('KeyD'); hitGuest.key('Enter'); hitHost.tick();
hitHost.until(s=>s.round&&s.round.phase==='fight');
hitHost.state.players[1].x=hitHost.state.players[0].x+15;
hitHost.state.players[1].y=hitHost.state.players[0].y;
hitHost.state.players[1].hp=1; hitHost.state.players[1].inv=0;
hitHost.key('KeyJ');
for(let i=0;i<25;i++) { hitHost.tick(); hitGuest.tick(); }
const hitEvents=hitHost.transport.sent.filter(m=>m.type==='snapshot').flatMap(m=>m.state.sounds.map(e=>e[1]));
assert(hitEvents.includes('hit')&&hitEvents.includes('ko'),'eventos de golpe/K.O. ausentes');
assert(hitGuest.online.heardId>0,'convidado não processou os sons de golpe/K.O.');
console.log('Golpe e K.O. transmitidos para o convidado: OK');

// Os especiais exercitam as mesmas camadas de desenho nos dois clientes e medem o pacote completo.
const fxHost=client(),fxGuest=client();
fxHost.key('Enter'); fxHost.key('KeyD');fxHost.key('KeyD');fxHost.key('KeyD'); fxHost.key('Enter');
fxGuest.transport.join(fxHost.transport.code);
fxHost.key('Enter'); fxGuest.key('KeyD'); fxGuest.key('Enter'); fxHost.tick();
fxHost.until(s=>s.round&&s.round.phase==='fight');
const effects=['grazi','lohan','rafinha','douglas','arthur','lucas','duda','emanuelly','naju'];
for(const who of effects) {
  const p=fxHost.state.players[0]; p.who=who; p.state='idle'; p.st=0; p.sp=100; p.cd=0;
  fxHost.key('KeyL');
  for(let i=0;i<125;i++) {
    if(i%60===0) { fxGuest.transport.peer.rateTime=Date.now(); fxGuest.transport.peer.rateCount=0; }
    fxHost.tick(); fxGuest.tick();
  }
  assert.equal(fxGuest.transport.peer.closed,false,'desconectou durante '+who);
}
for(const label of ['CHUUUUVA','DANE-SE,','PORCOS','CORAM','MINHA REDACAO:'])
  assert(fxGuest.textSeen.has(label),'efeito ausente no convidado: '+label);
assert(fxGuest.online.heardId>0,'convidado não recebeu eventos de som');
const snapshots=fxHost.transport.sent.filter(m=>m.type==='snapshot');
assert(snapshots.some(m=>m.state.sounds.some(e=>e[1]==='special')),'som do especial ausente');
const biggest=Math.max(...snapshots.map(m=>Buffer.byteLength(JSON.stringify(m))));
assert(biggest<8192,'snapshot ultrapassa 8 KB: '+biggest);
assert(snapshots.some(m=>m.state.kids&&m.state.kids.length),'crianças ausentes do snapshot');
assert(snapshots.some(m=>m.state.flashT>0),'flash ausente do snapshot');
console.log('Especiais no convidado e maior snapshot: '+biggest+' bytes: OK');
