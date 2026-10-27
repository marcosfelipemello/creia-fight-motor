// Testes do motor da segunda forma dos chefes.
// Uso: node tests/segunda-forma.js
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = fs.readFileSync.bind(fs);
const scripts = ['sprites', 'backgrounds', 'bosses', 'viloes', 'cenarios-arte',
  'criancas', 'bichos', 'objetos', 'rig', 'combate-config', 'ia-tatica', 'hud-combate', 'game'];
const noop = () => {};

function makeFakeG(overrides) {
  return Object.assign({
    arena: { left: 0, right: 480, top: 180, bottom: 260 },
    nearestPlayer: () => null,
    players: [],
    shake: noop,
    sound: noop,
    particles: noop,
    puddle: noop,
    spawn: noop,
    shoot: noop,
    hit: noop,
    addBoss: noop
  }, overrides);
}

// 1. Verificação da configuração em combate-config.js
const combateConfig = require('../js/combate-config.js');
assert.ok(combateConfig.segundaForma, 'CreiaCombat.segundaForma ausente');
assert.equal(combateConfig.segundaForma.limite, 0.5, 'limite deve ser 0.5');
assert.equal(combateConfig.segundaForma.velocidade, 1.25, 'velocidade deve ser 1.25');
assert.equal(combateConfig.segundaForma.dano, 1.15, 'dano deve ser 1.15');
assert.equal(combateConfig.segundaForma.cena, 1.5, 'cena deve ser 1.5');
console.log('1. Configuração CreiaCombat.segundaForma: OK');

// Cliente para execução no contexto do jogo
function createClient(hooks) {
  let nextFrame, clock = 0;
  const events = {}, textSeen = new Set(), sfxCalls = [];
  const ctx = new Proxy({}, {
    get(_, key) {
      if (key === 'measureText') return s => ({ width: String(s).length * 8 });
      if (key === 'fillText') return s => textSeen.add(String(s));
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({ addColorStop: noop });
      return noop;
    },
    set: () => true
  });
  const canvas = () => ({ width: 480, height: 270, getContext: () => ctx, getBoundingClientRect: () => ({ width: 480, height: 270 }) });
  const env = {
    console, Math, Date, TextEncoder, URLSearchParams, performance: { now: () => clock },
    location: { search: '', hostname: '127.0.0.1' }, navigator: { maxTouchPoints: 0 }, devicePixelRatio: 1,
    Image: class { set src(v) { this.complete = true; this.naturalWidth = 100; } },
    localStorage: { getItem: () => JSON.stringify({ tut: true, best: 10 }), setItem: noop },
    document: { getElementById: canvas, createElement: canvas, head: { appendChild: noop }, body: { appendChild: noop } },
    addEventListener: (name, fn) => { events[name] = fn; },
    requestAnimationFrame: fn => { nextFrame = fn; },
    setTimeout, clearTimeout,
    __sfxCalls: sfxCalls
  };
  if (hooks) env.SegundaForma = hooks;
  env.window = env;
  vm.createContext(env);

  for (const name of scripts) {
    let code = read(path.join(root, 'js', name + '.js'), 'utf8');
    if (name === 'game') {
      // Instrumenta sfx para registrar chamadas no teste
      code = code.replace('function sfx(n) {', 'function sfx(n) { (window.__sfxCalls = window.__sfxCalls || []).push(n);');
    }
    vm.runInContext(code, env, { filename: name + '.js' });
  }

  return {
    env,
    api: env.__bangu,
    sfxCalls,
    textSeen,
    tick(n = 1) {
      for (let i = 0; i < n; i++) {
        clock += 1000 / 60;
        if (nextFrame) nextFrame(clock);
      }
    },
    until(fn, max = 900) {
      for (let i = 0; i < max && !fn(); i++) this.tick();
      assert(fn(), 'estado esperado não chegou');
    }
  };
}

// 2. Transforma a 50%, uma vez só
{
  const inicioCalls = [], fimCalls = [];
  const hooks = {
    inicio(b) {
      assert.equal(b.forma, 2, 'b.forma deve ser 2 ao iniciar transformação');
      assert.equal(b.transT, 1.5, 'b.transT deve ser 1.5 ao iniciar transformação');
      inicioCalls.push(b);
    },
    fim(b) { fimCalls.push(b); }
  };
  const c = createClient(hooks);
  const fakeG = makeFakeG();
  const bosses = c.env.Bosses.create(1, fakeG);
  const b = bosses[0];
  assert.equal(b.forma, 1);
  assert.equal(b.transT, 0);

  // Dano acima de 50% não dispara transformação
  b.hp = b.maxHp * 0.625;
  b.update(0.016, fakeG);
  assert.equal(b.forma, 1);
  assert.equal(b.transT, 0);
  assert.equal(inicioCalls.length, 0);

  // Dano exatamente a 50% dispara transformação uma vez
  b.hp = b.maxHp * 0.5;
  b.update(0.016, fakeG);
  assert.equal(b.forma, 2);
  assert.ok(b.transT > 0 && b.transT <= 1.5);
  assert.equal(inicioCalls.length, 1);
  assert.equal(inicioCalls[0], b);

  // Dano subsequente não dispara novamente
  b.hp = b.maxHp * 0.375;
  b.update(0.016, fakeG);
  assert.equal(b.forma, 2);
  assert.equal(inicioCalls.length, 1);
  assert.equal(fimCalls.length, 0);
  console.log('2. Transforma a 50%, uma vez só: OK');
}

