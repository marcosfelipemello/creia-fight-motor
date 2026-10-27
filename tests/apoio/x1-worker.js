'use strict';
// Uma fatia do rodízio do X1: carrega o jogo inteiro na VM e simula as lutas recebidas.
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = require('node:path').resolve(__dirname, '../..');
const scripts = ['sprites', 'backgrounds', 'bosses', 'viloes', 'cenarios-arte', 'criancas', 'bichos', 'objetos', 'rig', 'combate-fx', 'pedro-fx', 'adriene-visual', 'lorrany-visual', 'combate-config', 'ia-tatica', 'hud-combate', 'game'];
const noop = () => {};

if (!isMainThread) {
  const { pairs, cfgCode, seed } = workerData;
  let currentSeed = seed;
  const seededMath = Object.create(Math);
  seededMath.random = () => {
    currentSeed = (Math.imul(currentSeed, 1664525) + 1013904223) >>> 0;
    return currentSeed / 4294967296;
  };

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
    console, Math: seededMath, Date, TextEncoder, URLSearchParams,
    performance: { now: () => 0 },
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
    let code = name === 'combate-config' ? cfgCode : fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8');
    vm.runInContext(code, env, { filename: name + '.js' });
  }

  function simulateMatch(charA, charB, maxSeconds = 90) {
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

  const results = [];
  for (const p of pairs) {
    const winner = simulateMatch(p.a, p.b);
    results.push({ a: p.a, b: p.b, winner, m: p.m });
  }
  parentPort.postMessage(results);
}
