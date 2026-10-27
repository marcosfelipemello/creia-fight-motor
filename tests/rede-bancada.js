// Bancada de teste de rede com atraso, jitter e perda configuráveis nos dois sentidos.
// Uso: node tests/rede-bancada.js
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const relay = require('../server/index.js');

const root = path.resolve(__dirname, '..');
const scripts = ['sprites', 'backgrounds', 'bosses', 'viloes', 'cenarios-arte',
  'criancas', 'bichos', 'objetos', 'rig', 'combate-config', 'ia-tatica', 'hud-combate', 'game'];
const noop = () => {};

// Gerador pseudoaleatório Mulberry32 determinístico baseado em semente.
function createPrng(seed = 123456789) {
  let s = Math.trunc(seed) >>> 0;
  return function rand() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parDeClientes(opts = {}) {
  const atraso = opts.atraso != null ? opts.atraso : 150;
  const variacao = opts.variacao != null ? opts.variacao : 30;
  const perda = opts.perda != null ? opts.perda : 0;
  const semente = opts.semente != null ? opts.semente : 123456789;
  const rand = createPrng(semente);

  let clock = 0;
  let queue = [];
  const lastDelivery = {};

  let enviados = 0;
  let perdidos = 0;
  let bytes = 0;
  let maiorMensagem = 0;
  let startClock = 0;

  function scheduleDelivery(channel, deliverFn) {
    const jitter = variacao > 0 ? (rand() * 2 - 1) * variacao : 0;
    const lat = Math.max(0, atraso + jitter);
    let at = clock + lat;
    if (lastDelivery[channel] != null && at < lastDelivery[channel]) {
      at = lastDelivery[channel];
    }
    lastDelivery[channel] = at;
    queue.push({ at, fn: deliverFn });
  }

  function pump() {
    const due = queue.filter(q => q.at <= clock).sort((a, b) => a.at - b.at);
    queue = queue.filter(q => q.at > clock);
    for (const q of due) q.fn();
  }

  function client(role) {
    const events = {}, received = [], sent = [], textSeen = new Set(), enemyDraws = [];
    let nextFrame, peer, frames = 0;
    const ctx = new Proxy({}, {
      get(_, key) {
        if (key === 'measureText') return value => ({ width: String(value).length * 8 });
        if (key === 'fillText') return value => { textSeen.add(String(value)); };
        if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({ addColorStop: noop });
        return noop;
      },
      set: () => true
    });
    function canvas() {
      return { width: 480, height: 270, getContext: () => ctx, getBoundingClientRect: () => ({ width: 480, height: 270 }) };
    }
    const cv = canvas();

    function socketPeer() {
      return {
        room: null, closed: false, buffer: Buffer.alloc(0), rateTime: 0, rateCount: 0, lastSeen: 0,
        socket: {
          destroyed: false, writableLength: 0,
          write(frame) {
            const offset = (frame[1] & 127) === 126 ? 4 : 2;
            const msg = JSON.parse(frame.subarray(offset).toString('utf8'));

            const deliver = () => {
              received.push(msg);
              if (msg.type === 'created' || msg.type === 'joined') {
                transport.code = msg.code;
                transport.token = msg.token;
              }
              transport.onMessage(msg);
            };

            // Tráfego anfitrião -> convidado (snapshots) atrasado e sujeito a perdas.
            if (msg.type === 'snapshot') {
              const len = Buffer.byteLength(JSON.stringify(msg));
              enviados++;
              bytes += len;
              if (len > maiorMensagem) maiorMensagem = len;

              if (perda > 0 && rand() < perda) {
                perdidos++;
                return;
              }
              scheduleDelivery('snapshots', deliver);
            } else {
              deliver();
            }
          },
          end() { this.destroyed = true; }
        }
      };
    }

    const transport = {
      onMessage: null, pendingCode: null, received, sent, code: null, token: null,
      get peer() { return peer; },
      create() { peer = socketPeer(); relay.message(peer, { type: 'create' }); },
      join(code) { peer = socketPeer(); relay.message(peer, { type: 'join', code }); },
      createCoop() { peer = socketPeer(); relay.message(peer, { type: 'create', mode: 'coop' }); },
      joinCoop(code) { peer = socketPeer(); relay.message(peer, { type: 'join', code, mode: 'coop' }); },
      drop() { if (peer && !peer.closed) { relay.close(peer); transport.onMessage({ type: 'reconnecting' }); } },
      resume() { peer = socketPeer(); relay.message(peer, { type: 'resume', code: transport.code, token: transport.token }); },
      send(msg) {
        if (!peer || peer.closed) return false;
        sent.push(msg);

        // Tráfego convidado -> anfitrião (inputs) atrasado e sujeito a perdas.
        if (msg.type === 'input') {
          const len = Buffer.byteLength(JSON.stringify(msg));
          enviados++;
          bytes += len;
          if (len > maiorMensagem) maiorMensagem = len;

          if (perda > 0 && rand() < perda) {
            perdidos++;
            return true;
          }
          scheduleDelivery('inputs', () => {
            if (!peer.closed) relay.message(peer, msg);
          });
        } else {
          relay.message(peer, msg);
        }
        return true;
      },
      leave() {
        const current = peer;
        peer = null;
        if (current && !current.closed) {
          relay.message(current, { type: 'leave' });
          relay.close(current);
        }
      },
      showLink: noop, hideOverlay: noop,
      askText: () => Promise.resolve(null), ranking: () => Promise.resolve({ ranking: [] }),
      score: () => Promise.resolve({ ok: true })
    };

    const env = {
      console, Math, Date, TextEncoder, URLSearchParams, performance: { now: () => clock },
      location: { search: '', hostname: '127.0.0.1' }, navigator: { maxTouchPoints: 0 }, devicePixelRatio: 1,
      Image: class { set src(v) { this.complete = true; this.naturalWidth = 100; } },
      CreiaUI: { sync(state, commands) { env.uiState = state; env.commands = commands; } },
      localStorage: { getItem: () => JSON.stringify({ tut: true, best: 10 }), setItem: noop },
      document: { getElementById: () => cv, createElement: canvas, head: { appendChild: noop }, body: { appendChild: noop } },
      addEventListener: (name, fn) => { events[name] = fn; },
      requestAnimationFrame: fn => { nextFrame = fn; },
      setTimeout, clearTimeout, BanguOnline: transport
    };
    env.window = env;
    vm.createContext(env);
    for (const name of scripts) {
      vm.runInContext(fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8'), env, { filename: name + '.js' });
    }

    if (env.Viloes && env.Viloes.drawEnemy) {
      const origDrawEnemy = env.Viloes.drawEnemy;
      env.Viloes.drawEnemy = function(c, kind, state, t, x, y, facing, opts) {
        enemyDraws.push({ frame: frames, clock, kind, state, x, y, facing });
        return origDrawEnemy.apply(this, arguments);
      };
    }

    const c = {
      transport, events, textSeen, enemyDraws,
      get state() { return env.__bangu.state; },
      get online() { return env.__bangu.online; },
      get api() { return env.__bangu; },
      get commands() { return env.commands; },
      frame() {
        if (peer && ++frames % 60 === 0) { peer.rateTime = Date.now(); peer.rateCount = 0; }
        if (nextFrame) nextFrame(clock);
      },
      hold(code) { events.keydown({ code, preventDefault: noop }); },
      release(code) { events.keyup({ code }); },
      key(code) { events.keydown({ code, preventDefault: noop }); tick(1 / 60); events.keyup({ code }); },
      tick(count = 1) { for (let i = 0; i < count; i++) tick(1 / 60); },
      until(check, limitSecs = 10) {
        const maxSteps = Math.round(limitSecs * 60);
        for (let i = 0; i < maxSteps && !check(c.state); i++) tick(1 / 60);
        assert(check(c.state), 'condição não atingida dentro do tempo limite');
      }
    };
    return c;
  }

  const host = client('host');
  const guest = client('guest');

  const frameMs = 1000 / 60;
  function tick(segundos = 1 / 60) {
    const steps = Math.max(1, Math.round((segundos * 1000) / frameMs));
    for (let s = 0; s < steps; s++) {
      clock += frameMs;
      pump();
      host.frame();
      guest.frame();
      pump();
    }
  }

  function medidas() {
    const elapsedSecs = (clock - startClock) / 1000;
    const bytesPorSegundo = elapsedSecs > 0 ? Math.round(bytes / elapsedSecs) : 0;
    return {
      enviados,
      perdidos,
      bytes,
      bytesPorSegundo,
      maiorMensagem
    };
  }

  const rede = {
    tick,
    medidas,
    get clock() { return clock; },
    get queue() { return queue; },
    resetStats() {
      enviados = 0;
      perdidos = 0;
      bytes = 0;
      maiorMensagem = 0;
      startClock = clock;
    }
  };

  return { host, guest, rede };
}

module.exports = { parDeClientes };

if (require.main === module) {
  // Prova que a bancada funciona no X1 online existente com 150 ms e 5% de perda
  const { host, guest, rede } = parDeClientes({ atraso: 150, variacao: 30, perda: 0.05, semente: 123456789 });
  host.key('Enter'); host.key('KeyD'); host.key('KeyD'); host.key('KeyD'); host.key('Enter');
  guest.transport.join(host.transport.code);
  host.key('Enter'); guest.key('KeyD'); guest.key('Enter');
  host.until(s => s.round && s.round.phase === 'fight');

  rede.resetStats();
  const initialHp0 = host.state.players[0].hp;
  const initialHp1 = host.state.players[1].hp;

  // Joga 20 segundos com os dois lutadores se movimentando e golpeando
  for (let t = 0; t < 20 * 60; t++) {
    if (t % 120 < 60) {
      host.hold('KeyD');
      guest.hold('KeyA');
    } else {
      host.release('KeyD');
      guest.release('KeyA');
    }
    if (t % 15 === 0) {
      host.hold('KeyJ');
      guest.hold('KeyJ');
    } else if (t % 15 === 3) {
      host.release('KeyJ');
      guest.release('KeyJ');
    }
    rede.tick(1 / 60);
  }

  const m = rede.medidas();
  console.log('Medidas X1 (20s, 150ms atraso, 5% perda):', m);
  assert.equal(host.state.scene, 'play');
  assert.equal(guest.state.scene, 'onlinePlay');
  assert(host.state.players[0].hp !== initialHp0 || host.state.players[1].hp !== initialHp1, 'Vidas devem mudar');
  console.log('X1 online sob rede instável: OK');
  host.transport.leave();
}