// 3. Dano de 100% para 10% transforma uma vez
{
  const inicioCalls = [];
  const c = createClient({
    inicio(b) {
      assert.equal(b.forma, 2);
      assert.equal(b.transT, 1.5);
      inicioCalls.push(b);
    }
  });
  const fakeG = makeFakeG();
  const bosses = c.env.Bosses.create(2, fakeG);
  const b = bosses[0];
  assert.equal(b.hp, b.maxHp);
  assert.ok(b.maxHp > 0);

  // Dano massivo direto para 10% da vida máxima
  b.hp = b.maxHp * 0.1;
  b.update(0.016, fakeG);
  assert.equal(b.forma, 2);
  assert.ok(b.transT > 0 && b.transT <= 1.5);
  assert.equal(inicioCalls.length, 1);

  // Atualiza mais um pouco durante a cena
  b.update(0.5, fakeG);
  assert.equal(b.forma, 2);
  assert.equal(inicioCalls.length, 1);
  console.log('3. Dano de 100% para 10% transforma uma vez: OK');
}

// 4. Morte num golpe acima de 50% não transforma
{
  const inicioCalls = [];
  const c = createClient({ inicio(b) { inicioCalls.push(b); } });
  const fakeG = makeFakeG();
  const bosses = c.env.Bosses.create(3, fakeG);
  const b = bosses[0];
  assert.equal(b.hp, b.maxHp);
  assert.ok(b.maxHp > 0);

  // Golpe letal partindo de 100% para 0
  b.hp = 0;
  b.update(0.016, fakeG);
  assert.equal(b.forma, 1, 'chefe morto de golpe único não deve assumir forma 2');
  assert.equal(b.transT, 0);
  assert.equal(inicioCalls.length, 0, 'inicio não deve ser chamado em golpe letal');
  console.log('4. Morte em golpe único acima de 50% não transforma: OK');
}

// 5. Imunidade e bloqueio durante a cena de transformação (transT > 0)
{
  const c = createClient();
  c.api.start(1, 1); // inicia aventura fase 1
  c.api.jumpToBoss();
  c.until(() => c.api.state.bossOn, 500);

  const b = c.api.state.bosses[0];
  assert.ok(b, 'chefe da fase 1 deve existir');

  // Causa dano no chefe para colocá-lo em 50% de vida
  b.hp = b.maxHp * 0.5;
  c.api.cardosoTest.hitBoss(b, 0); // aciona transição
  assert.equal(b.forma, 2);
  assert.ok(b.transT > 0);

  const hpAntes = b.hp;
  c.sfxCalls.length = 0;

  // Tentativa de bater no chefe durante a cena
  const acertou = c.api.cardosoTest.hitBoss(b, 50);
  assert.equal(acertou, false, 'hitBoss deve retornar false durante transT');
  assert.equal(b.hp, hpAntes, 'chefe não deve tomar dano durante transT');
  assert.ok(c.sfxCalls.includes('block'), 'sfx de bloqueio deve tocar ao bater durante transT');
  console.log('5. Imunidade e som de bloqueio durante transT: OK');
}

// 6. Fim da cena: velocidade x 1.25, dano x 1.15 e gancho fim(b)
{
  let fimChamado = false;
  const c = createClient({
    fim(b) { fimChamado = true; }
  });
  const fakeG = makeFakeG();
  const bosses = c.env.Bosses.create(4, fakeG);
  const b = bosses[0];
  const danoOriginal = b.damage;
  const speedOriginal = b.speed || 1;

  b.hp = b.maxHp * 0.5;
  b.update(0.016, fakeG);
  assert.equal(b.forma, 2);
  assert.ok(b.transT > 0);

  // Avança tempo até a cena terminar (1.5s total)
  b.update(0.8, fakeG);
  assert.ok(b.transT > 0);
  assert.equal(fimChamado, false);

  b.update(0.75, fakeG); // transT zera
  assert.equal(b.transT, 0);
  assert.equal(fimChamado, true, 'SegundaForma.fim deve ser chamado');
  assert.equal(b.speed, speedOriginal * 1.25, 'velocidade multiplicada por 1.25');
  assert.equal(b.damage, Math.round(danoOriginal * 1.15 * 100) / 100, 'dano multiplicado por 1.15');
  console.log('6. Fim da cena (velocidade x1.25, dano x1.15, fim hook): OK');
}

