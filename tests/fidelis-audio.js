'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const tracks=[],listeners={};
class Audio {
  constructor(src){this.src=src;this.duration=src.includes('grito')?1.83:3;this.readyState=1;this.currentTime=0;this.paused=true;this.starts=0;tracks.push(this);}
  pause(){this.paused=true;}
  play(){this.paused=false;this.starts++;return Promise.resolve();}
}
const env={Audio,document:{hidden:false,addEventListener:(n,f)=>listeners[n]=f},CreiaPreferences:{audio:k=>k==='voices'?.4:.6}};
env.window=env;vm.createContext(env);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/fidelis-audio.js'),'utf8'),env);
const voice=tracks[0],fx=tracks[1],audio=env.FidelisAudio;
audio.sync(.2,true);assert(voice.paused);assert(!fx.paused);
audio.sync(.8,true);assert(!voice.paused);assert.equal(voice.volume,.4);assert.equal(fx.volume,.6);
const starts=voice.starts;audio.sync(.8,true);assert(!voice.paused);assert.equal(voice.starts,starts,'snapshot repetido reiniciou ou pausou a fala');
audio.sync(.8,false);assert(voice.paused&&fx.paused,'pausa/mudo não interrompeu áudio');
audio.sync(1.4,true);assert(!voice.paused);assert(Math.abs(voice.currentTime-.68)<.001,'retomada não alinhou com o relógio');
env.document.hidden=true;listeners.visibilitychange();assert(voice.paused&&fx.paused);
env.document.hidden=false;audio.sync(2.1,true);assert(!voice.paused);assert(Math.abs(voice.currentTime-1.38)<.001);
audio.sync(null,true);assert(voice.paused&&fx.paused,'áudio continuou fora da cena');
voice.readyState=0;audio.sync(1,true);assert(voice.paused);voice.readyState=1;audio.sync(1.2,true);assert(!voice.paused);
audio.sync(2.9,true);assert(voice.paused,'voz recomeçou depois do fim');
console.log('Fidelis: voz/efeitos separados, volumes, pausa/mudo, snapshot repetido, retomada, carregamento e saída: OK');
