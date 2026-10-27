// Testes dos novos golpes da segunda forma dos chefes 1 a 9.
// Uso: node tests/golpes-forma2.js
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
  const puddles = [], hits = [], shakes = [];
  return Object.assign({
    arena: { left: 100, right: 580, top: 180, bottom: 260 },
    nearestPlayer: () => null,
    players: [],
    shake(f, t) { shakes.push({ f, t }); },
    sound: noop,
    particles: noop,
    puddle(x, y, w, life) { puddles.push({ x, y, w, life }); },
    spawn: noop,
    shoot: noop,
    hit(x, y, w, h, z, r, dmg, knock, bx) { hits.push({ x, y, dmg, knock, bx }); },
    addBoss: noop,
    _puddles: puddles,
    _hits: hits,
    _shakes: shakes
  }, overrides);
}

function createClient() {
  let nextFrame, clock = 0;
  const events = {}, textSeen = new Set();
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
    setTimeout, clearTimeout
  };
  env.window = env;
  vm.createContext(env);

  for (const name of scripts) {
    const code = read(path.join(root, 'js', name + '.js'), 'utf8');
    vm.runInContext(code, env, { filename: name + '.js' });
  }

  return { env, api: env.__bangu };
}

const c = createClient();
const Bosses = c.env.Bosses;

// ==========================================
// ETAPA 5.3: Chefes 1 a 5
// ==========================================

// 1. Chefe 1 (X-Tudo Furioso) - 'baconDuplo'
{
  const b1 = { stage: 1, forma: 1 };
  const b2 = { stage: 1, forma: 2 };
  assert.equal(Bosses.availableAttacks(b1).includes('baconDuplo'), false, 'fase 1 forma 1 não deve ter baconDuplo');
  assert.equal(Bosses.availableAttacks(b2).includes('baconDuplo'), true, 'fase 1 forma 2 deve ter baconDuplo');

  const shots = [];
  const g = makeFakeG({ shoot(s) { shots.push(s); } });
  const b = Bosses.create(1, g)[0];
  b.damage = 20;
  b.attack = 'baconDuplo';
  b.state = 'attack';
  b.timer = 0;
  b.did = 0;
  b.update(0.1, g);

  assert.equal(shots.length, 10, 'baconDuplo deve criar exatamente 10 projéteis (5 frente, 5 trás)');
  const frontShots = shots.filter(s => s.vx * b.facing > 0);
  const backShots = shots.filter(s => s.vx * b.facing < 0);
  assert.equal(frontShots.length, 5, '5 projéteis para frente');
  assert.equal(backShots.length, 5, '5 projéteis para trás');
  assert.equal(shots[0].kind, 'bacon', 'projétil deve ser tipo bacon');
  assert.equal(shots[0].dmg, 20 * 0.5, 'dano deve ser d * 0.5');
  assert.ok(shots[0].dmg < 20 * 0.6, 'dano menor que bacon comum (0.6)');
  console.log('5.3 - Fase 1 (baconDuplo): OK');
}

// 2. Chefe 2 (Cachorro-Quente Turbinado) - 'ovosChuva'
{
  const b1 = { stage: 2, forma: 1 };
  const b2 = { stage: 2, forma: 2 };
  assert.equal(Bosses.availableAttacks(b1).includes('ovosChuva'), false);
  assert.equal(Bosses.availableAttacks(b2).includes('ovosChuva'), true);

  const shots = [];
  const g = makeFakeG({
    arena: { left: 100, right: 580, top: 180, bottom: 260 },
    shoot(s) { shots.push(s); }
  });
  const b = Bosses.create(2, g)[0];
  b.damage = 20;
  b.attack = 'ovosChuva';
  b.state = 'attack';
  b.timer = 0;
  b.did = 0;

  const dt = 1 / 60;
  for (let t = 0; t < 1.3; t += dt) {
    if (b.state === 'attack') b.update(dt, g);
  }

  assert.equal(shots.length, 10, 'ovosChuva deve criar exatamente 10 ovos');
  for (const s of shots) {
    assert.equal(s.kind, 'egg');
    assert.ok(s.x >= g.arena.left && s.x <= g.arena.right, 'ovo deve cair dentro da arena');
    assert.equal(s.dmg, 20 * 0.45, 'dano deve ser d * 0.45');
    assert.ok(s.dmg < 20 * 0.55, 'dano menor que eggs comum (0.55)');
  }
  console.log('5.3 - Fase 2 (ovosChuva): OK');
}