// 7. Chefe 8 (torre): transforma uma vez, divide após cena e mini-chefes não transformam de novo
{
  const inicioCalls = [], fimCalls = [];
  const spawned = [];
  const fakeG = makeFakeG({
    addBoss(nb) { spawned.push(nb); }
  });
  const c = createClient({
    inicio(b) {
      assert.equal(b.forma, 2);
      assert.equal(b.transT, 1.5);
      inicioCalls.push(b);
    },
    fim(b) { fimCalls.push(b); }
  });
  const tower = c.env.Bosses.create(8, fakeG)[0];
  assert.equal(tower.kind, 'tower');
  assert.equal(tower.forma, 1);

  // Reduz vida para 50%
  tower.hp = tower.maxHp * 0.5;
  tower.update(0.016, fakeG);
  assert.equal(tower.forma, 2);
  assert.ok(tower.transT > 0 && tower.transT <= 1.5);
  assert.equal(inicioCalls.length, 1);
  assert.equal(tower.dead, false, 'torre não deve morrer imediatamente');
  assert.equal(spawned.length, 0, 'mini-chefes não devem nascer antes do fim da cena');

  // Passa o tempo da cena de transformação (1.5 s)
  tower.update(1.5, fakeG);
  assert.equal(tower.transT, 0);
  assert.equal(fimCalls.length, 1, 'fim deve ser chamado para a torre');
  assert.equal(tower.dead, true, 'torre deve ser marcada como dead após a cena');
  assert.equal(spawned.length, 3, 'devem nascer os 3 mini-chefes');

  // Verifica que os mini-chefes nasceram com forma 2
  for (const mini of spawned) {
    assert.equal(mini.forma, 2, 'mini-chefe já deve nascer em forma 2');
    assert.equal(mini.transT, 0);
  }

  // Reduz vida de um mini-chefe abaixo de 50%
  const inicioCountAntes = inicioCalls.length;
  spawned[0].hp = spawned[0].maxHp * 0.3;
  spawned[0].update(0.016, fakeG);
  assert.equal(spawned[0].transT, 0, 'mini-chefe não deve entrar em transT');
  assert.equal(inicioCalls.length, inicioCountAntes, 'inicio não deve ser chamado novamente para mini-chefe');
  console.log('7. Chefe 8 (torre e mini-chefes sem retransformação): OK');
}

// 8. Robustez sem módulo SegundaForma
{
  const c = createClient(null); // sem SegundaForma
  delete c.env.SegundaForma;
  delete c.env.window.SegundaForma;
  const fakeG = makeFakeG();

  const b = c.env.Bosses.create(5, fakeG)[0];
  assert.doesNotThrow(() => {
    b.hp = b.maxHp * 0.5;
    b.update(0.016, fakeG);
    b.update(1.5, fakeG);
  }, 'não deve lançar erro quando SegundaForma for indefinido');
  console.log('8. Execução sem SegundaForma: OK');
}

// 9. Câmera parada no chefe e congelamento de inimigos comuns durante transT no game.js
{
  const c = createClient();
  c.api.start(1, 1);
  c.api.jumpToBoss();
  // Aguarda fim da introdução do chefe (bossIntro)
  c.until(() => c.api.state.bossOn, 500);

  const b = c.api.state.bosses[0];
  assert.ok(b && !b.dead, 'chefe ativo deve existir');

  // Spawna um inimigo comum
  const inimigo = c.api.cardosoTest.spawn('fome', b.x - 100, b.y);
  inimigo.st = 0;
  const xInimigoAntes = inimigo.x;

  // Inicia transformação
  b.hp = b.maxHp * 0.5;
  c.api.cardosoTest.hitBoss(b, 0);
  assert.equal(b.forma, 2);
  assert.ok(b.transT > 0);

  // Executa frames do jogo enquanto transT está ativo
  c.tick(5);
  assert.equal(Math.round(c.api.state.cam), 2520, 'câmera fica parada na arena do chefe (não sai dela)');
  assert.equal(inimigo.st, 0, 'inimigo comum não deve atualizar durante transT');
  assert.equal(inimigo.x, xInimigoAntes, 'inimigo comum não deve andar durante transT');

  // Espera transT terminar (95 ticks = ~1.58s)
  c.tick(95);
  assert.equal(b.transT, 0);

  // Após transT, inimigo comum volta a atualizar
  c.tick(10);
  assert.ok(inimigo.st > 0, 'inimigo comum deve voltar a atualizar após transT');
  console.log('9. Câmera travada e inimigos comuns congelados durante transT: OK');
}

console.log('Todos os testes de segunda-forma passaram com sucesso!');
