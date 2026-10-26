// Teste adversarial da mecânica de Defesa no X1 (local e online)
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const scripts = ['sprites', 'backgrounds', 'bosses', 'viloes', 'cenarios-arte', 'criancas', 'bichos', 'objetos', 'rig', 'combate-config', 'ia-tatica', 'hud-combate', 'game'];
const noop = () => {};

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
  const touchElements = [];
  const env = {
    console, Math, Date, TextEncoder, URLSearchParams,
    performance: { now: () => clock },
    location: { search: '', hostname: '127.0.0.1' },
    navigator: { maxTouchPoints: 1 },
    devicePixelRatio: 1,
    Image: class { set src(v) { this.complete = true; this.naturalWidth = 100; } },
    localStorage: { getItem: () => JSON.stringify({ tut: true }), setItem: noop },
    document: {
      getElementById: canvas,
      createElement: (tag) => {
        if (tag === 'canvas') return canvas();
        const el = {
          style: {}, classList: { add: noop, remove: noop },
          appendChild: noop, addEventListener: noop, setAttribute:noop, textContent: ''
        };
        touchElements.push(el);
        return el;
      },
      head: { appendChild: noop },
      body: { appendChild: noop }
    },
    addEventListener: (name, fn) => { events[name] = fn; },
    requestAnimationFrame: fn => { nextFrame = fn; },
    setTimeout, clearTimeout
  };
  env.window = env;
  vm.createContext(env);
  for (const name of scripts) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8'), env, { filename: name + '.js' });
  }
  return {
    api: env.__bangu, textSeen, touchElements,
    tick(n = 1) { for (let i = 0; i < n; i++) { clock += 1000 / 60; nextFrame(clock); } },
    key(code) { events.keydown({ code, preventDefault: noop }); this.tick(); events.keyup({ code }); },
    keyDown(code) { events.keydown({ code, preventDefault: noop }); this.tick(); },
    keyUp(code) { events.keyup({ code }); this.tick(); },
    until(fn, max = 900) { for (let i = 0; i < max && !fn(); i++) this.tick(); assert(fn(), 'estado esperado não chegou'); }
  };
}

console.log('Iniciando testes da Defesa no X1...');

const c1 = createClient();
c1.api.cardosoTest.versus('nutri', 'lutador');
c1.until(() => c1.api.state.round && c1.api.state.round.phase === 'fight', 120);
const defenseButton=c1.touchElements.find(el=>el.textContent==='DEF');
assert(defenseButton,'botão DEF não apareceu no X1 mobile');
assert.equal(defenseButton.style.width,'64px');
assert.equal(defenseButton.style.height,'64px');

const p1 = c1.api.state.players[0]; // Nutri
const p2 = c1.api.state.players[1]; // Marcos Felipe

p1.x = 200; p1.y = 200; p1.facing = 1;
p2.x = 240; p2.y = 200; p2.facing = -1;
p1.hp = 100; p2.hp = 100;

// 1. Manter pressionado: escudo deve permanecer ativo por múltiplos segundos
c1.keyDown('KeyE');
assert.equal(p1.state, 'guard', 'P1 deveria entrar em guard');

// Simula 60 frames (1 segundo inteiro segurando o botão de defesa)
for (let frame = 0; frame < 60; frame++) {
  c1.tick(1);
  assert.equal(p1.state, 'guard', `P1 deve permanecer em guard no frame ${frame}`);
}
console.log('1. Escudo permanece ativo indefinidamente enquanto mantido pressionado: OK');

// 2. Múltiplos ataques bloqueados consecutivamente sem sofrer dano
const hpBeforeHits = p1.hp;
for (let hit = 0; hit < 3; hit++) {
  p2.x = p1.x + 40; // garante atacante à frente de P1 na arena
  p2.y = p1.y;
  p1.facing = 1;
  const blocked = c1.api.cardosoTest.versusHit(p2, p1, 15);
  assert.equal(blocked, false, `Hit ${hit + 1} deveria ter sido repelido`);
  assert.equal(p1.hp, hpBeforeHits, `P1 não pode sofrer dano no hit ${hit + 1}`);
  assert.equal(p1.state, 'guard', 'P1 deve continuar defendendo após repelir hit');
  c1.tick(5);
}
assert(p1.guardHp<100&&p1.guardHp>0,'golpes bloqueados não gastaram defesa');
const lastGuard=p1.guardHp;
c1.tick(80);assert(p1.guardHp>lastGuard,'defesa não recarregou sem impactos');
for(let i=0;i<20&&p1.state==='guard';i++)c1.api.cardosoTest.versusHit(p2,p1,15);
assert.equal(p1.guardHp,0);assert.equal(p1.state,'hurt');assert(p1.guardCd>0);
const brokenHp=p1.hp;c1.api.cardosoTest.versusHit(p2,p1,15);assert(p1.hp<brokenHp,'defesa quebrada ainda bloqueou');
c1.tick(120);assert(p1.guardHp>0,'defesa quebrada nunca se recuperou');
console.log('2. Desgaste, recarga sem impacto, quebra e vulnerabilidade: OK');

// 3. Ao soltar o botão, o escudo desativa imediatamente
c1.keyUp('KeyE');
c1.tick(1);
assert.equal(p1.state, 'idle', 'P1 deve voltar para idle logo após soltar a tecla');
console.log('3. Desativação imediata ao soltar o botão: OK');

// 4. Backstab: golpe pelas costas fura a defesa
p1.x=c1.api.state.cam+220;p2.x = p1.x - 40; // P2 atrás de P1
p1.facing = 1;
p1.inv = 0;
c1.keyDown('KeyE');
assert.equal(p1.state, 'guard');
const hpBeforeBackstab = p1.hp;
const backstabResult = c1.api.cardosoTest.versusHit(p2, p1, 15);
assert.equal(backstabResult, true, 'Golpe nas costas deve passar da barreira');
assert(p1.hp < hpBeforeBackstab, 'P1 deve sofrer dano nas costas');
c1.keyUp('KeyE');
console.log('4. Backstab atravessando a barreira frontal: OK');

console.log('\nTodos os testes adversariais da Defesa no X1 passaram com sucesso!');
