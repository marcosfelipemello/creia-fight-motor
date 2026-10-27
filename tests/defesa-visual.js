'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/defesa-visual.js'),'utf8');
function moduleWith(Image){const env={Image};env.window=env;vm.createContext(env);vm.runInContext(source,env);return env.DefesaVisual;}
function canvas(){let state={globalAlpha:1,imageSmoothingEnabled:true},stack=[];const ops=[];return {ops,
  save(){stack.push({...state});},restore(){state=stack.pop();},
  get globalAlpha(){return state.globalAlpha;},set globalAlpha(v){state.globalAlpha=v;},
  get imageSmoothingEnabled(){return state.imageSmoothingEnabled;},set imageSmoothingEnabled(v){state.imageSmoothingEnabled=v;},
  fillRect(...a){assert(a.every(Number.isFinite));ops.push(['rect',...a,state.globalAlpha]);},
  drawImage(img,...a){assert(a.every(Number.isFinite));ops.push(['sprite',...a,state.globalAlpha]);}
};}
function art(width=384,height=64){return class{set src(v){this.complete=true;this.naturalWidth=width;this.naturalHeight=height;}};}
for(const Image of [undefined,class{set src(v){this.onerror();}},art(1,1)]){
  const V=moduleWith(Image),c=canvas();V.spawn(100,200,1);V.draw(c,0);assert(c.ops.length>0);assert(!c.ops.some(o=>o[0]==='sprite'),'imagem ausente/inválida usada');
  assert.equal(c.globalAlpha,1);assert(c.imageSmoothingEnabled);V.update(.45);const done=canvas();V.draw(done,0);assert.equal(done.ops.length,0,'efeito não expirou');
}
{
 const V=moduleWith(art()),c=canvas();V.spawn(100,200,-1);V.draw(c,20);
 const sprite=c.ops.find(o=>o[0]==='sprite');assert.deepEqual(sprite.slice(1,9),[0,0,64,64,34,140,48,48],'posição não é frontal/câmera foi aplicada duas vezes');
 V.update(.225);const mid=canvas();V.draw(mid,20);assert.equal(mid.ops.find(o=>o[0]==='sprite')[1],192,'quadro da folha incorreto');
 V.reset();const empty=canvas();V.draw(empty,20);assert.equal(empty.ops.length,0);
 const frames=[];for(let n=0;n<2;n++){V.reset();V.spawn(100,200,1);V.update(.2);const c=canvas();V.draw(c,12);frames.push(c.ops);}assert.deepEqual(frames[0],frames[1],'seek mudou o desenho');
 for(let n=0;n<100;n++)V.spawn(n,200,1);const many=canvas();V.draw(many,0);assert.equal(many.ops.filter(o=>o[0]==='sprite').length,32,'efeitos cresceram sem limite');
}
{
 let loads=0;const V=moduleWith(class{set src(v){loads++;}});V.load(null);V.spawn(1,2,1);assert.equal(loads,0,'prévia sem arte fez pedido inválido');
 V.update(-1);V.update(NaN);const c=canvas();V.draw(c,0);assert(c.ops.length>0);
 V.reset();V.spawn(NaN,0,1);V.draw(canvas(),0);
}
for(const t of [0,-1]){const c=canvas();moduleWith().contra(c,100,120,t);assert.equal(c.ops.length,0);}
const glow=canvas();moduleWith().contra(glow,100,120,.4);assert(glow.ops.length>0);assert.equal(glow.globalAlpha,1);assert(glow.imageSmoothingEnabled);
const brokenCanvas=canvas();brokenCanvas.drawImage=function(){throw new Error('imagem indisponível');};const fallback=moduleWith(art());fallback.spawn(100,200,1);assert.doesNotThrow(()=>fallback.draw(brokenCanvas,0));assert(brokenCanvas.ops.length>64,'erro de desenho não caiu no fallback');
console.log('DefesaVisual: folha válida/ausente/quebrada, quadros, câmera, frente, 0,45 s, reset/seek, limite de efeitos, contra e canvas preservado: OK');
