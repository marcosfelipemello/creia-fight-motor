// Equilíbrio dos chefes e diagnóstico de dano por golpe (Etapa 5.5).
// Uso: node tests/equilibrio-chefes.js
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const scripts = ['sprites', 'backgrounds', 'bosses', 'viloes', 'cenarios-arte',
  'criancas', 'bichos', 'objetos', 'rig', 'adriene-visual', 'lorrany-visual', 'pedro-fx',
  'combate-config', 'ia-tatica', 'hud-combate', 'game'];
const noop = () => {};
const rounds = Number(process.env.CHEFES_RODADAS || 5);
assert.ok(Number.isInteger(rounds) && rounds > 0, 'rodadas deve ser inteiro positivo');
const started = performance.now();

// Mesmo carregamento de segunda-forma.js; nenhum recurso externo é consultado.
const ctx = new Proxy({}, {
  get(_, key) {
    if (key === 'measureText') return s => ({ width: String(s).length * 8 });
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({ addColorStop: noop });
    return noop;
  },
  set: () => true
});
const canvas = () => ({ width: 480, height: 270, getContext: () => ctx,
  getBoundingClientRect: () => ({ width: 480, height: 270 }) });
const events = {};
const env = {
  console: { log: noop, warn: (...args) => { throw new Error(args.join(' ')); } },
  Date, TextEncoder, URLSearchParams, performance: { now: () => 0 },
  location: { search: '', hostname: '127.0.0.1' }, navigator: { maxTouchPoints: 0 }, devicePixelRatio: 1,
  Image: class { set src(v) { this.complete = true; this.naturalWidth = 100; } },
  localStorage: { getItem: () => JSON.stringify({ tut: true, best: 10 }), setItem: noop },
  document: { getElementById: canvas, createElement: canvas, head: { appendChild: noop }, body: { appendChild: noop } },
  addEventListener: (name, fn) => { events[name] = fn; }, requestAnimationFrame: noop,
  setTimeout, clearTimeout
};
env.window = env;
vm.createContext(env);
vm.runInContext(`
  var seed = 1;
  Math.random = function () {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
`, env);

