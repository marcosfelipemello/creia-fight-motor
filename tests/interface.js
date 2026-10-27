'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const artDraws=[],artLabels=[],previewStages=[],carouselTimers=new Map();let carouselClock=0,nextCarouselTimer=0;
const noop=()=>{},context=new Proxy({},{get(_,key){if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>({addColorStop:noop});if(key==='fillText')return (text,x,y)=>artLabels.push({text,x,y});return key==='measureText'?s=>({width:s.length*8}):noop;},set(){return true;}});
class Node{
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={setProperty(k,v){this[k]=v;}};this.attributes={};this.events={};this.className='';this.textContent='';this.hidden=false;}
 append(...nodes){for(const n of nodes){if(n.parent){const i=n.parent.children.indexOf(n);if(i>=0)n.parent.children.splice(i,1);}n.parent=this;this.children.push(n);}}appendChild(n){this.append(n);return n;}replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 setAttribute(k,v){this.attributes[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);}
 get parentElement(){return this.parent;}getAttribute(k){return this.attributes[k];}focus(){document.activeElement=this;if(this.onfocus)this.onfocus();}getContext(){return context;}addEventListener(k,fn){this.events[k]=fn;}click(){if(!this.disabled&&this.onclick)this.onclick();}
 matches(selector){if(selector.startsWith('.'))return this.className.split(' ').includes(selector.slice(1));if(selector.startsWith('#'))return this.id===selector.slice(1);if(selector.startsWith('[')){const key=selector.slice(1,-1);return key.startsWith('data-')?key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()) in this.dataset:key in this.attributes;}return this.tagName===selector.toUpperCase();}
 querySelectorAll(selector){const parts=selector.split(' '),result=[];function visit(n){for(const child of n.children){if(child.matches(parts.at(-1))){let ancestor=child.parent,index=parts.length-2;while(index>=0&&ancestor){if(ancestor.matches(parts[index]))index--;ancestor=ancestor.parent;}if(index<0)result.push(child);}visit(child);}}visit(this);return result;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
}
const body=new Node('body'),head=new Node('head'),document={body,head,createElement:t=>new Node(t),querySelector:s=>body.querySelector(s),querySelectorAll:s=>body.querySelectorAll(s)},env={document,Date:{now:()=>carouselClock},setTimeout(fn){const id=++nextCarouselTimer;carouselTimers.set(id,fn);return id;},clearTimeout(id){carouselTimers.delete(id);},window:{Rig:{big:noop,portrait:noop}},console};env.Rig=env.window.Rig;vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/combate-config.js'),'utf8'),env);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/interface.js'),'utf8'),env);
const events=[],commands={};for(const key of ['menuFocus','x1Focus','menu','back','pick','hover','undo','mode','level','x1','x1Go','x1Opt','stage','sortTourRest'])commands[key]=(...args)=>events.push([key,...args]);
const roster=['bispo','lucas','lutador','douglas','rafinha','duda','cardoso','fidelis','pedro','naju','enzo','grazi','th','douglinhas','nutri','arthur','lohan','emanuelly','ricardo'].map(who=>({who,name:who,job:'Lutador',special:'Especial'}));
const state={scene:'menu',time:0,menu:0,stage:1,place:'Bangu',roster,x1:0,local:{mode:'pve',levels:['medio','medio']},players:[],selection:null};
function sync(){env.window.CreiaUI.sync(state,commands);}sync();const root=body.querySelector('#creia-ui');assert(root.hidden,'tela inicial original foi coberta pela interface moderna');
state.scene='x1menu';sync();const cards=root.querySelectorAll('.x1-card');assert.equal(cards.length,6,'6 cartões: P1×IA, P1×P2, IA×IA, online, torneio, escalada');assert.deepEqual(cards.map(c=>c.dataset.ativo),['true','false','false','false','false','false']);assert.deepEqual(cards.map(c=>c.querySelector('h2').textContent),['P1 × IA','P1 × P2','IA × IA','X1 ONLINE','TORNEIO','ESCALADA']);cards[2].onclick();assert.deepEqual(events.at(-1),['x1Focus',2]);state.x1=2;sync();assert.equal(cards[2].dataset.ativo,'true');const modes=root.querySelectorAll('[data-mode]');assert.equal(modes.length,3);modes[2].click();assert.deepEqual(events.at(-1),['mode','eve']);const niveis=root.querySelectorAll('[data-nivel]');assert.equal(niveis.length,9,'P1×IA: 3; IA×IA: 3 por IA');const dificil2=niveis.filter(b=>b.dataset.lado==='1'&&b.dataset.nivel==='dificil');dificil2.at(-1).click();assert.deepEqual(events.at(-1),['level',1,'dificil']);state.local.levels=['facil','dificil'];sync();assert.equal(dificil2[0].getAttribute('aria-pressed'),'true');assert.equal(niveis.find(b=>b.dataset.lado==='0'&&b.dataset.nivel==='facil').getAttribute('aria-pressed'),'true');const online=root.querySelectorAll('[data-online]');online[1].click();assert.deepEqual(events.slice(-2),[['x1Opt','online',1],['x1Go',3]]);const tam=root.querySelectorAll('[data-tsize]');assert.deepEqual(tam.map(b=>b.textContent),['4','8','12','16']);tam[3].click();assert.deepEqual(events.at(-1),['x1Opt','torneio',3]);state.x1Opt={online:0,torneio:3};sync();assert.equal(tam[3].getAttribute('aria-pressed'),'true');cards[5].querySelector('.primary').click();assert.deepEqual(events.at(-1),['x1Go',5]);state.x1=0;state.local={mode:'pve',levels:['medio','medio']};state.x1Opt={online:0,torneio:0};sync();
state.scene='select';state.selection={cursor:0,locked:false,team:[],vs:true,transition:false,message:'',slots:[{pick:0}]};sync();const rows=root.querySelectorAll('.roster-row');assert.deepEqual(rows.map(r=>r.children.length),[4,5,6,4]);assert.equal(root.querySelectorAll('.fighter').length,19);assert(!root.querySelector('.start').disabled);assert.equal(root.querySelector('.start').textContent,'Selecionar');root.querySelector('.start').click();assert.deepEqual(events.at(-1),['pick',0]);root.querySelectorAll('.fighter')[18].click();assert.deepEqual(events.at(-1),['pick',18]);
root.querySelectorAll('.fighter')[0].focus();state.selection.cursor=18;sync();assert.equal(document.activeElement,root.querySelectorAll('.fighter')[18]);assert.equal(root.querySelector('.fighter-title').textContent,'ricardo');assert(root.querySelector('.attacks').children.every(c=>c.textContent.includes('Corpo a corpo')));assert.equal(root.querySelectorAll('meter').length,3);
let blocked=false,stopped=false;const beforeEnter=events.length;root.events.keydown({key:'Enter',target:document.activeElement,preventDefault(){blocked=true;},stopPropagation(){stopped=true;}});assert(blocked);assert(!stopped,'Enter da grade não chegou ao motor');assert.equal(events.length,beforeEnter,'Enter confirmou o botão antigo');
state.selection.team=[{who:'bispo',ctl:null},{who:'ricardo',ctl:null}];state.selection.locked=true;state.selection.cursor=19;sync();assert(!root.querySelector('.start').disabled);assert.equal(root.querySelector('.start').dataset.goCursor,'true');root.querySelector('.start').click();assert.deepEqual(events.at(-1),['pick',19]);
const previous=events.length;root.events.keydown({key:'Enter',target:root.querySelector('.start'),preventDefault:noop,stopPropagation:noop});assert.equal(events.length,previous+1,'Enter repetiu confirmação');
state.selection.team=[{who:'bispo',ctl:0},{who:'lucas',ctl:1},{who:'lutador',ctl:null},{who:'douglas',ctl:null},{who:'ricardo',ctl:null}];sync();const selected=root.querySelectorAll('.fighter');assert.equal(selected[0].style['--picked-color'],'#ff3b3b');assert.equal(selected[1].style['--picked-color'],'#3b8bff');assert.equal(selected[2].style['--picked-color'],'#3bff6a');assert.equal(selected[3].style['--picked-color'],'#a875ff');assert.equal(selected[18].style['--picked-color'],'#ff72bd');assert.equal(selected[18].querySelector('.pick-tag').textContent,'IA 3');
state.scene='play';state.players=[{who:'duda',name:'Duda',ai:false,ctl:0,primary:0,secondary:29.4,special:45,active:0,state:'idle'}];sync();assert(root.hidden);const hud=body.querySelector('#creia-recargas');assert(hud.hidden,'informações de ataque invadiram a luta');
for(const [w,h]of [[1920,1080],[1366,768],[844,390],[667,375],[390,844],[360,640],[320,568]]){env.window.innerWidth=w;env.window.innerHeight=h;const fit=env.window.CreiaUI.fit();assert(fit.width<=w&&fit.height<=h,'tela exige rolagem em '+w+'x'+h);}
assert.equal(env.window.CreiaUI.profiles.lutador[0],4,'perfil ofensivo do Marcos não foi reduzido');env.window.innerWidth=844;env.window.innerHeight=390;env.window.navigator={maxTouchPoints:1};env.window.CreiaUI.fit();assert.equal(root.dataset.device,'mobile');env.window.navigator={maxTouchPoints:0};env.window.innerWidth=1920;env.window.innerHeight=1080;const desktopFit=env.window.CreiaUI.fit();assert.equal(root.dataset.device,'desktop');assert.equal(desktopFit.width,960,'desktop foi ampliado como celular');
for(const r of roster)assert(env.window.CreiaUI.profiles[r.who],'perfil ausente: '+r.who);
console.log('Interface: menu, modos/níveis, grade 4/5/6/4, perfis, seleção por botão/Enter, início e recarga real: OK (DOM simulado; não é teste visual)');
for(const name of ['index.html','jogo.html']){
 const html=fs.readFileSync(path.join(__dirname,'..',name),'utf8'),scripts=Array.from(html.matchAll(/<script src="([^"]+)"/g),m=>m[1]);
 for(const file of ['js/ricardo-assets.js','js/artes-ricardo.js','js/interface.js','js/online.js']){assert.equal(scripts.filter(s=>s===file).length,1,'entrada incompleta/duplicada: '+name+' '+file);assert(scripts.indexOf(file)<scripts.indexOf('js/game.js'));}
 for(const file of scripts)assert(fs.existsSync(path.join(__dirname,'..',file)),'arquivo ausente: '+file);
}

