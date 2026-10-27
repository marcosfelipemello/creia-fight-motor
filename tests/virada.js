'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs);
let harness=read(path.join(__dirname,'rounds.js'),'utf8').split('function startLocal()')[0];
harness=harness.replace('transport, textSeen,','env, transport, textSeen,');
harness=harness.replace('env.window=env;','env.Audio=FakeAudio;env.AudioContext=FakeContext;env.window=env;');
class SoundNode{
 constructor(){for(const k of ['gain','frequency','detune','Q'])this[k]={value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}};}
 connect(){}start(){}stop(){}
}
class FakeContext{
 constructor(){this.currentTime=10;this.state='running';this.sampleRate=100;this.destination=new SoundNode();}
 createGain(){return new SoundNode();}createOscillator(){return new SoundNode();}createBiquadFilter(){return new SoundNode();}createWaveShaper(){return new SoundNode();}createBufferSource(){return new SoundNode();}createMediaElementSource(){return new SoundNode();}
 createBuffer(){return {getChannelData:()=>new Float32Array(50)};}resume(){return Promise.resolve();}
}
class FakeAudio{
 constructor(){this.currentTime=0;this.paused=true;this.playbackRate=1;this.preservesPitch=false;this.readyState=4;this.duration=180;}
 addEventListener(){}pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}
}
const testFs=Object.assign({},fs,{readFileSync(file,...args){
 let source=read(file,...args);
 // Teste de mecânica: neutraliza multiplicador de equilíbrio de dano do X1
 if(path.resolve(String(file))===path.join(root,'js/combate-config.js')){
  source=source.replace('api.resistenciaX1={','api.resistenciaX1Off={');
 }
 if(path.resolve(String(file))===path.join(root,'js/game.js')){
  source=source.replace('  function floatText(x, y, msg, col) {',"  function floatText(x, y, msg, col) {if(msg==='UNÇÃO DOBRADA!'){window.__viradaWarnings=(window.__viradaWarnings||0)+1;window.__viradaColor=col;}");
  source=source.replace('  function drawCombatScreen(){','  function drawCombatScreen(){window.__viradaRendered=players.map(function(p){return p.virada;});');
  source=source.replace('  window.__bangu = {',`  window.__viradaTest={update:updateVirada,energy:addSpecialEnergy,reset:resetVersusRound,rate:viradaMusicRate,theme:x1ThemeTick,music:musicTick,audio:audio,drain:specialDrain,get media(){return x1Theme;},get mus(){return mus;},get songs(){return SONGS;},get musicGain(){return musicBus.gain.value;},get themeGain(){return x1ThemeGain.gain.value;},set scene(s){scene=s;}};
  window.__bangu = {`);
 }
 return source;
}});
const client=new Function('require','__dirname','FakeAudio','FakeContext',harness+'\nreturn client;')(name=>name==='node:fs'?testFs:require(name),__dirname,FakeAudio,FakeContext);
function local(vs=true){const g=client();g.env.__bangu.startTeam(vs?[{who:'th',ctl:0},{who:'bispo',ctl:1}]:[{who:'th',ctl:0}],false,vs);if(vs)g.until(s=>s.round.phase==='fight');return g;}
for(const vs of [false,true]){
 const g=local(vs),t=g.env.__viradaTest,p=g.state.players[0],C=g.env.CreiaCombat;
 assert.equal(p.virada,false);assert.equal(p.viradaAvisada,false);
 p.hp=25.01;t.update(p);assert.equal(p.virada,false);
 p.hp=25;t.update(p);assert.equal(p.virada,true);assert.equal(g.env.__viradaWarnings,1);assert.equal(g.env.__viradaColor,'#ff4d4d');
 p.hp=20;t.update(p);p.hp=40;t.update(p);assert.equal(p.virada,false);p.hp=15;t.update(p);assert.equal(g.env.__viradaWarnings,1,'avisou novamente após cura e recaída');
 p.maxHp=200;p.hp=50;t.update(p);assert.equal(p.virada,true);p.hp=50.01;t.update(p);assert.equal(p.virada,false);
 p.maxHp=100;p.hp=0;t.update(p);assert.equal(p.virada,false);p.hp=20;p.dead=true;t.update(p);assert.equal(p.virada,false);p.dead=false;
 p.hp=100;p.sp=0;t.energy(p,10);assert.equal(p.sp,10);
 p.hp=25;p.sp=0;t.energy(p,10);assert.equal(p.sp,10*C.virada.spMult);
 const calibrated=C.virada.spMult;C.virada.spMult=1.5;p.sp=0;t.energy(p,10);assert.equal(p.sp,15,'não aplicou ganho de 1,5x');C.virada.spMult=calibrated;
 p.sp=99;t.energy(p,10);assert.equal(p.sp,100);
 for(const effect of ['shield','limadoT','turbo']){p[effect]=2;p.sp=0;t.energy(p,10);assert.equal(p.sp,0,'virada financiou efeito ativo');p[effect]=0;}
 p.state='special';p.sp=0;t.energy(p,10);assert.equal(p.sp,0);p.state='idle';
 p.hp=26;g.tick();assert.equal(p.virada,false,'cura não encerrou estado no motor');
 if(vs){t.reset();const next=g.state.players[0];assert.equal(next.virada,false);assert.equal(next.viradaAvisada,false);next.hp=20;t.update(next);assert.equal(g.env.__viradaWarnings,2,'novo round não renovou aviso');}
 else {const e=g.env.__bangu.cardosoTest.spawn('fome',p.x+40,p.y);e.hp=1;t.update(e);assert.equal(e.virada,false,'inimigo entrou na virada');}
}
console.log('Virada: limiar proporcional, cura, morte, aviso único/round, aventura/X1, ganho configurável e teto/efeitos ativos: OK');
{
 const g=local(),t=g.env.__viradaTest,[p,q]=g.state.players;
 p.hp=30;p.sp=0;p.inv=0;
 assert(g.env.__bangu.cardosoTest.versusHit(q,p,12.5));assert.equal(p.hp,25);assert.equal(p.virada,true);assert.equal(p.sp,4*g.env.CreiaCombat.virada.spMult,'golpe que cruzou o limiar não recebeu bônus');
 p.hp=26;t.update(p);t.drain(p,q,1,1,1);assert.equal(p.hp,25);assert.equal(p.virada,true,'dreno de especial ignorou a virada');
 p.hp=100;t.update(p);q.ai=true;q.hp=20;t.update(q);assert.equal(t.rate(),1,'IA acelerou a música');
 p.hp=20;t.update(p);assert.equal(t.rate(),1.1);t.audio();t.theme();assert.equal(t.media.playbackRate,1.1);assert.equal(t.media.preservesPitch,true);const gain=t.themeGain;
 p.hp=26;t.update(p);t.theme();assert.equal(t.media.playbackRate,1);assert.equal(t.themeGain,gain,'virada mudou volume');
 p.hp=20;t.update(p);t.theme();assert.equal(t.media.playbackRate,1.1);t.scene='menu';t.theme();assert.equal(t.media.playbackRate,1,'saída manteve velocidade alterada');
 // Sem reprodução por arquivo, confere a cadência do sintetizador.
 t.scene='play';g.env.Audio=undefined;const musicGain=t.musicGain;
 for(const low of [false,true]){p.hp=low?20:100;t.update(p);t.mus.song='rua';t.mus.step=0;t.mus.next=10;t.music();const spb=(t.mus.next-10)/t.mus.step,expected=60/(t.songs.rua.bpm*(low?1.1:1))/4;assert(Math.abs(spb-expected)<1e-10);}
 assert.equal(t.musicGain,musicGain);
}
console.log('Virada: dano comum/dreno, velocidade musical só para humanos, tom preservado, volume intacto e retorno ao normal: OK');
{
 const host=client(),guest=client();host.key('Enter');host.key('KeyD');host.key('KeyD');host.key('KeyD');host.key('Enter');guest.transport.join(host.transport.code);host.key('Enter');guest.key('KeyD');guest.key('Enter');host.tick();host.until(s=>s.round.phase==='fight');
 const p=host.state.players[1],t=host.env.__viradaTest;p.hp=25.01;t.update(p);host.tick(4);guest.tick(2);
 let state=guest.transport.received.filter(m=>m.type==='snapshot').at(-1).state;assert.equal(state.players[1].hp,25);assert.equal(state.players[1].virada,false,'vida arredondada ativou a virada');assert.equal(guest.env.__viradaRendered[1],false);
 p.hp=25;t.update(p);host.tick(4);guest.tick(2);state=guest.transport.received.filter(m=>m.type==='snapshot').at(-1).state;
 assert.equal(state.players[1].virada,true);assert.equal(state.players[1].viradaAvisada,true);assert.equal(guest.env.__viradaRendered[1],true);assert.equal(guest.env.__viradaTest.rate(),1.1);assert.equal(guest.env.__viradaWarnings||0,0,'visitante recalculou a entrada');
 p.hp=40;t.update(p);host.tick(4);guest.tick(2);assert.equal(guest.env.__viradaRendered[1],false);assert.equal(guest.env.__viradaTest.rate(),1);
 p.hp=20;t.update(p);host.tick(4);guest.tick();
 const resumed=client();resumed.transport.code=host.transport.code;resumed.transport.token=host.transport.token;resumed.transport.resume();resumed.tick(4);
 assert.equal(resumed.state.players[1].viradaAvisada,true,'retomada perdeu aviso do round');assert.equal(resumed.env.__viradaWarnings||0,0,'retomada repetiu aviso já emitido');
 resumed.transport.leave();
}
console.log('Virada online: snapshot explícito, visitante usa estado autoritativo e música acompanha entrada/saída: OK');
