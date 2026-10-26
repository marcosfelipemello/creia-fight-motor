/* Treze lacaios de comida: arte HD em cache, com os pés em x,y. */
(function () {
  'use strict';

  var SIZES = {
    pastel: [40, 30], brigadeiro: [26, 28], salsicha: [30, 44],
    pipoca: [34, 40], sorvete: [28, 46], donut: [38, 36],
    chips: [32, 42], nugget: [26, 26], milkshake: [30, 48],
    pizzinha: [36, 34], acucar: [30, 30], bala: [28, 24],
    churros: [22, 50]
  };
  var FACE = {
    pastel: [20, 14, 7, 2.8, 21], brigadeiro: [13, 12, 5, 3.6, 20],
    salsicha: [15, 18, 5, 2.5, 27], pipoca: [17, 22, 6, 2.7, 31],
    sorvete: [14, 19, 5, 2.5, 28], donut: [19, 15, 8, 2.8, 28],
    chips: [16, 23, 6, 2.8, 32], nugget: [13, 12, 5, 2.6, 19],
    milkshake: [15, 26, 5, 2.5, 34], pizzinha: [18, 16, 7, 2.8, 25],
    acucar: [15, 13, 5.5, 2.8, 22], bala: [14, 10, 5, 2.8, 18],
    churros: [11, 23, 3.5, 2.2, 32]
  };
  var CACHE = Object.create(null), INK = '#2a1c29';
  var TAU = Math.PI * 2;

  function rect(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  }
  function oval(c, x, y, rx, ry, fill, edge, width) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
    c.fillStyle = fill; c.fill();
    if (edge) { c.lineWidth = width || 1.5; c.strokeStyle = edge; c.stroke(); }
  }
  function poly(c, points, fill, edge, width) {
    c.beginPath(); c.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
    c.closePath(); c.fillStyle = fill; c.fill();
    if (edge) { c.strokeStyle = edge; c.lineWidth = width || 1.5; c.stroke(); }
  }
  function round(c, x, y, w, h, radius, fill, edge, width) {
    var rr = Math.min(radius, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + rr, y); c.lineTo(x + w - rr, y);
    c.quadraticCurveTo(x + w, y, x + w, y + rr);
    c.lineTo(x + w, y + h - rr);
    c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    c.lineTo(x + rr, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - rr);
    c.lineTo(x, y + rr); c.quadraticCurveTo(x, y, x + rr, y);
    c.closePath(); c.fillStyle = fill; c.fill();
    if (edge) { c.strokeStyle = edge; c.lineWidth = width || 1.5; c.stroke(); }
  }
  function line(c, x1, y1, x2, y2, color, width) {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
    c.strokeStyle = color; c.lineWidth = width || 1; c.lineCap = 'round'; c.stroke();
  }
  function shine(c, x, y, w) {
    oval(c, x, y, w, Math.max(0.5, w * 0.25), '#fff6da');
    rect(c, x + w + 0.8, y - 1.2, 0.8, 0.8, '#ffffff');
  }
  function feet(c, w, h, color) {
    line(c, w * 0.34, h - 8, w * 0.32, h - 2, INK, 2.4);
    line(c, w * 0.67, h - 8, w * 0.69, h - 2, INK, 2.4);
    oval(c, w * 0.28, h - 2.2, 3.4, 1.7, color || '#5d3841', INK, 1);
    oval(c, w * 0.73, h - 2.2, 3.4, 1.7, color || '#5d3841', INK, 1);
  }
  function arms(c, w, h, y, color) {
    line(c, 5, y, 1.5, y + 4, INK, 2.8);
    line(c, w - 5, y, w - 1.5, y - 3, INK, 2.8);
    oval(c, 2.5, y + 4, 2.3, 2.3, color, INK, 1);
    oval(c, w - 2.5, y - 3, 2.3, 2.3, color, INK, 1);
  }
  function flecks(c, n, x, y, width, height, color) {
    for (var i = 0; i < n; i++) {
      var fx = x + (i * 19 % width), fy = y + (i * 13 % height);
      rect(c, fx, fy, i % 3 ? 1 : 1.5, i % 4 ? 0.6 : 1, color);
    }
  }

  function body(c, kind, w, h) {
    var i;
    if (kind === 'pastel') {
      feet(c, w, h, '#835431');
      poly(c, [[2,7],[38,7],[36,18],[30,26],[21,28],[10,26],[4,20]],
        '#d49444', INK, 2.2);
      poly(c, [[4,8],[36,8],[33,18],[27,23],[19,25],[10,22],[6,18]], '#efbd67');
      line(c, 4, 9, 36, 9, '#8a542f', 1.5);
      for (i = 0; i < 8; i++) {
        line(c, 6 + i * 4, 7.5, 6 + i * 4, 11, '#87512f', 1);
      }
      flecks(c, 11, 7, 12, 27, 10, '#a96c35');
      shine(c, 11, 13, 3.5);
    } else if (kind === 'brigadeiro') {
      feet(c, w, h, '#72434a');
      poly(c, [[2,18],[24,18],[21,26],[5,26]], '#89667c', INK, 1.6);
      for (i = 0; i < 7; i++) line(c, 5 + i * 2.7, 19, 7 + i * 2.3, 25,
        i % 2 ? '#d3aac0' : '#65445c', 0.8);
      oval(c, 13, 13, 11.2, 11.4, '#542b26', INK, 2);
      oval(c, 10.5, 10, 7.7, 6.8, '#78402f');
      for (i = 0; i < 14; i++) {
        var bx = 5 + i * 11 % 16, by = 5 + i * 7 % 12;
        line(c, bx, by, bx + 1.8, by + (i % 2 ? 0.8 : -0.8),
          i % 3 ? '#d39a5c' : '#332026', 1);
      }
      shine(c, 8, 6, 2.4);
    } else if (kind === 'salsicha') {
      feet(c, w, h, '#663632'); arms(c, w, h, 27, '#ba5842');
      round(c, 8, 4, 15, 36, 7.5, '#a93f33', INK, 2.2);
      round(c, 10, 6, 11, 31, 5.5, '#da6c49');
      line(c, 13, 8, 11, 16, '#ffbc5b', 2.5);
      line(c, 11, 16, 16, 20, '#ffbc5b', 2.5);
      line(c, 16, 20, 13, 28, '#ffbc5b', 2.5);
      line(c, 13, 28, 18, 34, '#ffbc5b', 2.5);
      shine(c, 18, 10, 2.2);
    } else if (kind === 'pipoca') {
      feet(c, w, h, '#794850'); arms(c, w, h, 25, '#eecc9d');
      poly(c, [[3,11],[31,11],[28,37],[7,37]], '#dc4943', INK, 2);
      for (i = 0; i < 4; i++) poly(c,
        [[6 + i * 6,13],[10 + i * 6,13],[10 + i * 5.4,35],[8 + i * 5.4,35]],
        '#fff0cf');
      oval(c, 8, 10, 5, 5, '#f7e3a6', INK, 1);
      oval(c, 16, 7, 5.5, 5.5, '#ffedbb', INK, 1);
      oval(c, 25, 10, 5, 5, '#f7e3a6', INK, 1);
      oval(c, 20, 11, 3.5, 3, '#fff6d2');
      shine(c, 11, 5, 1.8);
    } else if (kind === 'sorvete') {
      feet(c, w, h, '#70513d');
      poly(c, [[6,24],[23,24],[15,43]], '#c9924d', INK, 1.8);
      for (i = 0; i < 4; i++) line(c, 8 + i * 3, 27, 17 + i, 39,
        '#9b653b', 0.7);
      oval(c, 14, 19, 12, 12, '#f1b9c6', INK, 2);
      oval(c, 12, 16, 8.5, 7, '#ffd2d3');
      oval(c, 7.8, 25, 3, 5, '#efb2be');
      oval(c, 21, 26, 2.5, 4, '#e994b1');
      oval(c, 15, 5, 3.7, 4, '#cb334b', INK, 1);
      line(c, 15, 4, 18, 1, '#6c6c38', 1);
      shine(c, 9, 12, 2.7);
    } else if (kind === 'donut') {
      feet(c, w, h, '#745047');
      oval(c, 19, 18, 16.5, 15, '#9e5c3f', INK, 2);
      oval(c, 19, 17, 15, 12.5, '#df86a8');
      oval(c, 19, 18.5, 6.1, 6, '#6e3d37', INK, 1.7);
      oval(c, 19, 18, 4, 4, '#c28d60');
      for (i = 0; i < 13; i++) {
        var a = i * TAU / 13, dx = 19 + Math.cos(a) * 11, dy = 17 + Math.sin(a) * 8;
        line(c, dx - 1, dy - 0.5, dx + 1, dy + 0.5,
          ['#fff3b0','#8ed3c5','#bf4d7c'][i % 3], 1.4);
      }
      shine(c, 9, 11, 3);
    } else if (kind === 'chips') {
      feet(c, w, h, '#694638'); arms(c, w, h, 24, '#e7a25a');
      poly(c, [[6,4],[26,4],[29,11],[27,36],[25,40],[7,40],[4,33],[3,10]],
        '#cb5a35', INK, 2);
      poly(c, [[8,7],[24,7],[26,12],[24,34],[8,34],[6,12]], '#ed8840');
      rect(c, 5, 8, 22, 2, '#f7c27b');
      rect(c, 6, 34, 20, 2, '#8e3d30');
      oval(c, 16, 20, 8, 7, '#f5c959', '#a65a2d', 1.2);
      oval(c, 16, 20, 5.5, 4, '#ffe18b');
      for (i = 0; i < 5; i++) rect(c, 5 + i * 5, 38 + i % 2, 1.5, 1, '#f4c274');
      rect(c, 1, 37, 1.8, 1.5, '#e8b065');
      rect(c, 28, 40, 1.4, 1.3, '#e8b065');
      shine(c, 10, 9, 2.5);
    } else if (kind === 'nugget') {
      feet(c, w, h, '#775034');
      poly(c, [[4,7],[9,3],[18,3],[23,8],[24,17],[20,22],[7,22],[2,17]],
        '#c47b32', INK, 2);
      poly(c, [[5,9],[10,5],[17,5],[21,9],[21,17],[18,20],[7,19],[4,16]],
        '#eab052');
      flecks(c, 12, 5, 6, 16, 13, '#a9662f');
      shine(c, 8, 8, 2.4);
    } else if (kind === 'milkshake') {
      feet(c, w, h, '#74505a'); arms(c, w, h, 31, '#eaa8bb');
      poly(c, [[4,14],[27,14],[23,44],[8,44]], '#c87e9c', INK, 2);
      poly(c, [[6,17],[25,17],[21,41],[10,41]], '#efb2c7');
      oval(c, 15, 16, 13, 3, '#fff1e8', INK, 1.3);
      oval(c, 15, 12, 10, 5, '#ffe9dd', INK, 1.3);
      oval(c, 15, 8, 6, 5, '#fff8ec', INK, 1.2);
      line(c, 21, 12, 25, 2, '#773d62', 3);
      line(c, 22, 11, 26, 2, '#ffb3cc', 1);
      oval(c, 7.5, 24, 2, 5, '#f3c2ce');
      oval(c, 22, 29, 2, 6, '#e590b1');
      shine(c, 11, 19, 2.5);
    } else if (kind === 'pizzinha') {
      feet(c, w, h, '#765037');
      poly(c, [[3,8],[33,8],[18,29]], '#c98236', INK, 2);
      poly(c, [[5,10],[31,10],[18,26]], '#f2c049');
      round(c, 2, 5, 32, 7, 3, '#b7783a', INK, 1.5);
      round(c, 4, 6, 28, 4, 2, '#e2a251');
      line(c, 16, 25, 15, 30, '#ffdd75', 2.5);
      oval(c, 15, 31, 2, 1.3, '#ffdd75');
      line(c, 22, 23, 23, 29, '#ffe390', 1.8);
      oval(c, 11, 16, 4, 4, '#b84a37', '#7d302e', 1);
      oval(c, 25, 16, 4, 4, '#b84a37', '#7d302e', 1);
      shine(c, 8, 11, 2.5);
    } else if (kind === 'acucar') {
      feet(c, w, h, '#7b8e9c');
      poly(c, [[3,7],[10,3],[27,6],[27,23],[21,27],[3,24]],
        '#b5d5de', INK, 2);
      poly(c, [[4,8],[21,10],[21,25],[4,23]], '#f7faf1');
      poly(c, [[21,10],[27,7],[27,23],[21,26]], '#8fbdce');
      poly(c, [[4,8],[10,4],[27,7],[21,10]], '#ffffff');
      for (i = 0; i < 7; i++) {
        rect(c, 5 + i * 3 % 15, 11 + i * 7 % 10, 1, 1, '#a6cbd2');
      }
      rect(c, 1, 4, 1.8, 1.8, '#e9ffff');
      rect(c, 27, 3, 1.4, 1.4, '#c4e5eb');
      rect(c, 28, 17, 1.2, 1.2, '#e9ffff');
      shine(c, 8, 8, 2.5);
    } else if (kind === 'bala') {
      feet(c, w, h, '#8c2e45');
      round(c, 2, 3, 24, 18, 7, '#af2844', INK, 2);
      round(c, 4, 5, 20, 13, 5, '#e94765');
      oval(c, 13, 10, 8, 5, '#fa7181');
      oval(c, 9, 7, 3.7, 1.8, '#ffd2c6');
      line(c, 19, 16, 22, 14, '#ff9b9f', 1.4);
    } else if (kind === 'churros') {
      feet(c, w, h, '#78432c'); arms(c, w, h, 29, '#d58c47');
      round(c, 5, 3, 13, 44, 5, '#ad652f', INK, 2);
      round(c, 7, 4, 9, 41, 4, '#dda04c');
      for (i = 0; i < 4; i++) line(c, 8 + i * 2.2, 7, 8 + i * 2.2, 42,
        i % 2 ? '#f0be6b' : '#b66d36', 1);
      poly(c, [[6,5],[9,2],[15,2],[18,5],[16,9],[8,9]],
        '#8c4b2d', INK, 1.2);
      oval(c, 12, 5, 4, 2, '#d69558');
      line(c, 6, 17, 10, 18, '#8d492a', 2.4);
      line(c, 10, 18, 8, 23, '#8d492a', 2.4);
      line(c, 8, 23, 12, 26, '#8d492a', 2.4);
      oval(c, 12, 28, 1.4, 3.2, '#9d5230');
      flecks(c, 7, 8, 12, 7, 24, '#fff0b0');
      shine(c, 10, 9, 1.6);
    }
  }

  function face(c, kind, mood) {
    var p = FACE[kind], cx = p[0], ey = p[1], gap = p[2], r = p[3], my = p[4];
    var left = cx - gap / 2, right = cx + gap / 2;
    if (mood === 'hurt') {
      line(c, left - r, ey - 1, left + r, ey + 1, INK, 1.8);
      line(c, right - r, ey + 1, right + r, ey - 1, INK, 1.8);
      oval(c, cx + 1, my, 2.3, 2.4, '#55202b', INK, 0.7);
      return;
    }
    if (mood === 'ko') {
      for (var k = 0; k < 2; k++) {
        var ex = k ? right : left;
        line(c, ex - r * 0.7, ey - r * 0.7, ex + r * 0.7, ey + r * 0.7, INK, 1.8);
        line(c, ex + r * 0.7, ey - r * 0.7, ex - r * 0.7, ey + r * 0.7, INK, 1.8);
      }
      line(c, cx - 2, my, cx + 2, my + 0.5, INK, 1.4);
      return;
    }
    for (var i = 0; i < 2; i++) {
      var ex2 = i ? right : left;
      if (kind !== 'pizzinha') oval(c, ex2, ey, r, r * 1.15, '#fff9e6', INK, 0.8);
      oval(c, ex2 + 0.7, ey + (mood === 'attack' ? -0.2 : 0.4),
        Math.max(1, r * 0.48), Math.max(1.2, r * 0.65), INK);
      oval(c, ex2 + 0.9, ey - 0.7, 0.55, 0.7, '#ffffff');
    }
    line(c, left - r, ey - r - 1.7, left + r * 0.5, ey - r - 0.5, INK, 1.5);
    line(c, right - r * 0.5, ey - r - 0.5, right + r, ey - r - 1.7, INK, 1.5);
    if (mood === 'attack') {
      oval(c, cx + 0.3, my, 3.2, 2.6, '#5b202c', INK, 0.8);
      rect(c, cx - 1.3, my - 1.8, 3.2, 1.3, '#fff3db');
    } else {
      line(c, cx - 2.5, my, cx + 0.5, my + 1.2, INK, 1.5);
      line(c, cx + 0.5, my + 1.2, cx + 2.5, my - 0.6, INK, 1.5);
    }
  }

  function kernel(c) {
    oval(c, 3, 3, 2.4, 2.1, '#fff2bb', INK, 0.8);
    oval(c, 1.8, 2, 1.3, 1.3, '#fff9d8');
  }

  function cached(kind, part, mood, flash) {
    var key = kind + ':' + part + ':' + (mood || '') + ':' + (flash ? 'f' : 'n');
    if (CACHE[key]) return CACHE[key];
    if (typeof document === 'undefined' || !document.createElement) return null;
    var size = part === 'kernel' ? [6, 6] : SIZES[kind];
    var canvas = document.createElement('canvas');
    canvas.width = size[0] * 2; canvas.height = size[1] * 2;
    var c = canvas.getContext('2d');
    if (!c) return null;
    if (flash) {
      var source = cached(kind, part, mood, false);
      if (!source) return null;
      c.drawImage(source, 0, 0);
      c.globalCompositeOperation = 'source-in';
      rect(c, 0, 0, canvas.width, canvas.height, '#ffffff');
    } else {
      c.scale(2, 2);
      if (part === 'body') body(c, kind, size[0], size[1]);
      else if (part === 'face') face(c, kind, mood);
      else kernel(c);
    }
    CACHE[key] = canvas;
    return canvas;
  }

  function enemySize(kind) {
    var size = Object.prototype.hasOwnProperty.call(SIZES, kind) ? SIZES[kind] : null;
    return size ? { w: size[0], h: size[1] } : null;
  }

  function drawEnemy(ctx, kind, state, t, x, y, facing, opts) {
    var size = Object.prototype.hasOwnProperty.call(SIZES, kind) ? SIZES[kind] : null;
    if (!ctx || !size) return false;
    state = ['idle','walk','attack','hurt','ko'].indexOf(state) >= 0 ? state : 'idle';
    t = typeof t === 'number' && isFinite(t) ? t : 0;
    opts = opts || {};
    var bodyImage = cached(kind, 'body', '', !!opts.flash);
    var mood = state === 'walk' || state === 'idle' ? 'normal' : state;
    var faceImage = cached(kind, 'face', mood, !!opts.flash);
    if (!bodyImage || !faceImage) return false;
    var w = size[0], h = size[1], phase = t * 10;
    ctx.save();
    if (opts.alpha != null) ctx.globalAlpha *= Math.max(0, Math.min(1, opts.alpha));
    ctx.translate(x, y);
    if (facing === -1) ctx.scale(-1, 1);
    if (state === 'idle') {
      ctx.translate(0, -0.6 * Math.sin(t * 3));
      ctx.scale(1 + 0.012 * Math.sin(t * 3), 1 - 0.017 * Math.sin(t * 3));
    } else if (state === 'walk') {
      var bounce = Math.abs(Math.sin(phase));
      ctx.translate(0, -2 * bounce);
      ctx.scale(1 + 0.055 * Math.sin(phase), 1 - 0.08 * Math.sin(phase));
      if (kind === 'donut') ctx.rotate(0.16 * Math.sin(phase));
      if (kind === 'bala') ctx.translate(0, -2.5 * bounce);
    } else if (state === 'attack') {
      var lunge = Math.max(0, Math.sin(t * 11));
      ctx.translate(3 * lunge, -0.8 * lunge);
      ctx.rotate(-0.14 * lunge);
      ctx.scale(1 + 0.06 * lunge, 1 - 0.04 * lunge);
    } else if (state === 'hurt') {
      ctx.translate(2 * Math.sin(t * 33), 0);
      ctx.rotate(0.045 * Math.sin(t * 29));
    } else if (state === 'ko') {
      ctx.rotate(-0.32 - 0.08 * Math.sin(t * 5));
      ctx.scale(1.14, 0.62 + 0.025 * Math.sin(t * 5));
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(bodyImage, -w / 2, -h, w, h);
    ctx.drawImage(faceImage, -w / 2, -h, w, h);
    if (kind === 'pipoca' && state !== 'ko') {
      var popped = cached(kind, 'kernel', '', !!opts.flash);
      for (var j = 0; j < 3; j++) {
        var jump = Math.abs(Math.sin(t * 6 + j * 2.1));
        ctx.drawImage(popped, -11 + j * 8, -h - 3 - jump * 5, 6, 6);
      }
    }
    ctx.restore();
    return true;
  }

  if (typeof window !== 'undefined') window.Viloes = {
    drawEnemy: drawEnemy,
    enemySize: enemySize
  };
})();
