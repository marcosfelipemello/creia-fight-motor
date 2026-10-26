/* BANGU VS. A FOME E AS CALORIAS — sprites.js (Revisão 2: Alta Resolução)
   Inimigos, Gato e Itens em Alta Resolução (grade de arte fina 0.5 unidade lógica)
   com animações suaves por transformação (squash & stretch, respiração, rotações).
   Author: agy
*/
(function () {
  'use strict';

  var CACHE = Object.create(null);

  function makeCanvas(w, h) {
    if (typeof document === 'undefined' || !document.createElement) {
      return {
        width: w,
        height: h,
        getContext: function () {
          return new Proxy({}, { get: function () { return function () {}; } });
        }
      };
    }
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function getCached(key, w, h, renderFn) {
    if (CACHE[key]) return CACHE[key];
    var c = makeCanvas(w, h);
    var ctx = c.getContext('2d');
    if (ctx) {
      try {
        renderFn(ctx, w, h);
      } catch (e) {}
    }
    CACHE[key] = c;
    return c;
  }

  function getFlashCached(key, srcCanvas, w, h) {
    var flashKey = key + '_flash';
    if (CACHE[flashKey]) return CACHE[flashKey];
    var fc = makeCanvas(w, h);
    var fctx = fc.getContext('2d');
    if (fctx) {
      try {
        if (srcCanvas) fctx.drawImage(srcCanvas, 0, 0);
        fctx.globalCompositeOperation = 'source-in';
        fctx.fillStyle = '#ffffff';
        fctx.fillRect(0, 0, w, h);
      } catch (e) {}
    }
    CACHE[flashKey] = fc;
    return fc;
  }

  /* -------------------------------------------------------------
     NOVOS TAMANHOS DE INIMIGO (CONTRATO REVISÃO 2)
  ------------------------------------------------------------- */
  function enemySize(kind) {
    switch (kind) {
      case 'fome': return { w: 48, h: 40 };
      case 'batata': return { w: 34, h: 44 };
      case 'refri': return { w: 28, h: 42 };
      case 'gordura': return { w: 70, h: 80 };
      case 'coxinha': return { w: 26, h: 30 };
      default: return { w: 32, h: 32 };
    }
  }

  /* -------------------------------------------------------------
     PEÇAS HD DE INIMIGOS (Renderizadas a 2x em canvas fora da tela)
  ------------------------------------------------------------- */

  // 1. FOME (48x40) - Bolha gelatinosa âmbar translúcida derretendo
  function renderFomeHD(ctx, state, t) {
    var sz = enemySize('fome');
    var w = sz.w, h = sz.h;
    var cx = w / 2, cy = h * 0.58;

    // Transformações suaves a partir de t
    var scaleX = 1, scaleY = 1, rot = 0, dx = 0, dy = 0;
    var mouthOpen = 0.5;

    if (state === 'idle') {
      var b = Math.sin(t * 5);
      scaleX = 1 + 0.05 * b;
      scaleY = 1 - 0.05 * b;
      dy = -0.5 * b;
    } else if (state === 'walk') {
      var ph = t * 9;
      scaleX = 1 + 0.14 * Math.sin(ph);
      scaleY = 1 - 0.12 * Math.sin(ph);
      rot = 0.08 * Math.sin(ph);
      dy = -Math.abs(Math.sin(ph)) * 2;
    } else if (state === 'attack') {
      var at = Math.sin(t * 8);
      scaleX = 1.25;
      scaleY = 0.85;
      rot = 0.12;
      dx = 4;
      mouthOpen = 1.0;
    } else if (state === 'hurt') {
      rot = -0.22;
      dx = -3 + Math.sin(t * 40) * 1.5;
      scaleY = 0.9;
    } else if (state === 'ko') {
      scaleY = 0.28;
      scaleX = 1.4;
      dy = 12;
    }

    ctx.save();
    ctx.translate(cx + dx, cy + dy);
    ctx.rotate(rot);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-cx, -cy);

    // 1. Poça / Gotas na base
    ctx.fillStyle = '#2d1305';
    ctx.beginPath();
    ctx.ellipse(cx, h - 5, 23, 7, 0, 0, Math.PI * 2);
    ctx.arc(cx - 20, h - 3, 3.5, 0, Math.PI * 2);
    ctx.arc(cx - 10, h - 2, 3, 0, Math.PI * 2);
    ctx.arc(cx + 8, h - 2, 3.2, 0, Math.PI * 2);
    ctx.arc(cx + 19, h - 3, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // 2. Contorno do corpo de bolha
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, 21, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, cy - 6, 17, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Braços de geleia viscosa se esticando
    var armSway = Math.sin(t * 6) * 2;
    ctx.beginPath();
    ctx.arc(cx - 19, cy + 2 + armSway, 4.5, 0, Math.PI * 2);
    ctx.arc(cx + 19, cy + 2 - armSway, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Preenchimento âmbar translúcido
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, 19, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, cy - 6, 15, 11, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, h - 5, 21, 5, 0, 0, Math.PI * 2);
    ctx.arc(cx - 20, h - 3, 2.5, 0, Math.PI * 2);
    ctx.arc(cx - 10, h - 2, 2.2, 0, Math.PI * 2);
    ctx.arc(cx + 8, h - 2, 2.4, 0, Math.PI * 2);
    ctx.arc(cx + 19, h - 3, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // 4. Meio-tom e reflexos dourados
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(cx - 2, cy - 2, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(cx - 4, cy - 9, 8, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Brilho branco no topo
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - 6, cy - 12, 4.5, 2, -0.3, 0, Math.PI * 2);
    ctx.arc(cx - 1, cy - 13, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Olhos esbugalhados
    if (state === 'hurt') {
      ctx.strokeStyle = '#2d1305';
      ctx.lineWidth = 1.8;
      // > <
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 11); ctx.lineTo(cx - 5, cy - 9); ctx.lineTo(cx - 8, cy - 7);
      ctx.moveTo(cx + 4, cy - 11); ctx.lineTo(cx + 7, cy - 9); ctx.lineTo(cx + 4, cy - 7);
      ctx.stroke();
    } else if (state === 'ko') {
      ctx.strokeStyle = '#2d1305';
      ctx.lineWidth = 1.8;
      // X X
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 2); ctx.lineTo(cx - 4, cy + 2);
      ctx.moveTo(cx - 4, cy - 2); ctx.lineTo(cx - 8, cy + 2);
      ctx.moveTo(cx + 4, cy - 2); ctx.lineTo(cx + 8, cy + 2);
      ctx.moveTo(cx + 8, cy - 2); ctx.lineTo(cx + 4, cy + 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx - 6, cy - 8, 4.5, 0, Math.PI * 2);
      ctx.arc(cx + 4, cy - 9, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2d1305';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 8, 2.2, 0, Math.PI * 2);
      ctx.arc(cx + 5, cy - 9, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 6, cy - 10, 1.2, 1.2);
      ctx.fillRect(cx + 4, cy - 11, 1.4, 1.4);
    }

    // 6. Bocão com dentes e língua (se não estiver em KO)
    if (state !== 'ko') {
      var mw = 12 + 6 * mouthOpen;
      var mh = 7 + 6 * mouthOpen;
      var my = cy + 4;

      ctx.fillStyle = '#2d1305';
      ctx.beginPath();
      ctx.ellipse(cx + 2, my, mw + 1.2, mh + 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.ellipse(cx + 2, my, mw, mh, 0, 0, Math.PI * 2);
      ctx.fill();

      // Língua rosa
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.ellipse(cx + 3, my + mh * 0.45, mw * 0.6, mh * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dentes afiados brancos
      ctx.fillStyle = '#ffffff';
      var numTeeth = 5;
      for (var i = 0; i < numTeeth; i++) {
        var tx = cx - mw * 0.7 + (i * mw * 1.4) / (numTeeth - 1);
        ctx.beginPath();
        ctx.moveTo(tx - 1.5, my - mh * 0.8);
        ctx.lineTo(tx, my - mh * 0.2);
        ctx.lineTo(tx + 1.5, my - mh * 0.8);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // 2. BATATA (34x44) - Caixinha vermelha, batatas douradas, olhos malucos, perninhas
  function renderBatataHD(ctx, state, t) {
    var sz = enemySize('batata');
    var w = sz.w, h = sz.h;
    var cx = w / 2, cy = h * 0.6;

    var scaleX = 1, scaleY = 1, rot = 0, dx = 0, dy = 0;
    var legRotL = 0, legRotR = 0;

    if (state === 'idle') {
      var vib = Math.sin(t * 12) * 0.4;
      dx = vib;
      scaleY = 1 + 0.03 * Math.sin(t * 6);
    } else if (state === 'walk') {
      var ph = t * 14;
      legRotL = Math.sin(ph) * 0.6;
      legRotR = -Math.sin(ph) * 0.6;
      rot = Math.sin(ph) * 0.08;
      dy = -Math.abs(Math.sin(ph)) * 2;
    } else if (state === 'attack') {
      rot = 0.2;
      dx = 4;
      scaleX = 1.1;
    } else if (state === 'hurt') {
      rot = -0.28;
      dx = -3 + Math.sin(t * 40) * 1.5;
    } else if (state === 'ko') {
      rot = -1.45;
      dy = 14;
      dx = -4;
    }

    ctx.save();
    ctx.translate(cx + dx, cy + dy);
    ctx.rotate(rot);
    ctx.translate(-cx, -cy);

    // 1. Perninhas vermelhas
    if (state !== 'ko') {
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      // Perna esquerda
      ctx.save();
      ctx.translate(cx - 6, cy + 12);
      ctx.rotate(legRotL);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 7); ctx.stroke();
      ctx.restore();
      // Perna direita
      ctx.save();
      ctx.translate(cx + 6, cy + 12);
      ctx.rotate(legRotR);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 7); ctx.stroke();
      ctx.restore();
    }

    // 2. Batatas douradas explodindo para cima
    ctx.fillStyle = '#b45309';
    var fries = [
      { x: -9, y: -20, w: 4.5, h: 14, r: -0.25 },
      { x: -4, y: -25, w: 4.8, h: 18, r: -0.1 },
      { x: 1, y: -27, w: 5, h: 20, r: 0.05 },
      { x: 6, y: -22, w: 4.5, h: 16, r: 0.2 }
    ];
    fries.forEach(function (f) {
      ctx.save();
      ctx.translate(cx + f.x, cy + f.y);
      ctx.rotate(f.r);
      ctx.fillRect(-f.w / 2 - 0.8, 0, f.w + 1.6, f.h + 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-f.w / 2, 1, f.w, f.h);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-f.w / 2 + 1, 2, f.w - 2, f.h - 4);
      ctx.restore();
    });

    // 3. Caixinha vermelha (com bico arredondado)
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 8);
    ctx.lineTo(cx + 12, cy - 8);
    ctx.lineTo(cx + 10, cy + 14);
    ctx.lineTo(cx - 10, cy + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy - 7);
    ctx.lineTo(cx + 11, cy - 7);
    ctx.lineTo(cx + 9, cy + 13);
    ctx.lineTo(cx - 9, cy + 13);
    ctx.closePath();
    ctx.fill();

    // Borda superior recortada / aba
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 11, cy - 8, 22, 1.8);

    // Sombra na caixa
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy - 7);
    ctx.lineTo(cx - 6, cy - 7);
    ctx.lineTo(cx - 5, cy + 13);
    ctx.lineTo(cx - 9, cy + 13);
    ctx.closePath();
    ctx.fill();

    // 4. Olhos malucos
    if (state === 'hurt') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 1); ctx.lineTo(cx - 3, cy + 1); ctx.lineTo(cx - 7, cy + 3);
      ctx.moveTo(cx + 7, cy - 1); ctx.lineTo(cx + 3, cy + 1); ctx.lineTo(cx + 7, cy + 3);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 5, cy + 1, 4.2, 0, Math.PI * 2);
      ctx.arc(cx + 5, cy + 1, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#000000';
      var pupilOff = (state === 'idle') ? Math.sin(t * 8) * 1.2 : 0;
      ctx.beginPath();
      ctx.arc(cx - 5 + pupilOff, cy + 1, 2, 0, Math.PI * 2);
      ctx.arc(cx + 5 + pupilOff, cy + 1, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Bocão gritando com dentes
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, 6.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, 5.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 4, cy + 5.5, 8, 1.8);

    // Gota de gordura pingando
    if (state === 'idle') {
      var dropY = (t * 20) % 18;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(cx - 11, cy + dropY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 3. REFRI (28x42) - Lata vermelha amassada, bolhas de gás animadas e espuma no topo
  function renderRefriHD(ctx, state, t) {
    var sz = enemySize('refri');
    var w = sz.w, h = sz.h;
    var cx = w / 2, cy = h * 0.55;

    var rot = 0, dx = 0, dy = 0, scaleY = 1;

    if (state === 'idle') {
      dx = Math.sin(t * 22) * 0.5;
    } else if (state === 'walk') {
      var ph = t * 11;
      dy = -Math.abs(Math.sin(ph)) * 3.5;
      rot = Math.sin(ph) * 0.12;
    } else if (state === 'attack') {
      rot = 0.22;
      dx = 4;
    } else if (state === 'hurt') {
      rot = -0.3;
      dx = -3 + Math.sin(t * 40) * 1.5;
    } else if (state === 'ko') {
      rot = -1.45;
      dy = 14;
      scaleY = 0.25;
    }

    ctx.save();
    ctx.translate(cx + dx, cy + dy);
    ctx.rotate(rot);
    ctx.scale(1, scaleY);
    ctx.translate(-cx, -cy);

    // 1. Bolhas de gás animadas subindo no topo
    var b1 = (t * 18) % 14;
    var b2 = ((t + 0.3) * 18) % 14;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 18 - b1, 1.4, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 18 - b2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 2. Espuma / Froth transbordando no topo
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 18, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Jato de espuma no ataque!
    if (state === 'attack') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx + 15, cy - 18, 12, 5, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.arc(cx + 25, cy - 20, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 28, cy - 16, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Aro superior de alumínio
    ctx.fillStyle = '#4a044e';
    ctx.fillRect(cx - 9.5, cy - 16, 19, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 8.5, cy - 15.5, 17, 2);

    // 4. Corpo da lata vermelha/cereja (amassada no meio)
    ctx.fillStyle = '#4a044e';
    ctx.beginPath();
    ctx.moveTo(cx - 9.5, cy - 13);
    ctx.lineTo(cx + 9.5, cy - 13);
    ctx.lineTo(cx + 8.5, cy - 1);
    ctx.lineTo(cx + 9.5, cy + 14);
    ctx.lineTo(cx - 9.5, cy + 14);
    ctx.lineTo(cx - 8.5, cy - 1);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#831843';
    ctx.beginPath();
    ctx.moveTo(cx - 8.5, cy - 12);
    ctx.lineTo(cx + 8.5, cy - 12);
    ctx.lineTo(cx + 7.5, cy - 1);
    ctx.lineTo(cx + 8.5, cy + 13);
    ctx.lineTo(cx - 8.5, cy + 13);
    ctx.lineTo(cx - 7.5, cy - 1);
    ctx.closePath();
    ctx.fill();

    // Faixa brilhante vertical
    ctx.fillStyle = '#be185d';
    ctx.fillRect(cx - 7, cy - 12, 3.5, 25);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 6, cy - 10, 1.2, 21);

    // 5. Aro inferior de alumínio
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 8.5, cy + 13, 17, 2.5);

    // 6. Cara maluca da lata
    if (state === 'hurt') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 4); ctx.lineTo(cx - 2, cy - 1);
      ctx.moveTo(cx - 2, cy - 4); ctx.lineTo(cx - 5, cy - 1);
      ctx.moveTo(cx + 2, cy - 4); ctx.lineTo(cx + 5, cy - 1);
      ctx.moveTo(cx + 5, cy - 4); ctx.lineTo(cx + 2, cy - 1);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 4, cy - 2, 3.2, 0, Math.PI * 2);
      ctx.arc(cx + 4, cy - 2, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx - 4, cy - 2, 1.5, 0, Math.PI * 2);
      ctx.arc(cx + 4, cy - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Sorriso zig-zag
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 6, cy + 4, 12, 3);
      ctx.fillStyle = '#4a044e';
      ctx.fillRect(cx - 4, cy + 5, 2, 1.5);
      ctx.fillRect(cx, cy + 5, 2, 1.5);
      ctx.fillRect(cx + 4, cy + 5, 2, 1.5);
    }

    ctx.restore();
  }

  // 4. GORDURA (70x80) - Brutamontes empanado com crosta crocante, migalhas, braços grossos
  function renderGorduraHD(ctx, state, t) {
    var sz = enemySize('gordura');
    var w = sz.w, h = sz.h;
    var cx = w / 2, cy = h * 0.52;

    var scaleX = 1, scaleY = 1, rot = 0, dx = 0, dy = 0;
    var armAngle = 0;

    if (state === 'idle') {
      var b = Math.sin(t * 3);
      scaleX = 1 + 0.03 * b;
      scaleY = 1 - 0.02 * b;
      armAngle = Math.sin(t * 3) * 0.05;
    } else if (state === 'walk') {
      var ph = t * 6;
      rot = Math.sin(ph) * 0.07;
      dy = -Math.abs(Math.sin(ph)) * 3;
      armAngle = Math.sin(ph) * 0.25;
    } else if (state === 'attack') {
      armAngle = -2.1;
      dy = -2;
    } else if (state === 'guard') {
      armAngle = 0;
    } else if (state === 'hurt') {
      rot = -0.18;
      dx = -4 + Math.sin(t * 40) * 1.5;
    } else if (state === 'ko') {
      rot = -1.4;
      dy = 22;
      scaleY = 0.55;
    }

    ctx.save();
    ctx.translate(cx + dx, cy + dy);
    ctx.rotate(rot);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-cx, -cy);

    // 1. Pernas curtas e grossas de empanado
    ctx.fillStyle = '#2a1205';
    ctx.beginPath();
    ctx.ellipse(cx - 12, cy + 28, 9, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 12, cy + 28, 9, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(cx - 12, cy + 28, 7, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 12, cy + 28, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Tronco: colossal barril arredondado de massa empanada
    ctx.fillStyle = '#2a1205';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 26, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8c3a08';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 24, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 20, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(cx - 2, cy - 2, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy - 5, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Cabeça de cúpula de empanado
    ctx.fillStyle = '#2a1205';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 20, 16, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8c3a08';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 20, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 22, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Olhos malévolos vermelhos sob a crosta
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - 8, cy - 19, 5, 2.5);
    ctx.fillRect(cx + 3, cy - 19, 5, 2.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 6, cy - 19, 1.5, 1.5);
    ctx.fillRect(cx + 5, cy - 19, 1.5, 1.5);

    // 4. Braços grossos arredondados de empanado
    if (state === 'guard') {
      // Cruzados na frente do rosto em X firme
      ctx.fillStyle = '#2a1205';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, 20, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Faísca
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 1, cy - 10, 3, 3);
    } else {
      // Braço esquerdo
      ctx.save();
      ctx.translate(cx - 20, cy - 6);
      ctx.rotate(-armAngle);
      ctx.fillStyle = '#2a1205';
      ctx.beginPath(); ctx.ellipse(0, 14, 9, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.beginPath(); ctx.ellipse(0, 14, 7.5, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.ellipse(-1, 14, 4.5, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Braço direito
      ctx.save();
      ctx.translate(cx + 20, cy - 6);
      ctx.rotate(armAngle);
      ctx.fillStyle = '#2a1205';
      ctx.beginPath(); ctx.ellipse(0, 14, 9, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.beginPath(); ctx.ellipse(0, 14, 7.5, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.ellipse(1, 14, 4.5, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // 5. Pontinhos de migalha crocante (panko dourado)
    ctx.fillStyle = '#fef08a';
    var crumbs = [
      { x: -14, y: -16 }, { x: 12, y: -14 }, { x: -6, y: 5 }, { x: 16, y: 8 },
      { x: -18, y: -4 }, { x: 8, y: -26 }, { x: -10, y: 15 }, { x: 10, y: 17 }
    ];
    crumbs.forEach(function (cr) {
      ctx.fillRect(cx + cr.x, cy + cr.y, 1.8, 1.8);
    });

    ctx.restore();
  }

  // 5. COXINHA (26x30) - Coxinha dourada em forma de gota com cara brava e perninhas
  function renderCoxinhaHD(ctx, state, t) {
    var sz = enemySize('coxinha');
    var w = sz.w, h = sz.h;
    var cx = w / 2, cy = h * 0.52;

    var scaleX = 1, scaleY = 1, rot = 0, dx = 0, dy = 0;
    var legRotL = 0, legRotR = 0;

    if (state === 'idle') {
      dy = -Math.abs(Math.sin(t * 6)) * 1.5;
    } else if (state === 'walk') {
      var ph = t * 16;
      legRotL = Math.sin(ph) * 0.7;
      legRotR = -Math.sin(ph) * 0.7;
      rot = Math.sin(ph) * 0.12;
      dy = -Math.abs(Math.sin(ph)) * 1.8;
    } else if (state === 'attack') {
      rot = 0.75; // mergulho torpedo
      dx = 5;
    } else if (state === 'hurt') {
      rot = -0.3;
      dx = -3 + Math.sin(t * 40) * 1.5;
      scaleY = 0.8;
    } else if (state === 'ko') {
      rot = 1.5;
      dy = 10;
    }

    ctx.save();
    ctx.translate(cx + dx, cy + dy);
    ctx.rotate(rot);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-cx, -cy);

    // 1. Perninhas
    if (state !== 'ko') {
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.save();
      ctx.translate(cx - 5, cy + 9);
      ctx.rotate(legRotL);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 5); ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(cx + 5, cy + 9);
      ctx.rotate(legRotR);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 5); ctx.stroke();
      ctx.restore();
    }

    // 2. Ponta / osso no topo
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 12, 2.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Corpo em formato de gota (teardrop)
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 11);
    ctx.bezierCurveTo(cx - 12, cy - 2, cx - 12, cy + 10, cx, cy + 10);
    ctx.bezierCurveTo(cx + 12, cy + 10, cx + 12, cy - 2, cx, cy - 11);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.bezierCurveTo(cx - 10.5, cy - 2, cx - 10.5, cy + 9, cx, cy + 9);
    ctx.bezierCurveTo(cx + 10.5, cy + 9, cx + 10.5, cy - 2, cx, cy - 10);
    ctx.fill();

    // Brilho dourado
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy, 6, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Cara brava
    if (state === 'ko') {
      // Rachada aberta com frango desfiado visível
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx - 3.5, cy + 1, 1.8, 0, Math.PI * 2);
      ctx.arc(cx + 3.5, cy + 1, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Sobrancelhas franzidas bravas
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 2); ctx.lineTo(cx - 1.5, cy);
      ctx.moveTo(cx + 6, cy - 2); ctx.lineTo(cx + 1.5, cy);
      ctx.stroke();

      // Boquinha brava
      ctx.beginPath();
      ctx.moveTo(cx - 2.5, cy + 5); ctx.lineTo(cx + 2.5, cy + 5);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
     GATO HD (drawCat) - 24x22
     Gatinho de rua rajado laranja e branco, rabo que balança, orelhas mexendo
  ------------------------------------------------------------- */
  function renderCatHD(ctx, state, t) {
    var w = 24, h = 22;
    var cx = w / 2, cy = h * 0.65;

    ctx.save();
    ctx.translate(cx, cy);

    var tailRot = Math.sin(t * 4) * 0.35;
    var earRot = Math.sin(t * 2) * 0.08;
    var breathe = Math.sin(t * 3) * 0.5;

    if (state === 'purr') {
      var vib = Math.sin(t * 35) * 0.8;
      ctx.translate(0, vib);
    }

    // 1. Rabo que balança suavemente
    ctx.save();
    ctx.translate(-7, 2);
    ctx.rotate(-0.4 + tailRot);
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-6, -6, -4, -13);
    ctx.stroke();
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 2. Corpo arredondado rajado laranja e branco
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(0, 2 + breathe, 9, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Listras rajadas
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-4, -2 + breathe); ctx.lineTo(-3, 3 + breathe);
    ctx.moveTo(0, -3 + breathe); ctx.lineTo(1, 4 + breathe);
    ctx.stroke();

    // Peito e barriga branca
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(3, 3 + breathe, 5.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Patinhas dianteiras sentadas
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(2, 7.5, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(6, 7.5, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Cabeça
    var headX = 4, headY = -5;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(headX, headY, 6.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Orelhas pontudas com rosa dentro
    ctx.save();
    ctx.translate(headX, headY);
    // Orelha esquerda
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-5, -3); ctx.lineTo(-4 + earRot, -9); ctx.lineTo(-1, -4);
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(-4.2, -3.5); ctx.lineTo(-3.8 + earRot, -7.5); ctx.lineTo(-1.8, -4.2);
    ctx.fill();

    // Orelha direita
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.moveTo(1, -4); ctx.lineTo(4 - earRot, -9); ctx.lineTo(5, -3);
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(1.8, -4.2); ctx.lineTo(3.8 - earRot, -7.5); ctx.lineTo(4.2, -3.5);
    ctx.fill();

    // 4. Olhos e focinho
    if (state === 'purr') {
      // Olhos fechados em arco feliz ^ ^
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(-2, -0.5, 2, Math.PI, 0);
      ctx.arc(3, -0.5, 2, Math.PI, 0);
      ctx.stroke();
      // Bolhas de purr
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(8, -8 + Math.sin(t * 8) * 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (state === 'lick') {
      // Lambendo a patinha
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(-2, -0.5, 1.8, Math.PI, 0);
      ctx.stroke();
      // Língua rosa
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.ellipse(0, 1.5, 1.8, 2.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Olhos verdes esmeralda com brilho
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(-2, -1, 1.8, 2.2, 0, 0, Math.PI * 2);
      ctx.ellipse(3, -1, 1.8, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(-2, -1, 0.9, 1.8, 0, 0, Math.PI * 2);
      ctx.ellipse(3, -1, 0.9, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2.5, -2, 1, 1);
      ctx.fillRect(2.5, -2, 1, 1);
    }

    // Focinho rosa e bigodes finos
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(0.5, 1.2, 1.2, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(3, 1.5); ctx.lineTo(8, 0.5);
    ctx.moveTo(3, 2.5); ctx.lineTo(8, 3.5);
    ctx.stroke();

    ctx.restore(); // orelhas/cabeça
    ctx.restore(); // gato
  }

  /* -------------------------------------------------------------
     ITENS HD (brocolis, maca, gordura, coracao, brilho, estrela)
     ~12–14 unidades, contorno escuro, brilho
  ------------------------------------------------------------- */
  function renderItemHD(ctx, kind) {
    ctx.save();
    switch (kind) {
      case 'brocolis': {
        // ~14x14: buquê de brócolis esmeralda
        ctx.fillStyle = '#0f3816';
        ctx.beginPath();
        ctx.arc(-3, -2, 4.5, 0, Math.PI * 2);
        ctx.arc(3, -2, 4.5, 0, Math.PI * 2);
        ctx.arc(0, -5, 5, 0, Math.PI * 2);
        ctx.fillRect(-2, 0, 4, 7);
        ctx.fill();

        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(-3, -2, 3.8, 0, Math.PI * 2);
        ctx.arc(3, -2, 3.8, 0, Math.PI * 2);
        ctx.arc(0, -5, 4.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(-1, -5.5, 2.5, 0, Math.PI * 2);
        ctx.arc(2.5, -3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Talo verde claro
        ctx.fillStyle = '#86efac';
        ctx.fillRect(-1.5, 0.5, 3, 5.5);
        break;
      }

      case 'maca': {
        // ~13x13: maçã vermelha brilhante
        ctx.fillStyle = '#450a0a';
        ctx.beginPath();
        ctx.ellipse(-2.5, 0, 4.5, 5.5, 0, 0, Math.PI * 2);
        ctx.ellipse(2.5, 0, 4.5, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.ellipse(-2.5, 0, 3.8, 4.8, 0, 0, Math.PI * 2);
        ctx.ellipse(2.5, 0, 3.8, 4.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Brilho
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.ellipse(-2, -1.5, 2.8, 3.5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, -2.5, 1.6, 2);

        // Cabinho e folhinha
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-0.5, -6, 1.2, 3);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(2, -5.5, 2.2, 1.2, 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'gordura': {
        // Gota de gordura âmbar translúcida
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.bezierCurveTo(-5, 0, -5, 6, 0, 6);
        ctx.bezierCurveTo(5, 6, 5, 0, 0, -6);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.bezierCurveTo(-4, 0, -4, 5, 0, 5);
        ctx.bezierCurveTo(4, 5, 4, 0, 0, -5);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(-1, 0, 2.2, 3.2, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1.5, -1.5, 1.2, 2);
        break;
      }

      case 'coracao': {
        // Coração rosa brilhante
        ctx.fillStyle = '#831843';
        ctx.beginPath();
        ctx.ellipse(-3, -2, 4, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(3, -2, 4, 4, 0, 0, Math.PI * 2);
        ctx.moveTo(-6, -1); ctx.lineTo(0, 6); ctx.lineTo(6, -1);
        ctx.fill();

        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.ellipse(-2.5, -2, 3.2, 3.2, 0, 0, Math.PI * 2);
        ctx.ellipse(2.5, -2, 3.2, 3.2, 0, 0, Math.PI * 2);
        ctx.moveTo(-5, -1); ctx.lineTo(0, 5); ctx.lineTo(5, -1);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, -3.5, 1.5, 1.5);
        break;
      }

      case 'brilho': {
        // Estrela de 4 pontas
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -6.5); ctx.lineTo(1.8, -1.8); ctx.lineTo(6.5, 0);
        ctx.lineTo(1.8, 1.8); ctx.lineTo(0, 6.5); ctx.lineTo(-1.8, 1.8);
        ctx.lineTo(-6.5, 0); ctx.lineTo(-1.8, -1.8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'estrela': {
        // Faísca de impacto com pontas amarelas e centro branco
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        for (var i = 0; i < 8; i++) {
          var a = (i * Math.PI) / 4;
          var rOut = 6.5, rIn = 3.2;
          ctx.lineTo(Math.cos(a) * rOut, Math.sin(a) * rOut);
          ctx.lineTo(Math.cos(a + Math.PI / 8) * rIn, Math.sin(a + Math.PI / 8) * rIn);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      // Fallbacks para tomate, banana, cenoura, halter se o rig não estiver disponível
      case 'tomate': {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-2, -2, 1.5, 1.5);
        ctx.fillStyle = '#16a34a'; ctx.fillRect(-1, -6, 2, 2);
        break;
      }
      case 'banana': {
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.ellipse(0, 0, 6, 2.5, 0.3, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'cenoura': {
        ctx.fillStyle = '#ea580c';
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 3); ctx.lineTo(-3, 4); ctx.fill();
        ctx.fillStyle = '#16a34a'; ctx.fillRect(-6, -2, 3, 3);
        break;
      }
      case 'halter': {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(-6, -3, 3, 6); ctx.fillRect(3, -3, 3, 6);
        ctx.fillStyle = '#9ca3af'; ctx.fillRect(-3, -1, 6, 2);
        break;
      }
      default:
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        break;
    }
    ctx.restore();
  }

  /* -------------------------------------------------------------
     POÇA DE GORDURA (drawPuddle)
  ------------------------------------------------------------- */
  function renderPuddleHD(ctx, w) {
    var width = Math.max(16, w);
    var height = Math.max(6, Math.round(width * 0.35));
    var rx = width / 2;
    var ry = height / 2;

    ctx.save();
    ctx.translate(rx, ry);

    // Borda escura âmbar
    ctx.fillStyle = '#5c2406';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Centro âmbar translúcido
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx - 1.5, ry - 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brilho dourado
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(rx * 0.15, -ry * 0.15, rx * 0.55, ry * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fitas de reflexo especular branco
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.25, -ry * 0.2, rx * 0.35, 1, -0.1, 0, Math.PI * 2);
    ctx.ellipse(rx * 0.3, ry * 0.1, rx * 0.2, 0.8, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* -------------------------------------------------------------
     PUBLIC API IMPLEMENTATION (window.Sprites)
  ------------------------------------------------------------- */

  function drawChibi(ctx, who, state, t, x, y, facing, opts) {
    // Se o esqueleto Rig existir e estiver pronto, ele desenha
    if (typeof window !== 'undefined' && window.Rig && window.Rig.draw) {
      if (window.Rig.draw(ctx, who, state, t, x, y, facing, opts)) return;
    }
  }

  function drawEnemy(ctx, kind, state, t, x, y, facing, opts) {
    if (!ctx) return;
    kind = kind || 'fome';
    state = state || 'idle';
    t = (typeof t === 'number' && !isNaN(t) && t >= 0) ? t : 0;
    facing = (facing === -1) ? -1 : 1;
    opts = opts || {};

    var sz = enemySize(kind);
    var w = sz.w, h = sz.h;

    ctx.save();
    if (opts.alpha != null && opts.alpha < 1) {
      ctx.globalAlpha = Math.max(0, Math.min(1, opts.alpha));
    }

    ctx.translate(x, y - h);
    if (facing < 0) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    ctx.imageSmoothingEnabled = true;
    if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';

    // Desenha o inimigo com suas transformações procedurais contínuas
    switch (kind) {
      case 'fome': renderFomeHD(ctx, state, t); break;
      case 'batata': renderBatataHD(ctx, state, t); break;
      case 'refri': renderRefriHD(ctx, state, t); break;
      case 'gordura': renderGorduraHD(ctx, state, t); break;
      case 'coxinha': renderCoxinhaHD(ctx, state, t); break;
      default: renderFomeHD(ctx, state, t); break;
    }

    if (opts.flash) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawItem(ctx, kind, x, y, rot, scale) {
    if (!ctx) return;
    kind = kind || 'tomate';
    rot = (typeof rot === 'number' && !isNaN(rot)) ? rot : 0;
    scale = (typeof scale === 'number' && !isNaN(scale) && scale > 0) ? scale : 1;

    ctx.save();
    ctx.translate(x, y);
    if (rot !== 0) ctx.rotate(rot);
    if (scale !== 1) ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    renderItemHD(ctx, kind);
    ctx.restore();
  }

  function drawPuddle(ctx, x, y, w) {
    if (!ctx) return;
    w = (typeof w === 'number' && !isNaN(w) && w > 0) ? Math.round(w) : 36;
    var h = Math.round(w * 0.35);

    var key = 'puddle_hd_' + w;
    var canvas = getCached(key, w, h, function (cctx) {
      cctx.imageSmoothingEnabled = true;
      renderPuddleHD(cctx, w);
    });

    if (!canvas) return;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(canvas, x - w / 2, y - h / 2, w, h);
    ctx.restore();
  }

  function drawCat(ctx, state, t, x, y) {
    if (!ctx) return;
    state = state || 'sit';
    t = (typeof t === 'number' && !isNaN(t) && t >= 0) ? t : 0;
    var w = 24, h = 22;

    ctx.save();
    ctx.translate(x - w / 2, y - h);
    ctx.imageSmoothingEnabled = true;
    renderCatHD(ctx, state, t);
    ctx.restore();
  }

  function drawPortrait(ctx, who, x, y) {
    // Se o esqueleto Rig tiver o método portrait, ele desenha o recorte da arte
    if (typeof window !== 'undefined' && window.Rig && window.Rig.portrait) {
      if (window.Rig.portrait(ctx, who, x, y)) return;
    }
  }

  var Sprites = {
    drawChibi: drawChibi,
    drawEnemy: drawEnemy,
    enemySize: enemySize,
    drawItem: drawItem,
    drawPuddle: drawPuddle,
    drawCat: drawCat,
    drawPortrait: drawPortrait
  };

  if (typeof window !== 'undefined') {
    window.Sprites = Sprites;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sprites;
  }
})();
