/* Escalada: escadaria de igreja com os 19 rivais, subida, campeão e derrota.
   Mesmo módulo no jogo e na prévia HyperFrames (cutscenes/escalada). Só desenha: o estado vem do game.js. */
(function (root) {
  'use strict';
  var C = { ink: '#0b0a10', stone: '#1c1626', stone2: '#140f1c', mortar: '#0e0a14', line: '#493346', paper: '#ffffff', muted: '#c9c4d6',
    gold: '#ffd34d', gold2: '#ffe066', red: '#e8323c', carpet: '#a3202c', carpet2: '#6e1019', blue: '#3b8bff' };
  var RUN = 104, RISE = 28, PX = 150, PY = 206, SC = 1.1, TOTAL = 19;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }   // sorteio fixo por índice

  // texto de pixel com contorno, igual ao txt() do game.js (a fonte não tem maiúscula acentuada: o acento é desenhado)
  function px(ctx, s, x, y, col, align, size) {
    var sz = size || 8, d = String(s).normalize('NFD'), plain = '', marks = [], n = 0;
    for (var i = 0; i < d.length; i++) {
      var cc = d.charCodeAt(i);
      if (cc >= 0x300 && cc <= 0x36f && cc !== 0x327) { if (cc === 0x303 || cc === 0x301 || cc === 0x302) marks.push([n - 1, cc]); continue; }
      if (cc !== 0x327) n++;
      plain += d[i];
    }
    s = plain.normalize('NFC');
    ctx.font = sz + 'px "Press Start 2P", monospace'; ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = C.ink;
    ctx.fillText(s, x - 1, y); ctx.fillText(s, x + 1, y); ctx.fillText(s, x, y - 1); ctx.fillText(s, x, y + 1); ctx.fillText(s, x + 1, y + 1);
    ctx.fillStyle = col || C.paper; ctx.fillText(s, x, y);
    if (!marks.length) return;
    var tw = ctx.measureText(s).width, x0 = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x, u = sz / 8;
    marks.forEach(function (m) {
      var cx = x0 + ctx.measureText(s.slice(0, m[0])).width + sz / 2 - u * 0.5, my = y - u * 3;
      var r = m[1] === 0x303 ? [[-3, 1, 2, 1], [-1, 0, 2, 1], [1, 1, 2, 1], [3, 0, 1, 1]] : m[1] === 0x301 ? [[0, 1, 2, 1], [1, 0, 2, 1]] : [[-2, 1, 1, 1], [-1, 0, 3, 1], [2, 1, 1, 1]];
      ctx.fillStyle = C.ink; r.forEach(function (q) { ctx.fillRect(cx + (q[0] - 1) * u, my + (q[1] - 1) * u, (q[2] + 2) * u, (q[3] + 2) * u); });
      ctx.fillStyle = col || C.paper; r.forEach(function (q) { ctx.fillRect(cx + q[0] * u, my + q[1] * u, q[2] * u, q[3] * u); });
    });
  }
  // texto moderno do HUD (Oswald/Karla), para nomes e números
  function hud(ctx, s, x, y, size, col, align, display) {
    ctx.font = (display === false ? '600 ' : '700 ') + size + 'px ' + (display === false ? 'CreiaSans' : 'CreiaDisplay') + ',sans-serif';
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = col || C.paper; ctx.fillText(String(s), x, y);
  }
  function tag(ctx, s, x, y, col) {   // plaquinha de nome em cima da cabeça, com a cor do lado (P1 vermelho, rival azul)
    ctx.font = '700 8px CreiaDisplay,sans-serif';
    var w = Math.ceil(ctx.measureText(s).width) + 10;
    ctx.fillStyle = 'rgba(11,10,16,.86)'; ctx.fillRect(x - w / 2, y, w, 12);
    ctx.fillStyle = col; ctx.fillRect(x - w / 2, y, 2, 12); ctx.fillRect(x - w / 2, y + 11, w, 1);
    hud(ctx, s, x + 1, y + 1.5, 8, C.paper, 'center');
  }

  // lutador pintado de uma cor só (vencido apagado ou silhueta do próximo), num buffer para não depender de ctx.filter
  var tb = null, tg = null;
  function tinted(ctx, o, who, state, t, x, y, facing, s, col, a) {
    if (!o.big) return;
    if (!tb) { tb = document.createElement('canvas'); tb.width = tb.height = 600; tg = tb.getContext('2d'); }
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, 600, 600);
    tg.setTransform(3, 0, 0, 3, 0, 0);
    if (o.big(tg, who, state, t, 100, 150, facing, s) === false) return;
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'source-atop';
    tg.globalAlpha = a; tg.fillStyle = col; tg.fillRect(0, 0, 600, 600); tg.globalAlpha = 1; tg.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(tb, x - 100, y - 150, 200, 200); ctx.restore();
  }

  // fundo: o cenário de verdade da próxima luta, escurecido, com a luz do culto descendo do alto da escada
  function fundo(ctx, W, H, o, t, escuro) {
    if (o.cenario) { try { o.cenario(ctx); } catch (e) { ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); } }
    else { var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120c1c'); g.addColorStop(1, '#2a0a12'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = 'rgba(11,10,16,' + (escuro == null ? 0.74 : escuro) + ')'; ctx.fillRect(0, 0, W, H);
    var v = ctx.createRadialGradient(W * 0.6, H * 0.3, 40, W * 0.5, H * 0.5, W * 0.7);
    v.addColorStop(0, 'rgba(60,10,20,0)'); v.addColorStop(1, 'rgba(40,4,12,.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  function raios(ctx, ox, oy, t, n, alpha, spread, len) {   // fachos de luz de culto (dourado, bem leve)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var a = Math.PI / 2 + (i - (n - 1) / 2) * spread + Math.sin(t * 0.6 + i * 1.7) * 0.04, w = 0.035 + 0.02 * rnd(i);
      ctx.fillStyle = 'rgba(255,211,77,' + (alpha * (0.6 + 0.4 * Math.sin(t * 1.3 + i))) + ')';
      ctx.beginPath(); ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(a - w) * len, oy + Math.sin(a - w) * len); ctx.lineTo(ox + Math.cos(a + w) * len, oy + Math.sin(a + w) * len);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function poeira(ctx, W, H, t, n) {   // ciscos dourados flutuando na luz
    for (var i = 0; i < n; i++) {
      var x = (rnd(i) * W + Math.sin(t * 0.4 + i) * 12) % W, y = (rnd(i + 50) * H - t * (6 + 8 * rnd(i + 9)) % H + H) % H;
      ctx.fillStyle = 'rgba(255,224,102,' + (0.25 + 0.35 * rnd(i + 3)) + ')'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }

  // um degrau: coluna de pedra até o chão, com passadeira vermelha e varão dourado (escada de igreja)
  function degrauBloco(ctx, i, x, y, H, topo, largura) {
    var RUN_ = largura || RUN, x0 = Math.round(x - RUN_ / 2), y0 = Math.round(y);
    ctx.fillStyle = C.stone; ctx.fillRect(x0, y0, RUN_, H - y0);
    ctx.fillStyle = C.mortar;
    for (var yy = y0 + 12, row = 0; yy < H; yy += 10, row++) {
      ctx.fillRect(x0, yy, RUN_, 1);
      for (var xx = x0 + (row % 2 ? 13 : 0); xx < x0 + RUN_; xx += 26) ctx.fillRect(xx, yy - 9, 1, 9);
    }
    ctx.fillStyle = C.stone2; ctx.fillRect(x0 + RUN_ - 3, y0, 3, H - y0);   // sombra da quina
    if (i <= 0) {   // a calçada de onde a subida começa
      ctx.fillStyle = '#3a3440'; ctx.fillRect(x0, y0, RUN_, 4); ctx.fillStyle = '#57505e'; ctx.fillRect(x0, y0, RUN_, 1);
      return;
    }
    ctx.fillStyle = topo ? C.gold : C.carpet; ctx.fillRect(x0, y0, RUN_, 5);
    ctx.fillStyle = topo ? '#fff3b0' : C.red; ctx.fillRect(x0, y0, RUN_, 1);
    ctx.fillStyle = topo ? '#b88a1a' : C.carpet2; ctx.fillRect(x0, y0 + 5, RUN_, 2);
    ctx.fillRect(x0, y0 + 5, 4, RISE - 2);   // a passadeira caindo pelo espelho do degrau
    ctx.fillStyle = C.gold; ctx.fillRect(x0 - 1, y0 + 5, 3, 2);   // varão dourado
    var num = i < 10 ? '0' + i : String(i);
    ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = C.mortar; ctx.fillText(num, x + 1, y0 + 15); ctx.fillStyle = topo ? '#8a6a1a' : C.line; ctx.fillText(num, x, y0 + 14);
  }
  function trofeu(ctx, x, y, t) {   // taça no alto da escada (o 20º degrau)
    var b = Math.round(Math.sin(t * 2) * 1.5);
    ctx.save(); ctx.translate(Math.round(x), Math.round(y - 26 + b));
    var g = ctx.createRadialGradient(0, 8, 2, 0, 8, 34); g.addColorStop(0, 'rgba(255,211,77,.55)'); g.addColorStop(1, 'rgba(255,211,77,0)');
    ctx.fillStyle = g; ctx.fillRect(-34, -26, 68, 68);
    ctx.fillStyle = C.ink; ctx.fillRect(-9, -1, 18, 13); ctx.fillRect(-4, 11, 8, 8); ctx.fillRect(-8, 18, 16, 6);
    ctx.fillStyle = C.gold; ctx.fillRect(-8, 0, 16, 11); ctx.fillRect(-3, 11, 6, 8); ctx.fillRect(-7, 19, 14, 4);
    ctx.fillRect(-12, 2, 4, 2); ctx.fillRect(-12, 2, 2, 6); ctx.fillRect(8, 2, 4, 2); ctx.fillRect(10, 2, 2, 6);
    ctx.fillStyle = '#fff3b0'; ctx.fillRect(-6, 1, 2, 7);
    ctx.restore();
  }

  // a escadaria inteira com a câmera em "cam" (degrau, fracionário durante a subida)
  function escadaria(ctx, W, H, o, cam, an) {
    var t = o.t || 0, lista = o.lista || [], d = o.degrau || 0, nomes = o.nomes || {};
    var sx = function (i) { return PX + (i - cam) * RUN; }, sy = function (i) { return PY - (i - cam) * RISE; };
    raios(ctx, sx(TOTAL + 1), sy(TOTAL + 1) - 120, t, 6, 0.05, 0.13, 420);
    var lo = Math.floor(cam) - 2, hi = Math.min(TOTAL + 1, Math.ceil(cam) + 4);
    for (var i = lo; i <= hi; i++) {
      if (sx(i) < -RUN || sx(i) > W + RUN) continue;
      if (i === TOTAL + 1) { degrauBloco(ctx, i, sx(i), sy(i), H, true); trofeu(ctx, sx(i), sy(i), t); continue; }
      degrauBloco(ctx, i, sx(i), sy(i), H, false);
    }
    // vencidos: caídos no degrau, apagados
    for (var k = Math.max(1, lo); k <= Math.min(d, hi); k++) {
      var who = lista[k - 1]; if (!who) continue;
      var kt = an && an.koIdx === k ? an.koT : 3;
      var fade = an && an.koIdx === k ? clamp(an.koT / 0.6, 0, 1) : 1;
      tinted(ctx, o, who, kt < 0.05 ? 'hurt' : 'ko', kt, sx(k) - 30, sy(k) - 12 * fade, -1, SC, '#1a1424', 0.72 * fade);
    }
    // os próximos: o da vez em cores com holofote, os de cima em silhueta
    for (var j = d + 1; j <= Math.min(TOTAL, hi); j++) {
      var f = lista[j - 1]; if (!f) continue;
      var x = sx(j) - 6, y = sy(j);
      if (j === d + 1) {
        var rv = an && an.reveal != null ? an.reveal : 1, pul = 0.5 + 0.5 * Math.sin(t * 5);
        var g = ctx.createRadialGradient(x, y - 30, 4, x, y - 30, 46);
        g.addColorStop(0, 'rgba(255,211,77,' + (0.22 + 0.12 * pul) * rv + ')'); g.addColorStop(1, 'rgba(255,211,77,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 50, y - 80, 100, 90);
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 18, 3, 0, 0, Math.PI * 2); ctx.fill();
        if (rv < 1) tinted(ctx, o, f, 'idle', t, x, y, -1, SC, C.ink, 1 - rv);
        if (rv > 0) { ctx.save(); ctx.globalAlpha = rv; if (o.big) o.big(ctx, f, 'idle', t, x, y, -1, SC); ctx.restore(); }
        if (an && an.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + an.flash + ')'; ctx.fillRect(x - 40, y - 80, 80, 84); }
        if (rv > 0.5) tag(ctx, (nomes[f] || f).toUpperCase(), x, y - 96, C.blue);
        if (rv > 0.5 && Math.floor(t * 3) % 2) px(ctx, 'PRÓXIMO', x, y - 108, C.gold, 'center', 6);
      } else {
        tinted(ctx, o, f, 'idle', t + j, x, y, -1, SC, '#07060b', 0.94);
      }
    }
    // o lutador do jogador
    var p = an && an.pStep != null ? an.pStep : d, hop = an && an.hop ? an.hop : 0;
    var plx = sx(p) + 8, ply = sy(p) - hop;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(plx, sy(Math.round(p)) + 1, 18, 3, 0, 0, Math.PI * 2); ctx.fill();
    if (o.big) o.big(ctx, o.lutador, an && an.pState || 'idle', an && an.pT != null ? an.pT : t, plx, ply, 1, SC);
    tag(ctx, (nomes[o.lutador] || o.lutador || '').toUpperCase(), plx, ply - 96, C.red);
    return { plx: plx, ply: ply, fx: sx(d + 1) - 6, fy: sy(d + 1) };
  }
  // trilha de 19 losangos (igual às marcas de round do HUD): vencidos vermelhos, o da vez dourado piscando
  function trilha(ctx, cx, y, d, t, perdeu) {
    var gap = 12, x0 = cx - (TOTAL - 1) * gap / 2;
    for (var i = 0; i < TOTAL; i++) {
      var x = x0 + i * gap, col = i < d ? C.red : i === d ? (perdeu ? '#5a5060' : Math.floor(t * 4) % 2 ? C.gold : '#8a6a1a') : C.line;
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 5, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 3); ctx.lineTo(x - 3, y); ctx.closePath(); ctx.fill();
    }
  }
  function cabecalho(ctx, W, o, t) {
    var g = ctx.createLinearGradient(0, 0, 0, 52); g.addColorStop(0, 'rgba(11,10,16,.92)'); g.addColorStop(1, 'rgba(11,10,16,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 52);
    px(ctx, 'ESCALADA', 14, 9, C.gold2, 'left', 14);
    var d = Math.min(TOTAL, (o.degrau || 0) + 1);
    hud(ctx, 'DEGRAU', 14, 29, 8, C.muted);
    hud(ctx, d + ' / ' + TOTAL, 50, 26, 12, C.paper);
    if (o.recorde) hud(ctx, 'RECORDE ' + o.recorde, 98, 29, 8, C.gold);
    // força do rival em 5 gomos, igual ao medidor de defesa do HUD
    var forca = clamp((o.degrau || 0) / (TOTAL - 1), 0, 1), gomos = 1 + Math.round(forca * 4);
    hud(ctx, 'FORÇA DO RIVAL', 466, 10, 7, C.muted, 'right');
    for (var i = 0; i < 5; i++) { ctx.fillStyle = i < gomos ? (i >= 3 ? C.red : C.gold) : '#352333'; ctx.fillRect(394 + i * 15, 21, 13, 4); }
    if (o.cenarioNome) hud(ctx, o.cenarioNome, 466, 30, 8, C.paper, 'right');
  }
  function rodape(ctx, W, H, o, t, msg) {
    var g = ctx.createLinearGradient(0, H - 34, 0, H); g.addColorStop(0, 'rgba(11,10,16,0)'); g.addColorStop(1, 'rgba(11,10,16,.94)');
    ctx.fillStyle = g; ctx.fillRect(0, H - 34, W, 34);
    trilha(ctx, W / 2, H - 11, o.degrau || 0, t, false);
    if (msg && Math.floor(t * 2) % 2) px(ctx, msg, W / 2, H - 27, C.muted, 'center', 6);
  }

  // tela entre as lutas
  function torre(ctx, W, H, o) {
    o = o || {}; var t = o.t || 0;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    fundo(ctx, W, H, o, t);
    poeira(ctx, W, H, t, 40);
    var pos = escadaria(ctx, W, H, o, o.degrau || 0, null);
    var vx = (pos.plx + pos.fx) / 2, vy = (pos.ply + pos.fy) / 2 - 58, z = 1 + Math.max(0, 0.35 - t) * 5 + Math.sin(t * 6) * 0.04;
    ctx.save(); ctx.translate(vx, vy); ctx.scale(z, z); px(ctx, 'VS', 0, -6, '#ff3b3b', 'center', 12); ctx.restore();
    cabecalho(ctx, W, o, t);
    rodape(ctx, W, H, o, t, o.quit ? '' : o.pronto === false ? 'CARREGANDO...' : 'ENTER OU TOQUE: LUTAR');
    if (o.quit) px(ctx, 'ESC DE NOVO PARA SAIR DA ESCALADA', W / 2, H - 27, '#ff6b6b', 'center', 6);
    ctx.restore();
  }
  // subida de um degrau depois de vencer (o.degrau já é o novo degrau; t de 0 a 1,2)
  function subida(ctx, W, H, o) {
    o = o || {}; var t = o.t || 0, d = o.degrau || 0, u = ease(t / 0.9);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    fundo(ctx, W, H, o, t);
    poeira(ctx, W, H, t, 40);
    var an = { pStep: d - 1 + u, hop: Math.sin(Math.PI * u) * 16, pState: u > 0 && u < 1 ? 'walk' : 'victory', pT: t,
      koIdx: d, koT: t, reveal: clamp((t - 0.7) / 0.35, 0, 1), flash: t > 0.7 && t < 0.95 ? (0.95 - t) * 3 : 0 };
    escadaria(ctx, W, H, Object.assign({}, o, { t: t }), d - 1 + u, an);
    cabecalho(ctx, W, o, t);
    rodape(ctx, W, H, o, t, '');
    var pop = clamp(t / 0.2, 0, 1), sz = 16 * (1.6 - 0.6 * ease(pop));
    if (t < 1.1) { ctx.save(); ctx.globalAlpha = clamp((1.1 - t) / 0.2, 0, 1); px(ctx, '+1 DEGRAU', W / 2, 62 - sz / 2, C.gold2, 'center', Math.round(sz)); ctx.restore(); }
    ctx.restore();
  }
  // tela de campeão: igreja ao fundo, luz convergindo, confete e "ALELUIA!" subindo
  function campeao(ctx, W, H, o) {
    o = o || {}; var t = o.t || 0;
    var sh = t > 0.35 && t < 0.8 ? (0.8 - t) * 8 : 0;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(Math.sin(t * 90) * sh), Math.round(Math.cos(t * 77) * sh));
    fundo(ctx, W, H, o, t, 0.6);
    raios(ctx, W / 2, -30, t, 9, 0.07, 0.11, 360);
    var gl = ctx.createRadialGradient(W / 2, 160, 10, W / 2, 160, 120);
    gl.addColorStop(0, 'rgba(255,211,77,' + (0.28 + 0.08 * Math.sin(t * 3)) + ')'); gl.addColorStop(1, 'rgba(255,211,77,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    degrauBloco(ctx, TOTAL + 1, W / 2, 214, H, true, 200);
    poeira(ctx, W, H, t, 60);
    var up = ease(t / 0.4);
    if (o.big) o.big(ctx, o.who, 'victory', t, W / 2, 214 + (1 - up) * 40, 1, 2);
    // ALELUIA! em pixel subindo pelos lados
    for (var a = 0; a < 4; a++) {
      var at = (t - 0.6 - a * 0.7) % 2.8; if (t < 0.6 + a * 0.7 || at < 0) continue;
      var ax = a % 2 ? 404 : 76, ay = 190 - at * 50;
      ctx.save(); ctx.globalAlpha = clamp(1 - at / 2.8, 0, 1) * clamp(at / 0.2, 0, 1); px(ctx, 'ALELUIA!', ax, ay, a % 2 ? C.gold2 : C.paper, 'center', 8); ctx.restore();
    }
    // confete caindo, girando no eixo (largura oscila)
    if (t > 0.3) for (var i = 0; i < 80; i++) {
      var ct = t - 0.3, cx = (rnd(i) * W + Math.sin(ct * 2 + i) * 14) % W, cy = -10 + ((ct * (40 + 50 * rnd(i + 7)) + rnd(i + 3) * H * 1.2) % (H + 20));
      var cols = [C.red, C.gold, C.paper, C.blue, '#ff72bd'];
      ctx.fillStyle = cols[i % 5]; ctx.fillRect(Math.round(cx), Math.round(cy), Math.max(1, Math.round(3 * Math.abs(Math.cos(ct * 6 + i)))), 2);
    }
    // carimbo do título
    var s = t < 0.2 ? 0 : 1 + 2 * (1 - ease((t - 0.2) / 0.18));
    if (s) { ctx.save(); ctx.translate(W / 2, 22); ctx.scale(s, s); px(ctx, 'CAMPEÃO DA ESCALADA', 0, -8, C.gold2, 'center', 16); ctx.restore(); }
    if (t > 0.5) {
      var nome = String(o.nome || '').toUpperCase();
      ctx.font = '700 16px CreiaDisplay,sans-serif'; var nw = Math.ceil(ctx.measureText(nome).width) + 28;
      ctx.fillStyle = C.red; ctx.fillRect(W / 2 - nw / 2, 220, nw, 22); ctx.fillStyle = '#ff4751'; ctx.fillRect(W / 2 - nw / 2, 220, nw, 1);
      ctx.fillStyle = C.ink; ctx.fillRect(W / 2 - nw / 2, 241, nw, 1);
      hud(ctx, nome, W / 2, 222, 16, C.paper, 'center');
      hud(ctx, 'DERRUBOU OS 19. GLÓRIA!', W / 2, 46, 10, C.gold, 'center');
    }
    if (t > 1.5 && Math.floor(t * 2) % 2) px(ctx, 'ENTER: MENU', W / 2, 254, C.muted, 'center', 6);
    if (t < 0.25) { ctx.fillStyle = 'rgba(255,255,255,' + (1 - t / 0.25) + ')'; ctx.fillRect(-10, -10, W + 20, H + 20); }
    ctx.restore();
  }
  // fim da escalada: perdeu, perdeu
  function derrota(ctx, W, H, o) {
    o = o || {}; var t = o.t || 0, d = o.degrau || 0;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    fundo(ctx, W, H, o, t, 0.8);
    ctx.fillStyle = 'rgba(70,0,10,' + clamp(t / 0.5, 0, 1) * 0.45 + ')'; ctx.fillRect(0, 0, W, H);
    degrauBloco(ctx, Math.max(1, d), W / 2, 200, H, false, 220);
    if (o.who) tinted(ctx, o, o.who, t < 0.15 ? 'hurt' : 'ko', t, W / 2 - 30, 186, 1, 1.4, '#2a0a12', 0.4);
    var dy = -40 * (1 - ease(t / 0.35)), sh = t > 0.35 && t < 0.6 ? (0.6 - t) * 10 : 0;
    px(ctx, 'FIM DA ESCALADA', W / 2 + Math.round(Math.sin(t * 80) * sh), 18 + dy, '#ff4d4d', 'center', 16);
    if (t > 0.5) px(ctx, 'PERDEU, PERDEU.', W / 2, 42, C.paper, 'center', 8);
    if (t > 0.8) {
      ctx.fillStyle = 'rgba(11,10,16,.82)'; ctx.fillRect(W / 2 - 110, 62, 220, 42);
      ctx.fillStyle = C.red; ctx.fillRect(W / 2 - 110, 62, 2, 42);
      hud(ctx, 'VENCEU ' + d + ' DE ' + TOTAL, W / 2, 66, 16, C.gold, 'center');
      hud(ctx, (o.nome ? String(o.nome).toUpperCase() + '  ·  ' : '') + 'RECORDE ' + Math.max(d, o.recorde || 0), W / 2, 88, 8, C.muted, 'center');
    }
    var g = ctx.createLinearGradient(0, H - 34, 0, H); g.addColorStop(0, 'rgba(11,10,16,0)'); g.addColorStop(1, 'rgba(11,10,16,.94)');
    ctx.fillStyle = g; ctx.fillRect(0, H - 34, W, 34);
    trilha(ctx, W / 2, H - 11, d, t, true);
    if (t > 1.5 && Math.floor(t * 2) % 2) px(ctx, 'ENTER: MENU', W / 2, H - 27, C.muted, 'center', 6);
    ctx.restore();
  }

  root.EscaladaVisual = { torre: torre, subida: subida, campeao: campeao, derrota: derrota };
}(typeof window !== 'undefined' ? window : this));
