'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..'),noop=()=>{};
function client() {
  const events={},texts=[];let frame,clock=0;
  const ctx=new Proxy({}, {get(_,key) {
    if(key==='measureText')return s=>({width:String(s).length*8});
    if(key==='fillText')return s=>texts.push(s);
    if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>({addColorStop:noop});
    return noop;
  },set:()=>true});
  const canvas={width:480,height:270,getContext:()=>ctx,
    getBoundingClientRect:()=>({left:37,top:19,width:960,height:540})};
  const env={console,Math,Date,TextEncoder,URLSearchParams,
    performance:{now:()=>clock},location:{search:'',hostname:'127.0.0.1'},navigator:{maxTouchPoints:0},
    Image:class{set src(v){this.complete=true;this.naturalWidth=100;}},
    localStorage:{getItem:()=>JSON.stringify({tut:true,best:10}),setItem:noop},
    document:{getElementById:()=>canvas,createElement:()=>canvas,head:{appendChild:noop},body:{appendChild:noop}},
    addEventListener:(name,fn)=>{events[name]=fn;},requestAnimationFrame:fn=>{frame=fn;},setTimeout,clearTimeout};
  env.window=env;vm.createContext(env);
  for(const name of ['sprites','backgrounds','bosses','viloes','cenarios-arte','criancas','bichos','objetos','rig','combate-config','ia-tatica','hud-combate','game']) {
    let source=fs.readFileSync(path.join(root,'js',name+'.js'),'utf8');
    if(name==='game')source=source.replace(/\}\(\)\);\s*$/,
      'window.selectionTest={get value(){return sel;},grid:gridMove,layout:selectLayout,roster:ROSTER};}());');
    vm.runInContext(source,env,{filename:name+'.js'});
  }
  function tick(){clock+=1000/60;frame(clock);}
  return {texts,test:env.selectionTest,get state(){return env.__bangu.state;},tick,
    get sel(){return env.selectionTest.value;},
    key(code){events.keydown({code,preventDefault:noop});tick();events.keyup({code});},
    click(x,y){events.pointerdown({target:canvas,button:0,clientX:37+x*2,clientY:19+y*2,preventDefault:noop});tick();},
    portrait(index){const t=env.selectionTest.layout().tiles[index];this.click(t.x+t.size/2,t.y+t.size/2);},
    go(){this.click(240,env.selectionTest.layout().textY+73);}};
}
const coop=client();coop.tick();
assert(coop.texts.includes('Creia Fight'));
coop.key('KeyS');coop.key('Enter');
for(let i=0;i<4;i++) {
  coop.key('KeyJ');
  assert.equal(coop.sel.slots[0].cur,i<3?i+1:coop.test.roster.length);
  assert.equal(coop.sel.ai.length,Math.max(0,i));
  assert.equal(coop.sel.vsT,-1,'seleção iniciou a partida sem confirmar');
}
coop.go();assert(coop.sel.vsT>=0);
const early=client();early.key('KeyS');early.key('Enter');early.portrait(3);
assert.equal(early.sel.slots[0].pick,3);
assert.equal(early.sel.slots[0].cur,4);
early.go();assert(early.sel.vsT>=0,'clique em INICIAR não aceitou time de um lutador');
const mouse=client();mouse.key('KeyS');mouse.key('Enter');
for(let i=0;i<4;i++)mouse.portrait(i);
assert.equal(mouse.sel.slots[0].cur,mouse.test.roster.length);
assert.equal(mouse.sel.ai.length,3);
const x1=client();x1.key('Enter');x1.key('Enter');
x1.portrait(0);x1.go();assert.equal(x1.sel.vsT,-1,'X1 começou sem adversário');
x1.portrait(1);assert.equal(x1.sel.slots[0].cur,x1.test.roster.length);
x1.key('Enter');assert(x1.sel.vsT>=0);
const p2=client();p2.key('Enter');p2.key('KeyD');p2.key('Enter');
p2.key('KeyJ');p2.key('Comma');p2.key('Comma');
assert.equal(p2.sel.slots[0].cur,p2.test.roster.length,'P2 não direcionou P1 para INICIAR');
const grid=client().test;
for(let i=0;i<grid.roster.length;i++) {
  const tiles=grid.layout().tiles,from=tiles[i];
  for(const dir of ['right','left','down','up']){
    const next=grid.grid(n=>n===dir,i,grid.roster.length);assert(next>=0&&next<grid.roster.length);
    if(dir==='right')assert.equal(next,(i+1)%grid.roster.length);
    if(dir==='left')assert.equal(next,(i+grid.roster.length-1)%grid.roster.length);
    if(dir==='down'||dir==='up'){
      const row=(from.row+4+(dir==='down'?1:-1))%4;assert.equal(tiles[next].row,row);
      const closest=Math.min(...tiles.filter(t=>t.row===row).map(t=>Math.abs(t.x-from.x)));assert.equal(Math.abs(tiles[next].x-from.x),closest);
    }
  }

}
assert.deepEqual(Array.from(grid.layout().counts),[4,5,6,5]);assert.equal(grid.roster.length,20);
console.log('Creia Fight, grade 4/5/6/4, seleção automática de 1–4, X1 CPU/P2, clique com escala e navegação circular: OK');
