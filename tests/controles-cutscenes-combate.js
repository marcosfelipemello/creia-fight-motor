// Regressões de controles, apresentação e ataques resistentes a interrupção.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs);
const harness=read(path.join(__dirname,'cardoso.js'),'utf8').split('const c=client();')[0]
  .replace('return {api:env.__bangu,textSeen,','return {env,events,api:env.__bangu,textSeen,').replace('clock+=1000/60','clock+=1000/(env.__fps||60)');
fs.readFileSync=function(file,...args){
  const data=read(file,...args);
  // Teste de mecânica: neutraliza multiplicador de equilíbrio de dano do X1
  if(path.resolve(String(file))===path.join(root,'js/combate-config.js'))return data.replace('api.resistenciaX1={','api.resistenciaX1Off={');
  if(path.resolve(String(file))===path.join(root,'js/game.js'))return data.replace('  window.__bangu = {',`
  window.__combatTest={poll:pollPads,control:humanControl,open:openSelect,team:selTeam,
    get selection(){return sel;},get paused(){return paused;},get pads(){return pads;},
    pvp:function(){localVs.mode='pvp';},damage:damagePlayer,shots:updateShots,player:updatePlayer,
    cine:function(p){cine=p?{p:p,t:.5}:null;},get hasCine(){return !!cine;},draw:drawCombatScreen,
    ui:modernUIState,guestPlay:function(){scene='onlinePlay';},begin:onlineBegin,snapshot:onlineSnapshot,guest:drawOnlineGuest,
    get online(){return online;},roster:ROSTER};
  window.__bangu = {`);
  return data;
};
const client=new Function('require','__dirname',harness+'\nreturn client;')(require,__dirname);
function start(who='lutador',vs=true){const c=client();c.api.startTeam(vs?[{who,ctl:0},{who:'th',ctl:1}]:[{who,ctl:0}],false,vs);if(vs)c.until(()=>c.api.state.round.phase==='fight',160);return c;}
function device(index,id){return {connected:true,index,id,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};}
function tap(c,g,b){g.buttons[b].pressed=true;c.tick();g.buttons[b].pressed=false;c.tick();}
function shoot(c,p,q,extra={}){c.api.state.bosses.forEach(b=>b.update());c.api.state.shots.push({k:'fogo',x:p.x+4,y:p.y,z:30,vx:0,vy:0,vz:0,grav:0,rot:0,vr:0,life:1,dmg:10,knock:30,pierce:1,owner:q,hit:[],...extra});c.env.__combatTest.shots(1/60);}
try{
  // Os dois controles jogam no X1, selecionam personagens e não trocam de jogador ao desconectar.
  {
    const c=start(),a=c.env.__combatTest,xbox=device(2,'Xbox Wireless Controller'),ps5=device(5,'DualSense Wireless Controller');
    let gps=[null,null,xbox,null,null,ps5];c.env.navigator.getGamepads=()=>gps;
    xbox.axes[0]=1;ps5.axes[0]=-1;a.poll();
    assert.equal(a.control(c.api.state.players[0]).x,1);assert.equal(a.control(c.api.state.players[1]).x,-1);
    xbox.buttons[0].pressed=true;ps5.buttons[3].pressed=true;a.poll();
    assert(a.control(c.api.state.players[0]).atk);assert(a.control(c.api.state.players[1]).spc);
    a.poll();assert(!a.control(c.api.state.players[0]).atk,'botão mantido repetiu evento');
    gps=[null,null,null,null,null,ps5];a.poll();assert(!a.pads[0].on);assert(a.pads[1].on);assert.equal(a.control(c.api.state.players[1]).x,-1);
    gps=[null,null,xbox,null,null,ps5];xbox.axes[0]=.15;ps5.axes[0]=0;xbox.buttons[0].pressed=false;ps5.buttons[3].pressed=false;a.poll();assert.equal(a.control(c.api.state.players[0]).x,0,'drift moveu o jogador');
    a.pvp();a.open(true);c.tick();const before=a.selection.slots[0].cur;
    xbox.axes[0]=1;c.tick();assert.notEqual(a.selection.slots[0].cur,before);xbox.axes[0]=0;c.tick();
    tap(c,xbox,0);assert(a.selection.slots[0].lock);tap(c,ps5,0);assert(a.selection.slots[1].on);tap(c,ps5,0);assert(a.selection.slots[1].lock);
    assert.deepEqual(Array.from(a.team(),p=>p.ctl),[0,1]);tap(c,xbox,9);tap(c,xbox,0);assert(a.selection.vsT>=0);
    c.until(()=>c.api.state.scene==='play',200);c.until(()=>c.api.state.round.phase==='fight',160);
    tap(c,xbox,9);assert(a.paused,'Menu não pausou');tap(c,xbox,9);assert(!a.paused,'Menu não retomou');
    gps=[];a.poll();assert(a.pads.every(p=>!Object.values(p.held).some(Boolean)));
    const ui=a.ui();assert.equal(ui.gamepads.length,4);
  }
  console.log('Xbox/DualSense simulados: seleção, dois jogadores, botões, drift, pausa e reconexão: OK');
  for(const vs of [false,true]){
    const c=client(),a=c.env.__combatTest,xbox=device(0,'Xbox'),ps5=device(1,'DualSense');c.env.navigator.getGamepads=()=>[xbox,ps5];a.pvp();a.open(vs);c.tick();
    c.key('KeyJ');
    if(vs){tap(c,xbox,9);tap(c,xbox,0);assert.equal(a.pads[0].slot,1);assert.equal(new Set(a.pads.map(p=>p.slot)).size,4,'controles duplicaram o jogador');tap(c,xbox,9);tap(c,xbox,0);assert(a.selection.vsT>=0);}
    else{
      c.key('Numpad1');c.key('Numpad1');tap(c,xbox,9);tap(c,xbox,0);tap(c,ps5,9);tap(c,ps5,0);
      assert.deepEqual(Array.from(a.team(),p=>p.ctl),[0,1,2,3]);assert.equal(a.pads[0].slot,2);assert.equal(a.pads[1].slot,3);
      c.key('KeyL');assert(a.selection.vsT>=0);
    }
  }
  console.log('Teclado + controle no X1 e dois teclados + dois controles na aventura: OK');

  // Resistência não significa invencibilidade; a sequência e o tempo do ataque sobrevivem ao tiro.
  {
    const c=start(),a=c.env.__combatTest,p=c.api.state.players[0],q=c.api.state.players[1];
    p.state='attack1';p.st=.04;p.facing=1;p.ctrl={x:0,y:0};q.x=p.x+32;q.y=p.y;q.hp=500;
    for(const [i,state] of ['attack1','attack2','attack3'].entries()){
      assert.equal(p.state,state);p.inv=0;p.queue=i<2;p.st=.04;const hp=p.hp,st=p.st,hit=p.hitDone;
      shoot(c,p,q);assert(Math.abs(hp-p.hp-2.4)<1e-8,'resistência a projétil não aplicada');
      assert.equal(p.state,state);assert.equal(p.st,st);assert.equal(p.hitDone,hit);assert.equal(p.queue,i<2);assert.equal(p.kx,0);
      const targetHP=q.hp;q.inv=0;
      for(let f=0;f<60&&p.state===state;f++)a.player(p,1/60);
      assert(q.hp<targetHP,'golpe do combo não acertou');
    }
    assert.equal(p.state,'idle');
    p.inv=0;p.state='attack2';const hp=p.hp;shoot(c,p,q,{boom:true,z:.01,vz:-300,grav:1});assert.equal(p.state,'attack2');assert(Math.abs(hp-p.hp-.96)<1e-8,'explosão perdeu a classificação de projétil');
    p.inv=0;p.state='attack1';a.damage(p,5,20,p.x-10,'versus',q,false,false,false);assert.equal(p.state,'hurt','Marcos recebeu armadura contra corpo a corpo');
  }
  for(const vs of [false,true])for(const projectile of [false,true]){
    const c=start('fidelis',vs),a=c.env.__combatTest,p=c.api.state.players[0];
    const q=vs?c.api.state.players[1]:c.api.cardosoTest.spawn('fome',p.x+50,p.y);q.x=p.x+50;q.y=p.y;q.hp=500;q.inv=0;q.stun=999;
    p.state='attack2';p.st=.1;p.hitDone=false;p.inv=0;p.ctrl={x:0,y:0};p.facing=1;const hp=p.hp;
    a.damage(p,5,20,p.x-10,vs?'versus':'enemy',q,false,false,projectile);
    assert.equal(p.hp,hp-5);assert.equal(p.state,'attack2');assert.equal(p.st,.1);assert.equal(p.kx,0);
    c.api.state.bosses.forEach(b=>b.update());for(let f=0;f<40;f++)a.player(p,1/60);
    assert.equal(p.state,'idle');assert(q.hp<500,'pancada não concluiu');
    p.inv=0;p.hp=1;p.state='attack2';a.damage(p,5,20,p.x-10,'enemy');assert(p.dead);assert.equal(p.state,'ko');
  }
  console.log('Marcos: três golpes sob tiro; Fidelis: secundário sob hit, dano, recuo e nocaute: OK');

  // Todas as cutscenes usam a mesma regra, inclusive no render do convidado online.
  {
    const c=start('bispo'),a=c.env.__combatTest;let hud=0;c.env.CreiaHUD.x1=()=>hud++;
    for(const r of a.roster){a.cine({...c.api.state.players[0],who:r.who});hud=0;a.draw();assert.equal(hud,0,r.who+' mostrou HUD');assert(a.ui().cinematic);}
    a.cine(null);a.draw();assert.equal(hud,1,'HUD não retornou');assert(!a.ui().cinematic);
    for(const who of ['bispo','pedro','lutador']){
      a.begin(false,'TEST');a.online.choice='th';a.online.other=who;const s=a.snapshot();s.players[0].who=who;s.cine=[0,.5];s.spFreeze=true;a.online.snapshots=[{at:0,state:s}];
      a.guestPlay();hud=0;a.guest(0);assert.equal(hud,0,who+' mostrou HUD no convidado');assert(a.ui().cinematic,'interface do convidado não ocultou os controles');
    }
  }
  console.log('Cutscenes de todo o elenco e convidado online sem HUD; restauração após a cena: OK');

  const damages=[];
  for(const fps of [30,60])for(const facing of [-1,1])for(const edge of [false,true])for(const blocked of [false,true])for(let seed=1;seed<=5;seed++){
    const c=start('bispo'),a=c.env.__combatTest,p=c.api.state.players[0],q=c.api.state.players[1];c.env.__fps=fps;let rng=seed;c.env.Math=Object.create(Math);c.env.Math.random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
    p.x=c.api.state.cam+(facing>0?120:360);q.x=edge?c.api.state.cam+(facing>0?468:12):p.x+facing*160;p.facing=facing;q.facing=-facing;p.sp=100;p.inv=q.inv=0;q.hp=1000;
    if(blocked){q.state='guard';q.guardT=1;q.guardHp=100;q.guardCd=0;}
    c.key('KeyL');c.until(()=>!a.hasCine&&p.state==='idle'&&c.api.state.shots.length===0,600);c.tick(2);
    const dmg=1000-q.hp;if(blocked)assert.equal(dmg,0,'defesa antecipada falhou');else{assert(dmg>=22.7,'chuva inconsistente: '+JSON.stringify({dmg,facing,edge,seed,x:q.x-c.api.state.cam}));assert(dmg<=24+1e-8,'teto de dano excedido');damages.push(dmg);}
    assert(!q.spLocked,'rival permaneceu travado');assert.equal(p.hp,100,'Bispo acertou a si mesmo');
  }
  console.log('Bispo: precisão nos dois sentidos e cantos, defesa, limite 24 e desbloqueio: OK', {min:Math.min(...damages),max:Math.max(...damages)});
}finally{fs.readFileSync=read;}
