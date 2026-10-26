'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/jev-client.js'),'utf8');
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
(async()=>{
 let now=0,calls=0,pending,sent;
 const env={window:{},Date:{now:()=>now},AbortSignal:{timeout:()=>({})},fetch:async(url,options)=>{calls++;if(url.endsWith('status'))return {ok:true,json:async()=>({enabled:true})};assert(!options.body.includes('apikey'));sent=JSON.parse(options.body);return new Promise(resolve=>{pending=()=>resolve({ok:true,json:async()=>({choices:{actor0:'counter'},ttl:3})});});}};vm.createContext(env);vm.runInContext(source,env);
 const p={who:'enzo',ai:true,hp:100,maxHp:100,x:100,cd:0,altCd:0,sp:100},q={who:'th',hp:100,maxHp:100,x:200},players=[p,q],s={time:0,versus:true,players,bosses:[],guest:true};
 env.window.CreiaJev.update(s);assert.equal(calls,0,'visitante consumiu Jev');s.guest=false;env.window.CreiaJev.update(s);await flush();assert.equal(calls,1);now=10001;env.window.CreiaJev.update(s);await flush();assert.equal(calls,2);assert.equal(p.jevIntent,undefined,'decisão síncrona travou o motor');
 pending();await flush();assert.equal(p.jevIntent,'counter');assert.equal(p.jevUntil,3);
 p.jevUntil=0;now=21000;env.window.CreiaJev.update(s);await flush();const newer=Object.assign({},s,{players:[Object.assign({},p),q]});env.window.CreiaJev.update(newer);pending();await flush();assert.equal(p.jevUntil,0,'resposta do round antigo aplicada');assert.equal(newer.players[0].jevUntil,0);
 now=31001;env.window.CreiaJev.update(newer);await flush();now+=2300;pending();await flush();assert.equal(newer.players[0].jevUntil,0,'resposta velha aplicada');
 now=42000;const adventure={time:1,versus:false,guest:false,players:[p],bosses:[],enemies:[{x:180,y:215,hp:34,maxHp:34}]};env.window.CreiaJev.update(adventure);await flush();assert.equal(sent.mode,'adventure');assert.equal(sent.actors[0].distance,80,'companheiro não consultou tática contra inimigo comum');pending();await flush();
 const noAPI={window:{},Date,fetch:()=>{throw Error('não deveria chamar sem AbortSignal');}};vm.createContext(noAPI);vm.runInContext(source,noAPI);noAPI.window.CreiaJev.update(s);
 console.log('Cliente Jev: assíncrono, visitante sem chamada, round/atraso descartados e navegador sem API compatível: OK');
})().catch(error=>{console.error(error);process.exitCode=1;});
