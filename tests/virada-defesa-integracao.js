'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs);
for(const page of ['index.html','jogo.html']){
 const html=read(path.join(root,page),'utf8');
 for(const file of ['virada-visual','defesa-visual']){const tag='js/'+file+'.js';assert.equal(html.split(tag).length,2,page+': módulo duplicado/ausente');assert(html.indexOf(tag)<html.indexOf('js/game.js'));}
}
let harness=read(path.join(__dirname,'rounds.js'),'utf8').split('function startLocal()')[0];
harness=harness.replace("'hud-combate','game'", "'hud-combate','virada-visual','defesa-visual','game'");
harness=harness.replace('transport, textSeen,','env, transport, textSeen,');
harness=harness.replace("if (key === 'measureText')", "if(key==='fillRect')return (...args)=>{if(env.__visualDrawing)env.__pixels.push(args);};if (key === 'measureText')");
const testFs=Object.assign({},fs,{readFileSync(file,...args){
 let source=read(file,...args);
 if(path.resolve(String(file))===path.join(root,'js/game.js')){
  source=source.replace('  window.__bangu = {',`  window.__fx={mark:updateVirada,draw:drawCombatScreen,hit:damagePlayer,reset:resetVersusRound,stage:startStage,snapshot:onlineSnapshot,
    get cam(){return cam;},get time(){return time;},set time(v){time=v;},get fx(){return viradaFx;},
    set scene(v){scene=v;},set paused(v){paused=v;},set cine(v){cine=v;},set controls(v){showCtl=v;},set config(v){showCfg=v;}};
  window.__bangu = {`);
  source=source.replace('  function drawHUD() {',"  function drawHUD() {if(window.__trace)window.__trace.push(['hud']);");
  source=source.replace('  function drawPlayer(p) {',"  function drawPlayer(p) {if(window.__trace)window.__trace.push(['fighter',p.who]);");
 }
 return source;
}});
const factory=new Function('require','__dirname',harness+'\nreturn client;')(name=>name==='node:fs'?testFs:require(name),__dirname);
function client(){
 const g=factory(),env=g.env;env.__trace=[];env.__pixels=[];
 for(const [name,methods] of [['ViradaVisual',['draw','entrada']],['DefesaVisual',['spawn','draw','contra','update','reset']]]){
  for(const method of methods){const real=env[name][method];env[name][method]=function(...args){
   env.__trace.push([name+'.'+method,...args.slice(method==='draw'&&name==='ViradaVisual'?3:method==='entrada'?3:method==='contra'?1:method==='draw'?1:0)]);
   const previous=env.__visualDrawing;env.__visualDrawing=/draw|entrada|contra/.test(method);try{return real.apply(this,args);}finally{env.__visualDrawing=previous;}
  };}
 }
 env.DefesaVisual.load(null);return g;
}
const calls=(g,name)=>g.env.__trace.filter(row=>row[0]===name);
function clear(g){g.env.__trace.length=0;g.env.__pixels.length=0;}
function local(vs=true){
 const g=client();g.env.__bangu.startTeam(vs?[{who:'th',ctl:0},{who:'bispo',ctl:1}]:[{who:'th',ctl:0},{who:'bispo',ctl:null}],false,vs);
 if(vs)g.until(s=>s.round.phase==='fight');clear(g);return g;
}
// Engine + módulos reais: borda entre mundo e HUD, rampa e aviso sem duplicação.
{
 const g=local(),[p,q]=g.state.players,t=g.env.__fx;
 p.hp=20;t.mark(p);assert.equal(p.virada,true);t.draw(.15);
 let border=calls(g,'ViradaVisual.draw').at(-1)[1];assert.equal(border.lado,'esquerda');assert(Math.abs(border.forca-.5)<1e-8);
 assert.equal(calls(g,'ViradaVisual.entrada').length,1);assert(g.env.__pixels.length>0,'módulos não desenharam no canvas');
 assert(!g.textSeen.has('UNÇÃO DOBRADA!'),'letreiro e floatText duplicados');
 const names=g.env.__trace.map(r=>r[0]);assert(names.lastIndexOf('fighter')<names.indexOf('ViradaVisual.draw'));assert(names.indexOf('ViradaVisual.draw')<names.indexOf('hud'));
 clear(g);t.draw(.15);assert.equal(calls(g,'ViradaVisual.draw')[0][1].forca,1);
 p.hp=50;t.mark(p);clear(g);t.draw(.15);assert.equal(calls(g,'ViradaVisual.draw')[0][1].forca,.5);
 clear(g);t.draw(.15);assert.equal(calls(g,'ViradaVisual.draw').length,0);
 // Cura/recaída no mesmo round mantém o aviso único.
 t.draw(.8);p.hp=20;t.mark(p);clear(g);t.draw(.016);assert.equal(calls(g,'ViradaVisual.entrada').length,0);
 p.x=t.cam+350;clear(g);t.draw(.016);assert.equal(calls(g,'ViradaVisual.draw')[0][1].lado,'direita');
 q.hp=20;t.mark(q);q.x=t.cam+150;clear(g);t.draw(.3);assert.equal(calls(g,'ViradaVisual.draw').length,2);
 t.reset();clear(g);t.draw(.016);assert.equal(calls(g,'ViradaVisual.draw').length,0);assert.equal(calls(g,'ViradaVisual.entrada').length,0);
 assert.equal(t.fx.every(f=>f.forca===0),true);
}
{
 const g=local(false),[p,ai]=g.state.players,t=g.env.__fx;
 ai.hp=20;t.mark(ai);t.draw(.3);assert.equal(calls(g,'ViradaVisual.draw').length,0,'IA acendeu borda na aventura');
 p.hp=20;t.mark(p);clear(g);t.draw(.3);assert.equal(calls(g,'ViradaVisual.draw')[0][1].lado,'tudo');
 g.env.DefesaVisual.spawn(p.x,p.y,p.facing);t.stage(2,false);clear(g);t.draw(.016);assert.equal(calls(g,'ViradaVisual.draw').length,0);assert.equal(g.env.__pixels.length,0,'troca de fase manteve faísca/entrada');
}
console.log('Integração Virada: scripts nas duas páginas, desenho real antes do HUD, lados, aventura humana, rampa 0,3 s e aviso único/reset: OK');
// Evento real de defesa perfeita: ponto dos pés, uma faísca e mão no mesmo espaço dos lutadores.
{
 const g=local(),[p,q]=g.state.players,t=g.env.__fx;p.inv=q.inv=0;p.facing=1;
 g.key('KeyE');
 clear(g);t.time=p.guardStartT+.08;t.hit(p,10,24,p.x+40,'versus',q,false,undefined,true);
 const spawn=calls(g,'DefesaVisual.spawn');assert.equal(spawn.length,1);assert.deepEqual(spawn[0].slice(1),[p.x,p.y-p.z,p.facing]);
 t.draw(.016);assert(g.env.__pixels.length>0);assert.equal(calls(g,'DefesaVisual.contra').length,1);
 assert.deepEqual(calls(g,'DefesaVisual.contra')[0].slice(1),[p.x-t.cam+p.facing*22,p.y-p.z-36,p.contraT]);
 const names=g.env.__trace.map(r=>r[0]);assert(names.lastIndexOf('fighter')<names.indexOf('DefesaVisual.draw'));
 p.contraT=0;clear(g);t.draw(.5);assert.equal(g.env.__pixels.length,0,'faísca não expirou');assert.equal(calls(g,'DefesaVisual.contra').length,0);
 g.env.DefesaVisual.spawn(p.x,p.y,p.facing);t.reset();clear(g);t.draw(.016);assert.equal(g.env.__pixels.length,0,'troca de round manteve faísca');
}
// Render e relógios visuais bloqueados em todas as sobreposições; voltam do mesmo instante.
for(const mode of ['paused','controls','config','cine','special','remote','menu']){
 const g=local(),p=g.state.players[0],t=g.env.__fx;p.hp=20;t.mark(p);p.contraT=.6;g.env.DefesaVisual.spawn(p.x,p.y,p.facing);t.draw(.1);
 const age=t.fx[0].entrada,force=t.fx[0].forca;
 if(mode==='cine')t.cine={p,t:0};else if(mode==='special'){g.state.players[1].state='special';g.state.players[1].st=0;}else if(mode==='menu')t.scene='menu';else if(mode!=='remote')t[mode]=true;
 clear(g);t.draw(.2,mode==='remote');
 for(const name of ['ViradaVisual.draw','ViradaVisual.entrada','DefesaVisual.draw','DefesaVisual.contra','DefesaVisual.update'])assert.equal(calls(g,name).length,0,mode+' exibiu/avançou '+name);
 assert.equal(t.fx[0].entrada,age);assert.equal(t.fx[0].forca,force);
}
console.log('Integração Defesa: faísca nas coordenadas corretas, brilho da mão, expiração/reset e efeitos ocultos/congelados em pausa/menu/especial: OK');
// Dois motores e relay reais: flags autoritativas e deduplicação dos eventos.
{
 const host=client(),guest=client();host.key('Enter');host.key('KeyD');host.key('KeyD');host.key('KeyD');host.key('Enter');guest.transport.join(host.transport.code);host.key('Enter');guest.key('KeyD');guest.key('Enter');host.tick();host.until(s=>s.round.phase==='fight');
 const t=host.env.__fx,[q,p]=host.state.players;p.hp=25.01;t.mark(p);host.tick(4);guest.tick();
 clear(guest);guest.tick();assert.equal(calls(guest,'ViradaVisual.draw').length,0,'convidado recalculou virada usando HP arredondado');
 p.hp=20;t.mark(p);host.tick(4);clear(guest);guest.tick(3);assert(calls(guest,'ViradaVisual.draw').length>0);assert(calls(guest,'ViradaVisual.entrada').length>0);
 // Pacote repetido não repete spawn, enquanto o desenho segue em cada quadro.
 p.inv=0;p.ctrl={x:0,y:0,use:true};p.state='guard';p.guardStartT=t.time;p.guardPerfectReady=true;p.facing=q.x<p.x?-1:1;
 clear(guest);t.hit(p,10,24,q.x,'versus',q,false,undefined,true);const snapshot=t.snapshot();guest.transport.onMessage({type:'snapshot',state:snapshot});guest.transport.onMessage({type:'snapshot',state:snapshot});guest.tick();
 assert.equal(calls(guest,'DefesaVisual.spawn').length,1);assert(calls(guest,'DefesaVisual.contra').length>0);
 clear(guest);host.env.__fx.reset();host.tick(4);guest.tick();assert(calls(guest,'DefesaVisual.reset').length>0);assert.equal(calls(guest,'ViradaVisual.draw').length,0);assert.equal(guest.env.__pixels.length,0);
 host.transport.leave();
}
console.log('Integração online: virada do snapshot, entrada, spawn único, contra e limpeza no novo round: OK');
