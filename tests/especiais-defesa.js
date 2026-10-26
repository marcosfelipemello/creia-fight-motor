// Teste adversarial das regras de Especial: Defesa Antecipada e Super Freeze no X1
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
          appendChild: noop, addEventListener: noop, setAttribute: noop, textContent: ''
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

console.log('=== TESTES ADVERSARIAIS: ESPECIAL VS DEFESA E SUPER FREEZE ===');

// -------------------------------------------------------------
// TESTE 1: Defesa acionada ANTES do especial -> 100% defendido
// -------------------------------------------------------------
const c1 = createClient();
c1.api.cardosoTest.versus('douglas', 'lutador');
c1.until(() => c1.api.state.round && c1.api.state.round.phase === 'fight', 120);

const pDouglas = c1.api.state.players[0];
const pLutador = c1.api.state.players[1];
pDouglas.x = 200; pDouglas.y = 200; pDouglas.sp = 100;
pLutador.x = 260; pLutador.y = 200; pLutador.hp = 100;

// Lutador (P2) aperta botão de defender (Quote) ANTES do especial
c1.keyDown('Quote');
assert.equal(pLutador.state, 'guard', 'Lutador deve entrar em guard ao apertar Quote');

// Douglas (P1) aciona o especial (KeyL)
c1.key('KeyL');
assert.equal(pDouglas.state, 'special', 'Douglas deve ter entrado em especial');
assert.equal(pDouglas.specialBlocked, true, 'Especial do Douglas deve ser registrado como BLOQUEADO');

// Lutador solta a tecla Quote
c1.keyUp('Quote');

// Durante a tela de destaque (CINE + 2.1s), Lutador permanece travado
// Avança o tempo até o especial do Douglas terminar (CINE + 2.1s close + queima = ~250 frames)
const hpBeforeBurn = pLutador.hp;
for (let f = 0; f < 250; f++) {
  c1.tick(1);
}

assert.equal(pLutador.hp, hpBeforeBurn, 'Lutador NÃO deve tomar dano de um especial defendido antecipadamente!');
console.log('1. Especial com defesa antecipada: 100% defendido com 0 dano recebido: OK');

// -------------------------------------------------------------
// TESTE 2: Especial acionado ANTES da pessoa defender -> dano pega nela
// -------------------------------------------------------------
const c2 = createClient();
c2.api.cardosoTest.versus('douglas', 'lutador');
c2.until(() => c2.api.state.round && c2.api.state.round.phase === 'fight', 120);

const d2 = c2.api.state.players[0];
const l2 = c2.api.state.players[1];
d2.x = 200; d2.y = 200; d2.sp = 100;
l2.x = 260; l2.y = 200; l2.hp = 100;
assert.equal(l2.state, 'idle');

// Douglas aciona especial ANTES de o Lutador defender
c2.key('KeyL');
assert.equal(d2.state, 'special');
assert.equal(d2.specialBlocked, false, 'Especial NÃO foi defendido antes, specialBlocked deve ser false');

// Lutador tenta defender tardiamente segurando Quote durante o especial
c2.keyDown('Quote');

// Avança os frames até o dano de fogo entrar
const hpBeforeHit = l2.hp;
for (let f = 0; f < 250; f++) {
  c2.tick(1);
}

assert(l2.hp < hpBeforeHit, `Lutador DEVE tomar dano mesmo tentando defender depois! (HP inicial: ${hpBeforeHit}, HP final: ${l2.hp})`);
c2.keyUp('Quote');
console.log('2. Especial ativado antes da defesa fura qualquer tentativa tardia de guarda: OK');

// -------------------------------------------------------------
// TESTE 3: Super Freeze (Emanuelly - tela de redação / close-up)
// -------------------------------------------------------------
const c3 = createClient();
c3.api.cardosoTest.versus('emanuelly', 'lutador');
c3.until(() => c3.api.state.round && c3.api.state.round.phase === 'fight', 120);

const em = c3.api.state.players[0];
const lu = c3.api.state.players[1];
em.x = 200; em.y = 200; em.sp = 100;
lu.x = 300; lu.y = 200;

// Emanuelly aciona especial
c3.key('KeyL');
assert.equal(em.state, 'special');

// Durante a animação da redação (CINE + 1.45s = ~2.6s = ~150 frames):
// O Lutador tenta andar para a esquerda continuamente segurando ArrowLeft
const initialLuX = lu.x;
for (let f = 0; f < 100; f++) {
  c3.keyDown('ArrowLeft');
  assert.equal(lu.x, initialLuX, `Lutador NÃO pode se mover durante o freeze da tela de destaque! (frame ${f}, pos: ${lu.x})`);
}
c3.keyUp('ArrowLeft');
console.log('3. Super freeze trava todos os outros personagens durante a tela de destaque: OK');

// -------------------------------------------------------------
// TESTE 4: Especial do Lucas ("Porcos na Sala!") - Defesa vs Spin
// -------------------------------------------------------------
const c4 = createClient();
c4.api.cardosoTest.versus('lucas', 'lutador');
c4.until(() => c4.api.state.round && c4.api.state.round.phase === 'fight', 120);

const luc = c4.api.state.players[0];
const lut = c4.api.state.players[1];
luc.x = 200; luc.y = 200; luc.sp = 100;
lut.x = 260; lut.y = 200; lut.hp = 100;

// Lutador defende antes
c4.keyDown('Quote');
assert.equal(lut.state, 'guard');

c4.key('KeyL');
assert.equal(luc.specialBlocked, true, 'Lucas specialBlocked deve ser true');
c4.keyUp('Quote');

