/* Creia Fight — motor, jogadores, combate, fases, HUD e som. */
(function () {
  'use strict';

  var W = 480, H = 270, TOP = 178, BOT = 262, LEN = 3000, CAM_MAX = LEN - W, GRAV = 720;
  var CAT_X = 1450;
  var cv = document.getElementById('game');
  var ctx = cv.getContext('2d');
  // resolução real: o jogo pensa em 480x270 e desenha em R vezes isso (até 4x = 1920x1080)
  var R = 4;
  function fitCanvas() {
    var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    var want = Math.max(2, Math.min(4, Math.ceil((r.width || W) * dpr / W)));
    if (want !== R || cv.width !== W * want) { R = want; cv.width = W * R; cv.height = H * R; if (window.Rig) window.Rig.setScale(R); }
  }
  fitCanvas();
  addEventListener('resize', fitCanvas);

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function sign(v) { return v < 0 ? -1 : v > 0 ? 1 : 0; }

  // ---------- Substitutos: o jogo roda mesmo sem os módulos dos outros agentes ----------
  var SIZES = { fome: { w: 40, h: 32 }, batata: { w: 28, h: 36 }, refri: { w: 22, h: 34 },
    gordura: { w: 56, h: 64 }, coxinha: { w: 20, h: 24 } };
  var ITEM_COLORS = { tomate: '#e23b2e', banana: '#f2d23c', cenoura: '#f08a24', brocolis: '#3fa34d',
    maca: '#c8202a', halter: '#6b6f7a', gordura: '#e0b040', coracao: '#ff5c8a', brilho: '#fff6a0', estrela: '#fff' };
  var FB = {
    drawChibi: function (c, who, state, t, x, y, f, o) {
      c.globalAlpha = (o && o.alpha) || 1;
      var bob = state === 'walk' ? Math.round(Math.sin(t * 16)) : 0;
      if (state === 'ko') { c.fillStyle = '#222'; c.fillRect(x - 24, y - 12, 48, 12); c.globalAlpha = 1; return; }
      c.fillStyle = o && o.flash ? '#fff' : who === 'nutri' ? '#2b5fae' : '#2a2320';
      c.fillRect(x - 10, y - 20 + bob, 20, 20);
      c.fillStyle = o && o.flash ? '#fff' : who === 'nutri' ? '#f4f4f4' : '#3b2b22';
      c.fillRect(x - 12, y - 36 + bob, 24, 18);
      c.fillStyle = o && o.flash ? '#fff' : '#d08a5a';
      c.fillRect(x - 15, y - 64 + bob, 30, 30);
      if (who === 'nutri') { c.fillStyle = '#111'; c.fillRect(x - 17, y - 66 + bob, 34, 10); c.fillRect(x - 18, y - 60 + bob, 6, 30); c.fillRect(x + 12, y - 60 + bob, 6, 30); }
      else { c.fillStyle = '#111'; c.fillRect(x - 10, y - 52 + bob, 20, 5); c.fillStyle = '#c33'; c.fillRect(x + f * 12 - 3, y - 32, 6, 6); }
      c.globalAlpha = 1;
    },
    drawEnemy: function (c, kind, state, t, x, y, f, o) {
      var s = FB.enemySize(kind);
      c.fillStyle = o && o.flash ? '#fff' : { fome: '#e8b13a', batata: '#d62b2b', refri: '#c0283a', gordura: '#9a5a22', coxinha: '#d99a45' }[kind] || '#888';
      c.fillRect(x - s.w / 2, y - s.h, s.w, s.h);
      c.fillStyle = '#111'; c.fillRect(x + f * 4 - 2, y - s.h + 6, 4, 4);
    },
    enemySize: function (k) { return SIZES[k] || { w: 30, h: 30 }; },
    drawItem: function (c, k, x, y, r, s) {
      var z = Math.max(2, Math.round(8 * (s || 1)));
      c.fillStyle = ITEM_COLORS[k] || '#ccc'; c.fillRect(Math.round(x - z / 2), Math.round(y - z / 2), z, z);
    },
    drawPuddle: function (c, x, y, w) { c.fillStyle = 'rgba(214,170,40,.55)'; c.fillRect(Math.round(x - w / 2), Math.round(y - 2), Math.round(w), 4); },
    drawCat: function (c, state, t, x, y) { c.fillStyle = '#c98a3e'; c.fillRect(x - 10, y - 14, 20, 14); c.fillRect(x + 4, y - 20, 9, 8); },
    drawPortrait: function (c, who, x, y) {
      c.fillStyle = '#d08a5a'; c.fillRect(x + 4, y + 4, 20, 20);
      c.fillStyle = '#111'; if (who === 'nutri') c.fillRect(x + 2, y + 2, 24, 7); else c.fillRect(x + 7, y + 11, 14, 3);
    }
  };
  var FB_BG = {
    draw: function (c, stage, camX) {
      var night = stage >= 9;
      c.fillStyle = night ? '#1a1d3a' : stage === 8 ? '#e98a5a' : '#7cc6f0'; c.fillRect(0, 0, W, 170);
      for (var i = -1; i < 8; i++) {
        var bx = Math.round(i * 80 - (camX * 0.5) % 80);
        c.fillStyle = ['#c9a36b', '#e0c98f', '#b5794f'][(i + 10 + Math.floor(camX * 0.5 / 80)) % 3];
        c.fillRect(bx, 90 + (i % 2) * 20, 70, 80);
      }
      c.fillStyle = '#9b9488'; c.fillRect(0, 170, W, 22);
      c.fillStyle = '#4a4a52'; c.fillRect(0, 192, W, 78);
      c.fillStyle = '#e8e2c0';
      for (var k = -1; k < 8; k++) c.fillRect(Math.round(k * 70 - camX % 70), 230, 30, 3);
    },
    drawFront: function () {}
  };
  var impacts=[],hitPause=0,lastHitPause=-10;
  function impactAt(x,y,z,kind,strong,stop){
    impacts.push({x:x,y:y,z:z,kind:kind,strong:!!strong,born:time});if(impacts.length>12)impacts.shift();
    if(strong&&stop&&!online&&time-lastHitPause>.12){hitPause=.035;lastHitPause=time;}
    if(strong&&kind==='hit')sfx('heavy');
  }
  var warned = {};
  function call(mod, fb, name, args) {
    var m = window[mod];
    if (m && typeof m[name] === 'function') {
      try { return m[name].apply(m, args); } catch (e) {
        if (!warned[mod + name]) { warned[mod + name] = 1; console.warn(mod + '.' + name + ' falhou, usando substituto', e); }
      }
    }
    return fb[name].apply(fb, args);
  }
  function spr(name) {
    // os chibis do casal vêm do esqueleto animado (js/rig.js) quando as imagens carregaram
    if (name === 'drawChibi' && window.Rig && window.Rig.draw(arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8])) return;
    if (name === 'drawPortrait' && window.Rig && window.Rig.portrait(arguments[1], arguments[2], arguments[3], arguments[4])) return;
    if (name === 'drawEnemy' && window.Viloes && (function (a) { try { return window.Viloes.drawEnemy(a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]); } catch (e) { return false; } })(arguments)) return;
    if (name === 'drawEnemy' && window.Rig && window.Rig.enemy(arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8])) return;
    if (name === 'drawCat' && window.Rig && window.Rig.cat && window.Rig.cat(arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6])) return;
    if (name === 'drawItem' && window.Rig && window.Rig.item(arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6])) return;
    return call('Sprites', FB, name, Array.prototype.slice.call(arguments, 1));
  }
  function stageReady(s) { return !(window.ArtBG && window.ArtBG.covers(s)) || window.ArtBG.has(s); }
  function bg(name) {
    var st = arguments[2];
    if (window.ArtBG && window.ArtBG.has(st)) { if (name === 'draw') { try { return window.ArtBG.draw(arguments[1], st, arguments[3], arguments[4]); } catch (e) {} } else return; }
    if (window.ArtBG && window.ArtBG.covers(st)) {   // cenário novo ainda baixando: tela escura, nunca o cenário antigo
      if (name === 'draw') {
        var c0 = arguments[1]; c0.fillStyle = '#0b0a10'; c0.fillRect(0, 0, W, H); c0.fillStyle = '#1a1824'; c0.fillRect(0, 182, W, H - 182);
        if (Math.floor(time * 2) % 2) txt('CARREGANDO CENARIO...', W / 2, 120, '#8f8c9e', 'center');
      }
      return;
    }
    var args = Array.prototype.slice.call(arguments, 1);
    if (window.ArtBG && window.ArtBG.remap) args[1] = window.ArtBG.remap(st);
    return call('Backgrounds', FB_BG, name, args);
  }
  function enemySize(k) {
    var v = window.Viloes && window.Viloes.enemySize && window.Viloes.enemySize(k);
    if (v && v.w > 0 && v.h > 0) return v;
    var s = spr('enemySize', k);
    return s && s.w > 0 && s.h > 0 ? s : FB.enemySize(k);
  }

  // ---------- Armazenamento local (só conveniência) ----------
  function load() { try { return JSON.parse(localStorage.getItem('bangu-save')) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem('bangu-save', JSON.stringify(saved)); } catch (e) { /* sem storage: segue */ } }
  var saved = load();
  saved.best = clamp(saved.best | 0, 1, 10);
  saved.hi = saved.hi | 0;
  if(window.CreiaPreferences){saved.music=true;saved.sfx=true;}

  // ---------- Som (WebAudio sintetizado) ----------
  var AC = null, master = null, noiseBuf = null, muted = false, inMusic = false, inVoice=false, musicBus=null,effectsBus=null,voicesBus=null;
  function channelVolume(k){return window.CreiaPreferences?CreiaPreferences.audio(k):(k==='music'?.2:1);}
  function soundBus(){return inMusic?musicBus:inVoice?voicesBus:effectsBus;}
  function audioLevels(){if(musicBus)musicBus.gain.value=channelVolume('music')/.2;if(effectsBus)effectsBus.gain.value=channelVolume('effects');if(voicesBus)voicesBus.gain.value=channelVolume('voices');if(x1ThemeGain)x1ThemeGain.gain.value=channelVolume('music');if(menuThemeGain)menuThemeGain.gain.value=channelVolume('music')*.75;}
  function soundOff() { return muted || (inMusic ? saved.music === false : saved.sfx === false); }   // M desliga tudo; configurações separam música e efeitos
  function audio() {
    if (AC) return AC;
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 0.3; master.connect(AC.destination);
      musicBus=AC.createGain();effectsBus=AC.createGain();voicesBus=AC.createGain();[musicBus,effectsBus,voicesBus].forEach(function(bus){bus.connect(master);});audioLevels();
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { AC = null; }
    return AC;
  }
  function tone(freq, dur, type, vol, slide, delay) {
    if (!AC || soundOff()) return;
    var t = AC.currentTime + (delay || 0);
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(soundBus()||master); o.start(t); o.stop(t + dur + 0.02);
  }
  var distCurve = null;
  function gtr(freq, dur, vol, delay, bend) {   // guitarra distorcida: dois dentes-de-serra desafinados num waveshaper
    if (!AC || soundOff()) return;
    if (!distCurve) { distCurve = new Float32Array(1024); for (var i = 0; i < 1024; i++) { var x = i / 512 - 1; distCurve[i] = Math.tanh(x * 6); } }
    var t = AC.currentTime + (delay || 0), ws = AC.createWaveShaper(), f = AC.createBiquadFilter(), g = AC.createGain();
    ws.curve = distCurve; f.type = 'lowpass'; f.frequency.value = 2600;
    [0, 7].forEach(function (cents) {
      var o = AC.createOscillator(); o.type = 'sawtooth'; o.detune.value = cents;
      o.frequency.setValueAtTime(freq, t); if (bend) o.frequency.linearRampToValueAtTime(freq * bend, t + dur * 0.5);
      o.connect(ws); o.start(t); o.stop(t + dur + 0.05);
    });
    g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    ws.connect(f); f.connect(g); g.connect(soundBus()||master);
  }
  function noise(dur, vol, freq, delay, type) {
    if (!AC || soundOff()) return;
    var t = AC.currentTime + (delay || 0);
    var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = noiseBuf; f.type = type || 'lowpass'; f.frequency.value = freq || 1200;
    g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(soundBus()||master); s.start(t); s.stop(t + dur + 0.02);
  }
  var SFX = {
    heavy:function(){noise(.1,.28,850);tone(82,.11,'triangle',.2,-45);},
    miss:function(){noise(.045,.06,3400,0,'highpass');},
    hit: function () { noise(0.07, 0.35, 2200); tone(150, 0.08, 'square', 0.12, -90); },
    whoosh: function () { noise(0.1, 0.12, 3000, 0, 'highpass'); },
    bass: function () { gtr(82, 0.3, 0.16, 0, 0.86); tone(82, 0.24, 'sine', 0.12, -28); },
    throw: function () { tone(600, 0.06, 'triangle', 0.08, 300); },
    jump: function () { tone(220, 0.14, 'square', 0.08, 300); },
    hurt: function () { tone(300, 0.18, 'sawtooth', 0.14, -200); },
    ko: function () { tone(400, 0.5, 'square', 0.15, -340); },
    kill: function () { noise(0.15, 0.3, 900); tone(90, 0.2, 'square', 0.15, -40); },
    block: function () { tone(900, 0.05, 'square', 0.1); tone(1200, 0.05, 'square', 0.08, 0, 0.04); },
    guard_up: function () { tone(600, 0.08, 'triangle', 0.1); tone(900, 0.06, 'triangle', 0.07, 0, 0.03); },
    guard_hit: function () { tone(1100, 0.06, 'square', 0.12); tone(700, 0.08, 'square', 0.06, 0, 0.03); noise(0.08, 0.08, 2000, 0, 'highpass'); },
    perfeita: function () { tone(1760,.09,'triangle',.12);tone(2640,.13,'sine',.08,0,.025);noise(.035,.045,5000,0,'highpass'); },
    break: function () { noise(0.25, 0.35, 1500); tone(200, 0.25, 'sawtooth', 0.12, -150); },
    special: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.12, 'square', 0.1, 0, i * 0.07); }); },
    page: function () { noise(0.18, 0.12, 2500, 0, 'highpass'); noise(0.14, 0.1, 2000, 0.25, 'highpass'); tone(880, 0.3, 'triangle', 0.08, 0, 0.5); },
    furacao: function () { noise(0.7, 0.14, 700, 0, 'bandpass'); tone(200, 0.7, 'sawtooth', 0.04, 400); },
    flash: function () { noise(0.06, 0.25, 4000, 0, 'highpass'); tone(2400, 0.05, 'square', 0.06); noise(0.4, 0.08, 1200, 0.05, 'bandpass'); },
    bumbo: function () { tone(70, 0.12, 'sine', 0.25, -30); noise(0.08, 0.12, 2500, 0.02, 'highpass'); },
    dash: function () { noise(0.18, 0.1, 1500, 0, 'bandpass'); tone(500, 0.15, 'sawtooth', 0.04, 600); },
    ora: function () { [523, 659, 784].forEach(function (f, i) { tone(f, 0.7, 'triangle', 0.05, 0, i * 0.08); }); tone(1047, 0.5, 'sine', 0.04, 0, 0.3); },
    fogo: function () { noise(0.35, 0.1, 500, 0, 'lowpass'); tone(300, 0.3, 'sawtooth', 0.03, -200); },
    boom: function () { noise(0.3, 0.22, 400, 0, 'lowpass'); tone(80, 0.25, 'square', 0.12, -40); },
    criancas: function () {   // gritaria de criança: vozinhas agudas subindo
      for (var i = 0; i < 6; i++) tone(700 + i * 90, 0.35, 'square', 0.03, 300 + i * 40, i * 0.05);
      noise(0.5, 0.06, 2500, 0, 'bandpass');
    },
    grito: function () {   // grito distorcido descendo + eco
      tone(880, 0.9, 'sawtooth', 0.09, -420); tone(660, 0.9, 'square', 0.05, -300, 0.02); noise(0.8, 0.12, 1800, 0, 'bandpass');
      tone(990, 0.5, 'sawtooth', 0.04, -400, 0.5);
    },
    danca: function () {   // batida de dança: bumbo, caixa e um baixo pulando
      for (var i = 0; i < 16; i++) {
        var d = i * 0.14;
        if (i % 2 === 0) tone(70, 0.12, 'sine', 0.22, -30, d);
        if (i % 4 === 2) noise(0.1, 0.18, 1800, d, 'highpass');
        tone([110, 110, 165, 147][Math.floor(i / 4)] * (i % 2 ? 2 : 1), 0.1, 'square', 0.05, 0, d);
      }
    },
    teclado: function () {   // acordes de teclado em arpejo (Dó, Lá menor, Fá, Sol) e um brilho no fim
      [[523, 659, 784], [440, 523, 659], [349, 440, 523], [392, 494, 587]].forEach(function (ch, i) {
        ch.forEach(function (f, j) { tone(f, 0.32, 'triangle', 0.06, 0, i * 0.34 + j * 0.06); tone(f * 2, 0.2, 'sine', 0.025, 0, i * 0.34 + j * 0.06 + 0.17); });
      });
      [1047, 1319, 1568, 2093].forEach(function (f, i) { tone(f, 0.25, 'sine', 0.05, 0, 1.4 + i * 0.07); });
    },
    solo: function () {   // corrida na pentatônica de mi, bend e power chord
      var sc = [330, 392, 440, 494, 587, 659, 784, 880], run = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 5, 6, 7, 6, 7];
      run.forEach(function (n, i) { gtr(sc[n], 0.09, 0.05, i * 0.065); });
      gtr(659, 0.35, 0.06, run.length * 0.065, 1.12);
      [82, 123, 165].forEach(function (f) { gtr(f, 0.8, 0.05, run.length * 0.065 + 0.32); });
    },
    cutin: function () { tone(180, 0.35, 'sawtooth', 0.07, 1400); tone(2093, 0.5, 'triangle', 0.08, 0, 0.18); },
    kiss: function () { tone(1400, 0.08, 'sine', 0.2, 600); tone(880, 0.25, 'triangle', 0.12, 0, 0.1); tone(1175, 0.35, 'triangle', 0.12, 0, 0.22); },
    shield: function () { tone(220, 0.6, 'sawtooth', 0.1, 440); tone(330, 0.6, 'triangle', 0.1, 330, 0.05); },
    shield_hit: function () { tone(1600, 0.06, 'triangle', 0.08); },
    purr: function () { for (var i = 0; i < 6; i++) noise(0.12, 0.12, 260, i * 0.16, 'lowpass'); tone(660, 0.2, 'triangle', 0.1, 0, 1); },
    culto: function () { [262,330,392].forEach(function(f){tone(f,1.6,'triangle',0.07);tone(f*2,1.2,'sine',0.025);});tone(1047,1.5,'sine',0.12,0,0.12);tone(2094,0.8,'sine',0.035,0,0.12); },
    culto_tick: function () { tone(784,0.1,'sine',0.12); },
    go: function () { tone(784, 0.1, 'square', 0.1); tone(1047, 0.18, 'square', 0.1, 0, 0.1); },
    win: function () { [523, 659, 784, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.16, 'square', 0.12, 0, i * 0.13); }); },
    boss_hit: function () { noise(0.08, 0.3, 1200); tone(110, 0.1, 'square', 0.12, -40); },
    boss_roar: function () { tone(90, 0.9, 'sawtooth', 0.2, -40); noise(0.9, 0.2, 400); },
    explode: function () { noise(0.5, 0.45, 700); tone(70, 0.4, 'square', 0.15, -40); },
    splash: function () { noise(0.3, 0.25, 1800, 0, 'bandpass'); },
    menu: function () { tone(660, 0.05, 'square', 0.08); },
    select: function () { tone(523, 0.08, 'square', 0.1); tone(784, 0.12, 'square', 0.1, 0, 0.08); },
    splat: function () { noise(0.06, 0.12, 900); },
    gameover: function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.3, 'triangle', 0.15, 0, i * 0.25); }); }
  };
  var sfxLast = {};
  function sfx(n) {
    if (online && online.host && scene === 'play' && (online.coop || /^(hit|heavy|miss|block|guard_hit|perfeita|whoosh|break|hurt|ko|special|cutin|boom|explode|flash|win|bass|culto|culto_tick|go)$/.test(n))) {
      online.soundId++;
      online.sounds.push([online.soundId,n]);
      if (online.sounds.length > 12) online.sounds.shift();
    }
    if (!AC || soundOff()) return;
    var now = AC.currentTime;
    if (sfxLast[n] && now - sfxLast[n] < 0.04) return; // não empilhar 30 sons iguais no mesmo quadro
    sfxLast[n] = now;
    inVoice=/^(grito|criancas)$/.test(n);
    try { (SFX[n] || SFX.hit)(); } catch (e) { /* som é enfeite */ } finally {inVoice=false;}
  }

  // Música: sequenciador de 16 passos (samba-chiptune na rua, menor e rápido no chefe)
  var SONGS = {
    rua: { bpm: 126, bass: [36, 0, 36, 43, 0, 36, 0, 43, 41, 0, 41, 48, 0, 43, 0, 38],
      lead: [72, 0, 76, 0, 79, 0, 76, 74, 72, 0, 0, 67, 69, 0, 72, 0, 74, 0, 77, 0, 81, 0, 79, 77, 76, 0, 74, 0, 72, 0, 0, 0] },
    boss: { bpm: 150, bass: [45, 45, 0, 45, 48, 0, 45, 52, 45, 45, 0, 45, 43, 0, 41, 40],
      lead: [69, 0, 72, 0, 76, 0, 75, 0, 76, 0, 72, 0, 69, 0, 68, 0, 69, 0, 72, 0, 77, 0, 76, 0, 74, 0, 72, 0, 71, 0, 68, 0] }
  };
  // Inserido dentro do motor da prévia para respeitar os controles de som.
  var x1Theme=null, x1ThemeSource=null, x1ThemeGain=null;
  var x1ThemePending=false, x1ThemeRetry=0, x1ThemeFailed=false;
  function pauseX1Theme(reset) {
    if(!x1Theme)return;
    x1Theme.pause();
    if(reset){x1Theme.playbackRate=1;x1Theme.preservesPitch=true;}
    if(reset && x1Theme.currentTime) x1Theme.currentTime=0;
  }
  function x1ThemeTick() {
    var inMatch=versus && (scene==='play' || scene==='onlinePlay');
    if(!inMatch) { pauseX1Theme(true); return false; }
    if(typeof Audio==='undefined' || x1ThemeFailed)return false;
    var enabled=!muted && saved.music!==false && !paused && !showCtl && !showCfg && !onlineHeld() && !document.hidden;
    if(!enabled || !AC || AC.state!=='running') { pauseX1Theme(false); return true; }
    if(!x1Theme) {
      try {
        x1Theme=new Audio('assets/audio/x1-tema.m4a');
        x1Theme.loop=true;x1Theme.preload='metadata';
        // Safari no iPhone ignora volume no elemento: o GainNode aplica os 20%.
        x1ThemeSource=AC.createMediaElementSource(x1Theme);
        x1ThemeGain=AC.createGain();x1ThemeGain.gain.value=channelVolume('music');
        x1ThemeSource.connect(x1ThemeGain);x1ThemeGain.connect(AC.destination);
        x1Theme.addEventListener('error',function () {x1ThemeFailed=true;pauseX1Theme(false);});
      } catch (_) { x1ThemeFailed=true;pauseX1Theme(false);return false; }
    }
    x1Theme.preservesPitch=true;x1Theme.playbackRate=viradaMusicRate();
    if(x1Theme.paused && !x1ThemePending && performance.now()>=x1ThemeRetry) {
      x1ThemePending=true;
      Promise.resolve(x1Theme.play()).then(function () {
        x1ThemePending=false;
        if(!versus || (scene!=='play' && scene!=='onlinePlay') || muted || saved.music===false || paused || document.hidden)
          pauseX1Theme(false);
      }).catch(function () {x1ThemePending=false;x1ThemeRetry=performance.now()+1000;});
    }
    return true;
  }
  if(document.addEventListener)document.addEventListener('visibilitychange',function () {if(document.hidden)pauseX1Theme(false);});
  addEventListener('pagehide',function () {pauseX1Theme(false);});

  // Tema dos menus, conectado diretamente ao volume de 15%.
  var menuTheme=null,menuThemeGain=null,menuThemeSource=null;
  var menuThemePending=false,menuThemeFailed=false,menuThemeRetry=0,menuThemeButton=null;
  function menuThemeScene() {
    return ['menu','config','controls','ranking','select','x1menu','onlineSelect','onlineWait','adventuremenu','coopSetup'].indexOf(scene)>=0;
  }
  function menuThemeEnabled() {return menuThemeScene() && !muted && saved.music!==false && !document.hidden;}
  function menuThemePrompt(show) {
    if(!show && !menuThemeButton)return;
    if(!menuThemeButton) {
      menuThemeButton=document.createElement('button');menuThemeButton.type='button';
      menuThemeButton.textContent='Toque para ouvir a música';
      menuThemeButton.style.cssText='position:fixed;bottom:calc(12px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);z-index:10;padding:10px 16px;border:1px solid #ffe066;border-radius:8px;background:#251c30;color:#ffe066;font:14px sans-serif;cursor:pointer';
      menuThemeButton.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();unlockMenuTheme();});
      document.body.appendChild(menuThemeButton);
    }
    menuThemeButton.style.display=show?'block':'none';
  }
  function pauseMenuTheme(reset) {
    if(!menuTheme)return;
    menuTheme.pause();
    if(reset && menuTheme.currentTime)menuTheme.currentTime=0;
  }
  function blockMenuTheme() {
    menuThemePending=false;menuThemeRetry=Infinity;
    menuThemePrompt(menuThemeEnabled() && !menuThemeFailed);
  }
  function menuThemeTick() {
    if(!menuThemeScene()){pauseMenuTheme(true);menuThemePrompt(false);return false;}
    if(typeof Audio==='undefined' || menuThemeFailed)return false;
    if(!menuThemeEnabled()){pauseMenuTheme(false);menuThemePrompt(false);return true;}
    if(!AC)audio();
    if(!AC)return false;
    if(AC.state!=='running'){pauseMenuTheme(false);menuThemePrompt(true);return true;}
    if(!menuTheme) {
      try {
        menuTheme=new Audio('assets/audio/tela-principal.m4a');
        menuTheme.loop=true;menuTheme.preload='metadata';
        menuThemeSource=AC.createMediaElementSource(menuTheme);
        menuThemeGain=AC.createGain();menuThemeGain.gain.value=channelVolume('music')*.75;
        menuThemeSource.connect(menuThemeGain);menuThemeGain.connect(AC.destination);
        menuTheme.addEventListener('error',function(){menuThemeFailed=true;pauseMenuTheme(false);menuThemePrompt(false);});
      } catch(_){menuThemeFailed=true;pauseMenuTheme(false);menuThemePrompt(false);return false;}
    }
    if(!menuTheme.paused){menuThemePrompt(false);return true;}
    if(menuThemeRetry===Infinity){menuThemePrompt(true);return true;}
    if(!menuThemePending && performance.now()>=menuThemeRetry) {
      menuThemePending=true;
      try {
        Promise.resolve(menuTheme.play()).then(function(){
          menuThemePending=false;
          if(!menuThemeEnabled() || !AC || AC.state!=='running')pauseMenuTheme(false);
          menuThemePrompt(false);
        }).catch(blockMenuTheme);
      } catch(_){blockMenuTheme();}
    }
    return true;
  }
  function unlockMenuTheme() {
    if(!menuThemeEnabled() || menuThemeFailed || typeof Audio==='undefined')return;
    menuThemeRetry=0;
    if(!AC)audio();
    if(AC && AC.state==='suspended') {
      Promise.resolve(AC.resume()).then(menuThemeTick).catch(blockMenuTheme);
    } else menuThemeTick();
  }
  addEventListener('pointerdown',unlockMenuTheme);
  addEventListener('keydown',unlockMenuTheme);
  addEventListener('pagehide',function(){pauseMenuTheme(false);menuThemePrompt(false);});
  if(document.addEventListener)document.addEventListener('visibilitychange',function(){
    if(document.hidden){pauseMenuTheme(false);menuThemePrompt(false);}
  });

  var mus = { song: null, step: 0, next: 0 };
  function playSong(n) { if (mus.song === n) return; mus.song = n; mus.step = 0; mus.next = AC ? AC.currentTime + 0.05 : 0; }
  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function viradaMusicRate(){
    if(scene!=='play'&&scene!=='onlinePlay')return 1;
    var list=online&&!online.host?online.snapshots.length?online.snapshots[online.snapshots.length-1].state.players:[]:players;
    return list.some(function(p){return !p.ai&&!p.dead&&p.hp>0&&p.virada;})?window.CreiaCombat.virada.musica:1;
  }
  function musicTick() {
    if(menuThemeTick()) { pauseX1Theme(true); return; }
    if (x1ThemeTick()) return;
    // A aventura usa somente ambiente e efeitos, inclusive nos chefes e no final.
    if(!versus&&['play','gameover','ending'].indexOf(scene)>=0){mus.next=AC?AC.currentTime+.1:0;return;}
    if (!AC || muted || saved.music === false || !mus.song || AC.state !== 'running') return;
    inMusic = true;
    var s = SONGS[mus.song], spb = 60 / (s.bpm*viradaMusicRate()) / 4;
    if (mus.next < AC.currentTime - 0.5) mus.next = AC.currentTime + 0.02;
    while (mus.next < AC.currentTime + 0.12) {
      var d = mus.next - AC.currentTime, i = mus.step;
      var b = s.bass[i % s.bass.length], l = s.lead[i % s.lead.length];
      if (b) tone(midi(b), spb * 1.6, 'triangle', 0.16, 0, d);
      if (l) tone(midi(l), spb * 0.9, 'square', 0.035, 0, d);
      if (i % 2 === 0) noise(0.03, i % 4 === 0 ? 0.05 : 0.025, 6000, d, 'highpass');
      mus.step++; mus.next += spb;
    }
    inMusic = false;
  }

  var ambience={stage:0,next:0,nodes:[]};
  var AMBIENTS=[
    {name:'Praça',freq:650,volume:.025,gap:8,bird:2400},
    {name:'Calçadão',freq:1100,volume:.02,gap:7},
    {name:'Largo',freq:230,volume:.03,gap:9},
    {name:'Fábrica',freq:140,volume:.035,gap:7},
    {name:'Estádio',freq:850,volume:.03,gap:8,crowd:true},
    {name:'Feira',freq:1250,volume:.02,gap:6,crowd:true},
    {name:'Trem',freq:100,volume:.04,gap:10,metal:true},
    {name:'Rua Bela Flor',freq:450,volume:.025,gap:9,bird:2100},
    {name:'Serra',freq:1000,volume:.025,gap:8,bird:2800},
    {name:'Noite',freq:300,volume:.02,gap:11,bird:3900}
  ];
  function stopAmbience(){ambience.nodes.forEach(function(n){try{n.source.stop();}catch(_){}});ambience.nodes=[];ambience.stage=0;}
  function ambientCue(profile){
    function cue(freq,dur,volume,delay,toneOnly){
      var at=AC.currentTime+(delay||0),source=toneOnly?AC.createOscillator():AC.createBufferSource(),filter=AC.createBiquadFilter(),gain=AC.createGain();
      if(toneOnly){source.type='sine';source.frequency.setValueAtTime(freq,at);source.frequency.exponentialRampToValueAtTime(freq*.8,at+dur);}
      else {source.buffer=noiseBuf;source.loop=true;}
      filter.type=toneOnly?'lowpass':'bandpass';filter.frequency.value=toneOnly?6000:freq;filter.Q.value=.65;
      gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+Math.min(.15,dur/3));gain.gain.exponentialRampToValueAtTime(.0001,at+dur);
      source.connect(filter);filter.connect(gain);gain.connect(effectsBus);source.start(at);source.stop(at+dur+.02);ambience.nodes.push({source:source,end:at+dur+.02});
    }
    cue(profile.freq,profile.metal?1.8:1.2,profile.volume,0,false);
    if(profile.bird){cue(profile.bird,.16,.015,.4,true);cue(profile.bird*1.16,.12,.012,.68,true);}
    if(profile.crowd)cue(profile.freq*.72,.65,profile.volume*.65,.7,false);
    if(profile.metal)cue(1700,.3,.013,1.2,false);
  }
  function ambienceTick(){
    var active=(scene==='play'||scene==='onlinePlay')&&!paused&&!showCtl&&!showCfg&&!cine&&!document.hidden&&!onlineHeld()&&!muted&&channelVolume('effects')>0;
    if(!active||!AC||AC.state!=='running'){stopAmbience();return;}
    var s=scene==='onlinePlay'&&online&&online.snapshots.length?online.snapshots[online.snapshots.length-1].state.stage:stage;
    var profile=AMBIENTS[clamp((s||1)-1,0,AMBIENTS.length-1)];
    if(ambience.stage!==s){stopAmbience();ambience.stage=s;ambience.next=AC.currentTime+1.5;}
    ambience.nodes=ambience.nodes.filter(function(n){return n.end>AC.currentTime;});
    if(AC.currentTime>=ambience.next){ambientCue(profile);ambience.next=AC.currentTime+profile.gap;}
  }

  // ---------- Entrada ----------
  var keys = new Set(), pressed = new Set(), physicalPressed=new Set(),touchHeld=new Set(),touchPressed=new Set();
  var BINDS = [
    { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], atk: ['KeyJ'], jump: ['KeyK'],
      spc: ['KeyL'], alt: ['KeyI', 'KeyU'], use: ['KeyE'], taunt: ['KeyO'] },
    { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'],
      atk: ['Numpad1', 'Comma'], jump: ['Numpad2', 'Period'], spc: ['Numpad3', 'Slash'],
      alt: ['Numpad4', 'Semicolon'], use: ['Numpad0', 'Quote'], taunt: ['Numpad5', 'BracketLeft'] }
  ];
  var GAME_KEYS = new Set(['Space', 'Enter', 'Escape', 'KeyM', 'KeyP']);
  var bindingVersion=-1,keyboardBinds=BINDS;
  function activeBinds(){var prefs=window.CreiaPreferences;if(prefs&&prefs.bindings&&bindingVersion!==prefs.version){keyboardBinds=prefs.bindings();bindingVersion=prefs.version;}return keyboardBinds;}
  BINDS.forEach(function (b) { Object.keys(b).forEach(function (k) { b[k].forEach(function (c) { GAME_KEYS.add(c); }); }); });
  addEventListener('keydown', function (e) {
    if (GAME_KEYS.has(e.code)||activeBinds().some(function(player){return Object.keys(player).some(function(k){return player[k].indexOf(e.code)>=0;});})) e.preventDefault();
    if (!keys.has(e.code)) {pressed.add(e.code);physicalPressed.add(e.code);}
    keys.add(e.code);
    audio();
    if (AC && AC.state === 'suspended') AC.resume();
  });
  addEventListener('keyup', function (e) { keys.delete(e.code); });
  addEventListener('blur', function () { keys.clear();physicalPressed.clear();touchHeld.clear();touchPressed.clear(); if (scene === 'play') paused = true; });
  function zoaOn() { return !!(window.CreiaCombat && CreiaCombat.provocacao && CreiaCombat.provocacao.ativa); }   // provocação guardada (desligada)
  function anyKey(list) { for (var i = 0; i < list.length; i++) if (keys.has(list[i])) return true; return false; }
  function anyPressed(list) { for (var i = 0; i < list.length; i++) if (pressed.has(list[i])) return true; return false; }
  // Layout padrão do navegador: Xbox e DualSense usam as mesmas posições dos botões.
  var PADMAP = { start: [9], taunt: [8], atk: [0], jump: [1], alt: [2], spc: [3], use: [5, 4], ok: [0, 9], back: [1, 8], up: [12], down: [13], left: [14], right: [15] };
  var pads = [0,1,2,3].map(function(i){return {slot:i,held:{},hit:{}};});
  function pollPads() {
    var gps = [];
    try { gps = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { gps = []; }
    var list = Array.prototype.filter.call(gps || [], function (g) { return g && g.connected; });
    // Conserva a associação com o jogador quando outro controle desconecta.
    var assigned = pads.map(function(pd) { return list.find(function(g) { return g.index===pd.index && g.id===pd.id; }); });
    list.forEach(function(g) {
      if(assigned.indexOf(g)>=0)return;
      var free=assigned.findIndex(function(gp){return !gp;});
      if(free>=0){assigned[free]=g;pads[free].held={};}
    });
    pads.forEach(function (pd, i) {
      var gp = assigned[i], now = {};
      if (gp) {
        Object.keys(PADMAP).forEach(function (k) { now[k] = PADMAP[k].some(function (b) { return gp.buttons[b] && (gp.buttons[b].pressed || gp.buttons[b].value>0.5); }); });
        now.any=Array.prototype.some.call(gp.buttons,function(b){return b&&(b.pressed||b.value>0.5);});
        var ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
        if (ax < -0.45) now.left = true; if (ax > 0.45) now.right = true; if (ay < -0.45) now.up = true; if (ay > 0.45) now.down = true;
      }
      pd.hit = {}; Object.keys(now).forEach(function (k) { if (now[k] && !pd.held[k]) pd.hit[k] = true; });
      pd.held = now; pd.on = !!gp;
      if(gp){pd.index=gp.index;pd.id=gp.id;pd.name=/dualsense|054c|playstation|wireless controller/i.test(gp.id)&&!/xbox|xinput/i.test(gp.id)?'PS5 / PlayStation':/xbox|xinput|045e/i.test(gp.id)?'Xbox':'Controle';}
    });
  }
  // Cada controle corresponde a P1..P4; os teclados continuam disponíveis para P1/P2.
  function padHit(slot,n){return pads.some(function(pd){return pd.slot===slot&&pd.hit[n];});}
  function slotHeld(slot, n) { return pads.some(function(pd){return pd.slot===slot&&pd.held[n];}) || (slot<2 && (anyKey(activeBinds()[slot][n] || []) || (slot===0&&(BINDS[0][n]||[]).some(function(k){return touchHeld.has(k);})))); }
  function slotHit(slot, n) {
    if(padHit(slot,n))return true;
    if(slot>=2)return false;
    if(scene==='select')return anyPressed(BINDS[slot][n]||[]);
    return (activeBinds()[slot][n]||[]).some(function(k){return physicalPressed.has(k);}) || (slot===0&&(BINDS[0][n]||[]).some(function(k){return touchPressed.has(k);}));
  }
  function slotsFor(p) { return humans() > 1 ? [p.ctl] : [0, 1, 2, 3]; }
  function humans() { return players.filter(function (q) { return !q.ai; }).length; }
  var joy = { on: false, x: 0, y: 0 };   // analógico do celular (valores de -1 a 1)
  function humanControl(p) {
    var sets = slotsFor(p);
    function held(n) { return sets.some(function (s) { return slotHeld(s, n); }); }
    function hit(n) { return sets.some(function (s) { return slotHit(s, n); }); }
    var an = joy.on && sets.indexOf(0) >= 0;
    return {
      x: an ? joy.x : (held('right') ? 1 : 0) - (held('left') ? 1 : 0),
      y: an ? joy.y : (held('down') ? 1 : 0) - (held('up') ? 1 : 0),
      atk: hit('atk') || (!versus && p.who !== 'lutador' && held('atk')),
      jump: hit('jump'), spc: hit('spc'), alt: hit('alt'), use: hit('use') || held('use'), taunt: hit('taunt'), face: 0
    };
  }
  function menuKey(kind) {
    var map = { up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'],
      right: ['KeyD', 'ArrowRight'], ok: ['Enter', 'Space', 'KeyJ', 'Numpad1'], back: ['Escape'] };
    return anyPressed(map[kind]) || pads.some(function (pd) { return pd.hit[kind]; });
  }

  // ---------- Toque (celular): direcional + botões que viram as teclas do P1 ----------
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    var css = document.createElement('style');
    css.textContent = '.tc{position:fixed;z-index:5;touch-action:none;user-select:none;-webkit-user-select:none;' +
      'font:10px "Press Start 2P",monospace;color:#fff;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.35);border-radius:50%}' +
      '.tc.on{background:rgba(255,224,102,.45)}' +
      '.creia-touch-off .tc,.creia-touch-off #creia-direction-zone{display:none!important}';   // telas de toque direto no canvas (cenário, torneio)
    document.head.appendChild(css);
    // analógico flutuante: nasce onde o polegar encosta (lado esquerdo), segue o dedo, 8 direções e velocidade proporcional
    var zone = document.createElement('div');zone.id='creia-direction-zone';
    zone.style.cssText = 'position:fixed;z-index:4;left:0;bottom:0;width:45%;height:78%;touch-action:none;';
    var base = document.createElement('div'), knob = document.createElement('div');
    base.id='creia-direction-base';base.className = 'tc'; base.style.cssText = 'width:120px;height:120px;pointer-events:none;opacity:.45;transition:opacity .15s;' +
      'left:calc(24px + env(safe-area-inset-left, 0px));bottom:calc(24px + env(safe-area-inset-bottom, 0px))';
    knob.style.cssText = 'position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;' +
      'background:rgba(255,255,255,.55);border:2px solid rgba(255,255,255,.8);';
    base.appendChild(knob); document.body.appendChild(zone); document.body.appendChild(base);
    if(window.CreiaTouch){CreiaTouch.register(base,'JOY');CreiaTouch.register(zone,'JOY');}
    var JR = 50, jid = null, ox = 0, oy = 0, dirKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
    var placeJoy = function (x, y) {   // centro do analógico no ponto (x, y) da tela
      var radius=(base.getBoundingClientRect().width||124)/2; base.style.left = (x - radius) + 'px'; base.style.top = (y - radius) + 'px'; base.style.bottom = 'auto';
    };
    var setDir = function (e) {
      var dx = e.clientX - ox, dy = e.clientY - oy, d = Math.hypot(dx, dy);
      if (d > JR) { dx *= JR / d; dy *= JR / d; d = JR; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      var m = d / JR, k = m < 0.15 ? 0 : Math.min(1, (m - 0.15) / 0.7) / (m || 1);   // zona morta pequena, depois sobe rápido até 1
      joy.x = dx / JR * k; joy.y = dy / JR * k;
      var want = [joy.y < -0.45, joy.x < -0.45, joy.y > 0.45, joy.x > 0.45];   // teclas: menus e quem lê direção digital
      dirKeys.forEach(function (key, i) {
        if (want[i] && !touchHeld.has(key)) { touchHeld.add(key); pressed.add(key); }
        if (!want[i]) touchHeld.delete(key);
      });
    };
    var clearDir = function (e) {
      if (e && e.pointerId !== jid) return;
      jid = null; joy.on = false; joy.x = joy.y = 0; knob.style.transform = '';
      dirKeys.forEach(function (k) { touchHeld.delete(k); });
      base.style.opacity = '.45'; base.style.left = 'calc(24px + env(safe-area-inset-left, 0px))'; base.style.top = 'auto';
      base.style.bottom = 'calc(24px + env(safe-area-inset-bottom, 0px))';
      if(window.CreiaTouch)CreiaTouch.refresh(true);
    };
    zone.addEventListener('pointerdown', function (e) {
      if (jid !== null) return;
      e.preventDefault(); jid = e.pointerId; zone.setPointerCapture(e.pointerId); audio(); if (AC) AC.resume();
      var selecting=scene==='select'||scene==='onlineSelect';joy.menuWait=.32;JR=selecting?32:50;
      var fixedJoy=selecting||window.CreiaPreferences&&CreiaPreferences.control(innerWidth/innerHeight<.95?'portrait':'landscape','JOY');
      if(fixedJoy){var zr=zone.getBoundingClientRect();JR=Math.min(50,zr.width/2-10);ox=zr.left+zr.width/2;oy=zr.top+zr.height/2;}else{ox=e.clientX;oy=e.clientY;placeJoy(ox,oy);} base.style.opacity = '1'; joy.on = true; setDir(e);
    });
    zone.addEventListener('pointermove', function (e) { if (e.pointerId === jid) setDir(e); });
    zone.addEventListener('pointerup', clearDir);
    zone.addEventListener('pointercancel', clearDir);
    var touchBtnUse = null;
    [['ATK', 'KeyJ', 22, 70, 64], ['PULO', 'KeyK', 160, 40, 56], ['ESP', 'KeyL', 22, 150, 48],
      ['ATTACK 2', 'KeyI', 96, 22, 56], ['GATO', 'KeyE', 96, 96, 44], ['ZOA', 'KeyO', 168, 124, 44], ['II', 'KeyP', 16, null, 34]].filter(function (b) { return b[1] !== 'KeyO' || zoaOn(); }).forEach(function (b) {
      var el = document.createElement('div');
      el.className = 'tc'; el.textContent = b[0];el.setAttribute('data-creia-action',b[1]);
      if (b[1] === 'KeyI') { el.style.fontSize = '7px'; el.style.whiteSpace = 'nowrap'; }
      if (b[1] === 'KeyE') touchBtnUse = el;
      el.style.width = el.style.height = b[4] + 'px';
      el.style.right = 'calc(' + b[2] + 'px + env(safe-area-inset-right, 0px))';
      if (b[3] === null) el.style.top = 'calc(16px + env(safe-area-inset-top, 0px))';
      else el.style.bottom = 'calc(' + b[3] + 'px + env(safe-area-inset-bottom, 0px))';
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault(); audio(); if (AC) AC.resume();
        touchHeld.add(b[1]);touchPressed.add(b[1]); pressed.add(b[1]); if (b[1] === 'KeyJ') pressed.add('Enter'); el.classList.add('on');
      });
      var up = function () { touchHeld.delete(b[1]); el.classList.remove('on'); };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
      document.body.appendChild(el);if(window.CreiaTouch && b[1]!=='KeyP')CreiaTouch.register(el,b[1]);
    });
  }
  function updateTouchButtons() {
    if (typeof touchBtnUse !== 'undefined' && touchBtnUse) {
      var isVs = !!(versus || scene === 'onlinePlay' && online && !online.coop);
      var want = isVs ? 'DEF' : 'GATO';
      if (touchBtnUse.textContent !== want) {
        touchBtnUse.textContent = want;
        touchBtnUse.style.fontSize = isVs ? '11px' : '10px';
        touchBtnUse.style.width=touchBtnUse.style.height=isVs?'64px':'44px';
        touchBtnUse.style.right='calc('+(isVs?94:96)+'px + env(safe-area-inset-right, 0px))';
        touchBtnUse.style.bottom='calc('+(isVs?104:96)+'px + env(safe-area-inset-bottom, 0px))';
      }
    }
  }

  // ---------- Estado ----------
  var scene = 'menu', stage = 1, paused = false, time = 0;
  var players = [], enemies = [], bosses = [], shots = [], eshots = [], parts = [], texts = [], puddles = [];
  var cat = null, cam = 0, camLock = null, waves = [], wave = null, bossOn = false, bossIntro = null;
  var phase = 'intro', phaseT = 0, shakeT = 0, shakeF = 0, goT = 0, bannerT = 0;
  var cine = null, CINE = 1.15, notes = [];   // corte do especial (tela congelada, estilo luta de fliperama)
  var hazards = [], hazT = 4, waveT = 5, jumpHint = true, rings = [], kids = [];   // perigos rente ao chão: só pulando
  var score = 0, combo = 0, comboT = 0, menuSel = 0, menuStage = 1, overT = 0;
  var PLACES = ['PRAÇA GUILHERME DA SILVEIRA', 'LARGO DE BANGU', 'RUA BELA FLOR'];
  function place(s) {
    var bp = window.Backgrounds && window.Backgrounds.places;
    if (bp && bp[s - 1]) return String(bp[s - 1]).toUpperCase();
    return PLACES[s <= 3 ? 0 : s <= 7 ? 1 : 2];
  }
  var FOODS = ['tomate', 'banana', 'cenoura', 'brocolis', 'maca'];
  var URLQ = new URLSearchParams(location.search);
  if (URLQ.get('fase')) saved.best = Math.max(saved.best, clamp(parseInt(URLQ.get('fase'), 10) || 1, 1, 10));
  menuStage = 1;   // toda nova aventura começa na fase 1

  var ATK = {
    ricardo: {},
    adriene: { attack1: { dur: 0.28, hitAt: 0.1, dmg: 9, reach: 30, knock: 110, stun: 0.45 },   // colherada curta quando o monstro cola
      attack2: { dur: 0.4, hitAt: 0.14, dmg: 13, reach: 44, knock: 170, stun: 0.6, breaker: true } },   // colher de pau
    douglinhas: {},
    th: {},
    lutador: {
      attack1: { dur: 0.20, hitAt: 0.06, dmg: 11.2, reach: 36, knock: 16, stun: 0.3, next: 'attack2', breaker: true },
      attack2: { dur: 0.24, hitAt: 0.08, dmg: 13.6, reach: 38, knock: 22, stun: 0.35, next: 'attack3', breaker: true },
      attack3: { dur: 0.38, hitAt: 0.14, dmg: 20, reach: 44, knock: 180, stun: 0.7, launch: true, breaker: true },
      jumpkick: { dmg: 17.6, reach: 36, knock: 130, stun: 0.5, breaker: true }
    },
    nutri: { attack1: { dur: 0.28, hitAt: 0.1, dmg: 9, reach: 28, knock: 110, stun: 0.4 },
      attack2: { dur: 0.36, hitAt: 0.12, dmg: 12, reach: 34, knock: 140, stun: 0.5 } },   // xícara de café
    emanuelly: {},
    grazi: { attack1: { dur: 0.28, hitAt: 0.1, dmg: 10, reach: 28, knock: 110, stun: 0.45 } },
    duda: { attack1: { dur: 0.26, hitAt: 0.08, dmg: 9, reach: 26, knock: 110, stun: 0.4 } },
    lucas: { attack1: { dur: 0.28, hitAt: 0.1, dmg: 10, reach: 30, knock: 120, stun: 0.45 },
      fralda: { dur: 0.36, hitAt: 0.13, dmg: 14, reach: 40, knock: 420, stun: 0.8, launch: true, breaker: true } },
    arthur: { attack1: { dur: 0.26, hitAt: 0.08, dmg: 9, reach: 28, knock: 140, stun: 0.4 } },
    fidelis: { attack1: { dur: 0.26, hitAt: 0.08, dmg: 10, reach: 28, knock: 110, stun: 0.4 },
      attack2: { dur: 0.58, hitAt: 0.22, dmg: 12, reach: 68, knock: 115, stun: 0.5 } },
    douglas: { attack1: { dur: 0.26, hitAt: 0.08, dmg: 10, reach: 30, knock: 120, stun: 0.45 } },
    lohan: { attack1: { dur: 0.3, hitAt: 0.08, dmg: 11, reach: 38, knock: 120, stun: 0.45 } },
    rafinha: { attack1: { dur: 0.24, hitAt: 0.07, dmg: 9, reach: 30, knock: 100, stun: 0.4 } },
    cardoso: { attack1: { dur: 0.3, hitAt: 0.1, dmg: 11, reach: 42, knock: 100, stun: 0.45 },
      barriga: { dur: 0.43, hitAt: 0.14, dmg: 13, reach: 45, knock: 80, stun: 2, flingEdge: true, breaker: true } },
    bispo: { attack1: { dur: 0.28, hitAt: 0.1, dmg: 11, reach: 28, knock: 130, stun: 0.45 } },
    naju: { attack1: { dur: 0.28, hitAt: 0.1, dmg: 10, reach: 26, knock: 110, stun: 0.45 } },
    pedro: { attack1: { dur: 0.28, hitAt: 0.1, dmg: 9, reach: 26, knock: 110, stun: 0.4 } },
    enzo: { attack1: { dur: 0.28, hitAt: 0.1, dmg: 10, reach: 26, knock: 120, stun: 0.45 } }
  };
  ['attack1','attack2','attack3'].forEach(function (state) {
    ATK.lutador[state].dur /= 1.15; ATK.lutador[state].hitAt /= 1.15;
  });
  var EN = {
    fome: { hp: 34, spd: 38, dmg: 7, reach: 24, cd: 1.6, score: 100 },
    batata: { hp: 22, spd: 62, dmg: 5, reach: 18, cd: 1.3, score: 120 },
    refri: { hp: 20, spd: 76, dmg: 5, reach: 18, cd: 1.1, score: 120 },
    gordura: { hp: 110, spd: 28, dmg: 12, reach: 30, cd: 2.2, score: 400 },
    coxinha: { hp: 12, spd: 70, dmg: 4, reach: 16, cd: 1.0, score: 50 },
    pastel: { hp: 30, spd: 44, dmg: 7, reach: 24, cd: 1.5, score: 140 },
    brigadeiro: { hp: 14, spd: 82, dmg: 4, reach: 16, cd: 0.9, score: 90 },
    salsicha: { hp: 28, spd: 56, dmg: 6, reach: 22, cd: 1.3, score: 130 },
    pipoca: { hp: 22, spd: 64, dmg: 5, reach: 20, cd: 1.0, score: 120 },
    sorvete: { hp: 26, spd: 48, dmg: 6, reach: 20, cd: 1.4, score: 130 },
    milkshake: { hp: 36, spd: 40, dmg: 8, reach: 24, cd: 1.6, score: 160 },
    donut: { hp: 30, spd: 74, dmg: 6, reach: 22, cd: 1.3, score: 150 },
    chips: { hp: 24, spd: 60, dmg: 5, reach: 20, cd: 1.1, score: 120 },
    nugget: { hp: 10, spd: 86, dmg: 3, reach: 14, cd: 0.8, score: 60 },
    pizzinha: { hp: 32, spd: 52, dmg: 7, reach: 24, cd: 1.4, score: 160 },
    acucar: { hp: 26, spd: 66, dmg: 6, reach: 20, cd: 1.1, score: 140 },
    bala: { hp: 16, spd: 90, dmg: 4, reach: 16, cd: 0.9, score: 100 },
    churros: { hp: 34, spd: 50, dmg: 8, reach: 28, cd: 1.5, score: 170 }
  };

  // ---------- API dos chefes ----------
  var G = {
    get players() { return players; },
    get time() { return time; },
    arena: { left: 0, right: W, top: TOP, bottom: BOT },
    nearestPlayer: nearestPlayer,
    hit: function (x, y, rx, ry, z0, z1, dmg, knock, fromX) {
      var n = 0;
      rx = Math.max(1, rx || 1); ry = Math.max(1, ry || 1);
      players.forEach(function (p) {
        if (p.dead) return;
        var dx = (p.x - x) / (rx + 10), dy = (p.y - y) / (ry + 6);   // +meia largura/profundidade do corpo do personagem
        if (dx * dx + dy * dy <= 1 && p.z <= (z1 == null ? 999 : z1) && p.z + 50 >= (z0 || 0)) {
          if (damagePlayer(p, dmg || 5, knock || 0, fromX == null ? x : fromX, 'boss')) n++;
        }
      });
      return n;
    },
    shoot: function (o) {
      if (!o || !isFinite(o.x) || !isFinite(o.y)) return;
      if (limadoActive()) return;
      eshots.push({ x: o.x, y: o.y, z: o.z || 20, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0,
        grav: o.grav || 0, r: o.r || 6, dmg: o.dmg || 6, knock: o.knock || 20, life: o.life || 4,
        kind: o.kind || 'gordura', draw: typeof o.draw === 'function' ? o.draw : null, onLand: o.onLand || null, rot: 0 });
    },
    spawn: function (kind, x, y) { if (EN[kind]) spawnEnemy(kind, x, y); },
    addBoss: function (b) { if (b) bosses.push(toughen(b)); },
    puddle: function (x, y, w, life) { puddles.push({ x: x, y: clamp(y, TOP, BOT), w: w || 30, life: life || 6, max: life || 6 }); },
    shake: function (f, d) { shakeF = Math.max(shakeF, f || 2); shakeT = Math.max(shakeT, d || 0.2); },
    particles: function (kind, x, y, n) { burst(kind, x, y, 0, n || 6); },
    sound: function (n) { sfx(n); },
    text: function (x, y, msg, col) { floatText(x, y, msg, col); }
  };

  function nearestPlayer(x, y) {
    var best = null, bd = 1e9;
    players.forEach(function (p) {
      if (p.dead) return;
      var d = Math.abs(p.x - x) + Math.abs(p.y - y) * 1.5;
      if (d < bd) { bd = d; best = p; }
    });
    return best;
  }

  // ---------- Partículas e textos ----------
  function burst(kind, x, y, z, n) {
    for (var i = 0; i < n; i++) {
      var p = { kind: kind, x: x, y: y, z: z || 0, vx: rnd(-80, 80), vy: rnd(-10, 10), vz: rnd(80, 180),
        grav: 420, life: 1, max: 1, rot: rnd(0, 6), vr: rnd(-10, 10), scale: 1, bounce: true };
      if (kind === 'coracao' || kind === 'brilho') { p.vx = rnd(-40, 40); p.vz = rnd(20, 60); p.grav = -15; p.life = p.max = rnd(1, 1.6); p.vr = 0; p.rot = 0; p.bounce = false; }
      if (kind === 'estrela') { var a = rnd(0, 6.28), s = rnd(60, 160); p.vx = Math.cos(a) * s; p.vz = Math.sin(a) * s; p.grav = 0; p.life = p.max = rnd(0.2, 0.35); p.bounce = false; }
      parts.push(p);
    }
    if (parts.length > 400) parts.splice(0, parts.length - 400);
  }
  function floatText(x, y, msg, col) {
    // empilha em vez de sobrepor quando dois textos nascem no mesmo lugar
    for (var moved = true, n = 0; moved && n < 8; n++) {
      moved = false;
      for (var i = 0; i < texts.length; i++) {
        if (Math.abs(texts[i].x - x) < 90 && Math.abs(texts[i].y - y) < 10) { y = texts[i].y - 11; moved = true; }
      }
    }
    texts.push({ x: x, y: y, msg: String(msg), col: col || '#fff', life: 1.1 });
  }
  function shake(f, d) { G.shake(f, d); }

  // ---------- Pontos ----------
  function mult() { return Math.min(4, 1 + Math.floor(combo / 8) * 0.5); }
  function addScore(n) { score += Math.round(n * mult()); if (score > saved.hi) saved.hi = score; }
  function bumpCombo() { combo++; comboT = 2.2; }

  // ---------- Jogadores ----------
  function makePlayer(who, idx, ai) {
    return { who: who, idx: idx, ai: ai, x: 60, y: 210, z: 0, vx: 0, vy: 0, vz: 0, kx: 0,
      hp: 100, maxHp: 100, sp: 0, state: 'idle', st: 0, facing: 1, inv: 0, cd: 0, altCd: 0,
      virada:false,viradaAvisada:false,tauntCd:0,tauntFala:'',aiTauntWait:0,aiTauntSeed:(idx+1)*104729+who.charCodeAt(0)*65537,
      queue: false, hitDone: false, thrown: false, slow: 0, slip: 0, dead: false, koT: 0, flash: 0,
      shield: 0, hyper: 0, hyperT: 0, hyperA: 0, limadoT: 0,
      guardT: 0, guardCd: 0, guardFlash: 0, guardHp: 100, guardQuiet: 2, specialBlocked: false,
      guardStartT:-10,guardEndT:-10,guardPerfectReady:false,contraT:0,attackKnock:1,attackCdMult:1,perfectStunT:0,perfectEvent:0,
      spLocked: false, spLockedBlocked: false, spLockedBy: null,
      ctrl: null, kissTarget: null, kissed: false };
  }
  function setState(p, s, stamp) {
    var now=stamp==null?time:stamp;
    // Só uma nova guarda abre janela; manter o botão não renova o carimbo.
    if(p.state==='guard'&&s!=='guard'){p.guardEndT=now;p.guardPerfectReady=false;}
    if(s==='guard'&&p.state!=='guard'){p.guardStartT=now;p.guardPerfectReady=now-(p.guardEndT==null?-10:p.guardEndT)>=window.CreiaCombat.perfeita.descanso;}
    if(['idle','walk','guard','hurt','ko','special'].indexOf(s)>=0){p.attackKnock=1;p.attackCdMult=1;}
    p.state = s; p.st = 0; p.hitDone = false; p.queue = false; p.thrown = false;
  }
  // o casal é parceiro um do outro; a Emanuelly anda com a Lorrany
  var PAIR = { nutri: 'lutador', lutador: 'nutri', emanuelly: 'nutri', enzo: 'emanuelly', pedro: 'enzo', naju: 'emanuelly', grazi: 'naju', bispo: 'lutador', lohan: 'bispo', rafinha: 'lohan', douglas: 'bispo', fidelis: 'rafinha', arthur: 'douglas', lucas: 'bispo', duda: 'lucas', cardoso: 'lucas', th:'lohan', douglinhas:'bispo',ricardo:'bispo',adriene:'nutri' };
  function partnerOf(p) { if (versus) return null; return players.find(function (q) { return q.who === PAIR[p.who]; }) || players.find(function (q) { return q !== p; }) || null; }
  function shieldActive() { return players.some(function (q) { return q.shield > 0 && !q.dead; }); }
  function limadoActive() { return !versus && players.some(function (q) { return q.who === 'cardoso' && !q.dead && q.limadoT > 0; }); }
  function limadoFor(p) { return versus ? p.who === 'cardoso' && p.limadoT > 0 : limadoActive(); }

  var DAMAGING_SPECIALS = {
    ricardo:true,
    adriene:true,
    nutri:true,
    douglinhas:true,
    th:true,
    grazi: true, lucas: true, fidelis: true, douglas: true, lohan: true,
    rafinha: true, bispo: true, naju: true, pedro: true, enzo: true, emanuelly: true
  };
  function isPlayerGuarding(p) {
    if (!p || p.dead || p.state==='taunt' || p.guardCd>0 || p.guardHp<=0 || p.z>0) return false;
    if (p.state === 'guard' || p.guardT > 0) return true;
    if (online && online.host && (versus||online.coop) && p.idx === 1 && online.input) {
      if (online.input.use || (time - (online.lastUseTime || 0) < 0.08)) return true;
    }
    return false;
  }
  function isDamagingSpecialActive(p) {
    if (!p || p.dead) return false;
    if (!DAMAGING_SPECIALS[p.who]) return false;
    if (p.state === 'special') return p.who!=='fidelis'||(p.fidHits||0)<7;
    if (shots.some(function (s) { return s.fromSpecial && s.owner === p && s.life > 0; })) return true;
    if (p.who === 'grazi' && kids.some(function (k) { return k.fromSpecial && k.owner === p && k.life > 0; })) return true;
    if (p.who === 'naju' && rings.some(function (r) { return r.fromSpecial && r.owner === p; })) return true;
    if (p.who === 'lucas' && players.some(function (q) { return q !== p && q.spinT > 0 && q.spinBy === p; })) return true;
    if (p.who === 'adriene' && players.some(function (q) { return q !== p && q.brigT > 0 && q.brigBy === p; })) return true;
    return false;
  }

  function updateVirada(p){
    p.virada=players.indexOf(p)>=0&&!p.dead&&p.hp>0&&p.maxHp>0&&p.hp/p.maxHp<=window.CreiaCombat.virada.limite;
    if(p.virada&&!p.viradaAvisada){p.viradaAvisada=true;if(!window.ViradaVisual||!versus&&p.ai)floatText(p.x,p.y-p.z-84,'UNÇÃO DOBRADA!','#ff4d4d');sfx('special');}
  }
  function addSpecialEnergy(p,amount){
    updateVirada(p);
    // Efeito ativo não financia o próximo: evita encadear escudo/imunidade sem janela vulnerável.
    if(p.shield>0||p.limadoT>0||p.turbo>0||p.state==='special'||isDamagingSpecialActive(p))return;
    p.sp=Math.min(100,p.sp+amount*(p.virada?window.CreiaCombat.virada.spMult:1));
  }
  function wearGuard(p,dmg) {
    p.guardHp=Math.max(0,(p.guardHp==null?100:p.guardHp)-Math.max(8,Math.min(40,dmg*4)));
    p.guardQuiet=0;
    if(p.guardHp<=0){
      p.guardT=0;p.guardCd=1.2;p.spLockedBlocked=false;
      if(p.spLockedBy)p.spLockedBy.specialBlocked=false;
      setState(p,'hurt');p.edgeStun=.8;
      floatText(p.x,p.y-80,'DEFESA QUEBRADA!','#ffd34d');sfx('break');impactAt(p.x,p.y,p.z+40,'break',true,false);
    }
  }
  var perfeitaEvents=[],perfeitaSeq=0;
  function perfectGuard(p,attacker){
    var cfg=window.CreiaCombat.perfeita,age=time-p.guardStartT;
    if(!p.guardPerfectReady||age<0||age>cfg.janela+1e-8||p.ai&&((typeof p.aiLevel==='number'?p.aiLevel<0.9:p.aiLevel!=='dificil')||!p.aiMemory||!p.aiMemory.perfectAttempt))return false;
    p.guardPerfectReady=false;p.contraT=cfg.contra;p.guardFlash=.25;p.kx=0;
    if(attacker&&attacker!==p&&!attacker.dead){setState(attacker,'hurt');attacker.perfectStunT=cfg.tontura;attacker.kx=0;attacker.vx=0;attacker.vy=0;}
    floatText(p.x,p.y-p.z-80,'PERFEITA!','#ffd34d');sfx('perfeita');
    var x=p.x,y=p.y-p.z;
    if(window.DefesaVisual&&DefesaVisual.spawn)DefesaVisual.spawn(x,y,p.facing);
    p.perfectEvent=++perfeitaSeq;
    perfeitaEvents.push([perfeitaSeq,netRound(x),netRound(y),p.facing,netRound(time)]);if(perfeitaEvents.length>8)perfeitaEvents.shift();
    return true;
  }
  // Consome ao iniciar o golpe; o projétil conserva counterKnock até atingir o alvo.
  function armCounter(p){
    var cfg=window.CreiaCombat.perfeita,active=p.contraT>0;p.attackKnock=active?cfg.empurrao:1;p.attackCdMult=active?cfg.recarga:1;p.contraT=0;
  }
  function x1Res(p) { var t = versus && window.CreiaCombat && CreiaCombat.resistenciaX1; return t && t[p.who] || 1; }   // equilíbrio do X1: quanto cada um sente do dano
  function damagePlayer(p, dmg, knock, fromX, source, attacker, isSpecial, specialBlocked, projectile) {
    if (p.dead || phase === 'clear') return false;
    if (source !== 'hazard') dmg *= x1Res(p);
    if (p.state !== 'taunt' && source && source !== 'hazard' && limadoFor(p)) {
      if (!(p.limadoMsgT > 0)) { floatText(fromX, p.y - 70, 'LIMADO!', '#9ff4ff'); p.limadoMsgT = 0.5; }
      sfx('shield_hit'); return false;
    }
    if (p.inv > 0 && p.state !== 'taunt') return false;
    if (p.state !== 'taunt' && (versus ? p.shield > 0 : shieldActive())) { burst('brilho', p.x, p.y, 30, 2); sfx('shield_hit'); return false; }
    if(versus&&isSpecial&&attacker&&typeof attacker.specialDamageLeft==='number'&&attacker.specialDamageLeft<=0)return false;
    // defesa no X1 (barreira branca frontal repelindo hits)
    var isGuarding = isPlayerGuarding(p);
    if (versus && source === 'versus') {
      var isSpecialHit = !!isSpecial;
      var isBlocked = specialBlocked !== undefined ? !!specialBlocked : (attacker ? !!attacker.specialBlocked : !!p.spLockedBlocked);
      if (isSpecialHit) {
        if (isBlocked && p.guardCd<=0 && p.guardHp>0) {
          wearGuard(p,dmg);
          p.guardFlash = 0.25;impactAt(p.x+p.facing*18,p.y,p.z+35,'block',false,false);
          p.kx = -p.facing * 20;
          burst('brilho', p.x + p.facing * 24, p.y - 30, 30, 5);
          burst('estrela', p.x + p.facing * 24, p.y - 30, 24, 3);
          sfx('guard_hit');
          floatText(p.x + p.facing * 16, p.y - 70, 'DEFESA!', '#ffffff');
          shake(1.2, 0.08);
          return false;
        }
        // Se especial NÃO foi defendido antes, o dano pega nela integralmente (ignora guarda)
      } else if (isGuarding) {
        var isFront = (fromX - p.x) * p.facing >= -4;
        if (isFront) {
          if(perfectGuard(p,attacker))return false;
          wearGuard(p,dmg);
          p.guardFlash = 0.25;impactAt(p.x+p.facing*18,p.y,p.z+35,'block',false,false);
          p.kx = -p.facing * 35;   // absorve impacto
          // repele o atacante com recuo
          var atk = attacker || players.find(function (q) { return q !== p && !q.dead; });
          if (atk && Math.abs(atk.x - p.x) < 95) {
            atk.kx = p.facing * 180;
            if (atk.state === 'walk') atk.state = 'idle';
          }
          burst('brilho', p.x + p.facing * 24, p.y - 30, 30, 5);
          burst('estrela', p.x + p.facing * 24, p.y - 30, 24, 3);
          sfx('guard_hit');
          floatText(p.x + p.facing * 16, p.y - 70, 'DEFESA!', '#ffffff');
          shake(1.2, 0.08);
          return false;
        }
      }
    }
    var isRanged = !!projectile || (source === 'projectile') || (fromX != null && Math.abs(p.x - fromX) > 65);
    var effectiveDmg = (versus && p.who === 'lutador' && isRanged) ? dmg * 0.60 : dmg;
    if(versus&&isSpecial&&attacker&&typeof attacker.specialDamageLeft==='number'){effectiveDmg=Math.min(effectiveDmg,Math.max(0,attacker.specialDamageLeft));if(effectiveDmg<=0)return false;attacker.specialDamageLeft=Math.max(0,attacker.specialDamageLeft-effectiveDmg);}
    p.hp = Math.max(0, p.hp - effectiveDmg);
    updateVirada(p);
    impactAt(p.x,p.y,p.z+36,'hit',effectiveDmg>=5,!isSpecial&&!projectile&&source==='versus');
    p.flash = 0.15;
    p.inv = versus&&isSpecial ? 0.06 : 0.7;
    addSpecialEnergy(p,versus && p.who === 'duda' ? 2 : versus && p.who === 'nutri' ? 3 : 4);
    var kDir = sign(p.x - fromX) || (p.facing ? -p.facing : 1);
    var kMag = Math.abs(knock || 0) * ((versus && p.who === 'lutador' && isRanged) ? 0.65 : 1);
    var rollingShot=p.who==='ricardo'&&p.state==='roll'&&(source==='projectile'||projectile||isRanged);
    var attackArmor=(p.who==='fidelis'&&p.state==='attack2') || (p.who==='lutador'&&/^attack[123]$/.test(p.state)&&isRanged);
    p.kx = rollingShot||attackArmor?0:kDir * kMag * 1.5;
    if (!rollingShot && !attackArmor && p.state !== 'special' && p.state !== 'pet' && p.state !== 'guard') setState(p, 'hurt');
    sfx('hurt'); shake(2, 0.12);
    if (p.hp <= 0) {
      p.dead = true; p.koT = 0; setState(p, 'ko'); p.shield = 0; p.hyper = 0;
      p.spLocked = false; p.spLockedBlocked = false; p.spLockedBy = null;
      sfx('ko'); floatText(p.x, p.y - 70, 'K.O.!', '#ff4d4d');
    }
    return true;
  }
  function revive(p, frac) {
    p.dead = false; p.hp = Math.max(1, Math.round(p.maxHp * frac)); p.inv = 2.5; p.koT = 0;
    setState(p, 'idle'); burst('coracao', p.x, p.y, 40, 8);
  }

  function enemyInFront(p, reach) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.dying) continue;
      var dx = (e.x - p.x) * p.facing;
      if (dx > -4 && dx < reach + e.w / 2 && Math.abs(e.y - p.y) < 14) return e;
    }
    if (versus) {
      for (var j = 0; j < bosses.length; j++) {
        var b = bosses[j];
        if (b.dead || !(b.hp > 0) || b.vs === p) continue;
        var reachTol = (p.idx === 1 && online && online.host) ? 22 : 0;
        var dx2 = (b.x - p.x) * p.facing;
        if (dx2 > -4 && dx2 < reach + reachTol + (b.w || 30) / 2 && Math.abs(b.y - p.y) < 22) return b;
      }
    }
    return null;
  }
  function startAtk(p, s) { setState(p, s); sfx(p.who === 'cardoso' && s === 'attack1' ? 'bass' : 'whoosh'); }
  function throwBrigadeiro(p) {   // Adriene: brigadeiro arremessado num arco curto
    var cfg = window.CreiaCombat.primary.adriene;
    shots.push({ k: 'adr-brig', x: p.x + p.facing * 16, y: p.y, z: p.z + 40, vx: p.facing * 300, vy: 0, vz: 60,
      grav: 220, dmg: versus ? cfg[2] : cfg[3], knock: 45 * p.facing, pierce: 1, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: p.facing * 10, life: 1.3, hit: [], stun: 0.3 });
    sfx('throw');
  }
  function throwFood(p) {
    shots.push({ k: pick(FOODS), x: p.x + p.facing * 14, y: p.y, z: p.z + 30, vx: p.facing * 310, vy: 0, vz: 30,
      grav: 90, dmg: versus ? 3.8 : 6, knock: 40 * p.facing, pierce: 1, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: p.facing * 14, life: 1.4, hit: [], stun: 0.25 });
    sfx('throw');
  }
  function shootEmanuelly(p,short) {
    var cfg=window.CreiaCombat,rule=cfg.emanuelly,pose=short?'attack2':'throw';
    var hand=window.Rig&&Rig.emanuellyMuzzle?Rig.emanuellyMuzzle(pose):null;
    var muzzle=hand?{x:hand.x,z:-hand.y}:rule.muzzle[short?'secondary':'primary'];
    var damage=short?cfg.secondary.emanuelly[1]:cfg.primary.emanuelly[versus?2:3];
    var range=short?cfg.secondary.emanuelly[2]:cfg.primary.emanuelly[4],speed=short?rule.secondarySpeed:rule.primarySpeed;
    var travel=Math.max(1,range-muzzle.x);
    if(p.z>0)p.airThrowT=0.2;
    shots.push({k:short?'manu-curto':'manu-tiro',manuShot:true,x:p.x+p.facing*muzzle.x,y:p.y,z:p.z+muzzle.z,
      vx:p.facing*speed,vy:0,vz:0,grav:0,dmg:damage,knock:p.facing*(short?rule.secondaryKnock:rule.primaryKnock),
      pierce:short?rule.secondaryPierce:rule.primaryPierce,owner:p,counterKnock:p.attackKnock||1,rot:0,vr:0,life:travel/speed,hit:[],
      stun:short?rule.secondaryStun:rule.primaryStun,t:0});
    sfx('throw');
  }
  function rainEmanuelly(p) {
    var cfg=window.CreiaCombat.emanuelly,dir=p.facing||1;
    cfg.rainLanes.forEach(function(y,lane){
      shots.push({k:'manu-lamina',manuShot:true,manuLamina:true,faixa:lane,t:0,born:time,
        x:dir>0?cam-cfg.rainMargin:cam+W+cfg.rainMargin,y:y,z:cfg.rainHeights[p.manuWave%cfg.rainHeights.length],
        vx:dir*cfg.rainSpeed,vy:0,vz:0,grav:0,dmg:cfg.rainDamage,knock:dir*cfg.rainKnock,pierce:cfg.bladePierce,
        owner:p,rot:0,vr:0,life:(W+cfg.rainMargin*2)/cfg.rainSpeed,hit:[],stun:cfg.rainStun,
        fromSpecial:true,specialBlocked:p.specialBlocked});
    });
    p.manuWave++;sfx('throw');
  }
  // Mesmo contrato para o visual local, snapshot do X1 e cooperativo. Sem referências circulares.
  function emanuellyBlades() {
    return shots.filter(function(s){return s.manuLamina&&s.life>0;}).map(function(s){return {
      x:netRound(s.x),y:netRound(s.y),z:netRound(s.z),vx:s.vx,dir:sign(s.vx),faixa:s.faixa,t:netRound(s.t),
      born:netRound(s.born),life:netRound(s.life),owner:players.indexOf(s.owner)};});
  }
  function emanuellyContact(s,target,fromX) {
    var cfg=window.CreiaCombat.emanuelly,short=s.k==='manu-curto';
    var radius=s.manuLamina?cfg.bladeRadius:short?cfg.secondaryRadius:cfg.primaryRadius;
    var depth=s.manuLamina?cfg.bladeDepth:short?cfg.secondaryDepth:cfg.primaryDepth;
    // Volume varrido: não pula alvos entre frames. Tolerância vertical acompanha as invocações altas.
    var vertical=s.manuLamina?radius:cfg.shotVerticalRadius;
    return Math.abs(target.y-s.y)<=depth && s.z+radius>=(target.z||0) && s.z-vertical<=(target.z||0)+(target.h||70) &&
      Math.min(fromX,s.x)-radius<=target.x+(target.w||24)/2 && Math.max(fromX,s.x)+radius>=target.x-(target.w||24)/2;
  }
  function shootGlue(p) {
    if(p.z>0)p.airThrowT=0.2;   // gota de cola quente: gruda o monstro (fica lento por um tempo)
    shots.push({ k: 'cola', glue: true, x: p.x + p.facing * 18, y: p.y, z: p.z + 30, vx: p.facing * 300, vy: 0, vz: 30, grav: 90,
      dmg: versus ? 4.0 : 6, knock: 20 * p.facing, pierce: 1, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: 0, life: 1.3, hit: [], stun: 0.25 });
    noise(0.08, 0.08, 900, 0, 'bandpass'); tone(320, 0.06, 'sine', 0.05, -120);
  }
  function throwBible(p) {   // Bíblia girando em arco
    shots.push({ k: 'biblia', x: p.x + p.facing * 14, y: p.y, z: p.z + 34, vx: p.facing * 290, vy: 0, vz: 110,
      grav: 320, dmg: versus ? 4.5 : 8, knock: 70 * p.facing, pierce: 1, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: p.facing * 11, life: 1.6, hit: [], stun: 0.4 });
    sfx('throw');
  }
  function throwCymbal(p) {   // prato de ataque (rápido) e de condução (maior, mais lento, atravessa mais), alternando
    p.prato = !p.prato; var ride = !p.prato;
    shots.push({ k: ride ? 'ride' : 'crash', x: p.x + p.facing * 16, y: p.y, z: p.z + 34, vx: p.facing * (ride ? 260 : 340), vy: 0, vz: 0, grav: 0,
      dmg: ride ? (versus ? 4.8 : 10) : (versus ? 4.2 : 8), knock: (ride ? 90 : 60) * p.facing, pierce: ride ? 3 : 2, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: 0, life: 1.3, hit: [], stun: 0.35 });
    noise(0.25, 0.08, 6000, 0, 'highpass');
  }
  function shootClave(p) {   // o cavaquinho solta claves de sol e de fá que voam ondulando
    p.clave = !p.clave;
    shots.push({ k: p.clave ? 'clave_sol' : 'clave_fa', x: p.x + p.facing * 18, y: p.y, z: p.z + 24, vx: p.facing * 260, vy: 0, vz: 0, grav: 0,
      dmg: versus ? 4.0 : 8, knock: 40 * p.facing, pierce: 1, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: 0, life: 0.48, hit: [], stun: 0.3 });   // alcance curto (~80): o de longe é o cavaquinho
    tone(pick([587, 659, 784, 880, 988]), 0.12, 'triangle', 0.07); tone(pick([392, 440, 494]), 0.1, 'triangle', 0.05, 0, 0.03);
  }
  function spinTick(e, dt) {   // porcos na sala: a cada 0,3 s quem está rodando perde vida
    e.spinTick = (e.spinTick || 0) - dt; if (e.spinTick > 0) return;
    e.spinTick = 0.3; tone(220 + Math.random() * 200, 0.08, 'square', 0.03, -120);   // ronco
    specialDrain(e, e.spinBy, 2, 4, 3);
  }
  function brigTick(e, dt) {   // brigadeiro gigante da Adriene: depois de formado, a cada 0,3 s quem está preso perde vida
    e.brigTick = (e.brigTick || 0) - dt; if (e.brigTick > 0) return;
    e.brigTick = 0.3; tone(150 + Math.random() * 60, 0.09, 'sine', 0.05, -60);   // gulp
    specialDrain(e, e.brigBy, 3, 5, 4);
  }
  function brigadeiroTrap(p) {   // "É HORA DO BRIGADEIRO!": os ingredientes voam e prendem todo mundo à vista num brigadeiro gigante
    var V = window.AdrieneVisual, dur = V.trapDuration(versus);
    function lock(e) { e.brigT = dur; e.brigAge = 0; e.brigBy = p; e.brigTick = V.trapForming; e.brigSeed = Math.random() * 10; }
    enemies.forEach(function (e) { if (!e.dying && e.x > cam - 10 && e.x < cam + W + 10) { lock(e); e.stun = Math.max(e.stun, dur); } });
    bosses.forEach(function (b) { if (b.dead || !(b.hp > 0) || b.vs === p) return; var tg = b.vs || b; lock(tg); tg.specialBlocked = p.specialBlocked; });
    shake(3, 0.3); sfx('whoosh');
  }
  function specialDrain(e, by, pDmg, bDmg, eDmg) {   // dano contínuo de especial (porcos do Lucas, brigadeiro da Adriene)
    if (players.indexOf(e) >= 0) {   // jogador (X1): tira vida direto, sem o tempo de invencibilidade do golpe
      if (e.state !== 'taunt' && limadoFor(e)) { if (!(e.limadoMsgT > 0)) { floatText(by ? by.x : e.x, e.y - 70, 'LIMADO!', '#9ff4ff'); e.limadoMsgT=0.5; } return; }
      var blocked = (by && by.specialBlocked) || e.specialBlocked || e.spLockedBlocked;
      if (blocked && e.guardCd<=0 && e.guardHp>0) {
        wearGuard(e,2);
        burst('brilho', e.x, e.y, 40, 2);
        burst('estrela', e.x, e.y, 24, 2);
        sfx('guard_hit');
        floatText(e.x + e.facing * 16, e.y - 70, 'DEFESA!', '#ffffff');
        return;
      }
      var spinDamage=pDmg*x1Res(e);if(by&&typeof by.specialDamageLeft==='number'){spinDamage=Math.min(spinDamage,Math.max(0,by.specialDamageLeft));by.specialDamageLeft-=spinDamage;}
      e.hp = Math.max(0, e.hp - spinDamage);if(spinDamage>0&&e.state==='taunt')setState(e,'hurt');updateVirada(e); e.flash = 0.1; if (by)addSpecialEnergy(by,1);
      burst('estrela', e.x, e.y, 76, 1);
      if (e.hp <= 0) { e.dead = true; e.koT = 0; setState(e, 'ko'); e.spinT = 0; e.brigT = 0; e.spLocked = false; e.spLockedBlocked = false; e.spLockedBy = null; sfx('ko'); floatText(e.x, e.y - 70, 'K.O.!', '#ff4d4d'); }
    } else if (bosses.indexOf(e) >= 0) hitBoss(e, bDmg, by, true, (by && by.specialBlocked) || e.specialBlocked);
    else if (!e.dying) { hitEnemy(e, eDmg, 0, by, { stun: 0.5 }); e.kx = 0; burst('estrela', e.x, e.y, (e.h || 30) + 6, 1); }
  }
  var DUDA_COLS = ['#ff6fb5', '#ffffff', '#ffe14d'];
  function singShock(p) {   // canto da Duda: choques rosa, branco e amarelo saindo do microfone até meia distância
    var alvos = [];
    enemies.forEach(function (e) { var dx = (e.x - p.x) * p.facing; if (!e.dying && dx > 0 && dx < 150 && Math.abs(e.y - p.y) < 22) alvos.push([dx, e]); });
    bosses.forEach(function (b) { var dx = (b.x - p.x) * p.facing; if (!b.dead && b.hp > 0 && b.vs !== p && dx > 0 && dx < 150 + (b.w || 30) / 2 && Math.abs(b.y - p.y) < 34) alvos.push([dx, b]); });
    alvos.sort(function (a, b) { return a[0] - b[0]; });
    alvos.slice(0, 2).forEach(function (a) {
      var e = a[1];
      for (var z = 0; z < 2; z++) zap(p, e.x + rnd(-4, 4), e.y - (e.h || 30) * 0.6, DUDA_COLS, 26, 54);
      if (bosses.indexOf(e) >= 0) hitBoss(e, versus ? 3.5 : 7, p, false, false, 24, p.x); else { hitEnemy(e, 7, 50 * p.facing, p, { stun: 0.55 }); burst('brilho', e.x, e.y, 30, 2); }
    });
    if (!alvos.length) for (var z2 = 0; z2 < 2; z2++) zap(p, p.x + p.facing * rnd(90, 140), p.y - rnd(30, 60), DUDA_COLS, 26, 54);
    tone(pick([784, 880, 988]), 0.14, 'triangle', 0.06); noise(0.08, 0.05, 3500, 0, 'highpass');
  }
  function throwMicreia(p) {   // microfone do CreiaCast girando
    shots.push({ k: 'micreia', x: p.x + p.facing * 18, y: p.y, z: p.z + 34, vx: p.facing * 320, vy: 0, vz: 40, grav: 60,
      dmg: versus ? 4.2 : 9, knock: 70 * p.facing, pierce: 1, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: p.facing * 13, life: 1.3, hit: [], stun: 0.35 });
    sfx('throw');
  }
  function slapWave(p) {   // slap no baixo: onda grave roxa/laranja, mesma distância das claves do Douglas (~80)
    shots.push({ k: 'som', wave: true, slap: true, x: p.x + p.facing * 20, y: p.y, z: p.z + 30, vx: p.facing * 260, vy: 0, vz: 0, grav: 0,
      dmg: versus ? 4.2 : 8, knock: 90 * p.facing, pierce: 2, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: 0, life: 0.45, hit: [], stun: 0.35 });
  }
  function singWave(p) {   // canto: ondinha sonora curta que empurra o monstro bem para trás
    shots.push({ k: 'som', wave: true, x: p.x + p.facing * 20, y: p.y, z: p.z + 34, vx: p.facing * 240, vy: 0, vz: 0, grav: 0,
      dmg: versus ? 4.0 : 5, knock: 260 * p.facing, pierce: 3, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: 0, life: 0.4, hit: [], stun: 0.5 });
    tone(pick([392, 440, 523]), 0.18, 'sawtooth', 0.05, 80); tone(pick([196, 220]), 0.18, 'square', 0.03);
  }
  function throwControle(p, lob, fromSpecial) {   // controle girando: reto e rápido; o "lob" vai alto, mais longe, e cai em cima
    var hand=window.CreiaCombat.fidelis.muzzle;
    shots.push({ k: 'controle', x: p.x + p.facing * hand.x, y: p.y, z: p.z + (lob ? 40 : hand.z), vx: p.facing * (lob ? 230 : 330), vy: 0, vz: lob ? 250 : -220, grav: lob ? 330 : 0,
      dmg: lob ? (versus ? 8.5 : 15) : (versus ? 4.5 : 8), knock: (lob ? 120 : 50) * p.facing, pierce: lob ? 2 : 1, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: p.facing * (lob ? 10 : 16), life: lob ? 2.2 : 1.1, hit: [], stun: lob ? 0.6 : 0.3,
      fromSpecial: !!fromSpecial, specialBlocked: fromSpecial ? p.specialBlocked : false, fidControl:!lob, fidPlane:p.z+22, sweepX:p.x+p.facing*10 });
    sfx('throw');
  }
  function throwCavaco(p) {   // arremessa o cavaquinho girando: pesado, atravessa
    shots.push({ k: 'cavaquinho', x: p.x + p.facing * 18, y: p.y, z: p.z + 18, vx: p.facing * 300, vy: 0, vz: 0, grav: 0,
      dmg: versus ? 9.0 : 16, knock: 170 * p.facing, pierce: 3, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: p.facing * 14, life: 1.4, hit: [], stun: 0.6, breaker: true });
    sfx('throw');
  }
  function flashShot(p) {
    if(p.z>0)p.airThrowT=0.2;   // flash do iPhone na ponta do estabilizador: ofusca de pertinho
    shots.push({ k: 'brilho', x: p.x + p.facing * 30, y: p.y, z: p.z + 34, vx: p.facing * 380, vy: 0, vz: 0, grav: 0,
      dmg: versus ? 4.2 : 6, knock: 40 * p.facing, pierce: 2, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: 0, life: 0.40, hit: [], stun: 0.6 });
  }
  function launchDrone(p) {   // câmera voadora: vai atrás do monstro mais perto
    shots.push({ k: 'drone', homing: true, x: p.x + p.facing * 10, y: p.y, z: p.z + 44, vx: p.facing * 160, vy: 0, vz: 0, grav: 0,
      dmg: versus ? 8.5 : 13, knock: 80 * p.facing, pierce: 1, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: 0, life: 3, hit: [], stun: 0.6 });
    tone(880, 0.3, 'sawtooth', 0.03, 300);
  }
  function fireBoom(s) {   // bola de fogo bate no chão: explosãozinha que pega quem está em volta
    burst('brasa', s.x, s.y, 2, 7); shake(1.5, 0.08); sfx('boom');
    enemies.forEach(function (e) { if (!e.dying && s.hit.indexOf(e) < 0 && Math.abs(e.x - s.x) < 22 + e.w / 2 && Math.abs(e.y - s.y) < 14) hitEnemy(e, 5, (sign(e.x - s.x) || 1) * 80, s.owner, { stun: 0.35 }); });
    bosses.forEach(function (b) { if (!b.dead && b.hp > 0 && s.hit.indexOf(b) < 0 && Math.abs(b.x - s.x) < 22 + b.w / 2 && Math.abs(b.y - s.y) < 26) hitBoss(b, versus ? 4 : 4, s.owner, !!s.fromSpecial, s.specialBlocked, 30, s.x, true,s.counterKnock); });
  }
  function throwMic(p) {   // microfone vai no fio e volta puxado; acerta na ida e na volta (na volta puxa o monstro)
    p.micOut = true;
    shots.push({ k: 'mic', yoyo: true, t: 0, out: 0.32, x: p.x + p.facing * 14, y: p.y, z: p.z + 34, vx: p.facing * 400, vy: 0, vz: 0, grav: 0,
      dmg: versus ? 5.0 : 8, knock: 50 * p.facing, pierce: 99, owner: p,counterKnock:p.attackKnock||1, rot: p.facing > 0 ? -1.5 : 1.5, vr: 0, life: 3, hit: [], stun: 0.35 });
    sfx('throw');
  }
  function shootNote(p) {   // mesma colisão da semínima; equalizador é apenas desenho
    if(p.z>0)p.airThrowT=0.2;
    var muzzle=window.Rig && Rig.pedroMuzzle?Rig.pedroMuzzle('throw',0):{x:34,y:-44};
    shots.push({ k: 'seminima', x: p.x + p.facing * muzzle.x, y: p.y, z: p.z-muzzle.y, vx: p.facing * 330, vy: 0, vz: 0, grav: 0,
      dmg: versus ? 4.0 : 6, knock: 35 * p.facing, pierce: 1, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: 0, life: 1.2, hit: [], stun: 0.2 });
    tone(pick([659, 784, 880, 988, 1175]), 0.09, 'square', 0.05);
  }
  function firePedro12(p) {
    var muzzle=window.Rig && Rig.pedroMuzzle?Rig.pedroMuzzle('attack2',0):{x:30,y:-48};
    shots.push({k:'pedro-12',x:p.x+p.facing*muzzle.x,y:p.y,z:p.z-muzzle.y,vx:p.facing*650,vy:0,vz:0,grav:0,
      dmg:window.CreiaCombat.secondary.pedro[1],knock:p.facing*95,pierce:1,owner:p,counterKnock:p.attackKnock||1,rot:0,vr:0,life:.2,hit:[],stun:.4});
    sfx('boom');shake(2.8,.12);
  }
  function throwBall(p, three) {
    p.enzoThree=!!three; if(p.z>0)p.airThrowT=0.2;   // bola de basquete que quica; a de três vai alta e bate mais forte
    shots.push({ k: 'basquete', x: p.x + p.facing * 12, y: p.y, z: p.z + 34, vx: p.facing * (three ? 230 : 280), vy: 0, vz: three ? 260 : 90,
      grav: 520, dmg: three ? (versus ? 8.5 : 14) : (versus ? 4.5 : 7), knock: (three ? 110 : 60) * p.facing, pierce: three ? 2 : 1, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: p.facing * 9,
      life: 2.2, hit: [], stun: three ? 0.6 : 0.3, bounces: 2 });
    sfx('throw');
  }
  // Aproxima até ~30 unidades, sem atravessar o dono nem ignorar defesa.
  function pullDumbbell(target,owner,boss){
    if(!owner||owner.dead||target.dead||target.dying||target.hp<=0||target.state==='roll')return;
    var dx=owner.x-target.x,gap=Math.abs(dx),distance=Math.min(32,Math.max(0,gap-38));
    if(distance<=0)return;
    if(boss)target.dglFly={from:target.x,to:clamp(target.x+sign(dx)*distance,cam+24,cam+W-24),t:0,z:target.z||0};
    else target.kx=sign(dx)*distance*8;
  }
  function throwDumbbell(p) {
    shots.push({ k: 'halter', x: p.x + p.facing * 16, y: p.y, z: p.z + 26, vx: p.facing * 320, vy: 0, vz: 0,
      grav: 0, dmg: versus ? 10 : 16, knock: 0, pierce: 2, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: p.facing * 10, life: 1.1, hit: [],
      breaker: true, stun: 0.6 });
    sfx('throw');
  }

  var TH_DURATION=6.4;
  var TH_SUBTITLES=['Fala Galera, meu nome é Thiago','e vim trazer os anúncios da semana'];
  function shootTh(p,phone) {
    p.thPhone=!!phone;if(p.z>0)p.airThrowT=0.2;
    shots.push({k:phone?'th-iphone':'th-rec',x:p.x+p.facing*20,y:p.y,z:p.z+36,
      vx:p.facing*(phone?330:310),vy:0,vz:phone?70:0,grav:phone?110:0,
      dmg:phone?(versus?8.5:13):(versus?4:6),knock:p.facing*(phone?85:30),pierce:phone?2:1,
      owner:p,counterKnock:p.attackKnock||1,rot:0,vr:phone?p.facing*10:0,life:phone?1.4:0.65,hit:[],stun:phone?0.4:0.2});
    sfx('throw');
  }
  function dropThTv(p) {
    var targets=enemies.filter(function(e){return !e.dying && e.hp>0 && e.x>=cam && e.x<=cam+W;})
      .concat(bosses.filter(function(b){return !b.dead && b.hp>0 && b.vs!==p;}));
    targets.sort(function(a,b){return Math.abs(a.x-p.x)+Math.abs(a.y-p.y)-Math.abs(b.x-p.x)-Math.abs(b.y-p.y);});
    var target=targets[0] || {x:clamp(p.x+p.facing*110,cam+30,cam+W-30),y:p.y,h:70,z:0};
    var impact=(target.z||0)+(target.h||70)+40;
    shots.push({k:'th-tv',thTv:true,thImpactZ:impact,x:target.x,y:target.y,z:Math.max(320,impact+180),
      vx:0,vy:0,vz:-80,grav:800,dmg:versus?40:48,knock:p.facing*100,pierce:1,owner:p,counterKnock:p.attackKnock||1,
      rot:0,vr:0,life:1.6,hit:[],stun:0.75,fromSpecial:true,specialBlocked:p.specialBlocked});
    sfx('whoosh');
  }
  function impactThTv(s) {
    // Um único impacto: a TV permanece desenhada por alguns quadros, sem repetir o dano.
    s.thLanded=true;s.z=s.thImpactZ;s.vz=0;s.grav=0;s.rot=0.06;s.life=0.65;
    enemies.forEach(function(e){
      if(!e.dying && e.hp>0 && Math.abs(e.x-s.x)<72+e.w/2 && Math.abs(e.y-s.y)<25)
        hitEnemy(e,s.dmg,s.knock,s.owner,s);
    });
    bosses.forEach(function(b){
      if(!b.dead && b.hp>0 && b.vs!==s.owner && Math.abs(b.x-s.x)<72+b.w/2 && Math.abs(b.y-s.y)<28)
        hitBoss(b,s.dmg,s.owner,true,s.specialBlocked,90,s.x);
    });
    burst('estrela',s.x,s.y,50,12);shake(5,0.3);sfx('boom');
  }
  function drawThCine(t) {
    var progress=smooth(0.35,5.2,t),inn=smooth(0,0.2,t),out=smooth(6.15,TH_DURATION,t);
    ctx.save();ctx.globalAlpha*=inn*(1-out);
    var bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#0b2031');bg.addColorStop(1,'#153f4a');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    if(window.Rig && window.Rig.thReporter)window.Rig.thReporter(ctx,60,10,360,188,progress);
    ctx.fillStyle='#101418';ctx.fillRect(0,204,W,66);
    var count=Math.floor(progress*(TH_SUBTITLES[0].length+TH_SUBTITLES[1].length));
    if(count>0)txt(TH_SUBTITLES[0].slice(0,count),240,226,'#fff','center',11);
    if(count>TH_SUBTITLES[0].length)txt(TH_SUBTITLES[1].slice(0,count-TH_SUBTITLES[0].length),240,249,'#fff','center',11);
    ctx.fillStyle='#ff3345';ctx.beginPath();ctx.arc(22,23,3,0,Math.PI*2);ctx.fill();
    txt('THIAGO - AO VIVO',34,27,'#fff','left',8);
    ctx.restore();
  }

  var DGL_DURATION=6.2;
  function kickDouglinhas(p) {
    if(p.z>0)p.airThrowT=0.2;
    shots.push({k:'dgl-bola',x:p.x+p.facing*24,y:p.y,z:p.z+18,vx:p.facing*360,vy:0,vz:65,grav:260,
      dmg:versus?4.2:6,knock:p.facing*50,pierce:1,owner:p,counterKnock:p.attackKnock||1,rot:0,vr:p.facing*10,life:1.8,hit:[],stun:0.25,bounces:2});
    sfx('throw');
  }
  function launchDouglinhasMiddle(target,p,boss) {
    var middle=clamp(target.x+(cam+W/2-target.x)*(p.attackKnock||1),cam+12,cam+W-12),to=p.facing>0?Math.max(target.x,middle):Math.min(target.x,middle);
    if(Math.abs(to-target.x)<1)return;
    if(boss)target.dglFly={from:target.x,to:to,t:0,z:target.z||0};
    else {
      target.edgeFly={from:target.x,to:to,t:0};target.kx=0;
      if(target.who){target.edgeStun=0.7;target.vz=0;}else target.stun=Math.max(target.stun,1);
    }
  }
  function slapDouglinhas(p) {
    var hits=0;
    enemies.forEach(function(e){
      var dx=(e.x-p.x)*p.facing;
      if(e.dying || dx< -6 || dx>50+e.w/2 || Math.abs(e.y-p.y)>23 || Math.abs(e.z-p.z)>40)return;
      var hp=e.hp,guarded=!!e.guard;hitEnemy(e,12,p.facing*25,p,{stun:0.5});
      if(!guarded && e.hp<hp && !e.dying)launchDouglinhasMiddle(e,p,false);hits++;
    });
    bosses.forEach(function(b){
      var dx=(b.x-p.x)*p.facing;
      if(b.dead || b.hp<=0 || b.vs===p || dx< -6 || dx>50+b.w/2 || Math.abs(b.y-p.y)>25 || Math.abs((b.z||0)-p.z)>45)return;
      var hp=b.hp,ok=hitBoss(b,12,p,false,false,25,p.x);
      if(b.vs){if(ok)launchDouglinhasMiddle(b.vs,p,false);}
      else if(b.hp<hp)launchDouglinhasMiddle(b,p,true);
      hits++;
    });
    if(hits){sfx('hit');shake(2,0.12);burst('estrela',p.x+p.facing*32,p.y,30,4);}
  }
  function updateDouglinhasBossPush(b,dt) {
    if(!b.dglFly)return false;
    var f=b.dglFly,u=clamp((f.t+=dt)/0.42,0,1),e=u*u*(3-2*u);
    b.x=f.from+(f.to-f.from)*e;b.z=f.z+Math.sin(u*Math.PI)*25;
    if(u>=1){b.dglFly=null;b.z=f.z;}
    return true;
  }
  function dropDouglinhasCross(p) {
    var targets=enemies.filter(function(e){return !e.dying && e.hp>0 && e.x>=cam && e.x<=cam+W;})
      .concat(bosses.filter(function(b){return !b.dead && b.hp>0 && b.vs!==p;}));
    targets.sort(function(a,b){return Math.abs(a.x-p.x)+Math.abs(a.y-p.y)-Math.abs(b.x-p.x)-Math.abs(b.y-p.y);});
    var target=targets[0] || {x:clamp(p.x+p.facing*110,cam+30,cam+W-30),y:p.y,h:70,z:0};
    var impact=(target.z||0)+(target.h||70)+80;
    shots.push({k:'dgl-cruz',dglCross:true,dglImpactZ:impact,x:target.x,y:target.y,z:Math.max(360,impact+200),
      vx:0,vy:0,vz:-100,grav:850,dmg:versus?40:48,knock:p.facing*100,pierce:1,owner:p,counterKnock:p.attackKnock||1,
      rot:0,vr:0,life:1.6,hit:[],stun:0.8,fromSpecial:true,specialBlocked:p.specialBlocked});
    sfx('whoosh');
  }
  function impactDouglinhasCross(s) {
    s.dglLanded=true;s.z=s.dglImpactZ;s.vz=0;s.grav=0;s.rot=0.05;s.life=0.7;
    enemies.forEach(function(e){if(!e.dying && e.hp>0 && Math.abs(e.x-s.x)<50+e.w/2 && Math.abs(e.y-s.y)<26)hitEnemy(e,s.dmg,s.knock,s.owner,s);});
    bosses.forEach(function(b){if(!b.dead && b.hp>0 && b.vs!==s.owner && Math.abs(b.x-s.x)<50+b.w/2 && Math.abs(b.y-s.y)<28)hitBoss(b,s.dmg,s.owner,true,s.specialBlocked,90,s.x);});
    burst('estrela',s.x,s.y,45,12);shake(6,0.35);sfx('boom');
  }
  function drawDouglinhasHeaven(t,alpha) {
    ctx.save();ctx.globalAlpha*=alpha;
    var open=smooth(0,1.3,t),g=ctx.createRadialGradient(W/2,0,8,W/2,70,350);
    g.addColorStop(0,'#fffbe6');g.addColorStop(0.35,'#f7c84a');g.addColorStop(1,'#5a3206');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(W/2,0);
    for(var i=0;i<16;i++){
      var a=i/16*Math.PI*2+t*0.25;ctx.fillStyle=i%2?'rgba(255,255,255,0.28)':'rgba(255,240,180,0.14)';
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*560,Math.sin(a)*560);ctx.lineTo(Math.cos(a+0.16)*560,Math.sin(a+0.16)*560);ctx.fill();
    }
    ctx.restore();ctx.fillStyle='#e6edf5';
    var gap=12+open*180;
    for(var side=-1;side<=1;side+=2)for(var c=0;c<5;c++){
      ctx.beginPath();ctx.ellipse(W/2+side*(gap+c*42),10+c%2*8,42,26,0,0,Math.PI*2);ctx.fill();
    }
    for(var j=0;j<18;j++){
      var u=(t*0.45+j*0.071)%1,x=(j*53)%W,y=H-u*(H+30);ctx.fillStyle='#fff6c0';ctx.fillRect(x,y,2,5);ctx.fillRect(x-2,y+2,6,1);
    }
    ctx.restore();
  }
  function drawDouglinhasCine(t) {
    ctx.save();ctx.globalAlpha*=smooth(0,0.18,t)*(1-smooth(6.0,DGL_DURATION,t));
    if(t<4.2){
      ctx.fillStyle='#181222';ctx.fillRect(0,0,W,H);
      if(window.Rig && window.Rig.douglinhasCine)window.Rig.douglinhasCine(ctx,50,8,380,204,smooth(0.4,2.9,t));
    }else{
      drawDouglinhasHeaven(t-4.2,1);
      if(window.Rig)window.Rig.big(ctx,'douglinhas','special',t,240,258,1,2.4);
    }
    if(t>=2.9){var title='Que tenhamos lágrimas!',n=Math.floor(title.length*smooth(2.9,4.1,t));if(n>0){ctx.fillStyle='#17111b';ctx.fillRect(24,228,W-48,34);txt(title.slice(0,n),W/2,236,'#fff6c0','center',16);}}
    ctx.restore();
  }

  var RIC_CINE=5.8;
  function ricardoHit(p,damage,reach,knock,list) {
    list=list||[];
    enemies.concat(bosses).forEach(function(e){
      var boss=bosses.indexOf(e)>=0,dx=(e.x-p.x)*p.facing;
      if(e.dead||e.dying||e.hp<=0||e.vs===p||list.indexOf(e)>=0||dx< -12||dx>reach+(e.w||24)/2||Math.abs(e.y-p.y)>25||Math.abs((e.z||0)-p.z)>45)return;
      list.push(e);
      if(boss){var hp=e.hp;hitBoss(e,damage,p,false,undefined,knock,p.x);if(!e.vs&&e.hp>0&&e.hp<hp)e.dglFly={from:e.x,to:clamp(e.x+p.facing*knock*(p.attackKnock||1),cam+24,cam+W-24),t:0,z:e.z||0};}
      else hitEnemy(e,damage,p.facing*knock*3,p,{stun:0.4});
      burst('estrela',e.x,e.y,35,4);sfx('hit');
    });
  }
  function ricardoDrop(p) {
    var targets=enemies.concat(bosses).filter(function(e){return !e.dead&&!e.dying&&e.hp>0&&e.vs!==p&&e.x>=cam&&e.x<=cam+W;});
    targets.sort(function(a,b){return Math.abs(a.x-p.x)+Math.abs(a.y-p.y)-Math.abs(b.x-p.x)-Math.abs(b.y-p.y);});
    var target=targets[0]||{x:clamp(p.x+p.facing*100,cam+30,cam+W-30),y:p.y,h:70,z:0};
    p.rcLanding={x:target.x,y:target.y};
    var geometry=window.Rig && Rig.ricardoDoorSize?Rig.ricardoDoorSize():{half:41,contact:33};
    shots.push({k:'ric-porta',rcDoor:true,rcImpact:(target.z||0)+(target.h||70)+geometry.contact,
      x:target.x,y:target.y,z:Math.max(target.y+geometry.half+34,(target.z||0)+(target.h||70)+geometry.contact+180),vx:0,vy:0,vz:-45,grav:240,dmg:versus?42:50,knock:p.facing*110,
      pierce:1,owner:p,counterKnock:p.attackKnock||1,rot:0,vr:0,life:2,hit:[],stun:0.8,fromSpecial:true,specialBlocked:p.specialBlocked});sfx('whoosh');
  }
  function ricardoImpact(s) {
    s.rcLanded=true;s.z=s.rcImpact;s.vz=0;s.grav=0;s.life=0.7;
    enemies.forEach(function(e){if(!e.dying&&e.hp>0&&Math.abs(e.x-s.x)<55+e.w/2&&Math.abs(e.y-s.y)<28)hitEnemy(e,s.dmg,s.knock,s.owner,s);});
    bosses.forEach(function(b){if(!b.dead&&b.hp>0&&b.vs!==s.owner&&Math.abs(b.x-s.x)<55+b.w/2&&Math.abs(b.y-s.y)<28)hitBoss(b,s.dmg,s.owner,true,s.specialBlocked,95,s.x);});
    var p=s.owner;p.rcLanded=true;p.x=clamp(s.x-p.facing*45,cam+12,cam+W-12);p.y=clamp(s.y,TOP,BOT);p.z=0;
    burst('estrela',s.x,s.y,50,14);shake(7,0.4);sfx('boom');
  }
  function drawRicardoCine(t) {
    ctx.save();ctx.globalAlpha*=smooth(0,0.18,t)*(1-smooth(5.5,RIC_CINE,t));
    ctx.fillStyle='#101c2c';ctx.fillRect(0,0,W,H);
    if(window.Rig&&Rig.ricardoCine)Rig.ricardoCine(ctx,40,8,400,194,smooth(0.25,4.8,t));
    ctx.fillStyle='#0a101c';ctx.fillRect(0,205,W,65);
    var first='Não há ferrolhos....',second='NEM PORRRTAAAAS!';
    var n=Math.floor(first.length*smooth(0.4,2.2,t)),m=Math.floor(second.length*smooth(2.7,4.4,t));
    if(n)txt(first.slice(0,n),240,217,'#f7e9cf','center',12);
    if(m)txt(second.slice(0,m),240,242,'#ffce68','center',16);
    ctx.restore();
  }

  function startSpecial(p) {
    if(versus&&DAMAGING_SPECIALS[p.who])p.specialDamageLeft=window.CreiaCombat.specialDamageLimit;
    p.sp = 0;
    setState(p, 'special');
    sfx('special');
    if (versus) {
      var opp = players.find(function (q) { return q !== p && !q.dead; });
      if (opp && DAMAGING_SPECIALS[p.who]) {
        var oppGuarded = isPlayerGuarding(opp);
        p.specialBlocked = oppGuarded;
        opp.spLocked = true;
        opp.spLockedBlocked = oppGuarded;
        opp.spLockedBy = p;
        if (oppGuarded) {
          if(opp.state!=='guard')setState(opp,'guard');
          opp.guardT = 999;
        } else {
          if (opp.state === 'guard') setState(opp,'idle');
          opp.guardT = 0;
        }
        opp.vx = 0; opp.vy = 0; opp.vz = 0; opp.kx = 0;
      } else {
        p.specialBlocked = false;
      }
    } else {
      p.specialBlocked = false;
    }
    if(p.who==='adriene'){p.inv=1.2;p.brigOut=false;cine={p:p,t:0};sfx('cutin');sfx('grito');}
    else if(p.who==='ricardo'){p.inv=2;p.rcDropped=false;p.rcLanded=false;cine={p:p,t:0};sfx('cutin');sfx('grito');}
    else if(p.who==='douglinhas'){p.inv=2;p.dglCrossDropped=false;cine={p:p,t:0};sfx('cutin');}
    else if(p.who==='th') {
      p.inv=1.8;p.thTvDropped=false;cine={p:p,t:0};sfx('cutin');
    } else if (p.who === 'nutri') {
      p.inv = 1.4; p.kissTarget = null; p.drained = false;   // "RESTRIÇÃO ALIMENTAR, LOW CARB!": come a maçã e drena 20% de vida
      cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'grazi') {
      p.inv = 2.6 + CINE; p.kidsOut = false; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'duda') {
      p.inv = 2.9 + CINE; p.healed = false; p.sang = false; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'cardoso') {
      p.inv = 2.65 + CINE; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'lucas') {
      p.inv = 2.4 + CINE; p.shout = false; p.spun = false; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'arthur') {
      p.inv = 4.6 + CINE; p.said = false; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'fidelis') {
      p.inv = 2.3; p.fidHits = 0; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'douglas') {
      p.inv = 4.2 + CINE; p.burnT = 0; p.shout = false; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'lohan') {
      p.inv = 2.4 + CINE; p.flashes = 0; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'rafinha') {
      p.inv = 4.2 + CINE; p.beatT = 0; p.beats = 0; p.count = 0; p.shout = false; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'bispo') {
      p.inv = 2.8 + CINE; p.fireT = 0; p.soloOn = false; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'naju') {
      p.inv = 2.4 + CINE; p.ringT = 0; p.soloOn = false; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'pedro') {
      p.inv = 2.4 + cineDuration(p); p.soloOn = false; p.beamT = 0; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'enzo') {
      p.inv = 2.6 + CINE; p.noteT = 0; p.healed = 0; p.soloOn = false; cine = { p: p, t: 0 }; sfx('cutin');
    } else if (p.who === 'emanuelly') {
      p.inv=window.CreiaCombat.emanuelly.specialDuration+cineDuration(p);p.manuRainAt=window.CreiaCombat.emanuelly.rainStart;p.manuWave=0;cine={p:p,t:0};sfx('cutin');
    } else {
      p.inv = 2.4 + CINE; p.soloOn = false; p.soloDone = false; p.noteT = 0;
      cine = { p: p, t: 0 }; sfx('cutin');
    }
  }
  function lowCarbDrain(p) {   // Lorrany: tira 20% da vida de cada alvo à vista e recupera 20% da dela
    p.drainTargets = [];
    enemies.forEach(function (e) { if (!e.dying && e.x > cam - 10 && e.x < cam + W + 10) { p.drainTargets.push(e); floatText(e.x, e.y - (e.h || 30) - 10, '-20%', '#ff4d5e'); hitEnemy(e, Math.max(6, e.maxHp * 0.2), 0, p, { stun: 1 }); } });
    bosses.forEach(function (b) {
      if (b.dead || !(b.hp > 0) || b.vs === p) return;
      var tg = b.vs || b; p.drainTargets.push(tg); floatText(tg.x, tg.y - (tg.h || 70) - 10, '-20%', '#ff4d5e');
      if (b.vs) specialDrain(tg, p, tg.maxHp * 0.2, 0, 0); else hitBoss(b, Math.min(60, b.maxHp * 0.2), p, true, p.specialBlocked);   // ponytail: chefe perde no máximo 60
    });
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.2);
    floatText(p.x, p.y - 96, '+20% HP', '#8dff9a'); burst('brilho', p.x, p.y, 50, 8); sfx('kiss'); shake(3, 0.3);
  }
  function soloPower(p) {
    p.shield = p.who === 'lutador' ? 9 : (versus ? 2.7 : 6); p.inv = Math.max(p.inv, 0.5);
    var n = versus ? null : players.find(function (q) { return q.who === 'nutri' && !q.dead; });
    if (n) { n.hyper = 6; n.hyperT = 0; burst('brilho', n.x, n.y, 40, 10); }
    sfx('shield'); shake(3, 0.3);
    floatText(p.x, p.y - 72, 'ESCUDO SAUDÁVEL!', '#8dff9a');
    if (n) floatText(n.x, n.y - 60, 'HIPER-NUTRI!', '#ffe066');
  }
  function activateLimados(p) {
    p.limadoT = 5; eshots = []; setState(p, 'idle');
    floatText(p.x, p.y - 96, 'LIMADOS 5s', '#9ff4ff'); sfx('shield');
  }
  function updateSpecial(p, dt) {
    if(p.who==='adriene'){if(!p.brigOut){p.brigOut=true;brigadeiroTrap(p);}if(p.st>=0.7)setState(p,'idle');return;}   // depois da cena ela já fica livre
    if(p.who==='ricardo'){if(!p.rcDropped&&p.st>=0.15){p.rcDropped=true;ricardoDrop(p);}if(p.st>=3.2 || p.st>=1.5&&!shots.some(function(s){return s.k==='ric-porta'&&s.owner===p&&s.life>0;})){p.rcLanded=true;setState(p,'idle');}return;}
    if(p.who==='douglinhas'){if(!p.dglCrossDropped && p.st>=0.15){p.dglCrossDropped=true;dropDouglinhasCross(p);}if(p.st>=1.65)setState(p,'idle');return;}
    if(p.who==='th') {
      if(!p.thTvDropped){p.thTvDropped=true;dropThTv(p);}
      if(p.st>=1.3)setState(p,'idle');
      return;
    }
    if (p.who === 'nutri') {   // depois da cena "LOW CARB!": a garra puxa a vida de quem está à vista
      if (!p.drained) { p.drained = true; lowCarbDrain(p); }
      if (p.st >= (window.LorranyVisual ? LorranyVisual.drainTime : 1)) setState(p, 'idle');
    } else if (p.who === 'grazi') {   // "Vá, minhas crianças!": 6 crianças saem correndo à frente atropelando os monstros
      if (!p.kidsOut && p.st >= 0.5) {
        p.kidsOut = true; sfx('criancas'); floatText(p.x, p.y - 100, 'VÃO, MINHAS CRIANÇAS!', '#ff8fc0');
        for (var ki = 0; ki < 12; ki++) {   // 12 crianças, cada uma bate metade: o dano total do especial é o mesmo de antes
          kids.push({ i: ki, owner: p,counterKnock:p.attackKnock||1, dir: p.facing, x: p.x - p.facing * (10 + (ki % 6) * 14), y: clamp(p.y - 34 + (ki % 7) * 11 + rnd(-3, 3), TOP, BOT), t: rnd(0, 1),
            spd: rnd(220, 300), delay: ki * 0.07, hit: [], life: 3.4, shout: ki % 3 === 0, fromSpecial: true, specialBlocked: p.specialBlocked });
        }
      }
      if (p.st >= 1.6) setState(p, 'idle');
    } else if (p.who === 'cardoso') {
      if (p.st >= 2.6) activateLimados(p);
    } else if (p.who === 'duda') {   // "CORAM DEO": vida dela e do time vai a 100% (no X1, só a dela)
      if (!p.sang && p.st >= 0.55) { p.sang = true; sfx('ora'); }
      if (!p.healed && p.st >= 2.4) {   // depois do close: +50% de vida
        p.healed = true; shake(2, 0.2); tone(1047, 0.4, 'triangle', 0.07); tone(1568, 0.5, 'triangle', 0.05, 0, 0.1);
        players.forEach(function (q) { if (q.dead || (versus && q !== p)) return; q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.5); burst('brilho', q.x, q.y, 60, 8); burst('coracao', q.x, q.y, 70, 3); });
        floatText(p.x, p.y - 96, versus ? '+50% HP' : 'TIME +50% HP', '#8dff9a');
      }
      if (p.st >= 2.7) setState(p, 'idle');
    } else if (p.who === 'lucas') {   // "PORCOS NA SALA!": depois do close os alvos ficam rodando e perdendo vida; ele já pode andar e bater
      if (!p.shout && p.st >= 0.5) { p.shout = true; sfx('grito'); }
      if (!p.spun && p.st >= 2.1) {
        p.spun = true; shake(4, 0.5); sfx('boom');
        enemies.forEach(function (e) { if (!e.dying && e.x > cam - 10 && e.x < cam + W + 10) { e.spinT = 3; e.spinBy = p; e.spinTick = 0; e.stun = Math.max(e.stun, 3); } });
        bosses.forEach(function (b) { if (b.dead || !(b.hp > 0) || b.vs === p) return; var tg = b.vs || b; tg.spinT = versus ? 1.268 : 3; tg.spinBy = p; tg.spinTick = 0; tg.specialBlocked = p.specialBlocked; });
        setState(p, 'idle');
      }
    } else if (p.who === 'arthur') {   // close na cara de bravo: 2 s de silêncio ("..."), a frase, e o time fica 3x mais rápido
      if (!p.said && p.st >= 2.1) { p.said = true; sfx('grito'); shake(2, 0.3); }
      if (p.st >= 4.3) {
        players.forEach(function (q) { if (q.dead || (versus && q !== p)) return; q.turbo = versus ? 2.8 : 8; burst('estrela', q.x, q.y, 40, 4); }); floatText(p.x, p.y - 84, versus ? '3X MAIS RÁPIDO!' : 'TIME 3X MAIS RÁPIDO!', '#9fd8ff');
        setState(p, 'idle');
      }
    } else if (p.who === 'fidelis') {
      // Seis passagens reais do baixo, seguidas da pancada final. O contador evita repetir dano.
      advanceFidelis(p,dt);
      while (p.fidHits < 7 && p.st >= (p.fidHits < 6 ? 0.30 + p.fidHits * 0.25 : 1.96)) {
        var finalHit = p.fidHits === 6;
        fidelisSweep(p, finalHit); p.fidHits++;
      }
      if (p.st >= 2.2) setState(p, 'idle');
    } else if (p.who === 'douglas') {   // "Dane-se, farmar Aaauuuraa!": close no rosto pegando fogo; depois todo monstro à vista queima
      if (!p.shout && p.st >= 0.8) { p.shout = true; sfx('grito'); shake(3, 0.5); }
      p.burnT -= dt;
      if (p.st > 2.1 && p.st < 3.7 && p.burnT <= 0) {
        p.burnT = versus ? 0.35 : 0.2; sfx('fogo');
        enemies.forEach(function (e) { if (!e.dying && e.x > cam - 10 && e.x < cam + W + 10) { hitEnemy(e, 5, 20 * (sign(e.x - p.x) || 1), p, { stun: 0.5 }); burst('brasa', e.x, e.y, 20, 3); } });
        bosses.forEach(function (b) { if (!b.dead && b.hp > 0 && b.vs !== p) { hitBoss(b, versus ? 4 : 6, p, true, p.specialBlocked); burst('brasa', b.x, b.y, 30, 4); } });
      }
      if (p.st >= 3.9) setState(p, 'idle');
    } else if (p.who === 'lohan') {   // super flash: três flashes estouram a tela, cegam e machucam todo monstro à vista
      if (p.flashes < 3 && p.st >= 0.5 + p.flashes * 0.45) {
        p.flashes++; flashT = 0.35; sfx('flash'); shake(2, 0.15);
        enemies.forEach(function (e) { if (!e.dying && e.x > cam - 10 && e.x < cam + W + 10) { hitEnemy(e, 10, 50 * (sign(e.x - p.x) || 1), p, { stun: 1.6 }); burst('brilho', e.x, e.y, 40, 2); zap(p, e.x, e.y - (e.h || 30) / 2); } });
        bosses.forEach(function (b) { if (!b.dead && b.hp > 0 && b.vs !== p) { hitBoss(b, versus ? 14 : 12, p, true, p.specialBlocked); zap(p, b.x, b.y - (b.h || 60) / 2); zap(p, b.x + rnd(-14, 14), b.y - (b.h || 60) * 0.7); } });
        for (var zi = 0; zi < 4; zi++) zap(p, cam + rnd(20, W - 20), rnd(TOP, BOT) - rnd(10, 40));   // choque solto pela tela
        if (p.flashes === 1) floatText(p.x, p.y - 100, 'SUPER FLASH!', '#fff27a');
      }
      if (p.st >= 1.9) setState(p, 'idle');
    } else if (p.who === 'rafinha') {   // "4, 4, 5, 6 e 1... CHUUUUVA DE PRAAATOOO!": conta no close e chove prato do céu
      if (p.count < 4 && p.st >= 0.25 + p.count * 0.2) { p.count++; tone(1400 - p.count * 60, 0.04, 'square', 0.08); noise(0.03, 0.1, 5000, 0, 'highpass'); }
      if (!p.shout && p.st >= 1.1) { p.shout = true; sfx('grito'); shake(3, 0.4); }
      p.beatT -= dt;
      if (p.st > 2.3 && p.st < 3.8 && p.beatT <= 0) {
        p.beatT = versus ? 0.16 : 0.08; p.beats++;
        if (p.beats % 3 === 1) { sfx('bumbo'); noise(0.2, 0.06, 6000, 0, 'highpass'); }
        var alvp = enemies.filter(function (e) { return !e.dying && e.x > cam - 10 && e.x < cam + W + 10; })
          .concat(bosses.filter(function (b) { return !b.dead && b.hp > 0 && b.vs !== p; }));
        var ap = alvp.length && Math.random() < 0.75 ? pick(alvp) : { x: cam + rnd(20, W - 20), y: rnd(TOP, BOT) };
        shots.push({ k: Math.random() < 0.5 ? 'crash' : 'ride', x: ap.x + rnd(-14, 14), y: clamp(ap.y + rnd(-6, 6), TOP, BOT), z: rnd(220, 300), vx: rnd(-30, 30), vy: 0, vz: -140,
          grav: 480, dmg: versus ? 6 : 8, knock: rnd(-50, 50), pierce: 2, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: 0, life: 4, hit: [], stun: 0.45,
          fromSpecial: true, specialBlocked: p.specialBlocked });
      }
      if (p.st >= 4.1) setState(p, 'idle');
    } else if (p.who === 'bispo') {   // "Vocês são INDESCULPÁVEIS!": grita no microfone e chove bola de fogo do céu
      if (!p.soloOn) { p.soloOn = true; sfx('grito'); shake(3, 0.4); floatText(cam + W / 2 + 50, p.y - 100, 'VOCÊS SÃO INDESCULPÁVEIS!', '#ffb340'); }
      p.fireT -= dt;
      if (p.st > 0.4 && p.st < (versus ? 2.0 : 2.2) && p.fireT <= 0.000001) {
        // Oito bolas precisas no X1: pressão consistente, sem quebrar uma guarda cheia sozinhas.
        p.fireT = versus ? 0.20 : 0.08;
        var alvf = enemies.filter(function (e) { return !e.dying && e.x > cam - 10 && e.x < cam + W + 10; })
          .concat(bosses.filter(function (b) { return !b.dead && b.hp > 0 && b.vs!==p; }));
        // No X1, não desperdiça a chuva no próprio Bispo nem em pontos vazios.
        var af = alvf.length && (versus || Math.random() < 0.75) ? pick(alvf) : { x: cam + rnd(20, W - 20), y: rnd(TOP, BOT) };
        // cai na diagonal (para onde ele aponta): sai do céu ~84 antes do alvo e chega nele em ~0,9 s
        shots.push({ k: 'fogo', boom: true, x: clamp(af.x - p.facing * 84 + rnd(versus?-4:-12, versus?4:12), cam - (versus?100:30), cam + W + (versus?100:30)), y: clamp(af.y + rnd(-6, 6), TOP, BOT),
          z: 280, vx: p.facing * 90, vy: 0, vz: -300, grav: 1, dmg: versus ? 7.1 : 8, knock: p.facing * 60, pierce: 99, owner: p,counterKnock:p.attackKnock||1,
          rot: Math.atan2(300, p.facing * 90), vr: 0, life: 3, hit: [], stun: 0.4,
          fromSpecial: true, specialBlocked: p.specialBlocked });
        if (Math.random() < 0.3) sfx('fogo');
      }
      if (p.st >= 2.6) setState(p, 'idle');
    } else if (p.who === 'naju') {   // grito no microfone: ondas de som atravessam a tela e atordoam todo mundo
      if (!p.soloOn) { p.soloOn = true; sfx('grito'); }
      p.ringT -= dt;
      if (p.st > 0.2 && p.st < 1.7 && p.ringT <= 0) {
        p.ringT = 0.22; shake(2.5, 0.12);
        rings.push({ x: p.x + p.facing * 14, y: p.y, z: p.z + 36, r: 8, owner: p,counterKnock:p.attackKnock||1, hit: [],
          fromSpecial: true, specialBlocked: p.specialBlocked });
      }
      if (p.st >= 1.9) setState(p, 'idle');
    } else if (p.who === 'pedro') {   // solo de teclado: raio arco-íris atravessa a tela na direção em que ele olha
      if (!p.soloOn) { p.soloOn = true; sfx('solo'); sfx('boom'); shake(3.8,0.18); }
      p.beamT -= dt;
      if (p.st > 0.45 && p.st < 1.65 && p.beamT <= 0) {
        p.beamT = 0.12; shake(1.5, 0.1);
        enemies.forEach(function (e) {
          if (!e.dying && (e.x - p.x) * p.facing > 0 && Math.abs(e.y - p.y) < 26) { hitEnemy(e, 7, 60 * p.facing, p, { stun: 0.3 }); burst('estrela', e.x, e.y, 24, 1); }
        });
        bosses.forEach(function (b) { if (!b.dead && b.hp > 0 && (b.x - p.x) * p.facing > 0 && Math.abs(b.y - p.y) < 40) hitBoss(b, versus ? 12 : 9, p, true, p.specialBlocked); });
      }
      if (p.st >= 1.9) setState(p, 'idle');
    } else if (p.who === 'enzo') {   // tempestade horizontal: de trás do Enzo para onde ele olha
      if (!p.soloOn) { p.soloOn = true; sfx('danca'); }
      p.noteT -= dt;
      if (p.st > 0.35 && p.st < 2.0 && p.noteT <= 0) {
        p.noteT = 0.07;
        var alvo = enemies.filter(function (e) { return !e.dying && e.x > cam - 10 && e.x < cam + W + 10 && (e.x - p.x) * p.facing >= 0; })
          .concat(bosses.filter(function (b) { return !b.dead && b.hp > 0 && b.vs !== p && (b.x - p.x) * p.facing >= 0; }));
        var a2 = alvo.length && Math.random() < 0.75 ? pick(alvo) : { y: p.y + rnd(-18, 18) };
        shots.push({ k: 'basquete', enzoRain: true, x: p.x - p.facing * 72, y: clamp(a2.y + rnd(-6, 6), TOP, BOT), z: rnd(20, 46), vx: p.facing * 520, vy: 0, vz: 0,
          grav: 0, dmg: 9, knock: rnd(-50, 50), pierce: 2, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: p.facing * 9, life: 1.5, hit: [], stun: 0.45,
          fromSpecial: true, specialBlocked: p.specialBlocked });
      }
      if (p.st >= 2.4) setState(p, 'idle');
    } else if (p.who === 'emanuelly') {
      var manuCfg=window.CreiaCombat.emanuelly;
      while(p.st>=p.manuRainAt && p.manuRainAt<manuCfg.rainEnd){rainEmanuelly(p);p.manuRainAt+=manuCfg.rainInterval;}
      if(p.st>=manuCfg.specialDuration)setState(p,'idle');
    } else {   // solo de guitarra: notas voam até ela e no fim vêm o escudo e o Hiper-Nutri
      if (!p.soloOn) { p.soloOn = true; sfx('solo'); }
      p.noteT -= dt;
      if (p.st > 0.15 && p.st < 1.25 && p.noteT <= 0) {
        p.noteT = 0.07;
        var tq = players.find(function (q) { return q.who === 'nutri' && !q.dead; });
        notes.push({ sx: p.x + p.facing * 6, sy: p.y, sz: 30, q: tq || null, u: 0, dur: tq ? 0.7 : 1, wob: rnd(0, 6),
          col: pick(['#ffe066', '#7dff8a', '#ff8fc0', '#9fd8ff']), dx: rnd(-30, 30) });
      }
      if (!p.soloDone && p.st >= 1.3) { p.soloDone = true; soloPower(p); }
      if (p.st >= 2.0) setState(p, 'idle');
    }
  }

  function tryPet(p) {
    if (!p || p.dead || !cat || cat.done || Math.abs(p.x - cat.x) > 80 || Math.abs(p.y - cat.y) > 50) return false;
    cat.done = true; cat.state = 'purr'; cat.st = 0;
    players.forEach(function (q, i) {
      var wasDead=q.dead;if (wasDead) revive(q, 0.15);
      setState(q, 'pet');
      var off = [-20, 20, -38, 38][i] || 30;   // até 4 em volta do gato
      q.x=cat.x+off;q.y=cat.y+2+(i===2?6:0);q.facing=off<0?1:-1;
      q.vx = q.vy = q.kx = 0; q.z = 0;
      if(!wasDead)q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.15);
    });
    burst('coracao', cat.x, cat.y, 20, 16);
    sfx('purr');
    floatText(cat.x, cat.y - 40, 'GATINHO: +15% DE VIDA', '#ffe066');
    return true;
  }

  function advanceFidelis(p,dt) {
    var rule=window.CreiaCombat.fidelis,dir=p.facing||1,old=p.x;
    var delta=rule.advanceAt(p.st)-rule.advanceAt(p.st-dt);
    if(delta<=0)return;
    var next=clamp(old+dir*delta,cam+12,cam+W-12);
    // O corpo empurra quem está à frente; guarda antecipada e canto impedem atravessar o rival.
    function contact(body,width,blocked){
      if(body.dead||body.dying||(body.z||0)>56||Math.abs(body.y-p.y)>22||(body.x-old)*dir<0)return;
      var gap=Math.min(44,12+width/2);
      if((body.x-next)*dir>=gap)return;
      if(!blocked)body.x=clamp(next+dir*gap,cam+12,cam+W-12);
      var limit=body.x-dir*gap;
      next=dir>0?Math.max(old,Math.min(next,limit)):Math.min(old,Math.max(next,limit));
    }
    enemies.forEach(function(e){contact(e,e.w||24,false);});
    bosses.forEach(function(b){if(b.vs!==p&&!b.dead&&b.hp>0){contact(b.vs||b,b.w||24,!!(b.vs&&p.specialBlocked));if(b.vs)b.x=b.vs.x;}});
    p.x=next;p.kx=0;p.vx=0;
  }

  function fidelisSweep(p, finalHit) {
    var damage=finalHit?20:5,knock=finalHit?200:5,kind=finalHit?'final':'spin';
    enemies.forEach(function(e){
      if(!e.dying && window.CreiaCombat.fidelis.contact(p,e,kind)){
        hitEnemy(e,damage,(sign(e.x-p.x)||p.facing)*knock,p,{stun:finalHit?.7:.22,launch:finalHit});
      }
    });
    bosses.forEach(function(b){
      if(!b.dead && b.hp>0 && b.vs!==p && window.CreiaCombat.fidelis.contact(p,b,kind))
        hitBoss(b,damage,p,true,p.specialBlocked,knock,p.x,false);
    });
    sfx(finalHit?'heavy':'bass');sfx('whoosh');
    if(finalHit){shake(4,.22);burst('estrela',p.x+p.facing*40,p.y,32,8);}
  }

  function fidelisStrike(p,a) {
    var count=0;
    enemies.forEach(function(e){if(!e.dying&&window.CreiaCombat.fidelis.contact(p,e,'strike')){hitEnemy(e,a.dmg,a.knock*p.facing,p,a);count++;}});
    bosses.forEach(function(b){if(!b.dead&&b.hp>0&&b.vs!==p&&window.CreiaCombat.fidelis.contact(p,b,'strike')){if(hitBoss(b,a.dmg,p,false,false,a.knock,p.x))count++;}});
    sfx(count?'bass':'miss');if(count){shake(1.8,.08);burst('estrela',p.x+p.facing*48,p.y,p.z+12,3);}
    return count;
  }

  function meleeHit(p, a) {
    if(p.who==='fidelis'&&p.state==='attack2')return fidelisStrike(p,a);
    var n = 0, hx = p.x + p.facing * a.reach * 0.5, hz = p.z + 22;
    enemies.forEach(function (e) {
      if (e.dying) return;
      var dx = (e.x - p.x) * p.facing;
      if (dx > -6 && dx < a.reach + e.w * 0.5 && Math.abs(e.y - p.y) < 16 && hz >= e.z - 6 && hz <= e.z + e.h + 10) {
        hitEnemy(e, a.dmg, a.knock * p.facing, p, a);
        if (a.flingEdge && !e.dying) {
          e.edgeFly = { from:e.x, to:p.facing > 0 ? cam + W - e.w / 2 - 12 : cam + e.w / 2 + 12, t:0 };
          e.kx = 0; e.stun = Math.max(e.stun, 2);
        }
        n++;
      }
    });
    bosses.forEach(function (b) {
      if (b.dead || !(b.hp > 0)) return;
      var reachTol = (versus && p.idx === 1 && online && online.host) ? 22 : 0;
      if (Math.abs(hx - b.x) < b.w / 2 + a.reach * 0.5 + reachTol && Math.abs(b.y - p.y) < 26 && hz >= b.z - 10 && hz <= b.z + b.h + 10) {
        var dmg = a.dmg;
        if(versus&&p.who==='lutador')dmg*=window.CreiaCombat.primary.lutador[2]/window.CreiaCombat.primary.lutador[3];
        if (versus && p.who !== 'lutador') {
          dmg = Math.max(a.dmg, 12);
        }
        var hitOk=hitBoss(b, dmg, p, false, false, a.knock || 60, p.x);
        if (a.flingEdge && hitOk && b.vs && b.vs !== p && !b.vs.dead) {
          b.vs.edgeFly = { from:b.vs.x, to:p.facing > 0 ? cam + W - 12 : cam + 12, t:0 };
          b.vs.edgeStun = 0.95; b.vs.kx = 0;
        } else if (a.flingEdge && !b.vs) b.x = clamp(b.x + p.facing * 18, cam + b.w / 2, cam + W - b.w / 2);
        n++;
      }
    });
    if (n) { sfx('hit'); shake(1.5, 0.06); burst('estrela', hx, p.y, hz, 3); }else sfx('miss');
    return n;
  }
  function hitEnemy(e, dmg, kvx, p, o) {
    o = o || {};
    if(p&&!o.fromSpecial)kvx*=o.owner?(o.counterKnock||1):(p.attackKnock||1);
    if (e.dying) return;
    if (e.guard) {
      if (o.breaker) {
        e.guardHp -= dmg; e.blockT = 0.3;
        if (e.guardHp > 0) { floatText(e.x, e.y - e.h - 6, 'TOC!', '#dddddd'); burst('estrela', e.x, e.y, 30, 2); sfx('block'); e.kx = kvx * 0.3; return; }
        e.guard = false; e.stun = 1.2; floatText(e.x, e.y - e.h - 6, 'QUEBROU!', '#ffd34d'); sfx('break');
        burst('gordura', e.x, e.y, 30, 8);
      } else {
        dmg = 1; e.blockT = 0.4;
        if (Math.random() < 0.25) floatText(e.x, e.y - e.h - 6, 'BLINDADO!', '#cccccc');
        sfx('block');
      }
    }
    impactAt(e.x,e.y,e.z+e.h*.6,e.guard?'block':'hit',!e.guard&&dmg>=12,!o.owner&&p&&p.state!=='special');
    e.hp -= dmg; e.flash = 0.12; e.stun = Math.max(e.stun, o.stun || 0.25);
    if (e.state === 'attack') { e.state = 'walk'; e.st = 0; }
    e.kx = kvx; if (o.launch) e.vz = 170;
    addScore(dmg * 10); bumpCombo();
    if (p)addSpecialEnergy(p,dmg*.5*(p.who==='lutador'?1.7:1));   // Marcos bate de perto: enche mais rápido
    if (e.hp <= 0) {
      e.dying = true; e.dieT = 0; e.state = 'ko'; e.vz = 150; e.kx = kvx * 1.4 || 60;
      addScore(EN[e.kind].score); sfx('kill');
      burst('estrela', e.x, e.y, e.h / 2, 6);
      if (e.kind === 'batata' || e.kind === 'gordura') burst('gordura', e.x, e.y, e.h / 2, 4);
    }
  }
  function hitBoss(b, dmg, p, isSpecial, specialBlocked, knockDist, fromX, projectile, counterKnock) {
    if (b.dead || !(b.hp > 0)) return false;
    if (b.transT > 0) { sfx('block'); return false; }
    if (b.vs) {   // X1: acerta o adversário (nunca a si mesmo)
      var spc = !!isSpecial;
      var blk = specialBlocked !== undefined ? !!specialBlocked : (p && !!p.specialBlocked);
      var kMag = knockDist !== undefined ? Math.abs(knockDist) : 60;
      if(!spc)kMag*=projectile?(counterKnock||1):(p&&p.attackKnock||1);
      var srcX = fromX != null ? fromX : (p ? p.x : b.x);
      if (p && p !== b.vs && damagePlayer(b.vs, dmg * VSK, kMag, srcX, 'versus', p, spc, blk, projectile)) {
        addSpecialEnergy(p,dmg*(p.who==='duda'&&versus?.16:p.who==='nutri'&&versus?.35:.5)*(p.who==='lutador'?(versus?.8:1.7):1)); sfx('hit');
        return true;
      }
      return false;
    }
    var d = dmg * (1 - clamp(b.armor || 0, 0, 0.95));
    impactAt(b.x,b.y,(b.z||0)+b.h*.6,'hit',d>=12,!isSpecial&&!projectile);
    b.hp = Math.max(0, b.hp - d); b.flash = 0.1;
    var sfCfg = (typeof window !== 'undefined' && window.CreiaCombat && window.CreiaCombat.segundaForma) || { limite: 0.5, velocidade: 1.25, dano: 1.15, cena: 1.5 };
    if (b.hp > 0 && b.forma !== 2 && b.hp <= b.maxHp * sfCfg.limite) {
      b.forma = 2; b.transT = sfCfg.cena;
      if (typeof window !== 'undefined' && window.SegundaForma && typeof window.SegundaForma.inicio === 'function') {
        try { window.SegundaForma.inicio(b); } catch (err) {}
      }
    }
    try { if (b.onHit) b.onHit(d, p ? p.x : b.x); } catch (e) { /* chefe com onHit quebrado não derruba o jogo */ }
    addScore(d * 10); bumpCombo();
    if(p)addSpecialEnergy(p,d*.35*(p.who==='lutador'?1.7:1));
    sfx('boss_hit');
    if (b.hp <= 0 && !b.scored) { b.scored = true; addScore(2000 * stage); shake(4, 0.4); }
  }

  function updatePlayer(p, dt) {
    updateVirada(p);
    var c = p.ctrl;
    p.tauntCd=Math.max(0,(p.tauntCd||0)-dt);
    p.contraT=Math.max(0,(p.contraT||0)-dt);
    var wasStunned=p.perfectStunT>0;p.perfectStunT=Math.max(0,(p.perfectStunT||0)-dt);
    if(wasStunned&&!p.perfectStunT&&p.state==='hurt'&&!p.dead&&!p.spLocked)setState(p,'idle');
    if(p.perfectStunT>0){c={x:0,y:0};p.st=0;}
    if(versus){p.y=VS_Y;p.vy=0;c.y=0;}
    p.airThrowT=Math.max(0,(p.airThrowT||0)-dt);
    if (versus && p.spLocked) {
      var caster = p.spLockedBy;
      if (caster && isDamagingSpecialActive(caster) && !p.dead && (!vsRound || vsRound.phase === 'fight')) {
        p.vx = 0; p.vy = 0; p.kx = 0;
        if (p.spLockedBlocked && p.guardCd<=0 && p.guardHp>0) {
          if(p.state!=='guard')setState(p,'guard');
          p.guardT = 0.5;
          c = { x: 0, y: 0, atk: false, jump: false, spc: false, alt: false, use: true };
        } else {
          if (p.state === 'guard') setState(p,'idle');
          p.guardT = 0;
          c = { x: 0, y: 0, atk: false, jump: false, spc: false, alt: false, use: false };
        }
      } else {
        p.spLocked = false;
        p.spLockedBy = null;
        if (p.spLockedBlocked) {
          p.spLockedBlocked = false;
          if (p.state === 'guard') { setState(p,'idle'); p.guardT = 0; }
        }
      }
    }
    p.st += dt; p.inv = Math.max(0, p.inv - dt); p.flash = Math.max(0, p.flash - dt);
    p.limadoT = Math.max(0, (p.limadoT || 0) - dt); p.limadoMsgT = Math.max(0, (p.limadoMsgT || 0) - dt);
    p.guardFlash = Math.max(0, (p.guardFlash || 0) - dt);
    if (p.guardCd > 0) p.guardCd = Math.max(0, p.guardCd - dt);
    if(versus){p.guardQuiet=(p.guardQuiet||0)+dt;if(p.guardCd<=0&&p.guardQuiet>(c.use?.9:.25))p.guardHp=Math.min(100,(p.guardHp==null?100:p.guardHp)+dt*(c.use?18:30));}
    if (p.state === 'walk') p.walkT = (p.walkT || 0) + dt;   // relógio da passada: não zera ao parar e voltar a andar
    var tb = p.turbo > 0 ? 3 : 1; if (p.turbo > 0) p.turbo -= dt;   // "vá estudar um pouquinho": 3x mais rápido
    p.cd -= dt * tb; p.altCd -= dt * tb; p.slow -= dt; p.slip -= dt;
    p.shield = Math.max(0, p.shield - dt); p.hyper = Math.max(0, p.hyper - dt);
    p.kx *= Math.exp(-8 * dt);
    if (p.dead) {
      p.koT += dt;
      p.vz -= GRAV * dt; p.z = Math.max(0, p.z + p.vz * dt); if (p.z === 0) p.vz = 0;
      p.x = clamp(p.x + p.kx * dt, cam + 12, cam + W - 12);
      var mate = partnerOf(p);
      if (p.koT > 8 && players.some(function (q) { return q !== p && !q.dead; })) revive(p, 0.5);
      return;
    }
    if(p.who==='ricardo'&&p.state==='roll'){p.kx=0;p.z=0;p.vz=0;p.x=clamp(p.x+p.facing*300*dt,cam+12,cam+W-12);ricardoHit(p,versus?window.CreiaCombat.secondary.ricardo[1]:14,26,65,p.rcHits);if(p.st>=0.55)setState(p,'idle');return;}
    if (p.edgeFly) {
      var ef=p.edgeFly, eu=clamp((ef.t+=dt)/0.42,0,1), ee=eu*eu*(3-2*eu);
      p.x=ef.from+(ef.to-ef.from)*ee; p.z=Math.sin(eu*Math.PI)*45; p.kx=0;
      if (eu>=1) { p.edgeFly=null; p.z=0; }
      return;
    }
    addSpecialEnergy(p,dt*(versus&&p.who==='duda'?.7:1.5));
    if (phase === 'clear') { if (p.state !== 'victory' && p.z === 0) setState(p, 'victory'); c = { x: 0, y: 0 }; }

    if (p.state === 'taunt') {
      p.vx=p.vy=p.vz=p.kx=0;p.z=0;
      if (p.st + 1e-9 >= window.CreiaCombat.provocacao.duracao) {
        p.sp=Math.min(100,p.sp+window.CreiaCombat.provocacao.ganho);setState(p,'idle');
      }
      return;
    }
    if (c.taunt && canTaunt(p)) {
      setState(p,'taunt');p.tauntCd=window.CreiaCombat.provocacao.recarga;
      p.tauntFala=window.Bordoes ? Bordoes.fala(p.who,tauntRival(p)) : '!!';
      p.inv=0;p.guardT=0;p.vx=p.vy=p.vz=p.kx=0;sfx('throw');return;
    }

    if (p.state === 'hurt' && !p.perfectStunT && p.st >= (p.edgeStun || 0.3)) { p.edgeStun=0; setState(p, 'idle'); }
    if (p.state === 'pet' && p.st >= 2.4) setState(p, 'idle');
    // defesa (versus): enquanto c.use estiver mantido, o escudo permanece ativo
    if (p.state === 'guard') {
      p.guardT = 0.5;
      if (!c.use) { p.guardT = 0; setState(p, 'idle'); }
    }
    if (p.state === 'special') updateSpecial(p, dt);

    var nutriThrow = p.who !== 'lutador' && p.who !== 'fidelis' && p.state === 'throw';
    var free = p.state === 'idle' || p.state === 'walk' || p.state === 'jump' || p.state === 'jumpkick' || nutriThrow;
    var ground = p.state === 'idle' || p.state === 'walk' || nutriThrow;
    if(online&&online.coop&&ground&&p.z===0&&(c.atk||c.use)&&tryPet(p))return;
    var mx = free ? c.x : 0, my = free ? c.y : 0;
    if (free && Math.abs(mx) > 0.2) p.facing = sign(mx);
    if (free && c.face) p.facing = c.face;

    if (c.jump && ground && p.z === 0) { p.vz = versus?390:310; setState(p, 'jump'); sfx('jump'); }
    if (c.atk) {
      if (p.who === 'lutador') {
        if (p.state === 'jump' && p.z > 4) { armCounter(p);setState(p, 'jumpkick'); sfx('whoosh'); }
        else if (ground) {armCounter(p);startAtk(p, 'attack1');}
        else if (/^attack[12]$/.test(p.state) && p.st > 0.05) p.queue = true;
      } else if (p.cd <= 0 && free && !(p.who==='naju'&&p.micOut)) {
        armCounter(p);
        if(p.who==='ricardo'){setState(p,'attack1');p.cd=window.CreiaCombat.primaryCooldown(p.who,versus);sfx('whoosh');}
        else if(p.who==='douglinhas'){kickDouglinhas(p);p.cd=window.CreiaCombat.primaryCooldown(p.who,versus);if(p.z===0)setState(p,'throw');}
        else if(p.who==='th'){shootTh(p,false);p.cd=window.CreiaCombat.primaryCooldown(p.who,versus);if(p.z===0)setState(p,'throw');}
        else if (p.who === 'cardoso') { if (p.z === 0) startAtk(p, 'attack1'); slapWave(p); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); }
        else if(p.who==='emanuelly'){shootEmanuelly(p,false);p.cd=window.CreiaCombat.primaryCooldown(p.who,versus);if(p.z===0)setState(p,'throw');}
        else if (p.who!=='fidelis' && p.z === 0 && enemyInFront(p, 22)) startAtk(p, 'attack1');

        else if (p.who === 'enzo') { throwBall(p, false); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); if (p.z === 0) setState(p, 'throw'); }
        else if (p.who === 'pedro') { shootNote(p); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); if (p.z === 0) setState(p, 'throw'); }
        else if (p.who === 'naju') { if (!p.micOut) { throwMic(p); setState(p, 'throw'); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); } }
        else if (p.who === 'grazi') { shootGlue(p); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); if (p.z === 0) setState(p, 'throw'); }
        else if (p.who === 'bispo') { throwBible(p); if(p.z>0)p.airThrowT=0.2; p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); if (p.z === 0) setState(p, 'throw'); }
        else if (p.who === 'duda') { singShock(p); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); if (p.z === 0) setState(p, 'throw'); }
        else if (p.who === 'lucas') { throwMicreia(p); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); if (p.z === 0) setState(p, 'throw'); }
        else if (p.who === 'arthur') { singWave(p); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); if (p.z === 0) setState(p, 'throw'); }
        else if (p.who === 'fidelis') { setState(p, 'throw'); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); }
        else if (p.who === 'douglas') { shootClave(p); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); if (p.z === 0) setState(p, 'throw'); }
        else if (p.who === 'lohan') { if (p.z === 0) startAtk(p, 'attack1'); flashShot(p); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); sfx('flash'); }
        else if (p.who === 'rafinha') { throwCymbal(p); if(p.z>0)p.airThrowT=0.2; p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); if (p.z === 0) setState(p, 'throw'); }
        else if (p.who === 'adriene') { throwBrigadeiro(p); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); if (p.z === 0) setState(p, 'throw'); }
        else { throwFood(p); p.cd=window.CreiaCombat.primaryCooldown(p.who,versus); if (p.z === 0) setState(p, 'throw'); }
        p.cd*=p.attackCdMult;
      }
    }
    if (c.alt && p.altCd <= 0 && ground && !(p.who==='naju'&&p.micOut)) {
      armCounter(p);
      if(p.who==='ricardo'){setState(p,'roll');p.rcHits=[];p.altCd=2.4;p.kx=0;sfx('dash');}
      else if(p.who==='douglinhas'){setState(p,'attack2');p.altCd=1.0;sfx('whoosh');}
      else if(p.who==='th'){shootTh(p,true);p.altCd=0.9;setState(p,'throw');}
      else if (p.who === 'lutador') { setState(p, 'throw'); p.altCd = 0.9 / 1.15; sfx('whoosh'); }
      else if(p.who==='emanuelly'){shootEmanuelly(p,true);p.altCd=window.CreiaCombat.secondaryCooldown(p.who,versus);setState(p,'attack2');}
      else if (p.who === 'enzo') { throwBall(p, true); p.altCd = 0.6; setState(p, 'throw'); }
      else if (p.who === 'naju') { if (!p.micOut) { setState(p, 'attack2'); p.spinHits = 0; p.altCd = 0.7; sfx('whoosh'); } }
      else if (p.who === 'grazi') { setState(p, 'attack2'); p.spinHits = 0; p.altCd = 1.1; sfx('furacao'); }
      else if (p.who === 'bispo') { setState(p, 'pray'); p.prayed = false; p.altCd = versus ? 3.0 : 1.2; }
      else if (p.who === 'duda') { setState(p, 'fashion'); p.posed = false; p.altCd = 30; }   // pose fashion: +30 HP, só de novo em 30 s
      else if (p.who === 'lucas') { startAtk(p, 'fralda'); p.altCd = 0.8; }   // fralda cagada: joga o monstro longe
      else if (p.who === 'cardoso') { startAtk(p, 'barriga'); p.altCd = 1.0; }
      else if (p.who === 'arthur') { setState(p, 'eat'); p.ate = false; p.altCd = versus ? 9.2 : 9; }   // bolo: +20 HP, demora para comer de novo
      else if (p.who === 'fidelis') { startAtk(p, 'attack2'); p.altCd = window.CreiaCombat.secondaryCooldown(p.who,versus); sfx('whoosh'); }
      else if (p.who === 'douglas') { setState(p, 'lanca'); p.thrown = false; p.altCd = 0.9; }
      else if (p.who === 'lohan') { launchDrone(p); setState(p, 'throw'); p.altCd = 0.9; }
      else if (p.who === 'rafinha') { setState(p, 'dash'); p.inv = Math.max(p.inv, 0.4); p.altCd = 0.7; sfx('dash'); }
      else if (p.who === 'pedro') { firePedro12(p); setState(p, 'attack2'); p.altCd = window.CreiaCombat.secondaryCooldown(p.who,versus); }
      else if (p.who === 'adriene') { startAtk(p, 'attack2'); p.altCd = 1; }   // colher de pau
      else if (p.who === 'nutri') { startAtk(p, 'attack2'); p.altCd = 1; }   // pancada com a xícara de café
      else { startAtk(p, 'attack1'); p.altCd = 0.3; }
      if(p.altCd>0)p.altCd=window.CreiaCombat.secondaryCooldown(p.who,versus)*p.attackCdMult;
    }
    if (c.spc && p.sp >= 100 && ground) startSpecial(p);
    if (c.use && ground && versus && p.guardCd <= 0 && p.guardHp>0 && p.state !== 'guard') {
      p.guardT = 0.5; p.guardCd = 0; setState(p, 'guard'); sfx('guard_up');
    }
    if (c.use && ground && !versus) tryPet(p);

    var a = ATK[p.who][p.state];
    if (a && a.dur) {
      if (!p.hitDone && p.st >= a.hitAt) { p.hitDone = true; meleeHit(p, a); }
      if (p.st >= Math.max(a.hitAt,a.dur*(p.attackCdMult||1))) { if (p.queue && a.next) {armCounter(p);startAtk(p, a.next);} else setState(p, 'idle'); }
    }
    if(p.who==='ricardo'&&p.state==='attack1'){if(!p.hitDone&&p.st>=0.1){p.hitDone=true;ricardoHit(p,window.CreiaCombat.primary.ricardo[versus?2:3],48,75);}if(p.st>=0.36)setState(p,'idle');}
    if(p.who==='douglinhas' && p.state==='attack2'){if(!p.hitDone && p.st>=0.12){p.hitDone=true;slapDouglinhas(p);}if(p.st>=0.45)setState(p,'idle');}
    if (p.who === 'grazi' && p.state === 'attack2') {   // furacão: gira 0,7 s acertando 4 vezes quem estiver em volta
      if (p.spinHits < 4 && p.st >= 0.08 + p.spinHits * 0.16) {
        p.spinHits++;
        enemies.forEach(function (e) { if (!e.dying && Math.abs(e.x - p.x) < 50 + e.w / 2 && Math.abs(e.y - p.y) < 22) { hitEnemy(e, 6, (sign(e.x - p.x) || 1) * (p.spinHits === 4 ? 200 : 40), p, { stun: 0.4, launch: p.spinHits === 4 }); burst('estrela', e.x, e.y, 30, 2); } });
        bosses.forEach(function (b) { if (!b.dead && b.hp > 0 && Math.abs(b.x - p.x) < 50 + b.w / 2 && Math.abs(b.y - p.y) < 32) hitBoss(b, 6, p); });
      }
      p.kx = p.facing * 40;
      if (p.st >= 0.72) setState(p, 'idle');
    }
    if (p.who === 'duda' && p.state === 'fashion') {
      if (!p.posed && p.st >= 0.3) { p.posed = true; p.hp = Math.min(p.maxHp, p.hp + 30); floatText(p.x, p.y - 84, '+30 HP', '#ff8fc0'); burst('brilho', p.x, p.y, 50, 6); tone(1047, 0.12, 'triangle', 0.07); tone(1319, 0.18, 'triangle', 0.06, 0, 0.1); }
      if (p.st >= 0.9) setState(p, 'idle');
    }
    if (p.who === 'arthur' && p.state === 'eat') {
      if (!p.ate && p.st >= 0.6) { p.ate = true; p.hp = Math.min(p.maxHp, p.hp + 20); floatText(p.x, p.y - 84, '+20 HP', '#8dff9a'); tone(660, 0.1, 'triangle', 0.08); tone(880, 0.15, 'triangle', 0.08, 0, 0.1); }
      if (p.st >= 1.1) setState(p, 'idle');
    }
    if (p.who === 'douglas' && p.state === 'lanca') {   // arremesso: o cavaquinho sai no meio do movimento
      if (!p.thrown && p.st >= 0.1) { p.thrown = true; throwCavaco(p); }
      if (p.st >= 0.34) setState(p, 'idle');
    }
    if (p.who === 'rafinha' && p.state === 'dash') {   // dash: dispara para a frente e nada acerta ele enquanto dura
      p.kx = p.facing * 420; p.inv = Math.max(p.inv, 0.05);
      if (p.st >= 0.28) { setState(p, 'idle'); p.kx = p.facing * 60; }
    }
    if (p.who === 'bispo' && p.state === 'pray') {   // oração: +5 de HP para cada um do time que está de pé
      if (!p.prayed && p.st >= 0.45) {
        p.prayed = true; sfx('ora');
        players.forEach(function (q) { if (q.dead || (versus && q !== p)) return; q.hp = Math.min(q.maxHp, q.hp + 5); burst('brilho', q.x, q.y, 60, 3); floatText(q.x, q.y - 84, '+5 HP', '#8dff9a'); });
      }
      if (p.st >= 0.9) setState(p, 'idle');
    }
    if (p.who === 'naju' && p.state === 'attack2') {
      if ((p.spinHits === 0 && p.st >= 0.1) || (p.spinHits === 1 && p.st >= 0.28)) {
        p.spinHits++; sfx('whoosh');
        enemies.forEach(function (e) { if (!e.dying && Math.abs(e.x - p.x) < 46 + e.w / 2 && Math.abs(e.y - p.y) < 18) { hitEnemy(e, 9, sign(e.x - p.x) * 120 || 120, p, { stun: 0.5 }); burst('estrela', e.x, e.y, 30, 2); } });
        bosses.forEach(function (b) { if (!b.dead && b.hp > 0 && Math.abs(b.x - p.x) < 46 + b.w / 2 && Math.abs(b.y - p.y) < 30) hitBoss(b, versus ? 8.7 : 9, p); });
      }
      if (p.st >= 0.45) setState(p, 'idle');
    }
    if(p.who==='pedro' && p.state==='attack2' && p.st>=.34)setState(p,'idle');
    if(p.who==='emanuelly'&&p.state==='attack2'&&p.st>=window.CreiaCombat.emanuelly.secondaryDuration)setState(p,'idle');
    if (p.state === 'jumpkick' && !p.hitDone && p.st > 0.04 && meleeHit(p,ATK.lutador.jumpkick)) p.hitDone = true;
    if (p.state === 'throw') {
      if (p.who === 'fidelis') {
        if(!p.thrown&&p.st>=window.CreiaCombat.fidelis.throwRelease){p.thrown=true;throwControle(p,false);}
        if(p.st>=window.CreiaCombat.fidelis.throwDuration)setState(p,p.z>0?'jump':'idle');
      } else if (p.who === 'lutador') {
        if (!p.thrown && p.st >= 0.12 / 1.15) { p.thrown = true; throwDumbbell(p); }
        if (p.st >= 0.32 / 1.15) setState(p, 'idle');
      } else if (p.st >= 0.2 && !(p.who === 'naju' && p.micOut)) setState(p, 'idle');
    }

    // Hiper-Nutri: chuva de frutas em 360 graus enquanto o escudo dele está de pé
    if (p.who === 'nutri' && p.hyper > 0 && shieldActive()) {
      p.hyperT -= dt;
      while (p.hyperT <= 0) {
        p.hyperT += 0.05; p.hyperA += 0.55;
        for (var s = 0; s < 2; s++) {
          var ang = p.hyperA + s * Math.PI;
          shots.push({ k: pick(FOODS), x: p.x, y: p.y, z: p.z + 24, vx: Math.cos(ang) * 230, vy: Math.sin(ang) * 110,
            vz: 0, grav: 0, dmg: 5, knock: Math.cos(ang) * 60, pierce: 1, owner: p,counterKnock:p.attackKnock||1, rot: 0, vr: 12, life: 1.5, hit: [], stun: 0.15 });
        }
        if (Math.random() < 0.3) sfx('throw');
      }
    }

    var spd = (p.who === 'lutador' ? 92 : p.who === 'emanuelly' ? 97 : 100) * (p.slow > 0 ? 0.5 : 1) * (c.run ? 1.35 : 1) * (p.turbo > 0 ? 3 : 1);
    var tvx = mx * spd + p.kx, tvy = my * spd * 0.62;
    if (p.slip > 0) { var f = Math.min(1, dt * 2.5); p.vx += (tvx - p.vx) * f; p.vy += (tvy - p.vy) * f; }
    else { p.vx = tvx; p.vy = tvy; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vz -= GRAV * dt; p.z += p.vz * dt;
    if (p.z <= 0) {
      p.z = 0;
      if (p.vz < 0) { p.vz = 0; if (p.state === 'jump' || p.state === 'jumpkick') setState(p, 'idle'); }
    }
    p.y = versus?VS_Y:clamp(p.y, TOP, BOT); p.x = clamp(p.x, cam + 12, cam + W - 12);
    if (p.state === 'idle' && (mx || my)) setState(p, 'walk');
    else if (p.state === 'walk' && !mx && !my) setState(p, 'idle');
    for (var i = 0; i < puddles.length; i++) {
      var pd = puddles[i];
      if (Math.abs(p.x - pd.x) < pd.w / 2 && Math.abs(p.y - pd.y) < 6 && p.z === 0) p.slip = 0.5;
    }
  }

  function tauntRival(p) {
    var list=versus ? players.filter(function(q){return q!==p&&!q.dead;}) :
      enemies.filter(function(e){return !e.dying&&e.hp>0;}).concat(bosses.filter(function(b){return !b.dead&&b.hp>0;}));
    list.sort(function(a,b){return Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y);});
    return list[0] && (list[0].who || list[0].kind);
  }
  function canTaunt(p) {
    return zoaOn() && !p.dead && (p.state==='idle'||p.state==='walk') && p.z===0 && !(p.tauntCd>0) &&
      !(p.perfectStunT>0) && !p.spLocked && !(p.spinT>0) && !(p.brigT>0) && !p.edgeFly &&
      phase!=='clear' && !bossIntro && (!versus || vsRound && vsRound.phase==='fight');
  }
  function aiTaunt(p,dt,targets) {
    p.aiTauntWait=(p.aiTauntWait||0)-(dt||1/60);
    if(p.aiTauntWait>0)return false;
    var cfg=window.CreiaCombat.provocacao;p.aiTauntWait=cfg.intervaloIA;
    if(!canTaunt(p)||p.sp>100-cfg.ganho||!targets.length||targets.some(function(t){
      return Math.hypot(t.x-p.x,t.y-p.y)<cfg.distanciaIA;
    }))return false;
    // Sorteio próprio: a resenha não consome o aleatório dos golpes do motor.
    p.aiTauntSeed=(Math.imul(p.aiTauntSeed||1,1664525)+1013904223)>>>0;
    return p.aiTauntSeed/4294967296<cfg.chanceIA;
  }

  // ---------- IA do parceiro (modo 1 jogador) ----------
  function aiControl(p,dt) {
    var targets=enemies.filter(function(e){return !e.dying&&e.hp>0;}).concat(bosses.filter(function(b){return !b.dead&&b.hp>0&&b.vs!==p;}));
    if(aiTaunt(p,dt,targets))return {x:0,y:0,taunt:true};
    var target=targets.sort(function(a,b){return Math.abs(a.x-p.x)+Math.abs(a.y-p.y)*2-Math.abs(b.x-p.x)-Math.abs(b.y-p.y)*2;})[0];
    if(!target||!window.CreiaBrains)return aiControlThink(p);
    var cfg=window.CreiaCombat,level=p.aiLevel||'medio';p.aiWait=(p.aiWait||0)-(dt||1/60);
    if(p.aiWait>0&&p.aiInput)return Object.assign({},p.aiInput,{atk:false,alt:false,spc:false,jump:false});
    var lvlCfg=typeof level==='number'?(cfg.levelAt?cfg.levelAt(level):(level<0.4?cfg.levels.facil:level<0.85?cfg.levels.medio:cfg.levels.dificil)):(cfg.levels[level]||cfg.levels.medio);
    p.aiWait=lvlCfg.think;
    var foe=target.vs||target,dir=target.x>=p.x?1:-1,range=cfg.primaryRange(p.who),meta=cfg.secondary[p.who];
    // Fidelis alterna controle e baixo: aproxima a IA para conseguir usar os golpes novos.
    if(p.who==='fidelis')range=Math.min(range,120);
    var incoming=versus&&shots.some(function(s){return s.owner!==p&&(p.x-s.x)*s.vx>0&&Math.abs(s.x-p.x)<160&&Math.abs(s.y-p.y)<25&&Math.abs(s.z-p.z)<80;})||eshots.some(function(s){return (p.x-s.x)*s.vx>0&&Math.abs(s.x-p.x)<150&&Math.abs(s.y-p.y)<25;});
    var impactIn=Infinity;
    if(versus){
      shots.forEach(function(s){if(s.owner!==p&&!s.fromSpecial&&(p.x-s.x)*s.vx>0&&Math.abs(s.y-p.y)<25&&Math.abs(s.z-p.z)<80)impactIn=Math.min(impactIn,Math.abs((p.x-s.x)/s.vx));});
      var attack=ATK[foe.who]&&ATK[foe.who][foe.state],hitAt=attack&&attack.hitAt;
      if(foe.who==='ricardo'&&foe.state==='attack1')hitAt=.1;
      if(hitAt!=null&&!foe.hitDone&&Math.abs(target.x-p.x)<100)impactIn=Math.min(impactIn,Math.max(0,hitAt-foe.st));
    }
    var aiGround=p.state==='idle'||p.state==='walk'||p.state==='throw'&&p.who!=='lutador',aiPrimary=aiGround||p.state==='jump'||p.state==='jumpkick'||p.who==='lutador'&&/^attack[12]$/.test(p.state)&&p.st>.05;
    var observation={time:time,hp:p.hp/p.maxHp,sp:aiGround?p.sp:0,direction:dir,distance:Math.abs(target.x-p.x),aligned:Math.abs(target.y-p.y)<20,yDirection:sign(target.y-p.y),horizontal:versus,
      melee:p.who==='lutador'||p.who==='ricardo',range:range,primaryReady:aiPrimary&&p.cd<=0,altReady:aiGround&&p.altCd<=0,altRange:meta[2],secondaryMelee:meta[2]<=60||p.who==='fidelis'||p.who==='emanuelly',mobilitySecondary:p.who==='rafinha',support:['bispo','arthur','duda'].indexOf(p.who)>=0,healSpecial:p.who==='nutri'||p.who==='duda',
      canGuard:versus&&(aiGround||p.state==='guard')&&p.z===0&&p.guardCd<=0&&p.guardHp>=16,canJump:p.z===0&&(p.state==='idle'||p.state==='walk'||p.state==='throw'),cornered:versus&&(dir>0?p.x<cam+60:p.x>cam+W-60),foeProtected:foe.shield>0||foe.limadoT>0,foeGuard:foe.state==='guard'||!!foe.guard,foeInv:foe.inv>0||foe.shield>0,foeRecovering:foe.state==='hurt'||foe.cd>.3,threat:incoming||Math.abs(target.x-p.x)<100&&(foe.state==='warn'||foe.state==='attack'||/^attack/.test(foe.state)||foe.state==='special'),intent:p.jevUntil>time?p.jevIntent:null};
    observation.impactIn=impactIn;observation.perfectThreat=Number.isFinite(impactIn);observation.perfectReady=time-p.guardEndT>=cfg.perfeita.descanso;observation.counterReady=p.contraT>0;
    var brainLvl=typeof level==='number'&&(!cfg.levelAt)?(level<0.4?'facil':level<0.85?'medio':'dificil'):level;
    p.aiMemory=p.aiMemory||{};p.aiInput=window.CreiaBrains.decide(observation,p.aiMemory,brainLvl);return p.aiInput;
  }
  function aiControlThink(p) {
    var c = { x: 0, y: 0, atk: false, jump: false, spc: false, alt: false, use: false, face: 0 };
    if (p.dead || phase === 'clear') return c;
    hazards.forEach(function (h) {   // pula pneu e onda de choque
      if (h.warn > 0 || p.z > 0) return;
      if (h.k === 'pneu' && Math.abs(p.y - h.y) < 10 && (p.x - h.x) * sign(h.vx) > 0 && Math.abs(p.x - h.x) < 36) c.jump = true;
      if (h.k === 'onda') { var d = Math.hypot(p.x - h.x, (p.y - h.y) / 0.35); if (d - h.r > 6 && d - h.r < 34) c.jump = true; }
    });
    if (c.jump) return c;
    var mate = partnerOf(p);
    var T = null, best = 1e9, isBoss = false;
    enemies.forEach(function (e) {
      if (e.dying || e.x < cam - 10 || e.x > cam + W + 10) return;
      var d = Math.abs(e.x - p.x) + Math.abs(e.y - p.y) * 2;
      if (d < best) { best = d; T = e; }
    });
    if (!T) bosses.forEach(function (b) { if (!T && !b.dead && b.hp > 0 && b.vs !== p) { T = b; isBoss = true; } });
    function goTo(tx, ty, dz) {
      tx = clamp(tx, cam + 20, cam + W - 20); ty = clamp(ty, TOP, BOT);
      if (Math.abs(tx - p.x) > (dz || 5)) c.x = sign(tx - p.x);
      if (Math.abs(ty - p.y) > 3) c.y = sign(ty - p.y);
      return Math.abs(tx - p.x) <= (dz || 5) + 4 && Math.abs(ty - p.y) <= 6;
    }
    if (!T) {
      // o Bispo ora quando não tem monstro e alguém do time está machucado
      if (p.who === 'bispo' && p.altCd <= 0 && Math.random() < 0.03 && players.some(function (q) { return !q.dead && q.hp < q.maxHp; })) { c.alt = true; return c; }
      // lidera quem é humano; se todos forem IA, o de menor índice vivo; os outros seguem o líder
      var lead = players.find(function (q) { return !q.ai && !q.dead; }) || players.find(function (q) { return !q.dead; });
      if (lead === p) {
        if (cat && !cat.done && Math.abs(p.x - cat.x) < 60) { c.use = true; goTo(cat.x - 20, cat.y, 4); }
        else c.x = 1;
      } else if (lead) {   // fila indiana: cada um segue o da frente, a ~30 de distância, mesma faixa com um degrauzinho
        var order = players.filter(function (q) { return !q.dead; }).sort(function (a, b) { return (a === lead ? -1 : b === lead ? 1 : a.idx - b.idx); });
        var front = order[order.indexOf(p) - 1] || lead, dir = lead.facing || 1;
        goTo(front.x - dir * 30, front.y + (order.indexOf(p) % 2 ? 6 : -6), 6);
        if (Math.abs(front.x - p.x) > 70) c.run = true;   // ficou para trás: corre para alcançar
      }
      return c;
    }
    var half = (T.w || 30) / 2, side = p.x < T.x ? -1 : 1;
    var danger = isBoss && (T.state === 'warn' || (T.state === 'attack' && Math.abs(T.x - p.x) < half + 40));
    if (p.who === 'lutador'||p.who==='ricardo') {
      if(p.who==='ricardo'&&p.altCd<=0&&Math.abs(T.x-p.x)>60&&Math.abs(T.x-p.x)<210&&Math.abs(T.y-p.y)<20){c.face=-side;c.alt=true;}
      if (danger) goTo(T.x + side * (half + 90), T.y + (p.y < T.y ? -45 : 45));
      else if (goTo(T.x + side * (half + 16), T.y)) { c.x = 0; c.y = 0; c.face = -side; c.atk = true; }
      else if (Math.abs(p.y - T.y) < 14 && Math.abs(p.x - T.x) < 45) { c.face = -side; c.atk = true; }
      else if (Math.abs(p.y - T.y) < 8 && Math.abs(p.x - T.x) > 110 && p.altCd <= 0 && Math.random() < 0.04) { c.face = -side; c.alt = true; }
      var near = enemies.filter(function (e) { return !e.dying && Math.abs(e.x - p.x) < 90 && Math.abs(e.y - p.y) < 30; }).length;
      if (p.sp >= 100 && (isBoss || near >= 3)) c.spc = true;
    } else {
      var tx = T.x + side * (half + 100);
      if (tx < cam + 20 || tx > cam + W - 20) tx = T.x - side * (half + 100);
      var ty = danger ? T.y + (p.y < T.y ? -45 : 45) : T.y;
      goTo(tx, ty, 10);
      if (!danger && Math.abs(p.y - T.y) < 10) { c.face = p.x < T.x ? 1 : -1; c.atk = true; }
      if (p.who === 'nutri' && versus && p.sp >= 100 && p.hp < p.maxHp * 0.5) c.spc = true;
      if (p.who === 'nutri' && p.altCd <= 0 && enemyInFront(p, 28) && Math.random() < 0.2) c.alt = true;
      if (p.who === 'emanuelly' || p.who === 'pedro' || p.who === 'naju' || p.who === 'enzo' || p.who === 'grazi' || p.who === 'bispo' || p.who === 'lohan' || p.who === 'rafinha' || p.who === 'douglas' || p.who === 'fidelis' || p.who === 'arthur' || p.who === 'lucas' || p.who === 'duda' || p.who === 'cardoso' || p.who==='th' || p.who==='douglinhas' || p.who==='adriene') {
        if(p.who==='douglinhas' && p.altCd<=0 && enemyInFront(p,50))c.alt=true;
        if(p.who==='th' && p.altCd<=0 && Math.random()<0.045)c.alt=true;
        if (p.who === 'cardoso' && p.altCd <= 0 && enemyInFront(p, 44) && Math.random() < 0.12) c.alt = true;
        if (p.who === 'duda' && p.altCd <= 0 && p.hp < p.maxHp * 0.46) c.alt = true;
        if (p.who === 'lucas' && p.altCd <= 0 && enemyInFront(p, 40) && Math.random() < 0.2) c.alt = true;
        if (p.who === 'adriene' && p.altCd <= 0 && enemyInFront(p, 40) && Math.random() < 0.25) c.alt = true;
        if (p.who === 'arthur' && p.altCd <= 0 && p.hp < p.maxHp * 0.6) c.alt = true;   // come bolo quando está machucado
        if (p.who === 'enzo' && p.altCd <= 0 && Math.random() < 0.08) c.alt = true;
        if (p.who === 'emanuelly' && p.altCd <= 0 && enemyInFront(p,window.CreiaCombat.secondary.emanuelly[2]) && Math.random() < 0.05) c.alt = true;
        if (p.who === 'rafinha' && p.altCd <= 0 && Math.random() < 0.04) c.alt = true;
        if (p.who === 'grazi' && p.altCd <= 0 && enemyInFront(p, 36)) c.alt = true;
        if (p.who === 'naju' && p.altCd <= 0 && enemyInFront(p, 34)) c.alt = true;
        if ((p.who === 'lohan' || p.who === 'douglas' || p.who === 'fidelis') && p.altCd <= 0 && Math.random() < 0.035) c.alt = true;   // solta câmera voadora de vez em quando
        var crowd = enemies.filter(function (e) { return !e.dying && e.x > cam && e.x < cam + W; }).length;
        if (p.sp >= 100 && (isBoss || crowd >= 4)) c.spc = true;
      } else if (p.sp >= 100 && mate && (mate.dead || mate.hp < mate.maxHp * 0.5)) c.spc = true;
    }
    if (versus && isBoss && T && T.vs && p.guardCd <= 0 && Math.abs(T.vs.x - p.x) < 70 && Math.abs(T.vs.y - p.y) < 20) {
      var foeAtk = (T.vs.state.indexOf('attack') >= 0 || T.vs.state === 'throw' || T.vs.state === 'jumpkick' || T.vs.state === 'fralda' || T.vs.state === 'barriga');
      if (foeAtk && Math.random() < 0.22) { c.use = true; c.atk = false; }
    }
    return c;
  }

  // ---------- Inimigos ----------
  var nextEnemyId=0;
  function spawnEnemy(kind, x, y) {
    var def = EN[kind], sz = enemySize(kind), k = (1 + 0.12 * (stage - 1)) * teamK();
    if (x == null) x = Math.random() < 0.65 ? cam + W + 18 : cam - 18;
    if (y == null) y = rnd(TOP + 4, BOT - 4);
    var e = { id:++nextEnemyId,kind: kind, x: x, y: clamp(y, TOP, BOT), z: 0, vz: 0, kx: 0, mx: 0, my: 0,
      hp: Math.round(def.hp * k), maxHp: Math.round(def.hp * k), w: sz.w, h: sz.h,
      dmg: Math.round(def.dmg * 1.25 * (1 + 0.08 * (stage - 1)) * (0.8 + 0.2 * teamK())), spd: def.spd * (1 + 0.03 * (stage - 1)),
      reach: def.reach, state: 'walk', st: 0, facing: x > cam + W / 2 ? -1 : 1, cd: rnd(0.6, 1.5), cd2: rnd(2, 4),
      hopT: rnd(0.8, 2), flash: 0, stun: 0, guard: kind === 'gordura', guardHp: 30 + stage * 3, blockT: 0,
      dying: false, dieT: 0, struck: false, shieldTick: 0 };
    enemies.push(e);
    return e;
  }
  function updateEnemy(e, dt) {
    if (bosses.some(function (b) { return !b.dead && b.transT > 0; })) return;
    e.st += dt; e.flash = Math.max(0, e.flash - dt); e.blockT -= dt; e.shieldTick -= dt;
    e.kx *= Math.exp(-6 * dt);
    e.vz -= GRAV * dt; e.z += e.vz * dt; if (e.z <= 0) { e.z = 0; e.vz = 0; }
    if (e.dying) { e.dieT += dt; e.x += e.kx * dt; if (e.dieT > 0.9) e.remove = true; return; }
    if (e.edgeFly) {
      var ef=e.edgeFly, eu=clamp((ef.t+=dt)/0.42,0,1), ee=eu*eu*(3-2*eu);
      e.x=ef.from+(ef.to-ef.from)*ee; e.z=Math.sin(eu*Math.PI)*45; e.kx=0;
      e.stun=Math.max(e.stun,1.5);
      if (eu>=1) { e.edgeFly=null; e.z=0; }
      return;
    }
    e.cd -= dt; e.cd2 -= dt; e.stun -= dt; e.hopT -= dt;
    var t = nearestPlayer(e.x, e.y);
    e.mx = 0; e.my = 0;
    if (e.stun > 0 || phase === 'clear') {
      // atordoado: só o empurrão
    } else if (e.state === 'attack') {
      if (e.kind === 'fome' && e.st > 0.3 && e.st < 0.5) e.mx = e.facing * 140;
      if (!e.struck && e.st >= 0.38) {
        e.struck = true;
        players.forEach(function (p) {
          if (p.dead) return;
          var hx = e.x + e.facing * e.reach * 0.6;
          if (Math.abs(p.x - hx) < e.reach * 0.8 + 14 && Math.abs(p.y - e.y) < 16 && p.z < 30) {
            if (damagePlayer(p, e.dmg, 40, e.x, 'enemy') && e.kind === 'fome') { p.slow = 1.5; floatText(p.x, p.y - 64, 'LENTO!', '#e8b13a'); }
          }
        });
      }
      if (e.st >= 0.7) { e.state = 'walk'; e.st = 0; e.cd = EN[e.kind].cd * rnd(0.8, 1.3); }
    } else if (t) {
      var side = e.x < t.x ? -1 : 1;
      var tx = clamp(t.x + side * (e.reach + 8), cam + 16, cam + W - 16), ty = t.y;
      if (Math.abs(tx - t.x) < e.reach) side = -side, tx = t.x + side * (e.reach + 8); // sem espaço de um lado: vai pelo outro
      var dx = tx - e.x, dy = ty - e.y;
      if (Math.abs(dx) > 3) e.mx = sign(dx) * e.spd;
      if (Math.abs(dy) > 2) e.my = sign(dy) * e.spd * 0.6;
      e.facing = e.x < t.x ? 1 : -1;
      var inRange = Math.abs(t.x - e.x) < e.reach + 14 && Math.abs(t.y - e.y) < 13;
      if (inRange && e.cd <= 0 && e.z === 0) { e.state = 'attack'; e.st = 0; e.struck = false; e.mx = e.my = 0; }
      if ((e.kind === 'batata' || e.kind === 'refri') && e.hopT <= 0 && e.z === 0) { e.vz = rnd(110, 170); e.hopT = rnd(0.8, 2.2); }
      if (e.kind === 'batata' && e.cd2 <= 0 && Math.abs(t.x - e.x) > 80) {
        var tt = 0.8;
        G.shoot({ x: e.x, y: e.y, z: 20, vx: (t.x - e.x) / tt, vy: (t.y - e.y) / tt, vz: 190, grav: 500,
          r: 6, dmg: 4, knock: 10, life: 3, kind: 'gordura', onLand: 'poca' });
        e.cd2 = rnd(3, 5);
      }
    }
    if (e.glueT > 0) { e.glueT -= dt; e.mx *= 0.35; e.my *= 0.35; }   // grudado na cola quente: anda bem devagar
    e.x += (e.mx + e.kx) * dt; e.y = clamp(e.y + e.my * dt, TOP, BOT);
    if (e.x > cam + 8 && e.x < cam + W - 8) e.entered = true;
    e.x = e.entered ? clamp(e.x, cam + 6, cam + W - 6) : clamp(e.x, cam - 30, cam + W + 30);
    // escudo saudável empurra
    players.forEach(function (p) {
      if (!(p.shield > 0 || (p.who === 'nutri' && shieldActive())) || p.dead || p.state==='taunt') return;
      var dx = e.x - p.x, dy = e.y - p.y;
      if ((dx * dx) / (42 * 42) + (dy * dy) / (18 * 18) < 1) {
        e.kx = (sign(dx) || 1) * 170;
        if (e.shieldTick <= 0) { e.shieldTick = 0.4; hitEnemy(e, 3, e.kx, p, { stun: 0.2 }); }
      }
    });
  }
  function separate() {
    for (var pi = 0; pi < players.length; pi++) for (var pj = pi + 1; pj < players.length; pj++) {   // time sem ficar grudado
      var pa = players[pi], pb = players[pj];
      if (pa.dead || pb.dead || pa.state === 'special' || pb.state === 'special' || pa.state === 'pet' || pb.state === 'pet') continue;
      if(versus&&Math.abs((pa.z||0)-(pb.z||0))>65)continue; // cruza por cima do corpo do rival
      var pdx = pb.x - pa.x, pdy = pb.y - pa.y;
      if (Math.abs(pdx) < 20 && Math.abs(pdy) < 10) { var ps = (sign(pdx) || (pi % 2 ? 1 : -1)) * 0.7; pa.x -= ps; pb.x += ps; }
    }
    for (var i = 0; i < enemies.length; i++) {
      for (var j = i + 1; j < enemies.length; j++) {
        var a = enemies[i], b = enemies[j];
        if (a.dying || b.dying) continue;
        var dx = b.x - a.x, dy = b.y - a.y;
        if (Math.abs(dx) < 14 && Math.abs(dy) < 8) {
          var s = (sign(dx) || (i % 2 ? 1 : -1)) * 0.6;
          a.x -= s; b.x += s; a.y -= sign(dy) * 0.3; b.y += sign(dy) * 0.3;
        }
      }
    }
  }

  // ---------- Projéteis ----------
  function updateShots(dt) {
    shots.forEach(function (s) {
      if (s.yoyo) {
        var ow = s.owner; s.t += dt; s.life = 3;
        if (!s.back && s.t > s.out) { s.back = true; s.hit = []; s.knock = -70 * ow.facing; sfx('whoosh'); }
        if (s.back) {
          var hx = ow.x + ow.facing * 12, dxm = hx - s.x, dym = ow.y - s.y, dm = Math.hypot(dxm, dym * 2) || 1;
          s.vx = dxm / dm * 420; s.vy = dym / dm * 210; s.z += (ow.z + 34 - s.z) * Math.min(1, dt * 8);
          if (dm < 16 || s.t > 1.6 || ow.dead) { s.life = 0; return; }
        } else s.vx *= 1 - dt * 1.5;
      }
      if (s.homing) {   // câmera voadora persegue o alvo mais perto (no X1, o adversário)
        var hb = null, hd = 1e9;
        enemies.forEach(function (e) { var d = Math.abs(e.x - s.x) + Math.abs(e.y - s.y); if (!e.dying && s.hit.indexOf(e) < 0 && d < hd) { hd = d; hb = e; } });
        bosses.forEach(function (b) { var d = Math.abs(b.x - s.x) + Math.abs(b.y - s.y); if (!b.dead && b.hp > 0 && b.vs !== s.owner && d < hd) { hd = d; hb = b; } });
        if (hb) { var ax = hb.x - s.x, ay = hb.y - s.y, al = Math.hypot(ax, ay) || 1; s.vx += (ax / al * 260 - s.vx) * Math.min(1, dt * 3); s.vy += (ay / al * 130 - s.vy) * Math.min(1, dt * 3); }
        s.z += ((hb ? 26 : 44) - s.z) * Math.min(1, dt * 3);
      }
      var fidFrom=s.fidControl?(s.sweepX==null?s.x:s.sweepX):s.x;
      var manuFrom=s.x,manuStep=dt;
      if(s.manuShot){manuStep=Math.min(dt,Math.max(0,s.life));s.t+=manuStep;}
      s.x += s.vx * manuStep; s.y += s.vy * dt; s.vz -= s.grav * dt; s.z += s.vz * dt; s.rot += s.vr * dt; s.life -= dt;
      var manuExpired=s.manuShot&&s.life<=0;
      if(manuExpired)s.life=0.000001;   // verifica o segmento final, sem prolongar o alcance

      if(s.fidControl){s.sweepX=s.x;if(s.z<s.fidPlane){s.z=s.fidPlane;s.vz=0;}}
      if(s.thTv){if(!s.thLanded && s.z<=s.thImpactZ)impactThTv(s);return;}
      if(s.rcDoor){if(!s.rcLanded&&s.z<=s.rcImpact)ricardoImpact(s);return;}
      if(s.dglCross){if(!s.dglLanded && s.z<=s.dglImpactZ)impactDouglinhasCross(s);return;}
      if (s.y < TOP - 30 || s.y > BOT + 20) s.life = 0;
      if (s.z <= 0 && s.grav > 0 && s.bounces > 0 && s.vz < 0) { s.bounces--; s.z = 0; s.vz = -s.vz * 0.62; s.vx *= 0.85; tone(140, 0.06, 'triangle', 0.08); }
      if (s.z <= 0 && s.grav > 0) { s.life = 0; if (s.boom) fireBoom(s); else { burst(s.k, s.x, s.y, 0, 1); sfx('splat'); } return; }
      enemies.forEach(function (e) {
        if (s.life <= 0 || e.dying || s.hit.indexOf(e) >= 0) return;
        var flameSpread=s.k==='pedro-12'?20:0;
        if (s.manuShot?emanuellyContact(s,e,manuFrom):s.fidControl?window.CreiaCombat.fidelis.projectileContact(s,e,fidFrom):Math.abs(e.x - s.x) < e.w / 2 + 6 && Math.abs(e.y - s.y) < 14+flameSpread*.4 && s.z >= e.z - 4-flameSpread && s.z <= e.z + e.h + 4+flameSpread) {
          s.hit.push(e);var hpBefore=e.hp; hitEnemy(e, s.dmg, s.knock, s.owner, s);if(s.k==='halter'&&e.hp<hpBefore&&!e.guard)pullDumbbell(e,s.owner,false); if (s.glue) { e.glueT = 2.5; floatText(e.x, e.y - e.h - 8, 'GRUDOU!', '#ffe9a8'); } burst('estrela', s.x, s.y, s.z, 2); sfx('hit');
          if (--s.pierce <= 0) s.life = 0;
        }
      });
      bosses.forEach(function (b) {
        if (s.life <= 0 || b.dead || !(b.hp > 0) || s.hit.indexOf(b) >= 0 || (b.vs && b.vs === s.owner)) return;
        if (s.manuShot?emanuellyContact(s,b,manuFrom):s.fidControl?window.CreiaCombat.fidelis.projectileContact(s,b,fidFrom):Math.abs(b.x - s.x) < b.w / 2 + 4 && Math.abs(b.y - s.y) < 26 && s.z >= b.z - 6 && s.z <= b.z + b.h + 6) {
          s.hit.push(b);
          var hpBefore=b.hp;var hitOk = hitBoss(b, s.dmg, s.owner, !!s.fromSpecial, s.specialBlocked, s.manuShot?Math.abs(s.knock):s.fromSpecial ? 40 : 24, s.manuShot?manuFrom:fidFrom, true,s.counterKnock);
          if(s.k==='halter'&&(b.vs?hitOk:b.hp<hpBefore))pullDumbbell(b.vs||b,s.owner,!b.vs);
          if (b.vs && !hitOk) {
            s.life = 0; burst('brilho', s.x, s.y, s.z, 4);
          } else {
            burst('estrela', s.x, s.y, s.z, 2);
            if (--s.pierce <= 0) s.life = 0;
          }
        }
      });
      if(manuExpired)s.life=0;
      if (!s.yoyo && !s.homing && (s.x < cam - 40 || s.x > cam + W + 40) && !(s.enzoRain && (s.vx > 0 && s.x < cam || s.vx < 0 && s.x > cam + W))) s.life = 0;
      if (s.homing && (s.x < cam - 120 || s.x > cam + W + 120)) s.life = 0;
    });
    shots = shots.filter(function (s) { return s.life > 0; });
    players.forEach(function (q) { if (q.who === 'naju') q.micOut = shots.some(function (s) { return s.yoyo && s.owner === q; }); });

    eshots.forEach(function (s) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.vz -= s.grav * dt; s.z += s.vz * dt; s.rot += dt * 8; s.life -= dt;
      if (!isFinite(s.x + s.y + s.z)) { s.life = 0; return; }
      if (s.grav > 0 && s.z <= 0) {
        s.life = 0;
        if (s.onLand === 'poca') { G.puddle(s.x, s.y, 30, 6); sfx('splat'); }
        else if (s.onLand === 'explode') { G.hit(s.x, s.y, 32, 14, 0, 40, s.dmg, 40, s.x); burst('estrela', s.x, s.y, 4, 8); shake(2, 0.15); sfx('explode'); }
        return;
      }
      players.forEach(function (p) {
        if (s.life <= 0 || p.dead) return;
        if (Math.abs(p.x - s.x) < s.r + 12 && Math.abs(p.y - s.y) < 13 + s.r / 2 && s.z <= p.z + 56 && s.z + s.r >= p.z - 2) {
          if (p.state !== 'taunt' && shieldActive()) { s.life = 0; burst('brilho', s.x, s.y, s.z, 3); sfx('shield_hit'); return; }
          if (damagePlayer(p, s.dmg, s.knock, s.x - s.vx * 0.05, 'projectile')) s.life = 0;
        }
      });
      if (s.x < cam - 80 || s.x > cam + W + 80) s.life = 0;
    });
    eshots = eshots.filter(function (s) { return s.life > 0; });
  }

  // ---------- Fases ----------
  // ---------- Perigos para pular ----------
  // pneu: rola pela rua numa faixa (aviso "!" na borda antes); onda: o chefe pisa e um anel corre pelo chão.
  // Só acertam quem está no chão (z baixo); pneu também atropela os monstros.
  function updateHazards(dt) {
    var live = players.filter(function (q) { return !q.dead; });
    if (live.length && phase === 'fight') {
      if (wave && cam >= camLock - 1 && !bossOn) {
        hazT -= dt;
        if (hazT <= 0) {
          hazT = Math.max(1.8, rnd(3, 5) - stage * 0.15);
          var tq = pick(live), fromR = Math.random() < 0.65, nb = 1 + (Math.random() < 0.35 + stage * 0.04 ? 1 : 0) + (stage >= 5 && Math.random() < 0.3 ? 1 : 0);
          for (var hb = 0; hb < nb; hb++) {   // rajada: o 1º vem na faixa de alguém, os outros em faixas vizinhas, em sequência
            var ly = clamp(hb ? tq.y + rnd(-34, 34) : tq.y, TOP + 4, BOT - 4);
            var bk = pick(['rato', 'rato', 'barata', 'barata', 'cachorro']);   // bicho de rua atravessando (o "pneu" da lógica)
            hazards.push({ k: 'pneu', bicho: bk, x: (fromR ? cam + W + 24 : cam - 24) + (fromR ? 1 : -1) * hb * 46, y: ly,
              vx: (fromR ? -1 : 1) * (190 + stage * 12) * rnd(0.9, 1.15) * (bk === 'barata' ? 1.15 : bk === 'cachorro' ? 1.2 : 1), warn: 0.75, rot: 0, t: 0, hit: [] });
          }
          if (jumpHint) { jumpHint = false; floatText(tq.x, tq.y - 96, 'PULE! (K)', '#ffe066'); }
        }
      }
      var boss = bosses.find(function (b) { return !b.dead && b.hp > 0; });
      if (bossOn && boss) {
        waveT -= dt;
        if (waveT <= 0) {
          waveT = rnd(5.5, 7.5);
          hazards.push({ k: 'onda', x: boss.x, y: boss.y, r: 6, warn: 0.7, hit: [] });
          floatText(boss.x, boss.y - (boss.h || 80) - 18, 'PULE!', '#ff5050');
        }
      }
    }
    hazards.forEach(function (h) {
      if (h.warn > 0) { h.warn -= dt; if (h.warn <= 0 && h.k === 'onda') { shake(4, 0.3); sfx('explode'); } return; }
      if (h.k === 'pneu') {
        h.x += h.vx * dt; h.rot += h.vx * dt / 9; h.t += dt;
        if (Math.random() < dt * 3) { if (h.bicho === 'cachorro') { tone(300, 0.08, 'square', 0.06, -120); tone(260, 0.08, 'square', 0.05, -100, 0.1); } else if (h.bicho === 'rato') tone(1900, 0.05, 'square', 0.03, 400); else noise(0.05, 0.04, 3000, 0, 'highpass'); }
        players.forEach(function (q) {
          if (q.dead || q.z > 9 || h.hit.indexOf(q) >= 0 || Math.abs(q.x - h.x) > (h.bicho === 'cachorro' ? 16 : 12) || Math.abs(q.y - h.y) > 9) return;
          h.hit.push(q); damagePlayer(q, 9 + stage * 1.3, 160 * sign(h.vx), h.x - h.vx);
        });
        enemies.forEach(function (e) {
          if (e.dying || h.hit.indexOf(e) >= 0 || Math.abs(e.x - h.x) > e.w / 2 + 8 || Math.abs(e.y - h.y) > 9) return;
          h.hit.push(e); hitEnemy(e, 12, 120 * sign(h.vx), null, { stun: 0.5 }); burst('estrela', e.x, e.y, 10, 3);
        });
        if (h.x < cam - 60 || h.x > cam + W + 60) h.dead = true;
      } else {
        h.r += 170 * dt;
        players.forEach(function (q) {
          if (q.dead || q.z > 6 || h.hit.indexOf(q) >= 0) return;
          var d = Math.hypot(q.x - h.x, (q.y - h.y) / 0.35);
          if (Math.abs(d - h.r) < 9) { h.hit.push(q); damagePlayer(q, 10 + stage, 150 * sign(q.x - h.x), h.x); }
        });
        if (h.r > 320) h.dead = true;
      }
    });
    hazards = hazards.filter(function (h) { return !h.dead; });
  }
  function drawHazards(cx) {
    hazards.forEach(function (h) {
      if (h.k === 'pneu') {
        if (h.warn > 0) {   // aviso na borda, na faixa do pneu
          if (Math.floor(h.warn * 10) % 2) return;
          var ex = h.vx < 0 ? W - 14 : 14;
          ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.moveTo(ex, h.y - 30); ctx.lineTo(ex + 9, h.y - 14); ctx.lineTo(ex - 9, h.y - 14); ctx.fill();
          txt('!', ex, h.y - 27, '#fff', 'center');
          return;
        }
        var sx = Math.round(h.x - cx), sy = Math.round(h.y) - 9;
        shadow(sx, Math.round(h.y), h.bicho === 'cachorro' ? 26 : 18);
        if (h.bicho && window.Bichos) { try { var bs = h.bicho === 'cachorro' ? 1.1 : 1.5; ctx.save(); ctx.translate(sx, Math.round(h.y)); ctx.scale(bs, bs); window.Bichos.draw(ctx, h.bicho, h.t, 0, 0, sign(h.vx) || 1); ctx.restore(); return; } catch (e) { ctx.restore(); h.bicho = null; } }
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(h.rot);
        ctx.fillStyle = '#0d0d12'; ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2b2b33'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#4a4a55'; ctx.lineWidth = 1.2;
        for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * 8.5, Math.sin(a) * 8.5); ctx.stroke(); }
        ctx.fillStyle = '#9da0ab'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a5d66'; ctx.fillRect(-1, -4, 2, 8); ctx.fillRect(-4, -1, 8, 2);
        ctx.restore();
      } else {
        var bx = Math.round(h.x - cx);
        if (h.warn > 0) {   // o chão treme e acende antes da pisada
          ctx.save(); ctx.globalAlpha = 0.25 + 0.25 * Math.sin(time * 40); ctx.fillStyle = '#ff5050';
          ctx.beginPath(); ctx.ellipse(bx, h.y, 40, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          return;
        }
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - h.r / 320);
        ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(bx, h.y, h.r, h.r * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#ff7a2e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(bx, h.y, h.r - 4, (h.r - 4) * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    });
  }
  function hasArt(k) {
    if (['fome', 'batata', 'refri', 'gordura', 'coxinha'].indexOf(k) >= 0) return true;
    try { return !!(window.Viloes && window.Viloes.enemySize && window.Viloes.enemySize(k)); } catch (e) { return false; }
  }
  function buildWaves(s) {
    var xs = s < 4 ? [420, 1050, 1900] : [380, 950, 1800, 2250];
    // cada fase com os seus vilões; a última junta o exército todo do Imperador
    var STAGE_KINDS = [null, ['fome', 'batata'], ['refri', 'coxinha'], ['pastel', 'brigadeiro'], ['salsicha', 'pipoca'],
      ['sorvete', 'milkshake'], ['donut', 'chips'], ['nugget', 'pizzinha'], ['acucar', 'bala'], ['churros', 'gordura']];
    var kinds = s >= 10 ? STAGE_KINDS.slice(1).reduce(function (a, k) { return a.concat(k); }, []) : STAGE_KINDS[s] || ['fome', 'batata'];
    kinds = kinds.filter(function (k) { return k !== 'gordura' && hasArt(k); });
    if (!kinds.length) kinds = ['fome', 'batata', 'refri', 'coxinha'];   // vilões novos ainda sem desenho: usa os antigos
    return xs.map(function (x, i) {
      var n = Math.round(3 + s * 0.7 + i), pool = [];
      for (var k = 0; k < n; k++) pool.push(pick(kinds));
      if (s >= 9 && i >= 1) for (var g = 0; g < 1 + Math.floor((s - 9) * 1.5); g++) pool.splice(Math.floor(rnd(1, pool.length)), 0, 'gordura');
      var tk = teamK(); n = Math.round(n * (0.6 + 0.4 * tk)); while (pool.length > n + 1) pool.pop(); while (pool.length < n) pool.push(pick(kinds));
      var encounter=window.CreiaEncounters?CreiaEncounters.plan(s,i,kinds,pool.length):null;
      if(encounter){
        var armored=pool.filter(function(k){return k==='gordura';}).length;
        pool=encounter.pool;
        // A variedade não remove os blindados previstos para as fases finais.
        var missing=armored-pool.filter(function(k){return k==='gordura';}).length;
        for(var a=pool.length-1;a>=0&&missing>0;a--)if(pool[a]!=='gordura'){pool[a]='gordura';missing--;}
      }
      return { x: x, pool: pool, encounter:encounter, spawned:0, maxAlive: Math.max(2, Math.round((3 + Math.floor(s / 3)) * (0.6 + 0.4 * tk))+(encounter?encounter.cap:0)), done: false, spawnT: 0.3 };
    });
  }
  function startStage(s) {
    if (!versus) esc = null;
    resetCombatVisuals();
    stage = s; enemies = []; bosses = []; shots = []; eshots = []; parts = []; texts = []; puddles = [];
    bossOn = false; bossIntro = null; camLock = null; wave = null; combo = 0; goT = 0; cine = null; notes = []; hazards = []; hazT = 4; waveT = 5; rings = []; kids = [];
    impacts=[];hitPause=0;lastHitPause=-10;
    waves = buildWaves(s);
    var startX = 60;
    waves.forEach(function (w) { if (w.x < startX) w.done = true; });
    cat = { x: CAT_X, y: 200, state: 'sit', st: 0, done: startX >= CAT_X };
    cam = clamp(startX - 120, 0, CAM_MAX);
    players.forEach(function (p, i) {
      var keep = { who: p.who, idx: p.idx, ai: p.ai, ctl:p.ctl, sp: p.sp };
      Object.assign(p, makePlayer(p.who, p.idx, p.ai), keep);
      var rank = players.filter(function (q) { return !q.ai; }).concat(players.filter(function (q) { return q.ai; })).indexOf(p);
      p.x = startX + 150 - rank * 32; p.y = 200 + (rank % 2 ? 12 : 0) + rank * 6; p.inv = 1.5;   // jogador na frente, IA em fila atrás
    });
    phase = 'intro'; phaseT = 0; bannerT = 3;
    playSong('rua');
  }
  function startGame(mode) {
    // modos antigos (testes): 0..2 = um humano com os outros na IA, 3 = dois humanos + Emanuelly na IA
    var human = ['nutri', 'lutador', 'emanuelly', null, 'enzo', 'pedro', 'naju', 'grazi', 'bispo', 'lohan', 'rafinha', 'douglas', 'fidelis', 'arthur', 'lucas', 'duda', 'cardoso'][mode];   // 16 = Lucas Cardoso (testes)
    startTeam((mode === 16 ? ['nutri', 'lutador', 'emanuelly', 'cardoso'] : mode === 15 ? ['nutri', 'lutador', 'emanuelly', 'duda'] : mode === 14 ? ['nutri', 'lutador', 'emanuelly', 'lucas'] : mode === 13 ? ['nutri', 'lutador', 'emanuelly', 'arthur'] : mode === 12 ? ['nutri', 'lutador', 'emanuelly', 'fidelis'] : mode === 11 ? ['nutri', 'lutador', 'douglas', 'rafinha'] : mode === 9 ? ['nutri', 'lutador', 'lohan', 'rafinha'] : mode === 10 ? ['nutri', 'lutador', 'emanuelly', 'rafinha'] : mode === 8 ? ['nutri', 'lutador', 'emanuelly', 'bispo'] : mode === 7 ? ['nutri', 'lutador', 'emanuelly', 'grazi'] : mode === 6 ? ['nutri', 'lutador', 'emanuelly', 'naju'] : mode === 5 ? ['nutri', 'lutador', 'emanuelly', 'pedro'] : ['nutri', 'lutador', 'emanuelly', 'enzo']).map(function (w) {
      return mode === 3 ? { who: w, ctl: w === 'nutri' ? 0 : w === 'lutador' ? 1 : null } : { who: w, ctl: w === human ? 0 : null };
    }), true);
  }
  // time escolhido na tela de seleção: [{ who, ctl }] (ctl null = IA)
  var flashT = 0, bolts = [];
  function zap(p, tx, ty, cols, ox, oy) {   // raio de choque até o alvo (zigue-zague recalculado a cada quadro); cols/ox/oy: cor e saída
    cols = cols || ['#ffffff', '#ffe14d'];
    bolts.push({ x0: p.x + p.facing * (ox || 14), y0: p.y - (oy || 40), x1: tx, y1: ty, t: 0.3, col: pick(cols) });
  }
  var versus = false, vsRound = null, VSK = 0.4, VS_Y = 215;   // X1: dano entre jogadores reduzido (a vida desce devagar)
  // no X1 cada lutador vira um "chefe" invisível para o outro: todo golpe e especial que acerta chefe acerta o adversário
  function vsProxy(q) {
    return { vs: q, name: NAMES[q.who], x: q.x, y: q.y, z: q.z, w: 24, h: 70, hp: 1, maxHp: 1, dead: false,
      update: function () { this.x = q.x; this.y = q.y; this.z = q.z; this.hp = q.dead ? 0 : 1; }, draw: function () {} };
  }
  function resetVersusRound() {
    resetCombatVisuals();
    perfeitaEvents=[];
    impacts=[];hitPause=0;lastHitPause=-10;
    waves = []; wave = null; cat = null; bossOn = false; bossIntro = null; enemies = []; hazards = [];
    shots = []; eshots = []; parts = []; texts = []; puddles = []; rings = []; kids = []; bolts = []; notes = [];
    cine = null; shakeT = 0; shakeF = 0; flashT = 0; goT = 0; bannerT = 0;
    combo = 0; comboT = 0; phase = 'fight'; phaseT = 0; overT = 0; hazT = 4; waveT = 5;
    cam = CAM_MAX; camLock = CAM_MAX; arena();
    players = players.map(function (old, i) {
      var p = makePlayer(old.who, i, old.ai);
      p.ctl = old.ctl;p.aiLevel=old.aiLevel; p.x = cam + (i ? 330 : 150); p.y = VS_Y; p.facing = i ? -1 : 1;
      return p;
    });
    bosses = players.map(vsProxy);
    if (online && online.host) online.input = {x:0,y:0};
    vsRound.number = vsRound.wins[0] + vsRound.wins[1] + 1;
    vsRound.phase = 'intro'; vsRound.t = 0; vsRound.contagem = false; vsRound.roundWinner = null; vsRound.announceT = 0;
  }
  // Abertura completa: 1,2 s de fala + três passos de 0,4 s (cerca de 3 s).
  // a fala do apresentador dita a duração: abertura = fala + respiro; encerramento cabe a fala inteira do vencedor
  var CULTO_FALA=window.CultoVisual?CultoVisual.falaFim('Que vença o mais ungido!')+0.6:1.2, CULTO_PASSO=0.4, CULTO_FIM=window.CultoVisual?6:4;
  function setupVersus() {
    vsRound = { number:1, wins:[0,0], phase:'intro', t:0, roundWinner:null, matchWinner:null, announceT:0 };
    resetVersusRound();
    vsRound.phase = 'culto'; sfx('culto');
    if(window.Rig)window.Rig.ready(cultoApresentador(players)); // pré-carrega sem esperar
  }
  function cultoApresentador(team) {
    var bispo=team.some(function(p){return p.who==='bispo';});
    return !bispo?'bispo':team.some(function(p){return p.who==='lucas';})?'arthur':'lucas';
  }
  function pularCulto() {
    if(scene!=='play'||!vsRound||vsRound.phase!=='culto'||(online&&!online.host)||paused||showCtl||showCfg||onlineHeld())return false;
    vsRound.phase='intro';vsRound.t=0;vsRound.contagem=true;sfx('culto_tick');
    return true;
  }
  function updateVersusRound(dt) {
    if (vsRound.phase !== 'fight' && online && online.host)
      ['atk','jump','spc','alt','use','taunt'].forEach(function (k) { online.input[k]=false; });
    if (vsRound.phase === 'culto') {
      vsRound.t += dt;
      if(vsRound.t>=CULTO_FALA){vsRound.phase='intro';vsRound.t=0;vsRound.contagem=true;sfx('culto_tick');}
      return true;
    }
    if (vsRound.phase === 'intro') {
      var anterior=Math.floor(vsRound.t/CULTO_PASSO);
      vsRound.t += dt;
      if(vsRound.contagem&&Math.floor(vsRound.t/CULTO_PASSO)!==anterior&&vsRound.t<CULTO_PASSO*3)sfx('culto_tick');
      if (vsRound.t < (vsRound.contagem?CULTO_PASSO*3:1.5)) return true;
      vsRound.phase = 'fight'; vsRound.t = 0; vsRound.announceT = 0.85; sfx('go');
      return false;
    }
    if (vsRound.phase === 'ko') {
      vsRound.t += dt;
      if (vsRound.t >= 2) {
        if (vsRound.matchWinner !== null) {
          vsRound.phase = 'match'; vsRound.t = 0;
          setState(players[vsRound.matchWinner], 'victory'); sfx('win');
          if (online && online.host) {online.result=vsRound.matchWinner;window.BanguOnline.send({type:'result',winner:vsRound.matchWinner,wins:vsRound.wins.slice()});}
        } else resetVersusRound();
      }
      return true;
    }
    if (vsRound.phase === 'match') {
      vsRound.t += dt;
      players[vsRound.matchWinner].st += dt;
      if(online){if(menuKey('ok'))onlineRematch();if(menuKey('back'))onlineExit();}
      else if (vsRound.t >= CULTO_FIM) {
        if (tour) tourWin(players[vsRound.matchWinner].who);
        else if (esc) escFightDone(vsRound.matchWinner === 0);
        versus = false; vsRound = null; scene = tour ? 'tour' : esc ? 'escalada' : 'menu'; updateTouchButtons();
      }
      return true;
    }
    vsRound.announceT = Math.max(0, vsRound.announceT - dt);
    return false;
  }
  function startTeam(team, keepStage, vs) {
    versus = !!vs;
    if (sel && !sel.escalada) esc = null;
    if (!vs) esc = null;
    updateTouchButtons();
    vsRound = null;
    players = team.map(function (m, i) { var p = makePlayer(m.who, i, m.ctl == null); p.ctl = m.ctl == null ? 0 : m.ctl;p.aiLevel=m.difficulty||'medio'; return p; });
    score = 0; scorePrompted = false; scorePending = false; paused = false; showCtl = false;
    if (!TOUCH && !saved.tut) { paused = true; showCtl = true; }   // 1ª partida no PC: mostra os botões antes de começar
    scene = 'play';
    startStage(versus && vsStage ? vsStage : 1);
    if (versus) setupVersus();
  }
  function arena() {
    G.arena = { left: cam, right: cam + W, top: TOP, bottom: BOT };
    return G.arena;
  }
  // falas dos chefes na apresentação (uma por fase)
  var BOSS_TALK = [null,
    'EU SOU O X-TUDO! VOCES VAO SER MEU ACOMPANHAMENTO!',
    'PURE, BATATA PALHA E OLEO QUENTE... PREPAREM-SE!',
    'PASTEL DE VENTO? NAO! EU SOU RECHEADO DE RAIVA!',
    'UMA ONDA DE BATATA FRITA VAI AFOGAR BANGU!',
    'GIRA, GIRA, CALABRESA! NINGUEM ME CORTA!',
    'NO ESPETINHO EU NAO VOU... VOCES E QUE VAO!',
    'TIGELA DE 1 LITRO COM LEITE NINHO! TREMAM!',
    'SALGADINHOS! FORMACAO DE ATAQUE!',
    'TEM CALDO DE CANA E PASTEL! A FOME AGRADECE!',
    'EU SOU O IMPERADOR PODRAO! BANGU E MEU CARDAPIO!'];
  // a câmera continua andando até a tela final, o time para à esquerda, o chefe entra pela direita e fala; depois começa a luta
  function startBossIntro() {
    bossIntro = { t: 0 };
    var save0 = cam; cam = CAM_MAX; arena(); startBoss(true); cam = save0; G.arena = { left: CAM_MAX, right: CAM_MAX + W, top: TOP, bottom: BOT };
    bosses.forEach(function (b) { b.ix = b.x; b.x = b.ix + 300; });
    enemies.forEach(function (e) { if (!e.dying) { e.dying = true; e.dieT = 0; e.state = 'ko'; } });
    hazards = []; playSong('boss');
  }
  function updateBossIntro(dt) {
    var bi = bossIntro; bi.t += dt;
    var u = clamp((bi.t - 0.6) / 1.4, 0, 1), e2 = 1 - Math.pow(1 - u, 3);
    bosses.forEach(function (b) { b.x = b.ix + 300 * (1 - e2); if (b.flash != null) b.flash = 0; });
    if (!bi.roar && bi.t > 1.7) { bi.roar = true; sfx('boss_roar'); shake(3, 0.5); }
    if (bi.t > 5.2) { bossIntro = null; bossOn = true; camLock = CAM_MAX; cam = CAM_MAX; arena(); goT = 0; sfx('go'); floatText(CAM_MAX + W / 2, 120, 'LUTEM!', '#ff5050'); }
  }
  function introCtrl(p) {   // anda até a fila da esquerda e olha para o chefe
    var order = players.filter(function (q) { return !q.ai; }).concat(players.filter(function (q) { return q.ai; }));
    var rk = order.indexOf(p), tx = CAM_MAX + 150 - rk * 34, ty = 196 + rk * 14, c = { x: 0, y: 0, face: 1 };
    if (Math.abs(tx - p.x) > 4) c.x = sign(tx - p.x);
    if (Math.abs(ty - p.y) > 3) c.y = sign(ty - p.y);
    if (!c.x && !c.y) c.face = 1;
    return c;
  }
  function drawBossIntro() {
    var bi = bossIntro, b = bosses[0]; if (!b) return;
    var a = clamp((bi.t - 1.5) / 0.3, 0, 1) * (1 - clamp((bi.t - 4.9) / 0.3, 0, 1));
    if (a <= 0) return;
    var bars = Math.round(22 * a);   // faixas de cinema
    ctx.fillStyle = '#0b0a10'; ctx.fillRect(0, 0, W, bars); ctx.fillRect(0, H - bars, W, bars);
    ctx.save(); ctx.globalAlpha = a;
    var bx = 34, by = 36, bw = W - 68, bh = 46;
    panel(bx, by, bw, bh, 'rgba(12,10,18,0.9)', 'rgba(255,255,255,0.2)');
    ctx.fillStyle = '#e8323c'; ctx.fillRect(bx + 2, by, bw - 4, 3);
    panel(bx + 8, by - 9, 8 * String(b.name).length * 0.75 + 24, 14, '#e8323c');
    txt(String(b.name || 'PODRAO').toUpperCase(), bx + 18, by - 6, '#ffffff', 'left');
    var line = BOSS_TALK[stage] || BOSS_TALK[10], n = Math.floor(Math.max(0, bi.t - 1.8) * 28);
    var shown = line.slice(0, n), cut = 44;
    var l1 = shown.slice(0, cut), l2 = shown.slice(cut);
    if (line.length > cut) { var sp = line.lastIndexOf(' ', cut); l1 = shown.slice(0, sp); l2 = shown.slice(sp + 1); }
    txt(l1, bx + 12, by + 14, '#ffe066', 'left'); if (l2) txt(l2, bx + 12, by + 28, '#ffe066', 'left');
    if (n < line.length && Math.floor(bi.t * 24) % 3 === 0) tone(220 + (n % 5) * 40, 0.03, 'square', 0.03);   // "voz" do chefe
    ctx.restore();
  }
  function startBoss(fromIntro) {
    if (!fromIntro) { bossOn = true; camLock = CAM_MAX; cam = CAM_MAX; }
    arena();
    var list = [];
    try { list = window.Bosses && typeof window.Bosses.create === 'function' ? window.Bosses.create(stage, G) : []; }
    catch (e) { console.warn('Bosses.create falhou', e); list = []; }
    bosses = (Array.isArray(list) ? list : [list]).filter(function (b) { return b && isFinite(b.x) && isFinite(b.y); });
    if (!bosses.length) bosses = [fallbackBoss()];
    bosses.forEach(toughen);
    if (!fromIntro) { bannerT = 3; sfx('boss_roar'); playSong('boss'); shake(3, 0.5); }
  }
  function teamK() { return [0.75, 0.75, 1, 1.22, 1.45][Math.min(4, players.length)] || 1; }   // mais gente no time, vilões mais fortes
  var BOSS_HP = 1.5; // calibrado com a IA jogando sozinha: sem isso ela zerava as 10 fases sem morrer
  function toughen(b) {
    if (!b.toughened && b.maxHp > 0) { b.toughened = true; b.maxHp = Math.round(b.maxHp * BOSS_HP * (online&&online.coop?window.CreiaCombat.coop.bossHp:teamK())); b.hp = Math.round(b.hp * BOSS_HP * (online&&online.coop?window.CreiaCombat.coop.bossHp:teamK())); }
    return b;
  }
  function fallbackBoss() {
    return { name: 'PODRÃO (substituto)', x: CAM_MAX + 360, y: 220, z: 0, w: 70, h: 90, hp: 300 * stage, maxHp: 300 * stage,
      facing: -1, dead: false, t: 0, cd: 2, flash: 0,
      update: function (dt, g) {
        this.t += dt; this.cd -= dt; this.flash = Math.max(0, this.flash - dt);
        if (this.hp <= 0) { this.dt2 = (this.dt2 || 0) + dt; if (this.dt2 > 1) this.dead = true; return; }
        var p = g.nearestPlayer(this.x, this.y);
        if (p) { this.y += sign(p.y - this.y) * 20 * dt; this.facing = p.x < this.x ? -1 : 1; }
        if (this.cd <= 0 && p) { this.cd = 1.6; g.shoot({ x: this.x, y: this.y, z: 40, vx: this.facing * 150, vy: 0, r: 7, dmg: 8, kind: 'gordura' }); }
      },
      draw: function (c, sx, sy) {
        c.fillStyle = this.flash > 0 ? '#fff' : '#b8662a'; c.fillRect(sx - 35, sy - 90, 70, 90);
        c.fillStyle = '#111'; c.fillRect(sx - 20, sy - 70, 10, 6); c.fillRect(sx + 10, sy - 70, 10, 6);
      } };
  }

  function updatePlay(dt) {
    if (versus && vsRound && updateVersusRound(dt)) return;
    if(window.CreiaJev&&!bossIntro)window.CreiaJev.update({time:time,versus:versus,players:players,bosses:bosses,enemies:enemies,guest:!!(online&&!online.host),attacks:window.Bosses&&window.Bosses.availableAttacks});
    phaseT += dt; bannerT -= dt; goT -= dt; flashT -= dt;
    bolts.forEach(function (bt) { bt.t -= dt; }); bolts = bolts.filter(function (bt) { return bt.t > 0; });
    var kf = kissFocus(), transNow = bosses.find(function (b) { return !b.dead && b.transT > 0; });
    if (transNow && !transNow.transSom) { transNow.transSom = true; sfx('boss_roar'); shake(5, 1.2); }   // 2ª forma: rugido e tremida uma vez
    players.forEach(function (p) {
      p.ctrl = bossIntro ? introCtrl(p) : p.ai ? aiControl(p,dt) : online && online.host && (versus||online.coop) && p.idx === 1 ?
        {x:online.input.x,y:online.input.y,atk:!!online.input.atk,jump:!!online.input.jump,
          spc:!!online.input.spc,alt:!!online.input.alt,use:!!online.input.use,taunt:!!online.input.taunt,face:0} : humanControl(p);
      if (p.spinT > 0 || p.brigT > 0) p.ctrl = { x: 0, y: 0 };   // rodando tonto: não anda nem bate
      if (kf && kf.p.kissTarget === p) p.ctrl = { x: 0, y: 0, face: kf.p.x < p.x ? -1 : 1 };   // parado, virado para receber o beijo
      if (transNow) p.ctrl = { x: 0, y: 0 };   // a luta para durante a transformação do chefe
    });
    players.forEach(function (p) { updatePlayer(p, dt);if(versus){p.y=VS_Y;p.vy=0;} });
    if (online && online.host && (versus||online.coop)) ['atk','jump','spc','alt','taunt'].forEach(function (k) { online.input[k]=false; });

    // câmera: só anda para a frente, trava nas ondas e no chefe
    var alive = players.filter(function (p) { return !p.dead; });
    var humansAlive = alive.filter(function (p) { return !p.ai; });   // a câmera acompanha quem está jogando, não a IA que vem atrás
    var ref = humansAlive.length ? humansAlive : alive.length ? alive : players;
    var avg = ref.reduce(function (a, p) { return a + p.x; }, 0) / ref.length;
    var target = clamp(avg - W * 0.42, 0, CAM_MAX);
    var next = null;
    for (var i = 0; i < waves.length; i++) if (!waves[i].done) { next = waves[i]; break; }
    if (camLock !== null) target = camLock;   // na transformação do chefe a câmera já está parada na arena (camLock = CAM_MAX)
    else if (next && target >= next.x - W / 2) { camLock = Math.max(0, next.x - W / 2); target = camLock; wave = next; }
    else if (!next && !bossOn && !bossIntro && !versus && target >= CAM_MAX - 220) startBossIntro();
    if (bossIntro) { cam = Math.min(CAM_MAX, cam + Math.max(45 * dt, (CAM_MAX - cam) * dt * 1.4)); target = cam; }   // a câmera continua andando sozinha (paralaxe) até a tela do chefe
    if (target > cam) cam = Math.min(target, cam + Math.max(1, (target - cam) * Math.min(1, dt * 6)));
    if (camLock !== null && cam < camLock && camLock - cam < 1) cam = camLock;
    arena();

    if (wave && !wave.done) {
      var aliveE = enemies.filter(function (e) { return !e.dying; }).length;
      wave.spawnT -= dt;
      if (cam >= camLock - 1 && wave.pool.length && aliveE < wave.maxAlive && wave.spawnT <= 0) {
        if(!wave.spawned&&wave.encounter)floatText(cam+W/2,TOP-52,wave.encounter.name.toUpperCase(),'#ffd34d');
        var kind=wave.pool.shift(),side=wave.encounter?wave.encounter.side*(wave.spawned%2?-1:1):1;
        spawnEnemy(kind,side<0?cam-18:cam+W+18,rnd(TOP+10,BOT-10));wave.spawned++;
        wave.spawnT=wave.encounter?wave.encounter.gap:0.6;
      }
      if (!wave.pool.length && aliveE === 0) { wave.done = true; wave = null; camLock = null; goT = 2.5; sfx('go'); }
    }

    updateHazards(dt);
    rings.forEach(function (rg2) {   // ondas do grito da Naju
      rg2.r += 260 * dt;
      enemies.forEach(function (e) {
        if (e.dying || rg2.hit.indexOf(e) >= 0) return;
        if (Math.hypot(e.x - rg2.x, (e.y - rg2.y) * 2) < rg2.r) { rg2.hit.push(e); hitEnemy(e, 4, sign(e.x - rg2.x) * 90, rg2.owner, { stun: 0.6 }); }
      });
      bosses.forEach(function (b) {
        if (b.dead || !(b.hp > 0) || rg2.hit.indexOf(b) >= 0) return;
        if (Math.abs(b.x - rg2.x) < rg2.r) { rg2.hit.push(b); hitBoss(b, 5, rg2.owner, true, rg2.specialBlocked); }
      });
    });
    rings = rings.filter(function (rg2) { return rg2.r < 520; });
    kids.forEach(function (k) {   // crianças da Grazi correndo
      k.delay -= dt; if (k.delay > 0) return;
      k.t += dt; k.life -= dt; k.x += k.dir * k.spd * dt;
      enemies.forEach(function (e) {
        if (e.dying || k.hit.indexOf(e) >= 0 || Math.abs(e.x - k.x) > e.w / 2 + 10 || Math.abs(e.y - k.y) > 16) return;
        k.hit.push(e); k.hitT = 0.15; hitEnemy(e, 5, k.dir * 150, k.owner, { stun: 0.6, launch: true }); burst('estrela', e.x, e.y, 20, 3); sfx('hit');
      });
      bosses.forEach(function (b) {
        if (b.dead || !(b.hp > 0) || k.hit.indexOf(b) >= 0 || Math.abs(b.x - k.x) > b.w / 2 + 10 || Math.abs(b.y - k.y) > 30) return;
        k.hit.push(b); k.hitT = 0.15; hitBoss(b, versus ? 7.8 : 7, k.owner, true, k.specialBlocked); burst('estrela', k.x, k.y, 24, 3); sfx('hit');
      });
      if (k.hitT > 0) k.hitT -= dt;
    });
    kids = kids.filter(function (k) { return k.life > 0 && k.x > cam - 60 && k.x < cam + W + 60; });
    var transActive = bosses.some(function (b) { return !b.dead && b.transT > 0; });
    if (!transActive) {
      enemies.forEach(function (e) { if (e.spinT > 0) { e.spinT -= dt; e.stun = Math.max(e.stun, 0.1); spinTick(e, dt); } updateEnemy(e, dt); });
    }
    bosses.forEach(function (b) { if (b.spinT > 0 && !b.vs) { b.spinT -= dt; spinTick(b, dt); } });
    players.forEach(function (q) { if (q.spinT > 0) { q.spinT -= dt; if (q.dead) q.spinT = 0; else spinTick(q, dt); } });
    function brigUpdate(e) { e.brigT -= dt; e.brigAge = (e.brigAge || 0) + dt; if (e.brigT > 0.25 && !e.dead && !e.dying) brigTick(e, dt); }   // os 0,25 s finais são o estouro
    enemies.forEach(function (e) { if (e.brigT > 0) { if (e.dying) e.brigT = Math.min(e.brigT, 0.25); e.stun = Math.max(e.stun, 0.1); e.kx = 0; brigUpdate(e); } });
    bosses.forEach(function (b) { if (b.brigT > 0 && !b.vs) brigUpdate(b); });
    players.forEach(function (q) { if (q.brigT > 0) { if (q.dead) q.brigT = 0; else brigUpdate(q); } });   // X1: o adversário rodando
    separate();
    enemies = enemies.filter(function (e) { return !e.remove; });

    if (bossIntro) updateBossIntro(dt);
    bosses.slice().forEach(function (b) {
      if (b.dead || bossIntro) return;
      if(updateDouglinhasBossPush(b,dt))return;
      try { b.update(dt, G); } catch (e) {
        if (!warned.bossUpd) { warned.bossUpd = 1; console.warn('boss.update falhou', e); }
      }
      if (!isFinite(b.x) || !isFinite(b.y)) { b.x = cam + W * 0.7; b.y = 220; }
      if (!isFinite(b.z)) b.z = 0;
    });

    updateShots(dt);
    puddles.forEach(function (p) { p.life -= dt; });
    puddles = puddles.filter(function (p) { return p.life > 0; });
    if (cat) {
      cat.st += dt;
      if (cat.state === 'purr' && cat.st > 3) { cat.state = 'sit'; cat.st = 0; }
      else if (cat.state !== 'purr' && cat.st > 2.5) { cat.state = cat.state === 'sit' ? 'lick' : 'sit'; cat.st = 0; }
    }
    comboT -= dt; if (comboT <= 0) combo = 0;

    if (bossOn && phase !== 'clear' && bosses.length && bosses.every(function (b) { return b.dead; })) {
      phase = 'clear'; phaseT = 0; eshots = []; sfx('win');
      enemies.forEach(function (e) { if (!e.dying) { e.dying = true; e.dieT = 0; e.state = 'ko'; } });
      saved.best = Math.max(saved.best, Math.min(10, stage + 1)); save();
    }
    if (phase === 'intro' && phaseT > 2.5) phase = 'fight';
    if (phase === 'clear' && phaseT > 4.5) {
      if (stage >= 10) { scene = 'ending'; overT = 0; playSong('rua'); maybeSubmitScore(); }
      else { menuStage = stage + 1; startStage(stage + 1); }
    }
    if (versus) {   // só o anfitrião/simulação local decide o resultado do round
      var vivos = players.filter(function (p) { return !p.dead; });
      if (vsRound.phase === 'fight' && vivos.length <= 1) {
        var winner = vivos.length === 1 ? vivos[0].idx : null;
        vsRound.phase = 'ko'; vsRound.t = 0; vsRound.roundWinner = winner; vsRound.announceT = 0;
        cine = null;
        if (winner !== null) {
          vsRound.wins[winner]++;
          if (vsRound.wins[winner] >= 2) vsRound.matchWinner = winner;
        }
      }
      return;
    }
    if (players.every(function (p) { return p.dead; })) {
      overT += dt;
      if (overT > 1.6) { scene = 'gameover'; overT = 0; sfx('gameover'); save(); maybeSubmitScore(); }
    } else overT = 0;
  }

  function updateCommon(dt) {
    if(scene==='play')players.forEach(updateVirada);
    impacts=impacts.filter(function(e){return time-e.born<.23;});
    notes.forEach(function (n) {
      n.u += dt / n.dur;
      if (n.u >= 1 && n.q && !n.hit) { n.hit = true; if (!n.quiet) burst('brilho', n.q.x, n.q.y, 36, 1); }
    });
    notes = notes.filter(function (n) { return n.u < 1; });
    parts.forEach(function (p) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vz -= p.grav * dt; p.z += p.vz * dt; p.rot += p.vr * dt; p.life -= dt;
      if (p.z < 0) { if (p.bounce) { p.z = 0; p.vz *= -0.35; p.vx *= 0.6; } }
    });
    parts = parts.filter(function (p) { return p.life > 0; });
    texts.forEach(function (t) { t.y -= 22 * dt; t.life -= dt; });
    texts = texts.filter(function (t) { return t.life > 0; });
    shakeT -= dt; if (shakeT <= 0) shakeF = 0;
  }

  // ---------- Desenho ----------
  function txt(s, x, y, col, align, size) {
    // a fonte de pixel não tem maiúsculas acentuadas: tira o acento da letra (mantém o Ç, que ela tem)
    // e desenha til, agudo e circunflexo à mão por cima da letra
    var sz = size || 8, d = String(s).normalize('NFD'), plain = '', marks = [], n = 0;   // n = letras já postas (o Ç conta uma só)
    for (var i = 0; i < d.length; i++) {
      var cc = d.charCodeAt(i);
      if (cc >= 0x300 && cc <= 0x36f && cc !== 0x327) { if (cc === 0x303 || cc === 0x301 || cc === 0x302) marks.push([n - 1, cc]); continue; }
      if (cc !== 0x327) n++;
      plain += d[i];
    }
    s = plain.normalize('NFC');
    ctx.font = sz + 'px "Press Start 2P", monospace';
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#0b0a10';
    ctx.fillText(s, x - 1, y); ctx.fillText(s, x + 1, y); ctx.fillText(s, x, y - 1); ctx.fillText(s, x, y + 1); ctx.fillText(s, x + 1, y + 1);
    ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y);
    if (marks.length) {
      var tw = ctx.measureText(s).width, x0 = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x, u = sz / 8;
      marks.forEach(function (m) {
        var cx = x0 + ctx.measureText(s.slice(0, m[0])).width + sz / 2 - u * 0.5, my = y - u * 3;
        var rects = m[1] === 0x303 ? [[-3, 1, 2, 1], [-1, 0, 2, 1], [1, 1, 2, 1], [3, 0, 1, 1]]          // til
          : m[1] === 0x301 ? [[0, 1, 2, 1], [1, 0, 2, 1]]                                               // agudo
          : [[-2, 1, 1, 1], [-1, 0, 3, 1], [2, 1, 1, 1]];                                                // circunflexo
        rects.forEach(function (r) {
          ctx.fillStyle = '#0b0a10'; ctx.fillRect(cx + (r[0] - 1) * u, my + (r[1] - 1) * u, (r[2] + 2) * u, (r[3] + 2) * u);
        });
        ctx.fillStyle = col || '#fff';
        rects.forEach(function (r) { ctx.fillRect(cx + r[0] * u, my + r[1] * u, r[2] * u, r[3] * u); });
      });
    }
  }
  function shadow(x, y, w) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    var hw = Math.round(w / 2);
    ctx.fillRect(x - hw + 2, y - 2, hw * 2 - 4, 4);
    ctx.fillRect(x - hw, y - 1, hw * 2, 2);
  }
  function drawPlayer(p) {
    if(p.who==='ricardo'&&p.state==='special'&&p.st>=0.15&&shots.some(function(s){return s.k==='ric-porta'&&s.owner===p&&s.life>0;}))return;
    var sx = Math.round(p.x - cam), sy = Math.round(p.y - p.z);
    var blink = p.inv > 0 && !p.dead && p.state !== 'special' && p.state !== 'pet' && !kissFocus() && Math.floor(time * 20) % 2;
    if (p.who === 'douglas' && p.state === 'special' && p.st > 2.0) drawFlames(sx, sy - 30, 14, 24, time, 10, 1);   // pegando fogo
    if (p.turbo > 0 && p.state === 'walk') spr('drawChibi', ctx, p.who, 'walk', p.walkT || 0, sx - p.facing * 10, sy, p.facing, { alpha: 0.25 });   // rastro do turbo
    if (p.state === 'dash') for (var gi = 2; gi >= 1; gi--) spr('drawChibi', ctx, p.who, 'dash', p.st, sx - p.facing * gi * 14, sy, p.facing, { alpha: 0.18 * (3 - gi) });   // rastro do dash
    if (p.spinT > 0) { ctx.save(); ctx.translate(sx, 0); ctx.scale(Math.cos(time * 18) || 0.05, 1); ctx.translate(-sx, 0); }   // X1: rodando
    spr('drawChibi', ctx, p.who, p.state === 'taunt' ? 'victory' : p.state === 'guard' ? 'idle' : p.state, p.state === 'walk' ? p.walkT || 0 : p.st, sx, sy, p.facing, { flash: p.flash > 0, alpha: blink ? 0.55 : 1, mark: p.markT != null ? clamp(5 - (time - p.markT), 0, 1) : 0, noMic: !!p.micOut, guard: p.state === 'guard', thPhone:!!p.thPhone, dribbleT: time, enzoThree: !!p.enzoThree, airThrow: (p.who==='pedro' || p.who==='bispo' || p.who==='rafinha' || p.who==='enzo' || p.who==='lohan' || p.who==='grazi' || p.who==='th' || p.who==='douglinhas') && p.z>0 && p.airThrowT>0, shielded: p.state !== 'taunt' && p.who === 'lutador' && p.shield > 0 });
    if (p.spinT > 0) ctx.restore();
    if (p.brigT > 0 && window.AdrieneVisual) AdrieneVisual.trap(ctx, sx, sy, 70, p.brigAge || 0, p.brigT, time, p.brigSeed || 0);   // preso no brigadeiro
    if (p.who === 'nutri' && p.state === 'special' && window.LorranyVisual && window.Rig && Rig.lorranyClaw) {   // dreno: vida saindo dos alvos até a garra
      var claw = Rig.lorranyClaw(sx, sy, p.facing), du = Math.min(1, p.st / 0.12) * (1 - Math.max(0, (p.st - 0.8) / 0.2));
      (versus ? players.filter(function (q) { return q !== p; }) : p.drainTargets || []).forEach(function (q, i) {
        LorranyVisual.drain(ctx, Math.round(q.x - cam), Math.round(q.y - (q.z || 0) - (q.h || 60) * 0.55), claw.x, claw.y, du, time, i * 2.7);
      });
      LorranyVisual.heal(ctx, sx, sy - 20, du, time);
    }
    if (p.state !== 'taunt' && (p.shield > 0 || (p.who === 'nutri' && p.hyper > 0 && shieldActive()))) {
      if (p.who !== 'lutador' || !window.Rig.marcosShield(ctx, sx, sy, p.shield, time, p.facing))
        drawShield(sx, sy, p.shield > 0 ? p.shield : 6);
    }
    if (p.state === 'guard' || p.guardFlash > 0) drawGuardBarrier(sx, sy, p.facing, p.guardT, p.guardFlash);
    if (p.dead && players.some(function (q) { return q !== p && !q.dead; })) txt(String(Math.max(0, Math.ceil(8 - p.koT))), sx, sy - 30, '#ff8fc0', 'center');
    if (!p.dead && p.state !== 'taunt' && scene === 'play' && !kissFocus() && !petFocus() && !soloFocus() && !shoutFocus() && !auraFocus() && !stareFocus() && !cardosoFocus() && !pigFocus() && !coramFocus()) txt(p.ai ? 'IA' : 'P' + (p.ctl + 1), sx, sy - 88, p.ai ? '#9fd8ff' : PCOL[p.ctl], 'center');
  }
  function drawTaunts() {
    var list=players.filter(function(p){return !p.dead&&p.state==='taunt';}).sort(function(a,b){return a.x-b.x;});
    list.forEach(function(p,i){
      var slot=W/list.length,left=i*slot+6,right=(i+1)*slot-6,limit=Math.min(230,right-left);
      var phrase=p.tauntFala || (window.Bordoes ? Bordoes.fala(p.who,tauntRival(p)) : '!!'),size=8,lines;
      function wrap(){
        var out=[''],max=Math.max(1,Math.floor((limit-14)/size));   // quebra por palavra; só palavra maior que a linha é cortada
        phrase.split(' ').forEach(function(word){
          var cur=out[out.length-1],next=cur?cur+' '+word:word;
          if(Array.from(next).length<=max){out[out.length-1]=next;return;}
          if(cur)out.push('');
          Array.from(word).forEach(function(ch){if(Array.from(out[out.length-1]).length>=max)out.push('');out[out.length-1]+=ch;});
        });return out;
      }
      lines=wrap();while(size>4&&lines.length*(size+3)+10>Math.max(22,p.y-p.z-130)){size--;lines=wrap();}
      var w=Math.min(limit,Math.max.apply(null,lines.map(function(l){return l.length*size;}))+14),h=lines.length*(size+3)+8;
      var x=clamp(p.x-cam-w/2,left,right-w),y=Math.max(72,p.y-p.z-58-h);   // logo acima da cabeça
      var tx=clamp(p.x-cam,x+8,x+w-8);   // rabinho do balão apontando para quem fala
      ctx.fillStyle='#ffd34d';ctx.beginPath();ctx.moveTo(tx-6,y+h-1);ctx.lineTo(tx+6,y+h-1);ctx.lineTo(tx,y+h+6);ctx.fill();
      ctx.fillStyle='#181521';ctx.beginPath();ctx.moveTo(tx-4,y+h-2);ctx.lineTo(tx+4,y+h-2);ctx.lineTo(tx,y+h+3);ctx.fill();
      panel(x,y,w,h,'#181521','#ffd34d');
      ctx.fillStyle='#181521';ctx.fillRect(tx-4,y+h-2,8,2);
      lines.forEach(function(line,n){txt(line,x+w/2,y+5+n*(size+3),'#ffffff','center',size);});
    });
  }
  function drawShield(sx, sy, left) {
    var pulse = 0.5 + 0.25 * Math.sin(time * 10);
    if (left < 1.5 && Math.floor(time * 12) % 2) return; // pisca quando vai acabar
    ctx.save();
    ctx.globalAlpha = 0.18 + pulse * 0.12;
    ctx.fillStyle = '#7dff8a';
    ctx.beginPath(); ctx.ellipse(sx, sy - 30, 34, 38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = Math.floor(time * 8) % 2 ? '#ffe066' : '#7dff8a';
    for (var i = 0; i < 24; i++) {
      var a = i / 24 * Math.PI * 2 + time * 1.5;
      ctx.fillRect(Math.round(sx + Math.cos(a) * 34) - 1, Math.round(sy - 30 + Math.sin(a) * 38) - 1, 2, 2);
    }
    ctx.restore();
  }
  function drawGuardBarrier(sx, sy, facing, guardT, guardFlash) {
    ctx.save();
    var bx = Math.round(sx + facing * 24);
    var by = Math.round(sy - 30);
    var pulse = 0.5 + 0.5 * Math.sin(time * 16);
    var hit = (guardFlash || 0) > 0;
    var alpha = hit ? 0.95 : clamp(0.42 + pulse * 0.22, 0.25, 0.85);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';

    if (hit) {
      for (var f = 0; f < 6; f++) {
        var spx = bx + facing * ((f * 5) % 15 + 3);
        var spy = by + ((f * 17) % 48 - 24);
        ctx.fillRect(Math.round(spx), Math.round(spy), 2, 2);
      }
    }

    var h = 54, cur = facing * (hit ? 10 : 8);
    ctx.beginPath();
    ctx.moveTo(bx - facing * 4, by - h / 2);
    ctx.quadraticCurveTo(bx + cur, by, bx - facing * 4, by + h / 2);
    ctx.lineTo(bx - facing * 8, by + h / 2);
    ctx.quadraticCurveTo(bx + cur - facing * 4, by, bx - facing * 8, by - h / 2);
    ctx.closePath();
    ctx.fillStyle = hit ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)';
    ctx.fill();

    ctx.lineWidth = hit ? 3 : 2;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(bx - facing * 3, by - h / 2);
    ctx.quadraticCurveTo(bx + cur, by, bx - facing * 3, by + h / 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    for (var k = 0; k < 4; k++) {
      var offY = ((time * 36 + k * 14) % h) - h / 2;
      var factor = 1 - Math.abs(offY) / (h / 2);
      var segX = bx + cur * factor * 0.7;
      ctx.fillRect(Math.round(segX) - 1, Math.round(by + offY) - 1, 2, 2);
    }
    ctx.restore();
  }
  function enemyState(e) {
    if(online&&online.coop&&!online.host)return e.state;
    if (e.dying) return 'ko';
    if (e.stun > 0) return 'hurt';
    if (e.state === 'attack') return 'attack';
    if (e.guard && e.blockT > 0) return 'guard';
    return e.mx || e.my ? 'walk' : 'idle';
  }
  function drawWorld() {
    var ox = shakeT > 0 ? Math.round(rnd(-shakeF, shakeF)) : 0, oy = shakeT > 0 ? Math.round(rnd(-shakeF, shakeF) * 0.6) : 0;
    ctx.save(); ctx.translate(ox, oy+(versus?34:0)); // X1: pés e cenário descem juntos; HUD e física permanecem iguais.
    var kf = kissFocus(), sf = soloFocus(), zf = kf || sf;
    if (zf) {   // zoom no beijo ou no solo: o ponto vai para o centro sem mostrar fora da tela
      var z = 1 + (kf ? 1.1 : 0.9) * zf.k;
      ctx.scale(z, z);
      ctx.translate(-clamp(zf.x - W / 2 / z, 0, W - W / z), -clamp(zf.y - H * 0.5 / z, 0, H - H / z));
    }
    var cx = Math.round(cam);
    bg('draw', ctx, stage, cx, time);
    // Preenche também o espaço acima do cenário deslocado, visível através do HUD.
    if(versus){ctx.save();ctx.beginPath();ctx.rect(0,-34,W,34);ctx.clip();ctx.translate(0,-34);bg('draw',ctx,stage,cx,time);ctx.restore();}
    if (!versus && window.SegundaForma) bosses.forEach(function (b) { if (!b.dead && b.forma === 2) SegundaForma.fundo(ctx, W, H, b, time); });   // cenário reage à 2ª forma
    var dglSky=players.find(function(p){return (p.who==='douglinhas'||p.who==='ricardo'&&p.st>=0.15) && p.state==='special' && !p.dead;});
    if(!cine && dglSky)drawDouglinhasHeaven(dglSky.who==='ricardo'?Math.max(0,dglSky.st-0.15):2+dglSky.st,0.35*(1-smooth(1.2,1.65,dglSky.st)));
    puddles.forEach(function (pd) {
      ctx.globalAlpha = Math.min(1, pd.life / 1.5);
      spr('drawPuddle', ctx, Math.round(pd.x - cx), Math.round(pd.y), pd.w);
      ctx.globalAlpha = 1;
    });
    drawHazards(cx);
    var list = [];
    kids.forEach(function (k) {
      if (k.delay > 0) return;
      shadow(Math.round(k.x - cx), Math.round(k.y), 14);
      list.push({ y: k.y, f: function () {
        var kx = Math.round(k.x - cx), ky = Math.round(k.y);
        if (window.Criancas && window.Criancas.draw) { try { window.Criancas.draw(ctx, k.i % 6, k.t, kx, ky, k.dir, { hit: k.hitT > 0 }); kidShout(k, kx, ky); return; } catch (e) {} }
        drawKidFallback(k, kx, ky); kidShout(k, kx, ky);
      } });
    });
    players.forEach(function (p) {
      shadow(Math.round(p.x - cx), Math.round(p.y), 30);
      list.push({ y: p.y + (kf && kf.p === p ? 40 : 0), f: function () { drawPlayer(p); } });   // no beijo ela fica na frente
    });
    enemies.forEach(function (e) {
      shadow(Math.round(e.x - cx), Math.round(e.y), e.w * 0.8);
      list.push({ y: e.y, f: function () {
        if (e.dying && e.dieT > 0.4 && Math.floor(time * 20) % 2) return;
        if (e.spinT > 0) { ctx.save(); var ex0 = Math.round(e.x - cx); ctx.translate(ex0, 0); ctx.scale(Math.cos(time * 18) || 0.05, 1); ctx.translate(-ex0, 0); }   // porcos na sala: rodando
        spr('drawEnemy', ctx, e.kind, enemyState(e), e.st, Math.round(e.x - cx), Math.round(e.y - e.z), e.facing, { flash: e.flash > 0 });
        if (e.spinT > 0) ctx.restore();
        if (e.brigT > 0 && window.AdrieneVisual) AdrieneVisual.trap(ctx, Math.round(e.x - cx), Math.round(e.y - e.z), e.h || 30, e.brigAge || 0, e.brigT, time, e.brigSeed || 0);
      } });
    });
    bosses.forEach(function (b) {
      if (b.dead) return;
      shadow(Math.round(b.x - cx), Math.round(b.y), b.w * 0.85);
      list.push({ y: b.y, f: function () {
        try {
          if (b.forma === 2 && window.SegundaForma) SegundaForma.corpo(ctx, b, Math.round(b.x - cx), Math.round(b.y - b.z), function (g, x, y) { b.draw(g, x, y); }, time);   // 2ª forma: maior e com aura
          else b.draw(ctx, Math.round(b.x - cx), Math.round(b.y - b.z));
        } catch (e) {
          if (!warned.bossDraw) { warned.bossDraw = 1; console.warn('boss.draw falhou', e); }
        }
        if (b.brigT > 0 && window.AdrieneVisual) AdrieneVisual.trap(ctx, Math.round(b.x - cx), Math.round(b.y - b.z), b.h || 70, b.brigAge || 0, b.brigT, time, b.brigSeed || 0);
      } });
    });
    if (cat) { shadow(Math.round(cat.x - cx), cat.y, 18); list.push({ y: cat.y, f: function () { spr('drawCat', ctx, cat.state, cat.st, Math.round(cat.x - cx), cat.y); } }); }
    shots.forEach(function (s) {
      if(s.k==='ric-porta'||s.manuLamina&&window.EmanuellyVisual&&typeof EmanuellyVisual.laminas==='function')return;
      if (s.grav > 0 || s.k === 'halter') shadow(Math.round(s.x - cx), Math.round(s.y), 8);
      list.push({ y: s.y, f: function () {
        if((s.manuShot||s.k==='manu-tiro'||s.k==='manu-curto')&&window.Rig&&Rig.emanuellyShot){Rig.emanuellyShot(ctx,s,cx,time);return;}
        if (s.yoyo) {   // fio do microfone até a mão dela
          var o2 = s.owner, hx2 = Math.round(o2.x - cx + o2.facing * 13), hy2 = Math.round(o2.y - o2.z - 37);
          ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx2, hy2);
          ctx.quadraticCurveTo((hx2 + s.x - cx) / 2, Math.max(hy2, s.y - s.z) + 8, Math.round(s.x - cx), Math.round(s.y - s.z)); ctx.stroke();
        }
        if (s.wave) {   // onda sonora: arcos abrindo
          var wx = Math.round(s.x - cx), wy = Math.round(s.y - s.z), age = 0.4 - s.life, dir = sign(s.vx) || 1;
          for (var wi = 0; wi < 3; wi++) {
            var rr = 6 + age * 40 + wi * 6; ctx.globalAlpha = Math.max(0, 1 - age * 2.2) * (1 - wi * 0.25);
            ctx.strokeStyle = s.slap ? (wi ? '#ff9a3c' : '#c77dff') : wi ? '#9fd8ff' : '#ffffff'; ctx.lineWidth = s.slap ? 3 : 2; ctx.beginPath();
            ctx.arc(wx - dir * 6, wy, rr, dir > 0 ? -0.9 : Math.PI - 0.9, dir > 0 ? 0.9 : Math.PI + 0.9); ctx.stroke();
          }
          ctx.globalAlpha = 1; return;
        }
        if (s.ch) { ctx.save(); ctx.translate(Math.round(s.x - cx), Math.round(s.y - s.z)); ctx.rotate(s.rot); txt(s.ch, 0, -8, s.col, 'center', 16); ctx.restore(); return; }
        if (s.enzoRain) {
          // Cópias só de desenho: o dano e a quantidade de projéteis reais não se multiplicam.
          var dir = sign(s.vx) || 1, travelled = Math.max(0, 1.5 - s.life) * Math.abs(s.vx);
          for (var bi = 0; bi < 13; bi++) {
            var lane = (bi - 1) % 4;
            var behind = bi ? 26 + Math.floor((bi - 1) / 4) * 38 + lane * 7 : 0;
            if (behind > travelled) continue;
            var bx = s.x - cx - dir * behind, by = s.y - s.z + (bi ? (lane - 1.5) * 23 : 0);
            if (bx < -30 || bx > W + 30 || by < -30 || by > H + 30) continue;
            spr('drawItem', ctx, 'basquete', Math.round(bx), Math.round(by), s.rot + bi * 0.73, 1.75);
          }
          return;
        }
        if(s.k==='fogo' && s.owner && s.owner.who==='bispo' && window.CreiaCombatFX){
          CreiaCombatFX.bispoRain(ctx,s.x-cx,s.y-s.z,s.rot,time,s.x);return;
        }
        if(s.k==='pedro-12' && window.PedroFX){
          PedroFX.blueFire(ctx,Math.round(s.x-cx)-(sign(s.vx)||1)*30,Math.round(s.y-s.z),sign(s.vx)||1,Math.max(0,.2-s.life),.8*Math.min(1,s.life/.06));return;
        }
        if(s.k==='seminima' && window.PedroFX){
          PedroFX.projectile(ctx,Math.round(s.x-cx),Math.round(s.y-s.z),sign(s.vx)||1,time);return;
        }
        spr('drawItem', ctx, s.k, Math.round(s.x - cx), Math.round(s.y - s.z), s.rot, 1);
      } });
    });
    eshots.forEach(function (s) {
      shadow(Math.round(s.x - cx), Math.round(s.y), s.r * 1.6);
      list.push({ y: s.y, f: function () {
        var sx = Math.round(s.x - cx), sy = Math.round(s.y - s.z);
        if (s.draw) { try { s.draw(ctx, sx, sy, s); return; } catch (e) { s.draw = null; } }
        spr('drawItem', ctx, s.kind, sx, sy, s.rot, 1);
      } });
    });
    list.sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (o) { o.f(); });
    if(window.EmanuellyVisual&&typeof EmanuellyVisual.laminas==='function'){
      var manuList=emanuellyBlades();
      // O renderer de cinco argumentos desconta 30px da altura; o contrato novo recebe z absoluto.
      if(EmanuellyVisual.laminas.length>=5)EmanuellyVisual.laminas(ctx,manuList.map(function(l){return Object.assign({},l,{z:l.z-30});}),cx,time,{img:function(n){return window.EmanuellyArt&&EmanuellyArt.img(n);}});
      else EmanuellyVisual.laminas(ctx,manuList,cx,time);
    }
    shots.forEach(function(s){if(s.k==='ric-porta')spr('drawItem',ctx,'ric-porta',Math.round(s.x-cx),Math.round(s.y-s.z),s.rot,1);});
    parts.forEach(function (p) {
      ctx.globalAlpha = clamp(p.life / Math.min(0.4, p.max), 0, 1);
      spr('drawItem', ctx, p.kind, Math.round(p.x - cx), Math.round(p.y - p.z), p.rot, p.kind === 'estrela' ? 0.6 + p.life * 2 : 0.8);
    });
    ctx.globalAlpha = 1;
    bolts.forEach(function (bt) {
      var n = 7, px0 = bt.x0 - cam, py0 = bt.y0, dx = (bt.x1 - bt.x0) / n, dy = (bt.y1 - bt.y0) / n;
      [[4, bt.col === '#ffffff' ? 'rgba(255,240,120,0.5)' : 'rgba(255,255,255,0.5)'], [1.6, bt.col]].forEach(function (ly) {
        ctx.strokeStyle = ly[1]; ctx.lineWidth = ly[0]; ctx.beginPath(); ctx.moveTo(px0, py0);
        for (var i = 1; i < n; i++) ctx.lineTo(px0 + dx * i + rnd(-7, 7), py0 + dy * i + rnd(-7, 7));
        ctx.lineTo(bt.x1 - cam, bt.y1); ctx.stroke();
      });
    });
    if (flashT > 0) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.9, flashT * 2.6) + ')'; ctx.fillRect(0, 0, W, H); }   // super flash do Lohan
    players.forEach(function (p) {   // raio arco-íris do Pedro
      if (p.who !== 'pedro' || p.state !== 'special' || p.st < 0.4 || p.st > 1.7) return;
      var a = Math.min(1, (p.st - 0.4) / 0.1) * Math.min(1, (1.7 - p.st) / 0.15);
      var x0 = Math.round(p.x - cx + p.facing * 36), y0 = Math.round(p.y - p.z - 44), x1 = p.facing > 0 ? W + 10 : -10;
      if(window.PedroFX){
        var muzzle=window.Rig && Rig.pedroMuzzle?Rig.pedroMuzzle('special',p.st):{x:36,y:-44};
        var mx=p.x-cx+p.facing*muzzle.x,my=p.y-p.z+muzzle.y;
        PedroFX.beam(ctx,mx,my,p.facing,p.facing>0?Math.max(0,W+12-mx):Math.max(0,mx+12),p.st-.4,a);
        return;
      }
      var cols = ['#ff3b3b', '#ff9a3b', '#ffe03b', '#3bff6a', '#3bb5ff', '#9a5bff'], h = 3 + Math.sin(time * 40) * 0.6;
      ctx.save(); ctx.globalAlpha = a;
      cols.forEach(function (c, i) {
        var yy = y0 - cols.length * h / 2 + i * h + Math.sin(time * 30 + i) * 0.8;
        ctx.fillStyle = c; ctx.fillRect(Math.min(x0, x1), Math.round(yy), Math.abs(x1 - x0), Math.ceil(h));
      });
      ctx.globalAlpha = a * 0.8; ctx.fillStyle = '#fff'; ctx.fillRect(Math.min(x0, x1), y0 - 1, Math.abs(x1 - x0), 2);
      ctx.beginPath(); ctx.arc(x0, y0, 9 + Math.sin(time * 50) * 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    players.forEach(function (p) {   // furacão da Grazi
      if (p.who !== 'grazi' || p.state !== 'attack2') return;
      var sx3 = Math.round(p.x - cx), sy3 = Math.round(p.y - p.z), a3 = Math.min(1, p.st * 6) * Math.min(1, (0.72 - p.st) * 6);
      ctx.save(); ctx.globalAlpha = Math.max(0, a3) * 0.85; ctx.lineWidth = 2;
      for (var r3 = 0; r3 < 5; r3++) {
        var yy3 = sy3 - 6 - r3 * 13, rx3 = 16 + r3 * 7, ang3 = time * 22 + r3;
        ctx.strokeStyle = r3 % 2 ? '#d8f0ff' : '#9fd8ff';
        ctx.beginPath(); ctx.ellipse(sx3, yy3, rx3, rx3 * 0.28, 0, ang3, ang3 + Math.PI * 1.3); ctx.stroke();
      }
      ctx.restore();
    });
    rings.forEach(function (rg2) {   // ondas de som: arcos que se abrem a partir da boca
      var a = Math.max(0, 1 - rg2.r / 520), sx2 = Math.round(rg2.x - cx), sy2 = Math.round(rg2.y - rg2.z);
      ctx.save(); ctx.globalAlpha = a;
      ['#ff6bd0', '#7ff0ff', '#ffe066'].forEach(function (col, i) {
        ctx.strokeStyle = col; ctx.lineWidth = 3 - i * 0.6;
        ctx.beginPath(); ctx.ellipse(sx2, sy2, Math.max(1, rg2.r - i * 5), Math.max(1, (rg2.r - i * 5) * 0.6), 0, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.restore();
    });
    notes.forEach(function (n) {   // notas musicais do solo
      var u = n.u, e = u * u * (3 - 2 * u), x, y, z;
      if (n.q) { x = n.sx + (n.q.x - n.sx) * e; y = n.sy + (n.q.y - n.sy) * e; z = n.sz + (40 - n.sz) * e + Math.sin(u * Math.PI) * 34; }
      else { x = n.sx + n.dx * u; y = n.sy; z = n.sz + u * 70; }
      drawNote(Math.round(x - cx + Math.sin(u * 9 + n.wob) * 3), Math.round(y - z), n.col, u > 0.85 ? (1 - u) / 0.15 : 1);
    });
    ctx.globalAlpha = 1;
    if(window.CreiaCombatFX&&CreiaCombatFX.impact)impacts.forEach(function(e){CreiaCombatFX.impact(ctx,e.x-cx,e.y-e.z,Math.max(0,time-e.born),e.kind,e.strong);});
    if(combatVisualVisible&&window.DefesaVisual){
      if(DefesaVisual.draw)DefesaVisual.draw(ctx,cx);
      players.forEach(function(p){if(!p.dead&&p.contraT>0&&DefesaVisual.contra)DefesaVisual.contra(ctx,p.x-cx+p.facing*22,p.y-p.z-36,p.contraT);});
    }
    bg('drawFront', ctx, stage, cx, time);
    // aviso do gatinho
    if (cat && !cat.done && scene === 'play') {
      players.forEach(function (p) {
        if (p.ai || p.dead || Math.abs(p.x - cat.x) > 80 || Math.abs(p.y - cat.y) > 50) return;
        var key = humans() > 1 ? ['[E]', '[0]', '[RB]', '[RB]'][p.ctl] : '[E]';
        if (Math.floor(time * 3) % 3) txt(key + ' FAZER CARINHO', Math.round(cat.x - cx), cat.y - 40, '#ffe066', 'center');
      });
    }
    texts.forEach(function (t) {
      ctx.globalAlpha = clamp(t.life * 2, 0, 1);
      var hw = t.msg.length * 5.5 + 4;   // frase longa não sai da tela
      txt(t.msg, Math.round(clamp(t.x - cx, hw, W - hw)), Math.round(t.y), t.col, 'center');
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  function kidShout(k, x, y) {   // balãozinho "CREIA KIDS!" (uma em cada três crianças, piscando em turnos)
    if (!k.shout || Math.floor(k.t * 3 + k.i) % 3 === 2) return;
    var by = y - 46 - Math.abs(Math.sin(k.t * 14)) * 2, w = 94;
    ctx.fillStyle = '#1a1014'; ctx.fillRect(x - w / 2 - 1, by - 1, w + 2, 12);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - w / 2, by, w, 10);
    ctx.fillStyle = '#1a1014'; ctx.beginPath(); ctx.moveTo(x - 3, by + 10); ctx.lineTo(x + 3, by + 10); ctx.lineTo(x - k.dir * 2, by + 15); ctx.fill();
    ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#d23c86'; ctx.fillText('CREIA KIDS!', x, by + 1);
  }
  function drawKidFallback(k, x, y) {   // criança simples enquanto o desenho do codex não chega
    var cols = ['#e8323c', '#3b8bff', '#ffd23b', '#3bff6a', '#ff8fc0', '#9a5bff'], ph = k.t * 16, b = Math.abs(Math.sin(ph)) * 2;
    ctx.fillStyle = '#1a1014';
    ctx.fillRect(x - 4 + Math.sin(ph) * 3, y - 8, 3, 8); ctx.fillRect(x + 1 - Math.sin(ph) * 3, y - 8, 3, 8);
    ctx.fillStyle = cols[k.i % 6]; ctx.fillRect(x - 6, y - 20 - b, 12, 13);
    ctx.fillStyle = ['#e8b48c', '#8a5634', '#f6c8a8', '#5a3a26', '#d79a6a', '#f2d2b0'][k.i % 6];
    ctx.beginPath(); ctx.arc(x + k.dir, y - 26 - b, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a1a12'; ctx.fillRect(x - 6 + k.dir, y - 33 - b, 12, 4);
  }
  function drawNote(x, y, col, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#0b0a10';
    ctx.beginPath(); ctx.ellipse(x, y, 3.2, 2.5, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + 1.5, y - 9.5, 2.2, 10); ctx.fillRect(x + 1.5, y - 10, 6, 3.2);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(x, y, 2.3, 1.7, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + 2, y - 9, 1.2, 9); ctx.fillRect(x + 2, y - 9.5, 5, 2);
    ctx.restore();
  }
  function smooth(a, b, v) { v = clamp((v - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); }
  // 0..1 enquanto a Nutri chega e beija; ponto do beijo em coordenadas de tela
  function kissFocus() {
    var p = players.find(function (q) { return q.who === 'nutri' && q.state === 'special' && q.kissTarget; });
    if (!p || cine) return null;
    var q = p.kissTarget, k = smooth(0.25, 0.5, p.st) * (1 - smooth(0.95, 1.3, p.st));
    return k > 0 ? { p: p, k: k, x: (p.x + q.x) / 2 - cam, y: q.y - q.z - 58 } : null;
  }
  // 0..1 enquanto alguém faz carinho no gatinho; o zoom vai na cabeça dele
  function petFocus() {
    if (!cat) return null;
    var p = players.find(function (q) { return q.state === 'pet'; });
    if (!p) return null;
    var k = smooth(0.1, 0.4, p.st) * (1 - smooth(2.0, 2.4, p.st));
    return k > 0 ? { p: p, k: k, x: cat.x - cam, y: cat.y - 16 } : null;
  }
  // 0..1 durante o solo dele (depois do corte), até os poderes entrarem
  function soloFocus() {
    if (cine) return null;
    var p = players.find(function (q) { return (q.who === 'lutador' || q.who === 'enzo' || q.who === 'naju') && q.state === 'special'; });
    if (!p) return null;
    var k = smooth(0.05, 0.3, p.st) * (1 - smooth(p.who === 'enzo' ? 1.5 : 1.2, p.who === 'enzo' ? 1.8 : 1.45, p.st));
    return k > 0 ? { p: p, k: k, x: p.x - cam, y: p.y - p.z - 40 } : null;
  }
  function auraFocus() {   // close do Douglas: a câmera aproxima no rosto e ele pega fogo
    if (cine) return null;
    var p = players.find(function (q) { return q.who === 'douglas' && q.state === 'special'; });
    if (!p) return null;
    var k = smooth(0.05, 0.3, p.st) * (1 - smooth(1.8, 2.1, p.st));
    return k > 0 ? { p: p, k: k } : null;
  }
  function drawFlames(cx, cy, rx, ry, t, n, sc) {   // labaredas em volta de um ponto (aura de fogo)
    for (var fi = 0; fi < n; fi++) {
      var a = (fi / n) * Math.PI * 2, fl = 0.6 + 0.4 * Math.sin(t * 18 + fi * 2.3), fx = cx + Math.cos(a) * rx, fy = cy + Math.sin(a) * ry, h = (10 + 8 * fl) * sc;
      [['#ff4d1a', 1], ['#ffb340', 0.65], ['#fff3b0', 0.3]].forEach(function (c2) {
        ctx.fillStyle = c2[0]; ctx.beginPath(); ctx.moveTo(fx - 5 * sc * c2[1], fy); ctx.quadraticCurveTo(fx - 4 * sc * c2[1], fy - h * c2[1] * 0.6, fx + Math.sin(t * 9 + fi) * 2 * sc, fy - h * c2[1]);
        ctx.quadraticCurveTo(fx + 4 * sc * c2[1], fy - h * c2[1] * 0.6, fx + 5 * sc * c2[1], fy); ctx.fill();
      });
    }
  }
  function coramFocus() {   // close da Duda (o jogo para)
    if (cine) return null;
    var p = players.find(function (q) { return q.who === 'duda' && q.state === 'special'; });
    if (!p) return null;
    var k = smooth(0.05, 0.35, p.st) * (1 - smooth(2.05, 2.35, p.st));
    return k > 0 ? { p: p, k: k } : null;
  }
  function pigFocus() {   // close do Lucas gritando "PORCOS NA SALA!" (o jogo para)
    if (cine) return null;
    var p = players.find(function (q) { return q.who === 'lucas' && q.state === 'special'; });
    if (!p) return null;
    var k = smooth(0.05, 0.3, p.st) * (1 - smooth(1.8, 2.1, p.st));
    return k > 0 ? { p: p, k: k } : null;
  }
  function pig(x, y, s, r) {   // porquinho de desenho: cabeça rosa, orelhas, focinho
    ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(s, s);
    ctx.fillStyle = '#3a1020'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-10, -12); ctx.lineTo(-3, -8); ctx.fill(); ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(10, -12); ctx.lineTo(3, -8); ctx.fill();
    ctx.fillStyle = '#ff9ec4'; ctx.beginPath(); ctx.arc(0, 0, 7.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(-8.6, -10); ctx.lineTo(-3.5, -7); ctx.fill(); ctx.beginPath(); ctx.moveTo(7, -4); ctx.lineTo(8.6, -10); ctx.lineTo(3.5, -7); ctx.fill();
    ctx.fillStyle = '#ff6fa6'; ctx.beginPath(); ctx.ellipse(0, 2.5, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a1838'; ctx.fillRect(-2, 1.6, 1.3, 1.8); ctx.fillRect(0.8, 1.6, 1.3, 1.8); ctx.fillRect(-4, -3, 1.6, 1.6); ctx.fillRect(2.4, -3, 1.6, 1.6);
    ctx.restore();
  }
  function stareFocus() {   // close do Arthur encarando a tela (o jogo para)
    if (cine) return null;
    var p = players.find(function (q) { return q.who === 'arthur' && q.state === 'special'; });
    if (!p) return null;
    var k = smooth(0.05, 0.3, p.st) * (1 - smooth(4.0, 4.3, p.st));
    return k > 0 ? { p: p, k: k } : null;
  }
  function specialHighlight() {
    if (cine) return cine.p;
    return players.find(function (p) {
      if (p.state !== 'special' || p.dead) return false;
      if (p.who === 'cardoso') return p.st < 2.6;
      if (p.who === 'emanuelly') return false;
      if (p.who === 'douglas') return p.st < 2.1;
      if (p.who === 'lucas') return p.st < 2.1;
      if (p.who === 'arthur') return p.st < 4.3;
      if (p.who === 'rafinha') return p.st < 2.3;
      if (p.who === 'duda') return p.st < 2.4;
      if (p.who === 'nutri') return p.st < 0.55;
      if (p.who === 'lutador') return p.st < 1.3;
      if (p.who === 'grazi') return p.st < 0.5;
      if (p.who === 'lohan') return p.st < 0.5;
      if (p.who === 'bispo') return p.st < 0.4;
      if (p.who === 'pedro') return p.st < 0.45;
      if (p.who === 'enzo') return p.st < 0.35;
      if (p.who === 'naju') return p.st < 0.2;
      if (p.who === 'fidelis') return p.st < 0.2;
      return false;
    }) || null;
  }
  function cardosoClose() {
    return players.find(function (q) { return q.who === 'cardoso' && q.state === 'special' && !q.dead; }) || null;
  }
  function cardosoFocus() {
    if (cine) return null;
    var p=cardosoClose(); if (!p) return null;
    var k=smooth(0.05,0.34,p.st)*(1-smooth(2.25,2.6,p.st));
    return k>0 ? {p:p,k:k} : null;
  }
  function shoutFocus() {   // close do Rafinha contando e gritando (o jogo para na cena, como a redação da Emanuelly)
    if (cine) return null;
    var p = players.find(function (q) { return q.who === 'rafinha' && q.state === 'special'; });
    if (!p) return null;
    var k = smooth(0.05, 0.3, p.st) * (1 - smooth(2.0, 2.3, p.st));
    return k > 0 ? { p: p, k: k } : null;
  }
  function cineDuration(p) { return p&&p.who==='emanuelly'?(window.EmanuellyVisual&&EmanuellyVisual.duration>0?EmanuellyVisual.duration:window.CreiaCombat.emanuelly.cineDuration):p && p.who==='fidelis'?3:p && p.who==='pedro' && window.PedroFX?window.PedroFX.duration:p && p.who==='adriene'&&window.AdrieneVisual?window.AdrieneVisual.duration:p && p.who==='nutri'&&window.LorranyVisual?window.LorranyVisual.duration:p && p.who==='ricardo'?RIC_CINE:p && p.who==='douglinhas' ? DGL_DURATION : p && p.who==='th' ? TH_DURATION : p && p.who==='bispo' ? 2.6 : CINE; }
  function drawBispoCine(t) {
    var duration=cineDuration(cine.p);
    var inn=smooth(0.05,0.25,t),out=smooth(duration-0.3,duration-0.05,t);
    var off=(1-inn)*-(W+40)+out*(W+40);
    // Texto e câmera usam o mesmo progresso; a frase termina antes da saída.
    var progress=smooth(0.25,1.6,t),line1='VOCÊS SÃO',line2='INDESCULPÁVEIS!';
    var count=Math.floor((line1.length+line2.length)*progress);
    ctx.fillStyle='rgba(12,4,22,0.78)';ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(off,0);
    var bg=ctx.createLinearGradient(0,44,0,228);
    bg.addColorStop(0,'#8c3817');bg.addColorStop(1,'#230b07');
    ctx.fillStyle=bg;ctx.fillRect(10,44,W-20,184);
    ctx.strokeStyle='#ffd27a';ctx.lineWidth=2;ctx.strokeRect(10,44,W-20,184);
    if(!(window.Rig && window.Rig.bispoCine && window.Rig.bispoCine(ctx,20,54,166,162,progress)))
      spr('drawPortrait',ctx,'bispo',80,110);
    if(count>0)txt(line1.slice(0,count),210,112,'#fff','left',20);
    if(count>line1.length)txt(line2.slice(0,count-line1.length),210,145,'#ffe066','left',17);
    ctx.restore();
  }

  function drawPedroCine(t) {
    var duration=window.PedroFX.duration,fade=smooth(0,.15,t)*(1-smooth(duration-.2,duration,t));
    ctx.save();ctx.globalAlpha*=fade;
    ctx.fillStyle='#0b0a10';ctx.fillRect(0,0,W,H);
    // Equalizador ao fundo e retrato em zoom usam somente o relógio da cena.
    for(var i=0;i<32;i++){
      var h=10+Math.abs(Math.sin(i*1.7-t*7))*58;
      ctx.fillStyle=i%3?'#182e23':'#4b261b';ctx.fillRect(i*16,196-h,10,h);
    }
    var zoom=smooth(.12,.85,t);
    if(!(window.Rig && Rig.pedroCine && Rig.pedroCine(ctx,32,8,416,186,zoom)))
      spr('drawPortrait',ctx,'pedro',226,64);
    ctx.fillStyle='#111018';ctx.fillRect(0,202,W,68);
    ctx.fillStyle='#ffd34d';ctx.fillRect(32,202,W-64,2);
    var one='HARMONIA BIZARRAMENTE',two='TORTAAAA!',letters=Math.floor(clamp((t-.9)/.55,0,1)*(one.length+two.length));
    if(letters>0)txt(one.slice(0,letters),W/2,224,'#fff','center',13);
    if(letters>one.length)txt(two.slice(0,letters-one.length),W/2,249,'#ffd34d','center',19);
    ctx.restore();
  }

  function drawCine() {
    if(window.FidelisAudio)FidelisAudio.sync(cine && cine.p.who==='fidelis'?cine.t:null,!paused&&!onlineHeld()&&!muted&&saved.sfx!==false);
    var lc=cardosoFocus();
    if (lc) {
      var cp=lc.p, x0=cp.x-cam, y0=cp.y-40, radius=Math.hypot(W,H)*lc.k;
      var cx=x0+(W/2-x0)*lc.k, cy=y0+(H/2-y0)*lc.k;
      ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,radius,0,Math.PI*2); ctx.clip();
      var grad=ctx.createRadialGradient(160,110,8,160,110,330);
      grad.addColorStop(0,'#264864'); grad.addColorStop(1,'#071222');
      ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
      for (var li=0;li<18;li++) {
        ctx.globalAlpha=0.13+0.08*Math.sin(cp.st*5+li);
        ctx.fillStyle=li%2?'#9ff4ff':'#ffffff';
        ctx.fillRect((li*71+Math.floor(cp.st*37))%W,(li*43)%H,2,2);
      }
      ctx.globalAlpha=1;
      var zoom=2.45+smooth(0,2.2,cp.st)*2.0;
      ctx.save(); ctx.translate(145,104+0.8*76*zoom);
      if (!(window.Rig && window.Rig.big(ctx,'cardoso','special',cp.st,0,0,1,zoom)))
        spr('drawChibi',ctx,'cardoso','special',cp.st,0,0,1,{});
      ctx.restore();
      if (cp.st<1.1) { var dots=Math.min(3,Math.floor(cp.st/0.28)); if (dots) txt('...'.slice(0,dots),310,80,'#ffffff','left',24); }
      else {
        var count=Math.max(0,Math.floor((cp.st-1.1)*24));
        txt('LIMADOS'.slice(0,count),280,64,'#9ff4ff','left',22);
        if (count>7) txt('COM SUCESSO!'.slice(0,count-7),260,104,'#ffe066','left',17);
      }
      ctx.restore();
      ctx.strokeStyle='#9ff4ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,radius,0,Math.PI*2); ctx.stroke();
      var bars=Math.round(24*lc.k); ctx.fillStyle='#0b0a10';
      ctx.fillRect(0,0,W,bars); ctx.fillRect(0,H-bars,W,bars);
      return;
    }
    var cf = coramFocus();
    if (cf) {
      var dq2 = cf.p, dx0 = dq2.x - cam, dy0 = dq2.y - 40, DR = Math.hypot(W, H) * cf.k, st2 = dq2.st;
      var dcx = dx0 + (W / 2 - dx0) * cf.k, dcy = dy0 + (H / 2 - dy0) * cf.k;
      ctx.save(); ctx.beginPath(); ctx.arc(dcx, dcy, DR, 0, Math.PI * 2); ctx.clip();
      var gd = ctx.createRadialGradient(150, 70, 10, 150, 70, 330); gd.addColorStop(0, '#fffbe6'); gd.addColorStop(0.35, '#f7c84a'); gd.addColorStop(1, '#5a3206');
      ctx.fillStyle = gd; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(200, 60);   // raios de luz girando devagar atrás dela
      for (var di = 0; di < 16; di++) { var da = di / 16 * Math.PI * 2 + st2 * 0.35; ctx.fillStyle = di % 2 ? 'rgba(255,255,255,0.22)' : 'rgba(255,240,180,0.12)';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(da) * 420, Math.sin(da) * 420); ctx.lineTo(Math.cos(da + 0.2) * 420, Math.sin(da + 0.2) * 420); ctx.fill(); }
      ctx.restore();
      for (var dj = 0; dj < 26; dj++) {   // brilhos subindo
        var du2 = (st2 * 0.45 + dj * 0.071) % 1, bx2 = (dj * 53) % W, by2 = H + 10 - du2 * (H + 30), br2 = 1 + (dj % 3);
        ctx.globalAlpha = Math.sin(du2 * Math.PI); ctx.fillStyle = dj % 4 ? '#fff6c0' : '#ffffff';
        ctx.fillRect(bx2 - br2, by2, br2 * 2, 1); ctx.fillRect(bx2, by2 - br2, 1, br2 * 2);
      }
      ctx.globalAlpha = 1;
      var zd = 2.55 + smooth(0, 2.1, st2) * 0.5;   // aproxima devagar, corpo inteiro com os braços para o céu
      ctx.save(); ctx.translate(200, 256 + (1 - Math.min(1, st2 / 0.5)) * 30);
      if (!(window.Rig && window.Rig.big(ctx, 'duda', 'special', st2, 0, 0, 1, zd))) spr('drawChibi', ctx, 'duda', 'special', st2, 0, 0, 1, {});
      ctx.restore();
      var w1d = Math.min(1, Math.max(0, (st2 - 0.6) / 0.18)), w2d = Math.min(1, Math.max(0, (st2 - 1.05) / 0.18));
      if (w1d > 0) { ctx.save(); ctx.globalAlpha = w1d; ctx.translate(372, 82); var s1d = 1 + (1 - w1d) * 1.4; ctx.scale(s1d, s1d); txt('CORAM', 0, -12, '#ffffff', 'center', 24); ctx.restore(); }
      if (w2d > 0) { ctx.save(); ctx.globalAlpha = w2d; ctx.translate(372, 124); var s2d = 1 + (1 - w2d) * 1.4; ctx.scale(s2d, s2d); txt('DEO', 0, -12, '#ffe066', 'center', 32); ctx.restore(); }
      if (st2 > 1.5) { ctx.globalAlpha = Math.min(1, (st2 - 1.5) / 0.3); txt(versus ? '+50% DE VIDA' : '+50% DE VIDA PARA O TIME', 372, 160, '#8dff9a', 'center'); ctx.globalAlpha = 1; }
      ctx.restore();
      ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dcx, dcy, DR, 0, Math.PI * 2); ctx.stroke();
      var dbr = Math.round(24 * cf.k);
      ctx.fillStyle = '#0b0a10'; ctx.fillRect(0, 0, W, dbr); ctx.fillRect(0, H - dbr, W, dbr);
      return;
    }
    var pf = pigFocus();
    if (pf) {
      var lq = pf.p, lx0 = lq.x - cam, ly0 = lq.y - 40, LR = Math.hypot(W, H) * pf.k;
      var lcx = lx0 + (W / 2 - lx0) * pf.k, lcy = ly0 + (H / 2 - ly0) * pf.k, gr = lq.st >= 0.5, zl = 2.2 + Math.min(1, lq.st / 0.6) * 1.2;
      var jt = gr ? Math.sin(lq.st * 80) * 2.2 : 0, jy = gr ? Math.cos(lq.st * 70) * 1.4 : 0;
      ctx.save(); ctx.beginPath(); ctx.arc(lcx, lcy, LR, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = gr && Math.floor(lq.st * 12) % 2 ? '#5a0a2a' : '#2a0618'; ctx.fillRect(0, 0, W, H);
      if (gr) {   // raios do grito saindo da boca
        ctx.save(); ctx.translate(230, 92);
        for (var ri = 0; ri < 18; ri++) { var ra = ri / 18 * Math.PI * 2 + lq.st * 1.5; ctx.fillStyle = ri % 2 ? 'rgba(255,111,166,0.35)' : 'rgba(255,224,102,0.25)';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ra) * 400, Math.sin(ra) * 400); ctx.lineTo(Math.cos(ra + 0.17) * 400, Math.sin(ra + 0.17) * 400); ctx.fill(); }
        ctx.restore();
        for (var pi2 = 0; pi2 < 9; pi2++) {   // porquinhos voando pela tela
          var pu = (lq.st * 0.7 + pi2 * 0.13) % 1, px2 = ((pi2 * 97) % 440) + 20 + Math.sin(lq.st * 3 + pi2) * 20, py2 = H + 20 - pu * (H + 60);
          pig(px2, py2, 1.3 + (pi2 % 3) * 0.4, Math.sin(lq.st * 6 + pi2) * 0.6);
        }
      }
      ctx.save(); ctx.translate(205 + jt, 30 + jy + 76 * zl);
      if (!(window.Rig && window.Rig.big(ctx, 'lucas', 'cutin', lq.st, 0, 0, 1, zl))) spr('drawChibi', ctx, 'lucas', 'special', lq.st, 0, 0, 1, {});
      ctx.restore();
      if (gr) {
        var lt = (lq.st - 0.5) * 22, w1 = 'PORCOS', w2 = 'NA SALA!', sc1 = 1 + Math.max(0, 1 - (lq.st - 0.5) * 6) * 1.5;
        ctx.save(); ctx.translate(372 + jt, 78); ctx.scale(sc1, sc1); txt(w1.slice(0, Math.ceil(lt)), 0, -12, '#ff9ec4', 'center', 24); ctx.restore();
        if (lt > w1.length + 2) { var sc2 = 1 + Math.max(0, 1 - (lq.st - 0.5 - (w1.length + 2) / 22) * 6) * 1.5;
          ctx.save(); ctx.translate(372 - jt, 122); ctx.scale(sc2, sc2); txt(w2.slice(0, Math.ceil(lt - w1.length - 2)), 0, -12, '#ffe066', 'center', 24); ctx.restore(); }
      }
      ctx.restore();
      ctx.strokeStyle = '#ff6fa6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lcx, lcy, LR, 0, Math.PI * 2); ctx.stroke();
      var lbr = Math.round(24 * pf.k);
      ctx.fillStyle = '#0b0a10'; ctx.fillRect(0, 0, W, lbr); ctx.fillRect(0, H - lbr, W, lbr);
      return;
    }
    var sf2 = stareFocus();
    if (sf2) {   // zoom lento no rosto furioso; "..." durante 2 s de silêncio; depois a frase
      var aq = sf2.p, sx1 = aq.x - cam, sy1 = aq.y - 40, SR2 = Math.hypot(W, H) * sf2.k;
      var scx2 = sx1 + (W / 2 - sx1) * sf2.k, scy2 = sy1 + (H / 2 - sy1) * sf2.k, zz = 2.6 + Math.min(1, aq.st / 2.1) * 2.6;
      ctx.save(); ctx.beginPath(); ctx.arc(scx2, scy2, SR2, 0, Math.PI * 2); ctx.clip();
      var gz2 = ctx.createRadialGradient(150, 110, 10, 150, 110, 300); gz2.addColorStop(0, '#3a1a1a'); gz2.addColorStop(1, '#0a0606');
      ctx.fillStyle = gz2; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(150, 112 + 0.78 * 76 * zz);
      if (!(window.Rig && window.Rig.big(ctx, 'arthur', 'special', aq.st, 0, 0, 1, zz))) spr('drawChibi', ctx, 'arthur', 'special', aq.st, 0, 0, 1, {});
      ctx.restore();
      if (aq.st < 2.1) { var nd = Math.min(3, Math.floor(aq.st / 0.55)); if (nd) txt('...'.slice(0, nd), 300, 90, '#ffffff', 'left', 20); }
      else {
        var ft = Math.floor((aq.st - 2.1) * 26), f1 = 'SAI DAÍ,', f2 = 'VÁ ESTUDAR', f3 = 'UM POUQUINHO!';
        txt(f1.slice(0, ft), 290, 60, '#ffffff', 'left', 16);
        if (ft > f1.length) txt(f2.slice(0, ft - f1.length), 290, 88, '#ffe066', 'left', 16);
        if (ft > f1.length + f2.length) txt(f3.slice(0, ft - f1.length - f2.length), 270, 116, '#ff5050', 'left', 16);
      }
      ctx.restore();
      ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(scx2, scy2, SR2, 0, Math.PI * 2); ctx.stroke();
      var sbr2 = Math.round(24 * sf2.k);
      ctx.fillStyle = '#0b0a10'; ctx.fillRect(0, 0, W, sbr2); ctx.fillRect(0, H - sbr2, W, sbr2);
      return;
    }
    var af = auraFocus();
    if (af) {   // close: zoom no rosto gritando no microfone, pegando fogo
      var dq = af.p, ax0 = dq.x - cam, ay0 = dq.y - 40, AR = Math.hypot(W, H) * af.k;
      var acx = ax0 + (W / 2 - ax0) * af.k, acy = ay0 + (H / 2 - ay0) * af.k, zs = 2.4 + Math.min(1, dq.st / 1.6) * 2.4, ar = dq.st >= 0.8;
      ctx.save(); ctx.beginPath(); ctx.arc(acx, acy, AR, 0, Math.PI * 2); ctx.clip();
      var ga = ctx.createRadialGradient(150, 120, 10, 150, 120, 320); ga.addColorStop(0, ar ? '#ffcf4a' : '#5a1a0a'); ga.addColorStop(0.5, ar ? '#e0401a' : '#2a0a06'); ga.addColorStop(1, '#1a0404');
      ctx.fillStyle = ga; ctx.fillRect(0, 0, W, H);
      var fx0 = 150, fy0 = 118, jit = ar ? Math.sin(dq.st * 70) * 1.5 : 0;
      if (ar) drawFlames(fx0 + 10, fy0 + 40, 48 * zs / 3, 75 * zs / 3, dq.st, 18, zs / 2.2);   // fogo atrás dele (contorno)
      ctx.save(); ctx.translate(fx0 + 10.5 * zs + jit, fy0 + 0.82 * 76 * zs);
      if (!(window.Rig && window.Rig.big(ctx, 'douglas', 'special', dq.st, 0, 0, 1, zs))) spr('drawChibi', ctx, 'douglas', 'special', dq.st, 0, 0, 1, {});
      ctx.restore();
      if (ar) { ctx.globalAlpha = 0.85; drawFlames(fx0, fy0 + 175, 60 * zs / 3, 18 * zs / 3, dq.st + 1, 12, zs / 2); ctx.globalAlpha = 1; }   // fogo na frente, só embaixo (rosto livre)
      var dt2 = Math.floor((dq.st - 0.3) * 24), d1 = 'DANE-SE,', d2 = 'FARMAR', d3 = 'AAAUUURAA!';
      if (dt2 > 0) txt(d1.slice(0, dt2), 300 + jit, 50, '#ffffff', 'left', 16);
      if (dt2 > d1.length) txt(d2.slice(0, dt2 - d1.length), 300 + jit, 80, '#ffe066', 'left', 16);
      if (dt2 > d1.length + d2.length) txt(d3.slice(0, dt2 - d1.length - d2.length), 266 + jit, 112, '#ff4d1a', 'left', 20);
      ctx.restore();
      ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(acx, acy, AR, 0, Math.PI * 2); ctx.stroke();
      var abr = Math.round(24 * af.k);
      ctx.fillStyle = '#0b0a10'; ctx.fillRect(0, 0, W, abr); ctx.fillRect(0, H - abr, W, abr);
      return;
    }
    var sh = shoutFocus();
    if (sh) {   // close no palco: conta "4, 4, 5, 6 e 1..." e grita a chuva de prato
      var q = sh.p, sx0 = q.x - cam, sy0 = q.y - 40, SR = Math.hypot(W, H) * sh.k;
      var scx = sx0 + (W / 2 - sx0) * sh.k, scy = sy0 + (H / 2 - sy0) * sh.k, grito = q.st >= 1.1;
      ctx.save(); ctx.beginPath(); ctx.arc(scx, scy, SR, 0, Math.PI * 2); ctx.clip();
      var gp = ctx.createLinearGradient(0, 0, 0, H); gp.addColorStop(0, '#2a0a2a'); gp.addColorStop(0.6, '#b02a6a'); gp.addColorStop(1, '#ff9a5a');
      ctx.fillStyle = gp; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff6c0';   // canhões de luz do palco
      for (var bi2 = 0; bi2 < 4; bi2++) { var bxx = 60 + bi2 * 120 + Math.sin(q.st * 3 + bi2) * 30; ctx.beginPath(); ctx.moveTo(bxx - 8, 0); ctx.lineTo(bxx + 8, 0); ctx.lineTo(bxx + 70, H); ctx.lineTo(bxx - 70, H); ctx.fill(); }
      ctx.globalAlpha = 1;
      var tr = grito ? Math.sin(q.st * 70) * 1.5 : 0;
      ctx.save(); ctx.translate(140 + tr, 262);
      if (!(window.Rig && window.Rig.rafinhaStage && window.Rig.rafinhaStage(ctx,grito,-126,-224,174,198))) spr('drawChibi', ctx, 'rafinha', 'special', q.st, 0, 0, 1, {});
      ctx.restore();
      var cont = ['6,', '5,', '4', 'EEEE...'].slice(0, q.count || 0).join(' ');
      if (cont) txt(cont, 196, 44, '#ffe066', 'left', 16);
      if (grito) {
        var gt = Math.floor((q.st - 1.1) * 30), l1 = 'CHUUUUVA', l2 = 'DE PRAAATOOOS!';
        txt(l1.slice(0, gt), 228 + tr, 92, '#ffffff', 'left', 20);
        if (gt > l1.length) txt(l2.slice(0, gt - l1.length), 196 + tr, 122, '#7dff8a', 'left', 20);
      }
      ctx.restore();
      ctx.strokeStyle = '#ff9a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(scx, scy, SR, 0, Math.PI * 2); ctx.stroke();
      var sbr = Math.round(24 * sh.k);
      ctx.fillStyle = '#0b0a10'; ctx.fillRect(0, 0, W, sbr); ctx.fillRect(0, H - sbr, W, sbr);
      return;
    }
    var sf = soloFocus();
    if (sf) {   // palco: vinheta roxa, holofotes balançando e faixas de cinema
      var gs = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 300);
      gs.addColorStop(0, 'rgba(80,40,160,0)'); gs.addColorStop(1, 'rgba(40,10,90,' + (0.6 * sf.k) + ')');
      ctx.fillStyle = gs; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      [[-1, '#5fd0ff'], [1, '#ff8fc0']].forEach(function (b) {
        var sw = Math.sin(time * 2.2 * b[0]) * 70;
        ctx.globalAlpha = 0.22 * sf.k; ctx.fillStyle = b[1];
        ctx.beginPath(); ctx.moveTo(W / 2 + b[0] * 170, -10); ctx.lineTo(W / 2 + sw - 46, H); ctx.lineTo(W / 2 + sw + 46, H); ctx.closePath(); ctx.fill();
      });
      ctx.restore();
      var bs = Math.round(24 * sf.k);
      ctx.fillStyle = '#0b0a10'; ctx.fillRect(0, 0, W, bs); ctx.fillRect(0, H - bs, W, bs);
      return;
    }
    var pf = petFocus();
    if (pf) {   // close no gatinho: abre um círculo a partir dele com o gato grande e as mãos fazendo carinho
      var R0 = Math.hypot(W, H) * pf.k, ox0 = cat.x - cam, oy0 = cat.y - 12;
      var cx0 = ox0 + (W / 2 - ox0) * pf.k, cy0 = oy0 + (H / 2 - oy0) * pf.k;
      ctx.save(); ctx.beginPath(); ctx.arc(cx0, cy0, R0, 0, Math.PI * 2); ctx.clip();
      var gp = ctx.createRadialGradient(W / 2, H / 2 + 20, 20, W / 2, H / 2, 300);
      gp.addColorStop(0, '#fff3d6'); gp.addColorStop(0.55, '#ffc98a'); gp.addColorStop(1, '#e8783a');
      ctx.fillStyle = gp; ctx.fillRect(0, 0, W, H);
      for (var hi = 0; hi < 14; hi++) {   // coraçõezinhos subindo ao fundo
        var hx = (hi * 71) % W, hy = H - ((time * 22 + hi * 53) % (H + 30));
        ctx.globalAlpha = 0.35; spr('drawItem', ctx, 'coracao', Math.round(hx), Math.round(hy), 0, 0.6 + (hi % 3) * 0.2);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(120,60,20,0.25)'; ctx.beginPath(); ctx.ellipse(W / 2, 228, 70, 9, 0, 0, Math.PI * 2); ctx.fill();
      var hands = players.filter(function (q) { return q.state === 'pet'; }).map(function (q) { return { who: q.who, slot: { nutri: 0, lutador: 1, emanuelly: 2, enzo: 3, pedro: 2, naju: 3, grazi: 0, bispo: 1, lohan: 2, rafinha: 3, douglas: 1, fidelis: 2, arthur: 0, lucas: 1, duda: 3, cardoso: 1, th:1, douglinhas:1 }[q.who] }; });
      ctx.save(); ctx.translate(W / 2, 228); ctx.scale(5.2, 5.2);
      if (!(window.Rig && window.Rig.cat && window.Rig.cat(ctx, 'purr', cat.st, 0, 0, { hands: hands }))) spr('drawCat', ctx, 'purr', cat.st, 0, 0);
      ctx.restore();
      ctx.restore();
      ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx0, cy0, R0, 0, Math.PI * 2); ctx.stroke();
      var bp = Math.round(24 * pf.k);
      ctx.fillStyle = '#0b0a10'; ctx.fillRect(0, 0, W, bp); ctx.fillRect(0, H - bp, W, bp);
      if (pf.p.st > 0.5) {
        ctx.save(); ctx.globalAlpha = pf.k; ctx.translate(W - 96, 64 + Math.sin(time * 30) * 1.2); ctx.rotate(0.12);
        txt('RRRRR~', 0, 0, '#a8461a', 'center', 16); ctx.restore();
        if (pf.k > 0.6) txt('GATINHO: +15% DE VIDA', W / 2, H - bp - 16, '#fff', 'center');
      }
      return;
    }
    var kf = kissFocus();
    if (kf) {
      // vinheta rosa e o "CHU!" no instante do beijo
      var g = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 300);
      g.addColorStop(0, 'rgba(255,120,190,0)'); g.addColorStop(1, 'rgba(255,60,150,' + (0.55 * kf.k) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var bars = Math.round(26 * kf.k);
      ctx.fillStyle = '#0b0a10'; ctx.fillRect(0, 0, W, bars); ctx.fillRect(0, H - bars, W, bars);
      var ks = kf.p.st - 0.55;
      if (ks > 0 && ks < 0.08) { ctx.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - ks / 0.08)) + ')'; ctx.fillRect(0, 0, W, H); }
      if (ks > 0) {
        var pop = 1 + 0.6 * Math.max(0, 1 - ks / 0.15);
        ctx.save(); ctx.translate(W / 2, 52); ctx.scale(pop, pop); ctx.rotate(-0.08);
        txt('CHU!', 0, -12, '#ff8fc0', 'center', 24); ctx.restore();
      }
      return;
    }
    if (!cine) return;
    var t = cine.t, p = cine.p;
    if(p.who==='emanuelly'&&window.EmanuellyVisual&&typeof EmanuellyVisual.cena==='function'){
      var io={t:t,duration:cineDuration(p),p:p,cam:cam,time:time,img:function(n){return window.EmanuellyArt&&EmanuellyArt.img(n);},text:txt,cenario:function(g){bg('draw',g,stage,Math.round(cam),time);}};   // a arena de verdade por trás da chuva de lâminas
      if(EmanuellyVisual.cena.length>=5)EmanuellyVisual.cena(ctx,t,W,H,io);else EmanuellyVisual.cena(ctx,W,H,io);
      return;
    }
    if(p.who==='fidelis' && window.FidelisVisual){FidelisVisual.cinematic(ctx,t,W,H);return;}
    if(p.who==='pedro' && window.PedroFX){drawPedroCine(t);return;}
    if(p.who==='bispo') { drawBispoCine(t); return; }
    if(p.who==='th') { drawThCine(t); return; }
    if(p.who==='douglinhas'){drawDouglinhasCine(t);return;}
    if(p.who==='ricardo'){drawRicardoCine(t);return;}
    if(p.who==='nutri'&&window.LorranyVisual){LorranyVisual.cinematic(ctx,t,W,H,{img:function(n){return window.LorranyArt&&LorranyArt.img(n);},text:txt});return;}
    if(p.who==='adriene'&&window.AdrieneVisual){AdrieneVisual.cinematic(ctx,t,W,H,{hero:function(c,x,y,s,tt){if(window.Rig)Rig.big(c,'adriene','special',tt,x,y,1,s);},text:txt});return;}
    if(p.who==='emanuelly')t*=CINE/cineDuration(p);   // o corte padrão ocupa toda a duração configurada
    var dark = smooth(0, 0.08, t) * (1 - smooth(CINE - 0.15, CINE, t));
    ctx.fillStyle = 'rgba(12,4,22,' + (0.7 * dark) + ')'; ctx.fillRect(0, 0, W, H);
    // a Nutri continua acesa e brilha em rosa por cima do escuro
    var me = p.who === 'nutri', em = p.who === 'emanuelly', ez = p.who === 'enzo', pg = p.who === 'pedro', nj = p.who === 'naju', gz = p.who === 'grazi', bi = p.who === 'bispo', lo = p.who === 'lohan', rf = p.who === 'rafinha', dg = p.who === 'douglas', fd = p.who === 'fidelis', at = p.who === 'arthur', lg = p.who === 'lucas', du = p.who === 'duda', lc = p.who === 'cardoso';
    spr('drawChibi', ctx, p.who, me ? 'victory' : em ? 'cutin' : 'special', me ? t : 0.6, Math.round(p.x - cam), Math.round(p.y - p.z), p.facing, { flash: Math.floor(t * 16) % 2 === 0 && t < 0.3 });
    // faixa inclinada que atravessa a tela com o rosto dela grande
    var inn = smooth(0.05, 0.25, t), out = smooth(CINE - 0.3, CINE - 0.05, t);
    var y0 = 74, y1 = 186, sk = 40, off = (1 - inn) * -(W + sk) + out * (W + sk);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(off + sk, y0); ctx.lineTo(off + W + sk, y0); ctx.lineTo(off + W, y1); ctx.lineTo(off, y1); ctx.closePath();
    var bg2 = ctx.createLinearGradient(0, y0, 0, y1);
    if (me) { bg2.addColorStop(0, '#ff5fa8'); bg2.addColorStop(0.5, '#c2186b'); bg2.addColorStop(1, '#5a0a3a'); }
    else if (du) { bg2.addColorStop(0, '#fff6d0'); bg2.addColorStop(0.5, '#e0a82a'); bg2.addColorStop(1, '#4a2a06'); }
    else if (lc) { bg2.addColorStop(0, '#9ff4ff'); bg2.addColorStop(0.5, '#27608a'); bg2.addColorStop(1, '#081a32'); }
    else if (lg) { bg2.addColorStop(0, '#ffb3d0'); bg2.addColorStop(0.5, '#c2306a'); bg2.addColorStop(1, '#2a0618'); }
    else if (at) { bg2.addColorStop(0, '#9fd8ff'); bg2.addColorStop(0.5, '#2a5a9a'); bg2.addColorStop(1, '#0a1a3a'); }
    else if (fd) { bg2.addColorStop(0, '#ff8a3a'); bg2.addColorStop(0.5, '#3a2a8a'); bg2.addColorStop(1, '#0a0a2a'); }
    else if (dg) { bg2.addColorStop(0, '#ffcf4a'); bg2.addColorStop(0.5, '#e0401a'); bg2.addColorStop(1, '#3a0606'); }
    else if (lo) { bg2.addColorStop(0, '#ffe14d'); bg2.addColorStop(0.5, '#1f9a3a'); bg2.addColorStop(1, '#0a3a1a'); }
    else if (rf) { bg2.addColorStop(0, '#ff9a5a'); bg2.addColorStop(0.5, '#b02a6a'); bg2.addColorStop(1, '#2a0a2a'); }
    else if (bi) { bg2.addColorStop(0, '#ffd27a'); bg2.addColorStop(0.5, '#d2401a'); bg2.addColorStop(1, '#3a0a06'); }
    else if (gz) { bg2.addColorStop(0, '#ffb3e0'); bg2.addColorStop(0.5, '#d23c86'); bg2.addColorStop(1, '#4a0a2e'); }
    else if (nj) { bg2.addColorStop(0, '#7ff0ff'); bg2.addColorStop(0.5, '#1a8fb0'); bg2.addColorStop(1, '#06283a'); }
    else if (pg) { bg2.addColorStop(0, '#9dff8a'); bg2.addColorStop(0.5, '#2f9a3a'); bg2.addColorStop(1, '#0d3a14'); }
    else if (ez) { bg2.addColorStop(0, '#ffc46b'); bg2.addColorStop(0.5, '#e0601a'); bg2.addColorStop(1, '#4a1a06'); }
    else if (em) { bg2.addColorStop(0, '#d8b0ff'); bg2.addColorStop(0.5, '#7a3fd0'); bg2.addColorStop(1, '#2a1250'); }
    else { bg2.addColorStop(0, '#5fd0ff'); bg2.addColorStop(0.5, '#1b5fc2'); bg2.addColorStop(1, '#0b1e4a'); }
    ctx.fillStyle = bg2; ctx.fill(); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (var i = 0; i < 22; i++) {   // linhas de velocidade
      var ly = y0 + ((i * 37) % (y1 - y0)), lw = 30 + (i * 53) % 90;
      var lx = ((i * 97 + t * 900) % (W + 200)) - 100 + off;
      ctx.fillRect(Math.round(lx), ly, lw, i % 3 ? 1 : 2);
    }
    var ps = em ? 2.5 : nj ? 6.2 : du ? 1.95 : 2.4, px = off + 130 + t * 12;   // Lorrany: arte inteira dela se esticando no beijo
    if (nj) px = off + 165 + t * 6 + Math.sin(t * 60) * 1.5;   // close no rosto, tremendo com o grito
    var enzoFramed=ez && window.Rig && window.Rig.enzoCine && window.Rig.enzoCine(ctx,off+24,y0+4,165,y1-y0-8);
    var lohanFramed=lo && window.Rig && window.Rig.lohanCine && window.Rig.lohanCine(ctx,off+24,y0+4,165,y1-y0-8);
    var graziFramed=gz && window.Rig && window.Rig.graziCine && window.Rig.graziCine(ctx,off+24,y0+4,165,y1-y0-8);
    if (!enzoFramed && !lohanFramed && !graziFramed && !(window.Rig && window.Rig.big(ctx, p.who, p.who === 'lutador' || ez || lo || rf || dg || fd || at || lg || du || lc ? 'cutin' : 'special', me ? 0.7 : nj ? 0.15 + t : 0.6 + t * 0.4, px, y0 + 76 * ps * (nj ? 0.79 : pg ? 1.02 : du ? 0.92 : 0.86), 1, ps))) spr('drawPortrait', ctx, p.who, px - 14, y0 + 30);
    ctx.restore();
    ctx.fillStyle = '#ffe066'; ctx.fillRect(Math.round(off + sk), y0 - 2, W, 2); ctx.fillRect(Math.round(off), y1, W, 2);
    // nome do golpe entra pelo lado oposto
    var tx = W - 18 + (1 - inn) * (W) - out * (W + 60);
    txt(me ? 'BEIJINHO' : em ? 'CHUVA DE' : ez ? 'CHUVA DE' : pg ? 'HARMONIA BIZARRAMENTE' : nj ? 'SOLTA' : gz ? 'VÃO, MINHAS' : bi ? 'VOCÊS SÃO' : lo ? 'SUPER' : rf ? 'CHUVA DE' : dg ? 'DANE-SE,' : fd ? 'INVERSÃO' : at ? 'VÁ ESTUDAR' : lg ? 'PORCOS' : du ? 'CORAM' : lc ? 'LIMADOS' : 'SOLO DE', tx, pg ? 120 : 116, '#fff', 'right', pg ? 12 : 20);
    txt(me ? 'DE CURA' : em ? 'LÂMINAS!' : ez ? 'BASQUETE!' : pg ? 'TORTAAAA!' : nj ? 'A VOZ!' : gz ? 'CRIANÇAS!' : bi ? 'INDESCULPÁVEIS!' : lo ? 'FLASH!' : rf ? 'PRATO!' : dg ? 'FARMAR AURA!' : fd ? 'DE ACORDE!' : at ? 'UM POUQUINHO!' : lg ? 'NA SALA!' : du ? 'DEO!' : lc ? 'COM SUCESSO!' : 'GUITARRA!', tx - 10, 142, me || em || bi ? '#ffe066' : '#7dff8a', 'right', bi ? 18 : 20);
    if (t < 0.1) { ctx.fillStyle = 'rgba(255,255,255,' + (0.8 * (1 - t / 0.1)) + ')'; ctx.fillRect(0, 0, W, H); }
  }
  function bar(x, y, w, h, frac, col, back) {
    ctx.fillStyle = '#0b0a10'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = back || '#3a2630'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = col; ctx.fillRect(x, y, Math.round(w * clamp(frac, 0, 1)), h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, Math.round(w * clamp(frac, 0, 1)), 1);
  }
  function pad(n) { var s = String(Math.floor(n)); while (s.length < 7) s = '0' + s; return s; }
  function drawRoundMarks(r) {
    if (!r) return;
    function dot(x,y,on,col) {
      ctx.fillStyle='#0b0a10'; ctx.fillRect(x-2,y-2,14,14);
      ctx.fillStyle=on?col:'#383442'; ctx.fillRect(x,y,10,10);
      ctx.fillStyle=on?'#fff1a3':'#77717e'; ctx.fillRect(x+3,y+2,4,4);
    }
    txt('P1',156,42,PCOL[0]); txt('P2',312,42,PCOL[1]);
    for (var i=0;i<2;i++) { dot(185+i*16,40,i<r.wins[0],PCOL[0]); dot(278+i*16,40,i<r.wins[1],PCOL[1]); }
  }
  function drawVersusOverlay(r,team) {
    if(cine)return;
    if (!r || !team || team.length<2) return;
    if(window.CultoVisual && (r.phase==='culto'||(r.phase==='intro'&&r.contagem)||r.phase==='match'||(r.phase==='fight'&&r.contagem&&r.announceT>0))) {
      var o={t:r.t,apresentador:cultoApresentador(team),nomes:team.map(function(p){return NAMES[p.who];}),
        big:function(){return window.Rig&&window.Rig.big.apply(window.Rig,arguments);},
        cenario:function(g){bg('draw',g,stage,CAM_MAX,time);}};
      if(r.phase==='match'){o.vencedor=team[r.matchWinner].who;o.nome=NAMES[o.vencedor];CultoVisual.encerramento(ctx,W,H,o);}
      else {if(r.phase!=='culto')o.contagem=r.phase==='fight'?'LUTEM!':String(3-Math.min(2,Math.floor(r.t/CULTO_PASSO)));CultoVisual.abertura(ctx,W,H,o);}
      return;
    }
    if(r.phase==='culto'){
      txt('ROUND 1',240,80,'#ffd34d','center',16);
      return;
    }
    if (r.phase==='intro') {
      ctx.fillStyle='rgba(8,6,14,.58)'; ctx.fillRect(0,68,W,130);
      txt(r.number>=3?'ROUND FINAL':'ROUND '+r.number,240,98,'#ffe066','center',24);
      txt('PREPAREM-SE',240,139,'#fff','center',10);
    } else if (r.phase==='fight' && r.announceT>0) {
      txt('LUTEM!',240,102,'#ffe066','center',24);
    } else if (r.phase==='ko') {
      ctx.fillStyle='rgba(8,6,14,.68)'; ctx.fillRect(0,68,W,140);
      txt('K.O.!',240,83,'#ff5050','center',28);
      txt(r.roundWinner===null?'EMPATE! ROUND REPETIDO':NAMES[team[r.roundWinner].who]+' VENCEU O ROUND!',240,132,'#ffe066','center',10);
      txt(r.wins[0]+' x '+r.wins[1],240,158,'#fff','center',16);
    } else if (r.phase==='match') {
      ctx.fillStyle='rgba(8,6,14,.72)'; ctx.fillRect(0,65,W,150);
      txt(NAMES[team[r.matchWinner].who]+' VENCEU O X1!',240,92,'#ffe066','center',14);
      txt(r.wins[0]+' x '+r.wins[1],240,129,'#fff','center',24);
      txt('MELHOR DE 3',240,169,'#a9e9ff','center',10);
    }
  }
  function drawX1HUD(){
    window.CreiaHUD.x1(ctx,{players:players,names:NAMES,round:vsRound},function(who,x,y){spr('drawPortrait',ctx,who,x,y);});
  }
  function drawHUD() {
    if(cine)return;
    if(versus){drawX1HUD();return;}
    var done=waves.filter(function(w){return w.done;}).length;
    var live=bosses.filter(function(b){return !b.dead&&!b.vs;});
    window.CreiaHUD.adventure(ctx,{players:players,names:NAMES,stage:stage,place:place(stage),wave:Math.min(waves.length,done+(wave?1:0)||1),waves:waves.length,score:pad(score),hi:pad(saved.hi),combo:combo,mult:mult(),bossOn:bossOn,bosses:bossIntro?[]:live},function(who,x,y){spr('drawPortrait',ctx,who,x,y);});
    if (bannerT > 0 && !paused && !cine && !kissFocus() && !petFocus() && !soloFocus() && !shoutFocus() && !auraFocus() && !stareFocus() && !cardosoFocus() && !pigFocus() && !coramFocus() && Math.floor(bannerT * 6) % 6) {
      if (versus) {
        txt('X1!', 240, 96, '#ff4d4d', 'center', 16);
        txt(NAMES[players[0].who] + ' VS ' + NAMES[players[1].who], 240, 120, '#ffe066', 'center');
      } else if (bossOn) {
        txt('CHEFE!', 240, 96, '#ff4d4d', 'center', 16);
        txt(String((live[0] && live[0].name) || 'PODRÃO').toUpperCase(), 240, 120, '#ffe066', 'center');
      } else {
        txt('FASE ' + stage, 240, 90, '#ffe066', 'center', 16);
        txt(place(stage), 240, 114, '#ffffff', 'center');
        txt('BANGU, RIO DE JANEIRO', 240, 128, '#9fe0d0', 'center');
      }
    }
    if (goT > 0 && !stareFocus() && !cardosoFocus() && !pigFocus() && !coramFocus() && !shoutFocus() && !auraFocus() && Math.floor(goT * 4) % 2) txt('VAI! >>', 470, 120, '#ffe066', 'right', 16);
    if (phase === 'clear') {
      txt('FASE CONCLUÍDA!', 240, 100, '#7dff8a', 'center', 16);
      if (stage < 10) txt('PRÓXIMA: FASE ' + (stage + 1), 240, 124, '#ffffff', 'center');
    }
  }

  var NAMES = { nutri: 'LORRANY', lutador: 'MARCOS FELIPE', emanuelly: 'EMANUELLY', enzo: 'ENZO GABRIEL', pedro: 'PEDRO GUILHERME', naju: 'NAJU', grazi: 'GRAZI', bispo: 'BISPO ANDRÉ', lohan: 'LOHAN', rafinha: 'RAFINHA', douglas: 'DOUGLAS FEIJÓ', fidelis: 'FIDELIS', arthur: 'ARTHUR', lucas: 'LUCAS GARCIA', duda: 'DUDA SOUZA', cardoso: 'LUCAS CARDOSO', th:'THIAGO (TH)', douglinhas:'DOUGLINHAS',ricardo:'RICARDO',adriene:'ADRIENE' };
  var MENU = ['X1', 'Modo Aventura em Bangu', 'CONTROLES', 'CONFIGURAÇÕES', 'RANKING'];
  var localVs={mode:'pve',levels:['medio','medio']};
  var x1Sel = 0, online = null, onlineNotice = '', onlineNoticeT = 0;
  var rankRows = null, rankError = false, scorePrompted = false, scorePending = false;
  function onlineExit(message) {
    if (window.BanguOnline) window.BanguOnline.leave();
    online = null; versus = false; vsRound = null; paused = false; scene = 'menu'; updateTouchButtons();
    if (message) { onlineNotice = message; onlineNoticeT = 4; }
  }
  function onlineBegin(host, code, mode) {
    online = { coop:mode==='coop', allies:[],stage:1,configured:false,lastInput:time,seq:0, host:host, code:code || '', cur:0, choice:null, other:null,
      input:{x:0,y:0}, inputSeq:0, inputAtTime:0, pending:{}, snapshots:[], sendT:0, snapT:0,
      nextSeq:0, sentInputs:[], pred:null, playback:null, lastSent:null, urgent:false,
      renderOwn:null, renderOther:null, sounds:[], soundId:0, heardId:0,
      matchId:1,rematchSelf:false,rematchOther:false,result:undefined, resultT:0, started:false, peerReady:false, peerAway:false, selfAway:false };
    scene = 'onlineSelect';
  }
  function onlineRematch(mode){
    mode=mode==='select'?'select':'rematch';
    if(!online || online.result===undefined || onlineHeld() || (online.rematchSelf&&(mode!=='select'||online.selfMode==='select')))return;
    var current=online,id=online.matchId;
    if(window.BanguOnline.send({type:'rematch',mode:mode,matchId:id})&&online===current&&online.matchId===id&&online.result!==undefined){online.rematchSelf=true;online.selfMode=mode;}
  }
  function reselectOnline(matchId){
    if(!online)return;
    var previous=online;onlineBegin(previous.host,previous.code);online.matchId=matchId;online.peerReady=previous.peerReady;online.peerAway=previous.peerAway;online.selfAway=previous.selfAway;
    versus=false;vsRound=null;paused=false;showCtl=false;showCfg=false;cine=null;players=[];bosses=[];shots=[];eshots=[];
    keys.clear();pressed.clear();physicalPressed.clear();touchHeld.clear();touchPressed.clear();updateTouchButtons();
  }
  function restartOnline(){
    if(!online||!online.host||online.result===undefined)return;
    online.matchId++;online.result=undefined;online.rematchSelf=false;online.rematchOther=false;online.selfMode=null;online.otherMode=null;
    online.input={x:0,y:0};online.inputSeq=0;online.inputAtTime=0;online.nextSeq=0;online.pred=null;online.pending={};online.snapshots=[];online.sounds=[];online.soundId=0;online.heardId=0;
    window.BanguOnline.send({type:'start',team:[online.choice,online.other]});
    startTeam([{who:online.choice,ctl:0},{who:online.other,ctl:1}],false,true);paused=false;showCtl=false;
  }
  function onlineHeld() { return !!(online && (online.selfAway || online.peerAway&&!(online.coop&&online.host&&online.started))); }
  function coopControl(away){
    if(!online||!online.coop||!online.host||!online.started||!players[1])return;
    var p=players[1];p.ai=away;p.ctl=away?null:1;online.input={x:0,y:0};
    if(away){onlineNotice='JOGADOR 2 DESCONECTADO - IA ASSUMIU';onlineNoticeT=3;}
  }
  function drawReconnect() {
    ctx.fillStyle='rgba(8,6,14,0.72)'; ctx.fillRect(0,0,W,H);
    txt('RECONECTANDO...',240,116,'#ffe066','center',16);
  }
  if (window.BanguOnline) {
    window.BanguOnline.onMessage = function (msg) {
      if (msg.type === 'cancel') { onlineExit(); return; }
      if (msg.type === 'left' || msg.type === 'error') {
        if(msg.type==='left'&&online&&online.coop&&online.snapshots.length&&['gameover','ending'].indexOf(online.snapshots[online.snapshots.length-1].state.scene)>=0){onlineExit();return;}
        onlineExit(msg.type === 'error' ? (msg.message || 'SEM CONEXÃO') : online && online.result !== undefined ? '' : scene === 'onlineWait' ? 'SEM CONEXÃO' : 'ADVERSÁRIO SAIU'); return;
      }
      if (msg.type === 'created') {
        onlineBegin(true,msg.code,msg.mode); window.BanguOnline.showLink(msg.code); return;
      }
      if (msg.type === 'joined') { onlineBegin(false,msg.code,msg.mode); return; }
      if (msg.type === 'reconnecting') {
        if (online) { online.selfAway=true; online.input={x:0,y:0}; online.pending={}; }
        return;
      }
      if (msg.type === 'resumed') {
        var same=online && online.code===msg.code && online.host===(msg.role==='host');
        if (!same) onlineBegin(msg.role==='host',msg.code,msg.mode);
        online.selfAway=false; online.peerAway=!!msg.otherAway;
        if(msg.selecting){reselectOnline(msg.matchId);online.peerReady=!!msg.peerReady;online.choice=msg.choice||null;online.other=msg.otherChoice||null;window.BanguOnline.hideOverlay();return;}
        online.matchId=msg.matchId||online.matchId;online.rematchSelf=!!msg.rematchSelf;online.rematchOther=!!msg.rematchOther;if(msg.finished)online.result=msg.winner==null?-1:msg.winner;
        online.selfMode=msg.selfMode;online.otherMode=msg.otherMode;
        online.peerReady=!!msg.peerReady; online.choice=msg.choice||online.choice;
        online.other=msg.otherChoice||online.other;
        if (online.host && !online.peerReady) window.BanguOnline.showLink(msg.code);
        else window.BanguOnline.hideOverlay();
        if (online.choice && !msg.started) window.BanguOnline.send({type:'choice',who:online.choice,matchId:online.matchId});
        if(online.coop&&msg.started){
          online.started=true;online.stage=msg.stage||1;online.metaAck=0;
          if(online.host&&!same){onlineExit('ANFITRIÃO RECARREGOU: CRIE UMA NOVA SALA');return;}
          if(!online.host){scene='onlinePlay';versus=false;if(msg.snapshot)receiveAdventure(msg.snapshot);updateTouchButtons();}
          else coopControl(online.peerAway);
          return;
        }
        if (msg.started && !same && Array.isArray(msg.team) && msg.team.length===2) {
          online.started=true;
          if (online.host) {
            menuStage=1; startTeam([{who:msg.team[0],ctl:0},{who:msg.team[1],ctl:1}],false,true);
            if (msg.snapshot && msg.snapshot.players && msg.snapshot.players.length===2) {
              msg.snapshot.players.forEach(function (saved,i) { Object.assign(players[i],saved); });
              players.forEach(function (p) { p.kissTarget=players[p.kissTarget]||null; });
              if (msg.snapshot.round) vsRound=msg.snapshot.round;
              cam=msg.snapshot.cam; time=msg.snapshot.time;
              perfeitaSeq=msg.snapshot.perfeitaSeq||0;perfeitaEvents=[];
            }
            paused=false; showCtl=false;
          } else {
            scene='onlinePlay'; versus=true; updateTouchButtons();
            if (msg.snapshot) online.snapshots.push({state:msg.snapshot,at:performance.now()});
          }
        }
        return;
      }
      if (msg.type === 'peer') { if (online) {online.peerReady=true;if(online.coop&&online.started){online.lastInput=time;online.metaAck=0;coopControl(online.peerAway);}} window.BanguOnline.hideOverlay(); return; }
      if (!online) return;
      if(msg.type==='match-started'){online.matchId=msg.matchId;return;}
      if(msg.type==='reselect'&&msg.matchId>online.matchId){reselectOnline(msg.matchId);return;}
      if(msg.type==='rematch-state' && msg.matchId===online.matchId){online.rematchSelf=!!msg.self;online.rematchOther=!!msg.other;online.selfMode=msg.selfMode;online.otherMode=msg.otherMode;return;}
      if(msg.type==='rematch-ready' && online.host && msg.matchId===online.matchId){restartOnline();return;}
      if (msg.type === 'away') { online.peerAway=true;coopControl(true); online.input={x:0,y:0}; online.pending={}; return; }
      if (msg.type === 'back') {
        online.peerAway=false;online.lastInput=time;online.metaAck=0;if(online.coop){online.inputSeq=0;online.inputAtTime=time;}coopControl(false); online.input={x:0,y:0}; online.pending={};
        if (scene==='onlineSelect' && online.choice) window.BanguOnline.send({type:'choice',who:online.choice,matchId:online.matchId});
        return;
      }
      if (msg.type === 'choice' && scene === 'onlineSelect') {
        online.other = msg.who;
        if (online.choice === online.other) { online.choice = null; onlineNotice = 'ESCOLHAM LUTADORES DIFERENTES'; onlineNoticeT = 3; }
      }
      if (msg.type === 'start' && !online.host) { resetCombatVisuals();online.matchId=msg.matchId||online.matchId;online.result=undefined;online.rematchSelf=false;online.rematchOther=false;online.selfMode=null;online.otherMode=null;online.snapshots=[];online.pred=null;online.playback=null;online.lastSnapshotSeq=0;online.meta=null;online.nextSeq=0;online.sentInputs=[];online.pending={};online.heardId=0;online.started = true;online.coop=msg.mode==='coop'; versus = !online.coop; scene = 'onlinePlay'; updateTouchButtons(); }
      if (msg.type === 'snapshot' && !online.host && msg.state && scene === 'onlinePlay') {
        if(online.coop){receiveAdventure(msg.state);return;}
        if(msg.state.matchId!=null && msg.state.matchId!==online.matchId)return;
        var previous=online.snapshots[online.snapshots.length-1];
        // Um estado atrasado não pode desfazer posição, dano ou confirmação de comandos.
        if (previous && msg.state.time < previous.state.time) return;
        if (previous && (guestRoundKey(previous.state)!==guestRoundKey(msg.state)||msg.state.round&&msg.state.round.phase==='intro'&&previous.state.round&&previous.state.round.phase!=='intro')) {
          resetCombatVisuals();
          online.snapshots=[]; online.playback=null;
        }
        reconcileGuest(msg.state);
        online.snapshots.push({state:msg.state,at:performance.now()});
        // Conserva o par em reprodução mesmo quando vários pacotes chegam juntos.
        while (online.snapshots.length>2 && online.playback &&
            online.snapshots[1].state.time<=online.playback.time) online.snapshots.shift();
        if (online.snapshots.length > 32) online.snapshots.shift();
        (msg.state.sounds || []).forEach(function (ev) {
          if (ev[0] > online.heardId) { online.heardId = ev[0]; sfx(ev[1]); }
        });
        (msg.state.perfeitas||[]).forEach(function(ev){
          if(ev[0]>(online.perfeitaSeen||0)){
            online.perfeitaSeen=ev[0];
            if(msg.state.time-ev[4]<=.45&&window.DefesaVisual&&DefesaVisual.spawn)DefesaVisual.spawn(ev[1],ev[2],ev[3]);
          }
        });
      }
      if (msg.type === 'input' && online.host && msg.input) {
        if(msg.input.matchId!=null && msg.input.matchId!==online.matchId)return;
        if(online.coop){
          if(msg.input.matchId!==online.matchId||!Number.isSafeInteger(msg.input.seq)||msg.input.seq<=online.inputSeq||!Number.isFinite(msg.input.x)||!Number.isFinite(msg.input.y)||Math.abs(msg.input.x)>1||Math.abs(msg.input.y)>1)return;
          online.lastInput=time;online.metaAck=msg.input.metaAck||0;if(players[1]&&players[1].ai)coopControl(false);
        }
        var ri = online.input;
        ri.x = msg.input.x; ri.y = msg.input.y;
        ri.use = !!msg.input.use;
        if (msg.input.use) online.lastUseTime = time;
        if (msg.input.seq != null) { online.inputSeq=msg.input.seq; online.inputAtTime=time; }
        ['atk','jump','spc','alt','taunt'].forEach(function (k) { ri[k] = ri[k] || msg.input[k]; });
      }
      if (msg.type === 'result' && !online.host && (msg.matchId==null||msg.matchId===online.matchId)) { online.result = msg.winner == null ? -1 : msg.winner; online.resultT = 0; }
    };
    if (window.BanguOnline.restore && window.BanguOnline.restore()) scene='onlineWait';
    else if (window.BanguOnline.pendingCode) setTimeout(function () {
      scene = 'onlineWait'; window.BanguOnline[window.BanguOnline.pendingMode==='coop'?'joinCoop':'join'](window.BanguOnline.pendingCode);
    }, 50);
  }
  function drawSimpleMenu(title, items, selected) {
    drawMenu(); ctx.fillStyle = 'rgba(8,6,14,.9)'; ctx.fillRect(0,0,W,H);
    txt(title,240,48,'#ffe066','center',16);
    panel(100,78,280,items.length*32+22,'#181521','#e8323c');
    items.forEach(function (label,i) {
      if (i===selected) panel(112,89+i*32,256,23,'#e8323c');
      txt(label,240,96+i*32,i===selected?'#fff':'#aaa7b7','center');
    });
    txt('ESC VOLTA',240,242,'#8f8c9e','center');
  }
  // Tela do X1: 6 cartões lado a lado (setas laterais trocam, cima/baixo mudam a opção do cartão, ENTER escolhe)
  var X1_CARDS = ['pve','pvp','eve','online','torneio','escalada'], X1_TITLES = ['P1 × IA','P1 × P2','IA × IA','X1 ONLINE','TORNEIO','ESCALADA'];
  var TOUR_SIZES = [4, 8, 12, 16], x1Opt = { online: 0, torneio: 0 };
  function x1Go(index) {
    var card = X1_CARDS[index]; x1Sel = index; sfx('select');
    if (card === 'pve' || card === 'pvp' || card === 'eve') { localVs.mode = card; openSelect(true); }
    else if (card === 'online' && x1Opt.online === 0) { scene='onlineWait'; window.BanguOnline.create(); }
    else if (card === 'online') window.BanguOnline.askText('CÓDIGO DA SALA',5).then(function (code) {
      if (code) { scene='onlineWait'; window.BanguOnline.join(code); }
    });
    else if (card === 'torneio') openSelect(false, TOUR_SIZES[x1Opt.torneio]);
    else if (card === 'escalada') openSelect(false, 0, true);
  }
  function updateX1Menu() {
    if (menuKey('back')) { scene='menu'; return; }
    if (menuKey('left') || menuKey('right')) { x1Sel=(x1Sel+(menuKey('left')?X1_CARDS.length-1:1))%X1_CARDS.length; sfx('menu'); }
    var card = X1_CARDS[x1Sel], dir = menuKey('up') ? -1 : menuKey('down') ? 1 : 0, levels=['facil','medio','dificil'];
    if (dir) {
      if (card === 'online') x1Opt.online = 1 - x1Opt.online;
      else if (card === 'torneio') x1Opt.torneio = (x1Opt.torneio + dir + TOUR_SIZES.length) % TOUR_SIZES.length;
      else if (card === 'pve' || card === 'eve') {   // IA × IA: cima/baixo mudam as duas; 1 e 2 mudam cada uma
        var lv = levels[(levels.indexOf(localVs.levels[1]) + dir + 3) % 3];
        localVs.levels[1] = lv; if (card === 'eve') localVs.levels[0] = lv;
      }
      if (card !== 'pvp' && card !== 'escalada') sfx('menu');
    }
    if(anyPressed(['Digit1','Digit2'])){var side=anyPressed(['Digit1'])?0:1;localVs.levels[side]=levels[(levels.indexOf(localVs.levels[side])+1)%3];}
    if (menuKey('ok')) { x1Go(x1Sel); return; }
    if (scene==='x1menu') drawSimpleMenu('X1', X1_TITLES, x1Sel);   // por baixo da tela moderna (interface.js)
  }
  function updateOnlineSelect(dt) {
    if (!online) return;
    if (menuKey('back')) { onlineExit(); return; }
    if (online.host && !online.peerReady) { drawSimpleMenu('SALA '+online.code,['AGUARDANDO ADVERSÁRIO'],0); return; }
    if (!online.choice) {
      var picked=online.pick!=null;if(picked){online.cur=online.pick;online.pick=null;}
      var hit = function (n) { return menuKey(n); };
      online.cur = gridMove(hit,online.cur,ROSTER.length);
      if (window.Rig) window.Rig.ready(ROSTER[online.cur].who);
      if (picked || menuKey('ok')) {
        var who=ROSTER[online.cur].who;
        if(who==='douglinhas' && window.DouglinhasPreviewOnly){onlineNotice='DOUGLINHAS: CAMPANHA OU X1 LOCAL';onlineNoticeT=3;}
        else if(who==='th' && window.ThPreviewOnly){onlineNotice='TH: CAMPANHA OU X1 LOCAL NESTA PREVIA';onlineNoticeT=3;}
        else if (who===online.other) { onlineNotice='ESCOLHA OUTRO LUTADOR'; onlineNoticeT=2; }
        else { online.choice=who; window.BanguOnline.send({type:'choice',who:who,matchId:online.matchId}); }
      }
    }
    if(online.coop&&online.host&&online.choice&&online.other&&!online.configured){coopSetupSel=0;scene='coopSetup';return;}
    if (online.host && online.choice && online.other && online.choice!==online.other && !online.started && !onlineHeld() &&
        stageReady(1) && (!window.Rig || ([online.choice,online.other].concat(online.allies||[]).every(function(w){return window.Rig.ready(w);})))) {
      online.started=true; online.stage=1; menuStage=1;
      var team=[online.choice,online.other].concat(online.allies||[]);
      window.BanguOnline.send({type:'start',team:team,mode:online.coop?'coop':'x1',stage:menuStage});
      startTeam(team.map(function(w,i){return {who:w,ctl:i<2?i:null};}),false,!online.coop);
      paused=false; showCtl=false;
    }
    if (scene!=='onlineSelect') return;
    drawSimpleMenu('ESCOLHA SEU LUTADOR',[NAMES[ROSTER[online.cur].who],online.choice?'VOCÊ: '+NAMES[online.choice]:'ENTER CONFIRMA',
      online.other?'RIVAL: '+NAMES[online.other]:'AGUARDANDO RIVAL'],0);
    if (window.Rig) window.Rig.big(ctx,ROSTER[online.cur].who,'idle',time,95,224,1,1.2);
    if (online.choice && online.other && online.host && window.Rig &&
        (!window.Rig.ready(online.choice) || !window.Rig.ready(online.other)))
      txt('CARREGANDO PERSONAGENS...',240,207,'#ffe066','center');
    if (onlineNoticeT>0) txt(onlineNotice,240,226,'#ff6b6b','center');
  }
  var adventureSel=0,adventureOpt=0,coopSetupSel=0;
  function coopAction(action,value){
    if(action==='create'||action==='join'){
      if(scene!=='adventuremenu')return;
      if(action==='create'){scene='onlineWait';window.BanguOnline.createCoop();}
      else window.BanguOnline.askText('CÓDIGO DA SALA COOP',5).then(function(code){if(code&&scene==='adventuremenu'){scene='onlineWait';window.BanguOnline.joinCoop(code);}});
      return;
    }
    if(scene!=='coopSetup'||!online||!online.host)return;
    if(action==='focus'&&Number.isInteger(value)&&value>=0&&value<=2)coopSetupSel=value;
    if(action==='clearAlly'&&(value===0||value===1))online.allies.splice(value,1);
    if(action==='cycleAlly'&&value&&(value.slot===0||value.slot===1)){
      var slot=value.slot,old=online.allies[slot],other=online.allies[1-slot];
      var options=[''].concat(ROSTER.filter(function(r){return r.who!==online.choice&&r.who!==online.other&&r.who!==other;}).map(function(r){return r.who;}));
      var next=options[(options.indexOf(old||'')+(value.dir<0?-1:1)+options.length)%options.length];
      if(old)online.allies.splice(slot,1);if(next)online.allies.splice(slot,0,next);
    }
    if(action==='ally'){
      var i=online.allies.indexOf(value);
      if(i>=0)online.allies.splice(i,1);
      else if(online.allies.length<2&&value!==online.choice&&value!==online.other&&ROSTER.some(function(r){return r.who===value;}))online.allies.push(value);
    }
    if(action==='start'){online.configured=true;scene='onlineSelect';}
  }
  function adventureGo(index){
    if(scene!=='adventuremenu'||(index!==0&&index!==1))return;
    adventureSel=index;sfx('select');
    if(index===0){menuStage=1;openSelect();}else coopAction(adventureOpt?'join':'create');
  }
  function updateAdventureMenu(){
    if(menuKey('back')){scene='menu';return;}
    if(menuKey('left')||menuKey('right')){adventureSel=1-adventureSel;sfx('menu');}
    if(adventureSel===1&&(menuKey('up')||menuKey('down'))){adventureOpt=1-adventureOpt;sfx('menu');}
    if(menuKey('ok')){adventureGo(adventureSel);return;}
    drawSimpleMenu('AVENTURA',['NA MESMA TELA','AVENTURA ONLINE (BETA)'],adventureSel);
  }
  function updateCoopSetup(){
    if(!online||!online.host){scene='menu';return;}
    if(menuKey('up')||menuKey('down'))coopSetupSel=(coopSetupSel+(menuKey('up')?2:1))%3;
    var dir=menuKey('left')?-1:menuKey('right')?1:0;
    if(dir&&(coopSetupSel===0||coopSetupSel===1))coopAction('cycleAlly',{slot:coopSetupSel,dir:dir});
    if(menuKey('ok')&&coopSetupSel===2)coopAction('start');
    drawSimpleMenu('TIME COOPERATIVO',['IA 1: '+(NAMES[online.allies[0]]||'SEM ALIADO'),'IA 2: '+(NAMES[online.allies[1]]||'SEM ALIADO'),'INICIAR'],coopSetupSel);
    if(menuKey('back'))onlineExit();
  }
  // Tuplas binárias + LZSS em base64, dentro do mesmo envelope e transporte do X1.
  var coop64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var coopPlayerFields=["who", "x", "y", "z", "hp", "maxHp", "sp", "virada", "viradaAvisada", "state", "st", "facing", "dead", "ctl", "ai", "inv", "flash", "shield", "hyper", "turbo", "vz", "slow", "spinT", "brigT", "brigAge", "brigSeed", "walkT", "markT", "micOut", "tauntCd", "tauntFala", "specialDamageLeft", "null", "rcLanded", "cd", "altCd", "guardCd", "thPhone", "enzoThree", "airThrowT", "koT", "count", "limadoT", "guardT", "guardFlash", "guardHp", "guardStartT", "guardEndT", "guardPerfectReady", "contraT", "perfectStunT", "perfectEvent", "attackKnock", "attackCdMult", "spLocked", "spLockedBlocked", "kissTarget"];
  var coopEntityFields={
    enemies:'id kind x y z vx hp maxHp w h state st facing flash stun dying dieT spinT brigT brigAge brigSeed',
    bosses:'id stage kind name x y z vx hp maxHp w h state attack timer facing flash phase forma transT tx ty warnLeft warnRight warnTop warnBottom warnTime angle speed damage lookX lookY spinT brigT brigAge brigSeed dead',
    eshots:'x y z vx vy vz r rot kind life custom',
    hazards:'k bicho kind x y z dir vx vy state st t life w h dead warn rot r maxR speed',
    puddles:'x y w life'
  };
  function coopPackState(s){
    ['perfeitas','perfeitaSeq','impacts','flashT','shakeT','shakeF','bannerT','goT','parts','texts','bolts','rings','kids','notes','sounds','cine','spFreeze','round','ackAge','paused'].forEach(function(k){var v=s[k];if(v==null||v===0||v===false||Array.isArray(v)&&!v.length)delete s[k];});
    s.players=s.players.map(function(p){return coopPlayerFields.map(function(k){return p[k]==null?0:p[k];});});
    Object.keys(coopEntityFields).forEach(function(k){var fields=coopEntityFields[k].split(' ');s[k]=s[k].map(function(e){return fields.map(function(f){return e[f]==null?0:e[f];});});});
    return s;
  }
  function coopUnpackState(s){
    s.players=s.players.map(function(row){var p={};coopPlayerFields.forEach(function(k,i){p[k]=row[i];});return p;});
    Object.keys(coopEntityFields).forEach(function(k){var fields=coopEntityFields[k].split(' ');s[k]=s[k].map(function(row){var e={};fields.forEach(function(f,i){e[f]=row[i];});return e;});});return s;
  }
  var coopWords=('coop paused players enemies bosses shots eshots hazards puddles parts texts bolts rings kids notes sounds cine spFreeze round cam time phase scene seq matchId ack ackAge metaVersion catT score combo bossOn bossIntro camLock perfeitas perfeitaSeq impacts flashT shakeT shakeF bannerT goT t intro fight clear play gameover ending idle walk jump guard special attack attack1 attack2 ko hurt throw rest warn dead fome gordura brilho estrela bispo lucas nutri duda lutador').split(' ');
  function coopBinary(value){
    var out=[],words=coopWords.slice(),dict=Object.create(null);words.forEach(function(w,i){dict[w]=i;});
    function uint(n){do{var b=n%128;n=Math.floor(n/128);out.push(b|(n?128:0));}while(n);}
    function write(v){
      if(v==null){out.push(0);return;}if(v===false){out.push(1);return;}if(v===true){out.push(2);return;}
      if(typeof v==='number'){if(!Number.isFinite(v)){out.push(0);return;}var n=Math.round(v*100),integer=n%100===0;out.push(integer?3:4);n=integer?n/100:n;uint(n<0?-2*n-1:2*n);return;}
      if(typeof v==='string'){if(dict[v]!=null){out.push(8);uint(dict[v]);return;}out.push(5);var bytes=new TextEncoder().encode(v);uint(bytes.length);for(var i=0;i<bytes.length;i++)out.push(bytes[i]);dict[v]=words.length;words.push(v);return;}
      if(Array.isArray(v)){out.push(6);uint(v.length);v.forEach(write);return;}
      var keys=Object.keys(v);out.push(7);uint(keys.length);keys.forEach(function(k){write(k);write(v[k]);});
    }write(value);return out;
  }
  function coopFromBinary(bytes){
    var i=0,words=coopWords.slice();
    function uint(){var n=0,m=1;for(var k=0;k<8;k++){if(i>=bytes.length)throw Error('número truncado');var b=bytes[i++];n+=(b&127)*m;if(!(b&128))return n;m*=128;}throw Error('número inválido');}
    function read(depth){
      if(depth>20||i>=bytes.length)throw Error('snapshot truncado');var tag=bytes[i++],n,v;
      if(tag===0)return null;if(tag===1)return false;if(tag===2)return true;
      if(tag===3||tag===4){n=uint();v=n%2?-(n+1)/2:n/2;return tag===4?v/100:v;}
      if(tag===8){n=uint();if(n>=words.length)throw Error('palavra inválida');return words[n];}
      if(tag===5){n=uint();if(n>8192||i+n>bytes.length)throw Error('texto inválido');v=decodeURIComponent(bytes.slice(i,i+n).map(function(b){return '%'+('0'+b.toString(16)).slice(-2);}).join(''));i+=n;words.push(v);return v;}
      if(tag!==6&&tag!==7)throw Error('tipo inválido');n=uint();if(n>4096)throw Error('lista inválida');v=tag===6?[]:{};
      for(var k=0;k<n;k++){if(tag===6)v.push(read(depth+1));else{var key=read(depth+1);if(typeof key!=='string'||key==='__proto__'||key==='constructor'||key==='prototype')throw Error('chave inválida');v[key]=read(depth+1);}}return v;
    }var value=read(0);if(i!==bytes.length)throw Error('snapshot excedente');return value;
  }
  function coopEncode(value){
    var bytes=coopBinary(value),out=[],last=Object.create(null),i=0;
    while(i<bytes.length){var flagAt=out.length;out.push(0);var flags=0;
      for(var bit=0;bit<8&&i<bytes.length;bit++){
        var key=bytes[i]+','+bytes[i+1]+','+bytes[i+2],candidates=last[key]||[],len=0,dist=0;
        candidates.forEach(function(at){var d=i-at,n=0;if(d<=0||d>1023)return;while(n<66&&i+n<bytes.length&&bytes[at+n]===bytes[i+n])n++;if(n>len){len=n;dist=d;}});
        if(len>=3){flags|=1<<bit;out.push(dist>>2,((dist&3)<<6)|(len-3));}
        else{len=1;out.push(bytes[i]);}
        for(var n=0;n<len;n++){var k=bytes[i]+','+bytes[i+1]+','+bytes[i+2],list=last[k]||(last[k]=[]);list.unshift(i);if(list.length>4)list.pop();i++;}
      }out[flagAt]=flags;
    }
    var text='';for(i=0;i<out.length;i+=3){var a=out[i],b=out[i+1],c=out[i+2];text+=coop64[a>>2]+coop64[((a&3)<<4)|((b||0)>>4)]+(b==null?'=':coop64[((b&15)<<2)|((c||0)>>6)])+(c==null?'=':coop64[c&63]);}return text;
  }
  function coopDecode(text){
    if(typeof text!=='string'||text.length>7800||text.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(text))throw Error('snapshot coop inválido');
    var data=[],out=[],i;
    for(i=0;i<text.length;i+=4){var a=coop64.indexOf(text[i]),b=coop64.indexOf(text[i+1]),c=coop64.indexOf(text[i+2]),d=coop64.indexOf(text[i+3]);data.push((a<<2)|(b>>4));if(c>=0)data.push(((b&15)<<4)|(c>>2));if(d>=0)data.push(((c&3)<<6)|d);}
    i=0;while(i<data.length){var flags=data[i++];for(var bit=0;bit<8&&i<data.length;bit++){
      if(flags&(1<<bit)){var a=data[i++],b=data[i++],dist=(a<<2)|(b>>6),len=(b&63)+3;if(!dist||dist>out.length)throw Error('distância inválida');for(var n=0;n<len;n++)out.push(out[out.length-dist]);}
      else out.push(data[i++]);if(out.length>65536)throw Error('snapshot grande');
    }}
    // A leitura binária valida tamanhos antes de reconstruir o estado.
    return coopFromBinary(out);
  }
  function coopFields(o,fields){var v={};fields.split(' ').forEach(function(k){if(o[k]!=null)v[k]=typeof o[k]==='number'?(/^(x|y|z)$/.test(k)?Math.round(o[k]):netRound(o[k])):o[k];});return v;}
  function adventureSnapshot(){
    var s=onlineSnapshot();s.paused=paused;s.spFreeze=s.spFreeze||paused;s.coop=1;s.scene=scene;s.seq=++online.seq;
    s.enemies=enemies.map(function(e){var v=coopFields(e,'id kind x y z vx hp maxHp w h state st facing flash stun dying dieT spinT brigT brigAge brigSeed');v.state=enemyState(e);return v;});
    s.bosses=bosses.map(function(b,i){var v=coopFields(b,'stage kind name x y z vx hp maxHp w h state attack timer facing flash phase forma transT tx ty warnLeft warnRight warnTop warnBottom warnTime angle speed damage lookX lookY spinT brigT brigAge brigSeed');v.id=i;v.dead=!!b.dead;return v;});
    s.eshots=eshots.map(function(e){var v=coopFields(e,'x y z vx vy vz r rot kind life');v.custom=!!e.draw;return v;});
    s.hazards=hazards.map(function(e){return coopFields(e,'k bicho kind x y z dir vx vy state st t life w h dead warn rot r maxR speed');});
    s.puddles=puddles.map(function(e){return coopFields(e,'x y w life');});
    s.camLock=camLock;s.score=score;s.combo=combo;s.bossOn=bossOn;s.bossIntro=bossIntro?{t:netRound(bossIntro.t)}:null;
    var meta={scene:scene,stage:stage,waves:waves.map(function(w){return {done:w.done};}),wave:!!wave,cat:cat?{x:cat.x,y:cat.y,state:cat.state,done:cat.done}:null};
    var key=JSON.stringify(meta);if(key!==online.metaKey){online.metaKey=key;online.metaVersion=(online.metaVersion||0)+1;}
    s.metaVersion=online.metaVersion;
    s.catT=cat?netRound(cat.st):0;delete s.stage;delete s.scene;
    // Partículas decorativas não disputam banda com o mundo e os lutadores.
    s.shots=s.shots.filter(function(v){return v[0]>=cam-80&&v[0]<=cam+W+80;});
    if(s.seq%2===0)s.shots=null;   // projéteis aliados a 10 Hz; mundo e comandos mantêm 20/30 Hz
    s.parts=s.parts.slice(-4);s.impacts=s.impacts.slice(-2);s.sounds=s.sounds.slice(-4);
    coopPackState(s);var encoded=coopEncode(s);
    while(encoded.length>6500&&s.parts&&s.parts.length){s.parts.shift();encoded=coopEncode(s);}
    return {coop:1,matchId:online.matchId,time:s.time,seq:s.seq,data:encoded,meta:online.metaAck!==online.metaVersion?meta:undefined};
  }
  function receiveAdventure(wire){
    if(!wire||wire.matchId!==online.matchId||!Number.isSafeInteger(wire.seq)||wire.seq<=(online.lastSnapshotSeq||0))return;
    var s;try{s=coopUnpackState(coopDecode(wire.data));}catch(_){return;}
    if(!Array.isArray(s.players)||s.players.length<2||s.matchId!==online.matchId)return;
    if(wire.meta){online.meta=wire.meta;online.metaVersion=s.metaVersion;}
    if(!online.meta||online.metaVersion!==s.metaVersion)return;
    online.lastSnapshotSeq=wire.seq;s.scene=online.meta.scene;s.stage=online.meta.stage;s.waves=online.meta.waves;s.wave=online.meta.wave;s.cat=online.meta.cat?Object.assign({},online.meta.cat,{st:s.catT}):null;
    var prev=online.snapshots[online.snapshots.length-1];
    if(prev&&(prev.state.scene!==s.scene||prev.state.stage!==s.stage||prev.state.phase!==s.phase)){online.pred=null;online.playback=null;online.snapshots=[];}
    if(s.shots===null)s.shots=prev&&prev.state.stage===s.stage?prev.state.shots:[];
    reconcileGuest(s);online.snapshots.push({state:s,at:performance.now()});if(online.snapshots.length>6)online.snapshots.shift();
    (s.sounds||[]).forEach(function(ev){if(ev[0]>online.heardId){online.heardId=ev[0];sfx(ev[1]);}});
  }
  function applyAdventureRender(s,a,b,f){
    function interpolate(list,old,next){return (list||[]).map(function(e){var q=Object.assign({},e),p=(old||[]).find(function(v){return v.id===e.id;}),n=(next||[]).find(function(v){return v.id===e.id;});if(p&&n)['x','y','z'].forEach(function(k){q[k]=(p[k]||0)*(1-f)+(n[k]||0)*f;});return q;});}
    var snaps=online.snapshots,last=snaps[snaps.length-1],previous=snaps[snaps.length-2];
    var extra=last&&!s.spFreeze&&s.scene==='play'?clamp((performance.now()-last.at)/1000-.05,0,.15):0;
    function extrapolate(list,key){
      var span=previous?s.time-previous.state.time:0;if(!extra||span<=0)return list;
      return list.map(function(q){var old=(previous.state[key]||[]).find(function(v){return v.id===q.id;}),latest=(s[key]||[]).find(function(v){return v.id===q.id;});
        if(old&&latest&&!q.dead&&!q.dying){q.x+=clamp((latest.x-old.x)/span,-600,600)*extra;q.y=clamp(q.y+clamp((latest.y-old.y)/span,-300,300)*extra,TOP,BOT);q.z=Math.max(0,q.z+clamp((latest.z-old.z)/span,-600,600)*extra);if(q.st!=null)q.st+=extra;if(q.timer!=null)q.timer+=extra;}return q;
      });
    }
    enemies=extrapolate(interpolate(s.enemies,a.enemies,b.enemies),'enemies');
    bosses=extrapolate(interpolate(s.bosses,a.bosses,b.bosses),'bosses').map(function(b,i){var templates=window.Bosses.create(b.stage,G),base=templates[i]||templates[0];return Object.assign(base,b);});
    eshots=(s.eshots||[]).map(function(e){var q=Object.assign({},e);if(q.custom)q.draw=function(g,x,y){var colors={bacon:'#b34b40',palha:'#f1ca63',egg:'#eee3bf',fry:'#e8b344',boulder:'#71388a',cheese:'#f7e6a3',oil:'#ac762e'};g.fillStyle='#291b26';g.fillRect(Math.round((x-5)*2)/2,Math.round((y-5)*2)/2,11,10);g.fillStyle=colors[q.kind]||'#d69c48';g.fillRect(Math.round((x-4)*2)/2,Math.round((y-4)*2)/2,9,8);g.fillStyle='#fff1ba';g.fillRect(Math.round((x-2)*2)/2,Math.round((y-3)*2)/2,3,2);};return q;});hazards=s.hazards||[];puddles=s.puddles||[];cat=s.cat;waves=s.waves||[];wave=s.wave;camLock=s.camLock;score=s.score;combo=s.combo;bossOn=s.bossOn;bossIntro=s.bossIntro;versus=false;
  }

  function onlineLocalControl() {
    var fake={who:online.choice||'nutri',ctl:0};
    return humanControl(fake);
  }
  function netRound(n) { return Math.round((n||0)*100)/100; }
  function onlineSnapshot() {
    var state = {perfeitas:perfeitaEvents.slice(-8),perfeitaSeq:perfeitaSeq,impacts:impacts.slice(-8).map(function(e){return [netRound(e.x),netRound(e.y),netRound(e.z),e.kind,e.strong,netRound(e.born)];}),matchId:online.matchId||1,cam:Math.round(cam),stage:stage,time:Math.round(time*1000)/1000,phase:phase,
      ack:online.inputSeq,ackAge:Math.round(Math.max(0,time-online.inputAtTime)*1000)/1000,
      players:players.map(function (p) { return {who:p.who,x:Math.round(p.x),y:Math.round(p.y),z:Math.round(p.z),
        hp:Math.round(p.hp),maxHp:p.maxHp,sp:Math.round(p.sp),virada:!!p.virada,viradaAvisada:!!p.viradaAvisada,state:p.state,st:netRound(p.st),facing:p.facing,dead:p.dead,
        ctl:p.ctl,ai:p.ai,inv:netRound(p.inv),flash:netRound(p.flash),shield:netRound(p.shield),
        hyper:netRound(p.hyper),turbo:netRound(p.turbo),vz:netRound(p.vz),slow:netRound(p.slow),
        spinT:netRound(p.spinT),brigT:netRound(p.brigT),brigAge:netRound(p.brigAge),brigSeed:netRound(p.brigSeed),walkT:netRound(p.walkT),markT:netRound(p.markT),micOut:!!p.micOut,
        tauntCd:netRound(p.tauntCd),tauntFala:p.tauntFala||'',specialDamageLeft:p.specialDamageLeft==null?null:netRound(p.specialDamageLeft),rcLanded:!!p.rcLanded,cd:netRound(p.cd),altCd:netRound(p.altCd),guardCd:netRound(p.guardCd),thPhone:!!p.thPhone,enzoThree:!!p.enzoThree,airThrowT:netRound(p.airThrowT),koT:netRound(p.koT),count:p.count||0,limadoT:netRound(p.limadoT),
        guardT:netRound(p.guardT),guardFlash:netRound(p.guardFlash),guardHp:netRound(p.guardHp),
        guardStartT:netRound(p.guardStartT),guardEndT:netRound(p.guardEndT),guardPerfectReady:!!p.guardPerfectReady,contraT:netRound(p.contraT),perfectStunT:netRound(p.perfectStunT),perfectEvent:p.perfectEvent||0,attackKnock:p.attackKnock||1,attackCdMult:p.attackCdMult||1,
        spLocked:!!p.spLocked,spLockedBlocked:!!p.spLockedBlocked,
        kissTarget:p.kissTarget ? players.indexOf(p.kissTarget) : -1}; }),
      cine:cine ? [players.indexOf(cine.p),cine.t] : null,
      spFreeze:!!(cine || specialHighlight()),
      flashT:flashT,shakeT:shakeT,shakeF:shakeF,bannerT:bannerT,goT:goT,
      laminas:emanuellyBlades(),
      shots:shots.filter(function(s){return !s.manuLamina;}).slice(-30).map(function (s) { return [Math.round(s.x),Math.round(s.y),Math.round(s.z),s.k||'brilho',s.rot||0,
        s.grav||0,!!s.yoyo,players.indexOf(s.owner),!!s.wave,s.life||0,s.vx||0,s.ch||'',s.col||'',!!s.enzoRain]; }),
      parts:parts.slice(-70).map(function (p) { return [p.kind,Math.round(p.x),Math.round(p.y),Math.round(p.z),p.rot||0,p.life,p.max]; }),
      texts:texts.slice(-12).map(function (t) { return [Math.round(t.x),Math.round(t.y),t.msg,t.col,t.life]; }),
      bolts:bolts.slice(-12).map(function (b) { return [Math.round(b.x0),Math.round(b.y0),Math.round(b.x1),Math.round(b.y1),b.col]; }),
      rings:rings.slice(-16).map(function (r) { return [Math.round(r.x),Math.round(r.y),Math.round(r.z),Math.round(r.r)]; }),
      kids:kids.slice(-12).map(function (k) { return [k.i,Math.round(k.x),Math.round(k.y),k.t,k.dir,k.delay,k.hitT||0,!!k.shout]; }),
      notes:notes.slice(-24).map(function (n) { return [Math.round(n.sx),Math.round(n.sy),n.sz,n.q?Math.round(n.q.x):null,
        n.q?Math.round(n.q.y):null,n.u,n.wob,n.col,n.dx]; }),
      sounds:online.sounds.slice(),
      round:vsRound ? {number:vsRound.number,wins:vsRound.wins.slice(),phase:vsRound.phase,t:netRound(vsRound.t),
        roundWinner:vsRound.roundWinner,matchWinner:vsRound.matchWinner,contagem:!!vsRound.contagem,announceT:netRound(vsRound.announceT)} : null};
    // Inclui o envelope WebSocket/JSON e deixa margem para textos Unicode.
    var optional=['parts','notes','shots','bolts','rings','texts','kids'];
    while (new TextEncoder().encode(JSON.stringify({type:'snapshot',state:state})).length > 7000) {
      var biggest=optional.reduce(function (a,k) { return state[k].length>state[a].length?k:a; },optional[0]);
      if (!state[biggest].length) break;
      state[biggest].shift();
    }
    return state;
  }
  function guestRoundKey(s) {
    return s.round ? s.round.number + ':' + s.round.wins.join(',') : '';
  }
  function guestServerState(s) {
    return ['idle','walk','jump','throw','attack1','attack2','barriga','fralda','guard','roll'].indexOf(s) < 0;
  }
  function resetGuestPrediction(s) {
    var p=s.players && s.players[1]; if (!p) return;
    online.pred={x:p.x,y:online.coop?p.y:VS_Y,z:p.z,vz:p.vz||0,state:p.state,st:p.st,facing:p.facing,
      simTime:s.time,guardStartT:p.guardStartT==null?-10:p.guardStartT,guardEndT:p.guardEndT==null?-10:p.guardEndT,guardPerfectReady:!!p.guardPerfectReady,contraT:p.contraT||0,perfectEvent:p.perfectEvent||0,contraSpent:false,attackKnock:p.attackKnock||1,attackCdMult:p.attackCdMult||1,
      cd:p.cd||0,altCd:p.altCd||0,actionT:p.state==='guard'?.5:p.who==='fidelis'&&p.state==='throw'?Math.max(0,window.CreiaCombat.fidelis.throwDuration-p.st):p.state==='roll'?Math.max(0,0.55-p.st):0,airThrowT:p.airThrowT||0,thPhone:!!p.thPhone,enzoThree:!!p.enzoThree,corrX:0,corrY:0,ack:s.ack||0,round:guestRoundKey(s),
      serverLock:guestServerState(p.state)||p.dead||p.spinT>0||p.brigT>0};
    online.sentInputs=[];
  }
  function reconcileGuest(s) {
    var auth=s.players && s.players[1]; if (!auth || !online) return;
    var p=online.pred;
    if (!p || p.round!==guestRoundKey(s) || (!online.coop&&(!s.round || s.round.phase!=='fight')) || auth.dead ||
        guestServerState(auth.state) || auth.spinT>0 || auth.brigT>0 || p.serverLock) {
      resetGuestPrediction(s); return;
    }
    if((auth.perfectEvent||0)!==p.perfectEvent){p.perfectEvent=auth.perfectEvent||0;p.contraT=auth.contraT||0;p.contraSpent=false;}
    else if(p.contraSpent&&s.ack>=p.contraSeq){p.contraT=auth.contraT||0;p.contraSpent=false;}
    if (s.ack==null || s.ack<=p.ack) return;
    var rec=online.sentInputs.find(function (h) { return h.seq===s.ack; });
    p.ack=s.ack;
    online.sentInputs=online.sentInputs.filter(function (h) { return h.seq>=s.ack-2; });
    if (!rec) return;
    var age=Math.min(0.07,s.ackAge||0);
    var dx=auth.x-(rec.x+rec.xAxis*rec.speed*age);
    var dy=auth.y-(rec.y+rec.yAxis*rec.speed*0.62*age);
    if (Math.abs(dx)>40 || Math.abs(dy)>30) {
      // Conserva o movimento local posterior ao comando confirmado.
      correctGuestPosition(clamp(p.x+dx,s.cam+12,s.cam+W-12)-p.x,
        clamp(p.y+dy,TOP,BOT)-p.y);
      p.corrX=0; p.corrY=0;
    } else {
      // Cada ACK mede o erro restante; somá-lo novamente cria oscilação
      // quando vários ACKs descrevem o mesmo desvio durante uma rede lenta.
      p.corrX=Math.abs(dx)>1 ? dx : 0;
      p.corrY=Math.abs(dy)>1 ? dy : 0;
    }
  }
  function correctGuestPosition(dx,dy) {
    online.pred.x+=dx; online.pred.y+=dy;
    // As amostras ainda em trânsito precisam usar a mesma origem corrigida.
    // Caso contrário, a próxima confirmação aplica outra vez o mesmo erro.
    online.sentInputs.forEach(function (h) { h.x+=dx; h.y+=dy; });
  }
  function predictGuest(c,dt,s) {
    if (!s || !s.players || !s.players[1]) return;
    if (!online.pred) resetGuestPrediction(s);
    var p=online.pred, a=s.players[1];if(!online.coop){p.y=VS_Y;p.corrY=0;c=Object.assign({},c,{y:0});}
    if (online.coop&&online.snapshots.length&&performance.now()-online.snapshots[online.snapshots.length-1].at>250)return;
    if ((!online.coop&&(!s.round || s.round.phase!=='fight')) || onlineHeld() || a.dead || online.coop&&(s.scene!=='play'||s.phase!=='fight'||s.bossIntro||(s.bosses||[]).some(function(b){return !b.dead&&b.transT>0;}))) return;
    p.simTime=Math.max(p.simTime==null?s.time:p.simTime,s.time)+dt;
    if (a.spLocked) {
      if (a.spLockedBlocked) {
        if(p.state!=='guard')setState(p,'guard',p.simTime);
        p.guardT = 0.5;
      } else {
        if (p.state === 'guard') setState(p,'idle',p.simTime);
        p.guardT = 0;
      }
      p.vx = 0; p.vy = 0; p.kx = 0;
      return;
    }
    if (a.state==='taunt') {p.state='taunt';p.st=a.st;p.z=0;p.vz=0;online.lastPredictSpeed=0;return;}
    if (s.spFreeze || (s.cine && s.cine[0] !== undefined)) return;
    p.contraT=Math.max(0,(p.contraT||0)-dt);
    p.airThrowT=Math.max(0,(p.airThrowT||0)-dt);
    p.st+=dt;p.altCd=Math.max(0,(p.altCd||0)-dt); p.cd=Math.max(0,p.cd-dt); p.actionT=Math.max(0,p.actionT-dt);
    if (p.guardFlash > 0) p.guardFlash = Math.max(0, p.guardFlash - dt);
    if (p.actionT===0 && (p.state==='throw'||p.state==='attack1'||p.state==='attack2'||p.state==='barriga'||p.state==='fralda'||p.state==='guard'||p.state==='roll'))
      { setState(p,a.who==='fidelis'&&p.z>0?'jump':'idle',p.simTime); p.guardT=0; }
    var free=p.state==='idle'||p.state==='walk'||p.state==='jump'||(p.state==='throw'&&a.who!=='fidelis');
    if (free && Math.abs(c.x)>0.2) p.facing=c.x>0?1:-1;
    if (c.jump && (p.state==='idle'||p.state==='walk') && p.z===0) { p.vz=390; p.state='jump'; p.st=0; }
    if (!online.coop && c.use && !(a.guardCd>0) && !(a.guardHp<=0) && (p.state==='idle'||p.state==='walk'||p.state==='guard') && p.z===0) { if(p.state!=='guard')setState(p,'guard',p.simTime); p.st+=dt; p.actionT=0.5; p.guardT=0.5; }
    else if (!c.use && p.state==='guard') { setState(p,'idle',p.simTime); p.actionT=0; p.guardT=0; }
    var cdBefore=p.cd,altBefore=p.altCd;
    if(a.who==='th' && (c.atk||c.alt) && p.cd<=0 && free)p.thPhone=!!c.alt;
    if(a.who==='enzo' && (c.atk||c.alt) && p.cd<=0 && free)p.enzoThree=!!c.alt;
    if((a.who==='emanuelly' || a.who==='pedro' || a.who==='bispo' || a.who==='rafinha' || a.who==='enzo' || a.who==='lohan' || a.who==='grazi' || a.who==='th' || a.who==='douglinhas') && c.atk && p.cd<=0 && p.z>0 && free) { p.airThrowT=0.2; p.cd=window.CreiaCombat.primaryCooldown(a.who,!online.coop); }
    if(a.who==='ricardo'&&free){if(c.alt&&p.altCd<=0&&p.z===0){p.state='roll';p.st=0;p.actionT=0.55;p.altCd=window.CreiaCombat.secondaryCooldown(a.who,!online.coop);}else if(c.atk&&p.cd<=0){p.state='attack1';p.st=0;p.actionT=0.36;p.cd=window.CreiaCombat.primaryCooldown(a.who,!online.coop);}}
    if (a.who!=='ricardo' && ((c.atk&&p.cd<=0)||(c.alt&&p.altCd<=0&&!(a.who==='fidelis'&&p.z>0))) && (p.state==='idle'||p.state==='walk'||p.state==='throw'&&a.who!=='fidelis'||a.who==='fidelis'&&p.state==='jump')) {
      var close=Math.abs(a.x-s.players[0].x)<48 && Math.abs(a.y-s.players[0].y)<16;
      p.state=c.alt ? (a.who==='cardoso'?'barriga':a.who==='lucas'?'fralda':'attack2') :
        (a.who==='fidelis'||a.who==='emanuelly'?'throw':a.who==='lutador'||a.who==='cardoso'||close?'attack1':'throw');
      p.st=0; p.actionT=a.who==='fidelis'?(c.alt?.58:window.CreiaCombat.fidelis.throwDuration):a.who==='emanuelly'&&c.alt?window.CreiaCombat.emanuelly.secondaryDuration:a.who==='pedro'&&c.alt?.34:p.state==='throw'?0.2:0.3;if(c.alt)p.altCd=window.CreiaCombat.secondaryCooldown(a.who,!online.coop);else p.cd=window.CreiaCombat.primaryCooldown(a.who,!online.coop);
    }
    if(p.cd>cdBefore||p.altCd>altBefore){
      var hadCounter=p.contraT>0;armCounter(p);
      if(p.cd>cdBefore)p.cd*=p.attackCdMult;if(p.altCd>altBefore)p.altCd*=p.attackCdMult;
      if(hadCounter){p.contraSpent=true;p.contraSeq=online.nextSeq+1;}
    }
    free=p.state==='idle'||p.state==='walk'||p.state==='jump'||(p.state==='throw'&&a.who!=='lutador'&&a.who!=='fidelis');
    var speed=(a.who==='lutador'?92:a.who==='emanuelly'?97:100)*(a.slow>0?0.5:1)*(a.turbo>0?3:1);
    if(p.state==='roll')p.x+=p.facing*300*dt;
    if (free) { p.x+=c.x*speed*dt; p.y+=c.y*speed*0.62*dt; }
    p.vz-=720*dt; p.z=Math.max(0,p.z+p.vz*dt);
    if (p.z===0 && p.vz<0) { p.vz=0; if (p.state==='jump') {p.state='idle';p.st=0;} }
    var cx=clamp(p.corrX*0.22,-2,2),cy=clamp(p.corrY*0.22,-2,2);
    p.x=clamp(p.x,s.cam+12,s.cam+W-12); p.y=online.coop?clamp(p.y,TOP,BOT):VS_Y;
    correctGuestPosition(clamp(p.x+cx,s.cam+12,s.cam+W-12)-p.x,clamp(p.y+cy,TOP,BOT)-p.y);
    p.corrX-=cx; p.corrY-=cy;
    if (p.state==='idle'&&(c.x||c.y)) {p.state='walk';p.st=0;}
    else if (p.state==='walk'&&!c.x&&!c.y) {p.state='idle';p.st=0;}
    online.lastPredictSpeed=a.who==='fidelis'&&!free?0:speed;
  }
  function guestPlaybackTime(snaps) {
    var newest=snaps[snaps.length-1], now=performance.now(), clock=online.playback;
    var round=guestRoundKey(newest.state);
    var buf=0.065;
    if (!clock || clock.round!==round) {
      clock=online.playback={time:Math.max(snaps[0].state.time,newest.state.time-buf),at:now,round:round};
    }
    var elapsed=clamp((now-clock.at)/1000,0,0.1); clock.at=now;
    // Ajusta levemente a velocidade, nunca a posição do relógio a cada chegada.
    // Não extrapola: prever além do último estado fazia o rival recuar ao parar.
    var desired=newest.state.time+Math.max(0,now-newest.at)/1000-buf;
    var rate=clamp(1+(desired-clock.time)*2,0.85,1.15);
    if (!onlineHeld()) clock.time=Math.max(clock.time,Math.min(newest.state.time,clock.time+elapsed*rate));
    return clock.time;
  }
  function drawOnlineGuest(dt) {
    if (!online) return;
    var snaps=online.snapshots, latest=snaps.length?snaps[snaps.length-1].state:null;
    if (!onlineHeld()) {
      var ctrl=onlineLocalControl(), pending=online.pending;if(!online.coop)ctrl.y=0; online.sendT+=dt;
      var guestLocked = latest && latest.players && latest.players[1] && latest.players[1].spLocked;
      if (guestLocked) {
        ctrl.x = 0; ctrl.y = 0; ctrl.atk = false; ctrl.jump = false; ctrl.spc = false; ctrl.taunt = false;
        if (!latest.players[1].spLockedBlocked) ctrl.use = false;
      } else if (latest && (latest.spFreeze || (latest.cine && latest.cine[0] !== undefined))) {
        ctrl.x = 0; ctrl.y = 0; ctrl.atk = false; ctrl.jump = false; ctrl.spc = false; ctrl.taunt = false;
      }
      predictGuest(ctrl,dt,latest);
      pending.x=ctrl.x; pending.y=ctrl.y;
      var lastSent=online.lastSent;
      if (!lastSent || Math.abs(ctrl.x-lastSent.x)>0.01 || Math.abs(ctrl.y-lastSent.y)>0.01) online.urgent=true;
      ['atk','jump','spc','alt','use','taunt'].forEach(function (k) { pending[k]=!!(pending[k]||ctrl[k]); });
      if (['atk','jump','spc','alt','use','taunt'].some(function (k) { return !lastSent || !!ctrl[k] !== !!lastSent[k]; })) online.urgent=true;
      if (online.sendT >= (online.urgent ? 1/30 : 0.05) - 0.000001) {
        pending.seq=++online.nextSeq;pending.matchId=online.matchId;if(online.coop)pending.metaAck=online.metaVersion||0;
        if (window.BanguOnline.send({type:'input',input:pending})) {
          if (online.pred) {
            online.sentInputs.push({seq:pending.seq,x:online.pred.x,y:online.pred.y,
              xAxis:pending.x,yAxis:pending.y,speed:online.lastPredictSpeed==null?100:online.lastPredictSpeed});
            if (online.sentInputs.length>40) online.sentInputs.shift();
          }
          online.sendT=0; online.lastSent=Object.assign({},pending); online.urgent=false; online.pending={};
        }
      }
    }
    ctx.fillStyle='#0b0a10'; ctx.fillRect(0,0,W,H);
    if (!snaps.length) {
      txt('AGUARDANDO PARTIDA...',240,125,'#ffe066','center');
      if (onlineHeld()) drawReconnect();
      return;
    }
    var b=snaps[snaps.length-1], a=b, target=guestPlaybackTime(snaps)*1000;
    for (var si=1;si<snaps.length;si++) {
      if (snaps[si].state.time*1000>=target) { a=snaps[si-1]; b=snaps[si]; break; }
      if (si===snaps.length-1) { a=snaps[si-1]; b=snaps[si]; }
    }
    var span=(b.state.time-a.state.time)*1000;
    var f=span>0 ? clamp((target-a.state.time*1000)/span,0,1) : 1;
    if (guestRoundKey(a.state)!==guestRoundKey(b.state)) { a=b; f=1; }
    var state=snaps[snaps.length-1].state, ac=a.state, bc=b.state;
    var cx=Math.round(ac.cam*(1-f)+bc.cam*f);
    var savedRender={players:players,shots:shots,parts:parts,texts:texts,bolts:bolts,rings:rings,kids:kids,notes:notes,
      impacts:impacts,cine:cine,cam:cam,stage:stage,time:time,flashT:flashT,shakeT:shakeT,shakeF:shakeF,
      bannerT:bannerT,goT:goT,vsRound:vsRound,phase:phase,scene:scene,enemies:enemies,bosses:bosses,eshots:eshots,hazards:hazards,puddles:puddles,cat:cat,waves:waves,wave:wave,camLock:camLock,bossOn:bossOn,bossIntro:bossIntro,score:score,combo:combo,versus:versus};
    try {
      players=state.players.map(function (p,i) {
        var q=Object.assign({},p), old=ac.players&&ac.players[i]||p, next=bc.players&&bc.players[i]||p;
        q.virada=!!p.virada; // O visitante usa o estado do anfitrião, não a vida arredondada.
        q.x=old.x*(1-f)+next.x*f; q.y=online.coop?old.y*(1-f)+next.y*f:VS_Y; q.z=old.z*(1-f)+next.z*f;
        if (i===1 && online.pred) {
          q.x=online.pred.x; q.y=online.pred.y; q.z=online.pred.z;
          q.airThrowT=Math.max(q.airThrowT||0,online.pred.airThrowT||0);
          if(online.pred.thPhone!=null)q.thPhone=online.pred.thPhone;
          if(online.pred.enzoThree!=null)q.enzoThree=online.pred.enzoThree;
          q.state=online.pred.state; q.st=online.pred.st; q.facing=online.pred.facing;
          q.guardT=online.pred.guardT!=null?online.pred.guardT:(online.pred.state==='guard'?0.5:0);
          q.guardFlash=Math.max(q.guardFlash||0, online.pred.guardFlash||0);
          q.guardStartT=online.pred.guardStartT;q.guardEndT=online.pred.guardEndT;q.contraT=online.pred.contraT||0;
        }
        return q;
      });
      online.renderOwn=players[1] ? {x:players[1].x,y:players[1].y,z:players[1].z,state:players[1].state} : null;
      online.renderOther=players[0] ? {x:players[0].x,y:players[0].y,z:players[0].z,state:players[0].state} : null;
      players.forEach(function (p,i) { p.kissTarget=players[state.players[i].kissTarget]||null; });
      shots=(state.shots||[]).map(function (s) { return {x:s[0],y:s[1],z:s[2],k:s[3],rot:s[4],grav:s[5],
        yoyo:s[6],owner:players[s[7]]||players[0],wave:s[8],life:s[9],vx:s[10],ch:s[11],col:s[12],enzoRain:!!s[13]}; });
      shots=shots.concat((state.laminas||[]).map(function(s){return Object.assign({},s,{k:'manu-lamina',manuShot:true,manuLamina:true,owner:players[s.owner]||players[0],rot:0,grav:0});}));
      parts=(state.parts||[]).map(function (p) { return {kind:p[0],x:p[1],y:p[2],z:p[3],rot:p[4],life:p[5],max:p[6]}; });
      texts=(state.texts||[]).map(function (t) { return {x:t[0],y:t[1],msg:t[2],col:t[3],life:t[4]}; });
      bolts=(state.bolts||[]).map(function (v) { return {x0:v[0],y0:v[1],x1:v[2],y1:v[3],col:v[4]}; });
      rings=(state.rings||[]).map(function (r) { return {x:r[0],y:r[1],z:r[2],r:r[3]}; });
      kids=(state.kids||[]).map(function (k) { return {i:k[0],x:k[1],y:k[2],t:k[3],dir:k[4],delay:k[5],hitT:k[6],shout:k[7]}; });
      notes=(state.notes||[]).map(function (n) { return {sx:n[0],sy:n[1],sz:n[2],q:n[3]===null?null:{x:n[3],y:n[4]},
        u:n[5],wob:n[6],col:n[7],dx:n[8]}; });
      impacts=(state.impacts||[]).slice(-8).map(function(e){return {x:e[0],y:e[1],z:e[2],kind:e[3],strong:e[4],born:e[5]};});
      cine=state.cine && players[state.cine[0]] ? {p:players[state.cine[0]],t:state.cine[1]} : null;
      cam=cx; stage=state.stage; time=state.time; flashT=state.flashT||0; shakeT=state.shakeT||0; shakeF=state.shakeF||0;
      bannerT=state.bannerT||0; goT=state.goT||0; vsRound=state.round; phase=state.phase; scene='play';
      if(online.coop)applyAdventureRender(state,ac,bc,f);
      drawCombatScreen(dt,!!state.spFreeze);
      if(online.coop&&state.paused)drawOverlay('PAUSA',['AGUARDANDO ANFITRIÃO'],'#ffd34d');
      if(online.coop&&state.scene==='gameover')drawOverlay('GAME OVER',['PONTOS '+pad(state.score),'AGUARDANDO RANKING DO TIME','ESC: MENU'],'#ff4d4d');
      if(online.coop&&state.scene==='ending')drawOverlay('CREIA FIGHT: VITÓRIA!',['O TIME VENCEU!','PONTOS '+pad(state.score)],'#ffd34d');
    } finally {
      enemies=savedRender.enemies;bosses=savedRender.bosses;eshots=savedRender.eshots;hazards=savedRender.hazards;puddles=savedRender.puddles;cat=savedRender.cat;waves=savedRender.waves;wave=savedRender.wave;camLock=savedRender.camLock;bossOn=savedRender.bossOn;bossIntro=savedRender.bossIntro;score=savedRender.score;combo=savedRender.combo;versus=savedRender.versus;
      players=savedRender.players; shots=savedRender.shots; parts=savedRender.parts; texts=savedRender.texts;
      bolts=savedRender.bolts; rings=savedRender.rings; kids=savedRender.kids; notes=savedRender.notes;
      impacts=savedRender.impacts;cine=savedRender.cine; cam=savedRender.cam; stage=savedRender.stage; time=savedRender.time;
      flashT=savedRender.flashT; shakeT=savedRender.shakeT; shakeF=savedRender.shakeF;
      bannerT=savedRender.bannerT; goT=savedRender.goT; vsRound=savedRender.vsRound; phase=savedRender.phase; scene=savedRender.scene;
    }
    if (onlineHeld()) drawReconnect();
    if(online.coop&&latest&&performance.now()-snaps[snaps.length-1].at>250)drawReconnect();
    if(online.coop&&menuKey('back')){onlineExit();return;}
    if (online.result!==undefined && !onlineHeld()) {
      online.resultT+=dt;if(menuKey('ok'))onlineRematch();if(menuKey('back'))onlineExit();
    }
  }
  function openRanking() {
    scene='ranking'; rankRows=null; rankError=false;
    window.BanguOnline.ranking().then(function (data) { rankRows=data.ranking||[]; }).catch(function () { rankError=true; });
  }
  function drawRanking() {
    ctx.fillStyle='#0b0a10'; ctx.fillRect(0,0,W,H);
    txt('RANKING',240,15,'#ffe066','center',16);
    if (rankError) txt('SEM CONEXÃO',240,120,'#ff6b6b','center');
    else if (!rankRows) txt('CARREGANDO...',240,120,'#fff','center');
    else if (!rankRows.length) txt('AINDA SEM PONTUAÇÕES',240,120,'#fff','center');
    else rankRows.forEach(function (r,i) {
      txt(String(i+1)+'. '+r.name.toUpperCase(),14,41+i*19,'#fff');
      txt(pad(r.score),305,41+i*19,'#ffe066','right');
      txt('F'+r.stage+' '+(NAMES[r.character]||r.character),470,41+i*19,'#a9a5b5','right');
    });
    txt('ESC: MENU',240,248,'#8f8c9e','center');
  }
  function maybeSubmitScore(custom) {
    if (custom) {
      if (!window.BanguOnline) return;
      var row = Object.assign({}, custom);
      function askEsc(title) {
        window.BanguOnline.askText(title, 12).then(function (name) {
          if (name === null) return;
          name = name.normalize('NFC').trim().replace(/ +/g, ' ');
          if (!name || Array.from(name).length > 12 || !/^[\p{L}\p{N} ]+$/u.test(name)) {
            askEsc('NOME INVÁLIDO: LETRAS E NÚMEROS'); return;
          }
          row.name = name;
          window.BanguOnline.score(row).catch(function (err) {
            onlineNotice = err.status === 429 ? 'AGUARDE 30 SEGUNDOS' : err.status === 400 ? 'PONTUAÇÃO INVÁLIDA' : 'RANKING SEM CONEXÃO';
            onlineNoticeT = 4;
          });
        });
      }
      askEsc('SEU NOME PARA O RANKING');
      return;
    }
    if (scorePrompted || versus) return;
    if (!window.BanguOnline) return;
    scorePrompted=true;scorePending=true;
    var row={score:Math.floor(score),stage:stage,character:players[0]&&players[0].who};
    var session=online;
    if(online&&online.coop){row.modo='coop';row.team=players.map(function(p){return p.who;});}
    function finish() {
      scorePending=false;
      // Uma resposta tardia não deve interromper outra partida.
      if((scene!=='gameover'&&scene!=='ending')||online!==session)return;
      if(online&&online.coop)onlineExit();
      menuStage=1;openRanking();
    }
    function ask(title) {
      window.BanguOnline.askText(title,12,{cancelLabel:'SEM NOME'}).then(function (name) {
        if (name === null) name=row.modo==='coop'?'TIME CREIA':'JOGADOR';
        name=name.normalize('NFC').trim().replace(/ +/g,' ');
        if (!name || Array.from(name).length>12 || !/^[\p{L}\p{N} ]+$/u.test(name)) {
          ask('NOME INVÁLIDO: LETRAS E NÚMEROS'); return;
        }
        row.name=name;
        return window.BanguOnline.score(row).then(finish);
      }).catch(function (err) {
        scorePending=false;scorePrompted=false;
        onlineNotice=err.status===429?'AGUARDE 30 SEGUNDOS':err.status===400?'PONTUAÇÃO INVÁLIDA':'RANKING SEM CONEXÃO';
        onlineNoticeT=4;
      });
    }
    ask(row.modo==='coop'?'NOME DO TIME PARA O RANKING':'SEU NOME PARA O RANKING');
  }

  var cfgSel = 0, cfgFrom = 'menu';
  var TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var pauseSel = 0, showCtl = false, ctlFrom = null, showCfg = false;
  var PCOL = ['#ff3b3b', '#3b8bff', '#3bff6a', '#ffd23b'];
  // elenco da tela de seleção; null = vaga para o próximo personagem
  var ROSTER = [
    { who: 'nutri', job: 'NUTRICIONISTA', arma: 'FRUTAS E XÍCARA DE CAFÉ', esp: 'RESTRIÇÃO ALIMENTAR, LOW CARB!' },
    { who: 'lutador', job: 'LUTADOR', arma: 'MUAY THAI E HALTER', esp: 'SOLO DE GUITARRA' },
    { who: 'emanuelly', job: 'ESTUDANTE', arma: 'CONSOLE E INVOCADOS', esp: 'CHUVA DE LÂMINAS' },
    { who: 'enzo', job: 'BASQUETE E MUSICA', arma: 'BOLAS DE BASQUETE', esp: 'CHUVA DE BASQUETE' },
    { who: 'pedro', job: 'TECLADISTA', arma: 'TECLADO DE SEMINIMAS', esp: 'HARMONIA BIZARRAMENTE TORTA' },
    { who: 'naju', job: 'CANTORA', arma: 'MICROFONE NO FIO', esp: 'GRITO NO MICROFONE' },
    { who: 'grazi', job: 'PROFESSORA', arma: 'PISTOLA DE COLA QUENTE', esp: 'VÃO, MINHAS CRIANÇAS!' },
    { who: 'bispo', job: 'BISPO', arma: 'BÍBLIA E ORAÇÃO (+5 HP)', esp: 'INDESCULPÁVEIS!' },
    { who: 'lohan', job: 'FOTÓGRAFO', arma: 'ESTABILIZADOR E CÂMERAS VOADORAS', esp: 'SUPER FLASH' },
    { who: 'rafinha', job: 'BATERISTA', arma: 'PRATOS DE ATAQUE E CONDUÇÃO', esp: 'CHUVA DE PRATO' },
    { who: 'douglas', job: 'CAVAQUINISTA', arma: 'CLAVES E CAVAQUINHO', esp: 'FARMAR AURA' },
    { who: 'fidelis', job: 'GAMER', arma: 'CONTROLE ARREMESSADO', esp: 'INVERSÃO DE ACORDE' },
    { who: 'arthur', job: 'CANTOR', arma: 'CANTO E BOLO (+20 HP)', esp: 'VÁ ESTUDAR (3X RÁPIDO)' },
    { who: 'lucas', job: 'CREIACAST', arma: 'MICROFONE E FRALDA CAGADA', esp: 'PORCOS NA SALA!' },
    { who: 'duda', job: 'CANTORA', arma: 'CHOQUE DO MICROFONE E POSE (+30 HP)', esp: 'CORAM DEO (+50% HP)' },
    { who: 'cardoso', job: 'BAIXISTA', arma: 'BRAÇO DO BAIXO E BARRIGADA', esp: 'LIMADOS COM SUCESSO! (5s)' },
    {who:'th',job:'REPÓRTER',arma:'GRAVAÇÃO REC E IPHONE',esp:'ANÚNCIOS DA SEMANA - TV OLED'},
    {who:'douglinhas',job:'TRICOLOR',arma:'BOLA DE FUTEBOL E TAPA',esp:'QUE TENHAMOS LÁGRIMAS!'},
    {who:'ricardo',job:'KARATÊ E LOUVOR',arma:'SOCO E ROLAGEM',esp:'NÃO HÁ FERROLHOS... NEM PORRRTAAAAS!'},
    {who:'adriene',job:'CONFEITEIRA',arma:'BRIGADEIRO E COLHER DE PAU',esp:'É HORA DO BRIGADEIRO!'}
  ];
  var rosterOrder=['bispo','lucas','lutador','douglas','rafinha','duda','cardoso','fidelis','pedro','naju','enzo','grazi','th','douglinhas','nutri','arthur','lohan','emanuelly','ricardo','adriene'];
  ROSTER.sort(function(a,b){return rosterOrder.indexOf(a.who)-rosterOrder.indexOf(b.who);});
  var titleImg = new Image(); titleImg.src = 'assets/cenarios/titulo.webp';
  function panel(x, y, w, h, fill, line) {   // caixa com cantos chanfrados de pixel
    ctx.fillStyle = fill; ctx.fillRect(x + 2, y, w - 4, h); ctx.fillRect(x, y + 2, w, h - 4);
    if (line) { ctx.fillStyle = line; ctx.fillRect(x + 2, y, w - 4, 1); ctx.fillRect(x + 2, y + h - 1, w - 4, 1); ctx.fillRect(x, y + 2, 1, h - 4); ctx.fillRect(x + w - 1, y + 2, 1, h - 4); }
  }
  // versão do jogo no rodapé: lida do CACHE do sw.js, a mesma fonte da publicação
  var VERSAO = '';
  try { fetch('sw.js', { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) { var m = /creia-fight-(v\d+)/.exec(t); if (m) VERSAO = m[1]; }).catch(function () {}); } catch (e) {}
  function drawMenu() {
    // fundo: o muro do Bangu com filtro escuro e vinheta (a arte fica, o texto manda)
    if (titleImg.complete && titleImg.naturalWidth) {
      ctx.save(); ctx.imageSmoothingEnabled = true;
      var drift = Math.sin(time * 0.15) * 6;
      ctx.drawImage(titleImg, -10 + drift, -6, W + 20, H + 12); ctx.restore();
    } else { ctx.fillStyle = '#0b0a10'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = 'rgba(10,8,16,0.76)'; ctx.fillRect(0, 0, W, H);
    var vg = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 300);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // título
    txt('Creia Fight', 240, 34, '#ffffff', 'center', 24);
    ctx.fillStyle = '#e8323c'; ctx.fillRect(150, 64, 180, 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(150, 67, 180, 1);
    txt('Deus, fé e muita resenha', 240, 74, '#ffd34d', 'center', 12);
    // painel do menu
    var px = 126, py = 96, pw = 228, ph = 16 + MENU.length * 18;   // a caixa cresce com o número de opções
    panel(px, py, pw, ph, 'rgba(12,10,18,0.78)', 'rgba(255,255,255,0.18)');
    ctx.fillStyle = '#e8323c'; ctx.fillRect(px + 2, py, pw - 4, 3);
    MENU.forEach(function (m, i) {
      var on = i === menuSel, ry = py + 10 + i * 18;
      if (on) { panel(px + 10, ry - 4, pw - 20, 18, '#e8323c'); }
      var label = i === 0 ? 'X1 (1 CONTRA 1)' : m;
      txt(label.toUpperCase(), 240, ry + 1, on ? '#ffffff' : '#9a98a8', 'center', 8);
    });
    // rodapé discreto
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, H - 22, W, 22);
    txt('ENTER CONFIRMA    SETAS ESCOLHEM    M SOM', 240, H - 15, '#8f8c9e', 'center');
    if (VERSAO) txt(VERSAO, W - 8, H - 15, '#5f5c6e', 'right');
    txt('RECORDE ' + pad(saved.hi), W - 10, 8, '#8f8c9e', 'right');
    if (Math.floor(time * 1.6) % 2 && menuSel === 0) txt('APERTE ENTER', 240, 226, '#ffffff', 'center');
  }
  function updateMenu() {
    if (menuKey('up') || menuKey('down')) { menuSel = (menuSel + (menuKey('up') ? MENU.length - 1 : 1)) % MENU.length; sfx('menu'); }
    if (menuKey('ok')) activateMenu(menuSel);
  }
  function activateMenu(index){
    menuSel=index;sfx('select');if(index===0){scene='x1menu';x1Sel=0;}else if(index===1){menuStage=1;scene='adventuremenu';adventureSel=0;adventureOpt=0;}else if(index===2){scene='controls';ctlFrom='menu';}else if(index===3){scene='config';cfgFrom='menu';cfgSel=0;}else if(index===4)openRanking();
  }

  // ---------- Seleção de personagens (estilo luta de fliperama) ----------
  var sel = null;
  var COLS = 6;
  function selectLayout() {
    var counts=[4,5,6,5],offset=0,tiles=[],tile=30,gap=5;
    while(counts.reduce(function(a,b){return a+b;},0)<ROSTER.length)counts.push(6);
    counts.forEach(function(count,row){var n=Math.min(count,ROSTER.length-offset),x=240-(n*(tile+gap)-gap)/2;
      for(var col=0;col<n;col++)tiles.push({index:offset+col,row:row,col:col,x:x+col*(tile+gap),y:24+row*(tile+gap),size:tile});offset+=n;});
    return {rows:counts.length,counts:counts,gap:gap,tile:tile,x:137.5,textY:24+counts.length*(tile+gap)+2,tiles:tiles};
  }
  function gridMove(hit,cur,N){
    if(hit('right'))return(cur+1)%N;if(hit('left'))return(cur+N-1)%N;
    var dir=hit('down')?1:hit('up')?-1:0;if(!dir)return cur;
    var tiles=selectLayout().tiles.slice(0,N),from=tiles[cur],rows=tiles.reduce(function(n,t){return Math.max(n,t.row+1);},0);
    if(!from)return 0;
    var row=(from.row+rows+dir)%rows,candidates=tiles.filter(function(t){return t.row===row;});
    candidates.sort(function(a,b){return Math.abs(a.x-from.x)-Math.abs(b.x-from.x)||a.index-b.index;});return candidates[0].index;
  }
  addEventListener('pointerdown',function (e) {
    if(pularCulto()){pressed.clear();physicalPressed.clear();touchPressed.clear();audio();return;}
    if (scene==='stagesel' && e.target===cv) {   // cenário: miniatura escolhe (de novo confirma), laterais trocam, prévia confirma
      var sb=cv.getBoundingClientRect(), sx=(e.clientX-sb.left)*W/sb.width, sy=(e.clientY-sb.top)*H/sb.height;
      for(var si=0;si<=10;si++){var st=stageTile(si);if(sx>=st.x&&sx<st.x+st.w&&sy>=st.y&&sy<st.y+st.h){stTap=si;break;}}
      if(stTap==null)stTap=sx<70&&sy<26?'back':sx<80?'prev':sx>400?'next':sy<212?'ok':null;
      audio(); return;
    }
    if ((scene==='tour' || scene==='escalada') && e.target===cv) {   // torneio/escalada: toque avança; SAIR no alto (esquerda no torneio)
      var tb=cv.getBoundingClientRect(), tx=(e.clientX-tb.left)*W/tb.width, ty=(e.clientY-tb.top)*H/tb.height;
      if (scene==='tour') tourTap=tx<70&&ty<26?'back':'ok';
      else escTap=tx>410&&ty<26?'back':'ok';
      audio(); return;
    }
    if (scene!=='select' || !sel || sel.vsT>=0 || e.target!==cv || (e.button!=null && e.button!==0)) return;
    var bounds=cv.getBoundingClientRect(), layout=selectLayout();
    var x=(e.clientX-bounds.left)*W/bounds.width, y=(e.clientY-bounds.top)*H/bounds.height;
    var tile=layout.tiles.find(function(t){return x>=t.x&&x<t.x+t.size&&y>=t.y&&y<t.y+t.size;});
    if(tile)sel.click=tile.index;
    else if (sel.slots[0].lock && x>=186 && x<=294 && y>=layout.textY+65 && y<=layout.textY+82)
      sel.click=ROSTER.length;
    else return;
    e.preventDefault(); audio();
  });
  function advanceSelection(s) {
    if (selTeam().length>=selCap()) { s.cur=ROSTER.length; return; }
    for (var step=1;step<=ROSTER.length;step++) {
      var next=(s.cur+step)%ROSTER.length;
      if (ROSTER[next] && !selTaken(ROSTER[next].who,-1)) { s.cur=next; return; }
    }
    s.cur=ROSTER.length;
  }
  function selCap() { return sel.escalada ? 1 : (sel.tour || (sel.vs ? 2 : 4)); }
  function selNeed() { return sel.escalada ? 1 : (sel.tour || (sel.vs ? 2 : 1)); }   // quantos para poder começar
  function sortTourRest() {
    if (scene!=='select' || !sel || !sel.tour || sel.vsT>=0 || selTeam().length>=sel.tour) return;
    var available=ROSTER.filter(function(r){return !selTaken(r.who,-1);});
    for(var i=available.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),r=available[i];available[i]=available[j];available[j]=r;}
    var first=sel.slots[0];
    while(selTeam().length<sel.tour && available.length){
      var next=available.pop();
      if(!first.lock){first.pick=ROSTER.indexOf(next);first.lock=true;first.keyboard=true;}
      else sel.ai.push(next.who);
    }
    first.cur=ROSTER.length; sfx('select');
  }
  function selGo() {
    if (sel.escalada) {
      sfx('boss_roar');
      var team = selTeam();
      var who = team[0] ? team[0].who : ROSTER[pickOf(sel.slots[0])].who;
      openEscalada(who);
      return;
    }
    if (sel.vs || sel.tour) { sfx('select'); openStageSel(); }
    else { sfx('boss_roar'); sel.vsT = 0; }
  }
  function openSelect(vs, tourSize, escalada) {
    scene = 'select';
    if (!escalada) esc = null;
    pads.forEach(function(pd,i){pd.slot=i;});
    sel = { vs: !!vs, tour: tourSize || 0, escalada: !!escalada, t: 0, ai: [], slots: [0, 1, 2, 3].map(function (i) { return { on: i === 0, cur: i % 3, lock: false }; }), vsT: -1 };
  }
  function selTaken(who, except) {
    return sel.ai.indexOf(who) >= 0 || sel.slots.some(function (s, i) { return i !== except && s.on && s.lock && ROSTER[pickOf(s)] && ROSTER[pickOf(s)].who === who; });
  }
  function pickOf(s) { return s.pick != null ? s.pick : s.cur; }   // o personagem travado (o cursor do P1 continua andando)
  function selTeam() {
    var team = [];
    sel.slots.forEach(function (s, i) { if (s.on && s.lock) team.push({ who: ROSTER[pickOf(s)].who, ctl: i }); });
    sel.ai.forEach(function (w) { team.push({ who: w, ctl: null }); });
    return sel.vs ? asVs(team) : team;
  }
  function asVs(team){return team.map(function(m,i){return {who:m.who,ctl:localVs.mode==='eve'?null:localVs.mode==='pvp'?i:i===0?0:null,difficulty:localVs.levels[i]};});}
  function updateSelect(dt) {
    sel.t += dt;
    if (sel.vsT >= 0) { sel.vsT += dt; if (sel.vsT > 2.2 && stageReady(selStage()) && (!window.Rig || selTeam().every(function (m) { return window.Rig.ready(m.who); }))) startTeam(selTeam(), false, sel.vs); return; }   // só entra com cenário e bonecos baixados
    if(sel.tour && (anyPressed(['KeyR']) || padHit(0,'alt'))) sortTourRest();
    var previousCount=selTeam().length;
    // Depois de escolher no teclado, START entra com o controle no próximo lugar livre.
    if(!sel.vs||localVs.mode==='pvp')pads.forEach(function(pd){
      var current=sel.slots[pd.slot];
      if(!pd.hit.start||!current.on||!current.lock||!current.keyboard)return;
      var free=sel.slots.findIndex(function(s,i){return i>0&&!s.on;});
      if(free>=0&&selTeam().length<selCap()){
        var previous=pd.slot;
        pads.forEach(function(other){if(other!==pd&&other.slot===free)other.slot=previous;});
        pd.slot=free;
      }
    });
    sel.slots.forEach(function (s, i) {
      var hit = function (n) { return slotHit(i, n) || (i === 0 && n === 'atk' && anyPressed(['Enter', 'Space'])); };
      if (!s.on) {
        if (selTeam().length>=selCap()) return;
        if (sel.vs && (i > 1 || localVs.mode!=='pvp' || selTeam().length >= 2)) return;   // X1: só P1 e P2
        if (i < 2 ? hit('atk')||padHit(i,'start') : padHit(i,'start')) {
          s.on = true; s.cur = 0;
          while (s.cur < ROSTER.length - 1 && (!ROSTER[s.cur] || selTaken(ROSTER[s.cur].who, i) || sel.slots.some(function (o, j) { return j !== i && o.on && o.cur === s.cur; }))) s.cur++;
          sfx('select');
        }
        return;
      }
      if (i === 0) {   // P1 escolhe o time; INICIAR ou L confirma a partida.
        var c0 = s.cur===ROSTER.length ?
          (hit('up') || hit('left') ? ROSTER.length-1 : hit('down') || hit('right') ? 0 : s.cur) :
          gridMove(hit, s.cur, ROSTER.length);
        if (c0 !== s.cur) { s.cur = c0; sfx('menu'); }
        var clicked=sel.click!=null;
        if (clicked) { s.cur=sel.click; sel.click=null; }
        var r0 = ROSTER[s.cur], ok0 = clicked || slotHit(0, 'atk') || anyPressed(['Enter', 'Space']);
        if (s.lock && (slotHit(0, 'spc')||padHit(0,'start')) && selTeam().length >= selNeed()) { selGo(); return; }
        if (ok0) {
          if (s.lock && s.cur === ROSTER.length) {   // INICIAR
            if (selTeam().length < selNeed()) { sel.msg = sel.escalada ? 'ESCOLHA 1 LUTADOR' : (sel.tour ? 'ESCOLHA ' + sel.tour + ' LUTADORES' : 'ESCOLHA O ADVERSARIO'); sel.msgT = 1; sfx('block'); return; }
            selGo(); return;
          }
          if (!r0) { sel.msg = 'EM BREVE'; sel.msgT = 1; return; }
          if (!s.lock) { if (!selTaken(r0.who, 0)) { s.lock = true; s.keyboard=!padHit(0,'atk');s.pick = s.cur; advanceSelection(s); sfx('special'); } return; }
          if (s.pick === s.cur) { advanceSelection(s); return; }
          var k0 = sel.ai.indexOf(r0.who);
          if (k0 >= 0) { sel.ai.splice(k0, 1); sfx('menu'); }
          else if (selTaken(r0.who, -1)) { sel.msg = 'JA ESTA NO TIME'; sel.msgT = 1; sfx('block'); }
          else if (selTeam().length >= selCap()) { sel.msg = sel.escalada ? 'ESCALADA E COM 1 LUTADOR' : (sel.vs ? 'X1 E SO DE 2' : 'TIME CHEIO (' + selCap() + ')'); sel.msgT = 1; sfx('block'); }
          else { sel.ai.push(r0.who); advanceSelection(s); sfx('select'); }
          return;
        }
        if (hit('jump') || anyPressed(['Escape'])) {
          if (sel.ai.length) sel.ai.pop(); else if (s.lock) { s.lock = false; s.cur = s.pick; s.pick = null; } else scene = (sel.vs || sel.tour || sel.escalada) ? 'x1menu' : 'adventuremenu';
          sfx('menu');
        }
        return;
      }
      if (!s.lock) {
        var c1 = gridMove(hit, s.cur, ROSTER.length);
        if (c1 !== s.cur) { s.cur = c1; sfx('menu'); }
        if (hit('atk') && ROSTER[s.cur] && !selTaken(ROSTER[s.cur].who, i) && selTeam().length<selCap()) { s.lock = true;s.keyboard=!padHit(i,'atk');sfx('special'); }
        if (hit('jump') || (i === 0 && anyPressed(['Escape']))) { if (i === 0) { scene = 'menu'; return; } s.on = false; }
      } else {
        if (hit('jump') || (i === 0 && anyPressed(['Escape']))) { s.lock = false; sfx('menu'); }
      }
    });
    if(sel.vs&&selTeam().length===2&&padHit(1,'start')&&sel.slots[1].lock)selGo();
    if (sel.slots[0].lock && selTeam().length>previousCount && selTeam().length>=selCap())
      sel.slots[0].cur=ROSTER.length;
  }
  // ---------- Escolha do cenário (X1 local e torneio): imagem parada da arena onde o X1 acontece; 0 = aleatório ----------
  var vsStage = null, stSel = null, stTap = null, stThumbs = {};
  function randomStage() { return 1 + Math.floor(Math.random() * 10); }
  function openStageSel() { stSel = { cur: vsStage || 1, t: 0 }; scene = 'stagesel'; }
  function stageTile(i) { return { x: 9 + i * 42, y: 220, w: 38, h: 24 }; }   // 0 = aleatório, 1..10 = fases
  function stageThumb(s) {   // miniatura desenhada uma vez só, quando o cenário já baixou
    if (stThumbs[s] || !stageReady(s)) return stThumbs[s];
    var c = document.createElement('canvas'); c.width = 76; c.height = 48;
    var g = c.getContext && c.getContext('2d'); if (!g) return null;
    var save = ctx; ctx = g; g.save(); g.scale(76 / W, 48 / H); bg('draw', g, s, CAM_MAX, 0); g.restore(); ctx = save;
    return (stThumbs[s] = c);
  }
  function drawStageSel() {
    var g0 = ctx.createLinearGradient(0, 0, 0, H); g0.addColorStop(0, '#0d0a14'); g0.addColorStop(1, '#2a0a10');
    ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
    txt('ESCOLHA O CENÁRIO', 240, 8, '#ffe066', 'center', 16);
    txt('VOLTAR', 10, 10, '#8f8c9e', 'left');
    var s = stSel.cur, fx = 80, fy = 32, fw = 320, fh = 180;
    ctx.fillStyle = '#e8323c'; ctx.fillRect(fx - 2, fy - 2, fw + 4, fh + 4);
    ctx.save(); ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
    if (s) { ctx.translate(fx, fy); ctx.scale(fw / W, fh / H); bg('draw', ctx, s, CAM_MAX, 0); }   // a mesma vista da arena do X1, parada
    else { ctx.fillStyle = '#120f18'; ctx.fillRect(fx, fy, fw, fh); txt('?', 240, fy + 50, '#ffe066', 'center', 48); }
    ctx.restore();
    ctx.fillStyle = 'rgba(8,6,14,.75)'; ctx.fillRect(fx, fy + fh - 20, fw, 20);
    txt(s ? s + '. ' + place(s) : 'ALEATÓRIO' + (sel && sel.tour ? ': UM POR LUTA' : ''), 240, fy + fh - 14, '#ffffff', 'center');
    txt('<', fx - 22, fy + fh / 2 - 8, '#ffffff', 'center', 16); txt('>', fx + fw + 22, fy + fh / 2 - 8, '#ffffff', 'center', 16);
    for (var i = 0; i <= 10; i++) {
      var b = stageTile(i), th = i && stageThumb(i);
      panel(b.x, b.y, b.w, b.h, '#1d1828');
      if (th) ctx.drawImage(th, b.x + 1, b.y + 1, b.w - 2, b.h - 2);
      txt(i ? String(i) : '?', b.x + b.w / 2, b.y + 8, '#ffffff', 'center');
      if (i === s) { ctx.strokeStyle = Math.floor(time * 4) % 2 ? '#ffe066' : '#e8323c'; ctx.lineWidth = 2; ctx.strokeRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2); }
    }
    if (Math.floor(time * 2) % 2) txt(s && !stageReady(s) ? 'CARREGANDO...' : 'ENTER ESCOLHE    ESC VOLTA', 240, 252, '#8f8c9e', 'center');
  }
  function updateStageSel(dt) {
    stSel.t += dt; playSong('rua');
    var tap = stTap; stTap = null;
    if (menuKey('back') || tap === 'back') { stSel = null; scene = 'select'; sfx('menu'); return; }
    var step = menuKey('left') || menuKey('up') || tap === 'prev' ? -1 : menuKey('right') || menuKey('down') || tap === 'next' ? 1 : 0;
    if (step) { stSel.cur = (stSel.cur + step + 11) % 11; stSel.t = 0; sfx('menu'); }
    if (typeof tap === 'number') { if (tap === stSel.cur) tap = 'ok'; else { stSel.cur = tap; stSel.t = 0; sfx('menu'); } }
    if ((menuKey('ok') || tap === 'ok') && (!stSel.cur || stageReady(stSel.cur))) {
      var choice = stSel.cur; stSel = null; sfx('boss_roar');
      if (sel.tour) { openTour(selTeam().map(function (m) { return m.who; }), choice); return; }
      vsStage = choice || randomStage(); scene = 'select'; sel.vsT = 0; return;
    }
    drawStageSel();
  }
  function selStage() { return sel && (sel.vs || sel.tour) && vsStage ? vsStage : menuStage; }
  // ---------- Torneio (X1 local em chave de 4 ou 8; o modo e a dificuldade vêm da tela do X1) ----------
  var tour = null, tourTap = null;
  function openTour(list, stageChoice) {
    esc = null;
    list = list.slice();
    for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t; }   // sorteio da chave
    var size = 1; while (size < list.length) size *= 2;
    if (size > list.length) {   // 12: chave de 16 com 4 folgas (quem folga passa direto), espalhadas pela chave
      var byes = size - list.length, pairs = [];
      for (var k = 0; k < size / 2; k++) pairs.push(k < byes ? [list[k], null] : [list[byes + (k - byes) * 2], list[byes + (k - byes) * 2 + 1]]);
      for (var q = pairs.length - 1; q > 0; q--) { var r = Math.floor(Math.random() * (q + 1)), tp = pairs[q]; pairs[q] = pairs[r]; pairs[r] = tp; }
      list = [].concat.apply([], pairs);
    }
    tour = { size: size, rounds: [list, []], r: 0, m: 0, champ: null, t: 0, quitT: 0, stage: stageChoice || 0 };
    for (var f = 0; f < size / 2; f++) if (!(list[f * 2] && list[f * 2 + 1])) tour.rounds[1][f] = list[f * 2] || list[f * 2 + 1];   // quem folga já aparece na rodada seguinte
    tour.cur = tour.stage || randomStage();
    tourBye();
    scene = 'tour';
  }
  function tourBye() { var p = !tour.champ && tourPair(); if (p && !(p[0] && p[1])) tourWin(p[0] || p[1]); }   // folga: passa sem lutar
  function tourPair() { var R = tour.rounds[tour.r]; return [R[tour.m * 2], R[tour.m * 2 + 1]]; }
  function tourWin(who) {
    var next = tour.rounds[tour.r + 1] || (tour.rounds[tour.r + 1] = []);
    next[tour.m++] = who;
    if (tour.m * 2 >= tour.rounds[tour.r].length) { tour.r++; tour.m = 0; if (next.length === 1) tour.champ = who; }
    tour.t = 0; tour.cur = tour.stage || randomStage();   // aleatório: cada luta num cenário
    tourBye();
  }
  function tourStageName(n) { return n === 2 ? 'FINAL' : n === 4 ? 'SEMIFINAL' : n === 8 ? 'QUARTAS DE FINAL' : 'OITAVAS DE FINAL'; }
  function tourSide(i) { var c = asVs([{}, {}])[i].ctl; return c == null ? 'IA' : 'P' + (c + 1); }
  function drawTour() {
    var bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0d0a14'); bg.addColorStop(1, '#2a0a10');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#e8323c'; ctx.fillRect(170, 25, 140, 2);
    var R = tour.rounds, cols = Math.round(Math.log(tour.size) / Math.LN2) + 1, cw = (W - 20) / cols, bw = cw - 12, top = 46, row = 180 / tour.size;
    var mini = tour.size > 8, bh = mini ? 10 : 20, ps = mini ? 9 / 30 : 18 / 30;   // 16: linhas mais baixas, retrato menor
    txt('TORNEIO', 240, 8, '#ffe066', 'center', 16);
    txt(tour.champ ? 'TEMOS UM CAMPEÃO!' : tourStageName(R[tour.r].length) + ' · ' + place(tour.cur), 240, 30, '#ffffff', 'center');
    txt('SAIR', 10, 8, '#c9c4d6', 'left');
    for (var c = 0; c < cols; c++) {
      var span = row * Math.pow(2, c), n = tour.size / Math.pow(2, c), x = 10 + c * cw;
      if (mini) { var w0 = 112, wr = (W - 20 - w0) / (cols - 1); x = 10 + (c ? w0 + (c - 1) * wr : 0); cw = c ? wr : w0; bw = cw - 12; }   // 16: 1ª coluna mais larga para os nomes
      for (var i = 0; i < n; i++) {
        var who = R[c] && R[c][i], y = top + span * (i + 0.5), up = R[c + 1] && R[c + 1][i >> 1];
        if (c < cols - 1) {   // linha até a luta seguinte; dourada para quem passou
          var py = top + span * 2 * ((i >> 1) + 0.5), xm = x + cw - 6;
          ctx.fillStyle = who && up === who ? '#ffd34d' : '#4a4458';
          ctx.fillRect(x + bw, y, xm - x - bw, 1); ctx.fillRect(xm, Math.min(y, py), 1, Math.abs(py - y) + 1); ctx.fillRect(xm, py, x + cw - xm, 1);
        }
        ctx.save(); if (who && up && up !== who) ctx.globalAlpha = 0.35;
        panel(x, y - bh / 2, bw, bh, who ? '#1d1828' : '#120f18');
        if (!tour.champ && c === tour.r && (i >> 1) === tour.m && Math.floor(time * 4) % 2) { ctx.strokeStyle = '#e8323c'; ctx.lineWidth = 2; ctx.strokeRect(x - 1, y - bh / 2 - 1, bw + 2, bh + 2); }
        if (who) {
          ctx.save(); ctx.translate(x + 2, y - bh / 2 + 1); ctx.scale(ps, ps); spr('drawPortrait', ctx, who, 0, 0); ctx.restore();
          txt(NAMES[who], x + (mini ? 13 : 23), y - 3, c === cols - 1 ? '#ffe066' : '#ffffff', 'left', 5);
        } else if (c > 0) txt('?', x + bw / 2, y - 4, '#6a6478', 'center');   // na 1ª coluna, vazio = folga
        ctx.restore();
      }
    }
    if (tour.champ) {
      ctx.fillStyle = 'rgba(8,6,14,.93)'; ctx.fillRect(0, 0, W, H);
      var cols2 = ['#ffd34d', '#e8323c', '#7dff8a', '#5ac8ff', '#ffffff'];
      for (var k = 0; k < 50; k++) { ctx.fillStyle = cols2[k % 5]; ctx.fillRect((k * 53 + tour.t * 30 * (1 + k % 3)) % W, (k * 97 + tour.t * 60 * (1 + k % 2)) % H, 3, 3); }   // confete
      txt('CAMPEÃO DO TORNEIO!', 240, 26, '#ffe066', 'center', 16);
      if (!(window.Rig && window.Rig.big(ctx, tour.champ, 'victory', tour.t, 240, 206, 1, 2))) spr('drawChibi', ctx, tour.champ, 'victory', tour.t, 240, 206, 1, {});
      txt(NAMES[tour.champ], 240, 214, '#ffffff', 'center', 12);
      if (tour.t > 1.5 && Math.floor(time * 2) % 2) txt('ENTER: MENU', 240, 250, '#8f8c9e', 'center');
      return;
    }
    var p = tourPair();
    txt(tourSide(0) + ': ' + NAMES[p[0]] + '   VS   ' + tourSide(1) + ': ' + NAMES[p[1]], 240, 236, '#ffffff', 'center');
    if (tour.quitT > 0) txt('ESC DE NOVO PARA SAIR DO TORNEIO', 240, 252, '#ff6b6b', 'center');
    else if (Math.floor(time * 2) % 2) txt(tourReady(p) ? 'ENTER: LUTAR' : 'CARREGANDO...', 240, 252, '#8f8c9e', 'center');
  }
  function tourReady(p) { return stageReady(tour.cur) && (!window.Rig || (window.Rig.ready(p[0]) && window.Rig.ready(p[1]))); }
  function updateTour(dt) {
    tour.t += dt; tour.quitT -= dt; playSong('rua');
    var ok = menuKey('ok') || tourTap === 'ok', back = menuKey('back') || tourTap === 'back';
    tourTap = null;
    if (tour.champ) { if (tour.t > 1.5 && ok) { tour = null; scene = 'menu'; sfx('menu'); return; } }
    else if (back) { if (tour.quitT > 0) { tour = null; scene = 'menu'; sfx('menu'); return; } tour.quitT = 2; sfx('block'); }
    else if (ok && tour.t > 0.4 && tourReady(tourPair())) { sfx('boss_roar'); vsStage = tour.cur; startTeam(asVs(tourPair().map(function (who) { return { who: who }; })), false, true); return; }
    drawTour();
  }
  // ---------- Escalada (19 lutadores em sequência, dificuldade crescente) ----------
  var esc = null, escTap = null;
  function saveEscaladaRecord(who, degrau) {
    try {
      saved.escalada = saved.escalada || {};
      if (!saved.escalada[who] || degrau > saved.escalada[who]) {
        saved.escalada[who] = degrau;
        save();
      }
    } catch (_) {}
  }
  function getEscaladaRecord(who) {
    try {
      return (saved && saved.escalada && saved.escalada[who]) || 0;
    } catch (_) { return 0; }
  }
  function openEscalada(who) {
    var list = ROSTER.filter(function (r) { return r && r.who !== who; }).map(function (r) { return r.who; });
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), temp = list[i];
      list[i] = list[j]; list[j] = temp;
    }
    esc = {
      who: who,
      lista: list,
      degrau: 0,
      t: 0,
      fim: null,
      quitT: 0,
      subindo: false,
      subidaT: 0,
      stage: randomStage(),
      scored: false
    };
    scene = 'escalada';
  }
  function escaladaFoe() { return esc && esc.lista ? esc.lista[esc.degrau] : null; }
  function escaladaReady(e) {
    var foe = e.lista[e.degrau];
    return stageReady(e.stage) && (!window.Rig || (window.Rig.ready(e.who) && window.Rig.ready(foe)));
  }
  function escFightDone(won) {
    if (!esc) return;
    if (won) {
      esc.degrau++;
      saveEscaladaRecord(esc.who, esc.degrau);
      if (esc.degrau >= esc.lista.length) {
        esc.fim = 'campeao';
        esc.t = 0;
        if (!esc.scored) {
          esc.scored = true;
          maybeSubmitScore({ modo: 'escalada', character: esc.who, degrau: esc.degrau });
        }
      } else {
        esc.subindo = true;
        esc.subidaT = 0;
        esc.t = 0;
        esc.stage = randomStage();
      }
    } else {
      esc.fim = 'derrota';
      esc.t = 0;
      saveEscaladaRecord(esc.who, esc.degrau);
      if (!esc.scored) {
        esc.scored = true;
        maybeSubmitScore({ modo: 'escalada', character: esc.who, degrau: esc.degrau });
      }
    }
  }
  function drawRetrato(g, who, x, y, size) {
    g.save(); g.translate(x, y); g.scale((size || 30) / 30, (size || 30) / 30);
    if (window.Rig && window.Rig.portrait) window.Rig.portrait(g, who, 0, 0);
    else spr('drawPortrait', g, who, 0, 0);
    g.restore();
  }
  function escBig(g, who, state, t, x, y, facing, scale) {   // corpo inteiro real (Rig) para o EscaladaVisual
    if (window.Rig && window.Rig.big(g, who, state, t, x, y, facing, scale)) return true;
    spr('drawChibi', g, who, state, t, x, y, facing, {}); return true;
  }
  function escCenario(s) { return s && stageReady(s) ? function (g) { bg('draw', g, s, CAM_MAX, time); } : null; }   // a arena de verdade, parada, como na escolha de cenário
  function drawSimpleTorre() {
    var bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0e0918'); bg.addColorStop(1, '#240a12');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e8323c'; ctx.fillRect(170, 24, 140, 2);
    txt('ESCALADA BANGU', 240, 8, '#ffe066', 'center', 14);
    txt('DEGRAU ' + (esc.degrau + 1) + ' / 19 · ' + place(esc.stage), 240, 28, '#ffffff', 'center', 9);
    txt('SAIR', 470, 8, '#8f8c9e', 'right', 8);

    for (var i = 0; i < esc.lista.length; i++) {
      var who = esc.lista[i];
      var col = i < 10 ? 0 : 1;
      var row = col === 0 ? (9 - i) : (18 - i);
      var x = col === 0 ? 30 : 250, y = 42 + row * 18, bw = 200, bh = 16;
      ctx.save();
      var vencido = i < esc.degrau;
      var atual = i === esc.degrau;
      if (vencido) ctx.globalAlpha = 0.35;
      panel(x, y, bw, bh, atual ? '#2b1424' : '#140f1a');
      if (atual && Math.floor(time * 4) % 2) {
        ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 1; ctx.strokeRect(x - 1, y - 1, bw + 2, bh + 2);
      }
      drawRetrato(ctx, who, x + 2, y - 6, 14);
      var prefix = (i + 1) < 10 ? '0' + (i + 1) : (i + 1);
      txt(prefix + '. ' + NAMES[who], x + 22, y + 3, atual ? '#ffd34d' : vencido ? '#8a8596' : '#ffffff', 'left', 5);
      if (vencido) txt('VENCIDO', x + bw - 6, y + 3, '#7dff8a', 'right', 4);
      else if (atual) txt('LUTAR', x + bw - 6, y + 3, '#ffd34d', 'right', 4);
      ctx.restore();
    }
    var foe = escaladaFoe();
    txt(NAMES[esc.who] + '   VS   ' + (foe ? NAMES[foe] : '?'), 240, 238, '#ffffff', 'center', 10);
  }
  function drawEscalada() {
    if (!esc) return;
    if (esc.fim === 'campeao') {
      if (window.EscaladaVisual && EscaladaVisual.campeao) {
        EscaladaVisual.campeao(ctx, W, H, {
          who: esc.who,
          t: esc.t,
          nome: NAMES[esc.who],
          big: escBig,
          cenario: escCenario(4)
        });
      } else {
        var bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#100a20'); bg.addColorStop(1, '#2c0e18');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        var cols2 = ['#ffd34d', '#e8323c', '#7dff8a', '#5ac8ff', '#ffffff'];
        for (var k = 0; k < 50; k++) {
          ctx.fillStyle = cols2[k % 5];
          ctx.fillRect((k * 53 + esc.t * 30 * (1 + k % 3)) % W, (k * 97 + esc.t * 60 * (1 + k % 2)) % H, 3, 3);
        }
        txt('CAMPEÃO DA ESCALADA!', 240, 26, '#ffe066', 'center', 16);
        if (!(window.Rig && window.Rig.big(ctx, esc.who, 'victory', esc.t, 240, 206, 1, 2))) {
          spr('drawChibi', ctx, esc.who, 'victory', esc.t, 240, 206, 1, {});
        }
        txt(NAMES[esc.who], 240, 214, '#ffffff', 'center', 12);
        if (esc.t > 1.5 && Math.floor(time * 2) % 2) txt('ENTER: MENU', 240, 250, '#8f8c9e', 'center');
      }
      return;
    }
    if (esc.fim === 'derrota') {
      if (window.EscaladaVisual && EscaladaVisual.derrota) {
        EscaladaVisual.derrota(ctx, W, H, { degrau: esc.degrau, t: esc.t, who: esc.who, nome: NAMES[esc.who], recorde: getEscaladaRecord(esc.who), big: escBig, cenario: escCenario(esc.stage) });
      } else {
        var bg2 = ctx.createLinearGradient(0, 0, 0, H); bg2.addColorStop(0, '#1a0508'); bg2.addColorStop(1, '#0b0204');
        ctx.fillStyle = bg2; ctx.fillRect(0, 0, W, H);
        txt('FIM DA ESCALADA', 240, 60, '#ff4d4d', 'center', 18);
        txt('DEGRAU ALCANÇADO: ' + esc.degrau + ' / 19', 240, 110, '#ffd34d', 'center', 14);
        txt(NAMES[esc.who], 240, 140, '#ffffff', 'center', 12);
        var record = getEscaladaRecord(esc.who);
        txt('RECORDE: ' + record + ' / 19', 240, 165, '#8f8c9e', 'center', 10);
        if (esc.t > 1.5 && Math.floor(time * 2) % 2) txt('ENTER: MENU', 240, 230, '#8f8c9e', 'center');
      }
      return;
    }
    if (esc.subindo && window.EscaladaVisual && EscaladaVisual.subida) {
      EscaladaVisual.subida(ctx, W, H, {
        lista: esc.lista,
        degrau: esc.degrau,
        t: esc.subidaT,
        lutador: esc.who,
        nomes: NAMES,
        retrato: drawRetrato,
        big: escBig,
        cenario: escCenario(esc.stage),
        cenarioNome: place(esc.stage),
        recorde: getEscaladaRecord(esc.who),
        pronto: escaladaReady(esc),
        quit: esc.quitT > 0
      });
      return;
    }
    if (window.EscaladaVisual && EscaladaVisual.torre) {
      EscaladaVisual.torre(ctx, W, H, {
        lista: esc.lista,
        degrau: esc.degrau,
        t: esc.t,
        lutador: esc.who,
        nomes: NAMES,
        retrato: drawRetrato,
        big: escBig,
        cenario: escCenario(esc.stage),
        cenarioNome: place(esc.stage),
        recorde: getEscaladaRecord(esc.who),
        pronto: escaladaReady(esc),
        quit: esc.quitT > 0
      });
    } else {
      drawSimpleTorre();
    }
    if (window.EscaladaVisual) return;
    if (esc.quitT > 0) txt('ESC DE NOVO PARA SAIR DA ESCALADA', 240, 256, '#ff6b6b', 'center');
    else if (Math.floor(time * 2) % 2) {
      txt(escaladaReady(esc) ? 'ENTER: LUTAR' : 'CARREGANDO...', 240, 256, '#8f8c9e', 'center');
    }
  }
  function updateEscalada(dt) {
    if (!esc) { scene = 'menu'; return; }
    esc.t += dt; esc.quitT -= dt; playSong('rua');
    var ok = menuKey('ok') || escTap === 'ok', back = menuKey('back') || escTap === 'back';
    escTap = null;
    if (esc.fim) {
      if (esc.t > 1.5 && (ok || back)) { esc = null; scene = 'menu'; sfx('menu'); return; }
    } else if (esc.subindo) {
      esc.subidaT += dt;
      if (esc.subidaT >= 1.2 || (ok && esc.subidaT > 0.3)) {
        esc.subindo = false;
        esc.subidaT = 0;
        esc.t = 0;
      }
    } else if (back) {
      if (esc.quitT > 0) { esc = null; scene = 'menu'; sfx('menu'); return; }
      esc.quitT = 2; sfx('block');
    } else if (ok && esc.t > 0.4 && escaladaReady(esc)) {
      sfx('boss_roar');
      vsStage = esc.stage || randomStage();
      var diff = 0.05 + (esc.degrau / 18) * 1.1;
      var foe = esc.lista[esc.degrau];
      startTeam([{ who: esc.who, ctl: 0 }, { who: foe, ctl: null, difficulty: diff }], false, true);
      return;
    }
    drawEscalada();
  }
  function fire(y0, h, phase) {   // labaredas pixeladas ao pé da tela
    for (var x = 0; x < W; x += 4) {
      var f = h * (0.55 + 0.45 * Math.sin(x * 0.09 + time * 7 + phase) * Math.sin(x * 0.031 - time * 3));
      ctx.fillStyle = '#7a0d0d'; ctx.fillRect(x, y0 - f, 4, f);
      ctx.fillStyle = '#d4380f'; ctx.fillRect(x, y0 - f * 0.7, 4, f * 0.7);
      ctx.fillStyle = '#ffb02e'; ctx.fillRect(x, y0 - f * 0.35, 4, f * 0.35);
    }
  }
  function drawSelect() {
    var g0 = ctx.createLinearGradient(0, 0, 0, H);
    g0.addColorStop(0, '#0a0204'); g0.addColorStop(0.6, '#2a0606'); g0.addColorStop(1, '#4a0c06');
    ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
    fire(H, 46, 0);
    ctx.globalAlpha = 0.08; ctx.fillStyle = '#fff';   // pedra rachada ao fundo
    for (var b = 0; b < 12; b++) ctx.fillRect((b * 97) % W, 30 + (b * 53) % 150, 40 + (b * 31) % 50, 1);
    ctx.globalAlpha = 1;
    if (sel.vsT >= 0) { drawVs(); return; }
    txt('ESCOLHA SEU LUTADOR', 240, 8, '#ffcc33', 'center', 16);
    // grade central
    var layout=selectLayout(), ROWS=layout.rows, GP=layout.gap, TW=layout.tile, gx=layout.x;
    ROSTER.forEach(function (r, i) {
      var tile=layout.tiles[i],x=tile.x,gy=tile.y;
      ctx.fillStyle = '#120808'; ctx.fillRect(x - 2, gy - 2, TW + 4, TW + 4);
      var gt = ctx.createLinearGradient(0, gy, 0, gy + TW); gt.addColorStop(0, '#5a1a12'); gt.addColorStop(1, '#22090a');
      ctx.fillStyle = gt; ctx.fillRect(x, gy, TW, TW);
      if (r) {
        ctx.save(); ctx.translate(x + 2, gy + 2); ctx.scale(TW / 30, TW / 30); spr('drawPortrait', ctx, r.who, 0, 0); ctx.restore();
        if (sel.ai.indexOf(r.who) >= 0) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, gy + TW - 10, TW, 10); txt(sel.vs ? 'CPU' : 'IA', x + TW / 2, gy + TW - 9, '#9fd8ff', 'center'); }
      } else { txt('?', x + TW / 2, gy + 14, '#6a3a30', 'center', 24); txt('EM', x + TW / 2, gy + 34, '#8a5a50', 'center'); txt('BREVE', x + TW / 2, gy + 42, '#8a5a50', 'center'); }
      // molduras dos cursores (piscam; cada jogador tem sua cor)
      sel.slots.forEach(function (s, k) {
        var mine = s.lock && pickOf(s) === i, here = s.cur === i;
        if (!s.on || (!mine && !here)) return;
        if (!mine && Math.floor(sel.t * 6 + k) % 2) return;
        ctx.strokeStyle = PCOL[k]; ctx.lineWidth = mine ? 3 : 2; var d = 1 + k * 2;
        ctx.strokeRect(x - d, gy - d, TW + d * 2, TW + d * 2);
        txt('P' + (k + 1), x + 1 + (k % 2) * (TW - 16), gy + 1 + Math.floor(k / 2) * 9, PCOL[k]);
      });
    });
    // lutadores grandes: P1 à esquerda, P2 à direita, P3/P4 menores no meio; nome e golpe na base
    var spots = [[78, 236, 1.75, 1], [402, 236, 1.75, -1], [196, 246, 1.15, 1], [284, 246, 1.15, -1]];
    var waiting = [];
    sel.slots.forEach(function (s, k) {
      var sp = spots[k], r = ROSTER[pickOf(s)];
      if (!s.on) { if (sel.vs && k > 1) return; if (k < 2 || pads.some(function(pd){return pd.on&&pd.slot===k;})) waiting.push('P' + (k + 1) + (k < 2 ? ': ATACAR P/ ENTRAR' : ': START P/ ENTRAR')); return; }
      if (!r) { txt('?', sp[0], sp[1] - 70, '#6a3a30', 'center', 24); return; }
      ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = PCOL[k]; ctx.beginPath(); ctx.ellipse(sp[0], sp[1], 30 * sp[2], 6 * sp[2], 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      var st = s.lock ? 'victory' : 'idle';
      if (!(window.Rig && window.Rig.big(ctx, r.who, st, sel.t, sp[0], sp[1], sp[3], sp[2]))) spr('drawChibi', ctx, r.who, st, sel.t, sp[0], sp[1], sp[3], {});
      txt(NAMES[r.who], sp[0], 244, s.lock ? '#ffe066' : '#fff', 'center');
      txt(s.lock ? 'PRONTO!' : k < 2 ? r.job : 'P' + (k + 1), sp[0], 256, PCOL[k], 'center');
      if (selTaken(r.who, k) && !s.lock) txt('JA ESCOLHIDO', sp[0], 232, '#ff5050', 'center');
    });
    sel.ai.forEach(function (w, k) {
      var ax = 150 + k * 60;
      if (sel.vs) { ax = 402; if (!(window.Rig && window.Rig.big(ctx, w, 'idle', sel.t, ax, 236, -1, 1.75))) spr('drawChibi', ctx, w, 'idle', sel.t, ax, 236, -1, {}); txt(NAMES[w], ax, 244, '#ffe066', 'center'); txt('CPU', ax, 256, '#9fd8ff', 'center'); return; }
      ax = [140, 178, 302, 340][k]; if (ax == null) return;
      if (!(window.Rig && window.Rig.big(ctx, w, 'idle', sel.t + k, ax, 262, 1, 0.6))) spr('drawChibi', ctx, w, 'idle', sel.t, ax, 262, 1, {});
      txt('IA', ax, 262, '#9fd8ff', 'center');
    });
    var T0 = 24 + ROWS * (TW + GP) + 2;   // textos logo abaixo da grade (cresce com o elenco)
    var r1 = ROSTER[sel.slots[0].cur], onGo = sel.slots[0].lock && sel.slots[0].cur === ROSTER.length;
    if (onGo) txt('TUDO PRONTO? CONFIRME EM INICIAR', 240, T0, '#ffe066', 'center');
    else if (r1) { txt('ARMA: ' + r1.arma, 240, T0, '#d8c8b0', 'center'); txt('ESPECIAL: ' + r1.esp, 240, T0 + 10, '#ffb02e', 'center'); }
    else txt('NOVO PERSONAGEM EM BREVE', 240, T0, '#8a5a50', 'center');
    var team = selTeam(), ready = sel.slots[0].lock;
    txt(sel.vs ? 'X1: ' + team.length + '/2' : 'TIME: ' + team.length + '/4', 240, T0 + 20, '#fff', 'center');
    txt(ready ? (sel.vs ? 'CONFIRME NO ADVERSARIO (CPU) OU P2 ENTRA' : 'QUER COMPANHEIROS? CONFIRME NELES') : 'CONFIRMAR: ESCOLHE SEU PERSONAGEM', 240, T0 + 30, '#9fd8ff', 'center');
    txt(ready ? 'K DESFAZ    L INICIA OU TOQUE EM INICIAR' : 'K VOLTA', 240, T0 + 39, '#9fd8ff', 'center');
    if (waiting.length) txt(waiting.join('   '), 240, T0 + 48, '#cfcfcf', 'center');
    else if (!sel.vs) txt('CONTROLE: START ENTRA APOS ESCOLHER NO TECLADO', 240, T0 + 48, '#8a7a70', 'center');
    if (sel.msgT > 0) { sel.msgT -= 1 / 60; txt(sel.msg, 240, T0 + 57, '#ff5050', 'center'); }
    if (ready) {   // botão INICIAR: a última casa do cursor depois de escolher o personagem
      var gl = onGo && Math.floor(sel.t * 4) % 2;
      panel(186, T0 + 65, 108, 17, onGo ? (gl ? '#ffe066' : '#ffb02e') : '#3a2630', onGo ? '#ffffff' : '#8a5a50');
      txt('INICIAR', 240, T0 + 70, onGo ? '#1a0a06' : '#cfcfcf', 'center', 8);
      if (onGo) { txt('>', 176 - (gl ? 2 : 0), T0 + 70, '#ffe066', 'left'); txt('<', 298 + (gl ? 2 : 0), T0 + 70, '#ffe066', 'left'); }
    }
  }
  function drawVs() {   // apresentação do time antes da fase
    var team = selTeam(), u = Math.min(1, sel.vsT / 0.4);
    txt(sel.vs ? 'X1' : 'FASE ' + menuStage, 240, 6, '#ffcc33', 'center', 16);
    txt(place(selStage()), 240, 26, '#fff', 'center');
    team.forEach(function (m, i) {
      var x = 240 + (i - (team.length - 1) / 2) * 100 - (1 - u) * 300 * (i % 2 ? -1 : 1);
      if (!(window.Rig && window.Rig.big(ctx, m.who, 'victory', sel.vsT + i * 0.3, x, 200, sel.vs&&i===1?-1:1, 1.5))) spr('drawChibi', ctx, m.who, 'victory', sel.vsT, x, 200, sel.vs&&i===1?-1:1, {});
      txt(NAMES[m.who], x, 208, m.ctl == null ? '#9fd8ff' : PCOL[m.ctl], 'center');
      txt(m.ctl == null ? 'IA' : 'P' + (m.ctl + 1), x, 220, m.ctl == null ? '#9fd8ff' : PCOL[m.ctl], 'center');
    });
    var z = 1 + Math.max(0, 0.5 - sel.vsT) * 4;
    ctx.save(); ctx.translate(240, 54); ctx.scale(z, z); txt('VS', 0, -12, '#ff3b3b', 'center', 24); ctx.restore();
    if (sel.vsT > 2.2 && Math.floor(sel.vsT * 2) % 2) {
      if (!stageReady(selStage())) txt('CARREGANDO CENARIO...', 240, 236, '#8f8c9e', 'center');
      else if (window.Rig && !team.every(function (m) { return window.Rig.ready(m.who); }))
        txt('CARREGANDO PERSONAGENS...', 240, 236, '#8f8c9e', 'center');
    }
    txt('Deus, fé e muita resenha', 240, 70, '#ffb02e', 'center');
  }
  function keycap(x, y, label, w) {   // tecla desenhada (canto chanfrado, sombra embaixo)
    w = w || 14;
    panel(x, y + 2, w, 13, '#1a1824'); panel(x, y, w, 13, '#e9e6f2'); ctx.fillStyle = '#c9c4d6'; ctx.fillRect(x + 2, y + 10, w - 4, 2);
    ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#1a1824'; ctx.fillText(label, x + w / 2 + 0.5, y + 3);   // texto liso (sem o contorno do txt)
  }
  function drawControls(foot) {   // tutorial dos botões do teclado
    ctx.fillStyle = 'rgba(8,6,14,0.88)'; ctx.fillRect(0, 0, W, H);
    txt('CONTROLES DO TECLADO', 240, 12, '#ffffff', 'center', 16);
    ctx.fillStyle = '#e8323c'; ctx.fillRect(140, 32, 200, 2);
    function tag(code){var symbols={ArrowUp:'^',ArrowDown:'v',ArrowLeft:'<',ArrowRight:'>',Comma:',',Period:'.',Slash:'/',Semicolon:';',Quote:"'",BracketLeft:'[',BracketRight:']',Backslash:'\\',Minus:'-',Equal:'=',Backquote:'`'};return symbols[code]||code.replace(/^Key/,'').replace(/^Digit/,'').replace(/^Numpad/,'N');}
    var cols=activeBinds().map(function(b,i){return {x:i?252:24,t:'JOGADOR '+(i+1),c:PCOL[i],mv:['up','left','down','right'].map(function(k){return tag(b[k][0]);}),k:[['atk','ATAQUE 1'],['jump','PULAR'],['alt','ATAQUE 2'],['spc','ESPECIAL'],['use','DEFESA / GATO']].concat(zoaOn()?[['taunt','PROVOCAÇÃO']]:[]).map(function(k){return [tag(b[k[0]][0]),k[1]];})};});
    cols.forEach(function (c) {
      panel(c.x, 42, 204, 168, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.15)');
      txt(c.t, c.x + 102, 48, c.c, 'center');
      keycap(c.x + 33, 64, c.mv[0]); keycap(c.x + 17, 80, c.mv[1]); keycap(c.x + 33, 80, c.mv[2]); keycap(c.x + 49, 80, c.mv[3]);
      txt('ANDAR', c.x + 120, 76, '#c9c4d6', 'center');
      c.k.forEach(function (k, i) { keycap(c.x + 14, 101 + i * 17, k[0],24); txt(k[1], c.x + 46, 104 + i * 17, i === 3 ? '#7fe8ff' : '#e9e6f2'); });
    });
    txt('ESPECIAL: QUANDO A BARRA AZUL ENCHER', 240, 214, '#7fe8ff', 'center');
    txt('A / X: ATK1  X / QUADRADO: ATK2  B / O: PULO', 240, 225, '#8f8c9e', 'center');
    txt('Y / TRIANGULO: ESPECIAL  LB/RB: DEFESA  START: PAUSA', 240, 237, '#8f8c9e', 'center');
    if (Math.floor(time * 1.6) % 2) txt(foot || 'ENTER: VOLTAR', 240, 248, '#ffd34d', 'center');
  }
  function drawConfig() {
    if(window.CreiaSettings)return;
    ctx.fillStyle = 'rgba(8,6,14,0.86)'; ctx.fillRect(0, 0, W, H);
    txt('CONFIGURAÇÕES', 240, 40, '#ffffff', 'center', 16);
    ctx.fillStyle = '#e8323c'; ctx.fillRect(160, 60, 160, 2);
    var opts = [['MUSICA', saved.music !== false], ['EFEITOS SONOROS', saved.sfx !== false], ['VOLTAR', null]];
    var px = 120, py = 84, pw = 240;
    panel(px, py, pw, 92, 'rgba(12,10,18,0.85)', 'rgba(255,255,255,0.18)');
    ctx.fillStyle = '#e8323c'; ctx.fillRect(px + 2, py, pw - 4, 3);
    opts.forEach(function (o, i) {
      var on = i === cfgSel, ry = py + 14 + i * 26;
      if (on) panel(px + 10, ry - 5, pw - 20, 19, 'rgba(232,50,60,0.9)');
      if (o[1] === null) { txt(o[0], 240, ry + 1, on ? '#ffffff' : '#9a98a8', 'center'); return; }
      txt(o[0], px + 22, ry + 1, on ? '#ffffff' : '#c9c4d6', 'left');
      panel(px + pw - 72, ry - 3, 50, 15, o[1] ? '#2fae5a' : '#4a4658');   // chave liga/desliga
      txt(o[1] ? 'LIGADO' : 'DESLIG.', px + pw - 47, ry + 1, '#ffffff', 'center');
    });
    txt('ENTER LIGA/DESLIGA    ESC VOLTA', 240, 196, '#8f8c9e', 'center');
  }
  function updateConfig() {   // devolve true quando é para sair
    if(window.CreiaSettings)return false;
    if (menuKey('up') || menuKey('down')) { cfgSel = (cfgSel + (menuKey('up') ? 2 : 1)) % 3; sfx('menu'); }
    var flip = menuKey('ok') || menuKey('left') || menuKey('right');
    if (menuKey('back') || (cfgSel === 2 && menuKey('ok'))) { save(); sfx('menu'); return true; }
    if (flip && cfgSel === 0) { saved.music = saved.music === false; save(); if (saved.music) mus.next = 0; }
    if (flip && cfgSel === 1) { saved.sfx = saved.sfx === false; save(); sfx('select'); }
    return false;
  }
  function drawPause() {
    ctx.fillStyle = 'rgba(8,6,14,0.72)'; ctx.fillRect(0, 0, W, H);
    txt('PAUSA', 240, 62, '#ffffff', 'center', 24);
    var opts = ['CONTINUAR', 'CONTROLES', 'CONFIGURAÇÕES', 'VOLTAR AO MENU'], px = 150, py = 96, pw = 180;
    panel(px, py, pw, 108, 'rgba(12,10,18,0.85)', 'rgba(255,255,255,0.18)');
    ctx.fillStyle = '#e8323c'; ctx.fillRect(px + 2, py, pw - 4, 3);
    opts.forEach(function (o, i) {
      var on = i === pauseSel, ry = py + 12 + i * 24;
      if (on) panel(px + 10, ry - 4, pw - 20, 18, '#e8323c');
      txt(o, 240, ry + 1, on ? '#ffffff' : '#9a98a8', 'center');
    });
    txt('ENTER CONFIRMA    P CONTINUA', 240, 214, '#8f8c9e', 'center');
  }
  function updatePause() {
    if (menuKey('up') || menuKey('down')) { pauseSel = (pauseSel + (menuKey('up') ? 3 : 1)) % 4; sfx('menu'); }
    if (menuKey('ok')) {
      sfx('select');
      if (pauseSel === 0) paused = false;
      else if (pauseSel === 1) showCtl = true;
      else if (pauseSel === 2) { showCfg = true; cfgSel = 0; }
      else { paused = false; menuSel = 0; save();
        esc = null;
        if (online && online.host) onlineExit();
        else {
          versus = false; vsRound = null; scene = tour ? 'tour' : 'menu';
        }
      }
    }
  }
  function drawOverlay(title, lines, col) {
    ctx.fillStyle = 'rgba(11,10,16,0.65)'; ctx.fillRect(0, 0, W, H);
    txt(title, 240, 90, col, 'center', 16);
    lines.forEach(function (l, i) { txt(l, 240, 124 + i * 14, '#fff', 'center'); });
  }

  var uiBridge={
    menu:activateMenu,
    coop:function(action,value){coopAction(action,value);},
    menuFocus:function(index){menuSel=index;},
    adventureFocus:function(index){if(scene==='adventuremenu'&&(index===0||index===1))adventureSel=index;},
    adventureGo:adventureGo,
    adventureOpt:function(value){if(scene==='adventuremenu'&&(value===0||value===1))adventureOpt=value;},
    x1Focus:function(index){x1Sel=index;},
    x1Go:function(index){if(index>=0&&index<X1_CARDS.length)x1Go(index);},
    x1Opt:function(card,opt){if(card==='online'&&(opt===0||opt===1))x1Opt.online=opt;else if(card==='torneio'&&opt>=0&&opt<TOUR_SIZES.length)x1Opt.torneio=opt;},
    cenario:function(g,s){if(!stageReady(s))return false;bg('draw',g,s,CAM_MAX,time);return true;},   // arena real para a arte dos cartões
    back:function(){if(scene==='onlineSelect'||scene==='coopSetup'){onlineExit();return;}if(scene==='select')scene=sel&&(sel.vs||sel.tour||sel.escalada)?'x1menu':'adventuremenu';else scene='menu';},
    hover:function(index){if(scene==='onlineSelect'&&online&&!online.choice&&index>=0&&index<ROSTER.length){online.cur=index;return;}if(scene==='select'&&sel&&sel.vsT<0&&index>=0&&index<ROSTER.length)sel.slots[0].cur=index;},
    pick:function(index){if(scene==='onlineSelect'&&online&&!online.choice&&(!online.host||online.peerReady)&&index>=0&&index<ROSTER.length){online.pick=index;audio();return;}if(scene==='select'&&sel&&sel.vsT<0){sel.click=index;audio();}},
    sortTourRest:sortTourRest,
    undo:function(){if(!sel)return;if(sel.ai.length)sel.ai.pop();else if(sel.slots[0].lock){sel.slots[0].lock=false;sel.slots[0].cur=sel.slots[0].pick;sel.slots[0].pick=null;}},
    mode:function(mode){if(['pve','pvp','eve'].indexOf(mode)>=0)localVs.mode=mode;},
    level:function(side,level){if((side===0||side===1)&&['facil','medio','dificil'].indexOf(level)>=0)localVs.levels[side]=level;},
    x1:function(index){x1Sel=index;if(index===0)openSelect(true);else if(index>=3&&index<=4)openSelect(false,index===3?4:8);else if(index===5||index==='escalada')openSelect(false,0,true);else if(index===1){scene='onlineWait';window.BanguOnline.create();}else window.BanguOnline.askText('CÓDIGO DA SALA',5).then(function(code){if(code){scene='onlineWait';window.BanguOnline.join(code);}});}
  };
  function modernUIState(){
    var roster=ROSTER.map(function(r){return {who:r.who,name:NAMES[r.who],job:r.job,special:r.esp};});
    var shown=players;
    if(scene==='onlinePlay'&&online&&online.snapshots.length)shown=online.snapshots[online.snapshots.length-1].state.players;
    var selection=sel?{cursor:sel.slots[0].cur,locked:sel.slots[0].lock,team:selTeam(),vs:sel.vs,tour:sel.tour,escalada:sel.escalada,transition:sel.vsT>=0,message:sel.msgT>0?sel.msg:'',slots:sel.slots}:null;
    if(scene==='onlineSelect'&&online){
      var picked=ROSTER.findIndex(function(r){return r.who===online.choice;}),team=[];
      if(online.choice)team.push({who:online.choice,ctl:online.host?0:1});if(online.other)team.push({who:online.other,ctl:online.host?1:0});
      selection={online:true,localCtl:online.host?0:1,blocked:online.host&&!online.peerReady,code:online.code,cursor:online.cur,locked:!!online.choice,team:team,vs:true,transition:false,
        message:onlineNoticeT>0?onlineNotice:online.host&&!online.peerReady?'Aguardando adversário na sala '+online.code:online.choice?'Escolha confirmada. Aguardando o rival...':'Confirme seu lutador.',slots:[{pick:picked<0?0:picked}]};
    }
    return {adventure:{card:adventureSel,online:adventureOpt},coop:online&&online.coop?{host:online.host,stage:online.stage,place:place(online.stage),allies:online.allies,cursor:coopSetupSel,choice:online.choice,other:online.other,code:online.code}:null,scene:scene,combat:versus?'x1':'adventure',cinematic:cinematicActive(),gamepads:pads.map(function(pd){return {player:pd.slot+1,connected:pd.on,name:pd.name};}),time:time,menu:menuSel,stage:menuStage,best:saved.best,place:place(menuStage),roster:roster,x1:x1Sel,x1Opt:{online:x1Opt.online,torneio:x1Opt.torneio},tourSizes:TOUR_SIZES,local:localVs,paused:paused||!!cine,
      selection:selection,
      players:shown.map(function(p){var a=ATK[p.who]&&ATK[p.who][p.state];return {who:p.who,name:NAMES[p.who],ai:p.ai,ctl:p.ctl,dead:p.dead,state:p.state,
        primary:Math.max(0,p.cd||0,a&&a.dur?a.dur*(p.attackCdMult||1)-p.st:0),secondary:Math.max(0,p.altCd||0),returning:!!p.micOut,
        special:p.sp||0,active:Math.max(p.shield||0,p.turbo||0,p.limadoT||0),locked:p.spLocked};})};
  }

  // ---------- Laço principal ----------
  function cinematicActive(){
    if(cine)return true;
    var r=vsRound;
    if(scene==='onlinePlay'&&online&&online.snapshots.length){
      var remote=online.snapshots[online.snapshots.length-1].state;
      if(remote.cine)return true;
      r=remote.round;
    }
    return !!(versus&&r&&(r.phase==='culto'||r.phase==='intro'&&r.contagem||r.phase==='match'&&r.t<CULTO_FIM));
  }
  var viradaFx=[],combatVisualVisible=false,combatVisualTime=0;
  function resetCombatVisuals(){
    viradaFx=[];combatVisualTime=0;
    if(window.DefesaVisual&&DefesaVisual.reset)DefesaVisual.reset();
  }
  function updateCombatVisuals(dt){
    combatVisualTime+=dt;
    if(dt>0&&window.DefesaVisual&&DefesaVisual.update)DefesaVisual.update(dt);
    players.forEach(function(p,i){
      var fx=viradaFx[i];
      if(!fx||fx.who!==p.who)fx=viradaFx[i]={who:p.who,forca:0,avisada:false,entrada:-1};
      if(fx.entrada>=0)fx.entrada+=dt;
      if(p.viradaAvisada&&!fx.avisada){fx.avisada=true;fx.entrada=0;}
      // A borda leva 0,3 s para acender e apagar, sem alterar o estado do combate.
      fx.forca=clamp(fx.forca+(p.virada&&!p.dead?1:-1)*dt/.3,0,1);
    });
  }
  function drawViradaVisual(){
    if(!window.ViradaVisual)return;
    var left=0,right=0,all=0,entry=-1;
    players.forEach(function(p,i){
      var fx=viradaFx[i];if(!fx||!versus&&p.ai)return;
      if(versus){if(p.x-cam<W/2)left=Math.max(left,fx.forca);else right=Math.max(right,fx.forca);}
      else all=Math.max(all,fx.forca);
      if(fx.entrada>=0&&fx.entrada<.8&&(entry<0||fx.entrada<entry))entry=fx.entrada;
    });
    if(all>0)ViradaVisual.draw(ctx,W,H,{t:combatVisualTime,lado:'tudo',forca:all});
    if(left>0)ViradaVisual.draw(ctx,W,H,{t:combatVisualTime,lado:'esquerda',forca:left});
    if(right>0)ViradaVisual.draw(ctx,W,H,{t:combatVisualTime,lado:'direita',forca:right});
    if(entry>=0)ViradaVisual.entrada(ctx,W,H,entry);
  }
  function drawCombatScreen(){
    var dt=arguments[0]||0,remoteFreeze=!!arguments[1];
    combatVisualVisible=scene==='play'&&!paused&&!showCtl&&!showCfg&&!onlineHeld()&&!cine&&!remoteFreeze&&!specialHighlight();
    if(combatVisualVisible)updateCombatVisuals(dt||0);
    drawWorld();
    if(!versus&&window.SegundaForma)bosses.forEach(function(b){if(!b.dead&&b.transT>0)SegundaForma.letreiro(ctx,W,H,b,Math.round(b.x-cam),Math.round(b.y-b.z),time);});   // cena da 2ª forma
    if(combatVisualVisible)drawViradaVisual();
    combatVisualVisible=false;
    if(cine){
      ctx.fillStyle='#0b0a10';ctx.fillRect(0,0,W,H);
    }else{
      if(bossIntro&&bossIntro.t>1.4)drawBossIntro();else drawHUD();
      drawTaunts();
      if(versus)drawVersusOverlay(vsRound,players);
    }
    drawCine();
  }
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000));
    last = now;
    audioLevels();
    if(window.FidelisAudio && ((scene!=='play' && scene!=='onlinePlay')||paused||onlineHeld()))FidelisAudio.stop();
    if(window.BanguOnline && BanguOnline.tick)BanguOnline.tick(now);
    ctx.setTransform(R, 0, 0, R, 0, 0); ctx.imageSmoothingEnabled = false;
    pollPads();
    if((pressed.size||pads.some(function(pd){return Object.keys(pd.hit).some(function(k){return pd.hit[k];});}))&&pularCulto()){
      // P/Esc/Start continuam disponíveis para pausar; ações de combate não vazam para a luta.
      var pauseKey=anyPressed(['KeyP','Escape']),muteKey=anyPressed(['KeyM']),padStart=pads.some(function(pd){return pd.hit.start;});
      pressed.clear();physicalPressed.clear();touchPressed.clear();pads.forEach(function(pd){pd.hit={};});
      if(pauseKey||padStart)pressed.add('KeyP');if(muteKey)pressed.add('KeyM');
    }
    if (anyPressed(['KeyM'])) { muted = !muted; if (!muted) mus.next = 0; }
    if (scene === 'play' && !showCtl && !showCfg && !(online&&online.result!==undefined) && (anyPressed(['KeyP']) || anyPressed(['Escape']) || pads.some(function(pd){return pd.hit.start;}))) { paused = !paused; pauseSel = 0;pads.forEach(function(pd){if(pd.hit.start)pd.hit.ok=false;}); }
    else if (scene === 'play' && showCtl && (menuKey('ok') || anyPressed(['Escape', 'KeyP']))) {
      showCtl = false; if (!saved.tut) { saved.tut = true; save(); paused = false; } pressed.clear();
    }
    if (!paused && !onlineHeld()) time += dt;

    if(joy.on&&(scene==='select'||scene==='onlineSelect')){joy.menuWait=(joy.menuWait||0)-dt;if(joy.menuWait<=0&&(Math.abs(joy.x)>.45||Math.abs(joy.y)>.45)){pressed.add(Math.abs(joy.x)>Math.abs(joy.y)?joy.x>0?'KeyD':'KeyA':joy.y>0?'KeyS':'KeyW');joy.menuWait=.18;}}
    if (onlineNoticeT>0) onlineNoticeT-=dt;
    if (scene === 'menu') { updateMenu(); updateCommon(dt); drawMenu(); playSong('rua'); }
    else if(scene==='adventuremenu')updateAdventureMenu();
    else if(scene==='coopSetup')updateCoopSetup();
    else if (scene === 'x1menu') updateX1Menu();
    else if (scene === 'onlineWait') { drawSimpleMenu('CONECTANDO...',['AGUARDE'],0); if (menuKey('back')) onlineExit(); }
    else if (scene === 'onlineSelect') updateOnlineSelect(dt);
    else if (scene === 'onlinePlay') drawOnlineGuest(dt);
    else if (scene === 'ranking') { drawRanking(); if (menuKey('back') || menuKey('ok')) scene='menu'; }
    else if (scene === 'tour') updateTour(dt);
    else if (scene === 'escalada') updateEscalada(dt);
    else if (scene === 'stagesel') updateStageSel(dt);
    else if (scene === 'select') { updateSelect(dt); if (scene === 'select') drawSelect(); playSong('rua'); }
    else if (scene === 'config') { drawMenu(); drawConfig(); if (updateConfig()) scene = 'menu'; }
    else if (scene === 'controls') { time += 0; drawMenu(); drawControls(); if (menuKey('ok') || menuKey('back')) { scene = 'menu'; sfx('menu'); } }
    else if (scene === 'play') {
      var visualDt=0;
      if (!paused && !onlineHeld()) {
        var sp = specialHighlight();
        if(!online&&!cine&&hitPause>0){hitPause=Math.max(0,hitPause-dt);updateCommon(dt);}
        else if (cine) { cine.t += dt; if (cine.t >= cineDuration(cine.p)) cine = null; updateCommon(dt); }
        else if (sp) {
          sp.st += dt; sp.inv = Math.max(0, sp.inv - dt);
          updateSpecial(sp, dt);
          updateCommon(dt);
        } else { var kf = kissFocus(), wdt = kf ? dt * (1 - 0.6 * kf.k) : dt; updatePlay(wdt); updateCommon(wdt); visualDt=wdt; }
      }
      drawCombatScreen(visualDt);
      if (onlineHeld()) drawReconnect();
      if (online && online.host && (versus||online.coop)) { online.snapT+=dt;
        var interval=online.coop?1/window.CreiaCombat.coop.snapshotHz:1/30;
        if (online.snapT>=interval-0.000001) { online.snapT=Math.max(0,online.snapT-interval); window.BanguOnline.send({type:'snapshot',state:online.coop?adventureSnapshot():onlineSnapshot()}); }
      }
      if (showCfg) { drawConfig(); if (updateConfig()) showCfg = false; }
      else if (showCtl) drawControls(saved.tut ? 'ENTER: VOLTAR' : 'ENTER: COMECAR!');
      else if (paused) { updatePause(); if (scene === 'play' && paused && !showCtl) drawPause(); }
    } else if (scene === 'gameover') {
      updateCommon(dt); drawWorld(); drawHUD();
      drawOverlay('GAME OVER', ['PONTOS '+pad(score),scorePending?'REGISTRANDO NO RANKING...':'ENTER: RANKING'], '#ff4d4d');
      if (!scorePending && (menuKey('ok') || menuKey('back'))) { if(window.BanguOnline)maybeSubmitScore();else {scene='menu';menuStage=1;} }
    } else if (scene === 'ending') {
      overT += dt; updateCommon(dt);
      players.forEach(function (p) { if (p.state !== 'victory') setState(p, 'victory'); p.st += dt; });
      if (Math.random() < 0.2) burst('coracao', cam + rnd(40, 440), rnd(180, 250), 40, 1);
      drawWorld();
      drawOverlay('CREIA FIGHT: VITÓRIA!', ['O Imperador Podrão caiu.', 'O time venceu!', 'Deus, fé e muita resenha', 'PONTOS ' + pad(score), scorePending?'REGISTRANDO NO RANKING...':'ENTER: RANKING'], '#7dff8a');
      if (overT > 2 && !scorePending && (menuKey('ok') || menuKey('back'))) { if(window.BanguOnline)maybeSubmitScore();else {scene='menu';menuStage=1;} }
    }
    if(online&&online.coop&&online.host&&online.started){
      if(players[1]&&!players[1].ai&&time-online.lastInput>window.CreiaCombat.coop.inputTimeout)coopControl(true);
      if(scene==='gameover'||scene==='ending'){online.snapT+=dt;if(online.snapT>=.05){online.snapT=0;window.BanguOnline.send({type:'snapshot',state:adventureSnapshot()});}}
    }
    if (onlineNoticeT>0 && scene!=='onlineSelect'&&!cinematicActive()) txt(onlineNotice,240,239,'#ff6b6b','center');
    musicTick();
    ambienceTick();
    if(window.CreiaUI)window.CreiaUI.sync(modernUIState(),uiBridge);
    if(TOUCH&&document.documentElement)document.documentElement.classList.toggle('creia-touch-off',scene==='stagesel'||scene==='tour'||scene==='escalada');
    if(window.CreiaSettings)CreiaSettings.sync({open:scene==='config'||showCfg,mobile:TOUCH,close:function(){if(showCfg)showCfg=false;else scene='menu';},preview:function(k){audio();if(AC)AC.resume();audioLevels();sfx(k==='voices'?'grito':'hit');},online:online?{metrics:window.BanguOnline.metrics?BanguOnline.metrics():null,away:onlineHeld(),result:cinematicActive()?undefined:online.result,self:online.rematchSelf,other:online.rematchOther,selfMode:online.selfMode,otherMode:online.otherMode,rematch:onlineRematch,leave:function(){onlineExit();}}:null});
    pressed.clear();physicalPressed.clear();touchPressed.clear();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ganchos para teste automatizado (galeria/playwright)
  window.__bangu = {
    get online() { return online; },
    get tour() { return tour; },
    get escalada() { return esc; },
    get escaladaRecord() { return getEscaladaRecord; },
    // Testes de combate mantêm a introdução curta; apresentarCulto=true exercita o fluxo completo.
    startTeam: function (team, keepStage, vs, apresentarCulto) { saved.tut = true; if (!keepStage) menuStage = 1; startTeam(team, keepStage, vs); if(vs&&!apresentarCulto)vsRound.phase='intro'; },
    cardosoTest: {
      spawn: function (kind,x,y) { return spawnEnemy(kind,x,y); },
      shoot: function (o) { G.shoot(o); },
      bossHit: function (p,dmg) { return G.hit(p.x,p.y,10,10,0,90,dmg,0,p.x-20); },
      hitBoss: function (b,dmg,p) { return hitBoss(b,dmg,p); },
      enemyHit: function (p,dmg,x) { return damagePlayer(p,dmg,0,x,'enemy'); },
      versusHit: function (attacker,target,dmg,isSpecial,specialBlocked,knockDist,fromX) { return hitBoss(bosses.find(function (b) { return b.vs===target; }),dmg,attacker,isSpecial,specialBlocked,knockDist,fromX); },
      versus: function (a,b) { startTeam([{who:a,ctl:0},{who:b,ctl:1}],false,true); vsRound.phase='intro'; }
    },
    get state() { return { scene: scene, stage: stage, phase: phase, cam: cam, bossOn: bossOn, players: players, enemies: enemies, bosses: bosses,
      cat:cat,camLock:camLock,waves:waves,laminas:emanuellyBlades(),shots: shots, eshots: eshots, parts: parts, round: vsRound, score: score }; },
    start: function (mode, s) { saved.tut = true;   // testes: pula o tutorial
      startGame(mode || 0); if(s && s!==1)startStage(clamp(s,1,10)); },
    nearBoss: function () { waves.forEach(function (w) { w.done = true; }); wave = null; camLock = null; enemies = []; cam = CAM_MAX - 420; players.forEach(function (p, i) { p.x = cam + 200 - i * 30; }); },
    jumpToBoss: function () { waves.forEach(function (w) { w.done = true; }); wave = null; camLock = null; enemies = []; players.forEach(function (p) { p.x = CAM_MAX + 230 + p.idx * 20; }); cam = CAM_MAX - 1; },
    get hazards() { return hazards; },
    petCat: function () {   // leva os dois até o gatinho e faz carinho (teste)
      if (!cat || cat.done) return false;
      enemies = []; camLock = null; cam = clamp(cat.x - W / 2, 0, CAM_MAX);
      players.forEach(function (q, i) { q.x = cat.x - 30 + i * 8; q.y = cat.y; });
      return tryPet(players.find(function(q){return !q.dead;})||players[0]);
    },
    fillSpecial: function () { players.forEach(function (p) { p.sp = 100; }); },
    // simulação acelerada: IA joga pelos dois; god = ninguém morre (testa só o fluxo da fase)
    sim: function (seconds, god) {
      players.forEach(function (p) { p.ai = true; });
      for (var i = 0; i < seconds * 60 && scene === 'play'; i++) {
        if (god) players.forEach(function (p) { if (p.hp < 50) p.hp = 100; });
        time += 1 / 60; updatePlay(1 / 60); updateCommon(1 / 60);
      }
      return { scene: scene, stage: stage, phase: phase, cam: Math.round(cam), camLock: camLock, bossOn: bossOn,
        wave: waves.filter(function (w) { return w.done; }).length + '/' + waves.length,
        enemies: enemies.length, shots: shots.length, eshots: eshots.length, parts: parts.length,
        px: players.map(function (p) { return Math.round(p.x) + ':' + p.state; }),
        bosses: bosses.map(function (b) { return b.name + ':' + Math.round(b.hp) + (b.dead ? ':morto' : ''); }) };
    }
  };
}());
