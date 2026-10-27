// Troca de aplicativo, perda de socket e recriação da página usando o transporte real.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const relay=require('../server/index');
const source=fs.readFileSync(path.join(__dirname,'../js/online.js'),'utf8');
const realNow=Date.now;let now=1700000000000;Date.now=()=>now;
const storage=map=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});
function browser(session=new Map(),local=new Map()){
 const events={},sockets=[],messages=[],timers=new Map();let id=0;
 class WS{
  static OPEN=1;static CONNECTING=0;
  constructor(){this.readyState=0;this.sent=[];sockets.push(this);this.peer={closed:false,room:null,role:null,socket:{destroyed:false,writableLength:0,write:frame=>{
   if((frame[0]&15)!==1)return;
   const msg=JSON.parse(frame.subarray((frame[1]&127)===126?4:2).toString());
   this.onmessage({data:JSON.stringify(msg)});
  },end:()=>{this.readyState=3;}}};}
  open(){this.readyState=1;this.onopen();}
  send(raw){const msg=JSON.parse(raw);this.sent.push(msg);relay.message(this.peer,msg);}
  close(){this.readyState=3;relay.close(this.peer);if(this.onclose)this.onclose();}
 }
 const document={hidden:false,addEventListener:(n,f)=>events[n]=f};
 const window={addEventListener:(n,f)=>events[n]=f};
 const env={window,document,WebSocket:WS,URLSearchParams,Date,performance:{now:()=>now},location:{hostname:'localhost',protocol:'http:',host:'localhost',search:''},
  sessionStorage:storage(session),localStorage:storage(local),setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:k=>timers.delete(k)};
 vm.runInNewContext(source,env);window.BanguOnline.onMessage=m=>messages.push(m);
 return {api:window.BanguOnline,events,document,session,local,sockets,messages,last:()=>messages.at(-1),open:()=>sockets.at(-1).open(),timers};
}
try{
 for(const mode of ['x1','coop']){
  let h=browser();h.api[mode==='coop'?'createCoop':'create']();h.open();
  const created=h.last(),code=created.code,token=created.token;
  h.document.hidden=true;h.events.visibilitychange();h.events.freeze();h.events.pagehide();
  assert(!h.sockets[0].sent.some(m=>m.type==='leave'));assert.equal(h.timers.size,0);
  now+=90000;
  const g=browser();g.api[mode==='coop'?'joinCoop':'join'](code);g.open();
  assert.equal(g.messages[0].type,'joined');assert.equal(g.last().type,'away');
  now+=90000;relay.expireRooms();assert(relay.rooms.has(code));
  // Mesmo sessionStorage após descarte/reload.
  h=browser(h.session,h.local);assert(h.api.restore());h.open();
  const resumed=h.messages.find(m=>m.type==='resumed');
  assert.equal(resumed.code,code);assert.equal(resumed.token,token);assert.equal(resumed.peerReady,true);assert.equal(resumed.mode,mode);assert.equal(g.last().type,'back');
  // Convidado retoma mesmo quando a sessão da página foi recriada.
  g.events.pagehide();now+=180000;
  const back=browser(new Map(),g.local);assert(back.api.restore());back.open();assert.equal(back.last().role,'guest');
  assert.equal(back.last().code,code);assert.equal(back.last().token,g.messages[0].token);
  // Retorno sem reload também conserva código e token.
  h.document.hidden=true;h.events.visibilitychange();now+=180000;h.document.hidden=false;h.events.visibilitychange();h.open();assert.equal(h.messages.findLast(m=>m.type==='resumed').code,code);
  // A tolerância também vale depois de iniciar, nos dois modos.
  h.api.send({type:'choice',who:'nutri'});back.api.send({type:'choice',who:'lutador'});
  h.api.send({type:'start',mode,stage:1,team:['nutri','lutador']});
  back.events.pagehide();now+=180000;relay.expireRooms();assert(relay.rooms.has(code));
  back.events.pageshow();back.open();assert.equal(back.last().started,true);
  h.document.hidden=true;h.events.visibilitychange();now+=180000;relay.expireRooms();assert(relay.rooms.has(code));
  h.document.hidden=false;h.events.visibilitychange();h.open();assert(h.messages.findLast(m=>m.type==='resumed').started);
  back.api.leave();assert.equal(back.local.size,0);assert.equal(back.session.size,0);h.api.leave();assert(!relay.rooms.has(code));
  assert(!browser(back.session,back.local).api.restore(),'CANCELAR restaurou credenciais apagadas');
 }
 // CANCELAR com o socket já suspenso comunica a saída ao voltar a rede.
 const cancel=browser();cancel.api.create();cancel.open();const canceled=cancel.last().code;
 cancel.events.pagehide();cancel.api.leave();assert.equal(cancel.session.size,0);cancel.open();
 assert(!relay.rooms.has(canceled));assert.equal(cancel.timers.size,0);
 // Recuperação persistente antiga não deve abrir uma sala esquecida.
 const stale=new Map([['bangu-online-room',JSON.stringify({code:'ABCDE',token:'a'.repeat(64),role:'host',savedAt:now-195001})]]);
 assert(!browser(new Map(),stale).api.restore());
 console.log('X1 e Aventura: 3 min fora, parceiro entra durante ausência, reload, sessão recriada, retomada e cancelamento: OK');
}finally{
 Date.now=realNow;
 for(const room of relay.rooms.values())relay.expireRooms(room.createdAt+7200001);
}