for(const r of roster){const expected=env.window.CreiaCombat.profile(r.who,true),actual=env.window.CreiaUI.profiles[r.who];assert.equal(actual[0],expected.attack);assert.equal(actual[1],expected.mobility);assert.equal(actual[2],expected.defense);}

// Mobile: explorar muda o perfil; só o botão confirma. Aventura pode iniciar solo.
env.window.navigator={maxTouchPoints:1};env.window.innerWidth=390;env.window.innerHeight=844;state.scene='select';state.selection={cursor:0,locked:false,team:[],vs:false,transition:false,message:'',slots:[{pick:0}]};sync();root.querySelectorAll('.fighter')[5].click();assert.deepEqual(events.at(-1),['hover',5]);state.selection.cursor=5;sync();root.querySelector('.start').click();assert.deepEqual(events.at(-1),['pick',5]);state.selection.locked=true;state.selection.team=[{who:'duda',ctl:0}];state.selection.cursor=6;sync();assert.equal(root.querySelector('.start').textContent,'Iniciar');assert(!root.querySelector('.choose-more').hidden);root.querySelector('.choose-more').click();assert.deepEqual(events.at(-1),['pick',6]);root.querySelector('.start').click();assert.deepEqual(events.at(-1),['pick',19]);
state.selection.vs=true;sync();assert.equal(root.querySelector('.start').textContent,'Selecionar');assert(root.querySelector('.choose-more').hidden);state.selection.team.push({who:'cardoso',ctl:null});sync();assert.equal(root.querySelector('.start').textContent,'Iniciar');
state.scene='onlineSelect';state.selection={online:true,cursor:6,locked:false,blocked:false,team:[],vs:true,message:'',slots:[{pick:0}]};sync();assert.equal(root.querySelector('.start').textContent,'Selecionar');assert(!root.querySelector('.start').disabled);root.querySelector('.start').click();assert.deepEqual(events.at(-1),['pick',6]);state.selection.locked=true;sync();assert(root.querySelector('.start').disabled);assert.equal(root.querySelector('.start').textContent,'Aguardando rival');
console.log('Mobile: toque apenas explora, Selecionar confirma, Iniciar começa e seleção online funciona: OK');
// Ferramentas flutuantes não cobrem as faixas de combate em canvas 16:9.
const cssVars={},htmlClasses={};document.documentElement={style:{setProperty(k,v){cssVars[k]=v;}},classList:{toggle(k,v){htmlClasses[k]=v;}}};
for(const [w,h]of [[960,540],[844,390],[390,844]])for(const combat of ['x1','adventure']){env.window.innerWidth=w;env.window.innerHeight=h;state.scene='play';state.combat=combat;sync();const gw=Math.min(w,h*16/9),gameTop=(h-gw*9/16)/2,hudBottom=gameTop+(combat==='x1'?69:93)*gw/480;assert(parseFloat(cssVars['--creia-combat-tools-top'])>hudBottom,'pausa/FS cobrem o HUD');assert(htmlClasses['creia-combat-screen']);}

