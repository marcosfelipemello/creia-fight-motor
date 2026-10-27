/* Segunda forma dos chefes: cena da transformação, aura do chefe transformado e o cenário reagindo.
   Só desenho: o estado (b.forma, b.transT) vem de bosses.js. Mesmo módulo no jogo e na prévia (cutscenes/segunda-forma). */
(function (root) {
  'use strict';
  var C = { ink: '#0b0a10', paper: '#ffffff', gold: '#ffd34d', gold2: '#ffe066', red: '#e8323c', alert: '#ff4d4d' };
  // nome da 2ª forma por chefe (kind); a Torre não troca de nome porque se divide nos mini-salgados
  var NOME2 = { burger: 'O X-Tudo Duplo Bacon', hotdog: 'O Cachorrão Completo com Purê', pastel: 'O Pastelão Requentado no Óleo Velho',
    fries: 'A Batata Supersize', pizza: 'A Pizza Borda Recheada', skewer: 'O Espetão Completo de Gato', acai: 'O Açaí de 1 Litro com Tudo',
    cane: 'O Caldo de Cana com Pastel de Vento', emperor: 'O Podrão Tamanho Família' };
  var ESCALA2 = { emperor: 1.22 };   // quanto o chefe cresce (os outros: 1,12)
  // o que chove ao fundo na cena, por chefe: [cor, brilho, largura, altura]
  var CHUVA = { burger: ['#c4473a', '#f08a7a', 6, 2], hotdog: ['#d8312a', '#f5c518', 2, 3], pastel: ['#b07a18', '#f2c14e', 2, 3],
    fries: ['#f2b632', '#ffe28a', 2, 8], pizza: ['#a8261c', '#e0574a', 4, 4], skewer: ['#ff7a1a', '#ffd34d', 1, 3],
    acai: ['#4b1d5c', '#9b59b6', 3, 3], tower: ['#c98a2b', '#f0c060', 3, 3], cane: ['#7fae3a', '#d9e86b', 2, 3],
    emperor: ['#f2b632', '#ffe28a', 2, 8], pastel9: ['#b07a18', '#f2c14e', 2, 3] };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function cena() { return (root.CreiaCombat && root.CreiaCombat.segundaForma && root.CreiaCombat.segundaForma.cena) || 1.5; }
  function idade(b) { return b.transT > 0 ? cena() - b.transT : 99; }   // segundos desde o começo da transformação

  // texto de pixel com contorno e acento desenhado (cópia fiel do txt() do game.js)
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

  // tamanho: cresce em 3 trancos durante a cena (com sobressalto) e depois respira
  function escala(b, t) {
    var alvo = ESCALA2[b.kind] || 1.12, a = idade(b);
    if (a >= 99) return alvo * (1 + 0.012 * Math.sin(t * 3));
    var s = 1;
    for (var k = 0; k < 3; k++) {
      var u = clamp((a - 0.3 - k * 0.32) / 0.14, 0, 1);
      s += (alvo - 1) / 3 * (ease(u) + Math.sin(Math.PI * u) * 0.5);
    }
    return s;
  }

  // o chefe desenhado num buffer, para virar aura colorida e clarão sem depender de ctx.filter
  var buf = null, bg = null, BW = 320, BH = 260, BX = 160, BY = 230;
  function pintado(b, desenhar, s, cor) {
    if (!buf) { buf = document.createElement('canvas'); buf.width = BW; buf.height = BH; bg = buf.getContext('2d'); }
    bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalCompositeOperation = 'source-over'; bg.clearRect(0, 0, BW, BH);
    bg.imageSmoothingEnabled = false;
    bg.translate(BX, BY); bg.scale(s, s); bg.translate(-BX, -BY);
    desenhar(bg, BX, BY);
    bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalCompositeOperation = 'source-atop'; bg.fillStyle = cor; bg.fillRect(0, 0, BW, BH);
    bg.globalCompositeOperation = 'source-over';
    return buf;
  }

  // corpo do chefe na 2ª forma: aura vermelha pulsando, maior, clarão a cada tranco e gotas de gordura subindo
  function corpo(ctx, b, sx, sy, desenhar, t) {
    t = t || 0;
    var s = escala(b, t), a = idade(b), emCena = a < 99;
    var pulso = 0.5 + 0.5 * Math.sin(t * (emCena ? 14 : 5));
    var aura = pintado(b, desenhar, s, emCena ? '#ff2a2a' : '#c4142a');
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = (emCena ? 0.75 : 0.45) * (0.6 + 0.4 * pulso);
    var r = emCena ? 3 : 2;
    [[-r, 0], [r, 0], [0, -r], [0, r]].forEach(function (o) { ctx.drawImage(aura, sx - BX + o[0], sy - BY + o[1]); });
    ctx.restore();
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.translate(sx, sy); ctx.scale(s, s); ctx.translate(-sx, -sy);
    desenhar(ctx, sx, sy);
    ctx.restore();
    if (emCena) {   // clarão branco em cada tranco de crescimento
      var fl = 0;
      for (var k = 0; k < 3; k++) { var d = a - 0.3 - k * 0.32; if (d >= 0 && d < 0.12) fl = Math.max(fl, 1 - d / 0.12); }
      if (fl > 0) { ctx.save(); ctx.globalAlpha = fl * 0.85; ctx.drawImage(pintado(b, desenhar, s, '#ffffff'), sx - BX, sy - BY); ctx.restore(); }
    }
    var h = (b.h || 90) * s;   // gordura borbulhando para cima
    for (var i = 0; i < (emCena ? 14 : 6); i++) {
      var u = ((t * (0.6 + rnd(i) * 0.5) + rnd(i + 9)) % 1), gx = sx + (rnd(i + 3) - 0.5) * (b.w || 90) * s, gy = sy - u * h * 1.1;
      ctx.fillStyle = i % 3 ? 'rgba(255,211,77,' + (1 - u) * 0.8 + ')' : 'rgba(232,50,60,' + (1 - u) * 0.8 + ')';
      ctx.fillRect(Math.round(gx), Math.round(gy), 2, 2);
    }
  }

  // cenário reagindo: céu puxando para o vermelho; na cena, relâmpagos e (no Imperador) batatas caindo ao fundo
  function fundo(ctx, W, H, b, t) {
    var a = idade(b), emCena = a < 99;
    ctx.save();
    ctx.fillStyle = 'rgba(120,10,24,' + (emCena ? 0.16 + 0.1 * ease(a / 0.4) : 0.1 + 0.03 * Math.sin(t * 2)) + ')';
    ctx.fillRect(0, 0, W, H);
    var ch = CHUVA[b.kind];
    if (ch && emCena) for (var i = 0; i < 26; i++) {
      var u = (a * (0.7 + rnd(i) * 0.6) + rnd(i + 5)) % 1, x = Math.round(rnd(i + 1) * W), y = Math.round(-12 + u * 200);
      ctx.fillStyle = 'rgba(11,10,16,.55)'; ctx.fillRect(x - 1, y - 1, ch[2] + 2, ch[3] + 2);
      ctx.fillStyle = ch[0]; ctx.fillRect(x, y, ch[2], ch[3]); ctx.fillStyle = ch[1]; ctx.fillRect(x, y, 1, Math.max(1, ch[3] - 1));
    }
    ctx.restore();
  }

  // por cima de tudo, durante a cena: o resto da tela escurece, relâmpago e o letreiro do lado oposto ao chefe
  function letreiro(ctx, W, H, b, sx, sy, t) {
    var a = idade(b); if (a >= 99) return;
    var fim = clamp(b.transT / 0.25, 0, 1), dentro = ease(a / 0.2) * fim;
    var cy = sy - (b.h || 90) * 0.55;
    var g = ctx.createRadialGradient(sx, cy, 50, sx, cy, 260);
    g.addColorStop(0, 'rgba(11,10,16,0)'); g.addColorStop(1, 'rgba(11,10,16,' + 0.7 * dentro + ')');
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (var k = 0; k < 3; k++) { var d = a - 0.3 - k * 0.32; if (d >= 0 && d < 0.06) { ctx.fillStyle = 'rgba(255,240,200,' + (0.35 - d * 5) + ')'; ctx.fillRect(0, 0, W, H); } }
    if (a > 0.4) {
      var nome = (NOME2[b.kind] || b.name || 'CHEFE').toUpperCase().split(' '), linhas = [], cur = '';
      nome.forEach(function (w) { if ((cur + ' ' + w).trim().length > 15) { linhas.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
      linhas.push(cur);
      var x = sx > W / 2 ? 120 : W - 120, y = 104, z = 1 + 0.35 * (1 - ease((a - 0.4) / 0.16));
      ctx.globalAlpha = fim;
      px(ctx, 'SEGUNDA FORMA!', x, y, C.gold2, 'center', 8);
      ctx.translate(x, y + 16); ctx.scale(z, z);
      linhas.forEach(function (l, i) { px(ctx, l, 0, i * 16, Math.floor(t * 8) % 2 ? C.alert : C.red, 'center', 12); });
    }
    ctx.restore();
  }

  root.SegundaForma = {
    nome: function (kind) { return NOME2[kind] || null; },
    // ganchos do motor (bosses.js): troca o nome mostrado no HUD; o resto é desenho puro
    inicio: function (b) { if (NOME2[b.kind]) { b.nome1 = b.nome1 || b.name; b.name = NOME2[b.kind]; } },
    fim: function () {},
    escala: escala, corpo: corpo, fundo: fundo, letreiro: letreiro
  };
}(typeof window !== 'undefined' ? window : this));
