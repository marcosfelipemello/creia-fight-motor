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
console.log('1. TESTE DE EQUILÍBRIO X1: CPU vs CPU (Todos os 16 Personagens)');
console.log('================================================================');
const startTime = Date.now();
const env = createEngine();

const wins = {};
const total = {};
ROSTER.forEach(r => { wins[r] = 0; total[r] = 0; });

const MATCHES_PER_PAIR = 2; // 15 oponentes x 2 direções x 2 partidas = 60 lutas/personagem (240 no total)
let matchCount = 0;

for (let i = 0; i < ROSTER.length; i++) {
  for (let j = 0; j < ROSTER.length; j++) {
    if (i === j) continue;
    const a = ROSTER[i];
    const b = ROSTER[j];
    for (let m = 0; m < MATCHES_PER_PAIR; m++) {
      const winner = simulateMatch(env, a, b);
      if (winner === 0) {
        wins[a]++;
      } else {
        wins[b]++;
      }
      total[a]++;
      total[b]++;
      matchCount++;
    }
  }
}

const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nSimulação de ${matchCount} partidas concluída em ${elapsedSec}s.\n`);
console.log('| Personagem   | Vitórias | Total | Taxa de Vitória | Status (40%-60%) |');
console.log('| :----------- | :------- | :---- | :-------------- | :--------------- |');

const failedChars = [];
for (const r of ROSTER) {
  const winRate = wins[r] / total[r];
  const wrPercent = (winRate * 100).toFixed(1);
  const ok = winRate >= 0.40 && winRate <= 0.60;
  if (!ok) failedChars.push({ who: r, wr: wrPercent });
  const statusStr = ok ? 'OK (Equilibrado)' : 'FORA DA FAIXA';
  console.log(`| ${r.padEnd(12)} | ${String(wins[r]).padStart(8)} | ${String(total[r]).padStart(5)} | ${String(wrPercent + '%').padStart(14)} | ${statusStr.padEnd(16)} |`);
}

console.log('\n----------------------------------------------------------------');
assert.equal(failedChars.length, 0, 'Personagens fora da faixa de 40%-60%: ' + JSON.stringify(failedChars));
console.log('ASSERT: Todos os 16 personagens estão estritamente entre 40% e 60% de vitória!');

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
