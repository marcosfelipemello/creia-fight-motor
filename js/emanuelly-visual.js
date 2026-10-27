/* Emanuelly v2: cena do especial ("Vamos, Crow!!!" / "Ka-kaw!") e a chuva de lâminas horizontais.
   Desenho determinístico: o mesmo arquivo roda no jogo e na prévia HyperFrames (cutscenes/emanuelly). */
(function (root) {
  'use strict';
  var TAU = Math.PI * 2, DURATION = 3.6, SWAP = 1.95;
  var BASE = root.EMANUELLY_ASSETS || 'assets/emanuelly-v2/';
  // pontos medidos nas artes recortadas (383x512)
  var CROW = { x: 272, y: 112, w: 76, h: 115 };             // o corvo dentro de especial.webp
  var BLADE = { cx: 191.5, cy: 255.5, len: 401, ang: Math.PI / 4 };   // lamina.webp: ponta (333,113), cabo (50,398)
  var imgs = {};
  function img(io, name) {
    var im = io && io.img && io.img(name);
    if (im && im.complete && im.naturalWidth) return im;
    if (!imgs[name] && typeof Image !== 'undefined') { imgs[name] = new Image(); imgs[name].src = BASE + name + '.webp'; }
    im = imgs[name];
    return im && im.complete && im.naturalWidth ? im : null;
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function ease(a, b, t) { var u = clamp((t - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); }
  function backOut(u) { u = clamp(u, 0, 1); var c = 2.2; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function rect(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(x, y, w, h); }

  // uma lâmina deitada na horizontal; dir 1 = ponta para a direita. len = comprimento em px de tela
  function lamina(c, x, y, dir, len, t, io, trail) {
    var im = img(io, 'lamina'), s = len / BLADE.len;
    if (trail !== false) {   // rastro de luz atrás da lâmina
      c.save(); c.globalCompositeOperation = 'lighter';
      var g = c.createLinearGradient(x - dir * len * 2.2, 0, x, 0);
      g.addColorStop(0, 'rgba(60,200,255,0)'); g.addColorStop(1, 'rgba(120,240,255,0.55)');
      c.fillStyle = g; c.fillRect(Math.min(x, x - dir * len * 2.2), y - 3, len * 2.2, 6);
      c.fillStyle = 'rgba(220,255,255,0.7)'; c.fillRect(Math.min(x, x - dir * len * 1.1), y - 1, len * 1.1, 2);
      c.restore();
    }
    c.save(); c.translate(x, y); c.scale(dir, 1); c.rotate(BLADE.ang); c.scale(s, s);
    if (im) { c.imageSmoothingEnabled = false; c.drawImage(im, -BLADE.cx, -BLADE.cy); }
    else { c.rotate(-BLADE.ang); rect(c, '#9ff4ff', -BLADE.len / 2, -14, BLADE.len, 28); }
    c.restore();
    if (hash(Math.floor(t * 30) + x) > 0.6) {   // faísca na ponta
      c.save(); c.globalCompositeOperation = 'lighter'; rect(c, '#bff8ff', x + dir * len * 0.45, y - 1 + (hash(x + t) - 0.5) * 6, 2, 2); c.restore();
    }
  }
  // balão no padrão do HUD: fundo escuro, borda dourada e rabinho apontando para quem fala
  function balao(c, io, s, x, y, size, k, tailX, tailY, cor) {
    var w = s.length * size + 18, h = size + 16;
    c.save(); c.translate(x, y); c.scale(k, k);
    rect(c, cor || '#ffd34d', -w / 2 - 2, -h / 2 - 2, w + 4, h + 4); rect(c, '#181521', -w / 2, -h / 2, w, h);
    // rabinho: sai da borda de baixo, na direção de quem fala, com 12 px
    var bx = clamp(tailX - x, -w / 2 + 12, w / 2 - 12), dx = tailX - x - bx, dy = tailY - y - h / 2, n = Math.max(1, Math.hypot(dx, dy));
    var tx = bx + dx / n * 12, ty = h / 2 + Math.max(6, dy / n * 12);
    c.fillStyle = cor || '#ffd34d'; c.beginPath(); c.moveTo(bx - 7, h / 2); c.lineTo(bx + 7, h / 2); c.lineTo(tx, ty + 2); c.fill();
    c.fillStyle = '#181521'; c.beginPath(); c.moveTo(bx - 4, h / 2 - 1); c.lineTo(bx + 4, h / 2 - 1); c.lineTo(tx, ty - 2); c.fill();
    if (io && io.text) io.text(s, 0, -size / 2, '#ffffff', 'center', size);
    c.restore();
  }
  function letras(s, a, b, t) { return s.slice(0, Math.ceil(s.length * ease(a, b, t))); }

  function cinematic(c, t, W, H, io) {
    var fade = ease(0, 0.1, t) * (1 - ease(DURATION - 0.22, DURATION, t));
    var hit = SWAP + 0.35, shakeK = t > hit && t < hit + 0.5 ? 1 - (t - hit) / 0.5 : 0;
    c.save(); c.globalAlpha = fade; c.translate(Math.sin(t * 90) * 3 * shakeK, Math.cos(t * 71) * 2 * shakeK);
    if (t < SWAP + 0.15) {   // ---- parte 1: ela pulando de alegria, chamando o Crow
      var g = c.createRadialGradient(W * 0.36, H * 0.55, 10, W * 0.36, H * 0.55, W * 0.8);
      g.addColorStop(0, '#6a3cff'); g.addColorStop(0.45, '#2a1458'); g.addColorStop(1, '#0b0a10');
      c.fillStyle = g; c.fillRect(-10, -10, W + 20, H + 20);
      c.save(); c.translate(W * 0.36, H * 0.55);
      for (var i = 0; i < 16; i++) {   // raios girando
        var a = i / 16 * TAU + t * 0.6; c.fillStyle = i % 2 ? 'rgba(120,240,255,0.12)' : 'rgba(255,211,77,0.07)';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * W, Math.sin(a) * W); c.lineTo(Math.cos(a + 0.18) * W, Math.sin(a + 0.18) * W); c.fill();
      }
      c.restore();
      for (var p = 0; p < 26; p++) {   // pixels de energia subindo (os mesmos tons ciano do especial)
        var k = (t * (0.25 + hash(p) * 0.3) + hash(p + 7)) % 1;
        c.globalAlpha = fade * (0.35 + 0.5 * hash(p + 3)); rect(c, p % 3 ? '#5ff0ff' : '#ffffff', (p * 83) % W, H + 6 - k * (H + 20), 2 + (p % 2), 2 + (p % 2));
      }
      c.globalAlpha = fade;
      for (var sl = 0; sl < H; sl += 3) rect(c, 'rgba(0,0,0,0.12)', 0, sl, W, 1);   // linhas de tela de videogame
      // ela pulando: quica 3 vezes, com amasso na hora de tocar o chão
      var me = img(io, 'cena-especial'), hop = Math.abs(Math.sin(t * Math.PI * 1.55)), land = Math.max(0, 1 - hop * 6) * (t < SWAP ? 1 : 0);
      var sc = 0.47 * (1 + ease(0, SWAP, t) * 0.06), mx = W * 0.32, my = H + 8 - hop * 26;
      c.save(); c.translate(mx, my); c.scale(1 + land * 0.06, 1 - land * 0.06);
      c.globalAlpha = fade * 0.35; c.fillStyle = '#000'; c.beginPath(); c.ellipse(0, -6 + hop * 26, 64 * (1 - hop * 0.3), 7, 0, 0, TAU); c.fill(); c.globalAlpha = fade;
      if (me) { c.imageSmoothingEnabled = false; c.drawImage(me, -191.5 * sc, -500 * sc, 383 * sc, 512 * sc); }
      c.restore();
      if (t > 0.3 && io && io.text) balao(c, io, letras('Vamos, Crow!!!', 0.3, 0.95, t), W * 0.5, 26, 10, backOut((t - 0.3) / 0.18), mx + 30, my - 200);
      // o Crow entra pela direita e responde
      var ce = backOut((t - 1.0) / 0.22), crowIm = img(io, 'especial');
      if (t > 1.0 && crowIm) {
        var cs = 1.25 * ce, cx = W * 0.82 + (1 - ease(1.0, 1.2, t)) * 80, cy = H * 0.62 + Math.sin(t * 9) * 3;
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade * 0.35;
        var halo = c.createRadialGradient(cx, cy, 4, cx, cy, 70); halo.addColorStop(0, '#5ff0ff'); halo.addColorStop(1, 'rgba(95,240,255,0)');
        c.fillStyle = halo; c.fillRect(cx - 80, cy - 80, 160, 160); c.restore();
        c.save(); c.translate(cx, cy); c.scale(-cs, cs); c.imageSmoothingEnabled = false;   // virado para ela
        c.drawImage(crowIm, CROW.x, CROW.y, CROW.w, CROW.h, -CROW.w / 2, -CROW.h / 2, CROW.w, CROW.h); c.restore();
        if (t > 1.2 && io && io.text) balao(c, io, letras('Ka-kaw!', 1.2, 1.5, t), W * 0.79, cy - 92, 12, backOut((t - 1.2) / 0.15), cx - 6, cy - 60, '#5ff0ff');
      }
    }
    if (t > SWAP) {   // ---- parte 2: a arena escurece e chove lâmina na horizontal
      var u = t - SWAP;
      if (io && io.cenario) { try { io.cenario(c); } catch (e) {} }   // no jogo a tela da cena vem preta: a arena entra aqui
      c.globalAlpha = fade * 0.62 * ease(SWAP, SWAP + 0.15, t); rect(c, '#06121c', -10, -10, W + 20, H + 20); c.globalAlpha = fade;
      for (var v = 0; v < 26; v++) { var vy = (v * 41) % H, vl = 40 + (v * 53) % 120, vx = (v * 97 + u * 900) % (W + 200) - 160; c.globalAlpha = fade * 0.25; rect(c, '#9ff4ff', vx, vy, vl, 1); }
      c.globalAlpha = fade;
      var lanes = 7;
      for (var b = 0; b < 18; b++) {   // lâminas em faixas, alternando o lado de onde vêm
        var lane = b % lanes, start = 0.08 + (b * 0.071) % 0.9, life = u - start;
        if (life < 0 || life > 0.75) continue;
        var dir = lane % 2 ? -1 : 1, by = 70 + lane * ((H - 96) / (lanes - 1)) + (hash(b) - 0.5) * 10;
        var bx = dir > 0 ? -60 + life * (W + 140) / 0.62 : W + 60 - life * (W + 140) / 0.62;
        lamina(c, bx, by, dir, 46 + hash(b + 2) * 14, t, io);
      }
      // o Crow cruza o alto da tela soltando as lâminas
      var cIm = img(io, 'especial');
      if (cIm && u < 1.2) {
        var fx = -40 + ease(SWAP, SWAP + 1.2, t) * (W + 80);
        c.save(); c.translate(fx, 34 + Math.sin(u * 14) * 4); c.imageSmoothingEnabled = false;
        c.drawImage(cIm, CROW.x, CROW.y, CROW.w, CROW.h, -CROW.w * 0.32, -CROW.h * 0.32, CROW.w * 0.64, CROW.h * 0.64); c.restore();
      }
      if (u < 0.07) { c.globalAlpha = fade * (1 - u / 0.07); rect(c, '#ffffff', -10, -10, W + 20, H + 20); c.globalAlpha = fade; }
    }
    if (t < 0.07) { c.globalAlpha = fade * 0.8; rect(c, '#ffffff', -10, -10, W + 20, H + 20); }
    c.restore();
  }

  // lâminas de verdade da jogada (dados do motor): {x, y, z, vx} em coordenadas do mundo
  function laminas(c, lista, cam, t, io) {
    (lista || []).forEach(function (l) {
      lamina(c, Math.round(l.x - (cam || 0)), Math.round(l.y - (l.z || 0) - 30), l.vx < 0 ? -1 : 1, l.len || 44, t || 0, io);
    });
  }

  var api = { duration: DURATION, cinematic: cinematic, cena: cinematic, laminas: laminas, lamina: lamina, crow: CROW };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.EmanuellyVisual = api;
}(typeof window !== 'undefined' ? window : globalThis));
