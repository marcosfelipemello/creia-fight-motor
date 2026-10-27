'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let harness=fs.readFileSync(path.join(__dirname,'cardoso.js'),'utf8').split('const c=client();')[0];
harness=harness.replace('return {api:env.__bangu,textSeen,','return {env,api:env.__bangu,textSeen,hold(code,n){events.keydown({code,preventDefault:noop});this.tick(n);events.keyup({code});},');
const read=fs.readFileSync.bind(fs),gameFile=path.resolve(__dirname,'../js/game.js'),configFile=path.resolve(__dirname,'../js/combate-config.js');
fs.readFileSync=function(file,...args){
 const source=read(file,...args),abs=path.resolve(String(file));
 // Teste de mecânica: neutraliza multiplicador de equilíbrio de dano do X1
 if(abs===configFile)return source.replace('api.resistenciaX1={','api.resistenciaX1Off={');
 return abs===gameFile?source.replace('  window.__bangu = {',`  window.__horizontal={predict:predictGuest,online:function(o){online=o;}};\n  window.__bangu = {`):source;
};
try{
 const client=new Function('require','__dirname',harness+'\nreturn client;')(require,__dirname);
 function duel(facing=1){const g=client();g.api.startTeam([{who:'lutador',ctl:0},{who:'duda',ctl:1}],false,true);g.until(()=>g.api.state.round.phase==='fight',150);const p=g.api.state.players[0],q=g.api.state.players[1];p.x=g.api.state.cam+(facing>0?100:380);p.facing=facing;q.x=p.x+facing*130;q.facing=-facing;p.y=q.y=215;q.inv=0;q.shield=0;return g;}
 const horizontal=duel(),p=horizontal.api.state.players[0],q=horizontal.api.state.players[1];
 horizontal.hold('KeyW',30);horizontal.hold('KeyS',30);horizontal.hold('ArrowUp',30);horizontal.hold('ArrowDown',30);assert.equal(p.y,215);assert.equal(q.y,215);const x=p.x;horizontal.hold('KeyD',12);assert(p.x>x);horizontal.key('KeyK');assert(p.z>0);assert.equal(p.y,215,'pulo alterou a linha da arena');
 const adventure=client();adventure.api.startTeam([{who:'lutador',ctl:0}],false,false);const a=adventure.api.state.players[0],y=a.y;adventure.hold('KeyW',20);assert(a.y<y,'aventura perdeu a movimentação vertical');
 const ai=client();ai.api.startTeam([{who:'lutador',ctl:null},{who:'duda',ctl:null}],false,true);ai.until(()=>ai.api.state.round.phase==='fight',150);ai.tick(120);assert(ai.api.state.players.every(p=>p.y===215));
 // Dano primário e halter realmente menores na campanha.
 {
  const g=client();g.api.startTeam([{who:'lutador',ctl:0}],false,false);g.api.state.enemies.length=0;const p=g.api.state.players[0];p.x=80;p.y=215;
  const e=g.api.cardosoTest.spawn('fome',p.x+30,p.y);e.hp=200;e.stun=999;e.kx=0;g.key('KeyJ');g.tick(8);assert(Math.abs(e.hp-188.8)<1e-6,'soco não teve redução real de 20%');
  p.state='idle';p.altCd=0;e.x=p.x+130;e.kx=0;e.hp=200;e.stun=999;g.key('KeyI');g.until(()=>g.api.state.shots.some(s=>s.k==='halter'),30);assert.equal(g.api.state.shots.find(s=>s.k==='halter').dmg,16);g.until(()=>e.hp<200,80);assert.equal(e.hp,184);assert(e.kx<0,'halter empurrou inimigo em vez de puxar');
 }
 // Puxa nas duas direções, sem ultrapassar o lançador.
 for(const facing of [1,-1]){
  const g=duel(facing),p=g.api.state.players[0],q=g.api.state.players[1],before=Math.abs(q.x-p.x);g.key('KeyI');g.until(()=>q.hp<100,80);assert.equal(q.hp,96);assert(q.kx*facing<0,'halter não puxou em direção ao dono');g.tick(30);const after=Math.abs(q.x-p.x);assert(after<before-10&&after>=38,'puxão incorreto: '+before+' -> '+after);
 }
 {
  const g=duel(),q=g.api.state.players[1],before=q.x;g.key('KeyI');g.hold('Quote',65);assert.equal(q.hp,100,'halter ignorou defesa');assert(q.x>=before-1,'halter puxou através da defesa');
 }
 // O visitante não prevê deslocamento vertical nem perde o pulo.
 {
  const g=client(),test=g.env.__horizontal,state={cam:0,players:[{x:400,y:215},{who:'lutador',x:100,y:215,z:0,vz:0,state:'idle',st:0,facing:1}],round:{phase:'fight'}},online={pred:{x:100,y:215,z:0,vz:0,state:'idle',st:0,cd:0,actionT:0,facing:1,corrX:0,corrY:10},sentInputs:[]};test.online(online);for(let i=0;i<60;i++)test.predict({x:1,y:i<30?-1:1},1/60,state);assert.equal(online.pred.y,215);assert(online.pred.x>100);test.predict({x:0,y:-1,jump:true},1/60,state);assert(online.pred.z>0);assert.equal(online.pred.y,215);test.online(null);
 }
 console.log('X1 horizontal local/IA/visitante, aventura livre, pulo, dano reduzido e halter puxando nas duas direções/defendido: OK');
}finally{fs.readFileSync=read;}
