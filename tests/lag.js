// Mede o X1 com 80–150 ms por sentido e rajadas por atraso de retransmissão.
// Uso: node tests/lag.js; LAG_FPS=30 node tests/lag.js; LAG_TRANSPORT=reordered node tests/lag.js
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const relay=require('../server/index.js');
const root=path.resolve(__dirname,'..');
const scripts=['sprites','backgrounds','bosses','viloes','cenarios-arte','criancas','bichos','objetos','rig','combate-config','ia-tatica','hud-combate','game'];
const noop=()=>{};
let clock=0,serial=0,frameNumber=0,queue=[],inputStallUntil=0,spiky=false;
const ordered=process.env.LAG_TRANSPORT!=='reordered';
const frameMs=1000/Number(process.env.LAG_FPS||60),lastDelivery={};
const latency=()=>(spiky?[100,400,250,95,500]:[80,110,150,95,135])[serial++%5];
function schedule(fn,channel,stall=0) {
  let at=clock+latency()+stall;
  if(channel==='input') at=Math.max(at,inputStallUntil);
  // WebSocket/TCP entrega em ordem; uma perda atrasa também os pacotes seguintes.
  if(ordered) at=Math.max(at,lastDelivery[channel]||0);
  lastDelivery[channel]=at;queue.push({at,fn});
}
function pump() {
  const due=queue.filter(q=>q.at<=clock);queue=queue.filter(q=>q.at>clock);
  for(const q of due) q.fn();
}
function client() {
  const events={},received=[],sent=[];let nextFrame,peer,snapshotCount=0;
  const ctx=new Proxy({}, {get(_,key) {
    if(key==='measureText') return s=>({width:String(s).length*8});
    if(key==='createLinearGradient'||key==='createRadialGradient') return ()=>({addColorStop:noop});
    return noop;
  },set:()=>true});
  const canvas=()=>({width:480,height:270,getContext:()=>ctx,getBoundingClientRect:()=>({width:480,height:270})});
  function socketPeer() {return {room:null,closed:false,buffer:Buffer.alloc(0),rateTime:0,rateCount:0,lastSeen:Date.now(),
    socket:{destroyed:false,writableLength:0,write(frame) {
      const offset=(frame[1]&127)===126?4:2,msg=JSON.parse(frame.subarray(offset).toString('utf8'));
      const deliver=()=>{received.push(msg);if(msg.type==='created')transport.code=msg.code;transport.onMessage(msg);};
      if(msg.type==='snapshot') {snapshotCount++;schedule(deliver,'snapshots',snapshotCount%23===0?100:0);}
      else deliver();
    },end(){this.destroyed=true;}}};}
  const transport={onMessage:null,pendingCode:null,received,sent,code:null,blocked:false,
    create(){peer=socketPeer();relay.message(peer,{type:'create'});},
    join(code){peer=socketPeer();relay.message(peer,{type:'join',code});},
    send(msg){if(!peer||peer.closed||(transport.blocked&&msg.type==='input'))return false;sent.push(msg);
      if(msg.type==='input') schedule(()=>{if(!peer.closed)relay.message(peer,msg);},'input');
      else relay.message(peer,msg);return true;},
    leave(){const current=peer;peer=null;if(current&&!current.closed){relay.message(current,{type:'leave'});relay.close(current);}},
    showLink:noop,hideOverlay:noop,askText:()=>Promise.resolve(null),ranking:()=>Promise.resolve({ranking:[]}),score:()=>Promise.resolve({ok:true})};
  const env={console,Math,Date,TextEncoder,URLSearchParams,performance:{now:()=>clock},
    location:{search:'',hostname:'127.0.0.1'},navigator:{maxTouchPoints:0},devicePixelRatio:1,
    Image:class{set src(v){this.complete=true;this.naturalWidth=100;}},
    localStorage:{getItem:()=>JSON.stringify({tut:true,best:10}),setItem:noop},
    document:{getElementById:canvas,createElement:canvas,head:{appendChild:noop},body:{appendChild:noop}},
    addEventListener:(name,fn)=>{events[name]=fn;},requestAnimationFrame:fn=>{nextFrame=fn;},
    setTimeout,clearTimeout,BanguOnline:transport};
  env.window=env;vm.createContext(env);
  for(const name of scripts)vm.runInContext(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'),env,{filename:name+'.js'});
  return {transport,events,frame:()=>nextFrame(clock),get state(){return env.__bangu.state;},get online(){return env.__bangu.online;}};
}
const host=client(),guest=client();
function step(){clock+=process.env.LAG_JITTER?[10,23,14,20][frameNumber++%4]:frameMs;pump();host.frame();guest.frame();pump();}
function key(c,code){c.events.keydown({code,preventDefault:noop});step();c.events.keyup({code});}
key(host,'Enter');key(host,'KeyD');key(host,'KeyD');key(host,'KeyD');key(host,'Enter');
guest.transport.join(host.transport.code);
key(host,'Enter');key(guest,'KeyD');key(guest,'Enter');
for(let i=0;i<240&&(!host.state.round||host.state.round.phase!=='fight');i++)step();
assert.equal(host.state.round.phase,'fight');
for(let i=0;i<Math.ceil(450/frameMs);i++)step();
assert(guest.online.renderOwn,'visitante não desenhou o lutador');
// Uma pausa no envio seguida de ACKs atrasados não pode fazer o boneco
// atravessar o ponto correto repetidamente depois de soltar A-W-D.
spiky=true;inputStallUntil=clock+1000;
for(const [code,ms] of [['KeyA',400],['KeyW',200],['KeyD',200]]) {
  guest.events.keydown({code,preventDefault:noop});
  for(let until=clock+ms;clock<until;)step();
  guest.events.keyup({code});
}
const stopped={...guest.online.renderOwn};
let overshoot=0;
for(let until=clock+4500;clock<until;) {
  step();
  const own=guest.online.renderOwn,auth=host.state.players[1];
  overshoot=Math.max(overshoot,own.x-Math.max(stopped.x,auth.x),Math.min(stopped.x,auth.x)-own.x,
    own.y-Math.max(stopped.y,auth.y),Math.min(stopped.y,auth.y)-own.y);
}
assert(overshoot<8,'confirmações atrasadas repetiram o movimento: ultrapassou '+overshoot.toFixed(1)+' px');
assert(Math.abs(guest.online.renderOwn.x-host.state.players[1].x)<7,'posição não convergiu após atraso');
console.log('A-W-D com interrupção de 1 s: excesso de correção '+overshoot.toFixed(2)+' px; posição convergiu.');
spiky=false;
for(let until=clock+600;clock<until;)step();
const start=guest.online.renderOwn.x;
const direction=start>host.state.cam+240?'KeyA':'KeyD';
const measureStart=clock,packetStart=host.transport.sent.filter(m=>m.type==='snapshot').length,inputSeqStart=guest.online.nextSeq;
guest.events.keydown({code:direction,preventDefault:noop});
let response=null,commandDelay=null,maxJump=0,last=start,position=[];
for(let i=0;i<75;i++) {
  step();const x=guest.online.renderOwn.x;
  position.push(x);maxJump=Math.max(maxJump,Math.abs(x-last));
  if(response===null&&Math.abs(x-start)>=0.5)response=clock-measureStart;
  if(commandDelay===null&&guest.online.nextSeq>inputSeqStart)commandDelay=clock-measureStart;
  last=x;
}
guest.events.keyup({code:direction});
const measuredPackets=host.transport.sent.filter(m=>m.type==='snapshot').length-packetStart;
const rate=measuredPackets/((clock-measureStart)/1000);
assert(response!==null&&response<50,'resposta local demorou '+response+' ms');
assert(commandDelay!==null&&commandDelay<50,'mudança de direção demorou '+commandDelay+' ms para sair');
assert(maxJump<=8,'salto visual de '+maxJump.toFixed(2)+' px/quadro');
const hostDirection=host.state.players[0].x>host.state.cam+240?'KeyA':'KeyD';
host.events.keydown({code:hostDirection,preventDefault:noop});
let otherJump=0,otherLast=guest.online.renderOther.x,backwards=0;
for(let i=0;i<75;i++) {
  step();const x=guest.online.renderOther.x;
  if((x-otherLast)*(hostDirection==='KeyD'?1:-1)<-0.01) backwards++;
  otherJump=Math.max(otherJump,Math.abs(x-otherLast));otherLast=x;
}
host.events.keyup({code:hostDirection});
assert.equal(backwards,0,'adversário recuou apesar do comando contínuo');
assert(otherJump<=8,'adversário saltou '+otherJump.toFixed(2)+' px/quadro');
for(let i=0;i<Math.ceil(600/frameMs);i++)step();
assert(Math.abs(guest.online.renderOther.x-host.state.players[0].x)<2,'adversário não estabilizou ao parar');
const reverse=hostDirection==='KeyA'?'KeyD':'KeyA';
host.events.keydown({code:reverse,preventDefault:noop});
const reverseStart=guest.online.renderOther.x;
for(let i=0;i<Math.ceil(600/frameMs);i++)step();
host.events.keyup({code:reverse});
assert((guest.online.renderOther.x-reverseStart)*(reverse==='KeyD'?1:-1)>10,'mudança de direção não chegou ao visitante');
for(let i=0;i<Math.ceil(600/frameMs);i++)step();
key(guest,'KeyJ');
assert(['attack1','throw'].includes(guest.online.renderOwn.state),'ataque não reagiu no primeiro quadro');
for(let i=0;i<Math.ceil(450/frameMs);i++)step();
key(guest,'KeyK');
assert(guest.online.renderOwn.z>0,'pulo não reagiu no primeiro quadro');
assert.equal(guest.state.players.length,0,'visitante executou a simulação autoritativa');
const packets=host.transport.sent.filter(m=>m.type==='snapshot');
const bytes=packets.map(m=>Buffer.byteLength(JSON.stringify(m)));
assert(rate>25&&rate<32,'frequência de snapshots fora de 30/s: '+rate.toFixed(1));
assert(Math.max(...bytes)<7000,'snapshot excedeu limite de tamanho');
const beforeSlowFrame=packets.length;
clock+=500;pump();host.frame();guest.frame();pump();
assert(host.transport.sent.filter(m=>m.type==='snapshot').length-beforeSlowFrame<=1,
  'aba lenta acumulou snapshots');
const accepted=guest.online.snapshots.at(-1).state;
const stale=structuredClone(accepted);stale.time-=1;stale.players[1].x+=100;stale.players[1].state='hurt';
guest.transport.onMessage({type:'snapshot',state:stale});
assert.equal(guest.online.snapshots.at(-1).state,accepted,'snapshot atrasado substituiu o estado atual');
const resumed=structuredClone(guest.online.snapshots.at(-1).state);
resumed.players[1].state='hurt';
guest.transport.onMessage({type:'snapshot',state:resumed});guest.frame();
assert.equal(guest.online.renderOwn.state,'hurt','dano do anfitrião não apareceu');
resumed.players[1].state='idle';resumed.time+=0.033;
guest.transport.onMessage({type:'snapshot',state:resumed});guest.frame();
assert.equal(guest.online.renderOwn.state,'idle','animação de dano ficou presa');
guest.transport.blocked=true;
const blockedStart=guest.transport.sent.length;
key(guest,'KeyL');
for(let i=0;i<Math.ceil(100/frameMs);i++)step();
assert.equal(guest.transport.sent.length,blockedStart,'envio não respeitou congestionamento');
guest.transport.blocked=false;
for(let i=0;i<Math.ceil(150/frameMs);i++)step();
assert.equal(guest.transport.sent.slice(blockedStart).filter(m=>m.type==='input'&&m.input.spc).length,1,
  'botão pendente foi perdido ou duplicado após congestionamento');
console.log('Rede '+(ordered?'ordenada':'reordenada')+', '+Math.round(1000/frameMs)+' FPS: resposta '+response.toFixed(1)+' ms; maior salto próprio '+maxJump.toFixed(2)+
  ' px/quadro, adversário '+otherJump.toFixed(2)+' px/quadro.');
console.log('Recuos involuntários: '+backwards+'; envio de direção: '+commandDelay.toFixed(1)+' ms; parada e inversão: OK.');
console.log('Snapshots: '+rate.toFixed(1)+'/s, média '+Math.round(bytes.reduce((a,b)=>a+b,0)/bytes.length)+' bytes, pico '+Math.max(...bytes)+' bytes.');
host.transport.leave();
