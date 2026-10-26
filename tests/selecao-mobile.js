'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let harness=fs.readFileSync(path.join(__dirname,'defesa-x1.js'),'utf8').split("console.log('Iniciando testes")[0];
harness=harness.replace("appendChild: noop, addEventListener: noop, setAttribute:noop, textContent: ''","events:{},appendChild:noop,addEventListener(name,fn){this.events[name]=fn;},setPointerCapture:noop,getBoundingClientRect:()=>({left:16,top:100,width:96,height:96}),setAttribute:noop,textContent:''");
harness=harness.replace('api: env.__bangu, textSeen, touchElements,','env,api: env.__bangu, textSeen, touchElements,');
const read=fs.readFileSync.bind(fs),game=path.resolve(__dirname,'../js/game.js');
fs.readFileSync=function(file,...args){const s=read(file,...args);return path.resolve(String(file))===game?s.replace('  window.__bangu = {','  window.__selectTouch={ui:modernUIState,bridge:uiBridge};\n  window.__bangu = {'):s;};
try{
 const create=new Function('require','__dirname',harness+'\nreturn createClient;')(require,__dirname),g=create();g.key('Enter');g.key('Enter');assert.equal(g.api.state.scene,'select');
 const zone=g.touchElements.find(e=>e.id==='creia-direction-zone');assert(zone,'analógico não foi criado');
 const state=()=>g.env.__selectTouch.ui().selection,before=state().cursor;
 zone.events.pointerdown({pointerId:1,clientX:96,clientY:148,preventDefault(){}});g.tick();assert.notEqual(state().cursor,before);assert.equal(state().team.length,0,'analógico selecionou sem confirmação');const first=state().cursor;g.tick(35);assert.notEqual(state().cursor,first,'analógico mantido não repetiu navegação');zone.events.pointerup({pointerId:1});g.tick();const stopped=state().cursor;g.tick(30);assert.equal(state().cursor,stopped,'analógico continuou andando após soltar');
 g.env.__selectTouch.bridge.pick(state().cursor);g.tick();assert.equal(state().team.length,1);assert.equal(g.api.state.scene,'select');g.env.__selectTouch.bridge.pick(state().cursor);g.tick();assert.equal(state().team.length,2);g.env.__selectTouch.bridge.pick(20);g.tick();assert(g.env.__selectTouch.ui().selection.transition,'Iniciar não iniciou a apresentação');
 console.log('Analógico mobile: navegação mantida sem selecionar, parada ao soltar, confirmação e início separados: OK');
}finally{fs.readFileSync=read;}
