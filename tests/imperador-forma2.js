// Testes do novo golpe 'batatas' do Imperador Podrão na segunda forma.
// Uso: node tests/imperador-forma2.js
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
const fakeG = makeFakeG({ arena: { left: 100, right: 580, top: 180, bottom: 260 } });

// 1. O chefe 10 na forma 1 NUNCA recebe 'batatas' na lista (nas 3 fases)
{
  for (let phase = 1; phase <= 3; phase++) {
    const b = { stage: 10, kind: 'emperor', phase: phase, forma: 1 };
    const attacks = Bosses.availableAttacks(b);
    assert.equal(attacks.includes('batatas'), false, `Imperador forma 1 fase ${phase} não deve conter 'batatas'`);
  }
  console.log('1. Chefe 10 na forma 1 não tem batatas nas 3 fases: OK');
}

// 2. O chefe 10 na forma 2 RECEBE 'batatas' nas 3 fases
{
  for (let phase = 1; phase <= 3; phase++) {
    const b = { stage: 10, kind: 'emperor', phase: phase, forma: 2 };
    const attacks = Bosses.availableAttacks(b);
    assert.equal(attacks.includes('batatas'), true, `Imperador forma 2 fase ${phase} deve conter 'batatas'`);
  }
  console.log('2. Chefe 10 na forma 2 recebe batatas nas 3 fases: OK');
}

// 3. Chefe de outra fase (ex.: o 4) na forma 2 NÃO recebe 'batatas'
{
  const b4Forma1 = { stage: 4, kind: 'fries', forma: 1 };
  const b4Forma2 = { stage: 4, kind: 'fries', forma: 2 };
  assert.equal(Bosses.availableAttacks(b4Forma1).includes('batatas'), false);
  assert.equal(Bosses.availableAttacks(b4Forma2).includes('batatas'), false, "Chefe da fase 4 forma 2 não deve conter 'batatas'");

  // Verifica também outros chefes na forma 2
  for (let stage = 1; stage <= 9; stage++) {
    const bOther = { stage: stage, forma: 2 };
    assert.equal(Bosses.availableAttacks(bOther).includes('batatas'), false, `Chefe ${stage} forma 2 não deve conter 'batatas'`);
  }
  console.log('3. Outros chefes (fase 4 e demais) na forma 2 não recebem batatas: OK');
}

// 4. Ataque cria 14 projéteis 'fry', todos dentro da arena
{
  const shots = [];
  const g = makeFakeG({
    arena: { left: 200, right: 680, top: 180, bottom: 260 },
    shoot(shot) { shots.push(shot); }
  });

  const emp = Bosses.create(10, g)[0];
  emp.forma = 2;
  emp.x = 440;
  emp.y = 220;
  emp.attack = 'batatas';
  emp.state = 'attack';
  emp.timer = 0;
  emp.did = 0;

  // Atualiza ao longo de 1.6 segundos
  const dt = 1 / 60;
  for (let t = 0; t < 1.65; t += dt) {
    if (emp.state === 'attack') {
      emp.update(dt, g);
    }
  }

  assert.equal(shots.length, 14, `Ataque batatas deve criar exatamente 14 projéteis (criou ${shots.length})`);

  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    assert.equal(s.kind, 'fry', `Projétil ${i} deve ser do tipo 'fry'`);
    assert.ok(s.x >= g.arena.left && s.x <= g.arena.right,
      `Projétil ${i} em x=${s.x} fora da arena [${g.arena.left}, ${g.arena.right}]`);
  }

  // Verifica que os x foram sorteados pela arena toda, não concentrados em volta do chefe
  const minX = Math.min(...shots.map(s => s.x));
  const maxX = Math.max(...shots.map(s => s.x));
  assert.ok(maxX - minX > 250, 'Batatas devem cobrir a arena inteira');
  console.log('4. Criação de 14 projéteis fry dentro da arena: OK');
}

// 5. Dano de cada batata é menor que o da 'rain' comum
{
  const rainShots = [], batatasShots = [];
  const gRain = makeFakeG({ shoot(s) { rainShots.push(s); } });
  const gBatatas = makeFakeG({ shoot(s) { batatasShots.push(s); } });

  const bRain = Bosses.create(4, gRain)[0]; // fase 4 tem ataque 'rain'
  bRain.damage = 20;
  bRain.attack = 'rain';
  bRain.state = 'attack';
  bRain.timer = 0;
  bRain.did = 0;
  bRain.update(0.2, gRain);
  assert.ok(rainShots.length > 0, 'rain deve disparar projétil');
  const rainDmg = rainShots[0].dmg;

  const bBatatas = Bosses.create(10, gBatatas)[0];
  bBatatas.damage = 20;
  bBatatas.attack = 'batatas';
  bBatatas.state = 'attack';
  bBatatas.timer = 0;
  bBatatas.did = 0;
  bBatatas.update(0.2, gBatatas);
  assert.ok(batatasShots.length > 0, 'batatas deve disparar projétil');
  const batatasDmg = batatasShots[0].dmg;

  assert.ok(batatasDmg < rainDmg, `Dano da batata (${batatasDmg}) deve ser menor que o da rain (${rainDmg})`);
  assert.equal(batatasDmg, 20 * 0.45, 'Dano deve ser d * 0.45');
  assert.equal(rainDmg, 20 * 0.55, 'Dano de rain deve ser d * 0.55');
  console.log('5. Dano de cada batata menor que o da rain comum: OK');
}

// 6. Compatibilidade com CreiaBrains.bossAttack
{
  const listComBatatas = ['stomp', 'bacon', 'palha', 'batatas'];
  const b = { stage: 10, kind: 'emperor', forma: 2, attack: 'stomp', hp: 500, maxHp: 1000, x: 200, y: 200 };
  const attackChosen = c.env.CreiaBrains.bossAttack(b, fakeG, listComBatatas);
  assert.ok(attackChosen, 'bossAttack deve retornar um ataque válido');
  assert.ok(listComBatatas.includes(attackChosen), 'bossAttack deve escolher da lista');
  console.log('6. CreiaBrains.bossAttack com batatas: OK');
}

console.log('Todos os testes de imperador-forma2 passaram com sucesso!');
