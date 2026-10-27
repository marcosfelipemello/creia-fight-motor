// Testes Adversariais: Correção do Ímã, Defesa de Projéteis, Resistência do Lutador a Distância, Drone do Lohan e Pulo Esquivando Tiros
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
  const env = {
    console, Math, Date, TextEncoder, URLSearchParams,
    performance: { now: () => clock },
    location: { search: '', hostname: '127.0.0.1' },
    navigator: { maxTouchPoints: 1 },
    devicePixelRatio: 1,
    Image: class { set src(v) { this.complete = true; } },
    localStorage: { getItem: () => JSON.stringify({ tut: true }), setItem: noop },
    document: {
      getElementById: canvas,
      createElement: (tag) => {
        if (tag === 'canvas') return canvas();
        return { style: {}, classList: { add: noop, remove: noop }, appendChild: noop, addEventListener: noop, setAttribute: noop, textContent: '' };
      },
      head: { appendChild: noop }, body: { appendChild: noop }
    },
    addEventListener: (name, fn) => { events[name] = fn; },
    requestAnimationFrame: fn => { nextFrame = fn; },
    setTimeout, clearTimeout
  };
  env.window = env;
  vm.createContext(env);
  for (const name of scripts) {
    let code = fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8');
    // Teste de mecânica: neutraliza multiplicador de equilíbrio de dano do X1
    if (name === 'combate-config') code = code.replace('api.resistenciaX1={', 'api.resistenciaX1Off={');
    vm.runInContext(code, env, { filename: name + '.js' });
  }
  return {
    api: env.__bangu, textSeen, events,
    tick(n = 1) { for (let i = 0; i < n; i++) { clock += 1000 / 60; nextFrame(clock); } },
    keyDown(code) { events.keydown({ code, preventDefault: noop }); this.tick(); },
    keyUp(code) { events.keyup({ code }); this.tick(); },
    until(fn, max = 900) { for (let i = 0; i < max && !fn(); i++) this.tick(); assert(fn(), 'estado esperado não chegou'); }
  };
}

console.log('=== TESTES ADVERSARIAIS: TIRO, DEFESA, RESISTÊNCIA, DRONE E PULO ===');

// TESTE 1: Anti-Ímã em Tiros disparados da Direita para a Esquerda
{
  const c = createClient();
  c.api.cardosoTest.versus('emanuelly', 'lutador');
  c.until(() => c.api.state.round && c.api.state.round.phase === 'fight', 120);

  const shooter = c.api.state.players[0]; // Emanuelly (na direita)
  const target = c.api.state.players[1];  // Marcos Felipe (na esquerda)

  target.x = 200; target.y = 200; target.facing = 1;
  shooter.x = 400; shooter.y = 200; shooter.facing = -1;
  target.hp = 100; target.kx = 0; target.inv = 0;

  // Disparo atingindo o alvo vindo da direita (fromX = shooter.x = 400)
  c.api.cardosoTest.versusHit(shooter, target, 4.2, false, false, 24, shooter.x);

  // O alvo DEVE ser empurrado para a ESQUERDA (kx < 0, afastando do atirador).
  assert(target.kx < 0, `Alvo foi puxado para a direita (kx=${target.kx}) em vez de empurrado para longe da direita!`);
  assert(Math.abs(target.kx - (-36 * 0.65)) < 1e-4, `Recuo esperado do Lutador com redução de recuo: -23.4`);
  console.log('1. Tiro vindo da direita afasta o alvo para a esquerda (zero efeito ímã): OK');
}

// TESTE 2: Anti-Ímã em Tiros disparados da Esquerda para a Direita
{
  const c = createClient();
  c.api.cardosoTest.versus('emanuelly', 'nutri');
  c.until(() => c.api.state.round && c.api.state.round.phase === 'fight', 120);

  const shooter = c.api.state.players[0]; // Emanuelly (na esquerda)
  const target = c.api.state.players[1];  // Nutri (na direita)

  shooter.x = 150; shooter.y = 200; shooter.facing = 1;
  target.x = 350; target.y = 200; target.facing = -1;
  target.hp = 100; target.kx = 0; target.inv = 0;

  // Disparo atingindo o alvo vindo da esquerda (fromX = shooter.x = 150)
  c.api.cardosoTest.versusHit(shooter, target, 4.2, false, false, 24, shooter.x);

  // O alvo DEVE ser empurrado para a DIREITA (kx > 0, afastando do atirador na esquerda).
  assert(target.kx > 0, `Alvo deveria ser empurrado para a direita (kx=${target.kx})!`);
  assert.equal(target.kx, 36, `Recuo padrão: +36`);
  console.log('2. Tiro vindo da esquerda afasta o alvo para a direita (zero efeito ímã): OK');
}

// TESTE 3: Projétil bloqueável com Defesa ativa
{
  const c = createClient();
  c.api.cardosoTest.versus('nutri', 'emanuelly');
  c.until(() => c.api.state.round && c.api.state.round.phase === 'fight', 120);

  const p1 = c.api.state.players[0]; // Nutri
  const p2 = c.api.state.players[1]; // Emanuelly

  p1.x = 200; p1.y = 200; p1.facing = 1;
  p2.x = 380; p2.y = 200; p2.facing = -1;
  p1.hp = 100;

  c.keyDown('KeyE');
  assert.equal(p1.state, 'guard', 'P1 deve estar defendendo');

  const hitResult = c.api.cardosoTest.versusHit(p2, p1, 4.2, false, false, 24, p2.x);
  assert.equal(hitResult, false, 'Tiro deveria ter sido bloqueado pela guarda');
  assert.equal(p1.hp, 100, 'P1 não deveria sofrer nenhum dano');
  console.log('3. Tiros à distância são 100% bloqueáveis com defesa frontal ativa: OK');
}