// 3. Chefe 3 (Pastelão de Feira) - 'oleoVelho'
{
  const b1 = { stage: 3, forma: 1 };
  const b2 = { stage: 3, forma: 2 };
  assert.equal(Bosses.availableAttacks(b1).includes('oleoVelho'), false);
  assert.equal(Bosses.availableAttacks(b2).includes('oleoVelho'), true);

  const shots = [];
  const g = makeFakeG({
    arena: { left: 100, right: 580, top: 180, bottom: 260 },
    shoot(s) { shots.push(s); }
  });
  const b = Bosses.create(3, g)[0];
  b.damage = 20;
  b.attack = 'oleoVelho';
  b.state = 'attack';
  b.timer = 0;
  b.did = 0;
  b.update(0.1, g);

  assert.equal(shots.length, 3, 'oleoVelho deve criar 3 tiros de óleo');
  assert.equal(g._puddles.length, 3, 'oleoVelho deve criar 3 poças');
  for (const s of shots) {
    assert.equal(s.kind, 'oil');
    assert.ok(s.x >= g.arena.left && s.x <= g.arena.right, 'óleo dentro da arena');
    assert.equal(s.dmg, 20 * 0.42, 'dano deve ser d * 0.42');
    assert.ok(s.dmg < 20 * 0.5, 'dano menor que oil comum (0.5)');
  }
  console.log('5.3 - Fase 3 (oleoVelho): OK');
}

// 4. Chefe 4 (Batata Frita Tsunami) - 'supersize'
{
  const b1 = { stage: 4, forma: 1 };
  const b2 = { stage: 4, forma: 2 };
  assert.equal(Bosses.availableAttacks(b1).includes('supersize'), false);
  assert.equal(Bosses.availableAttacks(b2).includes('supersize'), true);

  const g = makeFakeG();
  const pMock = { x: 350, y: 220, dead: false, hp: 100 };
  g.players = [pMock];

  const b = Bosses.create(4, g)[0];
  b.x = 300; b.y = 220;
  b.damage = 20;
  b.attack = 'supersize';
  b.state = 'attack';
  b.timer = 0;
  b.did = 0;

  const dt = 1 / 60;
  for (let t = 0; t < 2.0; t += dt) {
    if (b.state === 'attack') b.update(dt, g);
  }

  assert.equal(b.did, 6, 'supersize deve executar 6 pulsos (2x o triple)');
  assert.equal(g._shakes.length, 6, 'deve tremer 6 vezes');
  assert.ok(g._hits.length > 0, 'deve acertar jogadores no raio');
  assert.equal(g._hits[0].dmg, 20 * 0.5, 'dano deve ser d * 0.5');
  assert.ok(g._hits[0].dmg < 20 * 0.75, 'dano menor que triple comum (0.75)');
  console.log('5.3 - Fase 4 (supersize): OK');
}

// 5. Chefe 5 (Pizza Gigante) - 'bordaRecheada'
{
  const b1 = { stage: 5, forma: 1 };
  const b2 = { stage: 5, forma: 2 };
  assert.equal(Bosses.availableAttacks(b1).includes('bordaRecheada'), false);
  assert.equal(Bosses.availableAttacks(b2).includes('bordaRecheada'), true);

  const g = makeFakeG();
  // Posiciona 3 jogadores nos 3 feixes do leque a dist 80
  const pCenter = { x: 380, y: 220, dead: false, hp: 100 }; // alvo reto (baseAng = 0)
  const ang25 = 25 * Math.PI / 180;
  const pPlus = { x: 300 + Math.cos(ang25) * 80, y: 220 + Math.sin(ang25) * 80, dead: false, hp: 100 };
  const pMinus = { x: 300 + Math.cos(-ang25) * 80, y: 220 + Math.sin(-ang25) * 80, dead: false, hp: 100 };
  const pFar = { x: 300, y: 350, dead: false, hp: 100 }; // fora do leque

  g.players = [pCenter, pPlus, pMinus, pFar];

  const b = Bosses.create(5, g)[0];
  b.x = 300; b.y = 220;
  b.tx = 400; b.ty = 220; // baseAng = 0
  b.damage = 20;
  b.attack = 'bordaRecheada';
  b.state = 'attack';
  b.timer = 0;
  b.did = 0;
  b.update(0.1, g);

  assert.equal(g._hits.length, 3, 'deve acertar os 3 jogadores nas 3 linhas do leque');
  assert.equal(g._hits[0].dmg, 20 * 0.5, 'dano deve ser d * 0.5');
  assert.ok(g._hits[0].dmg < 20 * 1.0, 'dano menor que cheese comum (1.0)');
  console.log('5.3 - Fase 5 (bordaRecheada): OK');
}

// ==========================================
// ETAPA 5.4: Chefes 6, 7 e 9 (e imutabilidade 8 e pastel9)
// ==========================================

