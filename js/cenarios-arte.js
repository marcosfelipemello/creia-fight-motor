// Cenários pintados pelo Marcos (fases 1, 2, 3, 4, 5 e 10): céu, fundo emendado com paralaxe e chão que repete.
// Fica por cima do backgrounds.js só nessas fases; se a imagem não carregar, o cenário desenhado volta.
(function () {
  var YG = 182, PAR = 0.4;
  var META = {"igreja":{"par":0.4334,"backW":1572.2,"groundW":910.3,"sky":["#96ecf9","#95edf9","#96ecf9","#95edf9","#bbfaef","#bbfaef","#d9fdef","#b9bec7","#a7cedb","#bfcbd4","#bec3cc","#b9c4c8"]},"shopping":{"par":0.5573,"backW":1884.5,"groundW":545.1,"sky":null},"praca":{"par":0.4878,"backW":1709.2,"groundW":300.9,"sky":["#76d1fe","#76d1fe","#78d1fe","#76d1fe","#96e0fd","#95dffc","#96e0fd","#dff7fe","#a5c3e7","#b8c6cd","#4bbece","#4bbece"]},"creia":{"par":0.4334,"backW":1572.2,"groundW":876.6,"sky":["#96ecf7","#95edf9","#97ecf6","#94ecf8","#baf9f0","#baf9ee","#ccd7de","#d9e4e7","#d9e6ea","#dbebeb","#dde6f1","#bac2c9"]},"estacao":{"backW":1053.5,"groundW":240,"sky":null,"backH":196,"groundY":186,"par":0.2276},"geleia":{"backW":578.5,"groundW":240,"sky":null,"backH":196,"groundY":186,"par":0.0391}};
  var STAGES = { 1: 'creia', 2: 'praca', 3: 'shopping', 4: 'igreja', 5: 'estacao', 10: 'geleia' };
  var REMAP = { 6: 5 };   // fase 6 usa o cenário desenhado do Estádio de Moça Bonita (que era a 5)
  var imgs = {};
  Object.keys(META).forEach(function (n) {
    ['back', 'chao'].forEach(function (k) { var i = new Image(); i.src = 'assets/cenarios/' + n + '_' + k + '.webp'; imgs[n + k] = i; });
  });
  function ok(i) { return i && i.complete && i.naturalWidth > 0; }
  var grads = {};
  window.ArtBG = {
    // fase com cenário de arte: enquanto a imagem não chega, o jogo mostra "carregando" em vez do cenário antigo
    covers: function (stage) { return !!STAGES[stage]; },
    remap: function (stage) { return REMAP[stage] || stage; },
    progress: function () { var ks = Object.keys(imgs), n = ks.filter(function (k) { return ok(imgs[k]); }).length; return n / ks.length; },
    has: function (stage) { var n = STAGES[stage]; return !!(n && ok(imgs[n + 'back']) && ok(imgs[n + 'chao'])); },
    draw: function (ctx, stage, camX, time) {
      var n = STAGES[stage], M = META[n], back = imgs[n + 'back'], chao = imgs[n + 'chao'];
      ctx.save(); ctx.imageSmoothingEnabled = true;
      if (M.sky) {   // céu: gradiente tirado da própria imagem
        if (!grads[n]) { var g = ctx.createLinearGradient(0, 0, 0, YG); M.sky.forEach(function (c, i) { g.addColorStop(i / (M.sky.length - 1), c); }); grads[n] = g; }
        ctx.fillStyle = grads[n]; ctx.fillRect(0, 0, 480, YG + 2);
      }
      // chão primeiro (o fundo pode ter a borda de baixo esmaecida por cima dele)
      var gy = M.groundY || YG, gw = M.groundW, gx = -(camX % gw);
      for (var x = gx; x < 480; x += gw) ctx.drawImage(chao, x, gy, gw + 0.5, 270 - gy);
      var bx = -Math.min(camX * (M.par != null ? M.par : PAR), M.backW - 480);
      ctx.drawImage(back, bx, 0, M.backW, (M.backH || YG) + 0.5);
      ctx.restore();
      return true;
    }
  };
  if (window.Backgrounds && window.Backgrounds.places) {
    var pl = window.Backgrounds.places, moca = pl[4];
    ['Figueiredo Camargo 1233', 'Praça Guilherme da Silveira', 'Bangu Shopping', 'Largo de Bangu', 'Calçadão de Bangu', moca]
      .forEach(function (n, i) { pl[i] = n; });
    pl[9] = 'Quiosque do Geleia';
  }
}());
