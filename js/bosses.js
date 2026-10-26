/* Bosses for Bangu vs. a Fome e as Calorias. World coordinates are feet. */
(function () {
  'use strict';

  var NAMES = [
    'O X-Tudo Furioso', 'O Cachorro-Quente Turbinado',
    'O Pastelão de Feira Encharcado', 'A Batata Frita Tsunami',
    'A Pizza Gigante de Calabresa', 'O Churrasquinho de Gato Mutante',
    'O Açaí Hipercalórico', 'A Torre de Salgadinhos',
    'O Caldo de Cana', 'O Imperador Podrão de Bangu'
  ];
  var HP = [400, 550, 700, 850, 1020, 1200, 1420, 1620, 1000, 2400];
  var SIZES = [
    [120, 110], [105, 84], [108, 86], [94, 103], [105, 103],
    [90, 107], [101, 95], [90, 126], [87, 99], [189, 139]
  ];
  var CACHE = Object.create(null);
  var DARK = '#291b26';
  var BURGER_ART = null, BURGER_READY = false;

  function burgerImage() {
    if (!BURGER_ART && typeof Image === 'function') {
      BURGER_ART = new Image();
      BURGER_ART.onload = function () { BURGER_READY = true; };
      BURGER_ART.onerror = function () { BURGER_READY = false; };
      BURGER_ART.src = 'assets/inimigos.png';
    }
    return BURGER_READY ? BURGER_ART : null;
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function box(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x * 2) / 2, Math.round(y * 2) / 2,
      Math.round(w * 2) / 2, Math.round(h * 2) / 2);
  }
  function block(ctx, x, y, w, h, main, shade, light) {
    box(ctx, x, y, w, h, DARK);
    box(ctx, x + 1, y + 1, w - 2, h - 2, main);
    if (shade) box(ctx, x + 2, y + h - 5, w - 4, 3, shade);
    if (light) box(ctx, x + 3, y + 3, Math.max(1, w - 9), 2, light);
  }
  function dots(ctx, x, y, w, h, color, phase) {
    for (var yy = y + 2; yy < y + h - 2; yy += 6) {
      for (var xx = x + 2 + ((Math.floor(yy / 6) + phase) % 2) * 3; xx < x + w - 2; xx += 9) {
        box(ctx, xx, yy, 2, 2, color);
      }
    }
  }
  function pxLine(ctx, x1, y1, x2, y2, color, step) {
    var n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 3));
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      box(ctx, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, step || 3, step || 3, color);
    }
  }
  function silhouette(ctx, top, bottom, edges, main, shade) {
    var y, lr;
    for (y = top; y <= bottom; y += 0.5) {
      lr = edges(y);
      box(ctx, lr[0], y, lr[1] - lr[0] + 0.5, 0.5, DARK);
    }
    for (y = top + 1.5; y <= bottom - 1.5; y += 0.5) {
      lr = edges(y);
      if (lr[1] - lr[0] > 4) box(ctx, lr[0] + 1.5, y, lr[1] - lr[0] - 2.5,
        0.5, y > bottom - 9 ? shade : main);
    }
  }
  function oval(ctx, cx, cy, rx, ry, main, shade) {
    silhouette(ctx, cy - ry, cy + ry, function (y) {
      var dy = (y - cy) / ry;
      var span = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy)) * 2) / 2;
      return [cx - span, cx + span];
    }, main, shade);
  }
  function bun(ctx, x, y, w, h) {
    oval(ctx, x + w / 2, y + h / 2, w / 2, h / 2, '#d7913c', '#975321');
    oval(ctx, x + w / 2 - 2, y + h / 2 - 3, w / 2 - 5, h / 2 - 5,
      '#edb35a', '#d7913c');
    for (var i = x + 10; i < x + w - 8; i += 14) {
      box(ctx, i, y + 5 + (i % 3), 4, 1.5, '#f9dfaa');
      box(ctx, i + 0.5, y + 4.5 + (i % 3), 2, 0.5, '#fff5cf');
    }
  }
  function burger(ctx, w, h) {
    var x = 5, bw = w - 10, y = h - 77;
    bun(ctx, x + 5, y, bw - 10, 24);
    block(ctx, x + 3, y + 22, bw - 6, 9, '#429848', '#26613b', '#81c762');
    block(ctx, x + 6, y + 30, bw - 12, 9, '#e9b338', '#bb7721', '#f6d569');
    block(ctx, x + 1, y + 38, bw - 2, 17, '#70402e', '#492631', '#a56b43');
    block(ctx, x + 5, y + 54, bw - 10, 19, '#c78034', '#8c4d23', '#e8b55a');
    block(ctx, w / 2 + 8, y + 52, 12, 24, '#d9526e', '#9e2e50', '#f8879c');
  }
  function hotdog(ctx, w, h) {
    var cy = h - 36;
    oval(ctx, w / 2, cy + 3, w / 2 - 1, 12, '#ac4d38', '#71302d');
    oval(ctx, w / 2, cy + 6, w / 2 - 7, 24, '#d7974e', '#a3662e');
    oval(ctx, w / 2, cy - 1, w / 2 - 10, 17, '#e4ad60', '#be7c3b');
    oval(ctx, w / 2, cy + 6, w / 2 - 3, 10, '#ad4837', '#742d2d');
    box(ctx, 2, cy + 3, 10, 5, '#d77450');
    box(ctx, w - 13, cy + 3, 10, 5, '#d77450');
    for (var i = 13; i < w - 12; i += 8) {
      box(ctx, i, cy - 10 + i % 3, 3, 12, DARK);
      box(ctx, i + 1, cy - 9 + i % 3, 2, 10, '#efc467');
      box(ctx, i + 4, cy - 5, 4, 3, i % 2 ? '#c84336' : '#70a94d');
    }
    pxLine(ctx, 17, cy + 11, w - 19, cy + 5, '#fff0bb', 2);
  }
  function pastel(ctx, w, h) {
    var top = h - 75, bottom = h - 10;
    silhouette(ctx, top, bottom, function (y) {
      var t = (y - top) / (bottom - top);
      var inset = Math.round(5 + (w / 2 - 7) * (1 - Math.sqrt(Math.max(0, 1 - t * t))));
      return [inset, w - 1 - inset];
    }, '#d7a65b', '#946833');
    box(ctx, 9, top + 4, w - 18, 3, '#f6d58d');
    for (var i = 11; i < w - 11; i += 8) {
      box(ctx, i, top + 1, 3, 9, '#875f32');
      box(ctx, i + 1, top + 2, 2, 6, '#f2c77a');
    }
    for (var j = 0; j < 14; j++) {
      var py = top + 12 + j * 3 % 42;
      var px = 19 + j * 17 % (w - 39);
      box(ctx, px, py, 5, 3, '#b47e42');
      box(ctx, px + 1, py, 2, 1, '#f8dda0');
    }
    // Ragged pastry wings project from the flying half-moon.
    silhouette(ctx, top + 10, top + 38, function (y) {
      var t = (y - top - 10) / 28;
      return [1 + Math.round(t * 12), 20 + Math.round(t * 4)];
    }, '#e3b46c', '#a9793d');
    silhouette(ctx, top + 10, top + 38, function (y) {
      var t = (y - top - 10) / 28;
      return [w - 21 - Math.round(t * 4), w - 2 - Math.round(t * 12)];
    }, '#e3b46c', '#a9793d');
  }
  function fries(ctx, w, h) {
    for (var i = 0; i < 8; i++) {
      var fx = 9 + i * (w - 18) / 8;
      block(ctx, fx, 9 + (i % 3) * 5, 11, 59 - (i % 3) * 5, '#e5ac36', '#a66d25', '#ffe16b');
    }
    block(ctx, 4, 49, w - 8, h - 56, '#b83537', '#7e252e', '#e6634f');
    block(ctx, 12, 54, w - 24, 10, '#e6a72a', '#b56d1b', '#ffd35a');
    box(ctx, 17, 70, w - 34, 6, '#e6a929');
  }
  function pizza(ctx, w, h) {
    var cx = Math.round(w / 2), cy = h - 53, rx = Math.floor(w / 2) - 3, ry = 47;
    for (var y = cy - ry; y <= cy + ry; y++) {
      var dy = y - cy;
      var span = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry))));
      if (dy <= 8) {
        box(ctx, cx - span, y, span * 2 + 1, 1, DARK);
        if (dy > -ry + 2 && span > 3) box(ctx, cx - span + 2, y,
          span * 2 - 3, 1, dy > 34 ? '#ad6c34' : '#e7ad59');
      } else {
        var gap = 2 + Math.round((dy - 8) * 0.48);
        if (span > gap + 3) {
          var wing = span - gap;
          box(ctx, cx - span, y, wing, 1, DARK);
          box(ctx, cx + gap + 1, y, wing, 1, DARK);
          if (wing > 5 && dy < ry - 2) {
            box(ctx, cx - span + 2, y, wing - 4, 1, '#e7ad59');
            box(ctx, cx + gap + 3, y, wing - 4, 1, '#e7ad59');
          }
        }
      }
    }
    for (var j = 0; j < 7; j++) {
      var a = (j + 1) * Math.PI * 2 / 8;
      var tx = cx + Math.round(Math.cos(a) * 27);
      var ty = cy + Math.round(Math.sin(a) * 25);
      if (ty > cy + 8 && Math.abs(tx - cx) < 22) continue;
      oval(ctx, tx, ty, 8, 6, '#b9463d', '#762d31');
      box(ctx, tx - 3, ty - 3, 3, 2, '#eb8663');
    }
    for (var tooth = 0; tooth < 5; tooth++) {
      var toothY = cy + 14 + tooth * 6;
      var toothGap = 2 + Math.round((toothY - cy - 8) * 0.48);
      box(ctx, cx - toothGap - 5, toothY, 4, 4, '#fff0bd');
      box(ctx, cx + toothGap + 2, toothY, 4, 4, '#fff0bd');
    }
  }
  function skewer(ctx, w, h) {
    block(ctx, 6, h - 19, w - 12, 13, '#39343a', '#201e26', '#645458');
    for (var coal = 0; coal < 8; coal++) {
      box(ctx, 10 + coal * 9, h - 17 + coal % 3, 6, 4,
        coal % 2 ? '#e95632' : '#f69b3e');
    }
  }
  function skewerRod(ctx, w, h, side) {
    var xx = side < 0 ? 18 : w - 33;
    box(ctx, xx + 11, 1, 5, h - 4, DARK);
    box(ctx, xx + 12, 3, 3, h - 8, '#b9824b');
    box(ctx, xx + 13, 0, 1, 6, '#f1c78a');
    for (var i = 0; i < 3; i++) {
      var cy = 21 + i * 29;
      oval(ctx, xx + 13, cy, 15, 10, '#925139', '#5c3130');
      box(ctx, xx + 4, cy - 5, 6, 3, '#d58750');
      if (i < 2) {
        oval(ctx, xx + 13, cy + 13, 16, 4,
          side > 0 ? '#79a34e' : '#e5d1a0',
          side > 0 ? '#4d713d' : '#a99172');
        box(ctx, xx + 2, cy + 12, 5, 3,
          side > 0 ? '#a4c66e' : '#fff0c4');
      }
      box(ctx, xx + 7, cy - 5, 5.5, 1.5, '#edb174');
      box(ctx, xx + 5, cy + 2, 1, 1, '#f3c28c');
    }
  }
  function foodArm(ctx, kind, w, h, side) {
    if (kind === 'skewer') { skewerRod(ctx, w, h, side); return; }
    var cx = side < 0 ? 9 : w - 9, cy = h - 40;
    var skin = kind === 'cane' ? '#9ebc65' : kind === 'acai' ? '#68427e' :
      kind === 'pizza' ? '#dca15b' : '#c58244';
    if (kind === 'emperor') {
      cx = side < 0 ? 24 : w - 25; cy = 89;
      oval(ctx, cx, cy, 22, 12, '#ba573b', '#75352f');
      oval(ctx, cx, cy - 6, 20, 8, '#dca45e', '#9c632f');
      box(ctx, cx - 11, cy - 8, 12, 1.5, '#ffe0a3');
      return;
    }
    oval(ctx, cx, cy, 8, 10, skin, '#714032');
    oval(ctx, cx + (side < 0 ? -3 : 3), cy + 5, 5.5, 5, skin, '#714032');
    box(ctx, cx - 4, cy - 5, 6, 1, '#f4c985');
    for (var finger = 0; finger < 3; finger++) {
      box(ctx, cx + (side < 0 ? -7 : 2) + finger * 1.5,
        cy + 8, 1, 3 - finger * 0.5, '#7a4534');
    }
  }
  function acai(ctx, w, h) {
    var top = h - 57, bottom = h - 7;
    box(ctx, w - 29, 2, 6, 50, DARK);
    box(ctx, w - 28, 3, 4, 48, '#d5d0c4');
    box(ctx, w - 34, 1, 17, 5, DARK);
    box(ctx, w - 32, 2, 13, 3, '#ece7d6');
    oval(ctx, w / 2, h - 56, w / 2 - 11, 29, '#623078', '#3f2058');
    silhouette(ctx, top, bottom, function (y) {
      var t = (y - top) / (bottom - top);
      var inset = 7 + Math.round(t * 18);
      return [inset, w - 1 - inset];
    }, '#68407f', '#3b2755');
    oval(ctx, w / 2, top + 1, w / 2 - 7, 8, '#7b3a91', '#4d2466');
    for (var i = 0; i < 7; i++) {
      var gx = 19 + i * 11;
      box(ctx, gx, top - 8 + i % 2 * 3, 7, 5, '#e4b76e');
      box(ctx, gx + 2, top - 8 + i % 2 * 3, 2, 2, '#f6d68a');
    }
    for (var banana = 0; banana < 3; banana++) {
      var bx = 31 + banana * 16;
      oval(ctx, bx, top - 12 + banana % 2 * 2, 6, 4, '#f4e5aa', '#cba95f');
      box(ctx, bx - 1, top - 13 + banana % 2 * 2, 2, 2, '#a37945');
    }
  }
  function tower(ctx, w, h) {
    var cx = w / 2;
    // Bottom risole: a crimped half-moon with its straight sealed edge on top.
    silhouette(ctx, h - 56, h - 6, function (y) {
      var t = (y - (h - 56)) / 50;
      var inset = 9 + Math.round(32 * t * t);
      return [inset, w - 1 - inset];
    }, '#d6a65b', '#966331');
    for (var i = 14; i < w - 13; i += 8) box(ctx, i, h - 54, 3, 7, '#8d5a2c');
    // Middle kibe: tapered at both tips.
    silhouette(ctx, h - 93, h - 42, function (y) {
      var t = (y - (h - 93)) / 51;
      var span = 4 + Math.round(34 * (1 - Math.abs(2 * t - 1)));
      return [cx - span, cx + span];
    }, '#95623f', '#603c30');
    // Top coxinha: narrow pointed tip and plump crumbed base.
    silhouette(ctx, h - 124, h - 79, function (y) {
      var t = (y - (h - 124)) / 45;
      var span = 3 + Math.round(27 * Math.sin(t * Math.PI / 2));
      return [cx - span, cx + span];
    }, '#dfaa55', '#9d6530');
  }
  function cane(ctx, w, h) {
    var top = h - 79, bottom = h - 7;
    box(ctx, w - 30, 0, 7, 36, DARK);
    box(ctx, w - 29, 1, 5, 34, '#edf1c9');
    silhouette(ctx, top, bottom, function (y) {
      var t = (y - top) / (bottom - top);
      var inset = 8 + Math.round(t * 15);
      return [inset, w - 1 - inset];
    }, '#a8c66c', '#638d47');
    oval(ctx, w / 2, top + 5, w / 2 - 8, 7, '#d5e5a0', '#88aa5e');
    box(ctx, 20, top + 18, 3, 46, '#e8f6bd');
    box(ctx, w - 24, top + 22, 2, 36, '#62894c');
    for (var i = 0; i < 3; i++) {
      block(ctx, 24 + i * 15, top + 13 + i % 2 * 8, 12, 10,
        '#d8ecc0', '#8cb39a', '#f8fff0');
    }
  }
  function emperor(ctx, w, h) {
    var cx = w / 2;
    // Pizza cape fans out behind a huge burger torso.
    silhouette(ctx, 57, h - 7, function (y) {
      var t = (y - 57) / (h - 64);
      return [31 - Math.round(t * 26), cx - 16 + Math.round(t * 8)];
    }, '#d89443', '#965b33');
    silhouette(ctx, 57, h - 7, function (y) {
      var t = (y - 57) / (h - 64);
      return [cx + 16 - Math.round(t * 8), w - 32 + Math.round(t * 26)];
    }, '#d89443', '#965b33');
    for (var p = 0; p < 3; p++) {
      oval(ctx, 29 + p * 15, 93 + p * 11, 8, 6, '#af493d', '#722d2d');
      oval(ctx, w - 30 - p * 15, 93 + p * 11, 8, 6, '#af493d', '#722d2d');
    }
    // Layered hamburger mountain and heavy crown.
    oval(ctx, cx, 103, 66, 35, '#a66b36', '#75412c');
    box(ctx, cx - 61, 101, 122, 7, '#40914c');
    box(ctx, cx - 64, 108, 128, 11, '#6a382b');
    box(ctx, cx - 60, 120, 120, 7, '#e0af49');
    oval(ctx, cx, 70, 61, 38, '#cf8841', '#955523');
    for (var f = 0; f < 7; f++) {
      var fx = 40 + f * 18;
      block(ctx, fx, 7 + f % 3 * 6, 11, 44 - f % 3 * 5,
        '#e6ab39', '#a76c26', '#ffe27c');
    }
    block(ctx, cx - 54, 25, 108, 18, '#b1513e', '#7c302d', '#e77c57');
    for (var b = 0; b < 5; b++) {
      var bx = cx - 48 + b * 23;
      block(ctx, bx, 9 + b % 2 * 5, 19, 12,
        '#b84c40', '#7b3030', '#ef8064');
      box(ctx, bx + 4, 12 + b % 2 * 5, 5, 3, '#f7c184');
    }
  }
  function mini(ctx, w, h, type) {
    if (type === 'miniCoxinha') {
      silhouette(ctx, 2, h - 7, function (y) {
        var t = (y - 2) / (h - 9);
        var span = 3 + Math.round((w / 2 - 7) * Math.sin(t * Math.PI / 2));
        return [w / 2 - span, w / 2 + span];
      }, '#d89d50', '#965a2d');
    } else if (type === 'miniKibe') {
      silhouette(ctx, 5, h - 7, function (y) {
        var t = (y - 5) / (h - 12);
        var span = 4 + Math.round((w / 2 - 8) * (1 - Math.abs(2 * t - 1)));
        return [w / 2 - span, w / 2 + span];
      }, '#9d6641', '#633b31');
    } else {
      silhouette(ctx, 8, h - 7, function (y) {
        var t = (y - 8) / (h - 15);
        var inset = 5 + Math.round((w / 2 - 9) * (1 - Math.sqrt(Math.max(0, 1 - t * t))));
        return [inset, w - 1 - inset];
      }, '#d8a75f', '#a06e36');
    }
  }
  function detail(ctx, kind, w, h, frame) {
    var cx = Math.round(w / 2), low = h - 14;
    if (kind === 'burger') {
      var by = h - 77;
      dots(ctx, 13, by + 4, w - 27, 14, '#f7d888', frame);
      dots(ctx, 12, by + 40, w - 24, 12, '#a56743', frame);
      for (var i = 0; i < 4; i++) {
        var bx = 15 + i * (w - 31) / 4;
        block(ctx, bx, by + 28, 12, 5, '#b74f45', '#7d3335', '#df7960');
      }
      box(ctx, cx + 11, h - 17, 3, 8, '#f5a1aa');
      box(ctx, cx + 11, h - 10, 8, 2, '#a52f54');
      box(ctx, w - 19, h - 32, 4, 13, '#f7ce73');
      box(ctx, w - 19, h - 19, 3, 5, '#e6a637');
    }
    if (kind === 'hotdog') {
      var hy = h - 65;
      for (var e = 0; e < 3; e++) {
        var ex = 20 + e * 31;
        block(ctx, ex, hy + 33, 13, 10, '#f9edce', '#bfb08e', '#ffffff');
        box(ctx, ex + 5, hy + 36, 4, 4, '#edb948');
      }
      for (var pal = 0; pal < 12; pal++) {
        var px = 12 + pal * (w - 25) / 12;
        box(ctx, px, hy + 10 + pal % 3 * 3, 3, 9, pal % 2 ? '#ffe27d' : '#b88431');
      }
    }
    if (kind === 'pastel' || kind === 'pastel9') {
      for (var cr = 0; cr < 6; cr++) {
        var cy = h - 66 + cr * 7;
        var inset = 10 + Math.round(cr * cr * 0.9);
        dots(ctx, inset, cy, w - inset * 2, 6, '#f0c77c', frame);
      }
      for (var oil = 0; oil < 4; oil++) {
        var ox = 16 + oil * (w - 31) / 4;
        box(ctx, ox, h - 13, 5, 7 + oil % 2 * 3, '#96622e');
        box(ctx, ox + 1, h - 10, 2, 7 + oil % 2 * 2, '#f2c24f');
      }
      box(ctx, w - 21, h - 46, 7, 3, '#fff0ae');
    }
    if (kind === 'fries') {
      var fryBase = 9;
      for (var f = 0; f < 7; f++) {
        var fx = 14 + f * (w - 27) / 7;
        box(ctx, fx, fryBase + 5 + f % 3 * 4, 3, 18, '#fff08b');
        box(ctx, fx + 5, fryBase + 19, 2, 8, '#a06424');
      }
      dots(ctx, 9, 67, w - 17, h - 77, '#e77752', frame);
      for (var drip = 0; drip < 4; drip++) box(ctx, 16 + drip * 19, 63, 4, 13 + drip % 2 * 5, '#e9ac31');
    }
    if (kind === 'pizza') {
        dots(ctx, 24, h - 82, Math.round(w / 2) - 27, 63, '#f1bd6c', frame);
        for (var pz = 0; pz < 4; pz++) {
          var qx = 17 + pz * 21;
          box(ctx, qx, h - 23, 4, 15 + pz % 2 * 5, '#f8eeb7');
          box(ctx, qx + 2, h - 9, 5, 2, '#d6b76d');
        }
        for (var top = 0; top < 5; top++) box(ctx, 22 + top * 15, h - 76 + top % 3 * 9,
          4, 3, '#7c923e');
    }
    if (kind === 'skewer') {
      for (var sk = 0; sk < 2; sk++) {
        for (var meat = 0; meat < 3; meat++) dots(ctx, 23 + sk * 48,
          15 + meat * 29, 20, 12, '#c77f4c', frame);
      }
      for (var coal = 0; coal < 8; coal++) box(ctx, 10 + coal * 9,
        h - 12, 6, 2, '#6e3934');
    }
    if (kind === 'acai') {
      dots(ctx, 17, h - 69, w - 33, 34, '#b176bc', frame);
      for (var pac = 0; pac < 11; pac++) {
        box(ctx, 19 + pac * 7, h - 69 + pac % 3 * 4, 3, 3,
          pac % 2 ? '#efc777' : '#aa783d');
      }
      for (var milk = 0; milk < 5; milk++) {
        var mx = 22 + milk * 14;
        box(ctx, mx, h - 51, 5, 19 + milk % 3 * 4, '#fff2d2');
        box(ctx, mx + 1, h - 32 + milk % 3 * 4, 3, 4, '#f4e4bd');
      }
      pxLine(ctx, 24, h - 53, w - 25, h - 64, '#48245f', 3);
      box(ctx, 23, h - 30, 5, 12, '#642271');
    }
    if (kind === 'tower') {
      dots(ctx, 25, h - 107, w - 50, 13, '#f4c474', frame);
      dots(ctx, 25, h - 73, w - 50, 17, '#72463a', frame);
      dots(ctx, 20, h - 41, w - 40, 14, '#f4bf72', frame);
      for (var crust = 0; crust < 3; crust++) box(ctx, 29 + crust * 12,
        h - 65 + crust % 2 * 4, 4, 3, '#5e3532');
    }
    if (kind === 'cane') {
      for (var ice = 0; ice < 4; ice++) {
        var ix = 19 + ice * 14;
        block(ctx, ix, h - 68 + ice % 2 * 10, 12, 11,
          '#cce7af', '#80a979', '#f4ffdc');
      }
      box(ctx, 20, h - 42, 4, 27, '#d9f5a3');
      box(ctx, 34, h - 51, 3, 21, '#c3e891');
      box(ctx, w - 27, h - 82, 3, 39, '#fff5c7');
      dots(ctx, 25, h - 37, w - 50, 23, '#d1eaa0', frame);
    }
    if (kind === 'emperor') {
      dots(ctx, cx - 48, 49, 96, 38, '#f5c072', frame);
      dots(ctx, cx - 56, 97, 112, 18, '#c68148', frame);
      for (var pep = 0; pep < 4; pep++) {
        box(ctx, 11 + pep * 9, 93 + pep * 7, 6, 4, '#bd4f43');
        box(ctx, w - 17 - pep * 9, 93 + pep * 7, 6, 4, '#bd4f43');
      }
      pxLine(ctx, 7, 88, 39, 89, '#f4d58d', 2);
      pxLine(ctx, w - 41, 89, w - 9, 88, '#f4d58d', 2);
      for (var sesame = 0; sesame < 8; sesame++) {
        box(ctx, cx - 47 + sesame * 13, 39 + sesame % 3 * 5, 4, 2, '#ffe09a');
      }
    }
    if (kind === 'miniCoxinha' || kind === 'miniKibe' || kind === 'miniRisole') {
      dots(ctx, 13, 21, w - 26, h - 31, '#f4c378', frame);
    }
    // Two cached glint frames: fat and sauce glimmer at distinct pixels.
    if (kind === 'burger' || kind === 'fries' || kind === 'emperor') {
      box(ctx, w - 15 - frame * 7, low - 11, 5, 2, '#fff0b1');
      box(ctx, 12 + frame * 5, low - 19, 3, 2, '#f7d27f');
    }
  }
  function fineDetail(ctx, kind, w, h, frame) {
    if (kind === 'skewer') return;
    var colors = {
      burger: ['#fff0ad','#ac6437'], hotdog: ['#fff3c8','#a65d39'],
      pastel: ['#ffe3a0','#a66b36'], pastel9: ['#ffe3a0','#a66b36'],
      fries: ['#ffe681','#b45b37'], pizza: ['#ffe3a6','#a85d38'],
      skewer: ['#f0b879','#59312e'], acai: ['#d5a8dc','#4f2861'],
      tower: ['#f5d18d','#8a5334'], cane: ['#f1ffcf','#63894e'],
      emperor: ['#ffe3a1','#8b4a33']
    };
    var palette = colors[kind] || ['#f4d18f','#985e37'];
    var top = kind === 'emperor' ? 43 : kind === 'skewer' ? 15 : h - 63;
    var bottom = kind === 'emperor' ? h - 27 : kind === 'skewer' ? h - 25 : h - 22;
    for (var i = 0; i < 24; i++) {
      var xx = w * 0.25 + (i * 37 % Math.round(w * 0.5));
      var yy = top + (i * 19 % Math.max(1, Math.round(bottom - top)));
      box(ctx, xx + (frame ? 0.5 : 0), yy, i % 4 ? 0.5 : 1, 0.5,
        i % 3 ? palette[0] : palette[1]);
    }
    for (var shine = 0; shine < 3; shine++) {
      var sx = w * (0.25 + shine * 0.18);
      var sy = top + 12 + shine % 2 * 8;
      box(ctx, sx, sy, 7, 1.5, palette[0]);
      box(ctx, sx + 1, sy - 1, 4, 0.5, '#fff8db');
      box(ctx, sx + 2, sy - 2, 1, 0.5, '#fff8db');
    }
    if (kind === 'fries' || kind === 'pastel' || kind === 'tower' || kind === 'pastel9') {
      for (var crumb = 0; crumb < 6; crumb++) {
        var bx = 16 + crumb * (w - 32) / 6;
        box(ctx, bx, h - 7 + crumb % 2, 2, 1, '#e8ba68');
        box(ctx, bx + 4, h - 5, 0.5, 0.5, '#f8d583');
      }
    }
  }
  function face(ctx, kind, w, h, part) {
    var ey = kind === 'emperor' ? h - 91 : kind === 'tower' ? h - 98 : h - Math.min(h - 18, 48);
    var ex = w / 2, miniEyes = kind.indexOf('mini') === 0;
    if (part === 'eyes') {
      if (miniEyes) {
        block(ctx, ex - 13, ey, 9, 9, '#fff0cb', '#c5b493', '#ffffff');
        block(ctx, ex + 4, ey, 9, 9, '#fff0cb', '#c5b493', '#ffffff');
        pxLine(ctx, ex - 14, ey - 3, ex - 4, ey, DARK, 2);
        pxLine(ctx, ex + 4, ey, ex + 14, ey - 3, DARK, 2);
      } else if (kind === 'emperor') {
        block(ctx, ex - 36, ey, 24, 20, '#fff0cb', '#c5b493', '#ffffff');
        block(ctx, ex + 12, ey, 24, 20, '#fff0cb', '#c5b493', '#ffffff');
        pxLine(ctx, ex - 38, ey - 6, ex - 12, ey, DARK, 4);
        pxLine(ctx, ex + 12, ey, ex + 38, ey - 6, DARK, 4);
      } else {
        block(ctx, ex - 23, ey, 15, 14, '#fff0cb', '#c5b493', '#ffffff');
        block(ctx, ex + 8, ey, 15, 14, '#fff0cb', '#c5b493', '#ffffff');
        pxLine(ctx, ex - 24, ey - 4, ex - 8, ey + 1, DARK, 3);
        pxLine(ctx, ex + 8, ey + 1, ex + 23, ey - 4, DARK, 3);
      }
      return;
    }
    var mouthX = kind === 'emperor' ? ex - 30 : ex - (miniEyes ? 7 : 12);
    var mouthY = kind === 'emperor' ? ey + 27 : miniEyes ? ey + 12 : ey + 18;
    var mouthW = kind === 'emperor' ? 60 : miniEyes ? 14 : 24;
    var mouthH = kind === 'emperor' ? 19 : miniEyes ? 7 : 11;
    if (kind === 'pizza') {
      mouthX = ex - 10; mouthW = 20; mouthY = ey + 20; mouthH = 15;
    }
    block(ctx, mouthX, mouthY, mouthW, mouthH,
      '#371b27', '#913a48', '#612733');
    for (var tooth = mouthX + 3; tooth < mouthX + mouthW - 2; tooth += miniEyes ? 4 : 6) {
      box(ctx, tooth, mouthY + 1.5, miniEyes ? 2 : 3.5, 3.5, '#fff4db');
      box(ctx, tooth, mouthY + mouthH - 3, miniEyes ? 2 : 3.5, 2, '#fff4db');
    }
    box(ctx, mouthX + mouthW / 2 - 4, mouthY + mouthH - 5,
      8, 2.5, '#e77384');
    box(ctx, mouthX + mouthW / 2 - 2, mouthY + mouthH - 5,
      2, 0.5, '#ffb6b4');
  }
  function paint(ctx, kind, w, h, frame, part) {
    if (part === 'eyes' || part === 'mouth') { face(ctx, kind, w, h, part); return; }
    if (part === 'left' || part === 'right') {
      foodArm(ctx, kind, w, h, part === 'left' ? -1 : 1); return;
    }
    if (kind === 'burger') burger(ctx, w, h);
    else if (kind === 'hotdog') hotdog(ctx, w, h);
    else if (kind === 'pastel' || kind === 'pastel9') pastel(ctx, w, h);
    else if (kind === 'fries') fries(ctx, w, h);
    else if (kind === 'pizza') pizza(ctx, w, h);
    else if (kind === 'skewer') skewer(ctx, w, h);
    else if (kind === 'acai') acai(ctx, w, h);
    else if (kind === 'tower') tower(ctx, w, h);
    else if (kind === 'cane') cane(ctx, w, h);
    else if (kind === 'emperor') emperor(ctx, w, h);
    else mini(ctx, w, h, kind);
    if (kind !== 'skewer') detail(ctx, kind, w, h, frame);
    fineDetail(ctx, kind, w, h, frame);
  }
  function sprite(kind, w, h, frame, part) {
    part = part || 'body';
    var key = kind + ':' + w + ':' + h + ':' + frame + ':' + part;
    if (CACHE[key]) return CACHE[key];
    if (typeof document === 'undefined' || !document.createElement) return null;
    var c = document.createElement('canvas');
    c.width = Math.ceil(w * 2); c.height = Math.ceil(h * 2);
    var ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;
    if (ctx.scale) ctx.scale(2, 2);
    paint(ctx, kind, w, h, frame, part);
    CACHE[key] = c;
    return c;
  }
  function drawPiece(ctx, b, frame, part, angle, pivotX, pivotY) {
    var pic = sprite(b.kind, b.w, b.h, frame, part);
    if (!pic) return;
    if (angle) {
      ctx.save();
      ctx.translate(pivotX, pivotY);
      if (ctx.rotate) ctx.rotate(angle);
      ctx.drawImage(pic, -b.w / 2 - pivotX, -b.h - pivotY, b.w, b.h);
      ctx.restore();
    } else ctx.drawImage(pic, -b.w / 2, -b.h, b.w, b.h);
  }
  function target(G, b) {
    return G.nearestPlayer(b.x, b.y) || null;
  }
  function arena(G) {
    return G.arena || { left: 0, right: 480, top: 178, bottom: 262 };
  }
  function keep(b, G) {
    var a = arena(G);
    b.x = clamp(b.x, a.left + b.w / 2, a.right - b.w / 2);
    b.y = clamp(b.y, a.top, a.bottom);
    b.z = Math.max(0, b.z);
  }
  function shoot(G, b, kind, vx, vy, vz, grav, damage, onLand, ox, oy) {
    G.shoot({
      x: b.x + (ox || 0), y: b.y + (oy || 0), z: b.z + Math.min(65, b.h * 0.55),
      vx: vx, vy: vy, vz: vz, grav: grav, r: kind === 'gordura' ? 6 : 5,
      dmg: damage, knock: 20, life: 3.5, kind: kind, onLand: onLand || null,
      draw: function (ctx, sx, sy) {
        var colors = { bacon: '#b34b40', palha: '#f1ca63', egg: '#eee3bf',
          fry: '#e8b344', boulder: '#71388a', cheese: '#f7e6a3', oil: '#ac762e' };
        var color = colors[kind] || '#d69c48';
        box(ctx, sx - 5, sy - 5, 11, 10, DARK);
        box(ctx, sx - 4, sy - 4, 9, 8, color);
        box(ctx, sx - 2, sy - 3, 3, 2, '#fff1ba');
      }
    });
  }
  function aim(G, b, speed, kind, damage, options) {
    var p = target(G, b), dx = p ? p.x - b.x : b.facing * 100;
    var dy = p ? p.y - b.y : 0;
    var d = Math.max(1, Math.hypot(dx, dy));
    var o = options || {};
    shoot(G, b, kind, speed * dx / d, speed * dy / d, o.vz || 0,
      o.grav || 0, damage, o.onLand || null, o.ox || 0, o.oy || 0);
  }
  function hitPlayers(G, b, predicate, damage, knock) {
    var players = G.players || [];
    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      if (!p || p.dead || p.hp <= 0 || !predicate(p)) continue;
      G.hit(p.x, p.y, 5, 5, 0, 95, damage, knock || 20, b.x);
    }
  }
  function attacksFor(b) {
    if (b.kind === 'miniCoxinha') return ['peck'];
    if (b.kind === 'miniKibe') return ['roll'];
    if (b.kind === 'miniRisole') return ['miniShot'];
    if (b.kind === 'cane') return ['flood', 'splash'];
    if (b.kind === 'pastel9') return ['oil', 'dash'];
    if (b.stage === 1) return ['stomp', 'bacon'];
    if (b.stage === 2) return ['palha', 'eggs', 'mayo'];
    if (b.stage === 3) return ['fly', 'oil', 'summon'];
    if (b.stage === 4) return ['triple', 'rain'];
    if (b.stage === 5) return ['dash', 'cheese'];
    if (b.stage === 6) return ['skewers', 'smoke'];
    if (b.stage === 7) return ['boulder'];
    if (b.stage === 8) return ['stomp', 'summon'];
    if (b.stage === 10) {
      if (b.phase === 1) return ['stomp', 'bacon', 'palha'];
      if (b.phase === 2) return ['dash', 'rain', 'oil', 'triple'];
      return ['flood', 'skewers', 'boulder', 'cheese', 'triple'];
    }
    return ['stomp'];
  }
  function duration(type) {
    if (type === 'fly' || type === 'dash' || type === 'mayo' || type === 'flood') return 0.95;
    if (type === 'triple' || type === 'rain' || type === 'eggs' || type === 'smoke') return 1.25;
    return 0.42;
  }
  function begin(b, G) {
    var list = attacksFor(b);
    b.attack = window.CreiaBrains?window.CreiaBrains.bossAttack(b,G,list):list[b.attackIndex % list.length];
    b.attackIndex++;
    b.state = 'warn'; b.timer = 0; b.did = 0; b.victims = [];
    var p = target(G, b);
    b.tx = p ? p.x : b.x + b.facing * 90;
    b.ty = p ? p.y : b.y;
    b.facing = b.tx >= b.x ? 1 : -1;
    if (b.attack === 'stomp' || b.attack === 'triple') {
      b.tx = b.x; b.ty = b.y;
    }
    if (b.attack === 'mayo') {
      b.tx = b.x + b.facing * 120;
      b.ty = b.y;
    }
    if (b.attack === 'flood') {
      var bounds = arena(G), half = (bounds.left + bounds.right) / 2;
      b.warnLeft = b.tx < half ? bounds.left : half;
      b.warnRight = b.warnLeft + (bounds.right - bounds.left) / 2;
      b.warnTop = bounds.top;
      b.warnBottom = bounds.bottom;
    }
    b.originX = b.x;
    b.dashDir = b.facing;
    b.warnTime = b.stage === 10 && b.phase === 3 ? 0.58 : 0.72;
    if (b.attack === 'fly' || b.attack === 'dash') {
      var a = arena(G);
      b.dashDir = b.x < (a.left + a.right) / 2 ? 1 : -1;
      b.facing = b.dashDir;
    }
    G.sound('boss_roar');
  }
  function action(b, G, dt) {
    var type = b.attack, a = arena(G), d = b.damage;
    if (type === 'stomp' && !b.did) {
      b.did = 1;
      hitPlayers(G, b, function (p) {
        var r = Math.hypot(p.x - b.x, (p.y - b.y) * 2);
        return r >= 27 && r <= 125;
      }, d, 36);
      G.shake(5, 0.35); G.particles('estrela', b.x, b.y, 17);
    } else if (type === 'triple') {
      var pulse = Math.floor(b.timer / 0.38);
      if (pulse > b.did && pulse <= 3) {
        b.did = pulse;
        hitPlayers(G, b, function (p) {
          var r = Math.hypot(p.x - b.x, (p.y - b.y) * 2);
          return r >= 18 + pulse * 25 && r <= 55 + pulse * 31;
        }, d * 0.75, 22);
        G.shake(2, 0.16);
      }
    } else if (type === 'bacon' && !b.did++) {
      for (var i = -2; i <= 2; i++) shoot(G, b, 'bacon', b.facing * 115, i * 24, 3, 0, d * 0.6);
    } else if (type === 'palha' && !b.did++) {
      for (var j = -1; j <= 1; j++) aim(G, b, 105 + j * 10, 'palha', d * 0.8,
        { vz: 85, grav: 190, onLand: 'explode', oy: j * 9 });
    } else if (type === 'eggs') {
      var egg = Math.floor(b.timer / 0.28);
      if (egg > b.did && egg <= 4) {
        b.did = egg;
        // Each short arc starts where the previous hop would land.
        shoot(G, b, 'egg', b.facing * (77 - egg * 7), (egg - 2.5) * 8,
          94 - egg * 13, 240, d * 0.55, null, b.facing * (egg - 1) * 42);
      }
    } else if (type === 'mayo' || type === 'flood') {
      var width = type === 'flood' ? (a.right - a.left) / 2 : 240;
      var left = type === 'flood' ? b.warnLeft : b.facing > 0 ? b.originX - 20 : b.originX + 20 - width;
      var progress = clamp(b.timer / duration(type), 0, 1);
      var front = type === 'flood' || b.facing > 0 ? left + width * progress : left + width * (1 - progress);
      hitPlayers(G, b, function (p) {
        if (b.victims.indexOf(p) !== -1) return false;
        var crossed = b.facing > 0 || type === 'flood' ? p.x >= left && p.x <= front : p.x >= front && p.x <= left + width;
        if (crossed && p.y >= a.top && p.y <= a.bottom) {
          b.victims.push(p); return true;
        }
        return false;
      }, type === 'flood' ? d * 0.9 : d * 0.7, 18);
      if (!b.did++) G.sound('splash');
    } else if (type === 'fly' || type === 'dash' || type === 'roll') {
      var speed = type === 'fly' ? 285 : type === 'roll' ? 170 : b.stage === 10 ? 300 : 240;
      b.x += b.dashDir * speed * dt;
      if (type === 'fly') {
        b.z = 47 + Math.round(Math.sin(b.timer * 9) * 8);
        if (b.timer - b.did > 0.22) {
          b.did = b.timer;
          G.puddle(b.x, b.y, 24, 2.8);
          shoot(G, b, 'oil', 0, 0, -30, 160, d * 0.35, 'poca');
        }
      } else {
        hitPlayers(G, b, function (p) {
          if (b.victims.indexOf(p) !== -1) return false;
          if (Math.abs(p.x - b.x) < b.w / 2 + 12 && Math.abs(p.y - b.y) < 23) {
            b.victims.push(p); return true;
          }
          return false;
        }, d, 42);
      }
      keep(b, G);
    } else if (type === 'oil' && !b.did++) {
      for (var k = -1; k <= 1; k++) {
        shoot(G, b, 'oil', b.facing * (50 + k * 12), k * 12, 76, 185,
          d * 0.5, 'poca');
        G.puddle(clamp(b.tx + k * 28, a.left, a.right), clamp(b.ty, a.top, a.bottom), 26, 3);
      }
    } else if (type === 'summon' && !b.did++) {
      for (var m = -1; m <= 1; m++) G.spawn('coxinha', clamp(b.x + m * 45, a.left + 15, a.right - 15), b.y);
    } else if (type === 'rain') {
      var drop = Math.floor(b.timer / 0.13);
      if (drop > b.did && drop <= 9) {
        b.did = drop;
        shoot(G, b, 'fry', rand(-45, 45), rand(-22, 22), 95, 175,
          d * 0.55, null, rand(-70, 70), rand(-12, 12));
      }
    } else if (type === 'cheese' && !b.did++) {
      var dx = b.tx - b.x, dy = b.ty - b.y, len = Math.max(1, Math.hypot(dx, dy));
      hitPlayers(G, b, function (p) {
        var t = clamp(((p.x - b.x) * dx + (p.y - b.y) * dy) / (len * len), 0, 1);
        var ex = b.x + dx * t, ey = b.y + dy * t;
        return t * len <= 205 && Math.hypot(p.x - ex, (p.y - ey) * 1.5) < 16;
      }, d, 27);
      G.sound('whoosh');
    } else if (type === 'skewers' && !b.did++) {
      hitPlayers(G, b, function (p) {
        var dx = (p.x - b.x) * b.facing, dy = p.y - b.y;
        return dx > 8 && dx < 110 && Math.abs(dy) < 60;
      }, d, 28);
      G.shake(2, 0.16); G.particles('estrela', b.x + b.facing * 70, b.y, 9);
      G.sound('whoosh');
    } else if (type === 'smoke') {
      var tick = Math.floor(b.timer / 0.24);
      if (tick > b.did) {
        b.did = tick;
        G.hit(b.x + b.facing * 55, b.y, 65, 25, 0, 90, 2, 5, b.x);
        G.particles('gordura', b.x + b.facing * 55, b.y - 36, 3);
      }
    } else if (type === 'boulder' && !b.did++) {
      for (var u = -1; u <= 1; u++) {
        var ddx = b.tx + u * 25 - b.x, ddy = b.ty - b.y;
        shoot(G, b, 'boulder', ddx / 1.4, ddy / 1.4,
          115, 220, d * 0.8, null);
      }
    } else if (type === 'splash' && !b.did++) {
      for (var v = -2; v <= 2; v++) shoot(G, b, 'gordura', b.facing * 100,
        v * 19, 20, 60, d * 0.65, null);
    } else if (type === 'peck' && !b.did++) {
      G.hit(b.x + b.facing * 20, b.y, 23, 14, 0, 60, d, 12, b.x);
    } else if (type === 'miniShot' && !b.did++) {
      aim(G, b, 115, 'cheese', d, null);
    }
  }
  function make(stage, kind, G, options) {
    var o = options || {}, sz = o.size || SIZES[stage - 1], a = arena(G);
    var b = {
      name: o.name || NAMES[stage - 1], stage: stage, kind: kind,
      x: o.x == null ? (a.left + a.right) / 2 : o.x,
      y: o.y == null ? (a.top + a.bottom) / 2 : o.y,
      z: 0, w: sz[0], h: sz[1],
      hp: o.hp || HP[stage - 1], maxHp: o.hp || HP[stage - 1],
      armor: 0, facing: -1, dead: false, flash: 0,
      state: 'rest', timer: 0, restTime: 1.45, attackIndex: 0,
      attack: '', did: 0, tx: 0, ty: 0, phase: 1,
      lookX: -1, lookY: 0,
      damage: o.damage || Math.round(8 + (stage - 1) * 10 / 9),
      update: function (dt, game) {
        if (this.dead || !Number.isFinite(dt) || dt <= 0) return;
        var gg = game || G;
        var watched = target(gg, this);
        if (watched) {
          this.lookX = watched.x < this.x - 6 ? -1 : watched.x > this.x + 6 ? 1 : 0;
          this.lookY = watched.y < this.y - 8 ? -1 : watched.y > this.y + 8 ? 1 : 0;
        }
        this.flash = Math.max(0, (this.flash || 0) - dt);
        if (this.hp <= 0) {
          if (this.state !== 'dying') {
            this.state = 'dying'; this.timer = 0; this.z = 0;
            gg.shake(6, 0.45); gg.sound('explode');
          }
          this.timer += dt;
          if (this.timer > 0.25 && this.timer - dt <= 0.25) {
            gg.particles('gordura', this.x, this.y - 35, 12);
            gg.particles('tomate', this.x, this.y - 40, 8);
          }
          if (this.timer > 0.8 && this.timer - dt <= 0.8) {
            gg.particles('banana', this.x, this.y - 55, 8);
            gg.particles('estrela', this.x, this.y - 55, 16);
          }
          if (this.timer >= 1.3) this.dead = true;
          return;
        }
        if (this.stage === 8 && this.kind === 'tower' && this.hp <= this.maxHp * 0.5) {
          this.dead = true;
          gg.shake(5, 0.4); gg.particles('estrela', this.x, this.y - 70, 24);
          var kinds = ['miniCoxinha', 'miniKibe', 'miniRisole'];
          var names = ['Coxinha Furiosa', 'Kibe Brutal', 'Risole Voador'];
          for (var i = 0; i < 3; i++) {
            gg.addBoss(make(8, kinds[i], gg, { name: names[i], size: [47, 52],
              x: this.x + (i - 1) * 47, y: this.y + (i - 1) * 8,
              hp: 270, damage: 13 }));
          }
          return;
        }
        if (this.stage === 10) {
          var next = this.hp <= this.maxHp / 3 ? 3 : this.hp <= this.maxHp * 2 / 3 ? 2 : 1;
          if (next !== this.phase) {
            this.phase = next; this.state = 'rest'; this.timer = 0;
            this.restTime = 1.35; this.attackIndex = 0;
            gg.shake(5, 0.35); gg.particles('estrela', this.x, this.y - 80, 20);
          }
        }
        this.timer += dt;
        if (this.state === 'rest') {
          this.z = 0;
          if (this.timer >= this.restTime) begin(this, gg);
        } else if (this.state === 'warn') {
          if (this.timer >= this.warnTime) {
            this.state = 'attack'; this.timer = 0; this.did = 0;
            this.victims = [];
          }
        } else if (this.state === 'attack') {
          action(this, gg, dt);
          if (this.timer >= duration(this.attack)) {
            this.state = 'rest'; this.timer = 0;
            this.restTime = this.stage === 10 ? 1.08 : 1.2 + (this.attackIndex % 3) * 0.22;
            this.z = 0;
          }
        }
        keep(this, gg);
      },
      draw: function (ctx, sx, sy) {
        if (this.dead) return;
        ctx.save(); ctx.imageSmoothingEnabled = false;
        var t = this.timer, warning = this.state === 'warn';
        var burgerBoss = this.kind === 'burger';
        var burgerArt = burgerBoss ? burgerImage() : null;
        if (warning) {
          var pulse = Math.floor(t * 12) % 2;
          var warnColor = pulse ? '#ffdd64' : '#ef5a42';
          var wx = sx + this.tx - this.x, wy = sy + this.ty - this.y + this.z;
          if (this.attack === 'flood') {
            var floorX = sx + this.warnLeft - this.x;
            var floorW = this.warnRight - this.warnLeft;
            for (var fy = this.warnTop; fy <= this.warnBottom; fy += 10) {
              box(ctx, floorX, sy + this.z + fy - this.y, floorW, 2, warnColor);
            }
          } else if (this.attack === 'stomp' || this.attack === 'triple') {
            for (var ring = 1; ring <= 3; ring++) {
              for (var dot = 0; dot < 16; dot++) {
                var angle = dot * Math.PI / 8;
                box(ctx, sx + Math.cos(angle) * ring * 36,
                  sy + this.z + Math.sin(angle) * ring * 11, 4, 2, warnColor);
              }
            }
          } else if (this.attack === 'cheese' || this.attack === 'skewers') {
            pxLine(ctx, sx, sy - this.z - 22, wx, wy - 12, warnColor, 3);
          } else {
            for (var k = 0; k < 12; k++) {
              var ang = k * Math.PI / 6;
              box(ctx, wx + Math.cos(ang) * 33, wy + Math.sin(ang) * 9, 5, 3, warnColor);
            }
          }
          box(ctx, sx - this.w / 2, sy - this.h - this.z - 9, this.w * clamp(t / this.warnTime, 0, 1), 4, warnColor);
        }
        var pose = Math.floor(t * 4) % 2;
        var breathing = 1 + 0.02 * (1 + Math.sin(t * 3.2));
        var sway = Math.sin(t * 2.4) * (warning ? 2.5 : 1.2);
        var shake = this.state === 'dying' ? Math.sin(t * 43) * 3 :
          warning ? Math.sin(t * 19) * 1.5 : 0;
        var impact = this.state === 'attack' && t < 0.17 ? Math.sin(t / 0.17 * Math.PI) : 0;
        var jumping = this.z > 2 || this.attack === 'fly' && this.state === 'attack';
        var stretchX = jumping ? 0.93 : 1 + impact * 0.1;
        var visualScale = this.kind === 'emperor' ? 1.08 :
          this.kind.indexOf('mini') === 0 ? 1 : Math.max(1, 100 / this.h);
        var stretchY = (jumping ? 1.1 : breathing - impact * 0.11) * visualScale;
        var stompJump = 0;
        if (burgerBoss && warning && this.attack === 'stomp') {
          var squash = 1 - 0.15 * clamp(t / this.warnTime, 0, 1);
          stretchX = 1 / squash;
          stretchY = squash;
        } else if (burgerBoss && this.state === 'attack' && this.attack === 'stomp') {
          stompJump = 10 * Math.sin(Math.PI * clamp(t / 0.38, 0, 1));
          if (t < 0.38) { stretchX = 0.93; stretchY = 1.12; }
        }
        var spinning = this.kind === 'pizza' && this.state === 'attack' && this.attack === 'dash';
        ctx.translate(sx + shake, sy + Math.sin(t * 3) * 0.6 - stompJump);
        if (this.facing < 0 && !burgerArt) ctx.scale(-1, 1);
        if (spinning) {
          ctx.translate(0, -this.h * 0.5);
          if (ctx.rotate) ctx.rotate(t * 7);
          ctx.translate(0, this.h * 0.5);
        } else if (ctx.rotate) ctx.rotate(sway * Math.PI / 180 +
          (burgerBoss && this.state === 'attack' ? Math.sin(t * 8) * 0.08 : 0));
        ctx.scale(stretchX, stretchY);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        if (this.state === 'dying') ctx.globalAlpha = Math.floor(t * 12) % 2 ? 0.45 : 1;
        else if (this.flash > 0) ctx.globalAlpha = Math.floor(this.flash * 40) % 2 ? 0.45 : 1;
        if (burgerArt) {
          ctx.drawImage(burgerArt, 347, 0, 584, 540,
            -this.w / 2, -this.h, this.w, this.h);
          ctx.restore();
          return;
        }
        var armSwing = Math.sin(t * (warning ? 11 : 4)) * (warning ? 0.14 : 0.07);
        if (this.state === 'attack') armSwing += 0.25 * Math.sin(t * 12);
        var pivotY = this.kind === 'emperor' ? -this.h + 89 :
          this.kind === 'skewer' ? -this.h + 21 : -40;
        drawPiece(ctx, this, pose, 'left', -armSwing,
          -this.w / 2 + (this.kind === 'skewer' ? 31 : this.kind === 'emperor' ? 24 : 9), pivotY);
        drawPiece(ctx, this, pose, 'right', armSwing,
          this.w / 2 - (this.kind === 'skewer' ? 20 : this.kind === 'emperor' ? 25 : 9), pivotY);
        if (sprite(this.kind, this.w, this.h, pose, 'body'))
          drawPiece(ctx, this, pose, 'body', 0, 0, 0);
        else box(ctx, -this.w / 2, -this.h, this.w, this.h, '#bd7438');
        var ey = this.kind === 'emperor' ? -91 : this.kind === 'tower' ? -98 : -Math.min(this.h - 18, 48);
        var blink = ((t + this.stage * 0.31) % 3.4) < 0.1;
        var emperorEyes = this.kind === 'emperor', pizzaEyes = this.kind === 'pizza';
        var miniEyes = this.kind.indexOf('mini') === 0;
        var leftEye = emperorEyes ? -36 : miniEyes ? -13 : -23;
        var rightEye = emperorEyes ? 12 : miniEyes ? 4 : 8;
        var eyeWidth = emperorEyes ? 24 : miniEyes ? 9 : 15;
        if (!blink) drawPiece(ctx, this, 0, 'eyes', 0, 0, 0);
        if (this.state !== 'dying' && blink) {
          box(ctx, leftEye, ey + (miniEyes ? 4 : 6), eyeWidth, miniEyes ? 2 : 4, DARK);
          box(ctx, rightEye, ey + (miniEyes ? 4 : 6), eyeWidth, miniEyes ? 2 : 4, DARK);
        } else {
          var eyeShift = (this.lookX || 0) * this.facing * 2;
          var eyeHeight = (this.lookY || 0);
          var pupilSize = emperorEyes ? 8 : miniEyes ? 3 : 5;
          var leftPupil = leftEye + (eyeWidth - pupilSize) / 2 + eyeShift;
          var rightPupil = rightEye + (eyeWidth - pupilSize) / 2 + eyeShift;
          var pupilY = ey + (miniEyes ? 3 : 5) + eyeHeight;
          box(ctx, leftPupil, pupilY, pupilSize, emperorEyes ? 10 : miniEyes ? 4 : 7, DARK);
          box(ctx, rightPupil, pupilY, pupilSize, emperorEyes ? 10 : miniEyes ? 4 : 7, DARK);
          box(ctx, leftPupil + 1, pupilY + 1, miniEyes ? 1 : 2, miniEyes ? 1 : 2, '#ffffff');
          box(ctx, rightPupil + 1, pupilY + 1, miniEyes ? 1 : 2, miniEyes ? 1 : 2, '#ffffff');
        }
        var mouthPivot = ey + (emperorEyes ? 30 : miniEyes ? 14 : pizzaEyes ? 23 : 21);
        var mouthOpen = this.state === 'attack' ? 1.2 + 0.55 * (1 + Math.sin(t * 12)) :
          warning ? 0.8 + 0.3 * (1 + Math.sin(t * 9)) : 0.48 + 0.07 * Math.sin(t * 3);
        ctx.save();
        ctx.translate(0, mouthPivot);
        ctx.scale(1, mouthOpen);
        var mouthPic = sprite(this.kind, this.w, this.h, 0, 'mouth');
        if (mouthPic) ctx.drawImage(mouthPic, -this.w / 2, -this.h - mouthPivot, this.w, this.h);
        ctx.restore();
        if (this.state === 'attack' && (this.kind === 'burger' || this.kind === 'hotdog' ||
            this.kind === 'pizza' || this.kind === 'skewer')) {
          var steam = Math.sin(t * 7) * 2;
          box(ctx, -13 + steam, -this.h - 6, 1, 6, '#f9ead4');
          box(ctx, 3 - steam, -this.h - 9, 1, 7, '#f9ead4');
        }
        ctx.restore();
      },
      onHit: function () { /* The engine owns damage and flash. */ }
    };
    keep(b, G);
    return b;
  }
  window.Bosses = {
    availableAttacks: function(b){return attacksFor(b).slice();},
    create: function (stage, G) {
      stage = clamp(Math.floor(Number(stage) || 1), 1, 10);
      var kinds = ['burger', 'hotdog', 'pastel', 'fries', 'pizza',
        'skewer', 'acai', 'tower', 'cane', 'emperor'];
      if (stage === 9) {
        var a = arena(G), mid = (a.left + a.right) / 2;
        return [make(9, 'cane', G, { x: mid - 82, hp: 920, damage: 17 }),
          make(9, 'pastel9', G, { name: 'O Pastel Supremo', x: mid + 82,
            size: [96, 88], hp: 920, damage: 17 })];
      }
      return [make(stage, kinds[stage - 1], G)];
    }
  };
}());
