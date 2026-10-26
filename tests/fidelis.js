'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs);
let harness=read(path.join(__dirname,'cardoso.js'),'utf8').split('const c=client();')[0];
harness=harness.replace('return {api:env.__bangu,textSeen,','return {env,events,api:env.__bangu,textSeen,');
fs.readFileSync=function(file,...args){
  const abs=path.resolve(String(file)),data=read(file,...args);
  if(abs===path.join(root,'js/rig.js'))return data+'\n'+['fidelis-visual','artes-fidelis-v1','fidelis-audio'].map(n=>read(path.join(root,'js',n+'.js'),'utf8')).join('\n');
  if(abs===path.join(root,'js/game.js'))return data.replace('  window.__bangu = {','  window.__fidTest={get cine(){return cine;},duration:cineDuration,predict:predictGuest,reset:resetGuestPrediction,advance:advanceFidelis,snapshot:onlineSnapshot,online:function(o){online=o;}};\n  window.__bangu = {');
  return data;
};
try{
  const client=new Function('require','__dirname',harness+'\nreturn client;')(require,__dirname);
  function start(vs){const g=client();g.api.startTeam(vs?[{who:'fidelis',ctl:0},{who:'th',ctl:1}]:[{who:'fidelis',ctl:0}],false,vs);if(vs)g.until(()=>g.api.state.round.phase==='fight',160);return g;}
  for(const vs of [false,true])for(const facing of [-1,1]){
    const g=start(vs),p=g.api.state.players[0];p.x=g.api.state.cam+220;p.y=220;p.facing=facing;p.inv=0;
    g.api.state.enemies.length=0;
    const target=vs?g.api.state.players[1]:g.api.cardosoTest.spawn('fome',p.x+50*facing,p.y);
    target.x=p.x+50*facing;target.y=p.y;target.hp=200;target.inv=0;target.shield=0;target.stun=999;
    g.key('KeyI');assert.equal(p.state,'attack2');assert.equal(g.api.state.shots.length,0,'secundário ainda arremessa controle');
    g.tick(5);assert.equal(target.hp,200,'dano antes da preparação terminar');
    g.tick(17);assert.equal(target.hp,vs?195.2:188,'pancada não aplicou exatamente um impacto');
    const hp=target.hp;g.tick(22);assert.equal(p.state,'idle');assert.equal(target.hp,hp,'pancada repetiu dano');
    g.key('KeyI');assert.equal(p.state,'idle','duplo acionamento ignorou a recarga');
  }
  console.log('Fidelis: pancada preparada, impacto único, recarga, dois sentidos e modos: OK');
  for(const vs of [false,true])for(const blocked of (vs?[false,true]:[false]))for(const facing of [-1,1]){
    const g=start(vs),p=g.api.state.players[0];p.x=g.api.state.cam+220;p.y=220;p.facing=facing;p.sp=100;
    g.api.state.enemies.length=0;
    const target=vs?g.api.state.players[1]:g.api.cardosoTest.spawn('fome',p.x+28*facing,p.y);
    target.x=p.x+28*facing;target.y=p.y;target.hp=500;target.inv=0;target.shield=0;target.stun=999;target.kx=0;
    target.state=blocked?'guard':'idle';target.guardT=blocked?1:0;target.facing=-facing;
    const x=target.x,hp=p.hp;g.key('KeyL');assert.equal(g.env.__fidTest.duration(p),3);
    assert(g.env.__fidTest.cine);g.tick(120);assert(g.env.__fidTest.cine,'cena acabou antes de 3 s');
    assert.equal(target.hp,500,'dano durante a cutscene');assert.equal(target.x,x,'mundo andou durante a cutscene');
    g.until(()=>!g.env.__fidTest.cine,100);g.until(()=>p.state==='idle',200);
    assert.equal(p.fidHits,7,'não executou seis giros e final');
    assert.equal(g.api.state.shots.filter(s=>s.owner===p).length,0,'especial antigo ainda disparou controles');
    assert.equal(p.hp,hp,'Fidelis acertou a si mesmo');
    if(blocked)assert.equal(target.hp,500,'especial ignorou a defesa antecipada');
    else{assert(target.hp<500,'especial não acertou');if(vs)assert(500-target.hp<=24,'especial ultrapassou o teto de dano do X1');}
    assert(g.textSeen.has('INVERSÃO DE ACOOORDEE!'),'fala não aparece');
    const after=target.hp;g.tick(30);assert.equal(target.hp,after,'houve dano residual');
    if(vs)assert(!target.spLocked,'adversário permaneceu travado após o especial');
  }
  console.log('Fidelis: cena de 3 s, congelamento, seis giros + final, defesa, teto de dano e desbloqueio: OK');
  {
    const g=start(false),p=g.api.state.players[0];g.api.state.enemies.length=0;p.x=200;p.y=220;p.sp=100;
    const rear=g.api.cardosoTest.spawn('fome',p.x-35,p.y),far=g.api.cardosoTest.spawn('fome',p.x+280,p.y),deep=g.api.cardosoTest.spawn('fome',p.x,p.y-55);
    for(const e of [rear,far,deep]){e.hp=500;e.stun=999;e.kx=0;}
    g.key('KeyL');g.until(()=>!g.env.__fidTest.cine,200);g.until(()=>p.state==='idle',200);
    assert(rear.hp<500,'giro não acertou atrás');assert.equal(far.hp,500,'acertou fora do raio');assert.equal(deep.hp,500,'acertou em outra faixa de profundidade');
  }
  {
    const g=start(true),p=g.api.state.players[0];p.x=g.api.state.cam+100;p.y=220;p.facing=1;
    g.key('KeyJ');assert(!g.api.state.shots.some(s=>s.owner===p),'controle saiu antes da mão');g.tick(8);assert(g.api.state.shots.some(s=>s.owner===p&&s.k==='controle'),'principal perdeu o controle');
    const pred={x:100,y:220,z:0,vz:0,state:'idle',st:0,cd:0,altCd:0,actionT:0,facing:1,corrX:0,corrY:0};
    g.env.__fidTest.online({pred,sentInputs:[]});
    g.env.__fidTest.predict({x:0,y:0,alt:true},1/60,{cam:0,players:[{x:250,y:220},{who:'fidelis',x:100,y:220,z:0,state:'idle',st:0}],round:{phase:'fight'}});
    assert.equal(pred.state,'attack2');assert.equal(pred.actionT,.58);assert(pred.altCd>1);
    pred.state='idle';pred.cd=0;pred.altCd=0;pred.actionT=0;
    const snapshot={cam:0,players:[{x:250,y:215},{who:'fidelis',x:100,y:215,z:0,state:'idle',st:0}],round:{phase:'fight'}};
    g.env.__fidTest.predict({x:0,y:0,atk:true},1/60,snapshot);assert.equal(pred.state,'throw');assert.equal(pred.actionT,.36);
    g.env.__fidTest.predict({x:1,y:0,alt:true},1/60,snapshot);assert.equal(pred.state,'throw','secundário cancelou arremesso apenas no convidado');assert.equal(pred.x,100,'convidado deslizou na preparação');
    pred.state='jump';pred.z=50;pred.vz=0;pred.cd=0;pred.actionT=0;
    g.env.__fidTest.predict({x:0,y:0,atk:true},1/60,snapshot);assert.equal(pred.state,'throw','arremesso no ar não foi previsto');

    g.env.__fidTest.online(null);
  }
  console.log('Fidelis: giro radial, alcance/profundidade, principal preservado e previsão do convidado: OK');
  // Avanço real: independente da taxa de quadros, sem saltos na cutscene nem atravessar guarda/canto.
  for(const facing of [-1,1])for(const fps of [30,60]){
    const g=start(false),p=g.api.state.players[0];g.api.state.enemies.length=0;g.api.state.bosses.length=0;
    p.x=220;p.y=220;p.facing=facing;p.state='special';const origin=p.x;
    for(let i=1;i<=Math.ceil(2.2*fps);i++){p.st=i/fps;g.env.__fidTest.advance(p,1/fps);}
    assert(Math.abs((p.x-origin)*facing-100)<.001,'avanço varia com FPS ou sentido');
  }
  for(const facing of [-1,1]){
    const g=start(true),p=g.api.state.players[0],q=g.api.state.players[1],cam=g.api.state.cam;
    p.x=cam+220;p.facing=facing;p.y=q.y=215;q.x=p.x+facing*46;q.hp=500;q.inv=0;q.shield=0;q.state='guard';q.guardT=1;q.facing=-facing;p.sp=100;
    const origin=p.x,targetX=q.x;g.key('KeyL');g.tick(100);assert.equal(p.x,origin,'avançou na cutscene');
    g.until(()=>!g.env.__fidTest.cine,110);g.until(()=>p.state==='idle',200);
    assert((p.x-origin)*facing>0,'não iniciou avanço');assert((q.x-p.x)*facing>=23.9,'atravessou o corpo em guarda '+JSON.stringify({facing,x:p.x,qx:q.x,origin,targetX,blocked:p.specialBlocked,guard:q.guardHp,cd:q.guardCd}));assert(Math.abs(q.x-targetX)<5,'guarda foi arrastada pelo giro');assert.equal(q.hp,500);
    const edge=start(false),ep=edge.api.state.players[0];edge.api.state.enemies.length=0;edge.api.state.bosses.length=0;
    ep.x=edge.api.state.cam+(facing>0?465:15);ep.facing=facing;ep.st=1.5;edge.env.__fidTest.advance(ep,1);
    assert(ep.x>=edge.api.state.cam+12&&ep.x<=edge.api.state.cam+468,'saiu da arena');
  }
  // Contato é direcional na pancada; a cápsula tem limites de profundidade e altura.
  {
    const rule=require('../js/combate-config.js').fidelis,p={x:0,y:215,z:0,facing:1};
    assert(rule.contact(p,{x:53,y:215,z:0,w:24,h:70},'strike'),'ponta do baixo não acerta');
    assert(!rule.contact(p,{x:-5,y:215,z:0,w:24,h:70},'strike'),'pancada frontal acertou atrás');
    assert(!rule.contact(p,{x:85,y:215,z:0,w:24,h:70},'strike'),'pancada acertou além da arte');
    assert(!rule.contact(p,{x:53,y:240,z:0,w:24,h:70},'strike'),'pancada acertou outra faixa');
    assert(!rule.contact(p,{x:40,y:215,z:80,w:24,h:70},'spin'),'giro acertou acima da arma');
    assert(rule.contact(p,{x:-46,y:215,z:0,w:24,h:70},'spin'),'giro não acerta atrás');
    assert(rule.projectileContact({x:90,y:215,z:22},{x:60,y:215,z:0,w:24,h:70},20),'controle atravessou alvo entre frames');
  }
  // Preparação e soltura: uma única saída, inclusive de perto e no alto.
  for(const facing of [-1,1])for(const airborne of [false,true]){
    const g=start(false),p=g.api.state.players[0];g.api.state.enemies.length=0;p.x=220;p.y=220;p.facing=facing;if(airborne){p.z=50;p.vz=0;p.state='jump';}
    const near=g.api.cardosoTest.spawn('fome',p.x+facing*24,p.y);near.hp=500;near.stun=999;
    g.key('KeyJ');assert.equal(p.state,'throw');assert.equal(g.api.state.shots.length,0);
    g.tick(4);assert.equal(g.api.state.shots.length,0,'controle apareceu ainda na preparação');
    g.tick(4);assert(p.thrown,'controle não foi solto');
    const cd=p.cd;g.key('KeyJ');assert(p.cd<cd,'reenvio reiniciou o ataque dentro da recarga');
    g.tick(22);assert(p.state==='idle'||p.state==='jump','arremesso não terminou');if(!airborne)assert.equal(near.hp,492,'controle de perto não acertou exatamente uma vez');
  }
  console.log('Fidelis: avanço a 30/60 FPS, guarda/canto, cápsulas, projétil varrido e arremesso único no chão/ar: OK');

  {
    const g=client();g.api.start(12,1);let last=1;
    for(let i=0;i<70&&g.api.state.scene==='play';i++){const s=g.api.sim(60,true);last=Math.max(last,s.stage);}
    assert.equal(g.api.state.scene,'ending');assert.equal(last,10);
    console.log('Fidelis: campanha de 10 fases até ending: OK');
  }
}finally{fs.readFileSync=read;}
