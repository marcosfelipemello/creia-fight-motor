// Integração do Cardoso no combate, no X1 e na campanha inteira.
// Uso: node tests/cardoso.js
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const scripts=['sprites','backgrounds','bosses','viloes','cenarios-arte','criancas','bichos','objetos','rig','combate-config','ia-tatica','hud-combate','game'];
const noop=()=>{};

function client() {
  let nextFrame,clock=0;
  const events={}, textSeen=new Set();
  const ctx=new Proxy({}, {get(_,key) {
    if(key==='measureText') return s=>({width:String(s).length*8});
    if(key==='fillText') return s=>textSeen.add(String(s));
    if(key==='createLinearGradient'||key==='createRadialGradient') return ()=>({addColorStop:noop});
    return noop;
  },set:()=>true});
  const canvas=()=>({width:480,height:270,getContext:()=>ctx,getBoundingClientRect:()=>({width:480,height:270})});
  const env={console,Math,Date,TextEncoder,URLSearchParams,performance:{now:()=>clock},
    location:{search:'',hostname:'127.0.0.1'},navigator:{maxTouchPoints:0},devicePixelRatio:1,
    Image:class {set src(v){this.complete=true;this.naturalWidth=100;}},
    localStorage:{getItem:()=>JSON.stringify({tut:true,best:10}),setItem:noop},
    document:{getElementById:canvas,createElement:canvas,head:{appendChild:noop},body:{appendChild:noop}},
    addEventListener:(name,fn)=>{events[name]=fn;},requestAnimationFrame:fn=>{nextFrame=fn;},setTimeout,clearTimeout};
  env.window=env; vm.createContext(env);
  for(const name of scripts) vm.runInContext(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'),env,{filename:name+'.js'});
  return {api:env.__bangu,textSeen,
    tick(n=1){for(let i=0;i<n;i++){clock+=1000/60;nextFrame(clock);}},
    key(code){events.keydown({code,preventDefault:noop});this.tick();events.keyup({code});},
    until(fn,max=900){for(let i=0;i<max&&!fn();i++)this.tick();assert(fn(),'estado esperado não chegou');}};
}

const c=client();c.api.start(16,1);
assert.deepEqual(Array.from(c.api.state.players,p=>p.who),['nutri','lutador','emanuelly','cardoso']);
const p=c.api.state.players[3];
assert.equal(p.ai,false);
for(const q of c.api.state.players) if(q!==p) q.x=p.x-300;
const e=c.api.cardosoTest.spawn('fome',p.x+36,p.y);e.hp=100;e.stun=10;e.kx=0;
c.key('KeyJ');c.tick(15);
assert(e.hp<100,'braço do baixo não acertou');
console.log('Braço do contrabaixo: OK');

p.cd=0;p.altCd=0;p.state='idle';p.st=0;
const belly=c.api.cardosoTest.spawn('fome',p.x+38,p.y);belly.hp=100;belly.stun=10;belly.kx=0;
c.key('KeyI');c.tick(36);
assert(belly.hp<100,'barrigada não causou dano');
assert(belly.x>=c.api.state.cam+480-belly.w/2-30,'barrigada não levou o monstro à borda');
assert(belly.stun>0,'monstro não caiu atordoado');
console.log('Barrigada até a borda: OK');

c.api.state.enemies.length=0;
const still=c.api.cardosoTest.spawn('fome',p.x+110,p.y);still.stun=999;still.kx=0;
p.state='idle';p.st=0;p.sp=100;
c.key('KeyL');c.tick(75);
assert.equal(p.state,'special');
const before=still.x;c.tick(30);
assert.equal(still.x,before,'mundo continuou durante o close');
c.until(()=>p.limadoT>0,180);
assert(c.textSeen.has('LIMADOS')&&c.textSeen.has('COM SUCESSO!'),'close não apareceu');
assert.equal(Math.ceil(p.limadoT),5);
const mate=c.api.state.players[0], hp=mate.hp;
c.api.cardosoTest.shoot({x:p.x+50,y:p.y,vx:-100});
assert.equal(c.api.state.eshots.length,0,'inimigo conseguiu atirar durante o efeito');
c.api.cardosoTest.enemyHit(mate,10,p.x+40);
c.api.cardosoTest.bossHit(mate,10);
assert.equal(mate.hp,hp,'equipe sofreu dano durante o efeito');
c.tick();assert(c.textSeen.has('LIMADO!'),'aviso de ataque limado ausente');
c.api.state.enemies.length=0;
c.until(()=>p.limadoT===0,360);
mate.inv=0;const after=mate.hp;
c.api.cardosoTest.enemyHit(mate,10,p.x+40);
assert(mate.hp<after,'dano não voltou após 5 s');
c.api.cardosoTest.shoot({x:p.x+50,y:p.y,vx:-100});
assert(c.api.state.eshots.length>0,'tiros não voltaram após 5 s');
console.log('Close, imunidade 5 s, tiros e dano restaurados: OK');

const x1=client();x1.api.cardosoTest.versus('cardoso','lucas');
x1.until(()=>x1.api.state.round.phase==='fight',150);
const a=x1.api.state.players[0],b=x1.api.state.players[1];
b.x=a.x+36;b.y=a.y;b.inv=0;
x1.key('KeyI');x1.until(()=>!b.edgeFly&&b.x>=x1.api.state.cam+480-30,60);
assert(b.x>=x1.api.state.cam+480-30,'barrigada no X1 não levou ao canto');
b.x=a.x+70;b.y=a.y;b.inv=0;a.state='idle';a.st=0;a.sp=100;
x1.key('KeyL');x1.until(()=>a.limadoT>0,300);
const xhp=a.hp;
x1.api.cardosoTest.versusHit(b,a,20);
assert.equal(a.hp,xhp,'adversário feriu Cardoso durante o efeito');
x1.until(()=>a.limadoT===0,360);
a.inv=0;x1.api.cardosoTest.versusHit(b,a,20);
assert(a.hp<xhp,'golpes do adversário não voltaram após 5 s');
console.log('Barrigada e proteção no X1: OK');

const run=client();run.api.start(16,1);
let lastStage=1;
for(let i=0;i<50&&run.api.state.scene==='play';i++) {
  const state=run.api.sim(60,true);
  if(state.stage>lastStage) lastStage=state.stage;
}
assert.equal(run.api.state.scene,'ending','campanha não chegou ao final: '+JSON.stringify(run.api.state));
assert.equal(lastStage,10);
console.log('Campanha de 10 fases com Cardoso até ending: OK');
