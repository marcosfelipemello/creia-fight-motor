'use strict';
// Rajadas TCP e conexão de saída lenta, sem abrir portas.
const assert=require('node:assert/strict');
const relay=require('../server/index.js');
function client() {
  const messages=[];
  const socket={destroyed:false,writableLength:0,write(frame) {
    if ((frame[0]&15)!==1) return true;
    const offset=(frame[1]&127)===126?4:2;
    messages.push(JSON.parse(frame.subarray(offset).toString()));return true;
  },end(){this.destroyed=true;}};
  return {messages,peer:{socket,buffer:Buffer.alloc(0),closed:false,rateTime:0,rateCount:0}};
}
function frame(msg) {
  const data=Buffer.from(JSON.stringify(msg)),mask=Buffer.from([1,2,3,4]);
  const header=data.length<126?Buffer.from([0x81,0x80|data.length]):Buffer.from([0x81,0xfe,data.length>>8,data.length&255]);
  return Buffer.concat([header,mask,Buffer.from(data.map((b,i)=>b^mask[i&3]))]);
}
async function main() {
  const host=client(),guest=client();
  relay.message(host.peer,{type:'create'});
  relay.message(guest.peer,{type:'join',code:host.messages[0].code});
  const snapshot=n=>({type:'snapshot',state:{time:n,padding:'x'.repeat(6000)}});
  // TCP pode juntar várias mensagens válidas num único evento data.
  const batch=Buffer.concat([frame(snapshot(1)),frame(snapshot(2)),frame(snapshot(3))]);
  relay.receive(host.peer,batch.subarray(0,batch.length-500));
  assert.equal(host.peer.closed,false,'rajada de snapshots válidos desconectou o anfitrião');
  relay.receive(host.peer,batch.subarray(batch.length-500));
  assert.deepEqual(guest.messages.filter(m=>m.type==='snapshot').map(m=>m.state.time),[1,2,3]);
  // Enquanto o socket não escoa, conservar somente o estado mais novo.
  guest.peer.socket.writableLength=1000;
  const count=guest.messages.length;
  for(let i=4;i<=80;i++)relay.message(host.peer,snapshot(i));
  assert.equal(guest.messages.length,count,'relay enfileirou estados antigos na conexão lenta');
  guest.peer.socket.writableLength=0;
  await new Promise(r=>setTimeout(r,30));
  assert.equal(guest.messages.length,count+1);
  assert.equal(guest.messages.at(-1).state.time,80);
  host.peer.socket.writableLength=1000;
  const inputs=host.messages.length;
  relay.message(guest.peer,{type:'input',input:{seq:1,x:-1,y:0,jump:true}});
  relay.message(guest.peer,{type:'input',input:{seq:2,x:0,y:-1}});
  relay.message(guest.peer,{type:'input',input:{seq:3,x:0,y:0}});
  assert.equal(host.messages.length,inputs,'relay acumulou direções na conexão lenta');
  host.peer.socket.writableLength=0;
  await new Promise(r=>setTimeout(r,30));
  assert.equal(host.messages.length,inputs+1);
  assert.equal(host.messages.at(-1).input.seq,3);
  assert.equal(host.messages.at(-1).input.x,0);
  assert.equal(host.messages.at(-1).input.y,0);
  assert.equal(host.messages.at(-1).input.jump,true,'ação pendente foi perdida');
  host.peer.socket.writableLength=1000;
  relay.message(guest.peer,{type:'input',input:{seq:4,x:1,y:0}});
  relay.close(guest.peer);
  host.peer.socket.writableLength=0;
  await new Promise(r=>setTimeout(r,30));
  assert.equal(host.messages.filter(m=>m.type==='input').at(-1).input.seq,3,
    'comando antigo foi entregue depois da desconexão do visitante');
  // Um frame individual acima do limite continua sendo recusado.
  relay.receive(host.peer,frame({type:'snapshot',state:{padding:'x'.repeat(9000)}}));
  assert.equal(host.peer.closed,true,'limite de mensagem deixou de ser aplicado');
  relay.message(host.peer,{type:'leave'});
  console.log('Rajadas TCP, frame parcial, fila com estado mais novo e limite por mensagem: OK');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
