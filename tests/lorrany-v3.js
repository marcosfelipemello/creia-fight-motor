'use strict';
// Recortes reais e chamadas do renderer: não altera nem simula números de combate.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sharp=require('../cutscenes/node_modules/sharp');
const root=path.resolve(__dirname,'..'),calls=[],noop=()=>{};
const makeCtx=()=>new Proxy({owner:null,drawImage(img,...args){if(this.owner)this.owner.pose=img.pose;else calls.push({img,args});}},{get(o,k){return k in o?o[k]:noop;},set(o,k,v){o[k]=v;return true;}});
const ctx=makeCtx();let delegated=0;
const env={window:null,Image:class{set src(v){this.srcValue=v;this.pose=/\/([^/]+)\.webp/.exec(v)[1];this.complete=true;this.naturalWidth=360;this.naturalHeight=465;}},document:{createElement(){const c={width:0,height:0};c.getContext=()=>{const g=makeCtx();g.owner=c;return g;};return c;}},Rig:{height:76,draw(){delegated++;},big(){delegated++;},portrait(){delegated++;},ready:()=>true}};env.window=env;vm.createContext(env);
let source=fs.readFileSync(path.join(root,'js/artes-lorrany.js'),'utf8');
// Acesso às medidas privadas só dentro deste teste, sem ampliar a API do jogo.
source=source.replace('  function load() {','  window.__lorranyMeasure={FEET:FEET,BODY:BODY,HEAD:HEAD,WALK:WALK};\n  function load() {');vm.runInContext(source,env);
const m=env.__lorranyMeasure;
assert.deepEqual(Array.from(m.FEET),[165,455]);assert(m.BODY>0);
// O dreno acompanha a medida compartilhada, nos dois sentidos, inclusive se ela mudar.
function checkClaw(point){for(const facing of [-1,1]){const p=env.Rig.lorranyClaw(100,215,facing),k=76/m.BODY;assert(Math.abs(p.x-(100+facing*(point.x-m.FEET[0])*k))<1e-6);assert(Math.abs(p.y-(215+(point.y-m.FEET[1])*k))<1e-6);}}
checkClaw({x:190,y:210});
env.LorranyVisual={claw:{x:204,y:222}};checkClaw(env.LorranyVisual.claw);
env.LorranyVisual.claw={x:180,y:200};checkClaw(env.LorranyVisual.claw);delete env.LorranyVisual;
for(const [state,pose]of Object.entries({idle:'base',walk:'base',throw:'arremesso',jump:'base',attack1:'xicara',attack2:'xicara',guard:'defesa',special:'garra',cutin:'maca',victory:'maca'})){
 calls.length=0;env.Rig.draw(ctx,'nutri',state,.1,100,215,1,{});assert(calls.length>0,'estado sem desenho: '+state);assert(calls.every(c=>c.img.pose===pose),'pose errada em '+state);
}
for(const [state,opts,pose]of [['idle',{guard:true},'defesa'],['jump',{airThrow:true},'arremesso']]){calls.length=0;env.Rig.draw(ctx,'nutri',state,0,100,215,1,opts);assert.equal(calls.at(-1).img.pose,pose);}
env.Rig.draw(ctx,'lutador','idle',0,100,215,1,{});assert.equal(delegated,1,'override interferiu no Marcos');
assert(m.WALK.waist>m.FEET[1]-m.BODY*.30,'corte ficou acima das pernas separadas');assert(m.WALK.waist<m.FEET[1]);
assert(m.WALK.legs.every(p=>p[1]>=m.WALK.waist),'polígono cortou o quadril');
(async()=>{
 const alphaData={};
 for(const name of ['base','arremesso','xicara','defesa','garra','maca']){
  const file=path.join(root,'assets/lorrany',name+'.webp'),metadata=await sharp(file).metadata();assert.equal(metadata.format,'webp');assert.equal(metadata.width,360);assert.equal(metadata.height,465);assert(metadata.hasAlpha);assert(fs.statSync(file).size<150000);
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});let minX=360,minY=465,maxX=-1,maxY=-1;
  for(let y=0;y<465;y++)for(let x=0;x<360;x++)if(data[(y*360+x)*info.channels+3]>32){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  assert(maxX>minX&&maxY>minY);assert(minX>0&&maxX<359,'arte cortada na lateral: '+name);assert(maxY<=459,'sombra/poeira ficou abaixo dos pés: '+name);
  alphaData[name]={data,info,minX,minY,maxX,maxY};
 }
 // Usa a altura da tinta real da base (WebP decodificado), projetada pela chamada de Rig.big escala 1.
 calls.length=0;env.Rig.big(ctx,'nutri','idle',0,100,215,1,1);assert.equal(calls.length,1);const draw=calls[0];assert.equal(draw.img.pose,'base');const k=draw.args[3]/465;
 const base=alphaData.base,height=(base.maxY-base.minY+1)*k;
 assert(Math.abs(height-76)<=1,`altura mudou: ${height.toFixed(3)}px`);assert(Math.abs(draw.args[1]+m.FEET[1]*k)<1e-6,'pés mudaram de âncora');
 const alpha=(name,x,y)=>{const a=alphaData[name];return a.data[(Math.round(y)*360+Math.round(x))*a.info.channels+3];};
 const y=Math.round(m.WALK.waist),split=Math.round(m.WALK.split);
 assert(alpha('base',split,y)<=10,'o corte vertical passa no macacão, em vez do espaço entre pernas');
 assert(Array.from({length:split},(_,x)=>alpha('base',x,y)).some(a=>a>200),'perna esquerda ausente');assert(Array.from({length:360-split},(_,x)=>alpha('base',x+split,y)).some(a=>a>200),'perna direita ausente');
 assert(alpha('base',90,232)<=10,'céu preso no vão entre o braço e a cintura');
 for(const name of ['base','arremesso','xicara','defesa','garra','maca'])assert(alpha(name,159,380)<=10,'fundo preso entre as pernas: '+name);
 assert(alpha('arremesso',335,131)<=10,'a pose de arremesso tem de ficar sem a maçã: quem voa é o projétil do jogo (pedido do dono)');assert(alpha('maca',213,164)>200,'maçã da cena removida');assert(alpha('xicara',267,259)>200,'xícara removida');assert(alpha('xicara',300,203)>150,'café removido');
 console.log(`Lorrany v3: seis WebPs, poses, maçã da cena/xícara/café, arremesso sem maçã, pés [165,455], altura ${height.toFixed(2)}px e corte abaixo da virilha: OK`);
})().catch(e=>{console.error(e);process.exitCode=1;});
