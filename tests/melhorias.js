'use strict';
// Preferências reais e interface em DOM simulado. Não substitui teste visual no aparelho.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../js',name+'.js'),'utf8');
const storage=new Map();let failStorage=false;
const localStorage={getItem:k=>storage.get(k)||null,setItem(k,v){if(failStorage)throw Error('storage indisponível');storage.set(k,v);}};
function prefs(){const env={localStorage};vm.runInNewContext(read('preferencias'),env);return env.CreiaPreferences;}
storage.set('bangu-save',JSON.stringify({music:false,sfx:false}));
let P=prefs();assert.equal(P.audio('music'),0);assert.equal(P.audio('effects'),0);assert.equal(P.audio('voices'),0);
P.setAudio('music',.25);P.setAudio('effects',0);P.setAudio('voices',.6);
P.setControl('portrait','KeyJ',{x:.9,y:.8,size:80,opacity:.5});
P=prefs();assert.equal(P.audio('music'),.25);assert.equal(P.audio('effects'),0);assert.equal(P.audio('voices'),.6);
assert.equal(P.control('portrait','KeyJ').size,80);assert.equal(P.control('landscape','KeyJ'),null);
P.setControl('portrait','KeyJ',{x:Infinity,y:-5,size:900,opacity:0});
assert.deepEqual(JSON.parse(JSON.stringify(P.control('portrait','KeyJ'))),{x:.5,y:0,size:96,opacity:.25});
failStorage=true;assert.equal(P.setAudio('music',.4),false);assert.equal(P.persisted,false);assert.equal(P.audio('music'),.4);failStorage=false;
P.resetControls('portrait');
assert.equal(P.setBinding(0,'atk','KeyT').ok,true);assert.equal(P.setBinding(1,'atk','KeyT').ok,false,'tecla duplicada entre jogadores');
assert.equal(P.setBinding(0,'jump','KeyP').ok,false,'pausa foi remapeada');assert.equal(P.setBinding(0,'use','Escape').ok,false);
P=prefs();assert.deepEqual(Array.from(P.bindings()[0].atk),['KeyT']);assert.deepEqual(Array.from(P.bindings()[0].alt),['KeyI','KeyU']);P.resetBindings();assert.equal(P.bindings()[0].atk[0],'KeyJ');
console.log('Preferências: migração, canais independentes, persistência, limites e falha de armazenamento: OK');

