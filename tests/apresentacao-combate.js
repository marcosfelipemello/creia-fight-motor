'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs);
let harness=read(path.join(__dirname,'cardoso.js'),'utf8').split('const c=client();')[0];
harness=harness.replace('const events={}, textSeen=new Set();','const events={}, textSeen=new Set(),translations=[];');
harness=harness.replace("if(key==='measureText')", "if(key==='translate')return (...args)=>translations.push(args);\n    if(key==='measureText')");
harness=harness.replace('return {api:env.__bangu,textSeen,','return {env,translations,api:env.__bangu,textSeen,');
const scripts=Array.from(read(path.join(root,'index.html'),'utf8').matchAll(/<script src="js\/([^\"]+)\.js"><\/script>/g),m=>m[1]);
fs.readFileSync=function(file,...args){
 const p=path.resolve(String(file)),data=read(file,...args);
 if(p===path.join(root,'js/rig.js'))return data+'\n'+scripts.slice(scripts.indexOf('marcos-assets'),scripts.indexOf('combate-config')).map(n=>read(path.join(root,'js',n+'.js'),'utf8')).join('\n');
 if(p===path.join(root,'js/game.js'))return data.replace('  window.__bangu = {','  window.__presentation={draw:drawWorld,get cine(){return cine;}};\n  window.__bangu = {');
 return data;
};
try{
 const client=new Function('require','__dirname',harness+'\nreturn client;')(require,__dirname);
 for(const vs of [false,true]){
  const g=client();g.api.startTeam(vs?[{who:'pedro',ctl:0},{who:'lutador',ctl:1}]:[{who:'pedro',ctl:0}],false,vs);
  if(vs)g.until(()=>g.api.state.round.phase==='fight',200);
  const before=g.api.state.players.map(p=>({x:p.x,y:p.y,z:p.z,hp:p.hp}));g.translations.length=0;g.env.__presentation.draw();
  assert.deepEqual(g.translations[0],[0,vs?34:0]);assert.deepEqual(g.api.state.players.map(p=>({x:p.x,y:p.y,z:p.z,hp:p.hp})),before,'desenho alterou física');
 }
 for(const who of ['th','douglinhas']){
  const g=client();g.api.startTeam([{who,ctl:0},{who:'lutador',ctl:1}],false,true);g.until(()=>g.api.state.round.phase==='fight',200);
  const [p,q]=g.api.state.players;p.sp=100;p.x=g.api.state.cam+100;q.x=p.x+150;q.inv=0;q.shield=0;q.hp=500;
  g.key('KeyL');g.until(()=>!g.env.__presentation.cine,500);
  let shot;g.until(()=>{shot=g.api.state.shots.find(s=>who==='th'?s.thLanded:s.dglLanded);return !!shot;},120);
  assert(shot.life>=.6);const hp=q.hp;g.tick(20);assert(g.api.state.shots.includes(shot),'objeto sumiu cedo');assert.equal(q.hp,hp,'impacto repetiu dano');
  g.tick(50);assert(!g.api.state.shots.includes(shot),'objeto não desapareceu');assert.equal(q.hp,hp);
 }
 {
  const g=client();g.api.startTeam([{who:'bispo',ctl:0},{who:'lutador',ctl:1}],false,true);g.until(()=>g.api.state.round.phase==='fight',200);
  const [p,q]=g.api.state.players;p.sp=100;p.x=g.api.state.cam+100;q.x=p.x+170;q.hp=500;q.inv=0;q.shield=0;
  g.key('KeyL');g.until(()=>!g.env.__presentation.cine,250);const seen=new Set();
  for(let i=0;i<220;i++){g.tick();g.api.state.shots.forEach(s=>{if(s.k==='fogo')seen.add(s);});}
  assert(seen.size>0&&seen.size<=15,'cópias visuais criaram projéteis reais');assert(500-q.hp<=24.001,'chuva aumentou o limite de dano');
 }
 console.log('Apresentação: cenário/pés descem só no X1, física preservada, TV/cruz permanecem sem repetir dano, Bispo sem projéteis/dano extras: OK');
}finally{fs.readFileSync=read;}
