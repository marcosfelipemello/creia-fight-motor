'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(__dirname,'cardoso.js'),'utf8').split('const c=client();')[0];
harness=harness.replace('env.window=env;', 'env.AudioContext=AudioContext;env.window=env;');
harness=harness.replace('return {api:env.__bangu,textSeen,','return {env,api:env.__bangu,textSeen,');
class AudioNode{
 constructor(){this.outputs=[];this.stops=0;for(const k of ['gain','frequency','detune','Q'])this[k]={value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}};}
 connect(n){this.outputs.push(n);}start(){}stop(){this.stops++;}
}
class AudioContext{
 constructor(){this.destination=new AudioNode();this.currentTime=1;this.sampleRate=100;this.state='running';this.nodes=[];}
 node(){const n=new AudioNode();this.nodes.push(n);return n;}
 createGain(){return this.node();}createOscillator(){return this.node();}createBiquadFilter(){return this.node();}createWaveShaper(){return this.node();}createBufferSource(){return this.node();}
 createBuffer(){return {getChannelData:()=>new Float32Array(50)};}resume(){}
}
const testFs=Object.assign({},fs,{readFileSync(file,...args){
 let data=fs.readFileSync(file,...args);
 if(path.resolve(String(file))===path.join(root,'js/game.js')){
  data=fs.readFileSync(path.join(root,'js/preferencias.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'js/encontros.js'),'utf8')+'\n'+data;
  data=data.replace('  window.__bangu = {',`  window.__improvements={audio:audio,sfx:sfx,levels:audioLevels,impact:impactAt,waves:buildWaves,music:musicTick,song:playSong,ambient:ambienceTick,profiles:AMBIENTS,set scene(s){scene=s;},get ambience(){return ambience;},get pause(){return hitPause;},get buses(){return {music:musicBus,effects:effectsBus,voices:voicesBus};},get context(){return AC;}};
  window.__bangu = {`);
 }
 return data;
}});
const client=new Function('require','__dirname','AudioContext',harness+'\nreturn client;')(name=>name==='node:fs'?testFs:require(name),__dirname,AudioContext);
const g=client(),t=g.env.__improvements,p=g.env.CreiaPreferences;t.audio();
p.setAudio('effects',0);p.setAudio('voices',.3);p.setAudio('music',.4);t.levels();
assert.equal(t.buses.effects.gain.value,0);assert.equal(t.buses.voices.gain.value,.3);assert.equal(t.buses.music.gain.value,2);
let offset=t.context.nodes.length;t.sfx('grito');
assert(t.context.nodes.slice(offset).some(n=>n.outputs.includes(t.buses.voices)),'fala caiu fora do canal de voz');
assert(!t.context.nodes.slice(offset).some(n=>n.outputs.includes(t.buses.effects)),'fala caiu no canal de efeitos');
offset=t.context.nodes.length;t.sfx('hit');assert(t.context.nodes.slice(offset).some(n=>n.outputs.includes(t.buses.effects)));
assert(!t.context.nodes.slice(offset).some(n=>n.outputs.includes(t.buses.voices)));
p.setAudio('voices',0);p.setAudio('effects',.7);t.levels();assert.equal(t.buses.voices.gain.value,0);assert.equal(t.buses.effects.gain.value,.7);
g.api.startTeam([{who:'lutador',ctl:0},{who:'bispo',ctl:1}],false,true);
g.until(()=>g.api.state.round.phase==='fight',200);
const hp=g.api.state.players.map(p=>p.hp);t.impact(200,215,30,'hit',true,true);assert.equal(t.pause,.035);g.tick(4);assert.equal(t.pause,0);assert.deepEqual(g.api.state.players.map(p=>p.hp),hp);
for(let stage=1;stage<=10;stage++){
 const waves=t.waves(stage);assert(waves.every(w=>w.encounter&&w.pool.length>0&&w.maxAlive>=2));
 if(stage>=9)assert(waves[1].pool.includes('gordura'),'variedade removeu blindado da fase final');
}
console.log('Motor: canais reais de áudio independentes, impacto sem dano adicional e encontros integrados nas dez fases: OK');
g.api.startTeam([{who:'th',ctl:0}],false,false);t.scene='play';
for(const song of ['rua','boss']){t.song(song);offset=t.context.nodes.length;t.music();assert.equal(t.context.nodes.length,offset,'aventura voltou a tocar música');}
assert.equal(t.profiles.length,10);assert(new Set(t.profiles.map(p=>p.freq)).size>=9);
t.ambient();assert.equal(t.ambience.nodes.length,0);t.context.currentTime+=2;t.ambient();assert(t.ambience.nodes.length>0);
assert(t.context.nodes.some(n=>n.outputs.includes(t.buses.effects)));
const playing=t.ambience.nodes.map(n=>n.source);t.scene='config';t.ambient();assert.equal(t.ambience.nodes.length,0);assert(playing.every(n=>n.stops>=2),'ambiente continuou ao sair da luta');
p.setBinding(0,'atk','KeyT');t.scene='play';let player=g.api.state.players[0];player.state='idle';player.st=0;player.cd=0;
g.key('KeyJ');assert(player.cd<=0,'tecla antiga continuou atacando');g.key('KeyT');assert(player.cd>0,'tecla nova não chegou ao motor');
console.log('Aventura sem música, ambiente contextual interrompido fora da luta e tecla personalizada no motor: OK');