let document;
class Element{
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};this.events={};this.style={setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}};this.className='';this.textContent='';this.hidden=false;}
 append(...nodes){for(const n of nodes){n.parentElement=this;this.children.push(n);}}appendChild(n){this.append(n);return n;}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this);}
 setAttribute(k,v){this.attributes[k]=String(v);}addEventListener(k,fn){this.events[k]=fn;}focus(){document.activeElement=this;}setPointerCapture(){}
 matches(s){if(s==='button:not(:disabled)')return this.tagName==='BUTTON'&&!this.disabled;if(s[0]==='.')return this.className.split(' ').includes(s.slice(1));if(s==='[data-control]')return !!this.dataset.control;return this.tagName===s.toUpperCase();}
 querySelectorAll(s){const found=[];function visit(n){for(const c of n.children){if(s.split(',').some(s=>c.matches(s)))found.push(c);visit(c);}}visit(this);return found;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 click(){if(!this.disabled&&this.onclick)this.onclick();}
}
const events={};document={head:new Element('head'),body:new Element('body'),documentElement:new Element('html'),createElement:t=>new Element(t),querySelector:s=>document.body.querySelector(s),addEventListener:(k,f)=>{events['doc:'+k]=f;}};
const env={document,CreiaPreferences:P,innerWidth:844,innerHeight:390,addEventListener:(k,f)=>{events[k]=f;}};env.window=env;
vm.runInNewContext(read('ajustes'),env);
let closed=0,rematched=0,left=0;
const model={open:true,mobile:true,close:()=>closed++,online:null};
env.CreiaSettings.sync(model);
const panel=document.body.querySelector('.creia-settings'),audioSliders=panel.querySelectorAll('input');assert.equal(audioSliders.length,3);
audioSliders[2].value='30';audioSliders[2].oninput();assert.equal(P.audio('voices'),.3);assert.equal(P.audio('effects'),0);
panel.querySelectorAll('button').find(n=>n.textContent==='Personalizar botões').click();
let editor=document.body.querySelector('.creia-touch-editor'),choose=editor.querySelector('select');
choose.value='JOY';choose.onchange();let sliders=editor.querySelectorAll('input'),outputs=editor.querySelectorAll('output');
assert.equal(Number(sliders[0].value),120);assert.equal(String(outputs[0].textContent),'120');
sliders[0].value='150';sliders[0].oninput();choose.value='KeyJ';choose.onchange();
assert.equal(String(outputs[0].textContent),'64','trocar controle deixou tamanho anterior na tela');
assert.equal(Number(sliders[0].max),96);
const attack=editor.querySelectorAll('[data-control]').find(n=>n.dataset.control==='KeyJ');
attack.onpointerdown({pointerId:1,clientX:790,clientY:288,preventDefault(){}});
attack.onpointermove({pointerId:1,clientX:600,clientY:220});assert.equal(P.control('landscape','KeyJ'),null,'arraste foi gravado antes de soltar');
attack.onpointerup();assert(P.control('landscape','KeyJ'));
const realButton=new Element('button');realButton.style.width='64px';env.CreiaTouch.register(realButton,'KeyJ');env.CreiaTouch.refresh(true);
assert.equal(realButton.style.boxSizing,'border-box');assert.equal(realButton.style.width,'64px');
editor.querySelectorAll('button').find(n=>n.textContent==='Padrão').click();assert.equal(P.control('landscape','JOY'),null);assert.equal(String(outputs[0].textContent),'64');assert.equal(realButton.style.boxSizing,'');
attack.onpointerdown({pointerId:2,clientX:790,clientY:288,preventDefault(){}});attack.onpointermove({pointerId:2,clientX:500,clientY:200});
env.innerWidth=390;env.innerHeight=844;events.resize();assert.equal(document.body.querySelector('.creia-touch-editor'),null);assert.equal(P.control('portrait','KeyJ'),null,'rotacionar salvou arraste na orientação errada');assert.equal(panel.hidden,false);
events['doc:keydown']({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(closed,1);
env.CreiaSettings.sync({open:false,online:{result:0,self:false,other:true,rematch:()=>rematched++,leave:()=>left++,metrics:{rtt:45,jitter:4,loss:0,quality:'Boa',route:'Direta'}}});
const result=document.body.querySelector('.creia-result');assert.equal(result.querySelector('h1').textContent,'P1 venceu');result.querySelector('button').click();assert.equal(rematched,1);
result.querySelectorAll('button')[1].click();assert.equal(left,1);
assert(document.body.querySelector('.creia-net').querySelector('button').textContent.includes('45 ms'));
env.CreiaSettings.sync({open:false,online:{result:0,self:false,other:false,rematch:mode=>{assert.equal(mode,'select');rematched++;},metrics:{}}});result.querySelectorAll('button')[2].click();assert.equal(rematched,2);
env.CreiaSettings.sync({open:false,online:{result:0,self:true,other:false,rematch(){throw Error('voto duplicado');},metrics:{}}});assert.equal(result.querySelector('button').disabled,true);
console.log('Ajustes: sliders, editor/arraste/reset/rotação, tamanho real, resultado e diagnóstico: OK (DOM simulado)');
env.CreiaSettings.sync({open:true,mobile:false});
const keyboard=document.body.querySelector('.keyboard-grid'),keyButtons=keyboard.querySelectorAll('button');assert.equal(keyButtons.length,18);
const attackKey=keyButtons.find(b=>b.dataset.player==='0'&&b.dataset.action==='atk');attackKey.click();
events['doc:keydown']({key:'t',code:'KeyT',preventDefault(){},stopPropagation(){}});assert.equal(P.bindings()[0].atk[0],'KeyT');assert.equal(attackKey.textContent,'T');
attackKey.click();events['doc:keydown']({key:'p',code:'KeyP',preventDefault(){},stopPropagation(){}});assert.equal(P.bindings()[0].atk[0],'KeyT');
events['doc:keydown']({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(attackKey.textContent,'T');
document.body.querySelectorAll('button').find(b=>b.textContent==='Restaurar teclas padrão').click();assert.equal(attackKey.textContent,'J');
env.CreiaSettings.sync({open:false});
console.log('Teclado: captura real do evento, cancelamento, conflitos, teclas reservadas e restauração: OK');

const enc={};vm.runInNewContext(read('encontros'),enc);
for(let stage=1;stage<=10;stage++)for(let index=0;index<4;index++){
 const plan=enc.CreiaEncounters.plan(stage,index,['fome','refri'],8,()=>.3);
 assert.equal(plan.pool.length,8);assert(plan.pool.includes('fome')&&plan.pool.includes('refri'));
 assert(plan.gap>=.7&&plan.gap<=1.15);assert.equal(plan.side,index%2?-1:1);
 if(stage>=4&&index%3===1)assert(plan.pool.includes('batata'));
 if(stage>=7&&index%3===2)assert(plan.pool.includes('gordura'));
}
console.log('Encontros: dez fases, contagem preservada, alternância e papéis mistos: OK');
for(const entry of ['index.html','jogo.html']){
 const html=fs.readFileSync(path.join(__dirname,'..',entry),'utf8');
 for(const name of ['preferencias','ajustes','encontros','combate-fx'])assert(html.indexOf('js/'+name+'.js')<html.indexOf('js/game.js'));
}
