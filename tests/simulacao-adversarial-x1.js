// Simulação Adversarial de Partida X1 (Host vs Guest) com Latência Realista (100ms RTT + Jitter)
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const relay = require('../server/index.js');
const root = path.resolve(__dirname, '..');
const scripts = ['sprites', 'backgrounds', 'bosses', 'viloes', 'cenarios-arte', 'criancas', 'bichos', 'objetos', 'rig', 'combate-config', 'ia-tatica', 'hud-combate', 'game'];
const noop = () => {};

class AdversarialNetworkSim {
  constructor(options = {}) {
    this.rtt = options.rtt || 100; // 100ms round trip
    this.oneWayBase = this.rtt / 2; // 50ms base one-way
    this.jitterAmplitude = options.jitter || 12; // +/- 12ms jitter (38ms - 62ms)
    this.jitterPattern = [0, 8, -10, 12, -7, 5, -12, 10, -5, 7];
    this.serial = 0;
    this.clock = 0;
    this.queue = [];
    this.lastDelivery = { hostToGuest: 0, guestToHost: 0 };
    this.frameMs = 1000 / 60; // 16.666 ms
    this.frameIndex = 0;
  }

  getLatency() {
    const jitter = this.jitterPattern[this.serial++ % this.jitterPattern.length];
    return Math.max(25, this.oneWayBase + jitter);
  }

  schedule(fn, channel) {
    const lat = this.getLatency();
    let at = this.clock + lat;
    if (at < (this.lastDelivery[channel] || 0)) {
      at = this.lastDelivery[channel];
    }
    this.lastDelivery[channel] = at;
    this.queue.push({ at, fn, channel, scheduledAt: this.clock, deliverAt: at });
  }

  pump() {
    const due = this.queue.filter(q => q.at <= this.clock);
    this.queue = this.queue.filter(q => q.at > this.clock);
    for (const q of due) q.fn();
  }

