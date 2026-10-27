'use strict';
// Torneio: seleção de 4, chave sorteada, vencedores sobem, campeão e saída.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs);
let harness=read(path.join(__dirname,'cardoso.js'),'utf8').split('const c=client();')[0];
harness=harness.replace('return {api:env.__bangu,textSeen,','return {env,api:env.__bangu,textSeen,');
fs.readFileSync=function(file,...args){
 if(path.resolve(String(file))===path.join(root,'js/game.js'))return read(file,...args).replace('  window.__bangu = {','  window.__tourTest={bridge:uiBridge,ui:modernUIState,get stSel(){return stSel;}};\n  window.__bangu = {');
 return read(file,...args);
};
try{
 const g=new Function('require','__dirname',harness+'\nreturn client;')(require,__dirname)(),b=g.env.__tourTest.bridge,api=g.api;
 b.mode('eve');b.x1(3);g.tick();assert.equal(api.state.scene,'select');
 for(let i=0;i<4;i++){b.pick(i);g.tick(2);}
 assert.equal(g.env.__tourTest.ui().selection.team.length,4);
 b.pick(5);g.tick(2);assert.equal(api.state.scene,'select','quinto lutador não pode entrar');
 b.pick(g.env.__tourTest.ui().roster.length);g.tick(2);
 assert.equal(api.state.scene,'stagesel');g.key('Escape');assert.equal(api.state.scene,'select','ESC não voltou para a seleção');
 b.pick(g.env.__tourTest.ui().roster.length);g.tick(2);g.key('Enter');
 assert.equal(api.state.scene,'tour');const t=api.tour;assert.equal(new Set(t.rounds[0]).size,4);
 function play(winner){
  const pair=[t.rounds[t.r][t.m*2],t.rounds[t.r][t.m*2+1]];
  g.tick(30);g.key('Enter');assert.equal(api.state.scene,'play');assert.deepEqual(Array.from(api.state.players,p=>p.who),pair);
  while(api.state.scene==='play'){
   g.until(()=>api.state.round.phase==='fight',200);
   const loser=api.state.players[1-winner];loser.hp=0;loser.dead=true;
   g.until(()=>api.state.scene!=='play'||api.state.round.phase==='intro',400);
  }
  assert.equal(api.state.scene,'tour');return pair[winner];
 }
 const a=play(0),c=play(1);assert.deepEqual(Array.from(t.rounds[1]),[a,c]);assert.equal(t.r,1);assert.equal(t.champ,null);
 const champ=play(0);assert.equal(champ,a);assert.equal(t.champ,a);
 g.key('Enter');assert.equal(api.state.scene,'tour','campeão some rápido demais');g.tick(100);g.key('Enter');assert.equal(api.state.scene,'menu');assert.equal(api.tour,null);
 // ESC uma vez avisa, duas vezes sai
 b.x1(4);g.tick();for(let i=0;i<8;i++){b.pick(i);g.tick(2);}b.pick(g.env.__tourTest.ui().roster.length);g.tick(2);g.env.__tourTest.stSel.cur=0;for(let i=0;i<4;i++)g.key('ArrowRight');g.key('Enter');
 assert.equal(api.tour.size,8);assert.equal(api.tour.stage,4);assert.equal(api.tour.cur,4);g.key('Escape');assert.equal(api.state.scene,'tour');g.key('Escape');assert.equal(api.state.scene,'menu');
 // X1 local: o cenário escolhido é onde a luta acontece; aleatório sorteia uma das 10 fases
 b.x1(0);g.tick();b.pick(0);g.tick(2);b.pick(1);g.tick(2);b.pick(g.env.__tourTest.ui().roster.length);g.tick(2);
 assert.equal(api.state.scene,'stagesel');g.env.__tourTest.stSel.cur=0;for(let i=0;i<7;i++)g.key('ArrowRight');g.key('Enter');
 g.until(()=>api.state.scene==='play',600);assert.equal(api.state.stage,7);
 // Tela do X1 em cartões: setas laterais trocam o cartão, cima/baixo a opção, ENTER escolhe
 b.menu(0);b.x1Focus(0);g.tick();assert.equal(api.state.scene,'x1menu');
 for(let i=0;i<4;i++)g.key('ArrowRight');assert.equal(g.env.__tourTest.ui().x1,4,'4 setas = cartão do torneio');
 g.key('ArrowDown');g.key('ArrowDown');assert.equal(g.env.__tourTest.ui().x1Opt.torneio,2,'cima/baixo escolhem o tamanho');
 g.key('ArrowLeft');g.key('ArrowLeft');g.key('ArrowLeft');g.key('ArrowLeft');g.key('ArrowLeft');assert.equal(g.env.__tourTest.ui().x1,5,'volta pela esquerda dá a volta');
 g.key('Escape');
 // Torneio de 12: chave de 16 com 4 folgas; quem folga passa direto e ninguém luta contra vazio
 b.x1Opt('torneio',2);b.x1Go(4);g.tick();assert.equal(api.state.scene,'select');
 for(let i=0;i<12;i++){b.pick(i);g.tick(2);}b.pick(g.env.__tourTest.ui().roster.length);g.tick(2);g.key('Enter');
 assert.equal(api.state.scene,'tour');const t12=api.tour;assert.equal(t12.size,16);
 const r0=Array.from(t12.rounds[0]);assert.equal(r0.filter(w=>w==null).length,4);assert.equal(new Set(r0.filter(Boolean)).size,12);
 for(let i=0;i<16;i+=2)assert.ok(r0[i]||r0[i+1],'par sem ninguém');
 assert.ok(t12.rounds[t12.r][t12.m*2]&&t12.rounds[t12.r][t12.m*2+1],'a luta da vez tem dois lutadores');
 g.key('Escape');g.key('Escape');assert.equal(api.state.scene,'menu');
 // Torneio de 16: chave cheia, sem folga
 b.x1Opt('torneio',3);b.x1Go(4);g.tick();for(let i=0;i<16;i++){b.pick(i);g.tick(2);}b.pick(g.env.__tourTest.ui().roster.length);g.tick(2);g.key('Enter');
 assert.equal(api.tour.size,16);assert.equal(Array.from(api.tour.rounds[0]).filter(Boolean).length,16);
 g.key('Escape');g.key('Escape');
 // Botão, teclado e controle completam sem trocar as escolhas já feitas.
 for(let sizeIndex=0;sizeIndex<4;sizeIndex++){
  const size=[4,8,12,16][sizeIndex];b.x1Opt('torneio',sizeIndex);b.x1Go(4);g.tick();
  b.pick(3);g.tick(2);b.pick(7);g.tick(2);
  const original=Array.from(g.env.__tourTest.ui().selection.team,m=>m.who);
  if(sizeIndex===1)g.key('KeyR');else b.sortTourRest();g.tick();
  const team=Array.from(g.env.__tourTest.ui().selection.team,m=>m.who);
  assert.equal(team.length,size);assert.equal(new Set(team).size,size);assert.deepEqual(team.slice(0,2),original);
  b.sortTourRest();g.key('KeyR');assert.deepEqual(Array.from(g.env.__tourTest.ui().selection.team,m=>m.who),team,'repetir sorteio mudou time cheio');
 }
 b.x1Go(4);g.tick();b.sortTourRest();assert.equal(g.env.__tourTest.ui().selection.team.length,16,'sorteio vazio não completou');
 console.log('torneio e cenário: ok');
}finally{fs.readFileSync=read;}
