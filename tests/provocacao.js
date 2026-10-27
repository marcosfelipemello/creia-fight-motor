// Motor real, controles e transporte da provocação. Uso: node tests/provocacao.js
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs),noop=()=>{};
const bordoes=require('../js/bordoes.js');
let harness=read(path.join(__dirname,'rounds.js'),'utf8').split('function startLocal()')[0];
harness=harness.replace("'combate-config','ia-tatica'", "'preferencias','bordoes','combate-config','ia-tatica'");
harness=harness.replace('const events = {}, received', 'const elements=[],events = {}, received');
harness=harness.replace('return {width:480,height:270,getContext', `return {style:{},events:{},classList:{add:noop,remove:noop,toggle:noop},
 setAttribute(k,v){this[k]=v;},addEventListener(k,f){this.events[k]=f;},appendChild:noop,setPointerCapture:noop,width:480,height:270,getContext`);
harness=harness.replace('body:{appendChild:noop}', 'body:{appendChild:n=>elements.push(n)}');
harness=harness.replace('navigator:{maxTouchPoints:0}', 'navigator:{maxTouchPoints:mobile?1:0}');
harness=harness.replace('function client() {','function client(mobile=false) {');
harness=harness.replace('transport, textSeen,','env, events, elements, transport, textSeen,');
const testFs=Object.assign({},fs,{readFileSync(file,...args){
 let source=read(file,...args);
 if(path.resolve(String(file))===path.join(root,'js/combate-config.js'))source=source.replace('ativa:false','ativa:true');   // a provocação está guardada (desligada); o teste liga para exercitar o motor
 if(path.resolve(String(file))===path.join(root,'js/game.js')){
  source=source.replace('  window.__bangu = {',`  window.__zoa={can:canTaunt,hit:damagePlayer,drain:specialDrain,ai:aiControl,draw:drawTaunts,snapshot:onlineSnapshot,stage:startStage,reset:resetVersusRound,
   advance:function(p,ctrl,dt){p.ctrl=Object.assign({x:0,y:0},ctrl);time+=dt;updatePlayer(p,dt);},
   get time(){return time;},set time(v){time=v;},get cam(){return cam;}};
  window.__bangu = {`);
 }
 return source;
}});
const factory=new Function('require','__dirname','mobile',harness+'\nreturn client;')(n=>n==='node:fs'?testFs:require(n),__dirname,false);
// A tecla nova não apaga os remapeamentos válidos dos saves anteriores.
{
 const saved={keyboard:[{atk:'KeyO'},{alt:'BracketLeft'}]},env={localStorage:{getItem:()=>JSON.stringify(saved),setItem:noop}};
 require('node:vm').runInNewContext(read(path.join(root,'js/preferencias.js'),'utf8'),env);
 const bindings=env.CreiaPreferences.bindings();
 assert.equal(bindings[0].atk[0],'KeyO');assert.equal(bindings[1].alt[0],'BracketLeft');
 const codes=bindings.flatMap(p=>Object.values(p).flat());assert.equal(new Set(codes).size,codes.length);
}
function local(vs=true,mobile=false,team){
 const g=factory(mobile);g.env.__bangu.startTeam(team||[{who:'nutri',ctl:0},{who:'lutador',ctl:1}],false,vs);
 if(vs)g.until(s=>s.round.phase==='fight');
 g.state.players.forEach(p=>{p.sp=0;p.inv=0;});return g;
}
function step(g,p,ctrl={},n=1){for(let i=0;i<n;i++)g.env.__zoa.advance(p,ctrl,.05);}
function near(a,b){assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);}
// Ganho exato separado da regeneração passiva; bloqueia todas as ações por um segundo.
for(const who of Object.keys(require('../js/combate-config.js').primary)){
 const g=local(true,false,[{who,ctl:0},{who:who==='lutador'?'nutri':'lutador',ctl:1}]);
 const [p,q]=g.state.players,x=p.x,y=p.y,hp=q.hp,sp=q.sp,regen=who==='duda'?.7:1.5;
 step(g,p,{taunt:true,atk:true,alt:true,spc:true,jump:true,use:true,x:1,y:1});
 assert.equal(p.state,'taunt');near(p.tauntCd,6);assert.equal(p.inv,0);
 assert.equal(p.tauntFala,bordoes.fala(who,q.who));
 step(g,p,{atk:true,alt:true,spc:true,jump:true,use:true,x:1,y:1},19);
 assert.equal(p.state,'taunt');near(p.sp,regen);assert.equal(p.x,x);assert.equal(p.y,y);assert.equal(p.z,0);
 step(g,p);assert.equal(p.state,'idle');near(p.sp,regen*1.05+8);
 assert.equal(q.hp,hp);assert.equal(q.sp,sp);assert.equal(g.state.shots.length,0);
 step(g,p,{taunt:true});assert.equal(p.state,'idle','reutilizou antes de 6s');
 step(g,p,{},90);assert(p.tauntCd>0);step(g,p,{},20);step(g,p,{taunt:true});assert.equal(p.state,'taunt');
}
console.log('20 lutadores: 1s exposto, +8 exatos, recarga de 6s e nenhum ataque: OK');
// Golpe real cancela; escudo e invencibilidade anteriores não tornam a provocação segura.
for(const mode of ['hit','drain']){
 const g=local(),[p,q]=g.state.players;p.shield=5;p.inv=5;p.limadoT=5;
 step(g,p,{taunt:true});assert.equal(p.inv,0);
 if(mode==='hit')assert(g.env.__zoa.hit(p,10,0,p.x+30,'versus',q));
 else g.env.__zoa.drain(p,q,3,5,4);
 assert(p.hp<100);assert.equal(p.state,'hurt');p.sp=0;p.shield=0;p.limadoT=0;
 step(g,p,{},25);near(p.sp,1.875);assert(p.tauntCd>0);
}
{
 const g=local(),p=g.state.players[0];let bonus=0,finished=0;
 for(let i=0;i<1200;i++){
  p.sp=0;const old=p.state;step(g,p,{taunt:true});
  const extra=p.sp-.075;bonus+=extra;if(old==='taunt'&&p.state==='idle')finished++;
 }
 near(bonus,finished*8);assert(finished>=9&&finished<=10);assert(bonus/60<=1.34,'spam acima de 1,34%/s além da regeneração');
 console.log(`Spam por 60s: ${finished} conclusões, ${bonus.toFixed(1)} pontos; ${(bonus/60).toFixed(3)}%/s de bônus: OK`);
}
// Limite de barra, aventura, cancelamento por KO e limpeza entre rounds.
{
 const g=local(false),p=g.state.players[0];p.sp=98;
 step(g,p,{taunt:true});step(g,p,{},20);assert.equal(p.sp,100);
}
{
 const g=local(),[p,q]=g.state.players;step(g,p,{taunt:true});
 g.env.__zoa.hit(p,1000,0,p.x+30,'versus',q);assert(p.dead);p.sp=0;
 step(g,p,{},25);assert.equal(p.sp,0);
 g.env.__zoa.reset();const fresh=g.state.players[0];assert.equal(fresh.tauntCd,0);assert.equal(fresh.tauntFala,'');
 assert.equal(fresh.sp,0);assert.notEqual(fresh.state,'taunt');
}
{
 const g=local(true,false,[{who:'cardoso',ctl:0},{who:'nutri',ctl:1}]),[p,q]=g.state.players;
 p.limadoT=5;step(g,p,{taunt:true});g.env.__zoa.drain(p,q,3,5,4);assert.equal(p.state,'hurt');
}
// Teclas, remapeamento, controle e toque usam o mesmo comando de borda.
for(const [key,index] of [['KeyO',0],['Numpad5',1],['BracketLeft',1]]){
 const g=local();g.key(key);assert.equal(g.state.players[index].state,'taunt');
}
{
 const g=local(),P=g.env.CreiaPreferences;assert(P.setBinding(0,'taunt','KeyT').ok);
 g.key('KeyO');assert.notEqual(g.state.players[0].state,'taunt');g.key('KeyT');assert.equal(g.state.players[0].state,'taunt');
 assert.equal(P.setBinding(1,'atk','KeyT').ok,false);
 P.setControl('landscape','KeyO',{x:.7,y:.4,size:50,opacity:.8});assert.equal(P.control('landscape','KeyO').size,50);
}
{
 const g=local(),p=g.state.players[0];const buttons=Array.from({length:17},()=>({pressed:false,value:0}));
 g.env.navigator.getGamepads=()=>[{connected:true,index:0,id:'Xbox',axes:[0,0],buttons}];
 buttons[8].pressed=true;g.tick();assert.equal(p.state,'taunt');g.tick(400);assert.equal(p.state,'idle','Select mantido renovou a provocação');
}
{
 const g=local(true,true),el=g.elements.find(e=>e['data-creia-action']==='KeyO');
 assert(el);assert.equal(el.textContent,'ZOA');el.events.pointerdown({preventDefault:noop});g.tick();
 assert.equal(g.state.players[0].state,'taunt');el.events.pointerup();
}
console.log('O / Numpad5 / [, remapeamento, Select e ZOA: OK');
// Rival real no X1; alvo mais próximo da aventura; ausência do módulo mantém o neutro aprovado.
{
 const g=local(),[p,q]=g.state.players;step(g,p,{taunt:true});assert.equal(p.tauntFala,bordoes.fala(p.who,q.who));
 const calls=[],real=g.env.Bordoes.fala;g.env.Bordoes.fala=(...args)=>{calls.push(args);return real(...args);};
 g.env.__bangu.startTeam([{who:'nutri',ctl:0}],false,false);const a=g.state.players[0];
 g.env.__bangu.cardosoTest.spawn('fome',a.x+20,a.y);g.env.__bangu.cardosoTest.spawn('batata',a.x+100,a.y);
 step(g,a,{taunt:true});assert.deepEqual(calls.at(-1),['nutri','fome']);
 g.env.__zoa.stage(1,false);step(g,g.state.players[0],{taunt:true});assert.deepEqual(calls.at(-1),['nutri',undefined]);
 g.env.Bordoes=undefined;g.env.__zoa.stage(1,false);step(g,g.state.players[0],{taunt:true});assert.equal(g.state.players[0].tauntFala,'!!');
}
// IA: nenhum alvo próximo autoriza provocação; sorteio próprio reproduzível.
{
 const g=local(),[p,q]=g.state.players,cam=g.env.__zoa.cam;
 let seed=1;while(((Math.imul(seed,1664525)+1013904223)>>>0)/4294967296>=g.env.CreiaCombat.provocacao.chanceIA)seed++;
 p.x=cam+50;q.x=cam+90;g.tick();p.ai=true;p.aiTauntWait=0;p.aiTauntSeed=seed;
 assert(!g.env.__zoa.ai(p,.5).taunt);
 p.ai=false;p.x=cam+20;q.x=cam+450;g.tick();p.ai=true;p.aiTauntWait=0;p.state='idle';p.z=0;p.tauntCd=0;
 assert.equal(g.env.__zoa.ai(p,.5).taunt,true);
 p.tauntCd=6;p.aiTauntWait=0;assert(!g.env.__zoa.ai(p,.5).taunt);
}
console.log('Bordão por rival e IA somente de longe: OK');
// Dois clientes + servidor real: comando do convidado e snapshot autoritativo.
{
 const host=factory(),guest=factory();
 host.key('Enter');host.key('KeyD');host.key('KeyD');host.key('KeyD');host.key('Enter');guest.transport.join(host.transport.code);
 host.key('Enter');guest.key('KeyD');guest.key('Enter');host.tick();
 host.until(s=>s.round.phase==='fight');host.tick(4);guest.tick(4);
 const p=host.state.players[1],q=host.state.players[0];p.inv=q.inv=0;p.sp=0;
 host.key('KeyO');guest.key('KeyO');guest.tick(3);host.tick();
 assert.equal(guest.transport.sent.filter(m=>m.type==='input').some(m=>m.input.taunt),true);
 assert.equal(p.state,'taunt','servidor descartou taunt do convidado');
 host.tick(3);guest.tick(3);
 const snap=guest.transport.received.filter(m=>m.type==='snapshot').at(-1).state;
 assert.equal(snap.players[1].state,'taunt');assert(snap.players[1].tauntCd>0);
 assert.equal(snap.players[1].tauntFala,bordoes.fala(p.who,q.who));
 assert.equal(snap.players[0].tauntFala,bordoes.fala(q.who,p.who));
 assert.equal(guest.online.pred.state,'taunt');
 host.tick(65);guest.tick(4);assert.equal(p.state,'idle');assert(p.sp>=8);
 host.transport.peer.socket.writableLength=1;
 guest.transport.send({type:'input',input:{x:0,y:0,taunt:true}});
 guest.transport.send({type:'input',input:{x:0,y:0,taunt:false}});
 assert.equal(host.transport.peer.realtime.input.input.taunt,true,'fila apagou a borda taunt');
 host.transport.peer.socket.writableLength=0;
 host.transport.leave();guest.transport.leave();
}
console.log('Online real: input taunt, snapshot, frase por rival e fim da pose no convidado: OK');
