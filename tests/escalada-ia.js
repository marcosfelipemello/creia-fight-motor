'use strict';
// Dificuldade contínua da IA (7.1): interpolação 0..1,15, compatibilidade e simulação X1.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const C=require('../js/combate-config.js');
const B=require('../js/ia-tatica.js');

// 1. As strings antigas devolvem os mesmos valores de antes e os objetos canônicos estão preservados.
const canonicalKeys=['reaction','think','attackGap','guardChance','specialChance','guardHold','spacingError'];
assert.deepEqual(C.levels.facil,{reaction:.42,think:.22,attackGap:.48,guardChance:.2,specialChance:.35,guardHold:.22,spacingError:24});
assert.deepEqual(C.levels.medio,{reaction:.22,think:.13,attackGap:.27,guardChance:.58,specialChance:.7,guardHold:.38,spacingError:10});
assert.deepEqual(C.levels.dificil,{reaction:.1,think:.065,attackGap:.13,guardChance:.9,specialChance:1,guardHold:.5,spacingError:2});

assert.deepEqual(C.levelAt('facil'),C.levels.facil);
assert.deepEqual(C.levelAt('medio'),C.levels.medio);
assert.deepEqual(C.levelAt('dificil'),C.levels.dificil);

assert.deepEqual(C.levelAt(.33),C.levels.facil);
assert.deepEqual(C.levelAt(.66),C.levels.medio);
assert.deepEqual(C.levelAt(1),C.levels.dificil);

// 2. Os parâmetros ficam mais fortes a cada passo de 0 a 1,15.
const l0=C.levelAt(0),l115=C.levelAt(1.15);
assert(l0.reaction>C.levels.facil.reaction,'0 deve ter reação mais lenta que o fácil');
assert(l0.spacingError>C.levels.facil.spacingError,'0 deve ter mais erro de distância que o fácil');
assert(l0.guardChance<C.levels.facil.guardChance,'0 deve defender menos que o fácil');

assert(l115.reaction<C.levels.dificil.reaction,'1,15 mestre deve ter reação mais rápida que o difícil');
assert(l115.spacingError<C.levels.dificil.spacingError,'1,15 mestre deve ter menos erro de distância que o difícil');
assert(l115.guardChance>C.levels.dificil.guardChance,'1,15 mestre deve ter mais defesa que o difícil');

let prev=l0;
for(let step=1;step<=115;step++){
 const x=step/100,curr=C.levelAt(x);
 assert.deepEqual(Object.keys(curr).sort(),canonicalKeys.slice().sort());
 assert(curr.reaction<=prev.reaction,'reaction não pode aumentar em '+x);
 assert(curr.think<=prev.think,'think não pode aumentar em '+x);
 assert(curr.attackGap<=prev.attackGap,'attackGap não pode aumentar em '+x);
 assert(curr.guardChance>=prev.guardChance,'guardChance não pode diminuir em '+x);
 assert(curr.specialChance>=prev.specialChance,'specialChance não pode diminuir em '+x);
 assert(curr.guardHold>=prev.guardHold,'guardHold não pode diminuir em '+x);
 assert(curr.spacingError<=prev.spacingError,'spacingError não pode aumentar em '+x);
 prev=curr;
}

// Limites e bordas
assert.deepEqual(C.levelAt(-1),l0);
assert.deepEqual(C.levelAt(2),l115);
assert.deepEqual(C.levelAt(NaN),C.levels.medio);

// 3. IA aceita nível numérico e regra de defesa perfeita passa a valer para >= 0,9.
for(const lvl of [0.1, 0.5, 0.89, 0.9, 1.0, 1.15]){
 let perfect=0;
 for(let i=0;i<1000;i++){
  const m={initialized:true,lastGuard:-10,lastAttack:-10,lastSpecial:-10,spacing:0,threatAt:0,guardRoll:0};
  const o={time:1,threat:true,canGuard:true,perfectReady:true,perfectThreat:true,impactIn:.2};
  const random=()=>((i+.5)/1000);
  let c=B.decide(o,m,lvl,random);
  if(lvl>=0.9&&i<200){o.impactIn=.07;o.time=1.13;c=B.decide(o,m,lvl,random);}
  if(m.perfectAttempt)perfect++;
 }
 assert.equal(perfect,lvl>=0.9?200:0,'defesa perfeita em '+lvl);
}

// 4. Simulação de X1 de IA contra IA carregando o motor (30 lutas para 0.1, 0.5 e 1.1 contra fixo 0.5).
const scripts=['sprites','backgrounds','bosses','viloes','cenarios-arte','criancas','bichos','objetos','rig','combate-config','ia-tatica','hud-combate','game'];
const noop=()=>{};
function createEngine(){
 let clock=0;
 const ctx=new Proxy({},{
  get(_,key){
   if(key==='measureText')return ()=>({width:10});
   if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>({addColorStop:noop});
   return noop;
  },
  set:()=>true
 });
 const canvas=()=>({width:480,height:270,getContext:()=>ctx,getBoundingClientRect:()=>({width:480,height:270})});
 const env={
  console,Math,Date,TextEncoder,URLSearchParams,
  performance:{now:()=>clock},
  location:{search:'',hostname:'127.0.0.1'},
  navigator:{maxTouchPoints:0},
  devicePixelRatio:1,
  Image:class{set src(v){this.complete=true;this.naturalWidth=100;}},
  localStorage:{getItem:()=>JSON.stringify({tut:true,best:10}),setItem:noop},
  document:{getElementById:canvas,createElement:canvas,head:{appendChild:noop},body:{appendChild:noop}},
  addEventListener:noop,
  requestAnimationFrame:noop,
  setTimeout,clearTimeout
 };
 env.window=env;
 vm.createContext(env);
 for(const name of scripts){
  vm.runInContext(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'),env,{filename:name+'.js'});
 }
 return env;
}

function simulateMatch(env,charA,charB,lvlA,lvlB,maxSeconds=90){
 env.__bangu.startTeam([{who:charA,ctl:0,difficulty:lvlA},{who:charB,ctl:1,difficulty:lvlB}],false,true);
 const round=env.__bangu.state.round,step=1;
 let elapsed=0;
 while(elapsed<maxSeconds&&round.matchWinner===null){
  env.__bangu.sim(step,false);
  elapsed+=step;
 }
 if(round.matchWinner!==null)return round.matchWinner;
 if(round.wins[0]>round.wins[1])return 0;
 if(round.wins[1]>round.wins[0])return 1;
 const p0=env.__bangu.state.players[0],p1=env.__bangu.state.players[1];
 return p0.hp>=p1.hp?0:1;
}

const env=createEngine();
const N=30;
let wins01=0,wins05=0,wins11=0;
for(let i=0;i<N;i++)if(simulateMatch(env,'nutri','nutri',0.1,0.5)===0)wins01++;
for(let i=0;i<N;i++)if(simulateMatch(env,'nutri','nutri',0.5,0.5)===0)wins05++;
for(let i=0;i<N;i++)if(simulateMatch(env,'nutri','nutri',1.1,0.5)===0)wins11++;

assert(wins01<wins05,'taxa de vitória no nível 0,1 ('+wins01+') deve ser menor que no 0,5 ('+wins05+')');
assert(wins05<wins11,'taxa de vitória no nível 0,5 ('+wins05+') deve ser menor que no 1,1 ('+wins11+')');

console.log('IA contínua: parâmetros progressivos, compatibilidade legada e taxa de vitória crescente: OK');
