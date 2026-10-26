'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs);
// Usa o motor real: a apresentação nova não deve alterar dano, defesa ou fim do especial.
let harness=read(path.join(__dirname,'cardoso.js'),'utf8').split('const c=client();')[0];
harness=harness.replace('return {api:env.__bangu,textSeen,','return {env,events,api:env.__bangu,textSeen,');
const scripts=Array.from(read(path.join(root,'index.html'),'utf8').matchAll(/<script src="js\/([^\"]+)\.js"><\/script>/g),m=>m[1]);
fs.readFileSync=function(file,...args){
 const p=path.resolve(String(file)),data=read(file,...args);
 if(p===path.join(root,'js/rig.js'))return data+'\n'+scripts.slice(scripts.indexOf('marcos-assets'),scripts.indexOf('combate-config')).map(n=>read(path.join(root,'js',n+'.js'),'utf8')).join('\n');
 if(p===path.join(root,'js/game.js'))return data.replace('  window.__bangu = {','  window.__pedroTest={get cine(){return cine;},drawCine:function(t){cine={p:players[0],t:t};drawCine();},duration:cineDuration,predict:predictGuest,online:function(value){online=value;}};\n  window.__bangu = {');
 return data;
};
try{
 const client=new Function('require','__dirname',harness+'\nreturn client;')(require,__dirname);
 for(const vs of [false,true])for(const blocked of [false,true])for(const facing of [-1,1]){
  const g=client();g.api.startTeam(vs?[{who:'pedro',ctl:0},{who:'lutador',ctl:1}]:[{who:'pedro',ctl:0}],false,vs);
  if(vs)g.until(()=>g.api.state.round.phase==='fight',200);
  const p=g.api.state.players[0];p.x=g.api.state.cam+(facing>0?100:340);p.y=220;p.facing=facing;p.sp=100;
  g.api.state.enemies.length=0;
  const target=vs?g.api.state.players[1]:g.api.cardosoTest.spawn('fome',p.x+150,p.y);
  target.x=p.x+150*facing;target.y=p.y;target.hp=500;target.inv=0;target.shield=0;target.stun=999;
  target.state=blocked?'guard':'idle';target.guardT=blocked?1:0;
  const hp=target.hp;g.key('KeyL');assert(g.env.__pedroTest.cine);assert.equal(g.env.__pedroTest.duration(p),2.2);
  g.tick(60);assert(g.env.__pedroTest.cine,'cena terminou antes do texto');assert.equal(target.hp,hp,'houve dano durante a cena congelada');
  g.until(()=>!g.env.__pedroTest.cine,100);
  if(vs&&blocked){assert(p.specialBlocked);g.until(()=>p.st>.6,60);assert.equal(target.hp,hp,'primeiro pulso ignorou a defesa');}
  g.tick(125);
  assert.equal(p.state,'idle');if(!vs || !blocked)assert(target.hp<hp,'especial não acertou');
  assert(g.textSeen.has('HARMONIA BIZARRAMENTE'));assert(g.textSeen.has('TORTAAAA!'));
 }
 // Calibre 12: um disparo real, sem salto, com recarga e limite de alcance.
 for(const vs of [false,true])for(const facing of [-1,1])for(const blocked of (vs?[false,true]:[false])){
  const g=client();g.api.startTeam(vs?[{who:'pedro',ctl:0},{who:'lutador',ctl:1}]:[{who:'pedro',ctl:0}],false,vs);
  if(vs)g.until(()=>g.api.state.round.phase==='fight',200);
  const p=g.api.state.players[0];p.x=g.api.state.cam+(facing>0?100:340);p.y=220;p.facing=facing;p.inv=0;
  g.api.state.enemies.length=0;const target=vs?g.api.state.players[1]:g.api.cardosoTest.spawn('fome',p.x+95*facing,p.y);
  target.x=p.x+95*facing;target.y=p.y;target.hp=500;target.inv=0;target.shield=0;target.stun=999;target.facing=-facing;
  if(blocked){g.events.keydown({code:'Quote',preventDefault(){}});g.tick();}
  const hp=target.hp,x=p.x;g.key('KeyI');assert.equal(p.state,'attack2');assert.equal(p.z,0);assert.equal(p.vz,0);assert(p.altCd>1);
  const shot=g.api.state.shots.find(s=>s.k==='pedro-12');assert(shot);assert.equal(shot.dmg,12);assert.equal(shot.pierce,1);
  for(let i=0;i<24;i++){g.tick();assert.equal(p.z,0,'Pedro saltou no tiro');assert.equal(p.vz,0);}
  assert.equal(p.state,'idle');assert(Math.abs(p.x-x)<1,'Pedro avançou como numa voadora');
  assert(Math.abs(target.hp-(blocked?hp:hp-(vs?4.8:12)))<.001,'dano repetido ou defesa ignorada '+JSON.stringify({vs,facing,blocked,hp,after:target.hp,z:shot.z,px:p.x,tx:target.x,ty:target.y,py:p.y}));
  if(blocked)assert(target.guardHp<100);g.key('KeyI');assert(!g.api.state.shots.some(s=>s.k==='pedro-12'),'recarga permitiu novo disparo cedo');
 }
 {
  const g=client();g.api.startTeam([{who:'pedro',ctl:0}],false,false);const p=g.api.state.players[0];p.x=100;p.y=220;p.facing=1;
  g.api.state.enemies.length=0;const e=g.api.cardosoTest.spawn('fome',325,220);e.hp=200;e.stun=999;
  g.key('KeyI');g.tick(30);assert.equal(e.hp,200,'tiro acertou fora do alcance curto');
 }
 {
  const g=client(),test=g.env.__pedroTest;
  const pred={x:100,y:220,z:0,vz:0,state:'idle',st:0,facing:1,cd:0,altCd:0,actionT:0,corrX:0,corrY:0};
  test.online({pred,sentInputs:[]});
  test.predict({x:0,y:0,alt:true},1/60,{cam:0,players:[{x:220,y:220},{who:'pedro',x:100,y:220,z:0,state:'idle',st:0}],round:{phase:'fight'}});
  assert.equal(pred.state,'attack2');assert.equal(pred.z,0);assert.equal(pred.vz,0);assert.equal(pred.actionT,.34);assert(pred.altCd>1);
  test.online(null);
 }
 console.log('Pedro: calibre 12 sem voadora, dano único, fogo azul, defesa, recarga e alcance curto: OK');
 const g=client();g.api.startTeam([{who:'pedro',ctl:0}],false,false);const p=g.api.state.players[0];p.x=100;p.y=220;p.facing=-1;
 g.key('KeyJ');const shot=g.api.state.shots.find(s=>s.k==='seminima');assert(shot);assert.equal(shot.dmg,6);assert(shot.x<p.x);assert(shot.z>0);assert.equal(shot.pierce,1);
 console.log('Pedro: cena de 2,2s, texto completo, congelamento, defesa, dano e fim do especial nos dois modos e sentidos: OK');
}finally{fs.readFileSync=read;}

const env={window:{}};vm.createContext(env);vm.runInContext(read(path.join(root,'js/pedro-assets-v2.js'),'utf8'),env);
for(const [name,m]of Object.entries(env.window.PedroArtAssets)){
 const bytes=read(path.join(root,'assets/pedro-v2',name+'.webp'));
 assert.deepEqual(Buffer.from(env.window.PedroArtEmbedded[name].split(',')[1],'base64'),bytes);
 assert(m.bodyHeight>0 && m.feet.every(Number.isFinite));assert(bytes.length<150000,'pose muito pesada: '+name);
}
for(const html of ['index.html','jogo.html']){
 const tags=Array.from(read(path.join(root,html),'utf8').matchAll(/<script src="([^"]+)"/g),m=>m[1]);
 for(const name of ['pedro-fx','pedro-assets-v2','artes-pedro-v2'])assert.equal(tags.filter(s=>s==='js/'+name+'.js').length,1);
 assert(tags.indexOf('js/artes-pedro-v2.js')<tags.indexOf('js/game.js'));
}
console.log('Pedro: seis poses WebP leves e embutidas, carregamento nas duas páginas: OK');
