'use strict';
// 200 X1 reproduzíveis, com os 20 lutadores nos dois lados.
// VIRADA_BASELINE_DIR permite comparar a cópia anterior do motor/configuração.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),before=process.env.VIRADA_BASELINE_DIR;
const originalRead=fs.readFileSync.bind(fs);
const testFs=Object.assign({},fs,{readFileSync(file,...args){
 const absolute=path.resolve(String(file));
 if(before&&(absolute===path.join(root,'js/game.js')||absolute===path.join(root,'js/combate-config.js')))return originalRead(path.join(before,path.basename(absolute)),...args);
 return originalRead(file,...args);
}});
const source=originalRead(path.join(__dirname,'equilibrio.js'),'utf8').split("console.log('================================================================');")[0].replace('console, Math, Date','console, Math: seededMath, Date').replace("'hud-combate', 'game'","'hud-combate', 'adriene-visual', 'game'");
const roster=Object.keys(require('../js/combate-config').primary),wins={},total={};
roster.forEach(who=>{wins[who]=0;total[who]=0;});
for(let round=0;round<10;round++)for(let i=0;i<roster.length;i++){
 let seed=310026+round*131+i*17;
 const seededMath=Object.create(Math);seededMath.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const api=new Function('require','__dirname','seededMath',source+'\nreturn {createEngine,simulateMatch};')(name=>name==='node:fs'?testFs:require(name),__dirname,seededMath);
 const a=roster[i],b=roster[(i+round+1)%roster.length];
 const winner=api.simulateMatch(api.createEngine(),a,b);wins[winner===0?a:b]++;total[a]++;total[b]++;
}
const result={matches:200,seed:310026,baseline:!!before,players:{}};
roster.forEach(who=>{result.players[who]={wins:wins[who],total:total[who],rate:100*wins[who]/total[who]};});
console.log(JSON.stringify(result,null,2));
