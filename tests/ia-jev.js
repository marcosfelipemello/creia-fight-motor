'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../js/combate-config'),B=require('../js/ia-tatica'),{createJev}=require('../server/jev');
function observation(extra={}){return Object.assign({time:0,hp:1,sp:0,direction:1,distance:100,aligned:true,horizontal:true,melee:false,range:300,primaryReady:true,altReady:true,altRange:320,secondaryMelee:false,canGuard:true,foeGuard:false,foeInv:false,foeRecovering:false,threat:false},extra);}
(async()=>{
 // Mesmo projétil observado: difícil reage antes; fácil dá tempo ao humano.
 for(const level of ['facil','medio','dificil']){
  const m={};B.decide(observation({threat:true}),m,level,()=>.05);
  const early=B.decide(observation({time:.15,threat:true}),m,level,()=>.05);
  assert.equal(early.use,level==='dificil');
 }
 const escapeMemory={};const escape=B.decide(observation({foeProtected:true,foeInv:true,distance:60,cornered:true,canJump:true}),escapeMemory,'medio',()=>.5);assert(escape.jump&&escape.x===1,'IA não escapou do canto contra escudo');const crossing=B.decide(observation({time:.2,direction:-1}),escapeMemory,'medio',()=>.5);assert.equal(crossing.x,1,'IA inverteu antes de terminar o salto');
 const cautious={};assert(!B.decide(observation({sp:100,distance:30}),cautious,'facil',()=>.9).spc);assert(!B.decide(observation({time:.1,sp:100,distance:30}),cautious,'facil',()=>0).spc,'fácil repetiu sorteio de especial a cada frame');
 const guardingMemory={};B.decide(observation({foeGuard:true}),guardingMemory,'medio',()=>.99);assert(B.decide(observation({time:2,foeGuard:true}),guardingMemory,'medio',()=>.99).atk,'IA não pressionou defesa mantida para desgastar a barra');
 let state=12345;const random=()=>((state=(state*1664525+1013904223)>>>0)/4294967296);
 const guards={};for(const level of ['facil','medio','dificil']){let n=0;for(let i=0;i<500;i++){const m={};B.decide(observation({threat:true}),m,level,random);if(B.decide(observation({time:.5,threat:true}),m,level,random).use)n++;}guards[level]=n;}
 assert(guards.dificil>guards.medio&&guards.medio>guards.facil);
 for(const extra of [{foeGuard:true},{foeInv:true}])assert(!B.decide(observation(Object.assign({sp:100,distance:30},extra)),{},'dificil',()=>0).spc,'especial desperdiçado contra proteção');
 assert(B.decide(observation({sp:100,foeRecovering:true}),{},'dificil',()=>0).spc);
 assert(B.decide(observation({support:true,hp:.3}),{},'medio',()=>.5).alt,'IA ignorou cura disponível');
 const m={};assert(B.decide(observation(),m,'medio',()=>.99).atk);assert(B.decide(observation({time:1}),m,'medio',()=>.99).atk);const reset=B.decide(observation({time:1.1}),m,'medio',()=>.99);assert(!reset.atk&&reset.x!==0,'IA repetiu disparos sem reposicionar');
 assert.equal(B.bossAttack({x:0,hp:100,maxHp:100,attack:'stomp'},{nearestPlayer:()=>({x:20})},['stomp','bacon'],()=>0),'bacon');
 assert.equal(B.bossAttack({x:0,hp:100,maxHp:100,jevAttack:'roll',jevUntil:Date.now()+3000},{},['stomp'],()=>0),'stomp','Jev concedeu golpe inexistente ao chefe');
 for(const who of Object.keys(C.primary)){assert(C.primaryCooldown(who,true)>0);assert(C.secondaryCooldown(who,true)>0);assert(C.profile(who,true).attack>=1&&C.profile(who,true).attack<=5);}
 assert.equal(C.profile('lutador',true).attack,4);
 const actor={kind:'fighter',character:'enzo',health:.8,opponentHealth:.6,distance:200,specialReady:true,primaryReady:true,secondaryReady:true},body={mode:'x1',actors:[actor,{kind:'boss',health:.5,opponentHealth:1,distance:60,attacks:['stomp','bacon']}]};
 const dummy='test-credential-not-real';let sent,now=100000,calls=0;
 const service=createJev({key:dummy,clock:()=>now,fetch:async(url,options)=>{calls++;assert.equal(url,'https://api.typesafe.ai/v1/systemone');assert.equal(options.headers.Authorization,'Bearer '+dummy);sent=JSON.parse(options.body);return {ok:true,text:async()=>JSON.stringify({answers:{actor0:{type:'choice',choice:'pressure',confidence:.9},actor1:{type:'choice',choice:'bacon',confidence:.8}}})};}});
 const response=await service.decide(body,'ip');assert.equal(response.status,200);assert.deepEqual(response.body.choices,{actor0:'pressure',actor1:'bacon'});assert.equal(sent.model,'jev-latest');assert.equal(sent.questions.actor0.type,'choice');assert.equal(sent.state.actors[0].character,'enzo');assert(!JSON.stringify(response).includes(dummy));assert(!JSON.stringify(service.status()).includes(dummy));
 for(let i=1;i<6;i++)await service.decide(body,'ip');assert.equal((await service.decide(body,'ip')).status,429);assert.equal(calls,6);now+=60000;assert.equal((await service.decide(body,'ip')).status,200);
 assert.equal((await service.decide({actors:[{kind:'boss',attacks:['delete-files']}]},'other')).status,400);
 const invalid=createJev({key:dummy,fetch:async()=>({ok:true,text:async()=>JSON.stringify({answers:{actor0:{type:'choice',choice:'invincible',confidence:1},actor1:{type:'choice',choice:'bacon',confidence:.1}}})})});assert.deepEqual((await invalid.decide(body,'ip')).body.choices,{});
 const unavailable=createJev({key:'',fetch:()=>{throw Error('não deveria chamar');}});assert.equal((await unavailable.decide(body,'ip')).status,503);
 const failed=createJev({key:dummy,fetch:async()=>{throw Error(dummy);}});assert.deepEqual((await failed.decide(body,'ip')).body,{fallback:true});
 const timeout=createJev({key:dummy,fetch:async(u,o)=>new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>reject(Error('timeout'))))});const start=Date.now();assert.equal((await timeout.decide(body,'ip')).status,503);assert(Date.now()-start<2200);
 // Credenciais reais nunca devem aparecer nos arquivos que publicar.sh distribui.
 const files=['index.html','jogo.html',...fs.readdirSync(path.join(__dirname,'../js')).filter(f=>f.endsWith('.js')).map(f=>'js/'+f)];
 for(const file of files){const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');assert(!/apikey_[a-zA-Z0-9_]{30,}/.test(source),'Credencial encontrada em arquivo público: '+file);}
 console.log('IA: reação/chance por nível, cura, especial, alternância, chefes e atributos: OK');
 console.log('Jev: contrato System One/Choice, lote, allowlist, rate limit, timeout e segredo fora das respostas/assets: OK (API simulada)');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