for (const name of scripts) {
  let code = fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8');
  if (name === 'game') {
    // A bancada mede cada chefe isoladamente; a aventura normal começa na fase 1.
    code = code.replace('startStage(versus && vsStage ? vsStage : 1);', 'startStage(versus && vsStage ? vsStage : menuStage);');
    // Rastreia fontes apenas na cópia da VM, sem editar o motor em disco.
    const replaceOnce = (from, to) => {
      assert.equal(code.split(from).length, 2, 'instrumentação mudou: ' + from);
      code = code.replace(from, to);
    };
    replaceOnce('    eshots.forEach(function (s) {\n      s.x +=',
      '    eshots.forEach(function (s) { var fonteAnterior = __fonte; __fonte = s.__origem; try {\n      s.x +=');
    replaceOnce('    });\n    eshots = eshots.filter',
      '    } finally { __fonte = fonteAnterior; } });\n    eshots = eshots.filter');
    replaceOnce('    hazards.forEach(function (h) {\n      if (h.warn > 0)',
      '    hazards.forEach(function (h) { var fonteAnterior = __fonte; __fonte = h.__origem; try {\n      if (h.warn > 0)');
    replaceOnce('    });\n    hazards = hazards.filter',
      '    } finally { __fonte = fonteAnterior; } });\n    hazards = hazards.filter');
    replaceOnce("hazards.push({ k: 'onda', x: boss.x, y: boss.y, r: 6, warn: 0.7, hit: [] });",
      "hazards.push({ k: 'onda', x: boss.x, y: boss.y, r: 6, warn: 0.7, hit: [], __origem: {golpe:'onda automática',forma:boss.forma} });");
    // Usa as pausas reais do frame, em vez do gancho sim que as ignora.
    const begin = code.indexOf('        var sp = specialHighlight();', code.indexOf('function frame('));
    const end = code.indexOf('\n      }\n      drawCombatScreen(visualDt);', begin);
    assert.ok(begin >= 0 && end > begin, 'trecho de atualização do frame mudou');
    const frameUpdate = code.slice(begin, end);
    const close = code.lastIndexOf('}());');
    assert.ok(close >= 0, 'fechamento do motor ausente');
    code = code.slice(0, close) + `
      var __fonte = null, __danos = {}, __totalDano = 0, __totalAcertos = 0;
      function __origemAtual() {
        if (!__fonte) return {golpe:'SEM ORIGEM',forma:0};
        if (!__fonte.chefe) return __fonte;
        var b = __fonte.chefe;
        return {golpe:b.kind + ':' + (b.attack || 'contato'),forma:b.forma};
      }
      function __comFonte(fonte, fn, self, args) {
        var anterior = __fonte; __fonte = fonte;
        try { return fn.apply(self, args); } finally { __fonte = anterior; }
      }
      function __rastrearChefe(b) {
        var original = b.update;
        b.update = function () { return __comFonte({chefe:b}, original, this, arguments); };
      }
      var __damagePlayer = damagePlayer;
      damagePlayer = function (p) {
        var hp = p.hp, origem = __origemAtual();
        var result = __damagePlayer.apply(this, arguments), dano = hp - p.hp;
        if (dano > 0) {
          var key = origem.golpe + '|' + origem.forma;
          var row = __danos[key] || (__danos[key] = {golpe:origem.golpe,forma:origem.forma,dano:0,acertos:0});
          row.dano += dano; row.acertos++; __totalDano += dano; __totalAcertos++;
        }
        return result;
      };
      var __shoot = G.shoot;
      G.shoot = function (o) {
        var n = eshots.length, origem = __origemAtual();
        var result = __shoot.apply(this, arguments);
        if (eshots.length > n) eshots[n].__origem = {golpe:origem.golpe + '/' + o.kind,forma:origem.forma};
        return result;
      };
      var __spawn = G.spawn;
      G.spawn = function (kind) {
        var n = enemies.length, origem = __origemAtual();
        var result = __spawn.apply(this, arguments);
        if (enemies.length > n) enemies[n].__origem = {golpe:origem.golpe + '/invocado ' + kind,forma:origem.forma};
        return result;
      };
      var __updateEnemy = updateEnemy;
      updateEnemy = function (e) { return __comFonte(e.__origem, __updateEnemy, this, arguments); };
      var __addBoss = G.addBoss;
      G.addBoss = function (b) { __rastrearChefe(b); return __addBoss.apply(this, arguments); };
      window.__medirChefe = function (fase, equipe, semente) {
        __danos = {}; __totalDano = 0; __totalAcertos = 0; __fonte = null;
        seed = semente >>> 0;
        time = 0; menuStage = fase; saved.tut = true;
        startTeam(equipe.map(function (who) { return {who:who,ctl:null,difficulty:'medio'}; }), true, false);
        waves.forEach(function (w) { w.done = true; });
        wave = null; enemies = [];
        cam = CAM_MAX; arena();
        players.forEach(function (p, i) {
          p.x = CAM_MAX + 150 - i * 34; p.y = 196 + i * 14;
          p.aiLevel = 'medio'; p.inv = 0;
        });
        phase = 'fight'; phaseT = 0;
        startBoss(false);
        bosses.forEach(__rastrearChefe);
        var iniciais = players.reduce(function (sum,p) { return sum + p.maxHp; }, 0);
        var segunda = false, dt = 1 / 60, visualDt = 0, quadros = 0;
        // Não inventa vencedor se uma luta travar: informa censura separadamente.
        for (; quadros < 600 * 60; quadros++) {
          time += dt;
          ${frameUpdate}
          segunda = segunda || bosses.some(function (b) { return b.forma === 2; });
          if (phase === 'clear' || players.every(function (p) { return p.dead; })) { quadros++; break; }
        }
        return { venceu:phase === 'clear', segundos:quadros / 60, segunda:segunda,
          golpes:Object.values(__danos),danoTotal:__totalDano,acertosTotal:__totalAcertos,
          limite:phase !== 'clear' && !players.every(function (p) { return p.dead; }),
          vida:100 * players.reduce(function (sum,p) { return sum + (p.dead ? 0 : Math.max(0,p.hp)); }, 0) / iniciais };
      };
    ` + code.slice(close);
  }
  vm.runInContext(code, env, { filename: name + '.js' });
}

