'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs);
assert.equal(require('../js/combate-config.js').virada.spMult,1.1,'virada deve usar o ajuste aprovado de 1,1');
// Dois motores reais ligados pelo relay; os ganchos existem apenas nesta cópia de teste.
let harness=read(path.join(__dirname,'rounds.js'),'utf8').split('function startLocal()')[0];
harness=harness.replace('transport, textSeen,','env, transport, textSeen,');
harness=harness.replace('let nextFrame, peer;', 'let nextFrame, peer, latency=0;const wire=[];');
harness=harness.replace('received.push(msg);', "if(latency&&msg.type==='snapshot'){wire.push({at:clock+latency,run(){received.push(msg);transport.onMessage(msg);}});return;}received.push(msg);");
harness=harness.replace('sent.push(msg);', "sent.push(msg);if(latency&&msg.type==='input'){wire.push({at:clock+latency,run(){relay.message(peer,msg);}});return true;}");
harness=harness.replace('clock+=1000/60; nextFrame(clock);', 'clock+=1000/60;for(let j=wire.length-1;j>=0;j--)if(wire[j].at<=clock){const item=wire.splice(j,1)[0];item.run();}nextFrame(clock);');
harness=harness.replace('env, transport, textSeen,', "env, transport, textSeen,set latency(ms){latency=ms;},down(code){events.keydown({code,preventDefault:noop});},up(code){events.keyup({code});},");
const testFs=Object.assign({},fs,{readFileSync(file,...args){
 let source=read(file,...args);
 if(path.resolve(String(file))===path.join(root,'js/game.js')){
  source=source.replace('  function floatText(x, y, msg, col) {',"  function floatText(x, y, msg, col) {if(msg==='PERFEITA!'){window.__perfectText=(window.__perfectText||0)+1;window.__perfectColor=col;}");
  source=source.replace('  window.__bangu = {',`  window.__perfect={update:updatePlayer,hit:damagePlayer,state:setState,snapshot:onlineSnapshot,reset:resetVersusRound,predict:predictGuest,resetPrediction:resetGuestPrediction,reconcile:reconcileGuest,shots:updateShots,bossHit:hitBoss,melee:meleeHit,atk:ATK, get cam(){return cam;},get time(){return time;},set time(t){time=t;}};
  window.__bangu = {`);
 }
 return source;
}});
const client=new Function('require','__dirname',harness+'\nreturn client;')(name=>name==='node:fs'?testFs:require(name),__dirname);
function local(who='th'){
 const g=client();g.env.__bangu.startTeam([{who,ctl:0},{who:'bispo',ctl:1}],false,true);g.until(s=>s.round.phase==='fight');
 const [p,q]=g.state.players;p.x=g.env.__perfect.cam+160;q.x=p.x+100;p.facing=1;q.facing=-1;p.inv=q.inv=0;
 p.ctrl=q.ctrl={x:0,y:0};return g;
}
function guard(g,p,t){g.env.__perfect.time=t;p.ctrl={x:0,y:0,use:true};g.env.__perfect.update(p,0);assert.equal(p.state,'guard');}
function hit(g,p,q,{age=.08,back=false,special=false,blocked,projectile=false}={}){
 const t=g.env.__perfect;t.time=p.guardStartT+age;return t.hit(p,10,24,p.x+(back?-40:40),'versus',q,special,blocked,projectile);
}
const close=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const age of [0,.08,.12]){
 const g=local(),[p,q]=g.state.players,t=g.env.__perfect;let spawns=0;g.env.DefesaVisual={spawn(){spawns++;}};
 guard(g,p,10);const hp=p.guardHp,atkHp=q.hp;assert.equal(hit(g,p,q,{age}),false);
 assert.equal(p.guardHp,hp);assert.equal(q.hp,atkHp);assert.equal(q.state,'hurt');close(q.perfectStunT,.35);close(p.contraT,.6);
 assert.equal(g.env.__perfectText,1);assert.equal(g.env.__perfectColor,'#ffd34d');assert.equal(spawns,1);
 q.ctrl={x:1,y:0,atk:true,alt:true,spc:true,use:true};t.update(q,.34);assert.equal(q.state,'hurt');assert.equal(q.cd<=0,true);
 q.ctrl={x:0,y:0};t.update(q,.011);assert.equal(q.perfectStunT,0);assert.equal(q.state,'idle');
 hit(g,p,q,{age:.1});assert(p.guardHp<hp,'segunda colisão na mesma guarda foi perfeita');
}
for(const age of [.1201,.3]){const g=local(),[p,q]=g.state.players;guard(g,p,10);hit(g,p,q,{age});assert(p.guardHp<100);assert.equal(p.contraT,0);}
{
 const g=local(),[p,q]=g.state.players,t=g.env.__perfect;
 guard(g,p,10);t.time=10.02;t.update(p,.02);assert.equal(p.guardStartT,10,'manter botão renovou janela');
 p.ctrl={x:0,y:0};t.time=10.1;t.update(p,0);assert.equal(p.guardEndT,10.1);
 guard(g,p,10.2);hit(g,p,q);assert.equal(p.contraT,0,'spam recebeu perfeita');assert(p.guardHp<100);
 p.ctrl={x:0,y:0};t.time=10.3;t.update(p,0);guard(g,p,10.701);const hp=p.guardHp;hit(g,p,q);assert.equal(p.guardHp,hp);assert(p.contraT>0);
}
for(const options of [{back:true},{special:true,blocked:false},{special:true,blocked:true}]){
 const g=local(),[p,q]=g.state.players;guard(g,p,10);hit(g,p,q,options);assert.equal(p.contraT,0);assert.equal(q.perfectStunT,0);
 if(options.blocked)assert(p.guardHp<100);else assert(p.hp<100,'costas/especial sem bloqueio não furou');
}
// A barriga do Cardoso não pode deslocar quem acabou de aparar o golpe.
{
 const g=local('cardoso'),[p,q]=g.state.players,t=g.env.__perfect;
 q.x=p.x+30;q.facing=-1;guard(g,q,10);g.state.bosses.forEach(b=>b.update());
 t.time=10.08;t.melee(p,t.atk.cardoso.barriga);assert.equal(q.guardHp,100);assert(q.contraT>0);assert(!q.edgeFly);assert.equal(p.state,'hurt');
}
// O primário de Marcos tem recuperação de animação como recarga real.
{
 const recovery=[];
 for(const boosted of [false,true]){
  const g=local('lutador'),p=g.state.players[0],t=g.env.__perfect;p.contraT=boosted?.6:0;p.ctrl={x:0,y:0,atk:true};t.update(p,0);p.ctrl={x:0,y:0};let seconds=0;
  while(p.state==='attack1'&&seconds<2){seconds+=.001;t.update(p,.001);}recovery.push(seconds);
 }
 assert(Math.abs(recovery[1]/recovery[0]-.5)<.01);
}
// Os projéteis realmente percorrem a arena, sem atribuir o lado do tiro pelo ponto após atravessar o alvo.
{
 const g=local(),[p,q]=g.state.players,t=g.env.__perfect;guard(g,p,10);
 g.state.bosses.forEach(b=>Object.assign(b,{x:b.vs.x,y:b.vs.y,z:b.vs.z}));
 g.state.shots.push({kind:'note',x:p.x+40,y:p.y,z:25,vx:-600,vy:0,vz:0,grav:0,dmg:10,knock:-50,pierce:1,owner:q,life:1,hit:[],rot:0,vr:0});
 t.time=10.08;t.shots(.08);assert.equal(p.guardHp,100);close(p.contraT,.6);assert.equal(q.state,'hurt');
}
// Consumo pelo próximo ataque aceito, sem aumentar dano, e expiração independente do botão.
for(const action of ['atk','alt']){
 for(const who of Object.keys(require('../js/combate-config.js').primary)){
  const g=local(who),[p,q]=g.state.players,t=g.env.__perfect;
  p.contraT=.6;p.ctrl={x:0,y:0,[action]:true};t.update(p,0);
  assert.equal(p.contraT,0,who+' não consumiu '+action);assert.equal(p.attackKnock,1.5,who);assert.equal(p.attackCdMult,.5,who);
  const cfg=g.env.CreiaCombat;if(action==='alt')close(p.altCd,cfg.secondaryCooldown(who,true)*.5);
  else if(p.cd>0)close(p.cd,cfg.primaryCooldown(who,true)*.5);
  t.state(p,'idle');p.cd=p.altCd=0;t.update(p,0);assert.equal(p.attackKnock,1,who+' reutilizou bônus');
 }
 const g=local(),p=g.state.players[0],t=g.env.__perfect;p.contraT=.6;t.update(p,.61);assert.equal(p.contraT,0);
 p.ctrl={x:0,y:0,[action]:true};t.update(p,0);assert.equal(p.attackKnock,1);
}
{
 const g=local(),[p,q]=g.state.players,t=g.env.__perfect;
 p.contraT=.6;p.ctrl={x:0,y:0,atk:true};t.update(p,0);const shot=g.state.shots[0];assert(shot);assert.equal(shot.counterKnock,1.5);
 const damage=shot.dmg;t.state(p,'idle');p.cd=0;t.update(p,0);assert.equal(p.attackKnock,1);assert.equal(shot.counterKnock,1.5);assert.equal(shot.dmg,damage);
 q.x=260;q.inv=0;t.bossHit(g.state.bosses[1],10,p,false,undefined,24,p.x,true,shot.counterKnock);const boosted=Math.abs(q.kx);q.inv=0;t.bossHit(g.state.bosses[1],10,p,false,undefined,24,p.x,true,1);close(boosted,Math.abs(q.kx)*1.5);
}
{
 const g=local(),p=g.state.players[0],t=g.env.__perfect;p.contraT=.6;p.cd=5;p.ctrl={x:0,y:0,atk:true};t.update(p,0);assert.equal(p.contraT,.6,'tentativa em recarga consumiu contra');
}
console.log('Defesa perfeita: janela 0,12 s, anti spam, costas/especiais, projétil, tontura 0,35 s e contra único/expiração nos 20 personagens: OK');
// Uma tentativa em cinco das defesas elegíveis; guarda tardia intencional no difícil.
{
 const B=require('../js/ia-tatica.js');
 for(const level of ['facil','medio','dificil']){
  let perfect=0;
  for(let i=0;i<1000;i++){
   const m={initialized:true,lastGuard:-10,lastAttack:-10,lastSpecial:-10,spacing:0,threatAt:0,guardRoll:0};
   const o={time:1,threat:true,canGuard:true,perfectReady:true,perfectThreat:true,impactIn:.2};
   const random=()=>((i+.5)/1000);let c=B.decide(o,m,level,random);
   if(level==='dificil'&&i<200){assert(!c.use);o.impactIn=.07;o.time=1.13;c=B.decide(o,m,level,random);}
   assert(c.use);if(m.perfectAttempt)perfect++;
  }
  assert.equal(perfect,level==='dificil'?200:0);
  const g=local(),[p,q]=g.state.players;p.ai=true;p.aiLevel=level;p.aiMemory={perfectAttempt:true};guard(g,p,10);hit(g,p,q);assert.equal(p.contraT>0,level==='dificil');
 }
}
console.log('IA: fácil/médio sem perfeita; difícil tenta 20% e aguarda proximidade do impacto: OK');
{
 const host=client(),guest=client();host.key('Enter');host.key('KeyD');host.key('KeyD');host.key('KeyD');host.key('Enter');guest.transport.join(host.transport.code);host.key('Enter');guest.key('KeyD');guest.key('Enter');host.tick();host.until(s=>s.round.phase==='fight');
 const [q,p]=host.state.players,t=host.env.__perfect;p.inv=q.inv=0;p.x=t.snapshot().cam+260;q.x=p.x-100;p.facing=-1;
 guard(host,p,t.time);t.time=p.guardStartT+.08;t.hit(p,10,24,q.x,'versus',q,false,undefined,true);
 const state=t.snapshot();assert.equal(state.players[1].contraT,.6);assert.equal(state.players[1].guardStartT,Math.round(p.guardStartT*100)/100);assert.equal(state.players[0].perfectStunT,.35);assert.equal(state.perfeitas.length,1);
 let events=0;guest.env.DefesaVisual={spawn(){events++;}};
 guest.transport.onMessage({type:'snapshot',state});guest.transport.onMessage({type:'snapshot',state});assert.equal(events,1,'evento repetiu no snapshot');
 const gt=guest.env.__perfect;gt.resetPrediction(state);assert.equal(guest.online.pred.contraT,.6);
 // Repetir o botão não renova o carimbo da previsão; soltar registra descanso.
 const pred=guest.online.pred;pred.state='idle';pred.actionT=0;pred.guardEndT=-10;pred.contraT=0;
 gt.predict({x:0,y:0,use:true},.016,state);const started=pred.guardStartT;gt.predict({x:0,y:0,use:true},.016,state);assert.equal(pred.guardStartT,started);
 gt.predict({x:0,y:0},.016,state);assert(pred.guardEndT>started);
 pred.contraT=.6;pred.cd=pred.altCd=0;gt.predict({x:0,y:0,atk:true},.016,state);assert.equal(pred.contraT,0);assert.equal(pred.attackCdMult,.5);
 gt.reconcile(Object.assign({},state,{ack:0}));assert.equal(pred.contraT,0,'snapshot antigo duplicou contra');
 host.tick(4);const saved=host.transport.sent.filter(m=>m.type==='snapshot').at(-1).state;
 const resumed=client();resumed.transport.code=host.transport.code;resumed.transport.token=host.transport.token;resumed.transport.resume();
 for(const field of ['guardStartT','guardEndT','guardPerfectReady','contraT','perfectEvent','attackKnock','attackCdMult'])assert.equal(resumed.state.players[1][field],saved.players[1][field],'retomada perdeu '+field);
 assert.equal(resumed.state.players[0].perfectStunT,saved.players[0].perfectStunT);resumed.transport.leave();
 t.reset();assert.equal(host.state.players[1].contraT,0);assert.equal(t.snapshot().perfeitas.length,0);
 host.transport.leave();
}
console.log('Online: snapshot, evento único e previsão/consumo sem duplicação: OK');
for(const delay of [0,50,150,300]){
 const host=client(),guest=client();host.key('Enter');host.key('KeyD');host.key('KeyD');host.key('KeyD');host.key('Enter');guest.transport.join(host.transport.code);host.key('Enter');guest.key('KeyD');guest.key('Enter');host.tick();host.until(s=>s.round.phase==='fight');
 host.latency=guest.latency=delay;let effects=0;guest.env.DefesaVisual={spawn(){effects++;}};
 const [q,p]=host.state.players,t=host.env.__perfect;guest.down('KeyE');
 for(let n=0;n<90&&p.state!=='guard';n++){guest.tick();host.tick();}
 assert.equal(p.state,'guard','entrada da defesa não chegou sob atraso '+delay);
 assert.equal(guest.online.pred.state,'guard');const start=p.guardStartT;
 for(let n=0;n<2;n++){guest.tick();host.tick();}
 assert(t.time-start<=.12);p.inv=0;p.facing=q.x<p.x?-1:1;
 const hp=p.guardHp;t.hit(p,10,24,q.x,'versus',q,false,undefined,true);
 assert.equal(p.guardHp,hp);assert(p.contraT>0,'janela falhou sob atraso '+delay);
 for(let n=0;n<90&&effects===0;n++){host.tick();guest.tick();}
 assert.equal(effects,1,'snapshot do evento não chegou sob atraso '+delay);
 guest.up('KeyE');host.transport.leave();
}
console.log('Online com transporte atrasado em 0/50/150/300 ms por sentido: defesa e evento confirmados; janela mantida em 0,12 s: OK');
