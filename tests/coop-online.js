// Exercita o motor com dois contextos independentes e canvas sem desenho.
// Uso: node tests/coop-online.js
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dataDir=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'bangu-coop-'));
process.env.BANGU_DATA_DIR=dataDir;
const relay = require('../server/index.js');

const scripts = ['sprites','backgrounds','bosses','viloes','cenarios-arte',
  'criancas','bichos','objetos','rig','combate-config','ia-tatica','hud-combate','game'];
const root = path.resolve(__dirname,'..');
const noop = () => {};
let clock = 0;

function client() {
  const events = {}, received = [], sent = [], textSeen = new Set();
  let nextFrame, peer, frames=0;
  const gamepads=[];
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
    createCoop(){peer=socketPeer();relay.message(peer,{type:'create',mode:'coop'});},
    joinCoop(code){peer=socketPeer();relay.message(peer,{type:'join',code,mode:'coop'});},
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
    location:{search:'',hostname:'127.0.0.1'},navigator:{maxTouchPoints:0,getGamepads:()=>gamepads},devicePixelRatio:1,
    Image:class { set src(value) { this.complete=true; this.naturalWidth=100; } },
    CreiaUI:{sync(state,commands){env.uiState=state;env.commands=commands;}},
    localStorage:{getItem:() => JSON.stringify({tut:true,best:10}),setItem:noop},
    document:{getElementById:() => cv,createElement:canvas,head:{appendChild:noop},body:{appendChild:noop}},
    addEventListener:(name,fn) => { events[name]=fn; },
    requestAnimationFrame:fn => { nextFrame=fn; },setTimeout,clearTimeout,BanguOnline:transport};
  env.window=env;
  vm.createContext(env);
  for (const name of scripts) { let source=fs.readFileSync(path.join(root,'js',name+'.js'),'utf8');if(name==='game')source=source.replace(/\}\(\)\);\s*$/, 'window.stageForTest=startStage;window.winForTest=function(){startStage(10);phase="clear";phaseT=5;};}());');vm.runInContext(source,env,{filename:name+'.js'}); }
  return {
    transport, textSeen, winForTest:()=>env.winForTest(),stageForTest:s=>env.stageForTest(s),api:env.__bangu,ui:env.CreiaUI,get uiState(){return env.uiState;},get commands(){return env.commands;},
    pad(button){if(!gamepads[0])gamepads[0]={connected:true,index:0,id:'Xbox',mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};gamepads[0].buttons[button].pressed=true;this.tick();gamepads[0].buttons[button].pressed=false;this.tick();},
    hold(code){events.keydown({code,preventDefault:noop});},release(code){events.keyup({code});},
    get state() { return env.__bangu.state; },
    get online() { return env.__bangu.online; },
    tick(count=1) { for(let i=0;i<count;i++) { if(peer&&++frames%60===0){peer.rateTime=Date.now();peer.rateCount=0;} clock+=1000/60; nextFrame(clock); } },
    key(code) { events.keydown({code,preventDefault:noop}); this.tick(); events.keyup({code}); },
    until(check,limit=500) { for(let i=0;i<limit && !check(this.state);i++) this.tick();
      assert(check(this.state),'estado esperado não chegou'); }
  };
}

