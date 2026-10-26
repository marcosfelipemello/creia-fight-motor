'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const noop=()=>{},env={window:{Rig:{height:76,draw:noop,big:noop,portrait:noop,ready:()=>true,item:noop}},Image:class{constructor(){this.complete=true;this.naturalWidth=this.naturalHeight=512;}set src(v){}}};
vm.createContext(env);for(const name of ['ricardo-assets','artes-ricardo'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+name+'.js'),'utf8'),env);
const draws=[],shifts=[],ctx={save:noop,restore:noop,scale:noop,rotate:noop,translate:(x,y)=>shifts.push([x,y]),drawImage:(...args)=>draws.push(args)};
env.window.Rig.draw(ctx,'ricardo','idle',0,0,0,1,{});const base=draws.pop();
for(const facing of [1,-1])for(let frame=0;frame<34;frame++){env.window.Rig.draw(ctx,'ricardo','roll',frame/60,0,0,facing,{});const roll=draws.pop(),scale=roll[3]/512;assert(roll[3]<base[3]*.75,'rolagem desproporcional à pose base');assert(Math.abs(scale*213*2-76*.62)<1e-8);assert(Math.abs(roll[1]+265.5*scale)<1e-8);assert(Math.abs(roll[2]+281*scale)<1e-8);assert(shifts.some(p=>p[0]===0&&Math.abs(p[1]+23.56)<1e-8),'pivô da rolagem não acompanha o tamanho');}
console.log('Ricardo: rolagem reduzida, centro fixo e altura proporcional de 62% da pose em pé nas duas direções: OK');
