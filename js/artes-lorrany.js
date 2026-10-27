/* Lorrany v3 (artes do dono em assets/lorrany): prancheta, fruta arremessada, xícara de café, defesa com a prancheta,
   garra do dreno e a maçã da cena. Só desenho; combate fica no game.js. */
(function () {
  'use strict';
  var rig = window.Rig;
  var original = { draw: rig.draw, big: rig.big, portrait: rig.portrait, ready: rig.ready };
  var NAMES = ['base', 'arremesso', 'xicara', 'defesa', 'garra', 'maca'], images = null;
  // medidas na arte (360x465): chão entre os pés, altura da cabeça ao chão, pernas para a passada e rosto
  var FEET = [165, 455], BODY = 428.35, HEAD = [86.35, 26.65, 120.25, 143];
  var WALK = { waist: 334.75, split: 148.1, strip: 4, legs: [[0, 334.75], [360, 334.75], [360, 465], [0, 465]] };   // abaixo da virilha: as duas pernas já estão separadas
  function load() {
    if (images) return;
    images = {};
    NAMES.forEach(function (n) { var im = new Image(); im.src = 'assets/lorrany/' + n + '.webp?v=3'; images[n] = im; });
  }
  function loaded() { load(); return NAMES.every(function (n) { return images[n].complete && images[n].naturalWidth > 0; }); }
  window.LorranyArt = { img: function (n) { load(); return images[n]; }, ready: loaded };
  function poseFor(state, opts) {
    if (opts.guard || state === 'guard') return 'defesa';
    if (state === 'cutin' || state === 'victory') return 'maca';
    if (state === 'special') return 'garra';
    if (state === 'throw' || opts.airThrow && state === 'jump') return 'arremesso';
    if (state === 'attack1' || state === 'attack2') return 'xicara';
    return 'base';
  }
  var walkLayers = null;
  function prepareWalk(img) {
    function canvas() { var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; return c; }
    function polygon(c) { c.beginPath(); WALK.legs.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); }
    var legs = canvas(), body = canvas(), l = legs.getContext('2d'), b = body.getContext('2d');
    l.save(); polygon(l); l.clip(); l.drawImage(img, 0, 0); l.restore();
    b.drawImage(img, 0, 0); b.globalCompositeOperation = 'destination-out'; polygon(b); b.fill(); b.globalCompositeOperation = 'source-over';
    return { legs: legs, body: body };
  }
  function walk(ctx, img, k, t) {   // passada: cada perna em faixas que balançam mais perto do pé (mesma técnica do Ricardo)
    if (!walkLayers) walkLayers = prepareWalk(img);
    var span = FEET[1] - WALK.waist;
    for (var leg = 0; leg < 2; leg++) {
      var phase = t * 11 + leg * Math.PI, stride = Math.sin(phase) * 7, lift = Math.max(0, Math.cos(phase)) * 3, compression = 1 - lift / (span * k);
      var sx = leg ? WALK.split : 0, sw = leg ? img.naturalWidth - WALK.split : WALK.split;
      for (var sy = WALK.waist; sy < img.naturalHeight; sy += WALK.strip) {
        var sh = Math.min(WALK.strip, img.naturalHeight - sy), depth = Math.min(1, Math.max(0, (sy + sh / 2 - WALK.waist) / span));
        var dx = (sx - FEET[0]) * k + stride * depth + lift * 0.75 * Math.sin(depth * Math.PI);
        var dy = (WALK.waist - FEET[1]) * k + (sy - WALK.waist) * k * compression;
        ctx.drawImage(walkLayers.legs, sx, sy, sw, sh, dx, dy, sw * k, sh * k * compression + 0.03);
      }
    }
    ctx.drawImage(walkLayers.body, -FEET[0] * k, -FEET[1] * k, img.naturalWidth * k, img.naturalHeight * k);
  }
  function draw(ctx, state, t, x, y, facing, opts) {
    opts = opts || {};
    var name = poseFor(state, opts), img = images[name], k = rig.height / BODY;
    var bob = state === 'walk' ? -Math.abs(Math.sin(t * 11)) * 0.6 : state === 'idle' ? -Math.abs(Math.sin(t * 4)) * 0.5 : 0;
    var lean = state === 'walk' ? Math.sin(t * 11) * 0.012 : state === 'hurt' ? -0.12 * Math.max(0, 1 - t / 0.3) : state === 'special' ? Math.sin(t * 30) * 0.01 : 0;
    if (state === 'ko') lean = -Math.PI / 2 * Math.min(1, t / 0.3);
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(facing < 0 ? -1 : 1, 1); ctx.rotate(lean);
    if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
    ctx.imageSmoothingEnabled = false;
    if (opts.flash) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 3; }
    if (state === 'walk') walk(ctx, img, k, t);
    else ctx.drawImage(img, -FEET[0] * k, -FEET[1] * k, img.naturalWidth * k, img.naturalHeight * k);
    ctx.restore(); return true;
  }
  rig.ready = function (who) { return who === 'nutri' ? loaded() : original.ready.apply(rig, arguments); };
  rig.draw = function (ctx, who, state, t, x, y, facing, opts) {
    if (who !== 'nutri') return original.draw.apply(rig, arguments);
    return loaded() ? draw(ctx, state, t || 0, x, y, facing, opts) : true;
  };
  rig.big = function (ctx, who, state, t, x, y, facing, scale) {
    if (who !== 'nutri') return original.big.apply(rig, arguments);
    if (!loaded()) return true;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); draw(ctx, state, t || 0, 0, 0, facing, {}); ctx.restore(); return true;
  };
  rig.portrait = function (ctx, who, x, y) {
    if (who !== 'nutri') return original.portrait.apply(rig, arguments);
    if (!loaded()) return true;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(images.base, HEAD[0], HEAD[1], HEAD[2], HEAD[3], x, y, 28, 28); ctx.restore(); return true;
  };
  // Centro da prancheta na tela: compartilha a medida do visual do dreno.
  rig.lorranyClaw = function (x, y, facing) {
    var claw = window.LorranyVisual && window.LorranyVisual.claw || { x: 190, y: 210 }, k = rig.height / BODY;
    return { x: x + facing * (claw.x - FEET[0]) * k, y: y + (claw.y - FEET[1]) * k };
  };
}());
