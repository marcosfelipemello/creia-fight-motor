// Retomada da seleção até o início da luta nos dois modos, com o harness de integração existente.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const relay=require('../server/index');
let harness=fs.readFileSync(path.join(__dirname,'coop-online.js'),'utf8').split('function createAdventureRoom')[0];
harness=harness.replace('function client() {','function client(saved) {')
 .replace('  const env = {console,Math,Date,','  if(saved){transport.code=saved.code;transport.token=saved.token;transport.restore=()=>true;}\n  const env = {console,Math,Date,')
 .replace('  return {\n    transport, textSeen,','  if(saved)transport.resume();\n  return {\n    transport, textSeen,');
const {client,dataDir}=new Function('require','__dirname',harness+'\nreturn {client,dataDir};')(require,__dirname);

try{
 for(const mode of ['x1','coop']){
  let h=client();h.transport[mode==='coop'?'createCoop':'create']();
  const saved={code:h.transport.code,token:h.transport.token};h.transport.drop();
  const g=client();g.transport[mode==='coop'?'joinCoop':'join'](saved.code);g.key('KeyD');g.key('Enter');
  h=client(saved);h.tick();assert.equal(h.online.code,saved.code);assert(h.online.host&&h.online.peerReady);assert.equal(h.online.coop,mode==='coop');assert(h.online.other);
  h.key('Enter');h.tick();
  if(mode==='coop'){assert.equal(h.state.scene,'coopSetup');h.commands.coop('start');h.tick(3);}
  assert.equal(h.state.scene,'play');g.tick();assert.equal(g.state.scene,'onlinePlay');
  const guest={code:g.transport.code,token:g.transport.token};g.transport.drop();const resumed=client(guest);resumed.tick();assert.equal(resumed.state.scene,'onlinePlay');assert.equal(resumed.online.code,saved.code);
  h.transport.leave();
 }
 // X / Quadrado aciona o mesmo sorteio no controle, inclusive na seleção vazia.
 const t=client();t.tick();t.commands.x1Opt('torneio',3);t.commands.x1Go(4);t.tick();t.pad(2);
 assert.equal(t.uiState.selection.team.length,16);assert.equal(new Set(t.uiState.selection.team.map(m=>m.who)).size,16);
 console.log('Motor: anfitrião recarregado na espera, escolha do parceiro, início e convidado recarregado nos dois modos; sorteio no controle: OK');
}finally{for(const room of relay.rooms.values())relay.expireRooms(room.createdAt+7200001);fs.rmSync(dataDir,{recursive:true,force:true});}
