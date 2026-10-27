'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs),cfg=require('../js/combate-config');
// Reaproveita o cliente de integração, carregando as artes reais e expondo só neste teste o interior do motor.
let harness=read(path.join(__dirname,'cardoso.js'),'utf8').split('const c=client();')[0];
harness=harness.replace('return {api:env.__bangu,textSeen,','return {env,events,api:env.__bangu,textSeen,');
fs.readFileSync=function(file,...args){
 const absolute=path.resolve(String(file)),data=read(file,...args);
 if(absolute===path.join(root,'js/combate-config.js'))return data.replace('api.resistenciaX1={','api.resistenciaX1Off={');
 if(absolute===path.join(root,'js/rig.js'))return data+'\n'+['emanuelly-assets-v2','artes-emanuelly-v2'].map(n=>read(path.join(root,'js',n+'.js'),'utf8')).join('\n');
 if(absolute===path.join(root,'js/game.js'))return data.replace('  window.__bangu = {',`  window.__manuTest={get cine(){return cine;},rain:rainEmanuelly,updateShots:updateShots,snapshot:onlineSnapshot,predict:predictGuest,online:function(o){online=o;},drawCine:drawCine,shoot:shootEmanuelly};\n  window.__bangu = {`);
 return data;
};
try{
 const client=new Function('require','__dirname',harness+'\nreturn client;')(require,__dirname);
 function setup(vs,facing=1){
  const g=client();g.api.startTeam(vs?[{who:'emanuelly',ctl:0},{who:'lutador',ctl:1}]:[{who:'emanuelly',ctl:0}],false,vs);
  if(vs)g.until(()=>g.api.state.round.phase==='fight',200);
  const p=g.api.state.players[0];p.x=g.api.state.cam+(facing>0?90:390);p.y=215;p.facing=facing;p.inv=0;
  g.api.state.enemies.length=0;
  const target=vs?g.api.state.players[1]:g.api.cardosoTest.spawn('fome',p.x+55*facing,p.y);
  Object.assign(target,{x:p.x+55*facing,y:p.y,hp:500,maxHp:500,inv:0,shield:0,stun:999,kx:0,facing:-facing});
  return {g,p,target};
 }
 for(const vs of [false,true])for(const facing of [-1,1]){
  const {g,p,target}=setup(vs,facing);target.x=p.x+320*facing;
  g.key('KeyJ');assert.equal(p.state,'throw');let shot=g.api.state.shots.find(s=>s.k==='manu-tiro');assert(shot);
  const hand=g.env.Rig.emanuellyMuzzle('throw');assert(Math.abs(shot.z-(p.z-hand.y))<.001);assert.equal(shot.grav,0);assert.equal(shot.vz,0);
  g.tick(55);assert(target.hp<500,'primário não alcançou alvo distante');const after=target.hp;g.tick(10);assert.equal(target.hp,after,'primário duplicou dano');
  p.cd=0;p.state='idle';target.x=p.x+20*facing;target.inv=0;
  const hpNear=target.hp;g.key('KeyJ');assert.equal(p.state,'throw','primário virou soco de perto');assert(target.hp<hpNear||g.api.state.shots.some(s=>s.k==='manu-tiro'));
 }
 for(const vs of [false,true])for(const facing of [-1,1])for(const distance of [55,140,-70]){
  const {g,p,target}=setup(vs,facing);target.x=p.x+distance*facing;
  g.key('KeyI');assert.equal(p.state,'attack2');assert.equal(p.z,0);assert.equal(p.vz,0);assert(p.altCd>1);
  assert(g.api.state.shots.some(s=>s.k==='manu-curto'));g.tick(12);
  if(distance===55){assert(target.hp<500,'secundário não atingiu perto');assert(target.x!==p.x+55*facing,'secundário não empurrou');}
  else assert.equal(target.hp,500,'secundário acertou longe ou atrás');
  g.key('KeyI');assert(!g.api.state.shots.some(s=>s.k==='manu-curto'),'spam ignorou recarga');
  g.tick(15);assert.equal(p.state,'idle');
 }
 // Inimigos pequenos também precisam receber ambos os tiros da invocação alta.
 for(const kind of ['bala','nugget','coxinha'])for(const short of [false,true]){
  const {g,p}=setup(false);g.api.state.enemies.length=0;
  const e=g.api.cardosoTest.spawn(kind,p.x+(short?55:200),p.y);e.hp=500;e.stun=999;
  g.key(short?'KeyI':'KeyJ');g.tick(55);assert(e.hp<500,'tiro passou acima de '+kind+' (curto='+short+')');
 }
 // Um único quadro longo também respeita o ponto final do tiro curto.
 {
  const {g,p,target}=setup(false);target.x=p.x+140;g.env.__manuTest.shoot(p,true);g.env.__manuTest.updateShots(.3);assert.equal(target.hp,500);assert.equal(g.api.state.shots.length,0);
 }
 // Guarda comum: mesma pose e mesmo desgaste, sem furar guarda perfeita/normal.
 for(const short of [false,true]){
  const {g,p,target}=setup(true);target.x=p.x+55;g.events.keydown({code:'Quote',preventDefault(){}});g.tick(12);
  const hp=target.hp;g.key(short?'KeyI':'KeyJ');g.tick(15);assert.equal(target.hp,hp);assert(target.guardHp<100);assert.equal(g.env.EmanuellyArt.poseFor('guard'),'defesa');
 }
 // Colisão varrida, atravessa dois inimigos; cada lâmina registra cada alvo uma única vez.
 for(const facing of [-1,1]){
  const {g,p,target}=setup(false,facing);const test=g.env.__manuTest;
  target.x=p.x+45*facing;const other=g.api.cardosoTest.spawn('fome',p.x+90*facing,p.y);other.hp=500;other.stun=999;
  p.manuWave=0;test.rain(p);const shot=g.api.state.shots.find(s=>s.manuLamina&&s.faixa===1);g.api.state.shots.length=0;g.api.state.shots.push(shot);
  Object.assign(shot,{x:p.x+10*facing,y:p.y,z:20,life:2});test.updateShots(.2);
  assert.equal(target.hp,500-cfg.emanuelly.rainDamage);assert.equal(other.hp,500-cfg.emanuelly.rainDamage);assert.equal(shot.hit.length,2);
  shot.x=p.x+10*facing;test.updateShots(.2);assert.equal(target.hp,500-cfg.emanuelly.rainDamage);assert.equal(other.hp,500-cfg.emanuelly.rainDamage);
 }
 // O teto é consumido pelo pipeline real, inclusive com vários projéteis ainda vivos.
 {
  const {g,p,target}=setup(true);const test=g.env.__manuTest;p.sp=100;g.key('KeyL');assert(test.cine);assert.equal(p.specialDamageLeft,cfg.specialDamageLimit);
  g.tick(60);assert.equal(target.hp,500,'dano durante a cena congelada');
  g.until(()=>!test.cine,120);target.x=p.x+130;target.kx=0;const proxy=g.api.state.bosses.find(b=>b.vs===target);proxy.x=target.x;proxy.y=target.y;
  for(let i=0;i<30;i++){
   g.api.state.shots.length=0;test.rain(p);const shot=g.api.state.shots.find(s=>s.faixa===1);g.api.state.shots.length=0;g.api.state.shots.push(shot);
   target.inv=0;target.kx=0;Object.assign(shot,{x:target.x-30,y:target.y,z:30,life:1});test.updateShots(.1);
  }
  assert(Math.abs(500-target.hp-cfg.specialDamageLimit)<1e-6,'especial ultrapassou/não exercitou o teto '+JSON.stringify({hp:target.hp,left:p.specialDamageLeft,targetx:target.x,bosses:g.api.state.bosses.map(b=>[b.x,b.y,b.hp,b.inv])}));assert.equal(p.specialDamageLeft,0);
 }
 // Ciclo completo e contrato do visual (o arquivo do Claude não é necessário para jogar).
 {
  const {g,p,target}=setup(true),test=g.env.__manuTest;let scenes=0,rainFrames=0;
  g.env.EmanuellyVisual={cena(ctx,W,H,o){assert.equal(W,480);assert.equal(H,270);assert(o.t>=0);assert.equal(typeof o.img,'function');assert.equal(typeof o.text,'function');scenes++;},laminas(ctx,list,cam,t){if(list.length){assert(list.every(s=>Number.isFinite(s.x+s.y+s.z+s.t)&&Number.isInteger(s.faixa)));rainFrames++;}}};
  p.sp=100;g.key('KeyL');g.until(()=>!test.cine,150);g.until(()=>g.api.state.laminas.length>0,60);
  assert(scenes>0);assert(rainFrames>0);
  const samples=JSON.parse(JSON.stringify(g.api.state.laminas));assert(samples.length>=3);assert.equal(new Set(samples.map(s=>s.faixa)).size,3);
  test.online({matchId:1,sounds:[]});const snap=test.snapshot();test.online(null);
  assert.deepEqual(JSON.parse(JSON.stringify(snap.laminas)),samples);assert(!snap.shots.some(s=>s[3]==='manu-lamina'));
  g.tick(240);assert.equal(p.state,'idle');assert.equal(g.api.state.laminas.length,0);assert.equal(target.spLocked,false);
 }
 // Predição do convidado: primário de perto ainda é tiro; secundário permanece no chão.
 {
  const {g}=setup(true),test=g.env.__manuTest;
  const pred={x:150,y:215,z:0,vz:0,state:'idle',st:0,facing:1,cd:0,altCd:0,actionT:0,corrX:0,corrY:0};
  test.online({pred,sentInputs:[],nextSeq:1});
  const state={cam:0,players:[{x:180,y:215},{who:'emanuelly',x:150,y:215,z:0,state:'idle',st:0}],round:{phase:'fight'}};
  test.predict({x:0,y:0,atk:true},1/60,state);assert.equal(pred.state,'throw');
  Object.assign(pred,{state:'idle',cd:0,altCd:0});test.predict({x:0,y:0,alt:true},1/60,state);assert.equal(pred.state,'attack2');assert.equal(pred.z,0);assert.equal(pred.vz,0);test.online(null);
 }
 // Integração com o renderer real entregue pelo Claude: assinatura anterior e duração completa.
 {
  const {g,p}=setup(true),test=g.env.__manuTest;g.env.EmanuellyVisual=require('../js/emanuelly-visual');
  p.sp=100;g.key('KeyL');g.tick(125);assert(test.cine,'a cena real foi cortada antes da resposta do Crow');
  g.until(()=>!test.cine,300);g.tick(20);assert(g.api.state.laminas.length>0);g.tick(240);assert.equal(g.api.state.laminas.length,0);
 }
 // Dois clientes e relay real: snapshot e renderização do convidado no X1 e no cooperativo.
 {
  let source=read(path.join(__dirname,'coop-online.js'),'utf8').split('const navigation=client();')[0];
  source=source.replace('transport, textSeen, winForTest:','env, transport, textSeen, winForTest:');
  const net=new Function('require','__dirname',source+'\nreturn {client,pair};')(require,__dirname);
  for(const coop of [false,true]){
   let h,g;
   if(coop)({h,g}=net.pair());
   else{
    h=net.client();g=net.client();h.key('Enter');h.key('KeyD');h.key('KeyD');h.key('KeyD');h.key('Enter');
    g.transport.join(h.transport.code);h.key('Enter');g.key('KeyD');g.key('Enter');h.tick();h.until(s=>s.round.phase==='fight');
   }
   h.state.players.forEach((p,i)=>{p.who=i?'lutador':'emanuelly';p.ai=false;p.hp=p.maxHp=500;p.x=h.state.cam+100+i*240;p.y=215;p.facing=i?-1:1;});
   const p=h.state.players[0];p.sp=100;let sawRain=false,sawGuest=false;
   g.env.EmanuellyVisual={laminas(c,list){if(list.length)sawGuest=true;},cena(){}};
   h.key('KeyL');
   for(let i=0;i<330;i++){h.tick();g.tick();if(h.state.laminas.length)sawRain=true;}
   assert(sawRain&&sawGuest,'lâminas não chegaram ao convidado '+(coop?'coop':'X1'));
   assert.equal(g.transport.peer.closed,false);assert.equal(g.state.players.length,0,'convidado simulou combate');
   assert(h.transport.sent.filter(m=>m.type==='snapshot').every(m=>Buffer.byteLength(JSON.stringify(m))<8192));
   if(!coop)assert(h.transport.sent.some(m=>m.type==='snapshot'&&m.state.laminas&&m.state.laminas.length));
   h.transport.leave();
  }
 }
 console.log('Emanuelly: longo alcance, tiro curto, recarga, empurrão, defesa, chuva, dano único, teto X1, cena e snapshot: OK');
}finally{fs.readFileSync=read;}
// Medidas aprovadas e poses: verifica o que Rig.draw realmente desenha, além do seletor de estados.
const drawCalls=[],noop=()=>{},ctx=new Proxy({drawImage:(...args)=>drawCalls.push(args)},{get(o,k){return k in o?o[k]:noop;},set:()=>true});
const env={window:null,Image:class{set src(v){this.srcValue=v;this.complete=true;this.naturalWidth=383;this.naturalHeight=512;}},Rig:{height:76,draw:noop,big:noop,portrait:noop,ready:noop,item:noop}};env.window=env;vm.createContext(env);
for(const n of ['emanuelly-assets-v2','artes-emanuelly-v2'])vm.runInContext(read(path.join(root,'js',n+'.js'),'utf8'),env);
for(const [state,pose]of Object.entries({idle:'base',walk:'base',throw:'primario',attack1:'primario',attack2:'secundario',guard:'defesa',special:'especial',cutin:'cena-especial'})){
 assert.equal(env.EmanuellyArt.poseFor(state),pose);drawCalls.length=0;env.Rig.draw(ctx,'emanuelly',state,.1,100,215,1,{});
 assert(drawCalls.length>0);assert.equal(drawCalls[0][0],env.EmanuellyArt.img(pose));
 if(state==='idle')assert(Math.abs(drawCalls[0][4]/512*env.EmanuellyArtAssets.base.bodyHeight-66.12)<.001);
}
assert.equal(env.EmanuellyArt.poseFor('jump',{airThrow:true}),'primario');assert.equal(env.EmanuellyArt.poseFor('idle',{guard:true}),'defesa');
const meta=env.EmanuellyArtAssets,walk=meta.base.walk;assert(walk.waist>meta.base.feet[1]-meta.base.bodyHeight*.30,'corte está no quadril');assert(walk.waist<meta.base.feet[1]);assert(walk.split>walk.legs[0][0]&&walk.split<walk.legs[1][0]);
for(const [pose,m]of Object.entries(meta)){assert.equal(m.heightScale,.87);assert(m.head.length===4);const bytes=read(path.join(root,'assets/emanuelly-v2',pose+'.webp'));assert.deepEqual(bytes,Buffer.from(env.EmanuellyArtEmbedded[pose].split(',')[1],'base64'));assert(bytes.length<150000);}
for(const html of ['index.html','jogo.html']){const text=read(path.join(root,html),'utf8');for(const n of ['emanuelly-assets-v2','artes-emanuelly-v2']){assert.equal(text.split('src="js/'+n+'.js"').length-1,1);assert(text.indexOf('js/'+n+'.js')<text.indexOf('js/game.js'));}}
console.log('Emanuelly: poses reais, altura igual à Duda, embutidos, muzzle e corte abaixo da virilha: OK');
// Mede a geometria efetivamente enviada por Rig.big, mesmo chão, idle t=0, escala 1.
// Na pose inteira da Manu, desconta só o padding transparente definido pelos marcos aprovados.
function drawnHeight(who){
 let matrix=[1,0,0,1,0,0],stack=[],ys=[];
 function mul(b){const a=matrix;matrix=[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
 const context={save(){stack.push(matrix.slice());},restore(){matrix=stack.pop();},translate(x,y){mul([1,0,0,1,x,y]);},scale(x,y){mul([x,0,0,y,0,0]);},rotate(r){mul([Math.cos(r),Math.sin(r),-Math.sin(r),Math.cos(r),0,0]);},
  drawImage(im,...args){let x,y,w,h;if(args.length===8)[,,,,x,y,w,h]=args;else [x,y,w,h]=args;
   if(who==='emanuelly'){const m=heightEnv.EmanuellyArtAssets.base,k=h/512;y+=(m.feet[1]-m.bodyHeight)*k;h=m.bodyHeight*k;}
   for(const [px,py]of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]])ys.push(matrix[1]*px+matrix[3]*py+matrix[5]);
  }};
 heightEnv.Rig.big(context,who,'idle',0,100,215,1,1);
 assert(ys.length>0,'Rig.big não desenhou '+who);return Math.max(...ys)-Math.min(...ys);
}
const heightEnv={window:null,Image:class{set src(v){this.complete=true;this.naturalWidth=383;this.naturalHeight=512;}},document:{createElement(){return {};}}};heightEnv.window=heightEnv;vm.createContext(heightEnv);
for(const n of ['rig','emanuelly-assets-v2','artes-emanuelly-v2'])vm.runInContext(read(path.join(root,'js',n+'.js'),'utf8'),heightEnv);
const manuHeight=drawnHeight('emanuelly'),dudaHeight=drawnHeight('duda');assert(Math.abs(manuHeight-dudaHeight)<=1,`Emanuelly ${manuHeight.toFixed(2)}px difere da Duda ${dudaHeight.toFixed(2)}px`);
console.log(`Rig.big idle, escala 1: Emanuelly ${manuHeight.toFixed(2)}px; Duda ${dudaHeight.toFixed(2)}px (tolerância 1px): OK`);
