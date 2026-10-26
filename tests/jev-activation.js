'use strict';
const assert=require('node:assert/strict');
const {createJev}=require('../server/jev');
const {check,failureMessage}=require('../server/check-jev');
const body={mode:'x1',actors:[{kind:'fighter',character:'ricardo',health:1,opponentHealth:1,distance:250}]};
const key='private-test-value-not-real';
const response=(answer)=>({ok:true,text:async()=>JSON.stringify({answers:{actor0:answer}})});
(async()=>{
 for(const code of [401,402,403,429,500]){
  const service=createJev({key,fetch:async()=>({ok:false,status:code})});
  const result=await service.decide(body,'test');assert.equal(result.diagnostic.httpStatus,code);
  await assert.rejects(check({service,log:()=>{}}),new RegExp('HTTP '+code));assert(!JSON.stringify(result).includes(key));
 }
 const dns=createJev({key,fetch:async()=>{const error=new Error(key);error.cause={code:'EAI_AGAIN'};throw error;}});
 const result=await dns.decide(body,'test');assert.equal(result.diagnostic.reason,'network');assert.equal(result.diagnostic.code,'EAI_AGAIN');assert(failureMessage(result).includes('DNS'));assert(!JSON.stringify(result).includes(key));
 const arbitrary=createJev({key,fetch:async()=>{const error=new Error(key);error.cause={code:key};throw error;}});assert(!JSON.stringify(await arbitrary.decide(body,'test')).includes(key));
 const slow=createJev({key,timeoutMs:20,fetch:async(u,o)=>new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>reject(new Error(key))))});assert.equal((await slow.decide(body,'test')).diagnostic.reason,'timeout');
 const low=createJev({key,fetch:async()=>response({type:'choice',choice:'approach',confidence:.1})});let message;
 await check({service:low,log:text=>{message=text;}});assert(message.includes('baixa confiança'));assert.deepEqual((await low.decide(body,'test')).body.choices,{});
 for(const payload of [null,{}, {answers:{actor0:{type:'choice',choice:'delete-files',confidence:1}}}]){
  const service=createJev({key,fetch:async()=>({ok:true,text:async()=>JSON.stringify(payload)})});assert.equal((await service.decide(body,'test')).diagnostic.reason,'invalid_answer');await assert.rejects(check({service,log:()=>{}}),/formato incompatível/);
 }
 console.log('Ativação Jev: DNS/HTTP/timeout identificados, baixa confiança aceita como conexão válida e erros sem chave: OK');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
