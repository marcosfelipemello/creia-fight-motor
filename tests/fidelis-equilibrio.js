// Mesma base de 16 personagens de tests/equilibrio.js, com RNG reproduzível.
// 15 adversários × 2 lados × 2 sementes = 60 partidas do Fidelis.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'equilibrio.js'),'utf8').split("console.log('================================================================');")[0];
let wins=0,total=0;
for(const rival of ['nutri','lutador','emanuelly','enzo','pedro','naju','grazi','bispo','lohan','rafinha','douglas','arthur','lucas','duda','cardoso']){
  for(let side=0;side<2;side++)for(let match=0;match<2;match++){
    let seed=8129+match*101+side*19;
    const seededMath=Object.create(Math);
    seededMath.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const code=source.replace('console, Math, Date','console, Math: seededMath, Date');
    const {createEngine,simulateMatch}=new Function('require','__dirname','seededMath',code+'\nreturn {createEngine,simulateMatch};')(require,__dirname,seededMath);
    if(simulateMatch(createEngine(),side?rival:'fidelis',side?'fidelis':rival)===side)wins++;
    total++;
  }
}
const rate=wins/total;
console.log(`Fidelis: ${wins}/${total} vitórias (${(rate*100).toFixed(1)}%) na amostra reproduzível.`);
assert(rate>=.4&&rate<=.6,'Fidelis fora da faixa de 40%–60% nessa amostra');
