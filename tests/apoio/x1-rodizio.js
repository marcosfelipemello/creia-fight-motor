'use strict';
// Rodízio do X1 (todos contra todos, IA contra IA, sorteio fixo) em paralelo. Usado por tests/equilibrio.js e tests/fidelis-equilibrio.js.
const { Worker } = require('node:worker_threads');
const fs = require('node:fs');
const path = require('node:path');

const root = require('node:path').resolve(__dirname, '../..');
const ROSTER = [
  'nutri', 'lutador', 'emanuelly', 'enzo', 'pedro', 'naju', 'grazi', 'bispo',
  'lohan', 'rafinha', 'douglas', 'fidelis', 'arthur', 'lucas', 'duda', 'cardoso',
  'th', 'douglinhas', 'ricardo', 'adriene'
];

async function runTournament(cfgCode, numWorkers = 6, opts = {}) {
  const allMatches = [];
  const MATCHES_PER_PAIR = opts.mp || Number(process.env.MP||2);
  for (let i = 0; i < ROSTER.length; i++) {
    for (let j = 0; j < ROSTER.length; j++) {
      if (i === j || (opts.filtro && !opts.filtro(ROSTER[i], ROSTER[j]))) continue;
      const a = ROSTER[i];
      const b = ROSTER[j];
      for (let m = 0; m < MATCHES_PER_PAIR; m++) {
        allMatches.push({ a, b, m });
      }
    }
  }

  const chunks = Array.from({ length: numWorkers }, () => []);
  allMatches.forEach((match, idx) => {
    chunks[idx % numWorkers].push(match);
  });

  const workerPromises = chunks.map((chunk, idx) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'x1-worker.js'), {
        workerData: {
          pairs: chunk,
          cfgCode,
          seed: 8129 + idx * 7919
        }
      });
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  });

  const results = (await Promise.all(workerPromises)).flat();

  const wins = {};
  const total = {};
  const matchups = {};
  ROSTER.forEach(r => {
    wins[r] = 0;
    total[r] = 0;
    matchups[r] = {};
    ROSTER.forEach(r2 => {
      if (r !== r2) matchups[r][r2] = { wins: 0, total: 0 };
    });
  });

  for (const res of results) {
    if (res.winner === 0) {
      wins[res.a]++;
      matchups[res.a][res.b].wins++;
    } else {
      wins[res.b]++;
      matchups[res.b][res.a].wins++;
    }
    total[res.a]++;
    total[res.b]++;
    matchups[res.a][res.b].total++;
    matchups[res.b][res.a].total++;
  }

  const charStats = [];
  let outOfBounds = 0;
  for (const r of ROSTER) {
    const rate = wins[r] / total[r];
    const ok = rate >= 0.40 && rate <= 0.60;
    if (!ok) outOfBounds++;
    charStats.push({ who: r, wins: wins[r], total: total[r], rate, ok });
  }

  const pairStats = [];
  for (let i = 0; i < ROSTER.length; i++) {
    for (let j = i + 1; j < ROSTER.length; j++) {
      const a = ROSTER[i];
      const b = ROSTER[j];
      const aWins = matchups[a][b].wins;
      const bWins = matchups[b][a].wins;
      const tot = aWins + bWins;
      const aRate = aWins / tot;
      const bRate = bWins / tot;
      const maxRate = Math.max(aRate, bRate);
      const dominant = aRate >= bRate ? a : b;
      const victim = aRate >= bRate ? b : a;
      pairStats.push({ dominant, victim, winRate: maxRate, score: `${Math.max(aWins, bWins)}x${Math.min(aWins, bWins)}`, total: tot });
    }
  }

  pairStats.sort((x, y) => y.winRate - x.winRate);
  const over75 = pairStats.filter(p => p.winRate > 0.75);

  return { charStats, pairStats, over75, outOfBounds };
}

module.exports = { runTournament, ROSTER };

if (require.main === module) {
  (async () => {
    const t0 = Date.now();
    const cfg = fs.readFileSync(process.env.CFG || path.join(root, 'js', 'combate-config.js'), 'utf8');
    const { charStats, pairStats, over75, outOfBounds } = await runTournament(cfg, Number(process.env.W||6));
    console.log(`Tempo: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    console.log(`Personagens fora de 40-60%: ${outOfBounds}`);
    console.log(`Confrontos > 75%: ${over75.length}`);
    charStats.forEach(c => {
      console.log(`  ${c.who.padEnd(12)}: ${(c.rate * 100).toFixed(1)}% (${c.wins}/${c.total}) ${c.ok ? 'OK' : 'FORA'}`);
    });
  })();
}
