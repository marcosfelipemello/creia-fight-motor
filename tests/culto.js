// Fluxo real do motor, dois clientes independentes, transporte real e desenho compartilhado.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs);
let harness=read(path.join(__dirname,'rounds.js'),'utf8').split('function startLocal()')[0];
harness=harness.replace("'hud-combate','game'","'hud-combate','culto-visual','game'");
harness=harness.replace('transport, textSeen,','env, events, transport, textSeen,');
const testFs=Object.assign({},fs,{readFileSync(file,...args){
 let s=read(file,...args);
 if(path.resolve(String(file))===path.join(root,'js/game.js'))s=s.replace('  function sfx(n) {', '  function sfx(n) { (window.__cultoSounds=window.__cultoSounds||[]).push(n);').replace('  window.__bangu = {',`  window.__cultoTest={apresentador:cultoApresentador,reset:resetVersusRound,pular:pularCulto,snapshot:onlineSnapshot,cinematic:cinematicActive,
    get touch(){return touchPressed;},get pressed(){return pressed;}};
  window.__bangu = {`);
 if(path.resolve(String(file))===path.join(root,'js/culto-visual.js'))s+=`
  window.__cultoCalls=[];
  for(const method of ['abertura','encerramento']){const original=CultoVisual[method];CultoVisual[method]=function(ctx,W,H,o){window.__cultoCalls.push({method,...o});return original(ctx,W,H,o);};}
 `;
 return s;
}});
const client=new Function('require','__dirname',harness+'\nreturn client;')(n=>n==='node:fs'?testFs:require(n),__dirname);
function local(a='lutador',b='fidelis',ai=false){const g=client();g.env.__bangu.startTeam([{who:a,ctl:ai?null:0},{who:b,ctl:ai?null:1}],false,true,true);return g;}
function ko(g,w){g.until(s=>s.round.phase==='fight');g.state.players[1-w].hp=0;g.state.players[1-w].dead=true;g.tick();assert.equal(g.state.round.phase,'ko');}
for(const [a,b,who] of [['lutador','fidelis','bispo'],['bispo','naju','lucas'],['naju','bispo','lucas'],['bispo','lucas','arthur'],['lucas','bispo','arthur']]){
 const g=local(a,b);g.tick();assert.equal(g.env.__cultoTest.cinematic(),true);assert.equal(g.state.round.phase,'culto');assert.equal(g.env.__cultoCalls.at(-1).apresentador,who);assert(g.textSeen.has('Que'),'a fala começa pela primeira sílaba');assert(!g.textSeen.has('Que vença o mais ungido!'),'a frase não aparece inteira de uma vez');g.tick(130);assert(g.textSeen.has('Que vença o mais ungido!'),'a frase completa aparece no fim da fala');
 g.env.__bangu.startTeam([{who:a,ctl:0}],false,false);assert.equal(g.state.round,null,'aventura entrou no culto');
}
const auto=local('lutador','fidelis',true);auto.tick(135);assert.equal(auto.state.round.phase,'culto');auto.tick(9);assert.equal(auto.state.round.phase,'intro');assert(auto.env.__cultoCalls.some(c=>c.contagem==='3'));auto.tick(25);assert(auto.env.__cultoCalls.some(c=>c.contagem==='2'));auto.tick(24);assert(auto.env.__cultoCalls.some(c=>c.contagem==='1'));auto.until(s=>s.round.phase==='fight');assert(auto.textSeen.has('LUTEM!'));assert.equal(auto.env.__cultoTest.cinematic(),false);assert.deepEqual(Array.from(auto.env.__cultoSounds).filter(n=>['culto','culto_tick','go'].includes(n)),['culto','culto_tick','culto_tick','culto_tick','go']);
for(const code of ['KeyJ','Enter','KeyQ','Escape','KeyP']){
 const g=local(),x=g.state.players[0].x;g.key(code);assert.equal(g.state.round.phase,'intro',code+' não pulou');assert.equal(g.state.players[0].x,x);assert.equal(g.state.players[0].state,'idle');
}
const pointer=local();pointer.events.pointerdown({target:{},button:0});assert.equal(pointer.state.round.phase,'intro');
const pad=local();pad.env.navigator.getGamepads=()=>[{connected:true,index:0,id:'Xbox',buttons:Array.from({length:12},(_,i)=>({pressed:i===10})),axes:[]}];pad.tick();assert.equal(pad.state.round.phase,'intro','botão sem ação mapeada não pulou');
const touch=local();touch.env.__cultoTest.touch.add('KeyJ');touch.env.__cultoTest.pressed.add('KeyJ');touch.tick();assert.equal(touch.state.round.phase,'intro');
const g=local();ko(g,0);g.until(s=>s.round.phase==='intro');assert.equal(g.state.round.number,2);assert.equal(g.state.round.contagem,false);ko(g,1);g.until(s=>s.round.phase==='intro');assert.equal(g.state.round.number,3);assert.equal(g.state.round.contagem,false);ko(g,1);g.until(s=>s.round.phase==='match');g.tick(270);   // a fala do vencedor termina
assert.equal(g.env.__cultoCalls.at(-1).method,'encerramento');assert.equal(g.env.__cultoCalls.at(-1).nome,'FIDELIS');assert(g.textSeen.has('A vitória é do Senhor… mas o X1 foi de FIDELIS!'));
const empate=local();empate.until(s=>s.round.phase==='fight');empate.state.players.forEach(p=>{p.hp=0;p.dead=true;});empate.tick();empate.until(s=>s.round.phase==='intro');assert.equal(empate.state.round.number,1);assert.equal(empate.state.round.contagem,false,'empate repetiu a abertura');
const host=client(),guest=client();host.key('Enter');host.key('KeyD');host.key('KeyD');host.key('KeyD');host.key('Enter');guest.transport.join(host.transport.code);host.key('Enter');guest.key('KeyD');guest.key('Enter');host.tick(4);guest.tick();
assert.equal(host.state.round.phase,'culto');const snap=host.transport.sent.filter(m=>m.type==='snapshot').at(-1).state;assert.equal(snap.round.phase,'culto');assert(snap.round.t>0);assert(guest.env.__cultoCalls.some(c=>c.method==='abertura'&&c.apresentador==='arthur'));
guest.key('KeyQ');guest.key('KeyJ');guest.events.pointerdown({target:{}});host.tick();assert.equal(host.state.round.phase,'culto','convidado pulou abertura');assert.equal(guest.env.__cultoTest.pular(),false);
host.key('KeyQ');assert.equal(host.state.round.phase,'intro');host.tick(3);guest.tick();assert(guest.env.__cultoCalls.some(c=>c.contagem==='3'));assert(host.transport.sent.some(m=>m.type==='snapshot'&&m.state.round.contagem));
assert(host.transport.sent.some(m=>m.type==='snapshot'&&m.state.sounds.some(e=>e[1]==='culto_tick')));
let settings;guest.env.CreiaSettings={sync:o=>{settings=o;}};
ko(host,1);host.until(s=>s.round.phase==='intro');ko(host,1);host.until(s=>s.round.phase==='match');host.tick(270);guest.tick();
assert.equal(guest.env.__cultoTest.cinematic(),true);assert.equal(settings.online.result,undefined,'painel de revanche cobriu o encerramento');
const end=guest.env.__cultoCalls.at(-1);assert.equal(end.method,'encerramento');assert.equal(end.nome,'LUCAS GARCIA');assert.equal(end.apresentador,'arthur');assert(guest.textSeen.has('A vitória é do Senhor… mas o X1 foi de LUCAS GARCIA!'));host.tick(245);guest.tick();assert.equal(guest.env.__cultoTest.cinematic(),false);assert.equal(settings.online.result,1,'revanche não voltou após a fala');host.transport.leave();
console.log('Culto: apresentadores, duração, 3/2/1/LUTEM, entrada local/controle/toque, empate, rounds 2/3, snapshot, autoridade e encerramento no convidado: OK');
