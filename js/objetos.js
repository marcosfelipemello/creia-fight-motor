/* Objetos do Rafinha, Lohan, Douglas, Arthur e Lucas: arte em peças HD de 2x. */
(function () {
  'use strict';

  var INK = '#2b2632', TAU = Math.PI * 2;
  var KINDS = ['crash', 'ride', 'drone', 'gimbal', 'clave_sol', 'clave_fa', 'cavaquinho', 'bolo', 'micreia'];
  var CACHE = Object.create(null);
  // largura, altura e pivô da peça em unidades lógicas.
  var BOX = {
    cymbal: [26, 18, 13, 9], glint: [8, 8, 4, 4],
    drone: [24, 16, 12, 8], rotor: [10, 8, 5, 4], led: [4, 4, 2, 2],
    grip: [30, 18, 2, 9], phone: [14, 10, 3, 5],
    clef: [24, 26, 12, 13], aura: [28, 30, 14, 15],
    cavaquinho: [30, 20, 15, 10], strings: [30, 20, 15, 10],
    plate: [22, 20, 11, 10], cake: [22, 20, 11, 10],
    micHandle: [30, 16, 15, 8], micFoam: [30, 16, 15, 8]
  };

  function oval(c, x, y, rx, ry, fill, stroke, sw) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw || 1; c.stroke(); }
  }
  function poly(c, p, fill, stroke, sw) {
    c.beginPath(); c.moveTo(p[0][0], p[0][1]);
    for (var i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
    c.closePath(); c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw || 1; c.stroke(); }
  }
  function line(c, x1, y1, x2, y2, color, sw) {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
    c.strokeStyle = color; c.lineWidth = sw; c.lineCap = 'round'; c.stroke();
  }
  function round(c, x, y, w, h, r, fill, stroke, sw) {
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
    c.closePath(); c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw || 1; c.stroke(); }
  }

  function cymbal(c, kind) {
    var ride = kind === 'ride', r = ride ? 10 : 8;
    oval(c, 0, 1.9, r + 0.25, 3.45, ride ? '#60401e' : '#795128', INK, 1.5);
    oval(c, 0, 0.3, r, 3.2, ride ? '#9d6a2e' : '#d09a43', INK, 1.1);
    oval(c, -0.5, -0.45, r - 1.3, 1.75, ride ? '#b9853d' : '#e8b65b');
    oval(c, 0, 0.1, r - 2, 2.3, null, ride ? '#694925' : '#a26a2e', 0.55);
    oval(c, 0, 0.1, r - 3.5, 1.5, null, ride ? '#d2a052' : '#f5cc75', 0.5);
    oval(c, 0, -0.65, ride ? 2.7 : 2.2, ride ? 1.8 : 1.55,
      ride ? '#754b24' : '#af752f', INK, 0.85);
    oval(c, -0.35, -1.2, ride ? 2.25 : 1.8, 0.75,
      ride ? '#daaa5a' : '#ffda85');
    oval(c, 0.4, -1.4, 0.45, 0.35, '#fff1b6');
    line(c, -r + 1, 1.15, -r + 3, 1.55, ride ? '#dbad61' : '#ffe093', 0.55);
  }
  function glint(c, kind) {
    poly(c, [[0,-3.3],[0.55,-0.7],[3.1,0],[0.55,0.6],
      [0,3.1],[-0.55,0.6],[-2.7,0],[-0.55,-0.7]],
      kind === 'ride' ? '#ffe4a2' : '#fff6c8');
    oval(c, 0, 0, 0.65, 0.65, '#ffffff');
  }
  function drone(c, part) {
    if (part === 'drone') {
      // Dois braços cruzados ligam o casco aos quatro motores.
      line(c, -6, -3, 6, 3, INK, 1.8);
      line(c, -6, 3, 6, -3, INK, 1.8);
      line(c, -6, -3, 6, 3, '#646674', 0.8);
      line(c, -6, 3, 6, -3, '#646674', 0.8);
      oval(c, 0, -0.6, 4.2, 2.5, '#20232b', INK, 1.3);
      oval(c, -0.55, -1.55, 3.05, 1.1, '#555b66');
      poly(c, [[2,-1],[6.6,0],[6.1,3],[2.3,2]], '#353c45', INK, 0.8);
      oval(c, 5.1, 2.1, 2.15, 1.75, '#151d28', INK, 0.7);
      oval(c, 5.5, 2.1, 1.05, 1.05, '#4278a0', '#a9d7ef', 0.45);
      oval(c, 5.8, 1.75, 0.3, 0.3, '#e5f8ff');
      oval(c, 1, -1.8, 0.45, 0.28, '#9daab5');
    } else if (part === 'rotor') {
      oval(c, 0, 0, 4, 1.25, 'rgba(188,206,219,0.45)', '#66717e', 0.45);
      oval(c, 0, 0, 1.2, 1.1, '#262a34', INK, 0.6);
      oval(c, -0.3, -0.35, 0.4, 0.27, '#aab8c6');
    } else if (part === 'led') {
      oval(c, 0, 0, 1.25, 1.25, '#e6454a', '#822b36', 0.5);
      oval(c, -0.35, -0.35, 0.36, 0.36, '#ffe1d3');
    }
  }
  function gimbal(c, part) {
    if (part === 'grip') {
      // A ponta esquerda é o apoio na mão; o telefone fica adiante, em +x.
      round(c, 0, -1.8, 13.8, 3.6, 1.3, '#252a31', INK, 1);
      round(c, 1.2, -1.2, 10.2, 2.25, 0.8, '#59616d');
      for (var j = 0; j < 4; j++) line(c, 3.5 + j * 1.6, -1, 3.5 + j * 1.6, 1,
        '#20242c', 0.5);
      oval(c, 13.8, 0, 2, 2, '#333944', INK, 0.8);
      oval(c, 13.8, 0, 0.8, 0.8, '#8e9cac');
      line(c, 14.8, -0.5, 16.7, -4, INK, 2.1);
      line(c, 14.8, -0.5, 16.7, -4, '#6c7380', 0.75);
      line(c, 16.7, -4, 18.1, -4, INK, 1.5);
      oval(c, 16.7, -4, 1.1, 1.1, '#343b46', INK, 0.6);
      oval(c, 16.7, -4, 0.4, 0.4, '#a1afbc');
      line(c, 15, 1.2, 17.5, 1.2, '#4e5968', 0.9);
    } else if (part === 'phone') {
      round(c, 0, -5, 10, 6.4, 1, '#202831', INK, 0.9);
      round(c, 0.8, -4.25, 6.35, 4.9, 0.45, '#5598bc');
      poly(c, [[1.2,-3.8],[4.9,-3.8],[2,-0.1],[1.2,-0.1]], '#9fdae9');
      line(c, 1.5, -0.55, 5.5, -0.55, '#e7f6f6', 0.45);
      oval(c, 8, -3.6, 0.8, 0.8, '#263e55', '#a8c0c9', 0.4);
      oval(c, 8, -1.55, 0.7, 0.7, '#263e55', '#a8c0c9', 0.4);
      oval(c, 9.2, -2.6, 0.35, 0.35, '#fff4c8');
    }
  }

  function clefPath(c, kind) {
    c.beginPath();
    if (kind === 'clave_sol') {
      // Espiral em torno da haste longa, com gancho inferior.
      c.moveTo(1.3, 8.2);
      c.quadraticCurveTo(-1.8, 6.3, -1.8, 3.6);
      c.quadraticCurveTo(-1.7, -0.1, 1.1, -5.3);
      c.quadraticCurveTo(3.9, -10.3, 5.1, -6.6);
      c.quadraticCurveTo(6.2, -3.5, 1.7, -1.2);
      c.quadraticCurveTo(-4.7, 1, -4.6, 4.2);
      c.quadraticCurveTo(-4.3, 7.3, -0.6, 6.7);
      c.quadraticCurveTo(3.9, 6.2, 3.8, 2.8);
      c.quadraticCurveTo(3.7, 0.9, 1.6, 0.5);
      c.quadraticCurveTo(-0.4, 0.4, -0.4, 2.4);
    } else {
      // Meia espiral da clave de fá; os pontos entram em outra peça.
      c.moveTo(-4.2, -4.9);
      c.quadraticCurveTo(-1.7, -8.2, 1.7, -6.4);
      c.quadraticCurveTo(5.1, -4.3, 2.8, -0.4);
      c.quadraticCurveTo(0.3, 4.3, -5, 6.7);
    }
  }
  function clef(c, kind, part) {
    var sol = kind === 'clave_sol';
    if (part === 'aura') {
      oval(c, 0, 0, sol ? 7.4 : 7.7, sol ? 11 : 8.5, null,
        sol ? 'rgba(255,214,103,0.54)' : 'rgba(100,232,246,0.60)', 1.35);
      oval(c, 0, 0, sol ? 9.3 : 9.7, sol ? 12.4 : 10.1, null,
        sol ? 'rgba(255,226,150,0.26)' : 'rgba(137,245,255,0.28)', 0.7);
      poly(c, [[-8,-5],[-7.2,-6.5],[-6.4,-5],[-7.2,-3.5]],
        sol ? '#fff4bb' : '#d5fbff');
      return;
    }
    if (part === 'glint') {
      poly(c, [[0,-3],[0.5,-0.5],[2.8,0],[0.5,0.5],
        [0,3],[-0.5,0.5],[-2.8,0],[-0.5,-0.5]], '#ffffff');
      return;
    }
    clefPath(c, kind); c.strokeStyle = INK; c.lineWidth = sol ? 4.3 : 4;
    c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
    clefPath(c, kind); c.strokeStyle = sol ? '#d39235' : '#278eae';
    c.lineWidth = sol ? 2.7 : 2.5; c.stroke();
    clefPath(c, kind); c.strokeStyle = sol ? '#ffce65' : '#75e4f2';
    c.lineWidth = 1.25; c.stroke();
    if (sol) {
      line(c, 0.8, -5.2, 1.8, -7.6, '#fff5bf', 0.6);
      oval(c, 1.3, 8.2, 1.2, 1.2, '#f5b751', INK, 0.5);
    } else {
      oval(c, -3.9, -5, 1.45, 1.45, '#7bebf5', INK, 0.75);
      oval(c, 5.3, -3.4, 1.35, 1.35, '#43cbe4', INK, 0.75);
      oval(c, 5.3, 1.6, 1.35, 1.35, '#43cbe4', INK, 0.75);
      oval(c, 5, -3.8, 0.4, 0.4, '#ffffff');
      oval(c, 5, 1.2, 0.4, 0.4, '#ffffff');
    }
  }

  function cavaquinho(c, part) {
    var j;
    if (part === 'cavaquinho') {
      // Corpo em oito, braço curto e cabeça com quatro tarraxas.
      c.beginPath(); c.moveTo(-2, -1.8);
      c.quadraticCurveTo(-1.2, -4.6, -4.2, -4.9);
      c.quadraticCurveTo(-5.9, -5, -7, -3.1);
      c.quadraticCurveTo(-8.8, -6.9, -11.5, -6.4);
      c.quadraticCurveTo(-14.5, -5.7, -13.8, 0);
      c.quadraticCurveTo(-14.5, 5.7, -11.5, 6.4);
      c.quadraticCurveTo(-8.8, 6.9, -7, 3.1);
      c.quadraticCurveTo(-5.9, 5, -4.2, 4.9);
      c.quadraticCurveTo(-1.2, 4.6, -2, 1.8);
      c.quadraticCurveTo(-2.6, 0, -2, -1.8);
      c.closePath(); c.fillStyle = '#c5843e'; c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
      oval(c, -10.2, 0, 2.6, 4.45, '#e8b565');
      oval(c, -3.9, 0, 1.8, 3.1, '#eac06d');
      oval(c, -4.1, 0, 2.2, 2.2, '#49302c', INK, 0.55);
      oval(c, -4.1, 0, 1.65, 1.65, '#241e27', '#ca974d', 0.45);
      line(c, -11.5, -2.8, -9.6, -3.6, '#fff0a8', 0.8);
      line(c, -9.3, -4.8, -6.8, -5.2, '#f7d58f', 0.65);
      round(c, -10.2, -1.8, 1.2, 3.6, 0.3, '#674028', INK, 0.4);
      round(c, -2.4, -1.8, 12.1, 3.6, 0.6, '#75452c', INK, 1.1);
      round(c, -1.6, -1.2, 10.6, 2.4, 0.4, '#b07841');
      for (j = 1; j <= 4; j++) line(c, j * 2 - 1.3, -1.25,
        j * 2 - 1.3, 1.25, '#e5c083', 0.48);
      poly(c, [[9.5,-2.3],[12.7,-2.6],[13.6,-1.6],[13.6,1.6],
        [12.7,2.6],[9.5,2.3]], '#9c6635', INK, 1);
      for (j = 0; j < 2; j++) {
        var px = 10.5 + j * 2.3;
        oval(c, px, -3.2, 0.9, 0.6, '#d8c4a0', INK, 0.35);
        oval(c, px, 3.2, 0.9, 0.6, '#d8c4a0', INK, 0.35);
      }
      oval(c, -9.3, -4.3, 0.85, 0.35, '#fff4bf');
    } else {
      for (j = 0; j < 4; j++) {
        var sy = -0.9 + j * 0.6;
        line(c, -9.8, sy, 12.1, sy, j % 2 ? '#fff4c7' : '#ead8ae', 0.35);
      }
      oval(c, -7.2, -0.8, 0.5, 0.3, '#ffffff');
    }
  }

  function bolo(c, part) {
    if (part === 'plate') {
      oval(c, 0, 6, 9, 1.65, '#d3cfd1', INK, 0.9);
      oval(c, 0, 5.55, 8.3, 1.1, '#fff9eb', '#b8b3b7', 0.55);
      line(c, -6.6, 5.6, 5.5, 5.6, '#ffffff', 0.55);
      return;
    }
    // A lateral expõe chocolate, recheio rosa e creme branco; a tampa afina até a ponta.
    poly(c, [[-7,-2.8],[0,-4.5],[7,1.1],[7,4.9],[-7,4.9]],
      '#683a30', INK, 1.45);
    poly(c, [[-6.5,2.9],[6.5,3.6],[6.5,4.3],[-6.5,4.3]], '#a86640');
    poly(c, [[-6.5,1.2],[6.5,2.65],[6.5,3.35],[-6.5,2.15]], '#fff2df');
    poly(c, [[-6.5,0.6],[6.5,2.1],[6.5,2.65],[-6.5,1.2]], '#e98a9e');
    poly(c, [[-6.5,-2.2],[0,-3.7],[6.5,1.25],[6.5,2],[-6.5,0.5]], '#a45d3c');
    poly(c, [[-7,-3.2],[0,-4.7],[7,1.1],[5.8,1.35],[-6.7,-2.1]],
      '#f2afc0', INK, 0.85);
    poly(c, [[-5.8,-3.05],[-0.1,-4.2],[4.8,0.1],[-5.6,-2.35]], '#ffd0d3');
    oval(c, -5.9, -1.65, 0.95, 1.55, '#efa5b6');
    oval(c, -1.3, -2.25, 0.65, 1.5, '#ef9caf');
    line(c, -5.1, -2.95, -1.2, -3.75, '#fff6ee', 0.7);
    oval(c, -2.4, -6.5, 2, 2.15, '#c93c52', INK, 0.75);
    oval(c, -3.1, -7.1, 0.65, 1.15, '#f36b77');
    poly(c, [[-4.3,-8],[-2.8,-7.7],[-2.4,-8.9],[-1.8,-7.7],[-0.5,-8.1],
      [-1.3,-6.9],[-3.5,-6.9]], '#4b8d4d', INK, 0.45);
    oval(c, -2.9, -5.9, 0.25, 0.3, '#fff2b8');
    oval(c, -1.7, -6.3, 0.25, 0.3, '#fff2b8');
  }

  function pixelText(c, word, x, y) {
    var glyphs = {
      c: ['011','100','100','100','011'],
      r: ['110','101','100','100','100'],
      e: ['011','100','111','100','011'],
      i: ['010','000','010','010','010'],
      a: ['010','101','111','101','101'],
      s: ['011','100','010','001','110'],
      t: ['111','010','010','010','011']
    };
    var dot = 0.28;
    c.fillStyle = '#f5f6f0';
    for (var j = 0; j < word.length; j++) {
      var rows = glyphs[word[j]];
      for (var yy = 0; yy < 5; yy++) {
        for (var xx = 0; xx < 3; xx++) {
          if (rows[yy][xx] === '1') c.fillRect(x + j * 1.12 + xx * dot,
            y + yy * dot, dot, dot);
        }
      }
    }
  }
  function micreia(c, part) {
    if (part === 'micHandle') {
      round(c, -12.4, -1.5, 14.2, 3, 1, '#11151d', INK, 1.1);
      round(c, -11.5, -1.05, 11.9, 1.25, 0.45, '#434a56');
      line(c, -10.6, 0.65, -2, 0.65, '#252c36', 0.65);
      oval(c, -12, 0, 0.75, 1.35, '#303744', INK, 0.6);
      round(c, -0.2, -2.1, 3.2, 4.2, 0.7, '#616873', INK, 0.65);
      line(c, 0.5, -1.3, 0.5, 1.3, '#a0a5a8', 0.55);
      return;
    }
    // Espuma preta retangular; símbolo e texto reproduzem a composição da referência.
    round(c, 1.3, -5.4, 12.1, 10.8, 1.9, '#15171e', INK, 1.35);
    round(c, 1.8, -5.05, 10.9, 9.8, 1.5, '#262a32');
    poly(c, [[2.5,-4.9],[11.5,-4.9],[10.1,-3.9],[2.2,-3.9]], '#343943');
    round(c, 12, -4.2, 0.8, 8.4, 0.35, '#11131a');
    oval(c, 4.5, 0, 2.7, 2.7, '#3b4147', '#15191f', 0.55);
    oval(c, 4.2, -0.35, 2.05, 2.05, '#454b50');
    // Cruz dourada cuja haste é um microfone com grade e suporte em U.
    oval(c, 4.4, -1.4, 0.56, 0.93, '#e7ba48', '#8b671e', 0.35);
    line(c, 4.05, -1.75, 4.75, -1.75, '#946f28', 0.25);
    line(c, 4.05, -1.42, 4.75, -1.42, '#946f28', 0.25);
    line(c, 4.05, -1.08, 4.75, -1.08, '#946f28', 0.25);
    line(c, 4.4, -0.5, 4.4, 1.65, '#f3c950', 0.72);
    line(c, 3.3, -0.15, 5.5, -0.15, '#f3c950', 0.66);
    c.beginPath(); c.moveTo(3.5, 0.75);
    c.quadraticCurveTo(4.4, 2.2, 5.3, 0.75);
    c.strokeStyle = '#d8ab40'; c.lineWidth = 0.48; c.lineCap = 'round'; c.stroke();
    line(c, 4.4, 1.6, 4.4, 2.15, '#e9bd49', 0.45);
    line(c, 3.65, 2.15, 5.15, 2.15, '#e9bd49', 0.45);
    pixelText(c, 'creia', 6.85, -2.55);
    pixelText(c, 'cast', 6.85, 0.2);
    line(c, 2.6, -4.05, 6.4, -4.05, '#545b66', 0.5);
  }

  function makePart(kind, part) {
    var key = kind + ':' + part;
    if (CACHE[key]) return CACHE[key];
    if (typeof document === 'undefined' || !document.createElement) return null;
    var box = BOX[part];
    var canvas = document.createElement('canvas');
    canvas.width = box[0] * 2; canvas.height = box[1] * 2;
    var c = canvas.getContext('2d');
    if (!c) return null;
    c.scale(2, 2); c.translate(box[2], box[3]);
    if (kind === 'crash' || kind === 'ride') {
      if (part === 'glint') glint(c, kind);
      else cymbal(c, kind);
    } else if (kind === 'drone') drone(c, part);
    else if (kind === 'gimbal') gimbal(c, part);
    else if (kind === 'clave_sol' || kind === 'clave_fa') clef(c, kind, part);
    else if (kind === 'cavaquinho') cavaquinho(c, part);
    else if (kind === 'bolo') bolo(c, part);
    else micreia(c, part);
    CACHE[key] = canvas;
    return canvas;
  }
  function place(ctx, image, part) {
    var box = BOX[part];
    ctx.drawImage(image, -box[2], -box[3], box[0], box[1]);
  }
  function drawCymbal(ctx, kind, t) {
    var r = kind === 'ride' ? 8.2 : 6.5;
    ctx.rotate(0.035 * Math.sin(t * 30));
    ctx.scale(1, 0.94 + 0.06 * Math.sin(t * 25));
    place(ctx, makePart(kind, 'cymbal'), 'cymbal');
    var spin = t * (kind === 'ride' ? 18 : 23);
    ctx.save(); ctx.translate(r * Math.cos(spin), 1.6 * Math.sin(spin) - 0.7);
    ctx.globalAlpha *= 0.72 + 0.28 * Math.max(0, Math.cos(spin));
    place(ctx, makePart(kind, 'glint'), 'glint'); ctx.restore();
  }
  function drawDrone(ctx, t) {
    ctx.translate(0, 0.55 * Math.sin(t * 6));
    ctx.rotate(0.035 * Math.sin(t * 9));
    var rotor = makePart('drone', 'rotor');
    var points = [[-6,-3],[6,-3],[-6,3],[6,3]];
    for (var j = 0; j < 4; j++) {
      ctx.save(); ctx.translate(points[j][0], points[j][1]);
      ctx.rotate(t * (j % 2 ? -39 : 39) + j * 0.8);
      place(ctx, rotor, 'rotor'); ctx.restore();
    }
    place(ctx, makePart('drone', 'drone'), 'drone');
    if (Math.floor(t * 8) % 2 === 0) {
      ctx.save(); ctx.translate(7.4, -1.5);
      place(ctx, makePart('drone', 'led'), 'led'); ctx.restore();
    }
  }
  function drawGimbal(ctx, t) {
    place(ctx, makePart('gimbal', 'grip'), 'grip');
    ctx.save(); ctx.translate(17, -0.25);
    ctx.rotate(-0.025 * Math.sin(t * 7));
    place(ctx, makePart('gimbal', 'phone'), 'phone'); ctx.restore();
  }
  function drawClef(ctx, kind, t) {
    ctx.translate(0, 0.45 * Math.sin(t * 7));
    ctx.rotate(0.07 * Math.sin(t * 9));
    if (kind === 'clave_fa') ctx.scale(0.95, 0.78);
    ctx.save(); ctx.globalAlpha *= 0.72 + 0.2 * Math.sin(t * 8);
    place(ctx, makePart(kind, 'aura'), 'aura'); ctx.restore();
    place(ctx, makePart(kind, 'clef'), 'clef');
    ctx.save(); ctx.translate(5.5 * Math.cos(t * 7),
      (kind === 'clave_sol' ? 7.5 : 5.2) * Math.sin(t * 7));
    ctx.globalAlpha *= 0.65 + 0.3 * Math.sin(t * 11) * Math.sin(t * 11);
    place(ctx, makePart(kind, 'glint'), 'glint'); ctx.restore();
  }
  function drawCavaquinho(ctx, t) {
    ctx.rotate(0.018 * Math.sin(t * 15));
    ctx.scale(0.93, 0.93);
    place(ctx, makePart('cavaquinho', 'cavaquinho'), 'cavaquinho');
    ctx.save(); ctx.translate(0, 0.035 * Math.sin(t * 65));
    place(ctx, makePart('cavaquinho', 'strings'), 'strings'); ctx.restore();
  }
  function drawBolo(ctx, t) {
    ctx.translate(0, 0.3 * Math.sin(t * 7));
    ctx.rotate(0.025 * Math.sin(t * 8));
    place(ctx, makePart('bolo', 'plate'), 'plate');
    place(ctx, makePart('bolo', 'cake'), 'cake');
  }
  function drawMicreia(ctx, t) {
    ctx.rotate(0.022 * Math.sin(t * 15));
    place(ctx, makePart('micreia', 'micHandle'), 'micHandle');
    place(ctx, makePart('micreia', 'micFoam'), 'micFoam');
  }
  function draw(ctx, kind, t, x, y, rot, facing) {
    if (!ctx || KINDS.indexOf(kind) < 0) return false;
    t = typeof t === 'number' && isFinite(t) ? t : 0;
    rot = typeof rot === 'number' && isFinite(rot) ? rot : 0;
    ctx.save(); ctx.translate(x, y);
    if (facing === -1) ctx.scale(-1, 1);
    ctx.rotate(rot);
    ctx.imageSmoothingEnabled = true;
    if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';
    if (kind === 'crash' || kind === 'ride') drawCymbal(ctx, kind, t);
    else if (kind === 'drone') drawDrone(ctx, t);
    else if (kind === 'gimbal') drawGimbal(ctx, t);
    else if (kind === 'clave_sol' || kind === 'clave_fa') drawClef(ctx, kind, t);
    else if (kind === 'cavaquinho') drawCavaquinho(ctx, t);
    else if (kind === 'bolo') drawBolo(ctx, t);
    else drawMicreia(ctx, t);
    ctx.restore();
    return true;
  }

  if (typeof window !== 'undefined') window.Objetos = { kinds: KINDS.slice(), draw: draw };
})();
