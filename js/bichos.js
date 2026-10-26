/* Bichos de rua do Bangu: peças HD em cache 2x; patas no chão em x,y. */
(function () {
  'use strict';

  var INK = '#30242d', TAU = Math.PI * 2;
  var KINDS = ['rato', 'barata', 'cachorro'];
  var CACHE = Object.create(null);
  // largura, altura e posição do pivô dentro da peça, em unidades lógicas.
  var BOX = {
    body: [42, 30, 21, 27],
    leg: [22, 20, 11, 4],
    tail: [28, 18, 20, 10],
    antenna: [24, 18, 8, 14]
  };

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
  function line(c, x1, y1, x2, y2, color, sw) {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
    c.strokeStyle = color; c.lineWidth = sw; c.lineCap = 'round'; c.stroke();
  }
  function curve(c, x0, y0, cx, cy, x1, y1, color, sw) {
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1);
    c.strokeStyle = color; c.lineWidth = sw; c.lineCap = 'round'; c.stroke();
  }

  function mouse(c, part) {
    if (part === 'body') {
      oval(c, -1.2, -4.5, 6.2, 3.6, '#665e61', INK, 1.2);
      oval(c, -1.7, -5.2, 5.4, 2.5, '#968784');
      oval(c, 4.8, -5.3, 3.2, 2.6, '#746b6e', INK, 1);
      oval(c, 2.7, -8, 1.7, 2, '#9b898a', INK, 0.8);
      oval(c, 2.8, -8.2, 0.9, 1.2, '#d78c9b');
      oval(c, 5.9, -8.1, 1.6, 1.9, '#8c7c7e', INK, 0.7);
      oval(c, 5.9, -8.3, 0.8, 1.1, '#d78c9b');
      oval(c, 7.4, -4.6, 1.5, 1.2, '#c4aeb0');
      oval(c, 8.6, -4.7, 0.8, 0.65, '#e99dad', INK, 0.4);
      oval(c, 5.9, -6.3, 0.8, 1, '#fff7e7', INK, 0.35);
      oval(c, 6.3, -6.2, 0.45, 0.6, INK);
      line(c, 5.5, -7.7, 7, -7.3, INK, 0.65);
      line(c, 7, -4.2, 10.7, -5.4, '#4d4249', 0.45);
      line(c, 7, -4, 10.8, -3.8, '#4d4249', 0.45);
      line(c, 6.9, -3.8, 10.2, -2.5, '#4d4249', 0.45);
      oval(c, -3.4, -6, 1.6, 0.55, '#b8aaa3');
    } else if (part === 'tail') {
      curve(c, 0, 0, -6, -0.6, -10, -2, INK, 1.8);
      curve(c, -10, -2, -13, -4.7, -16, -2.2, INK, 1.8);
      curve(c, 0, 0, -6, -0.6, -10, -2, '#d591a1', 0.95);
      curve(c, -10, -2, -13, -4.7, -16, -2.2, '#d591a1', 0.95);
    } else if (part === 'leg') {
      line(c, 0, 0, 0.5, 2.4, INK, 1.2);
      oval(c, 1.5, 2.6, 1.9, 0.85, '#bc8c94', INK, 0.55);
    }
  }

  function roach(c, part) {
    if (part === 'body') {
      oval(c, -0.4, -3.7, 6.4, 2.6, '#6b2d28', INK, 1.1);
      oval(c, -1.1, -4.4, 5.2, 1.7, '#a75035');
      curve(c, -5, -4.2, -0.8, -5.9, 4.5, -4.1, '#672a26', 0.65);
      oval(c, 5.2, -3.8, 2.1, 1.7, '#8f3f2d', INK, 0.8);
      oval(c, 6.4, -4.2, 0.55, 0.65, '#fff4dc', INK, 0.35);
      oval(c, 6.6, -4.1, 0.29, 0.4, INK);
      line(c, 4.9, -5.4, 6.3, -5.3, INK, 0.55);
      oval(c, -2.1, -5.3, 2.5, 0.55, '#ec9a5b');
      oval(c, 0.7, -4.9, 0.8, 0.4, '#f7b578');
    } else if (part === 'nearLeg') {
      line(c, 0, 0, 0.8, 1.8, INK, 0.9);
      line(c, 0.8, 1.8, 2.1, 2.8, '#9e573e', 0.8);
      line(c, 2.1, 2.8, 3.1, 2.7, INK, 0.65);
    } else if (part === 'farLeg') {
      line(c, 0, 0, -1.2, 1.4, '#54252a', 0.8);
      line(c, -1.2, 1.4, -2.2, 2, '#7b3a2e', 0.65);
    } else if (part === 'antenna') {
      curve(c, 0, 0, 3.3, -8.8, 10.5, -8.3, INK, 0.75);
      curve(c, 0.3, 0, 6, -5.8, 13.6, -4.7, INK, 0.7);
      oval(c, 10.5, -8.3, 0.5, 0.5, '#ac6543');
      oval(c, 13.6, -4.7, 0.5, 0.5, '#ac6543');
    }
  }

  function dog(c, part) {
    if (part === 'body') {
      // Silhueta magrinha, cabeça grande, orelha mole e língua de fora.
      oval(c, -2.4, -12.7, 9.2, 4.2, '#a96730', INK, 1.5);
      oval(c, -2.4, -13.6, 8.2, 2.5, '#e4a652');
      oval(c, -8, -11.9, 2.7, 3.3, '#c27f38');
      poly(c, [[4,-16],[7,-19],[10,-16],[8,-11],[4,-10]], '#c8833b', INK, 1.1);
      oval(c, 9, -17, 5.1, 5.2, '#d58a3d', INK, 1.5);
      oval(c, 8.2, -18.2, 3.5, 3, '#efb55d');
      poly(c, [[5.4,-19.7],[6.5,-23],[9,-21.1],[8.5,-16.5]], '#86512d', INK, 1);
      oval(c, 12.4, -14.4, 3, 2.4, '#e9ae5d', INK, 0.9);
      oval(c, 14.9, -15.2, 1.2, 0.9, '#382e32');
      oval(c, 10.2, -18.1, 1, 1.25, '#fff9df', INK, 0.45);
      oval(c, 10.6, -18.1, 0.5, 0.65, INK);
      line(c, 9.1, -20, 11.2, -19.8, '#744123', 0.8);
      curve(c, 11.8, -12.8, 13.1, -12, 14.9, -13.2, '#603927', 0.75);
      poly(c, [[12,-12.5],[14.2,-12.3],[13.8,-9.3],[12.7,-9]],
        '#e66e73', '#923f48', 0.6);
      oval(c, -5, -15, 3, 0.65, '#f4c876');
    } else if (part === 'tail') {
      curve(c, 0, 0, -2.1, -5.8, -8.5, -5.8, INK, 3.5);
      curve(c, 0, 0, -2.1, -5.8, -8.5, -5.8, '#c17b37', 2.2);
      oval(c, -8.2, -5.8, 2.1, 1.6, '#dc9948', INK, 0.75);
    } else if (part === 'nearLeg' || part === 'farLeg') {
      var far = part === 'farLeg';
      poly(c, [[-2.7,-1],[2.5,-1],[2.2,5.8],[1.2,8.6],[-1.9,8.6],[-2.2,5.2]],
        far ? '#ad6b34' : '#d38b41', INK, 1.15);
      oval(c, 1.3, 8.6, 3, 1.3, far ? '#a16433' : '#e2a150', INK, 0.8);
      line(c, -1.2, 1.1, -0.6, 5.8, far ? '#c58b4d' : '#efb968', 0.75);
    }
  }

  function makePart(kind, part) {
    var key = kind + ':' + part;
    if (CACHE[key]) return CACHE[key];
    if (typeof document === 'undefined' || !document.createElement) return null;
    var box = BOX[part === 'nearLeg' || part === 'farLeg' ? 'leg' : part];
    var canvas = document.createElement('canvas');
    canvas.width = box[0] * 2; canvas.height = box[1] * 2;
    var c = canvas.getContext('2d');
    if (!c) return null;
    c.scale(2, 2); c.translate(box[2], box[3]);
    if (kind === 'rato') mouse(c, part);
    else if (kind === 'barata') roach(c, part);
    else dog(c, part);
    CACHE[key] = canvas;
    return canvas;
  }
  function place(ctx, image, part) {
    var box = BOX[part === 'nearLeg' || part === 'farLeg' ? 'leg' : part];
    ctx.drawImage(image, -box[2], -box[3], box[0], box[1]);
  }
  function joint(ctx, image, part, x, y, angle) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    place(ctx, image, part); ctx.restore();
  }

  function drawMouse(ctx, t) {
    var step = Math.sin(t * 24), bounce = Math.abs(Math.sin(t * 24)) * 0.4;
    ctx.translate(0, -bounce);
    joint(ctx, makePart('rato', 'tail'), 'tail', -6.4, -5, 0.18 * Math.sin(t * 15));
    var leg = makePart('rato', 'leg');
    for (var j = 0; j < 4; j++) {
      joint(ctx, leg, 'leg', -4 + j * 2.8, -2.7,
        (j % 2 ? -1 : 1) * 0.34 * step);
    }
    place(ctx, makePart('rato', 'body'), 'body');
  }
  function drawRoach(ctx, t) {
    var step = Math.sin(t * 36);
    var far = makePart('barata', 'farLeg'), near = makePart('barata', 'nearLeg');
    for (var j = 0; j < 3; j++) {
      var angle = (j % 2 ? -1 : 1) * 0.32 * Math.sin(t * 36 + j * 1.3);
      joint(ctx, far, 'farLeg', -4.5 + j * 4.1, -3.6, -angle);
    }
    ctx.translate(0, -Math.abs(step) * 0.22);
    place(ctx, makePart('barata', 'body'), 'body');
    for (var k = 0; k < 3; k++) {
      var frontAngle = (k % 2 ? -1 : 1) * 0.32 * Math.sin(t * 36 + k * 1.3);
      joint(ctx, near, 'nearLeg', -4.5 + k * 4.1, -2.8, frontAngle);
    }
    joint(ctx, makePart('barata', 'antenna'), 'antenna', 5.7, -5.1,
      0.17 * Math.sin(t * 20));
  }
  function drawDog(ctx, t) {
    var step = Math.sin(t * 17), bounce = Math.abs(Math.sin(t * 17)) * 1.25;
    ctx.translate(0, -bounce);
    var far = makePart('cachorro', 'farLeg'), near = makePart('cachorro', 'nearLeg');
    joint(ctx, makePart('cachorro', 'tail'), 'tail', -10.5, -14.5,
      0.37 * Math.sin(t * 18));
    joint(ctx, far, 'farLeg', -6.6, -9.3, 0.42 * step);
    joint(ctx, far, 'farLeg', 6.2, -9.4, -0.42 * step);
    place(ctx, makePart('cachorro', 'body'), 'body');
    joint(ctx, near, 'nearLeg', -8, -9.1, -0.45 * step);
    joint(ctx, near, 'nearLeg', 7.8, -9.5, 0.45 * step);
  }

  function draw(ctx, kind, t, x, y, facing) {
    if (!ctx || KINDS.indexOf(kind) < 0) return false;
    t = typeof t === 'number' && isFinite(t) ? t : 0;
    ctx.save(); ctx.translate(x, y);
    if (facing === -1) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = true;
    if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';
    if (kind === 'rato') drawMouse(ctx, t);
    else if (kind === 'barata') drawRoach(ctx, t);
    else drawDog(ctx, t);
    ctx.restore();
    return true;
  }

  if (typeof window !== 'undefined') window.Bichos = { kinds: KINDS.slice(), draw: draw };
})();
