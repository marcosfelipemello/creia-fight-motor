/* Crianças do especial da Grazi: seis corredores em peças HD de 2x. */
(function () {
  'use strict';

  var INK = '#302435';
  var TAU = Math.PI * 2;
  var KIDS = [
    { h: 34, skin: '#70402e', shade: '#4c2a25', light: '#a96b49', hair: '#251b30',
      shirt: '#eaf5fa', dark: '#2773b5', trim: '#ffffff', pants: '#28558a', shoe: '#f6e1ae', type: 'afro' },
    { h: 33, skin: '#bd8057', shade: '#8b573e', light: '#dfae7b', hair: '#4d2730',
      shirt: '#f9f5e9', dark: '#c73543', trim: '#ffffff', pants: '#b53244', shoe: '#faf1dc', type: 'pigtails' },
    { h: 32, skin: '#945538', shade: '#633827', light: '#c58154', hair: '#392833',
      shirt: '#f3c646', dark: '#e58f36', trim: '#fff1a2', pants: '#4c9a63', shoe: '#e9f0c7', type: 'curly' },
    { h: 31, skin: '#edba91', shade: '#b57863', light: '#ffe0ae', hair: '#292338',
      shirt: '#a879c5', dark: '#7952a2', trim: '#e8c6f6', pants: '#8054a6', shoe: '#f6d6e8', type: 'fringe' },
    { h: 33, skin: '#bd8154', shade: '#83543a', light: '#e7ae75', hair: '#593b2c',
      shirt: '#f18d4b', dark: '#cc5739', trim: '#fff1c9', pants: '#3f81a5', shoe: '#f7e7bb', type: 'cap' },
    { h: 34, skin: '#68412f', shade: '#422b26', light: '#996b4a', hair: '#25202d',
      shirt: '#48b9af', dark: '#237c86', trim: '#ddf6d6', pants: '#377a83', shoe: '#f0cc82', type: 'braids' }
  ];
  var BASE_HEIGHT = [36, 34, 35, 34, 34, 34];
  var CACHE = Object.create(null);

  function oval(c, x, y, rx, ry, fill, stroke, sw) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
    c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw || 1; c.stroke(); }
  }
  function poly(c, p, fill, stroke, sw) {
    c.beginPath(); c.moveTo(p[0][0], p[0][1]);
    for (var n = 1; n < p.length; n++) c.lineTo(p[n][0], p[n][1]);
    c.closePath(); c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw || 1; c.stroke(); }
  }
  function line(c, x1, y1, x2, y2, color, width) {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
    c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.stroke();
  }
  function round(c, x, y, w, h, r, fill, stroke, sw) {
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw || 1; c.stroke(); }
  }
  function star(c, x, y, r, color) {
    poly(c, [[x,y-r],[x+r*0.22,y-r*0.22],[x+r,y],[x+r*0.22,y+r*0.22],
      [x,y+r],[x-r*0.22,y+r*0.22],[x-r,y],[x-r*0.22,y-r*0.22]], color);
  }

  // Todas as coordenadas das peças do tronco e da cabeça usam os pés em (0,0).
  function torso(c, kid) {
    var p = KIDS[kid];
    oval(c, 0, -9.5, 6.1, 3.3, p.pants, INK, 1.5);
    poly(c, [[-6,-18],[-3,-20],[4,-20],[7,-17],[6,-9],[-6,-9]], p.dark, INK, 1.7);
    poly(c, [[-4.6,-18],[3.3,-18],[4.6,-10],[-4.8,-10]], p.shirt);
    if (kid === 0) {
      // Uniforme azul e branco.
      line(c, -2.5, -18, -2.5, -10.5, p.dark, 1.8);
      line(c, 2.1, -18, 2.1, -10.5, p.dark, 1.8);
      poly(c, [[-3,-19],[0,-16.5],[3,-19]], '#ffffff', INK, 0.5);
    } else if (kid === 1) {
      // Listras do Bangu.
      for (var j = -3; j <= 3; j += 3) line(c, j, -17.5, j, -11, p.dark, 1.6);
      oval(c, 0, -14.5, 1, 1, '#e5b94c');
    } else if (kid === 3) {
      // Vestidinho por cima do tronco.
      poly(c, [[-5,-17],[5,-17],[8,-8],[-8,-8]], p.shirt, INK, 1.5);
      line(c, -6, -9, 6, -9, p.trim, 1.2);
    } else if (kid === 5) {
      line(c, -3, -18, 3, -18, p.trim, 1.2);
      star(c, 0, -14, 2.2, p.trim);
    } else {
      line(c, -3, -17.5, 3, -17.5, p.trim, 1.2);
      if (kid === 4) oval(c, 1, -14, 2.1, 2.1, '#ffe1a1');
    }
    line(c, -4.5, -16, -3, -12, p.light, 0.8);
    oval(c, 0, -20.7, 2.5, 2.3, p.skin, INK, 1);
  }

  function hair(c, kid, p) {
    if (p.type === 'afro') {
      for (var a = 0; a < 9; a++) {
        var angle = Math.PI + a * Math.PI / 8;
        oval(c, Math.cos(angle) * 9.3, -25.1 + Math.sin(angle) * 7.3,
          3.4, 3.3, p.hair, INK, 0.8);
      }
      oval(c, 0, -29.5, 10, 5.8, p.hair, INK, 1.2);
      oval(c, -3.7, -31, 1.6, 0.8, '#48354a');
    } else if (p.type === 'pigtails') {
      oval(c, -12, -24, 3.8, 6, p.hair, INK, 1.3);
      oval(c, 12, -24, 3.8, 6, p.hair, INK, 1.3);
      oval(c, 0, -30, 10.2, 4.8, p.hair, INK, 1.2);
      oval(c, -11, -28, 1.6, 1.3, '#eb829a');
      oval(c, 11, -28, 1.6, 1.3, '#eb829a');
      line(c, -2, -30, 0, -28, '#79504c', 0.8);
    } else if (p.type === 'curly') {
      for (var b = 0; b < 8; b++) {
        var angle2 = Math.PI + b * Math.PI / 7;
        oval(c, Math.cos(angle2) * 8.7, -25 + Math.sin(angle2) * 6.9,
          2.6, 2.7, p.hair, INK, 0.8);
      }
      oval(c, 0, -29.5, 9.5, 4.2, p.hair, INK, 1);
    } else if (p.type === 'fringe') {
      oval(c, -8.7, -24, 2.7, 7.1, p.hair, INK, 1);
      oval(c, 8.7, -24, 2.7, 7.1, p.hair, INK, 1);
      poly(c, [[-10,-29],[-7,-32],[8,-32],[10,-28],[5,-27],[1,-29],[-2,-26],[-6,-28]],
        p.hair, INK, 1.2);
      line(c, -5, -30, 4, -30, '#50415f', 0.8);
    } else if (p.type === 'cap') {
      oval(c, 0, -29.5, 8.8, 4, p.hair);
      poly(c, [[-10,-30],[-6,-34],[8,-33],[11,-29],[4,-28],[-8,-28]],
        '#3882ae', INK, 1.3);
      poly(c, [[5,-29],[14,-29],[16,-27],[7,-27]], '#27638c', INK, 1);
      line(c, -5, -32, 3, -32, '#91c7de', 1);
    } else if (p.type === 'braids') {
      oval(c, -9.6, -21.8, 2.4, 7, p.hair, INK, 1);
      oval(c, 9.6, -21.8, 2.4, 7, p.hair, INK, 1);
      for (var d = 0; d < 3; d++) {
        oval(c, -9.5 + d % 2 * 0.7, -23 + d * 3, 1.8, 1.6, '#44303d');
        oval(c, 9.5 - d % 2 * 0.7, -23 + d * 3, 1.8, 1.6, '#44303d');
      }
      oval(c, -9.5, -14, 1.5, 1.5, '#eadc8d');
      oval(c, 9.5, -14, 1.5, 1.5, '#eadc8d');
      oval(c, 0, -30, 9.7, 4, p.hair, INK, 1);
      line(c, 0, -32, 0, -28, '#584455', 0.9);
    }
  }

  function head(c, kid, hit) {
    var p = KIDS[kid];
    oval(c, -9, -24, 2.1, 3.2, p.skin, INK, 0.9);
    oval(c, 9, -24, 2.1, 3.2, p.skin, INK, 0.9);
    oval(c, 0, -25, 9.4, 8.6, p.shade, INK, 1.8);
    oval(c, -0.7, -25.8, 8.4, 7.8, p.skin);
    oval(c, -4.9, -27.4, 1.8, 2.8, p.light);
    hair(c, kid, p);
    for (var e = 0; e < 2; e++) {
      var ex = e ? 4 : -3.3;
      oval(c, ex, -25.4, 1.6, 2.25, '#fffaf1', INK, 0.5);
      oval(c, ex + 0.55, -25.2, 0.75, 1.25, INK);
      oval(c, ex + 0.7, -26, 0.28, 0.4, '#ffffff');
    }
    line(c, -5.1, -29, -2.2, -29.5, p.hair, 0.9);
    line(c, 2.4, -29.5, 5.4, -28.9, p.hair, 0.9);
    oval(c, -5.4, -21.4, 1.4, 0.8, p.light);
    oval(c, 5.3, -21.4, 1.4, 0.8, p.light);
    if (hit) {
      oval(c, 1, -20.4, 3.3, 2.8, '#713743', INK, 0.7);
      line(c, -0.8, -22.2, 2.6, -22.2, '#fff8e9', 1);
      star(c, 10.5, -22, 3.2, '#ffef87');
    } else {
      oval(c, 0.5, -20.7, 2.8, 2.2, '#713743', INK, 0.6);
      line(c, -0.7, -21.7, 2.4, -21.7, '#fff7e4', 0.9);
    }
  }

  // Membro com encaixe em (0,0); o desenho ocupa 16x18 unidades.
  function limb(c, kid, part, back) {
    var p = KIDS[kid];
    if (part === 'arm') {
      round(c, -2.9, -0.5, 5.8, 6.8, 2.3, back ? p.dark : p.shirt, INK, 1.4);
      round(c, -2, 5, 4, 5.4, 1.8, back ? p.shade : p.skin, INK, 1.1);
      oval(c, 0, 10.2, 2.2, 2.1, back ? p.shade : p.skin, INK, 0.8);
      line(c, -1.1, 1, -0.8, 4, p.trim, 0.8);
    } else {
      round(c, -3, -1, 6, 6, 2, p.pants, INK, 1.3);
      round(c, -2.3, 4, 4.6, 5.2, 1.6, back ? p.shade : p.skin, INK, 1);
      oval(c, 1.5, 9.1, 4.1, 2.3, p.shoe, INK, 1.1);
      line(c, 0, 8.8, 3.8, 8.8, '#ffffff', 0.7);
    }
  }

  function makePart(kid, part, hit) {
    var key = kid + ':' + part + ':' + (hit ? 'hit' : 'normal');
    if (CACHE[key]) return CACHE[key];
    if (typeof document === 'undefined' || !document.createElement) return null;
    var big = part === 'head' || part === 'torso';
    var w = big ? 42 : 16, h = big ? 42 : 18;
    var canvas = document.createElement('canvas');
    canvas.width = w * 2; canvas.height = h * 2;
    var c = canvas.getContext('2d');
    if (!c) return null;
    c.scale(2, 2);
    c.translate(w / 2, big ? 38 : 2);
    if (part === 'head') head(c, kid, hit);
    else if (part === 'torso') torso(c, kid);
    else limb(c, kid, part === 'backArm' ? 'arm' : part === 'backLeg' ? 'leg' : part,
      part === 'backArm' || part === 'backLeg');
    CACHE[key] = canvas;
    return canvas;
  }

  function drawPart(ctx, image, big) {
    if (big) ctx.drawImage(image, -21, -38, 42, 42);
    else ctx.drawImage(image, -8, -2, 16, 18);
  }
  function joint(ctx, image, x, y, angle) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    drawPart(ctx, image, false); ctx.restore();
  }
  function draw(ctx, i, t, x, y, facing, opts) {
    if (!ctx || i !== (i | 0) || i < 0 || i >= 6) return false;
    t = typeof t === 'number' && isFinite(t) ? t : 0;
    opts = opts || {};
    var headImage = makePart(i, 'head', !!opts.hit);
    var torsoImage = makePart(i, 'torso', false);
    var frontArm = makePart(i, 'arm', false), backArm = makePart(i, 'backArm', false);
    var frontLeg = makePart(i, 'leg', false), backLeg = makePart(i, 'backLeg', false);
    if (!headImage || !torsoImage || !frontArm || !backArm || !frontLeg || !backLeg) return false;
    var phase = t * (11.3 + i * 0.43) + i * 0.84;
    var stride = Math.sin(phase), bounce = Math.abs(Math.sin(phase));
    ctx.save();
    ctx.translate(x, y - bounce * (0.9 + i * 0.08));
    if (facing === -1) ctx.scale(-1, 1);
    ctx.scale(1, KIDS[i].h / BASE_HEIGHT[i]);
    ctx.rotate(0.10 + 0.018 * Math.sin(phase));
    ctx.imageSmoothingEnabled = true;
    if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';
    joint(ctx, backLeg, -3.2, -8.8, 0.40 * stride);
    joint(ctx, backArm, -6.1, -17.3, -0.48 * stride - 0.13);
    drawPart(ctx, torsoImage, true);
    joint(ctx, frontLeg, 3.2, -8.8, -0.40 * stride);
    joint(ctx, frontArm, 6.1, -17.3, 0.48 * stride - 0.13);
    ctx.save(); ctx.translate(0, -0.35 * bounce); drawPart(ctx, headImage, true); ctx.restore();
    if (opts.hit) {
      ctx.fillStyle = '#fff4a0';
      for (var s = 0; s < 3; s++) {
        var sx = 11 + s * 2.2, sy = -28 + s * 4;
        ctx.fillRect(sx, sy, 2.1 - s * 0.35, 2.1 - s * 0.35);
      }
    }
    ctx.restore();
    return true;
  }

  if (typeof window !== 'undefined') window.Criancas = { count: 6, draw: draw };
})();
