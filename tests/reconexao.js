// Protocolo de reconexão com sockets simulados, sem depender de porta TCP.
// Uso: node tests/reconexao.js
'use strict';
const assert=require('node:assert/strict');
const relay=require('../server/index.js');
const originalNow=Date.now;
let now=1700000000000;
Date.now=()=>now;

function client() {
  const messages=[];
  const socket={destroyed:false,writableLength:0,
    write(frame) {
      if ((frame[0]&15)!==1) return;
      const offset=(frame[1]&127)===126 ? 4 : 2;
      messages.push(JSON.parse(frame.subarray(offset).toString('utf8')));
    },
    end() { this.destroyed=true; }
  };
  const peer={socket,buffer:Buffer.alloc(0),room:null,role:null,lastSeen:now,rateTime:0,rateCount:0,closed:false};
  return {peer,messages,last(type) { return messages.filter(m=>m.type===type).at(-1); },
    send(msg) { relay.message(peer,msg); }, drop() { relay.close(peer); }};
}

try {
  const host=client();host.send({type:'create'});
  const created=host.last('created');
  assert.match(created.code,/^[A-Z2-9]{5}$/);
  assert.match(created.token,/^[0-9a-f]{64}$/);
  host.drop();
  now+=20000;
  assert.equal(relay.rooms.has(created.code),true,'sala sumiu após 20 s sem dono');
  const guest=client();guest.send({type:'join',code:created.code});
  assert(guest.last('joined').token && guest.last('away'));
  const wrong=client();wrong.send({type:'resume',code:created.code,token:'0'.repeat(64)});
  assert.equal(wrong.last('error').message,'SALA INDISPONÍVEL');
  assert.equal(wrong.peer.room,null,'token errado ocupou a sala');
  const resumedHost=client();resumedHost.send({type:'resume',code:created.code,token:created.token});
  assert.equal(resumedHost.last('resumed').role,'host');
  assert(guest.last('back'),'convidado não soube que dono voltou');
  resumedHost.send({type:'choice',who:'nutri'});
  guest.send({type:'choice',who:'lutador'});
  resumedHost.send({type:'start',team:['nutri','lutador']});
  assert.deepEqual(guest.last('start').team,['nutri','lutador']);
  guest.drop();
  assert(resumedHost.last('away'),'dono não soube que convidado caiu');
  now+=10000;
  const resumedGuest=client();resumedGuest.send({type:'resume',code:created.code,token:guest.last('joined').token});
  assert.equal(resumedGuest.last('resumed').role,'guest');
  assert.equal(resumedGuest.last('resumed').started,true);
  assert(resumedHost.last('back'),'dono não soube que convidado voltou');
  resumedGuest.drop();
  now+=60000;
  relay.expireRooms(now);
  assert.equal(relay.rooms.has(created.code),false,'sala de luta não expirou em 60 s');
  assert(resumedHost.last('left'),'dono não foi avisado do prazo esgotado');

  const alone=client();alone.send({type:'create'});
  const code=alone.last('created').code;alone.drop();
  now+=179999;relay.expireRooms(now);
  assert.equal(relay.rooms.has(code),true);
  now++;relay.expireRooms(now);
  assert.equal(relay.rooms.has(code),false,'sala vazia não expirou em 3 min');
  console.log('Token, retomada após 20 s e 10 s, avisos e prazos: OK');
} finally {
  Date.now=originalNow;
  for (const room of relay.rooms.values()) relay.expireRooms(room.createdAt+2*60*60*1000+1);
}