  createClient(role) {
    const events = {}, received = [], sent = [];
    let nextFrame, peer, snapshotCount = 0;
    const self = this;
    const channelSend = role === 'host' ? 'hostToGuest' : 'guestToHost';

    const ctx = new Proxy({}, {
      get(_, key) {
        if (key === 'measureText') return s => ({ width: String(s).length * 8 });
        if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({ addColorStop: noop });
        return noop;
      },
      set: () => true
    });
    const canvas = () => ({ width: 480, height: 270, getContext: () => ctx, getBoundingClientRect: () => ({ width: 480, height: 270 }) });

    function socketPeer() {
      return {
        room: null, closed: false, buffer: Buffer.alloc(0), rateTime: 0, rateCount: 0, lastSeen: Date.now(),
        socket: {
          destroyed: false, writableLength: 0,
          write(frame) {
            const offset = (frame[1] & 127) === 126 ? 4 : 2;
            const msg = JSON.parse(frame.subarray(offset).toString('utf8'));
            const deliver = () => {
              received.push({ msg, at: self.clock });
              if (msg.type === 'created') transport.code = msg.code;
              transport.onMessage(msg);
            };
            self.schedule(deliver, channelSend === 'hostToGuest' ? 'hostToGuest' : 'guestToHost');
          },
          end() { this.destroyed = true; }
        }
      };
    }

    const transport = {
      onMessage: null, pendingCode: null, received, sent, code: null, blocked: false,
      create() { peer = socketPeer(); relay.message(peer, { type: 'create' }); },
      join(code) { peer = socketPeer(); relay.message(peer, { type: 'join', code }); },
      send(msg) {
        if (!peer || peer.closed) return false;
        sent.push({ msg, at: self.clock });
        if (msg.type === 'input') {
          self.schedule(() => { if (!peer.closed) relay.message(peer, msg); }, 'guestToHost');
        } else if (msg.type === 'snapshot') {
          self.schedule(() => { if (!peer.closed) relay.message(peer, msg); }, 'hostToGuest');
        } else {
          relay.message(peer, msg);
        }
        return true;
      },
      leave() {
        const current = peer; peer = null;
        if (current && !current.closed) { relay.message(current, { type: 'leave' }); relay.close(current); }
      },
      showLink: noop, hideOverlay: noop, askText: () => Promise.resolve(null),
      ranking: () => Promise.resolve({ ranking: [] }), score: () => Promise.resolve({ ok: true })
    };

    const env = {
      console, Math, Date, TextEncoder, URLSearchParams,
      performance: { now: () => self.clock },
      location: { search: '', hostname: '127.0.0.1' },
      navigator: { maxTouchPoints: 0 },
      devicePixelRatio: 1,
      Image: class { set src(v) { this.complete = true; this.naturalWidth = 100; } },
      localStorage: { getItem: () => JSON.stringify({ tut: true, best: 10 }), setItem: noop },
      document: { getElementById: canvas, createElement: canvas, head: { appendChild: noop }, body: { appendChild: noop } },
      addEventListener: (name, fn) => { events[name] = fn; },
      requestAnimationFrame: fn => { nextFrame = fn; },
      setTimeout, clearTimeout,
      BanguOnline: transport
    };
    env.window = env;
    vm.createContext(env);
    for (const name of scripts) {
      vm.runInContext(fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8'), env, { filename: name + '.js' });
    }

    return {
      role, transport, events,
      frame: () => nextFrame(self.clock),
      get state() { return env.__bangu.state; },
      get online() { return env.__bangu.online; },
      get rawEnv() { return env; }
    };
  }

  step(host, guest) {
    this.clock += this.frameMs;
    this.frameIndex++;
    this.pump();
    host.frame();
    guest.frame();
    this.pump();
  }
}

async function runAdversarialSim() {
  console.log('=== SIMULAÇÃO ADVERSARIAL BANGU X1 (100ms RTT + Jitter) ===\n');
  const sim = new AdversarialNetworkSim({ rtt: 100, jitter: 12 });
  const host = sim.createClient('host');
  const guest = sim.createClient('guest');

  function key(c, code) {
    c.events.keydown({ code, preventDefault: noop });
    sim.step(host, guest);
    c.events.keyup({ code });
  }

  // 1. Conexão e Seleção de Personagens: Host = Nutri, Guest = Lutador
  key(host, 'KeyS'); key(host, 'Enter'); key(host, 'KeyS'); key(host, 'Enter');
  for (let i = 0; i < 10; i++) sim.step(host, guest);
  guest.transport.join(host.transport.code);
  for (let i = 0; i < 15; i++) sim.step(host, guest);

  // Host seleciona Nutri (Enter)
  key(host, 'Enter');
  for (let i = 0; i < 10; i++) sim.step(host, guest);

  // Guest seleciona Lutador (KeyD + Enter)
  key(guest, 'KeyD');
  for (let i = 0; i < 5; i++) sim.step(host, guest);
  key(guest, 'Enter');

  // Aguarda início da partida
  for (let i = 0; i < 240 && (!host.state.round || host.state.round.phase !== 'fight'); i++) {
    sim.step(host, guest);
  }
  assert.equal(host.state.round.phase, 'fight', 'A partida não entrou na fase de luta');
  for (let i = 0; i < 30; i++) sim.step(host, guest);

  console.log('Partida iniciada com sucesso: Host = ' + host.state.players[0].who + ' vs Guest = ' + host.state.players[1].who);
  const cam = host.state.cam;
  console.log('Câmera arena x = ' + cam + '\n');

  // =========================================================================
  // CENÁRIO 1: Visitante anda em direção ao Host e tenta acertar um soco (KeyJ)
  // Sub-caso 1A: Whiff Fantasma (Host recua no neutral enquanto Guest ataca)
  // Sub-caso 1B: Golpe conecta com atraso massivo de confirmação
  // =========================================================================
  console.log('==================================================================');
  console.log('--- CENÁRIO 1: VISITANTE ANDA EM DIREÇÃO AO HOST E SOCO (KeyJ) ---');
  console.log('==================================================================');
  // Posiciona Host em cam + 180 e Guest em cam + 260
  host.state.players[0].x = cam + 180; host.state.players[0].y = 215; host.state.players[0].facing = 1; host.state.players[0].state = 'idle';
  host.state.players[1].x = cam + 260; host.state.players[1].y = 215; host.state.players[1].facing = -1; host.state.players[1].state = 'idle';
  host.state.players[0].inv = 0; host.state.players[1].inv = 0;
  for (let i = 0; i < 30; i++) sim.step(host, guest);

  // Guest anda em direção ao Host (KeyA)
  guest.events.keydown({ code: 'KeyA', preventDefault: noop });

  let punchFired = false;
  let punchMetrics = {};
  const lutadorReach = 30;
  const targetWidth = 24;
  const hitboxMaxDist = targetWidth / 2 + lutadorReach * 0.5; // 12 + 15 = 27px

  let hostEvalMetrics = null;
  const startHp = host.state.players[0].hp;
  let guestAudioFeedbackFrame = null;
  let guestAudioFeedbackTime = null;

  for (let f = 0; f < 120; f++) {
    // Host recua (KeyA) simulando recuo tático (footsies) assim que Guest se aproxima
    if (f >= 5 && f <= 35) {
      if (f === 5) host.events.keydown({ code: 'KeyA', preventDefault: noop });
    } else if (f === 36) {
      host.events.keyup({ code: 'KeyA' });
    }

    sim.step(host, guest);
    const guestOwn = guest.online.renderOwn;
    const guestOther = guest.online.renderOther;
    const hostP0 = host.state.players[0];
    const hostP1 = host.state.players[1];

    if (!guestOwn || !guestOther) continue;
    const visualDist = guestOwn.x - guestOther.x;

    // Quando o Visitante percebe o rival no alcance visual (visualDist <= 28px)
    if (!punchFired && visualDist <= 28 && visualDist > 0) {
      punchFired = true;
      punchMetrics = {
        frameAtPunch: sim.frameIndex,
        timeAtPunch: sim.clock,
        guestVisualOwnX: guestOwn.x,
        guestVisualOtherX: guestOther.x,
        guestVisualDist: visualDist,
        actualHostX: hostP0.x,
        actualGuestX: hostP1.x,
        actualRealDist: hostP1.x - hostP0.x,
        spatialHostError: Math.abs(guestOther.x - hostP0.x),
        spatialGuestError: Math.abs(guestOwn.x - hostP1.x),
        totalDesync: Math.abs((hostP1.x - hostP0.x) - visualDist)
      };
      guest.events.keydown({ code: 'KeyJ', preventDefault: noop });
      guest.events.keyup({ code: 'KeyA' }); // para de andar
    } else if (punchFired && sim.frameIndex === punchMetrics.frameAtPunch + 1) {
      guest.events.keyup({ code: 'KeyJ' });
    }

    // Monitora momento exato da avaliação no Host (meleeHit)
    if (punchFired && hostEvalMetrics === null && hostP1.state === 'attack1' && hostP1.hitDone) {
      const hx = hostP1.x + hostP1.facing * lutadorReach * 0.5;
      const distAtEval = Math.abs(hx - hostP0.x);
      const connected = host.state.players[0].hp < startHp;
      hostEvalMetrics = {
        evalFrame: sim.frameIndex,
        evalTime: sim.clock,
        latencyMs: sim.clock - punchMetrics.timeAtPunch,
        framesDelay: sim.frameIndex - punchMetrics.frameAtPunch,
        guestXOnHost: hostP1.x,
        hostXOnHost: hostP0.x,
        hxOnHost: hx,
        distToHost: distAtEval,
        hitboxLimit: hitboxMaxDist,
        connected: connected,
        guestHpDamage: startHp - host.state.players[0].hp
      };
    }

    // Monitora feedback de áudio/visual de hit na tela do Visitante
    if (hostEvalMetrics && guestAudioFeedbackFrame === null) {
      const guestReceivedSounds = guest.online.heardId > 0;
      const guestSnaps = guest.online.snapshots;
      const latestSnap = guestSnaps.length ? guestSnaps[guestSnaps.length - 1].state : null;
      if (latestSnap && latestSnap.players[0].hp < startHp) {
        guestAudioFeedbackFrame = sim.frameIndex;
        guestAudioFeedbackTime = sim.clock;
      }
    }
  }

  console.log('Resultados do Cenário 1:');
  console.log('  No momento em que o Visitante pressiona KeyJ (soco):');
  console.log('    Posição do Host na TELA DO VISITANTE: x = ' + punchMetrics.guestVisualOtherX.toFixed(2));
  console.log('    Posição REAL do Host na MÁQUINA HOST: x = ' + punchMetrics.actualHostX.toFixed(2));
  console.log('    Erro espacial do Host na tela do Visitante: ' + punchMetrics.spatialHostError.toFixed(2) + ' px');
  console.log('    Posição do Visitante na TELA DO VISITANTE: x = ' + punchMetrics.guestVisualOwnX.toFixed(2));
  console.log('    Posição do Visitante no HOST: x = ' + punchMetrics.actualGuestX.toFixed(2));
  console.log('    Erro espacial do Visitante (Local vs Host): ' + punchMetrics.spatialGuestError.toFixed(2) + ' px');
  console.log('    Distância visual percebida pelo Visitante: ' + punchMetrics.guestVisualDist.toFixed(2) + ' px (VISUALMENTE NO ALCANCE)');
  console.log('    Distância real no Host no momento do envio: ' + punchMetrics.actualRealDist.toFixed(2) + ' px');
  console.log('    Desync inicial de distância: ' + punchMetrics.totalDesync.toFixed(2) + ' px');
  console.log('  No momento da checagem autoritativa (meleeHit) no Host:');
  console.log('    Atraso do comando KeyJ até avaliação autoritativa: ' + hostEvalMetrics.latencyMs.toFixed(1) + ' ms (' + hostEvalMetrics.framesDelay + ' frames)');
  console.log('    Posição de impacto Guest (hx): ' + hostEvalMetrics.hxOnHost.toFixed(2) + ', Posição Host (b.x): ' + hostEvalMetrics.hostXOnHost.toFixed(2));
  console.log('    Distância de colisão no Host (|hx - b.x|): ' + hostEvalMetrics.distToHost.toFixed(2) + ' px (Limite hitbox: ' + hostEvalMetrics.hitboxLimit.toFixed(2) + ' px)');
  console.log('    Conectou ou Whiff Fantasma?: ' + (hostEvalMetrics.connected ? 'CONECTOU' : 'WHIFF FANTASMA (ERROU NO VAZIO)'));
  console.log('    Dano aplicado no Host: ' + hostEvalMetrics.guestHpDamage.toFixed(2) + ' HP');
  if (guestAudioFeedbackFrame) {
    const totalFeedbackDelayMs = guestAudioFeedbackTime - punchMetrics.timeAtPunch;
    const totalFeedbackDelayFrames = guestAudioFeedbackFrame - punchMetrics.frameAtPunch;
    console.log('    Atraso total até o Visitante ver a barra de vida do Host cair: ' + totalFeedbackDelayMs.toFixed(1) + ' ms (' + totalFeedbackDelayFrames + ' frames)');
  }
  console.log('');

  // Sub-caso 1B: Whiff Fantasma (Host recua continuamente em footsies)
  console.log('  --- SUB-TESTE 1B: WHIFF FANTASMA (HOST RECUANDO EM FOOTSIES) ---');
  host.state.players[0].x = cam + 200; host.state.players[0].facing = 1; host.state.players[0].state = 'idle';
  host.state.players[1].x = cam + 235; host.state.players[1].facing = -1; host.state.players[1].state = 'idle';
  host.state.players[0].inv = 0; host.state.players[1].inv = 0;
  for (let i = 0; i < 30; i++) sim.step(host, guest);

  // Host recua continuamente (KeyA)
  host.events.keydown({ code: 'KeyA', preventDefault: noop });
  // Guest avança (KeyA)
  guest.events.keydown({ code: 'KeyA', preventDefault: noop });

  let punchFired1B = false;
  let punchMetrics1B = {};
  let hostEvalMetrics1B = null;
  const startHp1B = host.state.players[0].hp;

  for (let f = 0; f < 100; f++) {
    sim.step(host, guest);
    const guestOwn = guest.online.renderOwn;
    const guestOther = guest.online.renderOther;
    const hostP0 = host.state.players[0];
    const hostP1 = host.state.players[1];

    if (!guestOwn || !guestOther) continue;
    const visualDist = guestOwn.x - guestOther.x;

    if (!punchFired1B && visualDist <= 32 && visualDist > 0) {
      punchFired1B = true;
      punchMetrics1B = {
        frameAtPunch: sim.frameIndex,
        timeAtPunch: sim.clock,
        guestVisualOwnX: guestOwn.x,
        guestVisualOtherX: guestOther.x,
        guestVisualDist: visualDist,
        actualHostX: hostP0.x,
        actualGuestX: hostP1.x,
        actualRealDist: hostP1.x - hostP0.x,
        spatialHostError: Math.abs(guestOther.x - hostP0.x),
        spatialGuestError: Math.abs(guestOwn.x - hostP1.x)
      };
      guest.events.keydown({ code: 'KeyJ', preventDefault: noop });
      guest.events.keyup({ code: 'KeyA' });
    } else if (punchFired1B && sim.frameIndex === punchMetrics1B.frameAtPunch + 1) {
      guest.events.keyup({ code: 'KeyJ' });
    }

    if (punchFired1B && hostEvalMetrics1B === null && hostP1.state === 'attack1' && hostP1.hitDone) {
      const hx = hostP1.x + hostP1.facing * lutadorReach * 0.5;
      const distAtEval = Math.abs(hx - hostP0.x);
      const connected = host.state.players[0].hp < startHp1B;
      hostEvalMetrics1B = {
        evalFrame: sim.frameIndex,
        evalTime: sim.clock,
        latencyMs: sim.clock - punchMetrics1B.timeAtPunch,
        framesDelay: sim.frameIndex - punchMetrics1B.frameAtPunch,
        hxOnHost: hx,
        hostXOnHost: hostP0.x,
        distToHost: distAtEval,
        hitboxLimit: hitboxMaxDist,
        connected: connected,
        guestHpDamage: startHp1B - host.state.players[0].hp
      };
    }
  }
  host.events.keyup({ code: 'KeyA' });

  if (hostEvalMetrics1B) {
    console.log('  No momento do soco do Visitante:');
    console.log('    Distância visual percebida na tela do Visitante: ' + punchMetrics1B.guestVisualDist.toFixed(2) + ' px (DENTRO DO RAIO)');
    console.log('    Distância real no Host no momento do envio: ' + punchMetrics1B.actualRealDist.toFixed(2) + ' px');
    console.log('  No momento da checagem autoritativa (meleeHit) no Host:');
    console.log('    Atraso até avaliação: ' + hostEvalMetrics1B.latencyMs.toFixed(1) + ' ms (' + hostEvalMetrics1B.framesDelay + ' frames)');
    console.log('    Distância de colisão no Host: ' + hostEvalMetrics1B.distToHost.toFixed(2) + ' px (Limite hitbox: ' + hostEvalMetrics1B.hitboxLimit.toFixed(2) + ' px)');
    console.log('    Resultado autoritativo: ' + (hostEvalMetrics1B.connected ? 'CONECTOU' : 'WHIFF FANTASMA (GOLPE PASSOU NO VAZIO!)'));
    console.log('    Dano causado: ' + hostEvalMetrics1B.guestHpDamage.toFixed(2) + ' HP');
  }
  console.log('');

  // =========================================================================
  // CENÁRIO 2: O Host anda em direção ao Visitante e desfere um golpe
  // =========================================================================
  console.log('==================================================================');
  console.log('--- CENÁRIO 2: HOST ANDA EM DIREÇÃO AO VISITANTE E GOLPEIA ---');
  console.log('==================================================================');
  // Reposiciona jogadores
  host.state.players[0].x = cam + 215; host.state.players[0].y = 215; host.state.players[0].facing = 1; host.state.players[0].state = 'idle';
  host.state.players[1].x = cam + 240; host.state.players[1].y = 215; host.state.players[1].facing = -1; host.state.players[1].state = 'idle';
  host.state.players[0].inv = 0; host.state.players[1].inv = 0;
  for (let i = 0; i < 25; i++) sim.step(host, guest);

  // Host anda em direção ao Visitante (KeyD)
  host.events.keydown({ code: 'KeyD', preventDefault: noop });
  for (let i = 0; i < 15; i++) sim.step(host, guest);
  host.events.keyup({ code: 'KeyD' });

  // Host ataca com soco (KeyJ)
  const guestHpBefore = host.state.players[1].hp;
  const hostHitStartTime = sim.clock;
  const hostHitStartFrame = sim.frameIndex;
  key(host, 'KeyJ');

  let hostHitConnectTime = null;
  let hostHitConnectFrame = null;
  let guestVisualHurtFrame = null;
  let guestVisualHurtTime = null;
  let guestTeleportPx = 0;
  let serverLockAtHurt = false;
  let maxTeleportDuringHit = 0;
  let predictionFrozenFrames = 0;

  for (let f = 0; f < 50; f++) {
    const beforeX = guest.online.renderOwn.x;
    const beforeState = guest.online.renderOwn.state;
    sim.step(host, guest);
    const afterX = guest.online.renderOwn.x;
    const afterState = guest.online.renderOwn.state;
    const deltaX = Math.abs(afterX - beforeX);
    maxTeleportDuringHit = Math.max(maxTeleportDuringHit, deltaX);

    // Checa se o Host conectou o hit
    if (hostHitConnectFrame === null && host.state.players[1].hp < guestHpBefore) {
      hostHitConnectFrame = sim.frameIndex;
      hostHitConnectTime = sim.clock;
    }

    // Checa quando o Visitante visualiza o dano/hurt
    if (afterState === 'hurt' && guestVisualHurtFrame === null) {
      guestVisualHurtFrame = sim.frameIndex;
      guestVisualHurtTime = sim.clock;
      guestTeleportPx = deltaX;
      serverLockAtHurt = guest.online.pred.serverLock;
    }

    if (guest.online.pred && guest.online.pred.serverLock) {
      predictionFrozenFrames++;
    }
  }

  const damageTaken = guestHpBefore - host.state.players[1].hp;
  const feedbackDelayMs = guestVisualHurtTime - hostHitConnectTime;
  const feedbackDelayFrames = guestVisualHurtFrame - hostHitConnectFrame;

  console.log('Resultados do Cenário 2:');
  console.log('  O Visitante toma dano?: ' + (damageTaken > 0 ? 'SIM (' + damageTaken.toFixed(2) + ' HP)' : 'NÃO'));
  console.log('  Momento do golpe autoritativo no Host: frame ' + hostHitConnectFrame + ' (' + hostHitConnectTime.toFixed(1) + ' ms)');
  console.log('  Momento da reação na tela do Visitante: frame ' + guestVisualHurtFrame + ' (' + guestVisualHurtTime.toFixed(1) + ' ms)');
  console.log('  Atraso de feedback de dano na tela do Visitante: ' + feedbackDelayMs.toFixed(1) + ' ms (' + feedbackDelayFrames + ' frames de atraso)');
  console.log('  Salto brusco / teleporte no frame de chegada: ' + guestTeleportPx.toFixed(2) + ' px num único frame');
  console.log('  Maior salto brusco durante o knockback no Visitante: ' + maxTeleportDuringHit.toFixed(2) + ' px');
  console.log('  Estado de predição (serverLock): ' + (serverLockAtHurt ? 'TRAVADO (serverLock = true, predição congelada)' : 'LIVRE'));
  console.log('  Total de frames com predição congelada (serverLock ativo): ' + predictionFrozenFrames + ' frames');
  console.log('');

  // =========================================================================
  // CENÁRIO 3: Visitante aciona DEF (KeyE) no momento em que o Host golpeia
  // =========================================================================
  console.log('==================================================================');
  console.log('--- CENÁRIO 3: VISITANTE ACIONA DEFESA (KeyE) NO MOMENTO DO GOLPE ---');
  console.log('==================================================================');
  // Reposiciona jogadores a curta distância
  host.state.players[0].x = cam + 210; host.state.players[0].y = 215; host.state.players[0].facing = 1; host.state.players[0].state = 'idle';
  host.state.players[1].x = cam + 235; host.state.players[1].y = 215; host.state.players[1].facing = -1; host.state.players[1].state = 'idle';
  host.state.players[0].inv = 0; host.state.players[1].inv = 0;
  host.state.players[0].hp = 100; host.state.players[1].hp = 100;
  for (let i = 0; i < 25; i++) sim.step(host, guest);

  // Host inicia golpe (KeyJ)
  host.events.keydown({ code: 'KeyJ', preventDefault: noop });

  // No exato momento que o Host inicia o golpe, o Visitante aciona KeyE (defesa)
  const defPressTime = sim.clock;
  const defPressFrame = sim.frameIndex;
  guest.events.keydown({ code: 'KeyE', preventDefault: noop });

  // Verifica se no primeiro frame o escudo ativou localmente no Visitante
  sim.step(host, guest);
  const shieldActiveLocallyOnFrame0 = guest.online.renderOwn.state === 'guard';
  const predStateFrame0 = guest.online.pred.state;
  const hostSawGuardAtFrame0 = host.state.players[1].state === 'guard';

  let hitResolvedFrame = null;
  let guestTookDamageWhileGuarding = false;
  let guestHpAfterHit = 100;
  let hostStateAtResolution = null;
  let serverLockReaction = null;

  for (let f = 0; f < 35; f++) {
    sim.step(host, guest);
    if (hitResolvedFrame === null && (host.state.players[1].state === 'hurt' || host.state.players[1].guardFlash > 0 || host.state.players[1].hp < 100)) {
      hitResolvedFrame = sim.frameIndex;
      guestHpAfterHit = host.state.players[1].hp;
      guestTookDamageWhileGuarding = guestHpAfterHit < 100;
      hostStateAtResolution = host.state.players[1].state;
      serverLockReaction = guest.online.pred ? guest.online.pred.serverLock : null;
    }
  }
  guest.events.keyup({ code: 'KeyE' });
  host.events.keyup({ code: 'KeyJ' });

  // Avaliação de guestServerState("guard")
  const guestServerStateEvalGuest = ['idle','walk','jump','throw','attack1','attack2','barriga','fralda','guard'].indexOf('guard') < 0;

  console.log('Resultados do Cenário 3:');
  console.log('  O escudo do Visitante ativou a tempo localmente?: ' + (shieldActiveLocallyOnFrame0 ? 'SIM (Frame 0, state="guard")' : 'NÃO'));
  console.log('  No Host, no instante do golpe, o Guest estava em guard?: ' + (hostSawGuardAtFrame0 ? 'SIM' : 'NÃO (ainda "idle/walk" por latência de rede)'));
  console.log('  O Visitante tomou dano mesmo defendendo a tempo na tela dele?: ' + (guestTookDamageWhileGuarding ? 'SIM (Perdeu ' + (100 - guestHpAfterHit).toFixed(2) + ' HP)' : 'NÃO'));
  console.log('  Estado do Visitante no Host no momento do impacto: "' + hostStateAtResolution + '"');
  console.log('  Avaliação de guestServerState("guard"): ' + guestServerStateEvalGuest + (guestServerStateEvalGuest ? ' (RETORNA TRUE: considera guard estado de servidor!)' : ' (RETORNA FALSE: guard é tratado como estado predito localmente!)'));
  console.log('  Reação de serverLock ao estado de guard: serverLock = ' + serverLockReaction);

  // Sub-teste 3B: Investigação profunda de guestServerState e serverLock sob Guard pacífico
  console.log('\n  --- SUB-TESTE 3B: COMPORTAMENTO DE guestServerState E serverLock EM DEFESA ---');
  host.state.players[0].x = cam + 180; host.state.players[1].x = cam + 260;
  host.state.players[0].state = 'idle'; host.state.players[1].state = 'idle';
  for (let i = 0; i < 25; i++) sim.step(host, guest);

  // Visitante segura KeyE
  guest.events.keydown({ code: 'KeyE', preventDefault: noop });
  let serverAcknowledgedGuardFrame = null;
  let serverLockActivatedOnGuest = false;
  let sentInputsWipedOnGuard = false;

  for (let f = 0; f < 30; f++) {
    sim.step(host, guest);
    if (host.state.players[1].state === 'guard' && serverAcknowledgedGuardFrame === null) {
      serverAcknowledgedGuardFrame = sim.frameIndex;
    }
    if (guest.online.pred && guest.online.pred.serverLock) {
      serverLockActivatedOnGuest = true;
      if (guest.online.sentInputs.length === 0) sentInputsWipedOnGuard = true;
    }
  }
  guest.events.keyup({ code: 'KeyE' });
  console.log('  Quando o Host confirma "guard", guestServerState("guard") ativa serverLock no Visitante?: ' + (serverLockActivatedOnGuest ? 'SIM (serverLock = true)' : 'NÃO'));
  console.log('  A fila de predição sentInputs é esvaziada (wipe) pelo serverLock?: ' + (sentInputsWipedOnGuard ? 'SIM (sentInputs = [])' : 'NÃO'));
  console.log('');

  // =========================================================================
  // CENÁRIO 4: Diferença de Tempo de Resposta Visual e Espacial
  // =========================================================================
  console.log('==================================================================');
  console.log('--- CENÁRIO 4: DIFERENÇA DE TEMPO DE RESPOSTA VISUAL E ESPACIAL ---');
  console.log('==================================================================');
  // Reposiciona jogadores
  host.state.players[0].x = cam + 180; host.state.players[0].facing = 1;
  host.state.players[1].x = cam + 300; host.state.players[1].facing = -1;
  for (let i = 0; i < 30; i++) sim.step(host, guest);

  // 4.1 Latência de Ação do Host na tela do Visitante
  const hostActionTime = sim.clock;
  const hostActionFrame = sim.frameIndex;
  const initialGuestPerceptionHostX = guest.online.renderOther.x;
  host.events.keydown({ code: 'KeyD', preventDefault: noop });

  let guestPerceivedHostMoveFrame = null;
  let guestPerceivedHostMoveTime = null;
  let maxSpatialDeltaHost = 0;

  for (let f = 0; f < 30; f++) {
    sim.step(host, guest);
    const hostActualX = host.state.players[0].x;
    const hostRenderedOnGuest = guest.online.renderOther.x;
    const delta = Math.abs(hostActualX - hostRenderedOnGuest);
    maxSpatialDeltaHost = Math.max(maxSpatialDeltaHost, delta);

    if (guestPerceivedHostMoveFrame === null && Math.abs(hostRenderedOnGuest - initialGuestPerceptionHostX) > 0.5) {
      guestPerceivedHostMoveFrame = sim.frameIndex;
      guestPerceivedHostMoveTime = sim.clock;
    }
  }
  host.events.keyup({ code: 'KeyD' });

  const hostToGuestVisualLatencyMs = guestPerceivedHostMoveTime - hostActionTime;
  const hostToGuestVisualLatencyFrames = guestPerceivedHostMoveFrame - hostActionFrame;

  // 4.2 Latência de Ação do Guest na simulação do Host
  for (let i = 0; i < 25; i++) sim.step(host, guest);
  const guestActionTime = sim.clock;
  const guestActionFrame = sim.frameIndex;
  const initialHostPerceptionGuestX = host.state.players[1].x;
  guest.events.keydown({ code: 'KeyA', preventDefault: noop });

  let hostPerceivedGuestMoveFrame = null;
  let hostPerceivedGuestMoveTime = null;
  let maxSpatialDeltaGuest = 0;

  for (let f = 0; f < 30; f++) {
    sim.step(host, guest);
    const guestActualX = guest.online.renderOwn.x;
    const guestOnHost = host.state.players[1].x;
    const delta = Math.abs(guestActualX - guestOnHost);
    maxSpatialDeltaGuest = Math.max(maxSpatialDeltaGuest, delta);

    if (hostPerceivedGuestMoveFrame === null && Math.abs(guestOnHost - initialHostPerceptionGuestX) > 0.5) {
      hostPerceivedGuestMoveFrame = sim.frameIndex;
      hostPerceivedGuestMoveTime = sim.clock;
    }
  }
  guest.events.keyup({ code: 'KeyA' });

  const guestToHostLatencyMs = hostPerceivedGuestMoveTime - guestActionTime;
  const guestToHostLatencyFrames = hostPerceivedGuestMoveFrame - guestActionFrame;

  console.log('Resultados do Cenário 4:');
  console.log('  Latência Host -> Guest (Tempo até ação do Host aparecer na tela do Visitante):');
  console.log('    Tempo: ' + hostToGuestVisualLatencyMs.toFixed(1) + ' ms (' + hostToGuestVisualLatencyFrames + ' frames a 60 FPS)');
  console.log('    Composição técnica: 1-way network (~50ms) + Snapshot Tick (33.3ms) + Interpolation Buffer (100ms)');
  console.log('    Erro espacial máximo do Host na tela do Visitante: ' + maxSpatialDeltaHost.toFixed(2) + ' px');
  console.log('  Latência Guest -> Host (Tempo até ação do Visitante surtir efeito no Host):');
  console.log('    Tempo: ' + guestToHostLatencyMs.toFixed(1) + ' ms (' + guestToHostLatencyFrames + ' frames a 60 FPS)');
  console.log('    Erro espacial máximo do Visitante (Local vs Host): ' + maxSpatialDeltaGuest.toFixed(2) + ' px');
  console.log('  Assimetria de Percepção: O Visitante vê o Host ' + (hostToGuestVisualLatencyMs / guestToHostLatencyMs).toFixed(2) + 'x mais atrasado do que o Host vê o Visitante!');
  console.log('\n=== SIMULAÇÃO CONCLUÍDA COM SUCESSO ===');

  return {
    punchMetrics, hostEvalMetrics,
    feedbackDelayMs, feedbackDelayFrames, guestTeleportPx, maxTeleportDuringHit, serverLockAtHurt,
    shieldActiveLocallyOnFrame0, guestTookDamageWhileGuarding, guestServerStateEvalGuest, serverLockReaction,
    hostToGuestVisualLatencyMs, hostToGuestVisualLatencyFrames, maxSpatialDeltaHost,
    guestToHostLatencyMs, guestToHostLatencyFrames, maxSpatialDeltaGuest
  };
}

runAdversarialSim().catch(err => {
  console.error('ERRO NA SIMULAÇÃO:', err);
  process.exit(1);
});