// 6. Chefe 6 (Churrasquinho de Gato Mutante) - 'espetoes'
{
  const b1 = { stage: 6, forma: 1 };
  const b2 = { stage: 6, forma: 2 };
  assert.equal(Bosses.availableAttacks(b1).includes('espetoes'), false);
  assert.equal(Bosses.availableAttacks(b2).includes('espetoes'), true);

  const g = makeFakeG();
  const ang25 = 25 * Math.PI / 180;
  // 3 jogadores nas 3 direções do leque à frente (b.facing = 1)
  const pCenter = { x: 300 + 60, y: 220, dead: false, hp: 100 };
  const pTop = { x: 300 + Math.cos(ang25) * 60, y: 220 + Math.sin(ang25) * 60, dead: false, hp: 100 };
  const pBot = { x: 300 + Math.cos(-ang25) * 60, y: 220 + Math.sin(-ang25) * 60, dead: false, hp: 100 };
  const pBehind = { x: 300 - 60, y: 220, dead: false, hp: 100 }; // atrás

  g.players = [pCenter, pTop, pBot, pBehind];

  const b = Bosses.create(6, g)[0];
  b.x = 300; b.y = 220; b.facing = 1;
  b.damage = 20;
  b.attack = 'espetoes';
  b.state = 'attack';
  b.timer = 0;
  b.did = 0;
  b.update(0.1, g);

  assert.equal(g._hits.length, 3, 'deve acertar os 3 jogadores nas direções do leque');
  assert.equal(g._hits[0].dmg, 20 * 0.5, 'dano deve ser d * 0.5');
  assert.ok(g._hits[0].dmg < 20 * 1.0, 'dano menor que skewers comum (1.0)');
  console.log('5.4 - Fase 6 (espetoes): OK');
}

// 7. Chefe 7 (Açaí Hipercalórico) - 'acaiTudo'
{
  const b1 = { stage: 7, forma: 1 };
  const b2 = { stage: 7, forma: 2 };
  assert.equal(Bosses.availableAttacks(b1).includes('acaiTudo'), false);
  assert.equal(Bosses.availableAttacks(b2).includes('acaiTudo'), true);

  const shots = [];
  const g = makeFakeG({
    arena: { left: 100, right: 580, top: 180, bottom: 260 },
    shoot(s) { shots.push(s); }
  });
  const b = Bosses.create(7, g)[0];
  b.x = 200; b.y = 220; b.facing = 1;
  b.damage = 20;
  b.attack = 'acaiTudo';
  b.state = 'attack';
  b.timer = 0;
  b.did = 0;
  b.update(0.1, g);

  assert.equal(shots.length, 3, 'acaiTudo deve criar 3 boulders em faixas de y');
  assert.equal(shots[0].kind, 'boulder');
  assert.equal(shots[0].dmg, 20 * 0.5, 'dano deve ser d * 0.5');
  assert.ok(shots[0].dmg < 20 * 0.8, 'dano menor que boulder comum (0.8)');
  // Verifica que as velocidades verticais (vy) direcionam para topo, meio e base
  const vys = shots.map(s => s.vy);
  assert.ok(Math.min(...vys) < 0, 'deve ter tiro para cima/topo');
  assert.ok(Math.max(...vys) > 0, 'deve ter tiro para baixo/base');
  console.log('5.4 - Fase 7 (acaiTudo): OK');
}

// 8. Fase 8 (Torre de Salgadinhos) - não muda na forma 2
{
  const b1 = { stage: 8, forma: 1 };
  const b2 = { stage: 8, forma: 2 };
  assert.deepEqual([...Bosses.availableAttacks(b1)], ['stomp', 'summon']);
  assert.deepEqual([...Bosses.availableAttacks(b2)], ['stomp', 'summon'], 'Torre não ganha golpe novo (sua forma 2 é a divisão)');
  console.log('5.4 - Fase 8 (Torre inalterada): OK');
}

// 9. Chefe 9 (Caldo de Cana vs Pastel Supremo)
{
  const cane1 = { kind: 'cane', forma: 1 };
  const cane2 = { kind: 'cane', forma: 2 };
  assert.equal(Bosses.availableAttacks(cane1).includes('garapa'), false);
  assert.equal(Bosses.availableAttacks(cane2).includes('garapa'), true);

  // Pastel Supremo não muda
  const pastel1 = { kind: 'pastel9', forma: 1 };
  const pastel2 = { kind: 'pastel9', forma: 2 };
  assert.deepEqual([...Bosses.availableAttacks(pastel1)], ['oil', 'dash']);
  assert.deepEqual([...Bosses.availableAttacks(pastel2)], ['oil', 'dash'], 'Pastel Supremo não ganha golpe novo');

  const shots = [];
  const g = makeFakeG({
    arena: { left: 100, right: 580, top: 180, bottom: 260 },
    shoot(s) { shots.push(s); }
  });
  const b = Bosses.create(9, g)[0]; // b[0] é o cane
  assert.equal(b.kind, 'cane');
  b.damage = 20;
  b.attack = 'garapa';
  b.state = 'attack';
  b.timer = 0;
  b.did = 0;
  b.update(0.1, g);

  assert.equal(shots.length, 15, 'garapa deve disparar 3 splashes de 5 gotas = 15 gotas');
  for (const s of shots) {
    assert.equal(s.kind, 'gordura');
    assert.ok(s.x >= g.arena.left && s.x <= g.arena.right, 'gota deve estar dentro da arena');
    assert.equal(s.dmg, 20 * 0.45, 'dano deve ser d * 0.45');
    assert.ok(s.dmg < 20 * 0.65, 'dano menor que splash comum (0.65)');
  }
  console.log('5.4 - Fase 9 (garapa e pastel9 inalterado): OK');
}

console.log('Todos os testes das etapas 5.3 e 5.4 passaram com sucesso!');
