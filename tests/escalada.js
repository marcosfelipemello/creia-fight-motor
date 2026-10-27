'use strict';
// Escalada: seleção de 1 lutador, 19 adversários sorteados, torre, subida, campeão e derrota.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync.bind(fs);
let harness=read(path.join(__dirname,'cardoso.js'),'utf8').split('const c=client();')[0];
harness=harness.replace('return {api:env.__bangu,textSeen,','return {env,api:env.__bangu,textSeen,');
harness=harness.replace("localStorage:{getItem:()=>JSON.stringify({tut:true,best:10}),setItem:noop}", "localStorage:((s=new Map([['bangu-save',JSON.stringify({tut:true,best:10})]]))=>({getItem:k=>s.has(k)?s.get(k):null,setItem:(k,v)=>s.set(k,String(v)),store:s}))()");
fs.readFileSync=function(file,...args){
 if(path.resolve(String(file))===path.join(root,'js/game.js'))return read(file,...args).replace('  window.__bangu = {','  window.__escTest={bridge:uiBridge,ui:modernUIState,get esc(){return esc;}};\n  window.__bangu = {');
 return read(file,...args);
};

try {
  function makeClient() {
    const c = new Function('require','__dirname',harness+'\nreturn client;')(require,__dirname)();
    if (c.env.window.Rig) {
      c.env.window.Rig.ready = () => true;
      c.env.window.Rig.draw = () => true;
      c.env.window.Rig.big = () => true;
      c.env.window.Rig.portrait = () => true;
    }
    return c;
  }

  const g = makeClient(), b = g.env.__escTest.bridge, api = g.api;

  // 1. Entrada pelo X1: botão Escalada (índice 5)
  b.mode('pve');
  b.x1(5);
  g.tick();
  assert.equal(api.state.scene, 'select', 'deve entrar na seleção');

  // Seleciona o 1º lutador
  b.pick(0);
  g.tick(2);
  const selUI = g.env.__escTest.ui().selection;
  assert.equal(selUI.team.length, 1, 'escalada deve escolher apenas 1 lutador');
  const chosenWho = selUI.team[0].who;

  // Segundo lutador não pode entrar
  b.pick(1);
  g.tick(2);
  assert.equal(g.env.__escTest.ui().selection.team.length, 1, 'segundo lutador não pode entrar na escalada');

  // Confirmar seleção vai direto para 'escalada', sem stagesel
  b.pick(g.env.__escTest.ui().roster.length);
  g.tick(2);
  assert.equal(api.state.scene, 'escalada', 'deve ir direto para escalada sem tela de cenário');

  const esc = api.escalada;
  assert(esc, 'objeto escalada deve existir');
  assert.equal(esc.who, chosenWho, 'lutador escolhido deve ser o do jogador');

  // - os 19 aparecem sem repetir e sem o próprio lutador;
  assert.equal(esc.lista.length, 19, 'lista deve conter exatamente 19 adversários');
  assert.equal(new Set(esc.lista).size, 19, 'não pode haver lutadores repetidos');
  assert(!esc.lista.includes(esc.who), 'próprio lutador não pode constar na lista de adversários');

  // - a ordem muda entre duas escaladas;
  const g2 = makeClient(), b2 = g2.env.__escTest.bridge, api2 = g2.api;
  b2.mode('pve');
  b2.x1(5);
  g2.tick();
  b2.pick(0);
  g2.tick(2);
  b2.pick(g2.env.__escTest.ui().roster.length);
  g2.tick(2);
  assert.equal(api2.state.scene, 'escalada');
  assert.notDeepEqual(esc.lista, api2.escalada.lista, 'a ordem da lista deve mudar entre duas escaladas');

  function playMatch(winnerIsPlayer) {
    const curEsc = api.escalada;
    g.tick(30);
    g.key('Enter');
    assert.equal(api.state.scene, 'play', 'Enter na torre deve iniciar o combate');
    assert.equal(api.state.players[0].who, curEsc.who);
    assert.equal(api.state.players[1].who, curEsc.lista[curEsc.degrau]);

    while (api.state.scene === 'play') {
      g.until(() => api.state.round.phase === 'fight', 200);
      const loser = api.state.players[winnerIsPlayer ? 1 : 0];
      loser.hp = 0; loser.dead = true;
      g.until(() => api.state.scene !== 'play' || api.state.round.phase === 'intro', 400);
    }
    assert.equal(api.state.scene, 'escalada', 'fim do combate deve voltar para escalada');
  }

  // - a vitória sobe o degrau e a dificuldade;
  assert.equal(esc.degrau, 0, 'inicia no degrau 0');
  playMatch(true); // Jogador vence
  assert.equal(esc.degrau, 1, 'vitória deve incrementar degrau para 1');
  assert(esc.subindo, 'deve iniciar animação de subida');
  g.tick(80); // aguarda subida
  assert.equal(esc.subindo, false, 'subida deve encerrar');

  // Próxima luta: checar dificuldade maior
  g.tick(30);
  g.key('Enter');
  assert.equal(api.state.scene, 'play');
  const diffDegrau1 = api.state.players[1].aiLevel;
  const diffDegrau0 = 0.05;
  assert(diffDegrau1 > diffDegrau0, 'dificuldade deve subir a cada degrau');

  // Termina a luta do degrau 1 com vitória
  while (api.state.scene === 'play') {
    g.until(() => api.state.round.phase === 'fight', 200);
    const loser = api.state.players[1];
    loser.hp = 0; loser.dead = true;
    g.until(() => api.state.scene !== 'play' || api.state.round.phase === 'intro', 400);
  }
  assert.equal(api.state.scene, 'escalada');
  g.tick(80);
  assert.equal(esc.degrau, 2, 'vitória deve incrementar degrau para 2');

  // - a derrota encerra;
  playMatch(false); // Jogador perde
  assert.equal(esc.fim, 'derrota', 'derrota deve marcar fim como derrota');
  g.key('Enter');
  assert.equal(api.state.scene, 'escalada', 'tela de derrota aguarda tempo mínimo');
  g.tick(100);
  g.key('Enter');
  assert.equal(api.state.scene, 'menu', 'confirmar derrota retorna ao menu');
  assert.equal(api.escalada, null, 'escalada deve ser resetada');

  // - vencer o 19º leva à tela de campeão;
  b.x1(5);
  g.tick();
  b.pick(1);
  g.tick(2);
  b.pick(g.env.__escTest.ui().roster.length);
  g.tick(2);
  assert.equal(api.state.scene, 'escalada');
  const escChamp = api.escalada;
  // Avança direto para o 19º lutador (índice 18)
  escChamp.degrau = 18;
  playMatch(true); // Vence o 19º
  assert.equal(escChamp.degrau, 19, 'degrau final deve ser 19');
  assert.equal(escChamp.fim, 'campeao', 'vencer o 19º leva à tela de campeão');
  g.key('Enter');
  assert.equal(api.state.scene, 'escalada', 'campeão não deve sumir imediatamente');
  g.tick(100);
  g.key('Enter');
  assert.equal(api.state.scene, 'menu', 'confirmar campeão retorna ao menu');
  assert.equal(api.escalada, null);

  // - ESC duas vezes sai.
  b.x1(5);
  g.tick();
  b.pick(2);
  g.tick(2);
  b.pick(g.env.__escTest.ui().roster.length);
  g.tick(2);
  assert.equal(api.state.scene, 'escalada');
  g.key('Escape');
  assert.equal(api.state.scene, 'escalada', 'primeiro ESC avisa e não sai');
  g.key('Escape');
  assert.equal(api.state.scene, 'menu', 'segundo ESC sai da escalada');
  assert.equal(api.escalada, null, 'escalada encerrada após saída');

  // - Saída pela pausa no meio de uma luta encerra a escalada,
  //   e depois jogar X1 normal até o fim volta ao menu com esc nulo:
  b.x1(5);
  g.tick();
  b.pick(3);
  g.tick(2);
  b.pick(g.env.__escTest.ui().roster.length);
  g.tick(2);
  assert.equal(api.state.scene, 'escalada');
  g.tick(30);
  g.key('Enter');
  assert.equal(api.state.scene, 'play');
  g.key('KeyP');
  for (let i = 0; i < 3; i++) g.key('ArrowDown');
  g.key('Enter');
  assert.equal(api.state.scene, 'menu', 'pausa e voltar ao menu encerram a escalada');
  assert.equal(api.escalada, null, 'escalada limpa após sair pela pausa');

  // Joga X1 normal até o fim:
  b.x1(0);
  g.tick();
  assert.equal(api.state.scene, 'select', 'deve entrar na selecao do X1 normal');
  assert.equal(api.escalada, null, 'esc continua null na selecao do X1');
  b.pick(0);
  g.tick(2);
  b.pick(1);
  g.tick(2);
  b.pick(g.env.__escTest.ui().roster.length);
  g.tick(2);
  assert.equal(api.state.scene, 'stagesel', 'apos escolher 2 lutadores no X1 normal vai para stagesel');
  g.key('Enter');
  g.until(() => api.state.scene === 'play', 200);
  assert.equal(api.escalada, null, 'esc continua null durante X1 normal');

  while (api.state.scene === 'play') {
    g.until(() => api.state.round.phase === 'fight', 200);
    const loser = api.state.players[1];
    loser.hp = 0; loser.dead = true;
    g.until(() => api.state.scene !== 'play' || api.state.round.phase === 'intro', 400);
  }
  assert.equal(api.state.scene, 'menu', 'X1 normal concluido deve voltar ao menu');
  assert.equal(api.escalada, null, 'esc continua null apos X1 normal');

  // Garantir que openSelect, openTour e startStage da aventura limpam esc antigo se existir:
  b.x1(5); g.tick(); b.pick(0); g.tick(2); b.pick(g.env.__escTest.ui().roster.length); g.tick(2);
  assert(api.escalada, 'escalada aberta');
  b.menu(1); g.tick();b.adventureGo(0);g.tick();
  assert.equal(api.escalada, null, 'openSelect da aventura deve zerar esc');

  b.x1(5); g.tick(); b.pick(0); g.tick(2); b.pick(g.env.__escTest.ui().roster.length); g.tick(2);
  assert(api.escalada, 'escalada aberta');
  b.x1(3); g.tick();
  assert.equal(api.escalada, null, 'openSelect de torneio deve zerar esc');

  b.x1(5); g.tick(); b.pick(0); g.tick(2); b.pick(g.env.__escTest.ui().roster.length); g.tick(2);
  assert(api.escalada, 'escalada aberta');
  api.start(0, 1); g.tick();
  assert.equal(api.escalada, null, 'startStage da aventura deve zerar esc');

  // - Recorde no localStorage via saved.escalada (sem chave bangu-escalada):
  const rec = api.escaladaRecord(chosenWho);
  assert(rec >= 2, 'recorde local deve gravar o maior degrau alcançado');
  assert.equal(g.env.localStorage.getItem('bangu-escalada'), null, 'chave duplicada bangu-escalada nao deve existir');
  const savedData = JSON.parse(g.env.localStorage.getItem('bangu-save'));
  assert(savedData && savedData.escalada && savedData.escalada[chosenWho] >= 2, 'recorde deve estar salvo dentro de saved.escalada em bangu-save');

  // - Teste do servidor (ranking e pontuação da escalada):
  const relay = require('../server/index.js');
  const validEscRow = relay.scoreBody({ name: 'Campeao', modo: 'escalada', character: 'nutri', degrau: 19 });
  assert(validEscRow, 'scoreBody deve aceitar pontuação da escalada');
  assert.equal(validEscRow.modo, 'escalada');
  assert.equal(validEscRow.degrau, 19);
  assert.equal(validEscRow.character, 'nutri');

  const invalidEscRow = relay.scoreBody({ name: 'Hacker', modo: 'escalada', character: 'nutri', degrau: 25 });
  assert.equal(invalidEscRow, null, 'degrau acima de 19 deve ser rejeitado');

  console.log('escalada: ok');
} finally {
  fs.readFileSync = read;
}