// Coop: chips refletem o estado e o selo participa do rodapé, retornando ao jogo na saída.
commands.coop=(...args)=>events.push(['coop',...args]);
state.scene='coopSetup';state.best=10;state.selection=null;
state.coop={host:true,stage:1,place:'FIGUEIREDO CAMARGO 1233',choice:'bispo',other:'lucas',allies:['duda','nutri'],cursor:0};
env.window.Rig.big=(...args)=>artDraws.push(args);commands.cenario=(_,stage)=>{previewStages.push(stage);return true;};
const badge=new Node('aside');badge.className='creia-net';badge.append(new Node('button'),new Node('p'));body.append(badge);
for(const [w,h]of [[960,540],[844,390],[390,844]]){
 env.window.innerWidth=w;env.window.innerHeight=h;artDraws.length=0;artLabels.length=0;sync();
 assert.deepEqual(artDraws.map(a=>a[1]),['duda','nutri','bispo','lucas'],'prévia não desenhou o time escolhido');
 assert(artDraws.slice(0,2).every(a=>a[7]<artDraws[2][7]),'aliados não estão menores atrás');assert(artDraws.every(a=>a[5]===244),'pés fora da linha');
 assert.equal(previewStages.at(-1),1);assert.deepEqual(artLabels.map(l=>l.text),['P1','P2']);
 for(const l of artLabels){const half=(l.text.length*8+10)/2;assert(l.x-half>=0&&l.x+half<=480&&l.y-3>=0&&l.y+13<=270,'etiqueta sai da arte');const headX=l.text==='P1'?artDraws[2][4]:artDraws[3][4];assert(Math.abs(l.x-headX)>half+40,'etiqueta sobre a cabeça');}
 assert.equal(root.querySelectorAll('select').length,0,'coop ainda usa select');
 assert.equal(root.querySelectorAll('[data-coop-stage]').length,0);
 assert.equal(root.querySelectorAll('[data-coop-phase-dir]').length,0);
 assert.equal(badge.parentElement,root.querySelector('.coop-network'),'selo fora do fluxo do rodapé');
 const fit=env.window.CreiaUI.fit();assert(fit.width<=w&&fit.height<=h);
}
let ally=root.querySelectorAll('[data-coop-ally]')[0];assert.equal(ally.textContent,'duda');assert.equal(ally.getAttribute('aria-pressed'),'true');ally.click();assert.deepEqual(events.at(-1),['coop','clearAlly',0]);
state.coop.allies=[];state.coop.cursor=1;sync();ally=root.querySelectorAll('[data-coop-ally]')[0];assert.equal(ally.textContent,'Sem aliado');assert.equal(ally.getAttribute('aria-pressed'),'false');ally.click();assert.equal(events.at(-1)[1],'cycleAlly');assert.equal(events.at(-1)[2].slot,0);
state.scene='play';sync();assert.equal(badge.parentElement,body,'selo ficou preso à tela oculta');assert(!htmlClasses['creia-coop-screen']);
console.log('Coop: chips, aria-pressed, ações, três tamanhos e selo no rodapé/retorno à luta: OK (DOM/CSS; não é captura visual)');

