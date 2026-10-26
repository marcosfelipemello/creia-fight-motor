/* Adriene (confeiteira): brigadeiro, ingredientes, rodas girando e a cena "É HORA DO BRIGADEIRO!".
   Desenho determinístico: o mesmo arquivo roda no jogo e na prévia HyperFrames (cutscenes/adriene). */
(function (root) {
  'use strict';
  var TAU = Math.PI * 2, DURATION = 2.8;
  var KINDS = ['leite', 'chocolate', 'manteiga', 'granulado', 'colher'];
  var CONFETTI = ['#ff6fb5', '#ffe14d', '#ffffff', '#7ad8ff', '#8dff9a', '#ff9a3c'];
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function ease(a, b, t) { var u = clamp((t - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); }
  function backOut(u) { u = clamp(u, 0, 1); var c = 2.2; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, TAU); c.fill(); }
  function rect(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(x, y, w, h); }

  // forminha de papel plissada; top = altura da boca da forminha (o brigadeiro afunda nela)
  function cup(c, top, r) {
    var tw = r * 1.08, bw = r * 0.8, h = r * 0.62;
    c.fillStyle = '#3a0610';
    c.beginPath(); c.moveTo(-tw - 1, top - 1); c.lineTo(tw + 1, top - 1); c.lineTo(bw + 1, top + h + 1); c.lineTo(-bw - 1, top + h + 1); c.closePath(); c.fill();
    c.fillStyle = '#c2263c';
    c.beginPath(); c.moveTo(-tw, top); c.lineTo(tw, top); c.lineTo(bw, top + h); c.lineTo(-bw, top + h); c.closePath(); c.fill();
    c.fillStyle = '#8a1426';
    var n = Math.max(4, Math.round(r / 3.2));
    for (var i = 1; i < n; i++) { var u = i / n, x0 = -tw + 2 * tw * u, x1 = -bw + 2 * bw * u; c.beginPath(); c.moveTo(x0 - 0.5, top); c.lineTo(x0 + 0.5, top); c.lineTo(x1 + 0.4, top + h); c.lineTo(x1 - 0.4, top + h); c.fill(); }
    rect(c, '#ff6f86', -tw, top, tw * 2, Math.max(1, r * 0.07));
  }
  // brigadeiro: bola de chocolate com granulado (rot gira o granulado; opts.cup põe a forminha)
  function brigadeiro(c, x, y, r, rot, opts) {
    opts = opts || {};
    c.save(); c.translate(x, y);
    c.fillStyle = '#120501'; circle(c, 0, 0, r + Math.max(1, r * 0.07));
    c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
    c.fillStyle = '#4a210e'; c.fillRect(-r, -r, r * 2, r * 2);
    c.fillStyle = '#2c1106'; circle(c, r * 0.35, r * 0.4, r * 0.95);
    c.fillStyle = '#4a210e'; circle(c, -r * 0.08, -r * 0.1, r * 0.82);
    c.fillStyle = '#6e3517'; circle(c, -r * 0.34, -r * 0.4, r * 0.46);
    var n = clamp(Math.round(r * r * 0.32), 5, 120), len = Math.max(1.3, r * 0.2), wid = Math.max(0.9, r * 0.075);
    for (var i = 0; i < n; i++) {
      var a = i * 2.39996 + rot, d = r * 0.95 * Math.sqrt((i + 0.5) / n), px = Math.cos(a) * d, py = Math.sin(a) * d;
      c.save(); c.translate(px, py); c.rotate(hash(i) * Math.PI + rot * 0.5);
      c.fillStyle = i % 5 === 0 ? '#8a4a22' : i % 3 ? '#1a0803' : '#5e2c12'; c.fillRect(-len / 2, -wid / 2, len, wid);
      c.restore();
    }
    c.fillStyle = 'rgba(255,214,170,0.7)'; circle(c, -r * 0.42, -r * 0.5, Math.max(0.6, r * 0.12));
    c.restore();
    if (opts.cup) cup(c, r * 0.42, r);
    c.restore();
  }
  // ingredientes que voam no especial (escala 1 = ~14 px de altura)
  function ingredient(c, kind, x, y, s, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s, s);
    if (kind === 'leite') {   // lata de leite condensado
      rect(c, '#14141c', -5, -7, 10, 14); rect(c, '#f2f4f8', -4, -6, 8, 12); rect(c, '#2b62c4', -4, -3, 8, 6);
      rect(c, '#ffffff', -4, -1, 8, 1); rect(c, '#bcc3cf', -4, -6, 8, 2); rect(c, '#ffffff', -3, -5, 1, 10); rect(c, '#fff3d6', 2, -8, 2, 2);
    } else if (kind === 'chocolate') {   // caixinha de chocolate em pó
      rect(c, '#1a0a04', -6, -8, 12, 16); rect(c, '#6b3418', -5, -7, 10, 14); rect(c, '#c62f2f', -5, -7, 10, 3);
      rect(c, '#e8b878', -4, -2, 8, 5); rect(c, '#3a1a0a', -3, 0, 2, 1); rect(c, '#3a1a0a', 0, 0, 3, 1); rect(c, '#9a5a2a', -5, 5, 10, 1);
    } else if (kind === 'manteiga') {   // tablete de manteiga meio desembrulhado
      rect(c, '#2a1e06', -7, -4, 14, 8); rect(c, '#ffd84a', -6, -3, 12, 6); rect(c, '#e0b42a', -6, 1, 12, 2);
      rect(c, '#d9dee8', -6, -3, 4, 6); rect(c, '#aeb6c4', -3, -3, 1, 6); rect(c, '#fff3a6', 0, -3, 5, 1);
    } else if (kind === 'colher') {   // colher de pau
      rect(c, '#3a1d08', -1.5, -2, 3, 11); rect(c, '#c98a4a', -0.5, -1, 1.5, 9.5);
      c.fillStyle = '#3a1d08'; c.beginPath(); c.ellipse(0, -5, 3.6, 4.6, 0, 0, TAU); c.fill();
      c.fillStyle = '#d99a58'; c.beginPath(); c.ellipse(0, -5, 2.6, 3.6, 0, 0, TAU); c.fill(); rect(c, '#f0c08a', -1.6, -7.4, 1, 2);
    } else {   // punhado de granulado
      for (var i = 0; i < 11; i++) {
        var a = i * 2.39996, d = 1.5 + 5 * hash(i + 3);
        c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d * 0.8); c.rotate(hash(i) * 3);
        c.fillStyle = i % 4 ? '#24100a' : '#7a4020'; c.fillRect(-1.5, -0.6, 3, 1.3); c.restore();
      }
    }
    c.restore();
  }
  // posição de um ingrediente voando de longe até o alvo, em espiral
  function flight(x0, y0, x1, y1, u, curl) {
    var e = u * u * (3 - 2 * u), mx = (x0 + x1) / 2 + (y1 - y0) * 0.45 * curl, my = (y0 + y1) / 2 - (x1 - x0) * 0.45 * curl - 30;
    var a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, d = e * e;
    return [a * x0 + b * mx + d * x1, a * y0 + b * my + d * y1];
  }
  var FLY = 0.55, FORM = 0.38, POP = 0.25;
  // brigadeiro gigante prendendo um alvo. x,y = pés do alvo na tela; h = altura do alvo;
  // age = tempo desde que os ingredientes saíram; left = tempo que ainda falta; t = relógio; seed = variação por alvo
  function trap(c, x, y, h, age, left, t, seed) {
    var R = clamp(h * 0.36, 12, 62), cy = y - R * 0.95;
    for (var k = 0; k < KINDS.length; k++) {   // ingredientes chegando de todos os lados
      var u = clamp((age - k * 0.05) / FLY, 0, 1); if (u <= 0 || u >= 1) continue;
      var a0 = seed * 1.7 + k * TAU / KINDS.length, D = 170 + R * 2;
      var sx0 = x + Math.cos(a0) * D, sy0 = cy - Math.abs(Math.sin(a0)) * D * 0.55 - 50;
      for (var g = 2; g >= 0; g--) {   // rastro
        var ug = Math.max(0, u - g * 0.05), pos = flight(sx0, sy0, x, cy, ug, k % 2 ? 1 : -1);
        c.globalAlpha = g ? 0.25 / g : 1;
        ingredient(c, KINDS[k], pos[0], pos[1], 0.9 + R / 40, age * 11 + k * 1.3);
      }
      c.globalAlpha = 1;
    }
    var grow = backOut((age - FLY + 0.08) / FORM);
    if (grow <= 0) return;
    var popK = left < POP ? 1 - left / POP : 0, wob = grow >= 1 ? Math.sin(t * 10 + seed * 3) * 0.05 : 0;
    var jit = (t + seed) % 0.9 < 0.14 ? Math.sin(t * 70) * Math.max(1, R * 0.06) : 0;   // o preso se debatendo lá dentro
    c.save(); c.translate(x + jit, cy); c.scale((1 + wob) * (1 + popK * 0.35), (1 - wob) * (1 + popK * 0.35)); c.globalAlpha = 1 - popK;
    var r = R * grow;
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, R * 0.98, R * 1.1, R * 0.18, 0, 0, TAU); c.fill();
    brigadeiro(c, 0, 0, r, seed * 5 + 0.3, { cup: grow > 0.6 });
    c.fillStyle = '#3b1a0a';   // escorrido de chocolate na borda
    for (var di = 0; di < 3; di++) { var dx = (di - 1) * r * 0.55, dl = r * (0.18 + 0.12 * hash(seed + di)) * Math.min(1, age * 2); c.fillRect(dx - 1.5, r * 0.32, 3, dl); circle(c, dx, r * 0.32 + dl, 1.6); }
    c.restore();
    if (popK > 0) {   // estoura em granulado
      for (var i = 0; i < 16; i++) {
        var aa = i * TAU / 16 + seed, dd = R * (0.6 + popK * 1.4);
        c.save(); c.globalAlpha = 1 - popK; c.translate(x + Math.cos(aa) * dd, cy + Math.sin(aa) * dd * 0.8); c.rotate(aa + popK * 6);
        c.fillStyle = i % 3 ? '#24100a' : '#7a4020'; c.fillRect(-2, -1, 4, 2); c.restore();
      }
    }
  }
  function trapDuration(versus) { return versus ? 2.6 : 3.6; }

  // rodas girando por cima da arte (coordenadas da arte; k = escala da arte na tela)
  function ellipsePath(c, cx, cy, rx, ry, a0, a1) {
    c.beginPath();
    for (var i = 0, n = 24; i <= n; i++) { var a = a0 + (a1 - a0) * i / n, px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
  }
  function wheelSpin(c, w, ang, k, speed) {
    var px = 1 / k, s = clamp(speed == null ? 1 : speed, 0, 1);
    c.save();
    c.fillStyle = 'rgba(28,30,40,' + (0.38 * s) + ')'; ellipsePath(c, w.x, w.y, w.rx * 0.86, w.ry * 0.86, 0, TAU); c.fill();
    c.strokeStyle = '#b9c2cf'; c.lineWidth = px; c.globalAlpha = 0.75;
    for (var i = 0; i < 6; i++) {   // raios girando
      var a = ang + i * Math.PI / 3;
      c.beginPath(); c.moveTo(w.x + Math.cos(a) * w.rx * 0.1, w.y + Math.sin(a) * w.ry * 0.1); c.lineTo(w.x + Math.cos(a) * w.rx * 0.84, w.y + Math.sin(a) * w.ry * 0.84); c.stroke();
    }
    c.globalAlpha = 0.55 * s; c.lineWidth = px * 1.4;   // borrão de velocidade dentro do aro
    for (var j = 0; j < 3; j++) { ellipsePath(c, w.x, w.y, w.rx * (0.42 + j * 0.16), w.ry * (0.42 + j * 0.16), ang * 1.3 + j * 2, ang * 1.3 + j * 2 + 1.6); c.stroke(); }
    c.globalAlpha = 0.85; c.strokeStyle = '#e4eaf3'; c.lineWidth = px * 1.2;   // brilho correndo no pneu
    ellipsePath(c, w.x, w.y, w.rx * 0.95, w.ry * 0.95, ang, ang + 0.5); c.stroke();
    ellipsePath(c, w.x, w.y, w.rx * 0.95, w.ry * 0.95, ang + Math.PI, ang + Math.PI + 0.5); c.stroke();
    c.globalAlpha = 1;
    c.fillStyle = '#20232c'; ellipsePath(c, w.x, w.y, w.rx * 0.13, w.ry * 0.13, 0, TAU); c.fill();
    c.fillStyle = '#c9d1dc'; ellipsePath(c, w.x, w.y, w.rx * 0.06, w.ry * 0.06, 0, TAU); c.fill();
    c.restore();
  }

  // cena do especial. io.hero(ctx, x, chao, escala, t) desenha a Adriene de braços pra cima;
  // io.text(texto, x, y, cor, alinhamento, tamanho) é o texto do jogo (fonte de pixel com acento)
  function cinematic(c, t, W, H, io) {
    var fade = ease(0, 0.14, t) * (1 - ease(DURATION - 0.22, DURATION, t));
    c.save(); c.globalAlpha = fade;
    var hx = W * 0.27, g = c.createRadialGradient(hx, H * 0.42, 10, hx, H * 0.42, W * 0.75);
    g.addColorStop(0, '#ffd59a'); g.addColorStop(0.4, '#c0662a'); g.addColorStop(1, '#2a0e04');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.translate(hx, H * 0.4);   // raios girando atrás dela
    for (var i = 0; i < 16; i++) {
      var a = i / 16 * TAU + t * 0.6; c.fillStyle = i % 2 ? 'rgba(255,240,200,0.18)' : 'rgba(255,111,181,0.14)';
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * W, Math.sin(a) * W); c.lineTo(Math.cos(a + 0.2) * W, Math.sin(a + 0.2) * W); c.fill();
    }
    c.restore();
    for (var j = 0; j < 46; j++) {   // granulado colorido caindo
      var fy = ((t * 80 * (0.6 + hash(j)) + j * 37) % (H + 20)) - 10, fx = (j * 53 + Math.sin(t * 2 + j) * 8) % W;
      c.save(); c.translate(fx, fy); c.rotate(j + t * 3); c.fillStyle = CONFETTI[j % CONFETTI.length]; c.fillRect(-1.5, -0.6, 3, 1.3); c.restore();
    }
    var bounce = t > 0.4 ? -Math.abs(Math.sin((t - 0.4) * Math.PI * 2.4)) * 4 : 0;
    var zoom = 2.9 + ease(0, 2.4, t) * 0.35, rise = (1 - ease(0, 0.3, t)) * 40;
    if (io && io.hero) io.hero(c, hx, H + 34 + rise + bounce, zoom, t);
    var gather = ease(1.75, 2.15, t), bx = W * 0.73, by = H * 0.73;
    for (var k = 0; k < 6; k++) {   // ingredientes girando em volta das mãos, depois vão formar o brigadeiro
      var ka = t * 2.6 + k * TAU / 6, rr = 92 * (1 - 0.25 * ease(0.3, 1.6, t));
      var ox = hx + Math.cos(ka) * rr, oy = H * 0.3 + Math.sin(ka) * rr * 0.42;
      var p = flight(ox, oy, bx, by, gather, k % 2 ? 1 : -1);
      if (gather >= 1) continue;
      c.globalAlpha = fade * ease(0.15, 0.4, t);
      ingredient(c, KINDS[k % KINDS.length], p[0], p[1], 1.7 - gather * 0.6, t * 5 + k);
    }
    c.globalAlpha = fade;
    var grow = backOut((t - 2.05) / 0.32);
    if (grow > 0) {
      var R = 44 * grow;
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(bx, by + R * 1.0, R * 1.1, R * 0.2, 0, 0, TAU); c.fill();
      brigadeiro(c, bx, by, R, t * 0.3, { cup: true });
      for (var s = 0; s < 6; s++) { var sa = s * TAU / 6 + t * 3, sd = R * 1.25 + Math.sin(t * 9 + s) * 3; rect(c, '#fff6c0', bx + Math.cos(sa) * sd - 1, by + Math.sin(sa) * sd * 0.8 - 1, 2, 2); }
    }
    if (io && io.text) {   // "É HORA DO" e depois "BRIGADEEEEIROOO!" com as letras pulando
      var tx = W * 0.705, l1 = 'É HORA DO', l2 = 'BRIGADEEEEIROOO!', sz = 15;
      var n1 = Math.ceil(l1.length * ease(0.32, 0.72, t)); if (n1 > 0) io.text(l1.slice(0, n1), tx, 34, '#ffffff', 'center', 13);
      var n2 = Math.ceil(l2.length * clamp((t - 0.8) / 0.85, 0, 1)), x0 = tx - l2.length * sz / 2;
      for (var ci = 0; ci < n2; ci++) {
        var pop = clamp((t - 0.8 - ci * 0.053) / 0.12, 0, 1), cs = 1 + (1 - pop) * 0.9;
        c.save(); c.translate(x0 + ci * sz + sz / 2, 72 + Math.sin(t * 11 + ci * 0.7) * 2.5); c.scale(cs, cs);
        io.text(l2[ci], 0, -sz / 2, ci % 2 ? '#ff8fc0' : '#ffe066', 'center', sz); c.restore();
      }
    }
    if (t < 0.1) { c.globalAlpha = 0.8 * (1 - t / 0.1); c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); }
    c.restore();
  }

  var api = { duration: DURATION, kinds: KINDS, brigadeiro: brigadeiro, ingredient: ingredient, trap: trap, trapDuration: trapDuration,
    trapForming: FLY + FORM - 0.08, wheelSpin: wheelSpin, cinematic: cinematic };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AdrieneVisual = api;
}(typeof window !== 'undefined' ? window : globalThis));
