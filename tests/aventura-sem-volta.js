// Integração do Cardoso no combate, no X1 e na campanha inteira.
// Uso: node tests/cardoso.js
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const scripts=['sprites','backgrounds','bosses','viloes','cenarios-arte','criancas','bichos','objetos','rig','combate-config','ia-tatica','hud-combate','game'];
const noop=()=>{};

function client() {
  const rows=[],titles=[],packets=[];let answer=()=>Promise.resolve("EQUIPE"),send=row=>{rows.push(row);return Promise.resolve({ok:true});};
  let nextFrame,clock=0;
  const events={}, textSeen=new Set();
  const ctx=new Proxy({}, {get(_,key) {
    if(key==='measureText') return s=>({width:String(s).length*8});
    if(key==='fillText') return s=>textSeen.add(String(s));
    if(key==='createLinearGradient'||key==='createRadialGradient') return ()=>({addColorStop:noop});
    return noop;
  },set:()=>true});
  const canvas=()=>({width:480,height:270,getContext:()=>ctx,getBoundingClientRect:()=>({width:480,height:270})});
  const env={console,Math,Date,TextEncoder,URLSearchParams,performance:{now:()=>clock},
    location:{search:'',hostname:'127.0.0.1'},navigator:{maxTouchPoints:0},devicePixelRatio:1,
    Image:class {set src(v){this.complete=true;this.naturalWidth=100;}},
    localStorage:{getItem:()=>JSON.stringify({tut:true,best:10}),setItem:noop},
    document:{getElementById:canvas,createElement:canvas,head:{appendChild:noop},body:{appendChild:noop}},
    addEventListener:(name,fn)=>{events[name]=fn;},requestAnimationFrame:fn=>{nextFrame=fn;},setTimeout,clearTimeout};
  env.CreiaUI={sync(state,commands){env.uiState=state;env.commands=commands;}};
  env.BanguOnline={onMessage:null,leave:noop,showLink:noop,hideOverlay:noop,send:packet=>{packets.push(packet);return true;},ranking:()=>Promise.resolve({ranking:rows}),askText:title=>{titles.push(title);return answer();},score:row=>send(row)};
  env.window=env; vm.createContext(env);
  for(const name of scripts) {
    let source=fs.readFileSync(path.join(root,'js',name+'.js'),'utf8');
    if(name==='game')source=source.replace(/\}\(\)\);\s*$/, `window.flowTest={
      get menu(){return MENU;},
      start(){menuStage=10;startTeam([{who:'lutador',ctl:0},{who:'nutri',ctl:null}],true,false);},
      win(){startStage(10);phase='clear';phaseT=5;},
      setScore(n){score=n;},
      coop(){onlineBegin(true,'TESTE','coop');online.choice='lutador';online.other='nutri';online.peerReady=true;scene='coopSetup';}
    };}());`);
    vm.runInContext(source,env,{filename:name+'.js'});
  }
  return {api:env.__bangu,textSeen,rows,titles,packets,flow:env.flowTest,get commands(){return env.commands;},answer:fn=>{answer=fn;},send:fn=>{send=fn;},
    tick(n=1){for(let i=0;i<n;i++){clock+=1000/60;nextFrame(clock);}},
    key(code){events.keydown({code,preventDefault:noop});this.tick();events.keyup({code});},
    until(fn,max=900){for(let i=0;i<max&&!fn();i++)this.tick();assert(fn(),'estado esperado não chegou');}};
}

// Asserções no fluxo real; os únicos atalhos preparam o início e o fim da fase 10.
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
(async()=>{
 const c=client();c.tick();
 assert(!Array.from(c.flow.menu).includes('FASE'));
 assert(!c.textSeen.has('FASE 1'));
 c.key('KeyS');c.key('KeyS');c.key('Enter');assert.equal(c.api.state.scene,'controls','índices do menu ficaram desalinhados');c.key('Escape');
 c.flow.start();assert.equal(c.api.state.stage,1,'saved.best e menuStage altos alteraram a fase inicial');
 const team=c.api.state.players;team[0].dead=true;team[0].hp=0;team[1].hp=25;
 assert(c.api.petCat());assert.equal(team[0].dead,false);assert.equal(team[0].hp,team[0].maxHp*.15);assert.equal(team[1].hp,25+team[1].maxHp*.15);
 assert(!('checkpoint' in c.api.state));assert.equal(c.api.petCat(),false);
 c.tick(260);assert(c.textSeen.has('GATINHO: +15% DE VIDA'));assert(!c.textSeen.has('CHECKPOINT!'));
 let resolveName;c.answer(()=>new Promise(resolve=>{resolveName=resolve;}));c.flow.setScore(1234);
 c.api.state.players.forEach(p=>{p.dead=true;p.hp=0;});c.until(()=>c.api.state.scene==='gameover');
 c.key('Enter');c.key('Escape');assert.equal(c.api.state.scene,'gameover');assert(c.api.state.players.every(p=>p.dead));
 assert(!Array.from(c.textSeen).some(t=>/voltar ao gatinho|tentar a fase de novo/i.test(t)));
 resolveName('DUPLA');await flush();assert.equal(c.rows.length,1);assert.equal(c.rows[0].score,1234);assert.equal(c.api.state.scene,'ranking');
 c.key('Enter');assert.equal(c.api.state.scene,'menu');c.flow.start();assert.equal(c.api.state.stage,1);
 c.flow.setScore(5000);c.flow.win();c.api.sim(.1,true);assert.equal(c.api.state.scene,'ending');
 resolveName('VITORIA');await flush();assert.equal(c.rows.length,2);assert.equal(c.rows[1].stage,10);assert.equal(c.api.state.scene,'ranking');c.key('Escape');assert.equal(c.api.state.scene,'menu');
 // Uma recusa do ranking mantém o resultado, sem reviver e sem envio repetido por duplo clique.
 const fail=client();fail.flow.start();fail.send(()=>Promise.reject(Object.assign(Error('offline'),{status:503})));fail.api.state.players.forEach(p=>{p.dead=true;p.hp=0;});fail.until(()=>fail.api.state.scene==='gameover');await flush();assert.equal(fail.api.state.scene,'gameover');
 fail.send(row=>{fail.rows.push(row);return Promise.resolve({ok:true});});fail.key('Enter');fail.key('Enter');await flush();assert.equal(fail.rows.length,1);assert.equal(fail.rows[0].score,0);assert.equal(fail.api.state.scene,'ranking');
 const anonymous=client();anonymous.answer(()=>Promise.resolve(null));anonymous.flow.start();anonymous.api.state.players.forEach(p=>{p.dead=true;p.hp=0;});anonymous.until(()=>anonymous.api.state.scene==='gameover');await flush();assert.equal(anonymous.rows.length,1);assert.equal(anonymous.rows[0].name,'JOGADOR');assert.equal(anonymous.api.state.scene,'ranking');
 const coop=client();coop.flow.coop();coop.tick();coop.commands.coop('stage',10);coop.commands.coop('start');coop.tick(4);assert.equal(coop.api.state.scene,'play');assert.equal(coop.api.state.stage,1);assert.equal(coop.packets.find(p=>p.type==='start').stage,1);
 console.log('Aventura sem volta: menu, fase 1 local/coop, gato sem checkpoint, morte/vitória, ranking único por tentativa, zero pontos e reenvio após falha: OK');
})().catch(err=>{console.error(err);process.exitCode=1;});
