'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs);
let harness=read(path.join(__dirname,'cardoso.js'),'utf8').split('const c=client();')[0];
harness=harness.replace('return {api:env.__bangu,textSeen,','return {env,draws,api:env.__bangu,textSeen,');
harness=harness.replace('const events={}, textSeen=new Set();','const events={}, textSeen=new Set(),draws=[];');
harness=harness.replace("if(key==='fillText')","if(key==='drawImage')return (...args)=>draws.push(args);\n    if(key==='fillText')");
harness=harness.replace('set src(v){','set src(v){this.srcValue=v;');
harness=harness.replace('this.naturalWidth=100;','this.naturalWidth=100;this.naturalHeight=100;');
const extras=Array.from(read(path.join(root,'index.html'),'utf8').matchAll(/<script src="js\/([^\"]+)\.js"><\/script>/g),m=>m[1]);
const from=extras.indexOf('marcos-assets'),to=extras.indexOf('online');
fs.readFileSync=function(file,...args){const abs=path.resolve(String(file));
 // Teste de mecânica: neutraliza multiplicador de equilíbrio de dano do X1
 if(abs===path.join(root,'js/combate-config.js'))return read(file,...args).replace('api.resistenciaX1={','api.resistenciaX1Off={');
 if(abs===path.join(root,'js/rig.js'))return read(file,...args)+'\n'+extras.slice(from,to).filter(n=>n!=='interface').map(n=>read(path.join(root,'js',n+'.js'),'utf8')).join('\n');
 if(abs===path.join(root,'js/game.js'))return read(file,...args).replace('  window.__bangu = {',`  window.__ricTest={predict:predictGuest,ui:modernUIState,bridge:uiBridge,damage:damagePlayer,snapshot:onlineSnapshot,online:function(o){online=o;},get cine(){return cine;},draw:function(t){cine={p:players[0],t:t};drawCine();},guest:drawOnlineGuest};\n  window.__bangu = {`);
 return read(file,...args);
};
try{
 const client=new Function('require','__dirname',harness+'\nreturn client;')(require,__dirname);
 function start(vs){const g=client();g.api.startTeam(vs?[{who:'ricardo',ctl:0},{who:'th',ctl:1}]:[{who:'ricardo',ctl:0}],false,vs);if(vs)g.until(()=>g.api.state.round.phase==='fight',150);return g;}
 {
  const g=start(false),p=g.api.state.players[0];g.api.state.enemies.length=0;p.x=80;p.y=220;p.facing=1;
  const e=g.api.cardosoTest.spawn('fome',p.x+35,p.y);e.hp=200;e.stun=999;e.kx=0;const x=e.x;
  g.key('KeyJ');g.tick(12);assert.equal(e.hp,184);assert(e.x>x+10,'soco não empurrou');g.tick(20);assert.equal(e.hp,184,'soco repetiu dano');
  e.x=p.x+145;e.hp=200;e.stun=999;e.kx=0;p.inv=0;p.altCd=0;p.state='idle';const origin=p.x;
  g.key('KeyI');assert.equal(p.state,'roll');const hp=p.hp;g.env.__ricTest.damage(p,7,400,p.x+20,'projectile');assert.equal(p.hp,hp-7);assert.equal(p.state,'roll');assert.equal(p.kx,0);
  g.until(()=>p.state!=='roll',50);assert(p.x-origin>=164&&p.x-origin<=176,'distância da rolagem incorreta: '+(p.x-origin)+' estado '+p.state+' st '+p.st);assert.equal(e.hp,186);g.tick(5);assert.equal(e.hp,186,'rolagem repetiu dano');assert.equal(p.state,'idle');assert(p.altCd>1);
  p.altCd=0;p.state='idle';p.inv=0;p.hp=3;g.key('KeyI');g.env.__ricTest.damage(p,10,100,p.x-20,'projectile');assert(p.dead);assert.equal(p.state,'ko','dano letal não encerrou rolagem');
 }
 // Projétil real, inclusive disparado perto, causa dano sem interromper o avanço no X1.
 {
  const g=start(true),p=g.api.state.players[0],q=g.api.state.players[1],cam=g.api.state.cam;p.x=cam+100;q.x=p.x+70;p.y=q.y=220;q.facing=-1;p.inv=0;
  g.key('KeyI');g.api.state.shots.push({k:'th-rec',x:p.x+8,y:p.y,z:25,vx:-90,vy:0,vz:0,grav:0,dmg:10,knock:400,pierce:1,owner:q,rot:0,vr:0,life:1,hit:[]});
  const hp=p.hp;g.tick();assert.equal(p.hp,hp-4);assert.equal(p.state,'roll');const x=p.x;g.tick(6);assert(p.x>x+20);
 }
 for(const blocked of [false,true]){
  const g=start(true),p=g.api.state.players[0],q=g.api.state.players[1],test=g.env.__ricTest,cam=g.api.state.cam;
  p.x=cam+120;q.x=cam+340;p.y=q.y=220;q.inv=0;q.shield=0;q.state=blocked?'guard':'idle';q.guardT=blocked?1:0;p.sp=100;
  g.key('KeyL');assert(test.cine);assert.equal(p.specialBlocked,blocked);g.tick(150);assert(!g.api.state.shots.some(s=>s.rcDoor));g.until(()=>!test.cine,250);g.until(()=>g.api.state.shots.some(s=>s.rcDoor),30);
  const ys=[],realItem=g.env.Rig.item;g.env.Rig.item=function(ctx,kind,x,y){if(kind==='ric-porta')ys.push(y);return realItem.apply(this,arguments);};g.draws.length=0;
  const door=g.api.state.shots.find(s=>s.rcDoor);assert(!p.rcLanded);const geometry=g.env.Rig.ricardoDoorSize();assert(door.y-door.z+34+geometry.half<=1,'queda começou já visível dentro da arena');assert(geometry.half*2<90,'Ricardo ainda está gigante');const hp=q.hp,own=p.hp;g.until(()=>door.rcLanded,100);assert(ys.filter(y=>y+geometry.half+34>56&&y-geometry.half+34<270).length>=35,'queda de Ricardo/porta não ficou visível tempo suficiente');assert(g.draws.some(args=>args[0].srcValue===g.env.RicardoArtEmbedded.especial),'arte real de Ricardo com porta não foi desenhada na arena');assert.equal(q.hp,blocked?hp:hp-16.8);assert.equal(p.hp,own);assert(p.rcLanded);
  assert(door.life>.6,'porta sumiu rápido após o impacto');const after=q.hp;g.tick(20);assert(g.api.state.shots.includes(door),'porta não permaneceu sobre o adversário');assert.equal(q.hp,after,'porta repetiu dano durante a permanência');g.tick(80);assert.equal(q.hp,after);assert(!q.spLocked);assert.equal(p.state,'idle');assert(g.textSeen.has('Nao ha ferrolhos....'));assert(g.textSeen.has('NEM PORRRTAAAAS!'));
  p.cd=.32;p.altCd=1.7;test.online({inputSeq:0,inputAtTime:0,sounds:[]});const snap=test.snapshot();assert.equal(snap.players[0].cd,.32);assert.equal(snap.players[0].altCd,1.7);assert.equal(snap.players[0].rcLanded,true);test.online(null);
 }
 {
  const g=client(),test=g.env.__ricTest,state={cam:0,players:[{x:400,y:220},{who:'ricardo',x:100,y:220,z:0,state:'idle',st:0,facing:1}],round:{phase:'fight'}};
  const online={pred:{x:100,y:220,z:0,vz:0,state:'idle',st:0,cd:0,altCd:0,actionT:0,facing:1,corrX:0,corrY:0},sentInputs:[]};test.online(online);test.predict({x:0,y:0,alt:true},1/60,state);assert.equal(online.pred.state,'roll');assert(online.pred.x>100);test.online(null);
 }
 // IA × IA e dificuldades sobrevivem à troca de round.
 {
  const g=client(),test=g.env.__ricTest;test.bridge.menu(0);test.bridge.mode('eve');test.bridge.level(0,'facil');test.bridge.level(1,'dificil');test.bridge.x1(0);
  test.bridge.pick(0);g.tick();test.bridge.pick(18);g.tick();test.bridge.pick(20);g.tick();g.key('Enter');g.until(()=>g.api.state.scene==='play',250);
  assert(g.api.state.players.every(p=>p.ai));assert.deepEqual(Array.from(g.api.state.players,p=>p.aiLevel),['facil','dificil']);g.until(()=>g.api.state.round.phase==='fight',300);g.tick();
  const levels=g.api.state.players;assert(levels[0].aiWait>levels[1].aiWait,'dificuldade sem diferença de reação');levels[1].hp=0;levels[1].dead=true;g.tick();g.until(()=>g.api.state.round.number===2,300);assert.deepEqual(Array.from(g.api.state.players,p=>p.aiLevel),['facil','dificil']);
 }
 {
  const g=client(),test=g.env.__ricTest;test.bridge.menu(1);test.bridge.adventureGo(0);test.bridge.pick(0);g.tick();const state=test.ui();assert.equal(state.roster.length,20);assert.equal(new Set(state.roster.map(r=>r.who)).size,20);assert.equal(state.roster.at(-1).who,'adriene');
  g.api.startTeam([{who:'duda',ctl:0}],false,false);const p=g.api.state.players[0];p.altCd=0;g.key('KeyI');const ui=test.ui();assert(ui.players[0].secondary>29);assert(ui.players[0].secondary<=30);
 }
 console.log('Ricardo: soco, rolagem, projétil real, K.O., especial defendido/livre, impacto único, recargas e IA × IA com níveis: OK');
}finally{fs.readFileSync=read;}
// Arquivos reais e relay compartilham o mesmo identificador do personagem.
{
 const vm=require('node:vm'),env={window:{}};vm.createContext(env);vm.runInContext(read(path.join(root,'js/ricardo-assets.js'),'utf8'),env);
 assert.equal(Object.keys(env.window.RicardoArtAssets).length,6);
 for(const [name,data]of Object.entries(env.window.RicardoArtEmbedded)){
  const png=Buffer.from(data.split(',')[1],'base64');assert.deepEqual(png,read(path.join(root,'assets/ricardo-v1',name+'.png')));assert.equal(png[25],6);assert.equal(png.readUInt32BE(20),512);
 }
 const relay=require('../server/index.js');function peer(){const messages=[],socket={destroyed:false,writableLength:0,write(frame){if((frame[0]&15)===1){const start=(frame[1]&127)===126?4:2;messages.push(JSON.parse(frame.subarray(start).toString()));}},end(){}};return {messages,p:{socket,buffer:Buffer.alloc(0),room:null,lastSeen:Date.now(),rateTime:0,rateCount:0,closed:false}};}
 const a=peer(),b=peer();relay.message(a.p,{type:'create'});relay.message(b.p,{type:'join',code:a.messages.find(m=>m.type==='created').code});relay.message(a.p,{type:'choice',who:'ricardo'});assert(b.messages.some(m=>m.type==='choice'&&m.who==='ricardo'));relay.message(a.p,{type:'start',team:['ricardo','douglinhas']});assert(b.messages.some(m=>m.type==='start'&&m.team[0]==='ricardo'));assert.equal(relay.scoreBody({name:'Ricardo',score:100,stage:1,character:'ricardo'}).character,'ricardo');relay.rooms.clear();
 console.log('Ricardo: PNGs transparentes embutidos, seleção no relay e ranking: OK');
}
