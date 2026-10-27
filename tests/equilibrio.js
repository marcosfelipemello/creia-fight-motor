// Teste automatizado de equilíbrio do X1 (1v1 CPU x CPU) e integridade da campanha.
// Uso: node tests/equilibrio.js
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const scripts = ['sprites', 'backgrounds', 'bosses', 'viloes', 'cenarios-arte', 'criancas', 'bichos', 'objetos', 'rig', 'combate-config', 'ia-tatica', 'hud-combate', 'game'];
const noop = () => {};

function createEngine() {
  let clock = 0;
  const ctx = new Proxy({}, {
    get(_, key) {
      if (key === 'measureText') return () => ({ width: 10 });
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({ addColorStop: noop });
      return noop;
    },
    set: () => true
  });
  const canvas = () => ({ width: 480, height: 270, getContext: () => ctx, getBoundingClientRect: () => ({ width: 480, height: 270 }) });
  const env = {
    console, Math, Date, TextEncoder, URLSearchParams,
    performance: { now: () => clock },
    location: { search: '', hostname: '127.0.0.1' },
    navigator: { maxTouchPoints: 0 },
    devicePixelRatio: 1,
    Image: class { set src(v) { this.complete = true; this.naturalWidth = 100; } },
    localStorage: { getItem: () => JSON.stringify({ tut: true, best: 10 }), setItem: noop },
    document: { getElementById: canvas, createElement: canvas, head: { appendChild: noop }, body: { appendChild: noop } },
    addEventListener: noop,
    requestAnimationFrame: noop,
    setTimeout, clearTimeout
  };
  env.window = env;
  vm.createContext(env);
  for (const name of scripts) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8'), env, { filename: name + '.js' });
  }
  return env;
}

const ROSTER = [
  'nutri', 'lutador', 'emanuelly', 'enzo', 'pedro', 'naju', 'grazi', 'bispo',
  'lohan', 'rafinha', 'douglas', 'fidelis', 'arthur', 'lucas', 'duda', 'cardoso'
];

function simulateMatch(env, charA, charB, maxSeconds = 90) {
  env.__bangu.cardosoTest.versus(charA, charB);
  const round = env.__bangu.state.round;
  const step = 1;
  let elapsed = 0;
  while (elapsed < maxSeconds && round.matchWinner === null) {
    env.__bangu.sim(step, false);
    elapsed += step;
  }
  if (round.matchWinner !== null) return round.matchWinner;
  if (round.wins[0] > round.wins[1]) return 0;
  if (round.wins[1] > round.wins[0]) return 1;
  const p0 = env.__bangu.state.players[0];
  const p1 = env.__bangu.state.players[1];
  return p0.hp >= p1.hp ? 0 : 1;
}

console.log('================================================================');
console.log('1. TESTE DE EQUILÍBRIO X1: rodízio dos 20, IA contra IA, sorteio fixo');
console.log('================================================================');
// Todos contra todos, nos dois lados, em paralelo (tests/apoio/x1-rodizio.js). Meta do dono: cada um com seu jeito, sem apelação.
require('./apoio/x1-rodizio.js').runTournament(fs.readFileSync(path.join(root, 'js', 'combate-config.js'), 'utf8'), 6, { mp: 3 }).then(r => {
  r.charStats.forEach(c => console.log(`  ${c.who.padEnd(12)} ${(c.rate * 100).toFixed(1).padStart(5)}%  ${c.ok ? 'OK' : 'FORA'}`));
  console.log('  Confrontos mais desiguais: ' + r.pairStats.slice(0, 5).map(p => `${p.dominant} x ${p.victim} ${p.score}`).join(', '));
  const fora = r.charStats.filter(c => c.rate < 0.38 || c.rate > 0.62).map(c => c.who + ' ' + (c.rate * 100).toFixed(1) + '%');
  assert.equal(fora.length, 0, 'Lutadores fora de 38%–62% no rodízio: ' + fora.join(', '));
  console.log('ASSERT: os 20 lutadores entre 38% e 62% de vitória no rodízio.');
}).catch(e => { console.error(e); process.exitCode = 1; });

console.log('\n================================================================');
console.log('2. TESTE DA CAMPANHA: 10 Fases x 4 Equipes (Todos os 16 Personagens)');
console.log('================================================================');

const CAMPAIGN_TEAMS = [
  ['nutri', 'lutador', 'emanuelly', 'enzo'],
  ['pedro', 'naju', 'grazi', 'bispo'],
  ['lohan', 'rafinha', 'douglas', 'fidelis'],
  ['arthur', 'lucas', 'duda', 'cardoso']
];

for (let tIdx = 0; tIdx < CAMPAIGN_TEAMS.length; tIdx++) {
  const team = CAMPAIGN_TEAMS[tIdx];
  const cEnv = createEngine();
  const bangu = cEnv.__bangu;
  bangu.startTeam(team.map(w => ({ who: w, ctl: null })), false, false);

  let lastStage = 1;
  for (let step = 0; step < 70 && bangu.state.scene === 'play'; step++) {
    const s = bangu.sim(60, true);
    if (s.stage > lastStage) lastStage = s.stage;
  }

  assert.equal(bangu.state.scene, 'ending', `Equipe ${tIdx + 1} (${team.join(', ')}) não atingiu o final da campanha! Estado: ${bangu.state.scene}`);
  assert.equal(lastStage, 10, `Equipe ${tIdx + 1} não completou as 10 fases! Última fase: ${lastStage}`);
  console.log(`Equipe ${tIdx + 1} [${team.join(', ')}]: 10 Fases concluídas com sucesso -> Cena final: 'ending' (OK)`);
}

console.log('\nTodos os testes de equilíbrio e campanha foram executados e aprovados com sucesso!');