const hpBeforeLucas = lut.hp;
for (let f = 0; f < 250; f++) {
  c4.tick(1);
}
assert.equal(lut.hp, hpBeforeLucas, 'Lutador não deve perder HP com Porcos na Sala se defendeu antes');
console.log('4. Lucas (Porcos na Sala) defendido com 100% de absorção de dano: OK');

// -------------------------------------------------------------
// TESTE 5: Especial da Lorrany ("Low carb") drena: +20% de vida para ela e -20% do adversário
// -------------------------------------------------------------
const c5 = createClient();
c5.api.cardosoTest.versus('nutri', 'duda');
c5.until(() => c5.api.state.round && c5.api.state.round.phase === 'fight', 120);

const nut = c5.api.state.players[0];
const dud = c5.api.state.players[1];
nut.sp = 100; nut.hp = 50; dud.hp = 50;

c5.key('KeyL'); // Lorrany especial (dreno)
assert.equal(nut.specialBlocked, false, 'Duda não defendeu, o dreno não pode estar bloqueado');
for (let f = 0; f < 330; f++) c5.tick(1);
assert.equal(Math.round(nut.hp), 70, 'Lorrany deve recuperar 20% de vida');
assert.equal(Math.round(dud.hp), 30, 'Duda deve perder 20% de vida no dreno');
console.log('5. Dreno da Lorrany (+20% / -20%): OK');

console.log('\n=== TODOS OS TESTES DE ESPECIAL VS DEFESA E FREEZE PASSARAM COM SUCESSO! ===');

// -------------------------------------------------------------
// TESTE 6: Exemplo do usuário - Emanuelly vs Oponente não defendeu antes
// Oponente fica travado sem poder se mexer e sem poder defender
// mesmo tentando apertar defesa durante os hits de dano!
// -------------------------------------------------------------
const c6 = createClient();
c6.api.cardosoTest.versus('emanuelly', 'lutador');
c6.until(() => c6.api.state.round && c6.api.state.round.phase === 'fight', 120);

const em6 = c6.api.state.players[0];
const lu6 = c6.api.state.players[1];
em6.x = 200; em6.y = 200; em6.sp = 100;
lu6.x = 260; lu6.y = 200; lu6.hp = 100;
assert.equal(lu6.state, 'idle');

// Emanuelly usa especial
c6.key('KeyL');
assert.equal(em6.state, 'special');
assert.equal(lu6.spLocked, true, 'Oponente deve estar travado (spLocked = true)');
assert.equal(lu6.spLockedBlocked, false, 'Oponente NÃO defendeu antes, spLockedBlocked deve ser false');

// Avança até o momento que a redação termina e começam as letras a cair (~150 frames)
for (let f = 0; f < 150; f++) c6.tick(1);

// Agora as letras estão caindo e dando hit:
// O oponente tenta DESESPERADAMENTE defender apertando e segurando Quote
c6.keyDown('Quote');
c6.tick(1);
assert.notEqual(lu6.state, 'guard', 'Oponente NÃO PODE conseguir defender durante os hits do especial!');
assert.equal(lu6.spLocked, true, 'Oponente deve continuar travado enquanto os hits acontecem!');

// Avança até terminar todas as letras
for (let f = 0; f < 120; f++) {
  c6.tick(1);
  // Garante que durante todo o tempo de hits, o oponente não consegue levantar a guarda
  if (lu6.spLocked) assert.notEqual(lu6.state, "guard", "Oponente não pode levantar guarda enquanto o especial estiver ativo");
}

assert(lu6.hp < 100, `Oponente DEVE ter tomado dano de todo o especial da Emanuelly! HP: ${lu6.hp}`);
assert.equal(lu6.spLocked, false, 'Após o fim de todos os projéteis, spLocked deve ser destravado!');
c6.keyUp('Quote');
console.log('6. Emanuelly vs Oponente sem defesa prévia: travado sem se mover nem defender até o último hit: OK');

// -------------------------------------------------------------
// TESTE 7: Exemplo do usuário - Bispo vs Oponente defendeu antes
// Oponente fica paralisado COM A DEFESA LIGADA e toma 0 dano!
// -------------------------------------------------------------
const c7 = createClient();
c7.api.cardosoTest.versus('bispo', 'grazi');
c7.until(() => c7.api.state.round && c7.api.state.round.phase === 'fight', 120);

const bis7 = c7.api.state.players[0];
const gr7 = c7.api.state.players[1];
bis7.x = 200; bis7.y = 200; bis7.sp = 100;
gr7.x = 260; gr7.y = 200; gr7.hp = 100;

// Grazi aperta defesa ANTES do momento de destaque
c7.keyDown('Quote');
assert.equal(gr7.state, 'guard');

// Bispo aciona o especial
c7.key('KeyL');
assert.equal(bis7.state, 'special');
assert.equal(gr7.spLocked, true, 'Grazi deve ficar travada');
assert.equal(gr7.spLockedBlocked, true, 'Grazi deve estar travada COM DEFESA LIGADA');

// Grazi solta a tecla do teclado imediatamente
c7.keyUp('Quote');

// Durante todo o especial e chuva de bolas de fogo, Grazi continua em guard paralisada
for (let f = 0; f < 350; f++) {
  c7.tick(1);
  if (gr7.spLocked) {
    assert.equal(gr7.state, 'guard', 'Grazi deve permanecer em guard durante todo o especial do Bispo');
  }
}

assert.equal(gr7.hp, 100, 'Grazi NÃO PODE tomar nenhum dano das bolas de fogo do Bispo!');
assert.equal(gr7.spLocked, false, 'Após o fim das bolas de fogo, Grazi deve ser destravada!');
console.log('7. Bispo vs Grazi com defesa prévia: paralisada com defesa ligada e 0 dano sofrido: OK');
