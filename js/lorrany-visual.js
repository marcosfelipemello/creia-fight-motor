/* Lorrany (nutricionista): cena "RESTRIÇÃO ALIMENTAR, LOW CARB!" e o dreno de vida.
   Desenho determinístico: o mesmo arquivo roda no jogo e na prévia HyperFrames (cutscenes/lorrany). */
(function (root) {
  'use strict';
  var TAU = Math.PI * 2, DURATION = 3.4;
  var CARBS = ['pao', 'pizza', 'fritas', 'refri', 'donut'], GREENS = ['folha', 'cenoura', 'maca', 'folha', 'brocolis'];
  // pontos medidos nas artes v3 (assets/lorrany, 360x465): a maçã já mordida e o centro da prancheta, para onde a vida é puxada
  var APPLE = { x: 208, y: 150, r: 20 }, CLAW = { x: 190, y: 210 };
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function ease(a, b, t) { var u = clamp((t - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); }
  function backOut(u) { u = clamp(u, 0, 1); var c = 2.4; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function rect(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function circle(c, col, x, y, r) { c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, TAU); c.fill(); }

  // ícones de comida em pixel (escala 1 = ~16 px)
  function icon(c, kind, x, y, s, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s, s);
    if (kind === 'pao') {
      rect(c, '#3a2210', -8, -5, 16, 10); rect(c, '#c98a3a', -7, -4, 14, 8); rect(c, '#e0a85a', -6, -4, 12, 3);
      rect(c, '#8a5a22', -4, -3, 1, 3); rect(c, '#8a5a22', 0, -3, 1, 3); rect(c, '#8a5a22', 4, -3, 1, 3);
    } else if (kind === 'pizza') {
      c.fillStyle = '#3a1a08'; c.beginPath(); c.moveTo(-8, -7); c.lineTo(8, -7); c.lineTo(0, 9); c.closePath(); c.fill();
      c.fillStyle = '#ffd34d'; c.beginPath(); c.moveTo(-6, -5); c.lineTo(6, -5); c.lineTo(0, 7); c.closePath(); c.fill();
      rect(c, '#d9a050', -7, -7, 14, 3); circle(c, '#c0392b', -2, -2, 1.6); circle(c, '#c0392b', 2, 1, 1.4);
    } else if (kind === 'fritas') {
      [-4, -2, 0, 2, 4].forEach(function (fx, i) { rect(c, '#3a2208', fx - 1, -9 + (i % 2) * 2, 2.4, 8); rect(c, '#ffd34d', fx - 0.5, -8 + (i % 2) * 2, 1.4, 7); });
      rect(c, '#3a0a0a', -6, -2, 12, 10); rect(c, '#d62828', -5, -1, 10, 8); rect(c, '#ffd34d', -2, 2, 4, 2);
    } else if (kind === 'refri') {
      rect(c, '#2a0a0a', -6, -6, 12, 15); rect(c, '#e63946', -5, -5, 10, 13); rect(c, '#ffffff', -5, 0, 10, 2);
      rect(c, '#dddddd', -6, -7, 12, 2); rect(c, '#ffffff', 1, -12, 1.5, 6);
    } else if (kind === 'donut') {
      circle(c, '#3a1a08', 0, 0, 8); circle(c, '#e8a868', 0, 0, 7); circle(c, '#ff7fb6', 0, -1, 6);
      circle(c, '#3a1a08', 0, 0, 2.6); circle(c, '#00000000', 0, 0, 1);
      ['#fff', '#7ad8ff', '#ffe14d', '#8dff9a'].forEach(function (col, i) { rect(c, col, -4 + i * 2.6, -4 + (i % 2) * 5, 1.6, 1); });
    } else if (kind === 'cenoura') {
      c.fillStyle = '#3a1a04'; c.beginPath(); c.moveTo(-3.5, -5); c.lineTo(3.5, -5); c.lineTo(0, 9); c.closePath(); c.fill();
      c.fillStyle = '#ff8a1e'; c.beginPath(); c.moveTo(-2.5, -4); c.lineTo(2.5, -4); c.lineTo(0, 7); c.closePath(); c.fill();
      rect(c, '#3fae49', -3, -9, 2, 5); rect(c, '#5fd36a', 0, -10, 2, 6); rect(c, '#3fae49', 2, -8, 2, 4);
    } else if (kind === 'maca') {
      circle(c, '#3a0606', 0, 1, 7); circle(c, '#e02a2a', 0, 1, 6); circle(c, '#ff7a6a', -2, -1, 1.8);
      rect(c, '#5a3a14', -0.5, -8, 1.5, 4); rect(c, '#5fd36a', 1, -8, 4, 2);
    } else if (kind === 'brocolis') {
      rect(c, '#2a5a14', -1.5, 1, 3, 7); circle(c, '#1f6a2a', -3, -1, 4); circle(c, '#1f6a2a', 3, -1, 4); circle(c, '#1f6a2a', 0, -4, 4);
      circle(c, '#4caf50', -3, -2, 2.6); circle(c, '#4caf50', 3, -2, 2.6); circle(c, '#5fd36a', 0, -5, 2.6);
    } else {   // folha
      c.fillStyle = '#1f5a1a'; c.beginPath(); c.ellipse(0, 0, 4.5, 8, 0.5, 0, TAU); c.fill();
      c.fillStyle = '#5fd36a'; c.beginPath(); c.ellipse(0, 0, 3.4, 6.8, 0.5, 0, TAU); c.fill();
      c.strokeStyle = '#2f8a2a'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-3, 5); c.lineTo(3, -5); c.stroke();
    }
    c.restore();
  }
  function cross(c, x, y, s, k) {   // X vermelho carimbado
    c.save(); c.translate(x, y); c.scale(s * (1 + (1 - k) * 1.5), s * (1 + (1 - k) * 1.5)); c.globalAlpha *= k;
    c.strokeStyle = '#0b0a10'; c.lineWidth = 5; c.beginPath(); c.moveTo(-8, -8); c.lineTo(8, 8); c.moveTo(8, -8); c.lineTo(-8, 8); c.stroke();
    c.strokeStyle = '#ff2e3e'; c.lineWidth = 3; c.stroke(); c.restore();
  }
  // esfera de vida sendo puxada (vermelha) ou entrando nela (verde)
  function orb(c, x, y, r, col, glow) {
    c.save(); c.globalCompositeOperation = 'lighter';
    c.globalAlpha *= 0.35; circle(c, glow, x, y, r * 2.2); c.globalAlpha /= 0.35;
    c.restore(); circle(c, col, x, y, r); circle(c, '#ffffff', x - r * 0.3, y - r * 0.3, r * 0.35);
  }
  // corrente de vida do alvo (x0,y0) até a mão dela (x1,y1); u = força (0..1) para entrar/sair
  function drain(c, x0, y0, x1, y1, u, t, seed) {
    if (u <= 0) return;
    var mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 26 - 10 * hash(seed);
    c.save(); c.globalAlpha = u;
    c.strokeStyle = 'rgba(255,60,80,0.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
    c.strokeStyle = 'rgba(255,200,210,0.6)'; c.lineWidth = 1; c.stroke();
    for (var i = 0; i < 7; i++) {
      var k = (t * 1.6 + i / 7 + hash(seed + i) * 0.05) % 1, a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, d = k * k;
      var px = a * x0 + b * mx + d * x1, py = a * y0 + b * my + d * y1 + Math.sin(t * 9 + i) * 1.5;
      orb(c, px, py, 1.6 + (1 - k) * 1.4, '#ff3b4f', '#ff6b7f');
    }
    c.restore();
  }
  // brilho verde em volta dela enquanto recebe a vida
  function heal(c, x, y, u, t) {
    if (u <= 0) return;
    c.save(); c.globalAlpha = u;
    for (var i = 0; i < 6; i++) {
      var k = (t * 0.9 + i / 6) % 1, px = x + Math.sin(i * 2.1 + t * 2) * 14, py = y - k * 60;
      c.globalAlpha = u * Math.sin(k * Math.PI); rect(c, '#8dff9a', px - 1, py - 3, 2, 6); rect(c, '#8dff9a', px - 3, py - 1, 6, 2);
    }
    c.restore();
  }

  function shot(c, img, sx, sy, sw, sh, dx, dy, scale) {   // recorte da arte ampliado, sem suavizar
    if (!img || !img.complete || !img.naturalWidth) return false;
    c.save(); c.imageSmoothingEnabled = false; c.drawImage(img, sx, sy, sw, sh, dx, dy, sw * scale, sh * scale); c.restore(); return true;
  }
  // a cena. io.img(nome) devolve a arte carregada ('maca' e 'garra'); io.text = texto do jogo (fonte de pixel com acento)
  function cinematic(c, t, W, H, io) {
    var fade = ease(0, 0.12, t) * (1 - ease(DURATION - 0.25, DURATION, t));
    var bite = 0.55, slam = 1.62, swap = 2.2;
    var shakeK = Math.max(t > bite && t < bite + 0.25 ? 1 - (t - bite) / 0.25 : 0, t > slam && t < slam + 0.35 ? (1 - (t - slam) / 0.35) * 1.6 : 0);
    var sx = Math.sin(t * 90) * 3 * shakeK, sy = Math.cos(t * 77) * 2 * shakeK;
    c.save(); c.globalAlpha = fade; c.translate(sx, sy);
    if (t < swap + 0.2) {   // ---- parte 1: câmera no tronco, comendo a maçã
      var g = c.createRadialGradient(W * 0.32, H * 0.45, 8, W * 0.32, H * 0.45, W * 0.8);
      g.addColorStop(0, '#e9ff9a'); g.addColorStop(0.35, '#5fd36a'); g.addColorStop(1, '#0d3b1c');
      c.fillStyle = g; c.fillRect(-10, -10, W + 20, H + 20);
      c.save(); c.translate(W * 0.32, H * 0.45);
      for (var i = 0; i < 18; i++) {   // raios
        var a = i / 18 * TAU + t * 0.5; c.fillStyle = i % 2 ? 'rgba(255,255,220,0.16)' : 'rgba(20,90,30,0.14)';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * W, Math.sin(a) * W); c.lineTo(Math.cos(a + 0.17) * W, Math.sin(a + 0.17) * W); c.fill();
      }
      c.restore();
      for (var j = 0; j < 14; j++) {   // comida saudável subindo
        var k = (t * (0.18 + hash(j) * 0.12) + hash(j + 9)) % 1;
        c.globalAlpha = fade * 0.55; icon(c, GREENS[j % GREENS.length], (j * 71) % W, H + 16 - k * (H + 40), 1 + hash(j + 4) * 0.6, Math.sin(t * 2 + j) * 0.4);
      }
      c.globalAlpha = fade;
      var zoom = 1.18 + ease(0, swap, t) * 0.22, cw = 250, ch = 250, cx0 = 46, cy0 = 0;   // recorte: cabeça e tronco
      var dx = W * 0.3 - (APPLE.x - cx0) * zoom + (APPLE.x - cx0 - cw / 2) * zoom * 0.25, dy = H * 0.43 - (APPLE.y - cy0) * zoom + 14;
      var drawn = io && io.img && shot(c, io.img('maca'), cx0, cy0, cw, ch, dx, dy, zoom);
      var ax = dx + (APPLE.x - cx0) * zoom, ay = dy + (APPLE.y - cy0) * zoom;
      if (drawn && t > bite && io.marcarMordida) {   // a arte v3 já traz a maçã mordida; a marca desenhada só com io.marcarMordida
        c.save(); c.beginPath(); c.arc(ax, ay, APPLE.r * zoom, 0, TAU); c.clip();
        circle(c, '#3a1206', ax - APPLE.r * zoom * 0.85, ay - APPLE.r * zoom * 0.35, APPLE.r * zoom * 0.55);
        circle(c, '#f3e6c4', ax - APPLE.r * zoom * 0.9, ay - APPLE.r * zoom * 0.35, APPLE.r * zoom * 0.47);
        circle(c, '#e0c99a', ax - APPLE.r * zoom * 1.0, ay - APPLE.r * zoom * 0.3, APPLE.r * zoom * 0.25);
        c.restore();
      }
      if (t > bite && t < bite + 0.6) {   // farelo da mordida
        var bt = t - bite;
        for (var m = 0; m < 12; m++) {
          var ang = -Math.PI * 0.2 - hash(m) * Math.PI * 0.9, sp = 50 + hash(m + 3) * 70;
          var px = ax - 8 + Math.cos(ang) * sp * bt, py = ay - 6 + Math.sin(ang) * sp * bt + 160 * bt * bt;
          c.globalAlpha = fade * (1 - bt / 0.6); rect(c, m % 3 ? '#f3e6c4' : '#e02a2a', px, py, 3, 3);
        }
        c.globalAlpha = fade;
        var pk = backOut(bt / 0.15);
        if (io && io.text) { c.save(); c.translate(ax + 26, ay - 30); c.rotate(-0.2); c.scale(pk, pk); io.text('CROC!', 0, -6, '#ffffff', 'center', 13); c.restore(); }
      }
      var tx = W * 0.74;
      if (io && io.text) {
        var l1 = 'RESTRIÇÃO', l2 = 'ALIMENTAR,';
        var n1 = Math.ceil(l1.length * ease(0.75, 1.12, t)), n2 = Math.ceil(l2.length * ease(1.12, 1.5, t));
        if (n1 > 0) io.text(l1.slice(0, n1), tx, 40, '#ffffff', 'center', 16);
        if (n2 > 0) io.text(l2.slice(0, n2), tx, 64, '#ffffff', 'center', 16);
      }
      for (var q = 0; q < CARBS.length; q++) {   // carboidratos aparecem e levam um X
        var appear = ease(0.95 + q * 0.08, 1.15 + q * 0.08, t), out = ease(slam + 0.2, slam + 0.55, t);
        if (appear <= 0) continue;
        var qa = q / CARBS.length * TAU + t * 0.9, qx = tx + Math.cos(qa) * 82, qy = 150 + Math.sin(qa) * 40;
        qx += out * (qx - tx) * 3; qy += out * (qy - 150) * 3 - out * 40;
        c.globalAlpha = fade * (1 - out);
        icon(c, CARBS[q], qx, qy, 1.5 * appear, Math.sin(t * 3 + q) * 0.3 + out * 8);
        if (t > slam) cross(c, qx, qy, 1, ease(slam, slam + 0.12, t));
      }
      c.globalAlpha = fade;
      if (t > slam && io && io.text) {   // LOW CARB! batendo na tela
        var ps = 1 + (1 - backOut((t - slam) / 0.2)) * 1.6;
        c.save(); c.translate(tx, 150); c.scale(ps, ps);
        rect(c, 'rgba(11,10,16,0.75)', -104, -24, 208, 48); rect(c, '#c6ff4a', -104, -24, 208, 3); rect(c, '#c6ff4a', -104, 21, 208, 3);
        io.text('LOW CARB!', 0, -13, '#c6ff4a', 'center', 24); c.restore();
      }
    }
    if (t > swap) {   // ---- parte 2: corte seco para a garra, puxando a vida
      var wipe = ease(swap, swap + 0.18, t);
      c.save(); c.beginPath(); c.moveTo(-20, -10); c.lineTo((W + 120) * wipe, -10); c.lineTo((W + 120) * wipe - 100, H + 10); c.lineTo(-20, H + 10); c.closePath(); c.clip();
      var g2 = c.createRadialGradient(W * 0.3, H * 0.5, 10, W * 0.3, H * 0.5, W * 0.75);
      g2.addColorStop(0, '#5a1430'); g2.addColorStop(0.5, '#2a0818'); g2.addColorStop(1, '#08020a');
      c.fillStyle = g2; c.fillRect(-10, -10, W + 20, H + 20);
      for (var v = 0; v < 22; v++) { var vy2 = (v * 37) % H, vl = 30 + (v * 53) % 90, vx2 = W - ((v * 97 + (t - swap) * 700) % (W + 160)); rect(c, 'rgba(255,90,110,0.35)', vx2, vy2, vl, v % 3 ? 1 : 2); }
      var z2 = 1.25 + ease(swap, DURATION, t) * 0.18, gx0 = 60, gy0 = 50, gw = 290, gh = 260;
      var gdx = W * 0.3 - (CLAW.x - gx0) * z2 * 0.55, gdy = 6 - (1 - ease(swap, swap + 0.25, t)) * 20;
      if (io && io.img) shot(c, io.img('garra'), gx0, gy0, gw, gh, gdx, gdy, z2);
      var hx = gdx + (CLAW.x - gx0) * z2, hy = gdy + (CLAW.y - gy0) * z2, pull = ease(swap + 0.15, swap + 0.4, t);
      for (var s = 0; s < 3; s++) drain(c, W + 30, 60 + s * 70, hx, hy, pull, t, s * 3.1);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * pull * (0.7 + 0.3 * Math.sin(t * 20)); circle(c, '#ff3b4f', hx, hy, 16); c.restore();
      heal(c, gdx + 110 * z2, gdy + 200 * z2, pull, t);
      if (io && io.text) {
        var pp = backOut((t - swap - 0.45) / 0.2);
        if (pp > 0) {
          c.save(); c.translate(W - 70, 72); c.scale(pp, pp); io.text('-20%', 0, -10, '#ff4d5e', 'center', 20); c.restore();
          c.save(); c.translate(W - 70, 120); c.scale(pp, pp); io.text('+20% HP', 0, -8, '#8dff9a', 'center', 14); c.restore();
        }
        if (t > swap + 0.15) io.text('LOW CARB!', 18, H - 26, '#c6ff4a', 'left', 12);
      }
      c.restore();
      if (t < swap + 0.06) { c.globalAlpha = fade * (1 - (t - swap) / 0.06); rect(c, '#ffffff', -10, -10, W + 20, H + 20); c.globalAlpha = fade; }
    }
    if (t < 0.08 || (t > slam && t < slam + 0.05)) { c.globalAlpha = fade * 0.75; rect(c, '#ffffff', -10, -10, W + 20, H + 20); }
    c.restore();
  }

  var api = { duration: DURATION, drainTime: 1.0, claw: CLAW, icon: icon, drain: drain, heal: heal, cinematic: cinematic };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LorranyVisual = api;
}(typeof window !== 'undefined' ? window : globalThis));