state.scene='coopSetup';state.coop={host:true,stage:1,place:'FIGUEIREDO CAMARGO 1233',choice:'ricardo',other:'naju',allies:[],cursor:0};
artDraws.length=0;sync();assert.deepEqual(artDraws.map(a=>a[1]),['ricardo','naju'],'prévia manteve o time anterior');assert.equal(previewStages.at(-1),1);
console.log('Coop: prévia do time real, aliados menores, etiquetas dentro da arte e fase inicial fixa: OK');

// Aventura e X1 compartilham montagem, pontos, setas e navegação por rolagem.
for(const key of ['adventureFocus','adventureGo','adventureOpt'])commands[key]=(...args)=>events.push([key,...args]);
state.scene='adventuremenu';state.stage=4;state.adventure={card:0,online:0};state.selection=null;
artDraws.length=0;previewStages.length=0;sync();
const adventureCards=root.querySelectorAll('.x1-card');assert.equal(adventureCards.length,2);assert.equal(root.querySelectorAll('.x1-pontos span').length,2);
assert.deepEqual(adventureCards.map(c=>c.querySelector('h2').textContent),['NA MESMA TELA','AVENTURA ONLINE (BETA)']);
assert.deepEqual(adventureCards.map(c=>c.querySelector('p').textContent),['De 1 a 4 jogadores no mesmo aparelho, no teclado ou no controle.','Cada um no seu aparelho, juntos contra a fome.']);
assert.deepEqual(artDraws.slice(0,4).map(a=>a[1]),['lutador','nutri','bispo','duda']);assert(previewStages.every(s=>s===4),'arte não usa a fase do menu');
adventureCards[0].querySelector('.primary').click();assert.deepEqual(events.at(-1),['adventureGo',0]);
adventureCards[1].onclick();assert.deepEqual(events.at(-1),['adventureFocus',1]);state.adventure.card=1;sync();assert.equal(adventureCards[1].dataset.ativo,'true');
const adventureOnline=root.querySelectorAll('[data-adventure-online]');assert.deepEqual(adventureOnline.map(b=>b.textContent),['Criar sala','Entrar com código']);adventureOnline[1].click();assert.deepEqual(events.slice(-2),[['adventureOpt',1],['adventureGo',1]]);
state.adventure.online=1;sync();assert.equal(adventureOnline[1].getAttribute('aria-pressed'),'true');root.querySelector('.dir').click();assert.deepEqual(events.at(-1),['adventureFocus',0]);
const adventureTrack=root.querySelector('.x1-trilho');adventureTrack.clientWidth=400;adventureTrack.scrollLeft=0;adventureCards.forEach((c,i)=>{c.offsetLeft=i*378;c.offsetWidth=360;});carouselClock=1000;adventureTrack.events.scroll();for(const fn of carouselTimers.values())fn();carouselTimers.clear();assert.deepEqual(events.at(-1),['adventureFocus',0],'deslizar não trocou o cartão');
for(const [w,h]of [[960,540],[844,390],[390,844]]){env.window.innerWidth=w;env.window.innerHeight=h;sync();const fit=env.window.CreiaUI.fit();assert(fit.width<=w&&fit.height<=h);}
console.log('Menu aventura: dois cartões, conteúdo, cenário, arte real, opções online, pontos, setas e deslizar: OK');

state.scene='select';state.selection={tour:16,cursor:0,locked:true,team:[{who:'bispo',ctl:0}],slots:[{pick:0}],message:''};sync();
const random=root.querySelector('.sort-rest');assert(!random.hidden&&!random.disabled);random.click();assert.deepEqual(events.at(-1),['sortTourRest']);
assert.equal(root.querySelector('.sort-rest small').textContent,'R · X / Quadrado');
state.selection.team=Array.from({length:16},(_,i)=>({who:roster[i].who,ctl:null}));sync();assert(random.disabled);
state.selection.tour=0;sync();assert(random.hidden);