// TESTE 4: Resistência específica a Ataques à Distância do Lutador (Marcos Felipe)
{
  const c = createClient();
  c.api.cardosoTest.versus('emanuelly', 'lutador');
  c.until(() => c.api.state.round && c.api.state.round.phase === 'fight', 120);

  const shooter = c.api.state.players[0];
  const lutador = c.api.state.players[1];

  lutador.x = 200; lutador.y = 200; lutador.inv = 0; lutador.hp = 100;
  shooter.x = 350; shooter.y = 200;

  // Ataque de projétil à distância (distância = 150px > 65px)
  c.api.cardosoTest.versusHit(shooter, lutador, 10, false, false, 24, shooter.x);
  const dmgLutadorDist = 100 - lutador.hp;

  // Ataque corpo a corpo no Lutador (distância <= 65px)
  lutador.hp = 100; lutador.inv = 0;
  shooter.x = 230; // bem perto
  c.api.cardosoTest.versusHit(shooter, lutador, 10, false, false, 60, shooter.x);
  const dmgLutadorMelee = 100 - lutador.hp;

  // Compara com personagem sem resistência
  const c2 = createClient();
  c2.api.cardosoTest.versus('emanuelly', 'nutri');
  c2.until(() => c2.api.state.round && c2.api.state.round.phase === 'fight', 120);
  const nutri = c2.api.state.players[1];
  nutri.x = 200; nutri.y = 200; nutri.inv = 0; nutri.hp = 100;
  c2.api.cardosoTest.versusHit(c2.api.state.players[0], nutri, 10, false, false, 24, 350);
  const dmgNutriDist = 100 - nutri.hp;

  assert.equal(dmgNutriDist, 4.0, 'Dano normal no X1 com VSK 0.4 deve ser 4.0');
  assert(Math.abs(dmgLutadorDist - (4.0 * 0.60)) < 1e-4, `Lutador deve ter 40% de resistência a distância (recebeu ${dmgLutadorDist})`);
  assert.equal(dmgLutadorMelee, 4.0, 'Lutador no corpo a corpo toma dano normal (sem inflar ou apelacionar)');
  console.log(`4. Resistência a distância do Lutador: recebeu ${dmgLutadorDist} HP em tiro vs ${dmgNutriDist} HP padrão (40% de redução); no corpo a corpo tomou normal (${dmgLutadorMelee} HP): OK`);
}

// TESTE 5: Drone do Lohan funciona no X1 (não se autodestrói no próprio Lohan)
{
  const c = createClient();
  c.api.cardosoTest.versus('lohan', 'nutri');
  c.until(() => c.api.state.round && c.api.state.round.phase === 'fight', 120);

  const p1 = c.api.state.players[0]; // Lohan
  const p2 = c.api.state.players[1]; // Nutri
  p2.hp = 100;

  // Lohan aciona Alt (KeyI) para lançar drone
  c.events.keydown({ code: 'KeyI', preventDefault: noop });
  c.tick();
  c.events.keyup({ code: 'KeyI' });

  assert.equal(c.api.state.shots.length, 1, 'Drone do Lohan deveria ter sido disparado');
  const drone = c.api.state.shots[0];
  assert.equal(drone.k, 'drone', 'O projétil deve ser um drone');
  assert.equal(drone.homing, true, 'O drone deve possuir comportamento teleguiado');

  // Simula múltiplos quadros enquanto o drone persegue e atinge Nutri
  for (let f = 0; f < 80 && p2.hp === 100; f++) c.tick();

  assert(p2.hp < 100, `Drone deveria ter atingido o oponente (hp Nutri: ${p2.hp})`);
  console.log(`5. Drone do Lohan no X1: perseguiu adversário e causou ${(100 - p2.hp).toFixed(1)} HP de dano sem explodir no caster: OK`);
}

// TESTE 6: Pulo permite esquivar de projéteis à distância
{
  const c = createClient();
  c.api.cardosoTest.versus('emanuelly', 'lutador');
  c.until(() => c.api.state.round && c.api.state.round.phase === 'fight', 120);

  const shooter = c.api.state.players[0]; // Emanuelly
  const lutador = c.api.state.players[1]; // Marcos Felipe

  shooter.x = 2600; lutador.x = 2800; lutador.hp = 100;

  // Lutador pula com vz = 310
  lutador.vz = 310; lutador.state = 'jump';

  // Emanuelly dispara lápis (KeyJ)
  c.events.keydown({ code: 'KeyJ', preventDefault: noop });
  c.tick();
  c.events.keyup({ code: 'KeyJ' });

  assert.equal(c.api.state.shots.length, 1, 'Projétil deve ter sido disparado');

  // Simula a passagem do projétil durante o pulo
  for (let f = 0; f < 60; f++) c.tick();

  assert.equal(lutador.hp, 100, 'Lutador não pode tomar dano ao pular por cima do projétil');
  console.log('6. Pulo alto permite esquivar completamente de tiros à distância (projétil passou por baixo): OK');
}

console.log('\n=== TODOS OS TESTES ADVERSARIAIS PASSARAM COM SUCESSO! ===');