// Alterna corpo a corpo, projéteis e suporte desde as primeiras rodadas.
const fighters = ['lutador', 'nutri', 'ricardo', 'bispo', 'duda', 'fidelis',
  'emanuelly', 'enzo', 'pedro', 'naju', 'grazi', 'lohan', 'rafinha', 'douglas',
  'arthur', 'lucas', 'cardoso', 'th', 'douglinhas', 'adriene'];
assert.equal(fighters.length, 20, 'medição deve incluir os 20 lutadores');
assert.deepEqual([...fighters].sort(), Object.keys(env.CreiaCombat.primary).sort());
module.exports = { medir: env.__medirChefe, fighters, config: env.CreiaCombat };
if (require.main === module) run();

function run() {
  const rows = [];
  const damageRows = new Map();
  for (let stage = 1; stage <= 10; stage++) {
    for (let size = 1; size <= 4; size++) {
      const row = { stage, size, wins: 0, seconds: 0, second: 0, health: 0, limits: 0 };
      for (let round = 0; round < rounds; round++) {
        // Mesma composição por rodada em todas as fases; sem lutador repetido no time.
        const team = Array.from({ length: size }, (_, i) => fighters[(round + i * 5) % fighters.length]);
        const result = env.__medirChefe(stage, team, 0x55a000 + stage * 10000 + size * 100 + round);
        assert.ok(Number.isFinite(result.segundos) && Number.isFinite(result.vida), 'medição inválida');
        row.wins += Number(result.venceu);
        row.seconds += result.segundos;
        row.second += Number(result.segunda);
        row.health += result.vida;
        row.limits += Number(result.limite);
        assert.ok(result.golpes.every(g => g.forma === 1 || g.forma === 2), 'dano sem origem: ' + JSON.stringify(result.golpes));
        assert.ok(Math.abs(result.golpes.reduce((sum,g) => sum + g.dano, 0) - result.danoTotal) < 1e-6);
        assert.equal(result.golpes.reduce((sum,g) => sum + g.acertos, 0), result.acertosTotal);
        for (const g of result.golpes) {
          const key = stage + '|' + g.golpe;
          if (!damageRows.has(key)) damageRows.set(key, { stage, golpe: g.golpe, dano: [0,0], acertos: [0,0] });
          const entry = damageRows.get(key), f = g.forma - 1;
          entry.dano[f] += g.dano; entry.acertos[f] += g.acertos;
        }
      }
      rows.push(row);
    }
  }

  console.log(`Semente base: 0x55a000; ${rounds} rodadas/célula; ${rounds * 40} lutas; IA médio; 60 Hz.`);
  console.log('Tempo inclui pausas de golpes e transformação, exclui apresentação e espera após resultado.');
  console.log('Vida = % da vida máxima inicial do time, média de todas as rodadas (mortos = 0).');
  console.log('| Fase | Time | Vitórias | Tempo médio (s) | 2ª forma | Vida restante | Limite 600s |');
  console.log('| --- | --- | --- | --- | --- | --- | --- |');
  for (const r of rows) {
    console.log(`| ${r.stage} | ${r.size} | ${(100 * r.wins / rounds).toFixed(1)}% | ${(r.seconds / rounds).toFixed(1)} | ${(100 * r.second / rounds).toFixed(1)}% | ${(r.health / rounds).toFixed(1)}% | ${r.limits} |`);
  }
  console.log('\nDano por golpe: soma dos times de 1, 2, 3 e 4; ' + rounds * 4 + ' lutas por fase.');
  console.log('Forma registrada na emissão do golpe/projétil ou nascimento do invocado.');
  console.log('Dano = HP efetivamente perdido, limitado pela vida restante; acertos = eventos com perda de HP.');
  console.log('Escudos, invencibilidade e tentativas recusadas não contam. Invocados e onda automática ficam separados.');
  console.log('| Fase | Golpe / projétil | Dano F1 | Acertos F1 | Dano F2 | Acertos F2 |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const r of [...damageRows.values()].sort((a,b) => a.stage - b.stage || a.golpe.localeCompare(b.golpe))) {
    console.log('| ' + [r.stage,r.golpe,r.dano[0].toFixed(1),r.acertos[0],r.dano[1].toFixed(1),r.acertos[1]].join(' | ') + ' |');
  }
  const elapsed = (performance.now() - started) / 1000;
  console.log(`Duração real: ${elapsed.toFixed(2)}s.`);
  assert.equal(rows.reduce((sum, r) => sum + r.limits, 0), 0, 'lutas sem conclusão; tabela inclui tempos censurados');
  if (rounds === 5) assert.ok(elapsed < 90, `medição excedeu 90s: ${elapsed.toFixed(2)}s`);

  // Metas do dono: limites rígidos; pendências aparecem sem afrouxar os asserts.
  const failures = [];
  function check(label, condition) {
    try { assert.ok(condition, label); } catch (error) { failures.push(error.message); }
  }
  for (let stage = 1; stage <= 10; stage++) {
    const cfg = env.CreiaCombat.chefes && env.CreiaCombat.chefes[stage];
    check(`fase ${stage}: vida entre 0.6 e 1.5`, cfg && cfg.vida >= 0.6 && cfg.vida <= 1.5);
    check(`fase ${stage}: dano entre 0.5 e 1.4`, cfg && cfg.dano >= 0.5 && cfg.dano <= 1.4);
    const solo = rows.find(r => r.stage === stage && r.size === 1);
    const four = rows.find(r => r.stage === stage && r.size === 4);
    // O dono liberou o solo da fase 10 como informativo após os ensaios nos limites.
    if (stage !== 10) check(`fase ${stage}: vitória solo entre 20% e 90% (${100 * solo.wins / rounds}%)`,
      solo.wins >= rounds * 0.2 && solo.wins <= rounds * 0.9);
    if (stage > 1) {
      const previous = rows.find(r => r.stage === stage - 1 && r.size === 1);
      check(`fase ${stage}: solo não sobe mais de 20 pontos`, solo.wins - previous.wins <= rounds * 0.2);
    }
    check(`fase ${stage}: quatro lutadores duram pelo menos 30s`, four.seconds / rounds >= 30);
    check(`fase ${stage}: segunda forma em todas as lutas com quatro`, four.second === rounds);
  }
  const first = rows.find(r => r.stage === 1 && r.size === 1);
  check('fase 1: vitória solo de pelo menos 70%', first.wins >= rounds * 0.7);
  check('fase 1 tem a maior vitória solo', rows.filter(r => r.size === 1).every(r => first.wins >= r.wins));
  const emperor = rows.find(r => r.stage === 10 && r.size === 1);
  console.log(`INFORMATIVO: fase 10 solo ${100 * emperor.wins / rounds}% (objetivo de 10%, sem assert).`);
  check('fase 10 tem a menor vitória solo', rows.filter(r => r.size === 1).every(r => emperor.wins <= r.wins));
  const trio = rows.find(r => r.stage === 10 && r.size === 3);
  check(`fase 10: três lutadores vencem pelo menos 40% (${100 * trio.wins / rounds}%)`, trio.wins >= rounds * 0.4);
  for (const failure of failures) console.log('META NÃO ATENDIDA: ' + failure);
  assert.equal(failures.length, 0, 'metas de equilíbrio pendentes: ' + failures.length);
  console.log('Metas de equilíbrio: OK');
}
