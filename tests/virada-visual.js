'use strict';
const assert=require('node:assert/strict'),V=require('../js/virada-visual.js');
function canvas(){
  let state={globalAlpha:1,imageSmoothingEnabled:true,clip:[0,0,480,270]},stack=[],path;
  const pixels=new Float64Array(480*270),rects=[],texts=[];
  return {pixels,rects,texts,save(){stack.push({...state,clip:state.clip.slice()});},restore(){state=stack.pop();},
    beginPath(){},rect(...r){path=r;},clip(){state.clip=path;},
    translate(){},scale(){},fillText(s){texts.push(s);},measureText(s){return {width:Array.from(s).length*(parseFloat(this.font)||8)};},
    get globalAlpha(){return state.globalAlpha;},set globalAlpha(v){state.globalAlpha=v;},
    get imageSmoothingEnabled(){return state.imageSmoothingEnabled;},set imageSmoothingEnabled(v){state.imageSmoothingEnabled=v;},
    fillRect(x,y,w,h){assert([x,y,w,h,state.globalAlpha].every(Number.isFinite));rects.push([x,y,w,h,state.globalAlpha]);
      const [cx,cy,cw,ch]=state.clip;for(let yy=Math.max(0,y,cy);yy<Math.min(270,y+h,cy+ch);yy++)for(let xx=Math.max(0,x,cx);xx<Math.min(480,x+w,cx+cw);xx++){const i=yy*480+xx;pixels[i]=state.globalAlpha+pixels[i]*(1-state.globalAlpha);}}
  };
}
for(const lado of ['tudo','esquerda','direita']){
  const c=canvas();V.draw(c,480,270,{t:.1,lado,forca:1});
  assert(c.pixels.every(a=>a<=.6000001),'cantos somaram alfa acima de 0,60');
  assert.equal(c.pixels[135*480+240],0,'efeito cobriu o centro da luta');
  assert(c.pixels.every((a,i)=>i%480<18||i%480>=462||Math.floor(i/480)<18||Math.floor(i/480)>=252||a===0),'efeito cobriu a área central');
  const painted=lado==='direita'?479:0,empty=lado==='direita'?0:479;assert(c.pixels[painted]>0);
  const inner=lado==='direita'?462:17,clear=lado==='direita'?461:18;
  assert(c.pixels[135*480+inner]>0,'borda não alcançou 18 pixels');
  assert.equal(c.pixels[135*480+clear],0,'borda avançou para dentro da luta');
  if(lado!=='tudo')assert.equal(c.pixels[empty],0,'vazou para o lado do rival');
  assert.equal(c.globalAlpha,1);assert(c.imageSmoothingEnabled,'estado do canvas não foi restaurado');
}
const intensity=t=>{const c=canvas();V.draw(c,480,270,{t,lado:'tudo'});return c.pixels[0];};
assert(Math.abs(intensity(.10)-.6)<1e-8,'pico do alerta ficou fraco');
assert(intensity(.10)>intensity(.29));assert(intensity(.29)>.48,'segunda batida ficou fraca');
assert(intensity(.7)<.02,'pausa não contrastou com as batidas');assert(intensity(.10)>intensity(.7)*30);assert.equal(intensity(.1),intensity(1.25));
const half=canvas();V.draw(half,480,270,{t:.1,forca:.5});assert(Math.abs(half.pixels[0]-.3)<1e-8,'força não escalou o alfa');
const absent=canvas();V.draw(absent,480,270,{t:.1,forca:0});assert.equal(absent.rects.length,0);
for(const t of [-1,.8,4]){const c=canvas();V.entrada(c,480,270,t);assert.equal(c.rects.length,0);}
const first=canvas(),second=canvas();V.entrada(first,480,270,.1);V.entrada(second,480,270,.1);assert(first.rects.length>0);assert.deepEqual(first.rects,second.rects,'entrada mudou ao buscar o mesmo instante');
assert(first.texts.length>0&&first.texts.every(s=>s==='UNÇAO DOBRADA!'),'texto perdeu a cedilha ou enviou Ã sem suporte à fonte');
assert(first.rects.length>=8,'til não foi desenhado com contorno e pixels');
console.log('ViradaVisual: lados, centro livre, alfa máximo, duas batidas/pausa, intensidade, duração, determinismo e isolamento do canvas: OK');
