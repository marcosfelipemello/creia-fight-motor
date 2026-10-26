/* Poses da Adriene (artes enviadas, recortadas em assets/adriene). Cadeirante: andar = mãos empurrando os aros
   com as rodas girando; pulo = empina a cadeira nas rodas de trás. Só desenho; combate fica no game.js. */
(function () {
  'use strict';
  var rig = window.Rig, V = window.AdrieneVisual;
  var original = { draw: rig.draw, big: rig.big, portrait: rig.portrait, ready: rig.ready, item: rig.item };
  var NAMES = ['base', 'andar-a', 'andar-b', 'primario', 'secundario', 'defesa', 'especial'], images = null;
  // medidas na arte (350x456): chão sob as rodas, altura da cabeça ao chão, roda grande e rosto
  var FEET = [165, 449], BODY = 444, HEIGHT = 70, WHEEL = { x: 76.5, y: 357.5, rx: 45.5, ry: 84.5 }, HEAD = [85, 4, 145, 145];
  function load() {
    if (images) return;
    images = {};
    NAMES.forEach(function (n) { var im = new Image(); im.src = 'assets/adriene/' + n + '.webp?v=1'; images[n] = im; });
  }
  function loaded() { load(); return NAMES.every(function (n) { return images[n].complete && images[n].naturalWidth > 0; }); }
  function poseFor(state, t, opts) {
    if (opts.guard || state === 'guard') return 'defesa';
    if (state === 'special' || state === 'cutin' || state === 'victory') return 'especial';
    if (state === 'throw' || opts.airThrow && state === 'jump') return 'primario';
    if (state === 'attack1' || state === 'attack2') return 'secundario';
    if (state === 'walk') return t % 0.5 < 0.25 ? 'andar-a' : 'andar-b';   // empurra o aro: mão em cima, mão na frente
    return 'base';
  }
  function draw(ctx, state, t, x, y, facing, opts) {
    opts = opts || {};
    var name = poseFor(state, t, opts), img = images[name], k = HEIGHT / BODY;
    var bob = state === 'walk' ? -Math.abs(Math.sin(t * 2 * Math.PI)) * 0.8 : state === 'idle' ? -Math.abs(Math.sin(t * 3)) * 0.4 : 0;
    var tilt = 0;   // gira em torno da roda de trás, que fica no chão
    if (state === 'jump') tilt = -0.3 * Math.min(1, t / 0.12);   // empina
    else if (state === 'hurt') tilt = -0.14 * Math.max(0, 1 - t / 0.3);
    else if (state === 'ko') tilt = -1.15 * Math.min(1, t / 0.35);   // tomba para trás, apoiada nas manoplas
    else if (state === 'attack2' || state === 'attack1') tilt = 0.05 * Math.sin(Math.min(1, t / 0.25) * Math.PI);
    var px = (WHEEL.x - FEET[0]) * k;
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(facing < 0 ? -1 : 1, 1);
    ctx.translate(px, 0); ctx.rotate(tilt); ctx.translate(-px, 0);
    if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
    ctx.imageSmoothingEnabled = false;
    if (opts.flash) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 3; }
    ctx.drawImage(img, -FEET[0] * k, -FEET[1] * k, img.naturalWidth * k, img.naturalHeight * k);
    ctx.shadowBlur = 0;
    if (state === 'walk' && V) { ctx.save(); ctx.scale(k, k); ctx.translate(-FEET[0], -FEET[1]); V.wheelSpin(ctx, WHEEL, t * 9, k, 1); ctx.restore(); }
    ctx.restore(); return true;
  }
  rig.ready = function (who) { return who === 'adriene' ? loaded() : original.ready.apply(rig, arguments); };
  rig.draw = function (ctx, who, state, t, x, y, facing, opts) {
    if (who !== 'adriene') return original.draw.apply(rig, arguments);
    return loaded() ? draw(ctx, state, t || 0, x, y, facing, opts) : true;
  };
  rig.big = function (ctx, who, state, t, x, y, facing, scale) {
    if (who !== 'adriene') return original.big.apply(rig, arguments);
    if (!loaded()) return true;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); draw(ctx, state, t || 0, 0, 0, facing, {}); ctx.restore(); return true;
  };
  rig.portrait = function (ctx, who, x, y) {
    if (who !== 'adriene') return original.portrait.apply(rig, arguments);
    if (!loaded()) return true;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(images.base, HEAD[0], HEAD[1], HEAD[2], HEAD[3], x, y, 28, 28); ctx.restore(); return true;
  };
  rig.item = function (ctx, kind, x, y, rot, scale) {
    if (kind !== 'adr-brig') return original.item.apply(rig, arguments);
    if (!V) return false;
    V.brigadeiro(ctx, x, y, 4.5 * (scale == null ? 1 : scale), rot || 0); return true;
  };
}());
