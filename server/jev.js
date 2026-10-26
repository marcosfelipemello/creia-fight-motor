'use strict';
// Nenhuma credencial é enviada ao navegador. O modelo só escolhe táticas permitidas.
const fs = require('node:fs');
const path = require('node:path');
const combat = require('../js/combate-config.js');
const fighters = new Set(Object.keys(combat.primary));
const intents = ['approach','pressure','defend','counter','recover','special','bait'];
const bossMoves = new Set(['peck','roll','miniShot','flood','splash','oil','dash','stomp','bacon','palha','eggs','mayo','fly','summon','triple','rain','cheese','skewers','smoke','boulder']);
function privateKey() {
  if (process.env.TYPESAFE_API_KEY) return process.env.TYPESAFE_API_KEY.trim();
  try { return fs.readFileSync(path.join(__dirname,'../.secrets/typesafe.key'),'utf8').trim(); } catch (_) { return ''; }
}
function createJev(options={}) {
  const key=options.key===undefined?privateKey():options.key, request=options.fetch||globalThis.fetch;
  const timeoutMs=Number.isFinite(options.timeoutMs)?Math.max(10,Math.min(10000,options.timeoutMs)):1500;
  const clock=options.clock||Date.now, perMinute=30, ips=new Map();
  let active=0, windowAt=clock(), used=0;
  function status(){return {enabled:!!key,model:'jev-latest',version:1,maxRequestsPerMinute:perMinute};}
  const number=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)?Math.max(min,Math.min(max,n)):min;
  function clean(body){
    if(!body||!Array.isArray(body.actors)||!body.actors.length||body.actors.length>6)return null;
    const actors=[];
    for(let i=0;i<body.actors.length;i++){
      const a=body.actors[i];if(!a||!['fighter','boss'].includes(a.kind))return null;
      const boss=a.kind==='boss';if(!boss&&!fighters.has(a.character))return null;
      if(boss&&(!Array.isArray(a.attacks)||!a.attacks.length||a.attacks.length>8||a.attacks.some(x=>!bossMoves.has(x))))return null;
      actors.push({id:'actor'+i,kind:a.kind,character:boss?'boss':a.character,difficulty:['facil','medio','dificil'].includes(a.difficulty)?a.difficulty:'medio',
        health:number(a.health,0,1),opponentHealth:number(a.opponentHealth,0,1),distance:number(a.distance,0,1200),specialReady:a.specialReady===true,
        opponentGuarding:a.opponentGuarding===true,projectileThreat:a.projectileThreat===true,
        primaryReady:a.primaryReady===true,secondaryReady:a.secondaryReady===true,
        primaryRange:boss?0:combat.primaryRange(a.character),secondaryRange:boss?0:combat.secondary[a.character][2],guardReady:a.guardReady===true,guardEnergy:number(a.guardEnergy,0,1),
        attacks:boss?Array.from(new Set(a.attacks)):intents});
    }
    return {mode:body.mode==='x1'?'x1':'adventure',actors};
  }
  async function decide(body,ip){
    const failed=(reason,extra={})=>({status:503,body:{fallback:true},diagnostic:{reason,...extra}});
    if(!key)return failed('missing_key');
    const state=clean(body);if(!state)return {status:400,body:{fallback:true}};
    const now=clock();if(now-windowAt>=60000){windowAt=now;used=0;ips.clear();}
    if(active>=2||used>=perMinute||(ips.get(ip)||0)>=6)return {status:429,body:{fallback:true}};
    used++;ips.set(ip,(ips.get(ip)||0)+1);active++;
    const questions={};
    state.actors.forEach((a,index)=>{
      const descriptions={approach:'Close the gap to effective attack range.',pressure:'Maintain safe attacking distance and alternate available attacks.',defend:'Guard an approaching attack after the difficulty reaction delay.',counter:'Punish an opponent recovery with an available secondary attack.',recover:'Retreat or heal when health is low.',special:'Use a ready special only against a vulnerable opponent.',bait:'Change spacing and wait for the opponent to commit.'};
      questions[a.id]={type:'choice',instructions:a.kind==='boss'?'Select one allowed boss attack suited to distance and health. Telegraphs and damage are controlled by the game.':'Choose a short-lived combat tactic. Respect difficulty, cooldowns and visible information; never change damage or grant invulnerability.',criteria:Object.fromEntries(a.attacks.map(x=>[x,descriptions[x]||'Use the allowed '+x+' attack when appropriate to the visible situation.']))};
      questions[a.id].instructions+=' Decide specifically for `actors['+index+']` in the supplied state.';
    });
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const response=await request('https://api.typesafe.ai/v1/systemone',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify({model:'jev-latest',state,questions}),signal:controller.signal});
      if(!response.ok)return failed('upstream_http',{httpStatus:Number.isInteger(response.status)?response.status:0});
      const raw=await response.text();if(raw.length>32768)return failed('response_too_large');
      let result;try{result=JSON.parse(raw);}catch(_){return failed('invalid_json');}
      const choices={};let validAnswers=0;
      state.actors.forEach(a=>{const answer=result&&result.answers&&result.answers[a.id];if(answer&&answer.type==='choice'&&a.attacks.includes(answer.choice)&&typeof answer.confidence==='number'&&Number.isFinite(answer.confidence)&&answer.confidence>=0&&answer.confidence<=1){validAnswers++;if(answer.confidence>=.4)choices[a.id]=answer.choice;}});
      if(!validAnswers)return failed('invalid_answer');
      return {status:200,body:{choices,ttl:3},diagnostic:{reason:Object.keys(choices).length?'ok':'low_confidence',validAnswers}};
    }catch(error){
      if(controller.signal.aborted)return failed('timeout',{timeoutMs});
      const code=error&&error.cause&&error.cause.code;
      const safeCodes=['EAI_AGAIN','ENOTFOUND','ECONNREFUSED','ECONNRESET','ETIMEDOUT','ENETUNREACH','EHOSTUNREACH','CERT_HAS_EXPIRED','UNABLE_TO_VERIFY_LEAF_SIGNATURE'];
      return failed('network',safeCodes.includes(code)?{code}:{});
    }finally{clearTimeout(timer);active--;}
  }
  return {status,decide,clean};
}
module.exports={createJev};
