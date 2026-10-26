'use strict';
const assert=require('node:assert/strict'),{Readable}=require('node:stream');
const {server}=require('../server/index');
function send(method,url,body,headers={}){
 return new Promise((resolve,reject)=>{const req=Readable.from(body===undefined?[]:[Buffer.from(body)]);Object.assign(req,{method,url,headers:Object.assign({host:'bangu.kryventech.com.br'},headers),socket:{remoteAddress:'127.0.0.1'}});let status;
 const res={setHeader(){},writeHead(n){status=n;},end(raw){try{resolve({status,body:raw?JSON.parse(raw):null});}catch(e){reject(e);}}};server.emit('request',req,res);});
}
(async()=>{
 const state=await send('GET','/api/ai/status');assert.equal(state.status,200);assert.equal(state.body.version,1);assert.equal(typeof state.body.enabled,'boolean');assert(!JSON.stringify(state.body).includes('apikey'));
 assert.equal((await send('POST','/api/ai/tactics','{}',{'content-type':'text/plain'})).status,415);
 assert.equal((await send('POST','/api/ai/tactics','{}',{'content-type':'application/json',origin:'https://unrelated.example'})).status,403);
 assert.equal((await send('POST','/api/ai/tactics','{',{'content-type':'application/json'})).status,400);
 assert.equal((await send('POST','/api/ai/tactics',' '.repeat(8193),{'content-type':'application/json'})).status,413);
 console.log('HTTP Jev: status sem credencial, origem, JSON e tamanho do corpo: OK (sem chamada externa)');
})().catch(e=>{console.error(e);process.exitCode=1;});
