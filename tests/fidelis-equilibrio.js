// Fidelis no rodízio do X1: contra os outros 19, nos dois lados, sorteio fixo (tests/apoio/x1-rodizio.js).
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const cfg=fs.readFileSync(path.join(__dirname,'..','js','combate-config.js'),'utf8');
require('./apoio/x1-rodizio.js').runTournament(cfg,6,{mp:3,filtro:(a,b)=>a==='fidelis'||b==='fidelis'}).then(r=>{
  const f=r.charStats.find(c=>c.who==='fidelis');
  console.log(`Fidelis: ${f.wins}/${f.total} vitórias (${(f.rate*100).toFixed(1)}%) na amostra reproduzível.`);
  assert(f.rate>=.38&&f.rate<=.62,'Fidelis fora da faixa de 38%–62% nessa amostra');
}).catch(e=>{console.error(e);process.exitCode=1;});
