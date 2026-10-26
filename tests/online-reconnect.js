// Exercita sessionStorage e retomada automática do transporte no navegador simulado.
// Uso: node tests/online-reconnect.js
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const sockets=[],events={},storage=new Map(),timers=new Map();
let nextTimer=0,clock=0;
class WebSocket {
  static CONNECTING=0;static OPEN=1;static CLOSED=3;
  constructor(url) { this.url=url;this.readyState=0;this.sent=[];sockets.push(this); }
  send(data) { this.sent.push(JSON.parse(data)); }
  close() { this.readyState=3;if(this.onclose)this.onclose(); }
  open() { this.readyState=1;this.onopen(); }
  receive(msg) { this.onmessage({data:JSON.stringify(msg)}); }
}
const doc={hidden:false,addEventListener:(name,fn)=>{events[name]=fn;}};
const win={addEventListener:(name,fn)=>{events[name]=fn;}};
const env={window:win,document:doc,WebSocket,URLSearchParams,performance:{now:()=>clock},
  location:{hostname:'127.0.0.1',search:'',protocol:'http:',host:'127.0.0.1:8765'},
  sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  setTimeout:(fn)=>{const id=++nextTimer;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),
  fetch:()=>Promise.reject(Error('unused'))};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/online.js'),'utf8'),env);
const api=win.BanguOnline,received=[];
api.onMessage=msg=>received.push(msg);
api.create();sockets[0].open();
assert.equal(sockets[0].sent[0].type,'create');
const token='a'.repeat(64),code='ABCDE';
sockets[0].receive({type:'created',code,token});
assert.equal(JSON.parse(storage.get('bangu-online-room')).role,'host');
sockets[0].close();
assert.equal(received.at(-1).type,'reconnecting');
assert.equal(timers.size,1);
const retry=timers.values().next().value;timers.clear();retry();
sockets[1].open();
assert.equal(sockets[1].sent[0].type,'resume');
assert.equal(sockets[1].sent[0].token,token);
sockets[1].receive({type:'resumed',code,token,role:'host',peerReady:false});
assert.equal(received.at(-1).type,'resumed');
events.visibilitychange();
assert.equal(sockets.length,3,'volta ao primeiro plano não abriu nova conexão');
sockets[2].open();
assert.equal(sockets[2].sent[0].type,'resume');
sockets[2].receive({type:'resumed',code,token,role:'host'});
sockets[2].close();
events.pageshow();
assert.equal(sockets.length,4,'pageshow não antecipou a reconexão');
sockets[3].open();
assert.equal(sockets[3].sent[0].type,'resume');
sockets[3].receive({type:'resumed',code,token,role:'host'});
const beforeCongestion=sockets[3].sent.length;
sockets[3].bufferedAmount=9000;
assert.equal(api.send({type:'snapshot',state:{time:1}}),false,'snapshot antigo entrou na fila congestionada');
assert.equal(api.send({type:'input',input:{x:1,y:0}}),false,'comando entrou na fila congestionada');
assert.equal(sockets[3].sent.length,beforeCongestion);
sockets[3].bufferedAmount=1;
assert.equal(api.send({type:'input',input:{x:1,y:0}}),false,'comando acumulou antes de escoar o envio anterior');
sockets[3].bufferedAmount=0;
assert.equal(api.send({type:'input',input:{x:0,y:0}}),true,'envio não retomou quando a fila esvaziou');
sockets[3].receive({type:'peer'});api.tick(clock);
const probe=sockets[3].sent.at(-1);assert.equal(probe.type,'net-probe');
clock=84;sockets[3].receive({type:'net-pong',id:probe.id});
assert.equal(api.metrics().rtt,84);assert.equal(api.metrics().quality,'Boa');assert.equal(api.metrics().route,'Servidor');
clock=2100;api.tick(clock);clock=6201;api.tick(clock);assert(api.metrics().loss>0,'sonda perdida não foi contada');
api.leave();
assert.equal(api.metrics().rtt,null,'nova sala herdou RTT da anterior');
assert.equal(sockets[3].sent.at(-1).type,'leave');
assert.equal(storage.size,0,'sala ficou gravada após SAIR');
assert.equal(timers.size,0,'tentativas continuaram após SAIR');
console.log('Credenciais, retomada, visibilidade, pageshow e saída voluntária: OK');