function createAdventureRoom(c){c.key('KeyS');c.key('Enter');assert.equal(c.state.scene,'adventuremenu');c.key('KeyD');c.key('Enter');assert(c.transport.code);}
function pair(stage=1,allies=[]){
  const h=client(),g=client();h.tick();g.tick();
  createAdventureRoom(h);g.transport.joinCoop(h.transport.code);
  h.key('Enter');g.key('KeyD');g.key('Enter');h.tick();
  assert.equal(h.state.scene,'coopSetup');
  h.commands.coop('stage',stage);assert.equal(h.online.stage,1);for(const who of allies)h.commands.coop('ally',who);
  h.commands.coop('start');h.tick(4);g.tick(2);
  assert.equal(h.state.scene,'play');assert.equal(g.state.scene,'onlinePlay');
  return {h,g};
}
const navigation=client();navigation.tick();assert(!navigation.textSeen.has('AVENTURA ONLINE (BETA)'),'online ainda aparece no menu principal');
navigation.pad(13);navigation.pad(0);assert.equal(navigation.state.scene,'adventuremenu');
navigation.pad(15);assert.equal(navigation.uiState.adventure.card,1);navigation.pad(13);assert.equal(navigation.uiState.adventure.online,1);navigation.pad(12);assert.equal(navigation.uiState.adventure.online,0);
navigation.pad(14);navigation.pad(0);assert.equal(navigation.state.scene,'select');navigation.key('Escape');assert.equal(navigation.state.scene,'adventuremenu');navigation.key('Escape');assert.equal(navigation.state.scene,'menu');
console.log('Menu aventura: entrada pelo menu principal, cartões, opção online, controle e ESC: OK');
const mismatch=client(),wrong=client();mismatch.transport.create();wrong.transport.joinCoop(mismatch.transport.code);
assert(wrong.transport.received.some(m=>m.type==='error'));mismatch.transport.leave();
const inverse=client(),wrongX1=client();inverse.transport.createCoop();wrongX1.transport.join(inverse.transport.code);assert(wrongX1.transport.received.some(m=>m.type==='error'));inverse.transport.leave();
const same=client(),other=client();same.transport.createCoop();other.transport.joinCoop(same.transport.code);same.key('Enter');other.key('Enter');assert.equal(other.online.choice,null);same.transport.leave();
// Teclado e controle usam o mesmo menuKey; as novas ações dos chips mantêm esse caminho.
const kh=client(),kg=client();kh.transport.createCoop();kg.transport.joinCoop(kh.transport.code);
kh.key('Enter');kg.key('KeyD');kg.key('Enter');kh.tick();assert.equal(kh.state.scene,'coopSetup');
assert.equal(kh.online.stage,1);assert.equal(kh.uiState.coop.place,'FIGUEIREDO CAMARGO 1233');
kh.key('KeyD');assert.equal(kh.online.allies.length,1);
kh.key('KeyS');kh.key('KeyD');assert.equal(kh.online.allies.length,2);assert.equal(new Set(kh.online.allies).size,2);
assert(!kh.online.allies.includes(kh.online.choice)&&!kh.online.allies.includes(kh.online.other));
kh.key('KeyS');kh.key('Enter');kh.tick(4);kg.tick();assert.equal(kh.state.scene,'play');assert.equal(kh.state.stage,1);assert.equal(kh.state.players.length,4);kh.transport.leave();
const {h,g}=pair(3,['nutri','duda']);
assert.equal(h.state.stage,1);assert.equal(h.state.players.length,4);assert.equal(new Set(h.state.players.map(p=>p.who)).size,4);
assert.equal(h.state.players[1].ctl,1);assert.equal(h.state.players[1].ai,false);
for(let i=0;i<190;i++){h.tick();g.tick();}
const before=h.state.players[1].x,oldY=h.state.players[1].y;
g.hold('KeyD');g.hold('KeyW');
for(let i=0;i<25;i++){g.tick();h.tick();}
g.release('KeyD');g.release('KeyW');
assert(h.state.players[1].x>before,'input remoto não moveu P2 no host');assert(h.state.players[1].y<oldY,'input remoto perdeu eixo Y');
assert.equal(g.state.players.length,0,'convidado simulou jogadores');assert.equal(g.state.enemies.length,0,'convidado simulou dano/IA');
const p=h.state.players[1],x=p.x;
g.transport.send({type:'input',input:{matchId:h.online.matchId,seq:h.online.inputSeq-1,x:-1,y:0}});assert.notEqual(h.online.input.x,-1,'input repetido aceito');
h.api.cardosoTest.spawn('fome',h.state.cam+250,210);h.tick(4);g.tick();
let latest=g.online.snapshots.at(-1).state;assert(latest.enemies.length);assert.equal(latest.stage,h.state.stage);assert(Math.abs(latest.cam-h.state.cam)<6);
h.api.jumpToBoss();for(let i=0;i<370;i++){h.tick();g.tick();}
assert(h.state.bosses.length);h.state.bosses[0].forma=2;h.state.bosses[0].transT=1.2;
h.tick(4);g.tick();latest=g.online.snapshots.at(-1).state;assert.equal(latest.bosses[0].forma,2);assert(latest.bosses[0].transT>0);
// O desenho temporário nunca deixa o mundo remoto no motor do convidado.
const hp=h.state.players[0].hp;g.tick(60);assert.equal(h.state.players[0].hp,hp);assert.equal(g.state.bosses.length,0);
h.state.players[0].dead=true;h.state.players[0].hp=0;h.state.players[1].dead=true;h.state.players[1].hp=0;h.state.players[2].hp=25;
assert(h.api.petCat());assert.equal(h.state.players[0].dead,false);assert.equal(h.state.players[0].hp,h.state.players[0].maxHp*.15);assert.equal(h.state.players[1].dead,false);assert.equal(h.state.players[1].hp,h.state.players[1].maxHp*.15);assert(h.state.players[2].hp>25);
h.tick(4);g.tick();assert(g.online.snapshots.at(-1).state.cat.done);assert(!('checkpoint' in g.online.snapshots.at(-1).state));
// Queda não pausa coop; token devolve o mesmo lutador e o estado do gato.
g.transport.drop();assert.equal(h.state.players[1].ai,true);const t=h.online.seq;h.tick(10);assert(h.online.seq>t);g.transport.resume();h.tick(4);g.tick();assert.equal(h.state.players[1].ai,false);assert.equal(g.state.scene,'onlinePlay');
// Página nova retoma com os metadados guardados pelo relay.
const reload=client();reload.transport.code=g.transport.code;reload.transport.token=g.transport.token;reload.transport.resume();reload.tick();assert.equal(reload.state.scene,'onlinePlay');assert(reload.online.snapshots.length);assert(reload.online.snapshots.at(-1).state.cat.done);assert(!('checkpoint' in reload.online.snapshots.at(-1).state));
h.state.players.forEach(p=>{p.hp=0;p.dead=true;});for(let i=0;i<110;i++){h.tick();reload.tick();}
assert.equal(h.state.scene,'gameover');assert.equal(reload.online.snapshots.at(-1).state.scene,'gameover');
reload.key('Enter');h.key('Enter');assert.equal(h.state.scene,'gameover');assert(h.state.players.every(p=>p.dead),'game over reviveu o time');assert(!reload.transport.sent.some(m=>m.type==='continue-ready'));
const samples=h.transport.sent.filter(m=>m.type==='snapshot'&&m.state.coop).map(m=>Buffer.byteLength(JSON.stringify(m)));
const mean=Math.round(samples.reduce((a,b)=>a+b,0)/samples.length),peak=Math.max(...samples);
assert(mean*20<30000,'banda média excedida: '+mean*20);
console.log('Coop: salas isoladas, seleção, input, câmera, inimigos, segunda forma, autoridade, gato, reconexão e fim sem continuar: OK');
console.log('Snapshots: média '+mean+' bytes; pico '+peak+' bytes; média a 20 Hz '+mean*20+' B/s');
const dense=pair(9,['nutri','duda']);dense.h.stageForTest(9);dense.h.api.jumpToBoss();for(let i=0;i<360;i++){dense.h.tick();dense.g.tick();}assert.equal(dense.h.state.bosses.length,2);dense.h.key('KeyP');dense.h.state.enemies.length=0;dense.h.state.shots.length=0;dense.h.state.eshots.length=0;dense.h.state.parts.length=0;dense.h.api.hazards.length=0;
for(let i=0;i<12;i++)dense.h.api.cardosoTest.spawn(['fome','gordura','fome'][i%3],dense.h.state.cam+80+i*27,180+i*4);
for(let i=0;i<20;i++)dense.h.state.shots.push({x:dense.h.state.cam+75+i*17,y:185+i%5*9,z:25+i,k:'brilho',rot:i*.35,grav:0,owner:dense.h.state.players[i%4],wave:false,life:3,vx:0,vy:0,vz:0,vr:1,hit:[],pierce:20,dmg:0});
dense.h.tick(30);dense.g.tick();
const denseSamples=dense.h.transport.sent.filter(m=>m.type==='snapshot').slice(-8).map(m=>Buffer.byteLength(JSON.stringify(m)));
const denseMean=Math.round(denseSamples.reduce((a,b)=>a+b,0)/denseSamples.length);console.log('Denso (4 jogadores, 12 inimigos, 2 chefes, 20 tiros): média '+denseMean+' bytes; pico '+Math.max(...denseSamples)+' bytes; '+denseMean*20+' B/s');assert((denseMean+40)*20<30000,'banda da onda cheia excedida');dense.g.transport.drop();const denseRoom=relay.rooms.get(dense.h.transport.code);denseRoom.guest.awayAt=Date.now()-60001;relay.expireRooms();assert(relay.rooms.has(dense.h.transport.code),'timeout do convidado encerrou o host');assert(dense.h.state.players[1].ai);dense.h.transport.leave();
const row=relay.scoreBody({name:'DUPLA',modo:'coop',team:['bispo','lucas'],character:'bispo',score:100,stage:1});assert.equal(row.modo,'coop');assert(relay.scoreBody({...row,score:0}),'zero pontos não foi aceito');assert.equal(relay.scoreBody({...row,team:['bispo','bispo']}),null);
h.transport.leave();assert.equal(relay.rooms.size,0);
(async()=>{try{
// Somente o host registra; a saída da sala devolve o convidado ao menu.
for(const victory of [false,true]){
 const end=pair(10,['duda']);const submitted=[];let resolveName;
 end.h.transport.askText=()=>new Promise(resolve=>{resolveName=resolve;});
 end.h.transport.score=row=>{submitted.push(row);return Promise.resolve({ok:true});};
 end.g.transport.score=()=>{throw Error('convidado enviou pontuação duplicada');};
 if(victory){end.h.winForTest();end.h.api.sim(.1,true);end.h.tick(4);end.g.tick();}
 else {end.h.state.players.forEach(p=>{p.dead=true;p.hp=0;});end.h.until(s=>s.scene==='gameover');end.h.tick(4);end.g.tick();}
 assert.equal(end.g.online.snapshots.at(-1).state.scene,victory?'ending':'gameover');
 resolveName('TIME CREIA');for(let i=0;i<8;i++)await Promise.resolve();
 assert.equal(submitted.length,1);assert.equal(submitted[0].name,'TIME CREIA');assert.equal(submitted[0].modo,'coop');assert.equal(submitted[0].team.length,3);
 assert.equal(end.h.state.scene,'ranking');assert.equal(end.g.state.scene,'menu');end.h.key('Enter');assert.equal(end.h.state.scene,'menu');
}
console.log('Coop: morte e vitória registram uma vez por time e encerram a sala para ambos: OK');
const menuHost=client(),menuGuest=client();createAdventureRoom(menuHost);
menuGuest.transport.askText=()=>Promise.resolve(menuHost.transport.code);menuGuest.key('KeyS');menuGuest.key('Enter');menuGuest.key('KeyD');menuGuest.key('KeyS');menuGuest.key('Enter');await Promise.resolve();
assert.equal(menuGuest.state.scene,'onlineSelect');assert.equal(menuGuest.transport.code,menuHost.transport.code);assert.equal(menuGuest.online.host,false);menuHost.transport.leave();
const canceled=client();let answer;canceled.transport.askText=()=>new Promise(resolve=>{answer=resolve;});canceled.key('KeyS');canceled.key('Enter');canceled.key('KeyD');canceled.key('KeyS');canceled.key('Enter');canceled.key('Escape');answer('ABCDE');await Promise.resolve();assert.equal(canceled.state.scene,'menu');assert.equal(canceled.transport.peer,undefined);assert.equal(relay.rooms.size,0);
console.log('Menu aventura: entrar com código e cancelar sem abrir sala: OK');
await relay.loadRanking();await relay.saveScore(row);await relay.loadRanking();const saved=JSON.parse(fs.readFileSync(path.join(dataDir,'ranking.json'),'utf8'));assert.equal(saved[0].team[1],'lucas');assert.equal(saved[0].score,100);assert.equal(relay.getRanking()[0].name,'DUPLA');
fs.writeFileSync(path.join(dataDir,'ranking-coop.json'),JSON.stringify([row]));await relay.loadRanking();await relay.saveScore({...row,name:'SOLO',modo:undefined,score:50});await relay.loadRanking();assert.equal(relay.getRanking().filter(r=>r.name==='DUPLA').length,1,'histórico coop duplicou na união');assert(relay.getRanking().some(r=>r.name==='SOLO'));console.log('Ranking coop: gravação e releitura no ranking geral: OK');}finally{fs.rmSync(dataDir,{recursive:true,force:true});}})().catch(err=>{console.error(err);process.exitCode=1;});
// O mesmo envelope coop percorre DataChannel e fallback, sem criar outro transporte.
(function transportContract(){
  const sockets=[],storage=new Map(),channels=[];
  class Socket{
    static OPEN=1;static CONNECTING=0;
    constructor(){this.readyState=0;this.bufferedAmount=0;this.sent=[];sockets.push(this);}
    send(data){this.sent.push(JSON.parse(data));}
    close(){this.readyState=3;if(this.onclose)this.onclose();}
    open(){this.readyState=1;this.onopen();}
    receive(value){this.onmessage({data:JSON.stringify(value)});}
  }
  class Peer{
    createDataChannel(){const ch={readyState:'open',bufferedAmount:0,sent:[],send(data){this.sent.push(JSON.parse(data));},close(){}};channels.push(ch);return ch;}
    createOffer(){return Promise.resolve({type:'offer'});}
    setLocalDescription(value){this.localDescription=value;return Promise.resolve();}
    close(){}
  }
  const window={addEventListener:noop},env={window,document:{addEventListener:noop},WebSocket:Socket,RTCPeerConnection:Peer,URLSearchParams,
    location:{hostname:'localhost',protocol:'http:',host:'localhost:8765',search:'?sala=ABCDE&modo=coop'},performance:{now:()=>0},
    sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:()=>1,clearTimeout:noop};
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/online.js'),'utf8'),env);
  const api=window.BanguOnline,received=[];api.onMessage=msg=>received.push(msg);
  api.createCoop();sockets[0].open();assert.equal(sockets[0].sent[0].mode,'coop');
  sockets[0].receive({type:'created',mode:'coop',code:'ABCDE',token:'a'.repeat(64)});assert.equal(JSON.parse(storage.get('bangu-online-room')).mode,'coop');
  sockets[0].receive({type:'peer'});channels[0].onopen();assert(api.isP2P);
  const packet={type:'snapshot',state:{coop:1,matchId:1,seq:1,data:'AA=='}};
  assert(api.send(packet));assert.equal(channels[0].sent.at(-1).state.data,'AA==');
  channels[0].bufferedAmount=1;assert.equal(api.send(packet),false);channels[0].bufferedAmount=0;
  channels[0].onmessage({data:JSON.stringify({type:'input',input:{seq:1,matchId:1,x:1,y:0}})});assert.equal(received.at(-1).input.seq,1);
  channels[0].onerror();assert(api.send(packet));assert.equal(sockets[0].sent.at(-1).state.data,'AA==');
  api.joinCoop(' abcde ');sockets[1].open();assert.equal(sockets[1].sent[0].mode,'coop');assert.equal(sockets[1].sent[0].code,'ABCDE');
  assert.equal(api.pendingMode,'coop');api.leave();
  console.log('Transporte coop: criação/entrada, credenciais, DataChannel, backpressure e fallback: OK (RTC simulado)');
})();
