'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let harness=fs.readFileSync(path.join(__dirname,'cardoso.js'),'utf8').split('const c=client();')[0];
harness=harness.replace('const events={}, textSeen=new Set();','const events={}, textSeen=new Set(),labels=[],poses=[];');
harness=harness.replace("if(key==='fillText') return s=>textSeen.add(String(s));","if(key==='fillText') return (s,x,y)=>{textSeen.add(String(s));labels.push({text:String(s),x,y});};");
harness=harness.replace('return {api:env.__bangu,textSeen,','return {env,labels,poses,api:env.__bangu,textSeen,hold(code,n){events.keydown({code,preventDefault:noop});this.tick(n);events.keyup({code});},');
const read=fs.readFileSync.bind(fs),gameFile=path.resolve(__dirname,'../js/game.js');
fs.readFileSync=function(file,...args){const source=read(file,...args);return path.resolve(String(file))===gameFile?source.replace('  window.__bangu = {',`  window.__fair={update:updatePlayer,ai:aiControl,hud:drawHUD,intro:function(team){var original=selTeam;selTeam=function(){return team;};sel={vs:true,vsT:1};try{drawVs();}finally{selTeam=original;}}};\n  window.__bangu = {`):source;};
try{
 const client=new Function('require','__dirname',harness+'\nreturn client;')(require,__dirname),C=require('../js/combate-config');
 for(const vs of [false,true])for(const who of Object.keys(C.primary)){
  const g=client();g.api.startTeam(vs?[{who,ctl:0},{who:'th',ctl:1}]:[{who,ctl:0}],false,vs);if(vs)g.until(()=>g.api.state.round.phase==='fight',150);
  const p=g.api.state.players[0];p.x=g.api.state.cam+100;p.facing=1;p.inv=0;p.state='idle';p.y=215;p.ctrl={x:0,y:0,atk:true};
  g.env.__fair.update(p,1/60);if(who!=='lutador')assert.equal(p.cd,C.primaryCooldown(who,vs),who+' recarga primária divergente');
  p.state='idle';p.st=0;p.micOut=false;p.z=0;p.ctrl={x:0,y:0,alt:true};g.env.__fair.update(p,1/60);assert.equal(p.altCd,C.secondaryCooldown(who,vs),who+' recarga secundária divergente');
  // Mesmo motor e mesma recarga quando o jogador passa a ser IA.
  const humanCd=p.altCd;p.ai=true;p.altCd=0;p.state='idle';p.st=0;p.micOut=false;p.z=0;p.ctrl={x:0,y:0,alt:true};g.env.__fair.update(p,1/60);assert.equal(p.altCd,humanCd,who+' vantagem exclusiva da IA');
 }
 {
  const g=client();g.api.startTeam([{who:'th',ctl:0},{who:'bispo',ctl:1}],false,true);g.until(()=>g.api.state.round.phase==='fight',150);const p=g.api.state.players[0],q=g.api.state.players[1];p.x=g.api.state.cam+120;q.x=p.x+55;
  g.key('KeyK');let peak=p.z,crossHeight=0;for(let i=0;i<58;i++){const before=p.x;g.hold('KeyD',1);peak=Math.max(peak,p.z);if(before<q.x&&p.x>=q.x)crossHeight=p.z;}assert(peak>95,'pulo muito baixo');assert(p.x>q.x+30,'não cruzou o rival: '+p.x+' rival '+q.x+' pico '+peak+' estado '+p.state);assert(crossHeight>70,'cruzou sem altura suficiente para passar sobre o rival');
  g.labels.length=0;g.env.__fair.hud();assert(g.labels.some(l=>l.text.startsWith('P1 ')&&l.x<100));assert(g.labels.some(l=>l.text.startsWith('P2 ')&&l.x>380));assert(g.labels.some(l=>l.text.includes('DEF ')));assert(!g.labels.some(l=>l.text.startsWith('HI ')||/^0{4,}/.test(l.text)),'score apareceu no X1');
  // Controle da IA produz pulsos, sem manter disparo preso entre decisões.
  p.ai=true;p.state='hurt';p.cd=0;p.altCd=0;p.sp=100;p.aiWait=0;p.aiMemory={};const stunned=g.env.__fair.ai(p,1/60);assert(!stunned.atk&&!stunned.alt&&!stunned.spc,'IA gastou uma tentativa enquanto estava atordoada');p.sp=0;
  p.ai=true;p.state='idle';p.cd=0;p.altCd=10;p.aiWait=0;p.aiMemory={};p.aiLevel='medio';q.x=p.x+100;const first=g.env.__fair.ai(p,1/60),next=g.env.__fair.ai(p,1/60);assert(first.atk);assert(!next.atk&&!next.alt&&!next.spc);
 }
 {
  const g=client();g.api.startTeam([{who:'th',ctl:0},{who:'bispo',ctl:1}],false,true);g.until(()=>g.api.state.round.phase==='fight',150);const p=g.api.state.players[0],q=g.api.state.players[1];q.state='guard';q.guardT=1;q.guardHp=100;q.inv=0;q.x=p.x+50;q.facing=-1;
  for(let i=0;i<3;i++)assert.equal(g.api.cardosoTest.versusHit(p,q,30,true,true),false);
  assert.equal(q.guardHp,0);const hp=q.hp;assert(g.api.cardosoTest.versusHit(p,q,30,true,true),'captura antiga de bloqueio continuou invulnerável após quebra');assert(q.hp<hp);
  const faces=[];g.env.Rig.big=function(ctx,who,state,t,x,y,facing){faces.push(facing);return true;};g.env.__fair.intro([{who:'th',ctl:0},{who:'bispo',ctl:1}]);assert.deepEqual(faces,[1,-1],'P2 não ficou de frente para P1');
 }
 {
  const g=client();g.api.startTeam([{who:'enzo',ctl:0},{who:'th',ctl:1}],false,true);g.until(()=>g.api.state.round.phase==='fight',150);const p=g.api.state.players[0],q=g.api.state.players[1];p.x=g.api.state.cam+100;q.x=p.x+80;p.facing=1;p.sp=100;q.inv=0;q.shield=0;
  // Golpe comum tem proteção normal, mesmo se o atacante possui especial ofensivo.
  assert(g.api.cardosoTest.versusHit(p,q,4.5,false,false));assert.equal(q.inv,.7);q.hp=100;q.inv=0;
  g.key('KeyL');const seen=new Set();for(let i=0;i<300;i++){g.tick();g.api.state.shots.filter(s=>s.enzoRain).forEach(s=>seen.add(s));}
  assert(seen.size>=18,'chuva perdeu a quantidade visual de bolas');assert(q.hp>=76-1e-8,'especial excedeu teto por ativação');assert(q.hp<100,'especial não acertou');assert(p.specialDamageLeft<=24);
 }
 for(const vs of [false,true]){
  const g=client();g.api.startTeam([{who:'lutador',ctl:0},{who:'th',ctl:1}],false,vs);if(vs)g.until(()=>g.api.state.round.phase==='fight',150);const p=g.api.state.players[0],q=g.api.state.players[1];p.sp=0;p.shield=3;p.ctrl={x:0,y:0};g.env.__fair.update(p,.1);assert.equal(p.sp,0,'escudo ativo recarregou especial passivamente');if(vs){q.inv=0;assert(g.api.cardosoTest.versusHit(p,q,11));assert.equal(p.sp,0,'escudo ativo financiou o próximo escudo');}p.shield=0;g.env.__fair.update(p,.1);assert(p.sp>0,'especial não voltou a carregar após efeito acabar');
 }
 for(const [who,button,distance,expected] of [['ricardo','KeyJ',30,3.2],['ricardo','KeyI',70,4],['lutador','KeyJ',30,3.36],['pedro','KeyI',30,4.8]]){
  const g=client();g.api.startTeam([{who,ctl:0},{who:'th',ctl:1}],false,true);g.until(()=>g.api.state.round.phase==='fight',150);const p=g.api.state.players[0],q=g.api.state.players[1];p.x=g.api.state.cam+100;q.x=p.x+distance;p.facing=1;q.inv=0;g.key(button);g.until(()=>q.hp<100,40);assert(Math.abs(q.hp-(100-expected))<1e-8,'dano X1 fora da calibração: '+who+' '+button+' '+q.hp);
 }
 console.log('Combate: recargas reais dos 19 personagens, humanos/IA nos dois modos, pulo cruzando oponente, HUD e pulsos da IA: OK');
}finally{fs.readFileSync=read;}
