/* Rig: animação por recortes (cutout) dos chibis do casal, feitos a partir das artes de referência.
   Cada parte (cabeça, tronco, braços, pernas) gira no seu pivô; as poses são interpoladas no tempo. */
(function () {
  'use strict';
  var META = /*META*/{"nutri":{"height":332.67,"parts":{"legB":{"x":0,"y":0,"w":76,"h":98,"pivot":[48.56,9.75],"at":[-27.3,-84.83],"z":2,"r0":0},"legF":{"x":80,"y":0,"w":76,"h":88,"pivot":[21.45,9.75],"at":[21.45,-84.83],"z":2,"r0":0},"head":{"x":160,"y":0,"w":150,"h":145,"pivot":[98.67,143.52],"at":[11.7,-189.15],"z":5,"r0":0},"torso":{"x":314,"y":0,"w":170,"h":120,"pivot":[91.65,111.15],"at":[0.0,-84.83],"z":3,"r0":0}},"pose":{"beijo":{"x":492,"y":0,"w":204,"h":349,"feet":[44.66,340.08]}}},"lutador":{"height":330.92,"parts":{"legB":{"x":0,"y":0,"w":76,"h":111,"pivot":[52.26,6.82],"at":[-23.4,-102.38],"z":2,"r0":0},"legF":{"x":80,"y":0,"w":74,"h":106,"pivot":[19.5,6.82],"at":[19.5,-102.38],"z":2,"r0":0},"head":{"x":158,"y":0,"w":129,"h":126,"pivot":[60.64,125.19],"at":[0.0,-205.72],"z":5,"r0":0},"torso":{"x":291,"y":0,"w":158,"h":134,"pivot":[75.86,124.6],"at":[0.0,-102.38],"z":3,"r0":0}},"pose":{"soco":{"x":457,"y":0,"w":241,"h":332,"feet":[93.6,330.72]},"direto":{"x":702,"y":0,"w":241,"h":332,"feet":[91.45,330.92]},"chute":{"x":947,"y":0,"w":246,"h":328,"feet":[74.3,330.72]},"guitarra":{"x":1197,"y":0,"w":229,"h":332,"feet":[75.86,330.53]},"solo":{"x":1430,"y":0,"w":235,"h":332,"feet":[81.7,330.72]}}},"emanuelly":{"height":332.69,"parts":{"legB":{"x":0,"y":0,"w":92,"h":12,"pivot":[20.9,-1.9],"at":[-71.25,-16.34],"z":2,"r0":0},"legF":{"x":96,"y":0,"w":93,"h":15,"pivot":[72.96,-1.9],"at":[73.15,-16.34],"z":2,"r0":0},"head":{"x":193,"y":0,"w":158,"h":115,"pivot":[82.65,114.95],"at":[-6.65,-217.74],"z":5,"r0":0},"torso":{"x":355,"y":0,"w":193,"h":221,"pivot":[96.33,219.26],"at":[0.0,-16.34],"z":3,"r0":0}},"pose":{"lanca":{"x":556,"y":0,"w":225,"h":333,"feet":[121.03,332.69]},"le":{"x":789,"y":0,"w":234,"h":332,"feet":[120.84,332.69]}}},"enzo":{"height":340.28,"parts":{"armF":{"x":0,"y":0,"w":58,"h":46,"pivot":[3.76,29.14],"at":[36.66,-180.48],"z":6,"r0":0},"armF2":{"x":62,"y":0,"w":55,"h":50,"pivot":[9.4,35.91],"at":[82.72,-199.28],"z":7,"r0":0,"parent":"armF"},"manga":{"x":121,"y":0,"w":30,"h":44,"pivot":[8.84,19.93],"at":[36.66,-180.48],"z":8,"r0":0,"follow":"armF","fk":0.85},"legB":{"x":155,"y":0,"w":71,"h":93,"pivot":[51.7,7.52],"at":[-20.68,-80.84],"z":2,"r0":0},"legF":{"x":230,"y":0,"w":79,"h":99,"pivot":[20.68,7.52],"at":[18.8,-80.84],"z":2,"r0":0},"head":{"x":313,"y":0,"w":168,"h":159,"pivot":[87.98,157.54],"at":[0.0,-184.24],"z":5,"r0":0},"torso":{"x":485,"y":0,"w":136,"h":128,"pivot":[72.57,124.08],"at":[0.0,-80.84],"z":3,"r0":0}}},"pedro":{"height":334.4,"parts":{"legB":{"x":0,"y":0,"w":117,"h":125,"pivot":[85.5,4.75],"at":[-31.35,-122.36],"z":2,"r0":0},"legF":{"x":121,"y":0,"w":117,"h":127,"pivot":[21.85,4.75],"at":[21.85,-122.36],"z":2,"r0":0},"head":{"x":242,"y":0,"w":93,"h":106,"pivot":[49.59,104.69],"at":[-0.95,-229.71],"z":5,"r0":0},"torso":{"x":339,"y":0,"w":245,"h":114,"pivot":[88.54,109.25],"at":[0.0,-122.36],"z":3,"r0":0}},"pose":{"voadora":{"x":592,"y":0,"w":251,"h":283,"feet":[95.19,283.1]}}},"naju":{"height":337.0,"parts":{"armF2":{"x":0,"y":0,"w":33,"h":56,"pivot":[16.2,59.0],"at":[68.0,-170.4],"z":7,"r0":0,"parent":"armF"},"armF":{"x":37,"y":0,"w":39,"h":40,"pivot":[1.0,16.8],"at":[47.0,-171.6],"z":6,"r0":0},"legB":{"x":80,"y":0,"w":87,"h":125,"pivot":[61.2,9.0],"at":[-26.0,-107.0],"z":2,"r0":0},"legF":{"x":171,"y":0,"w":72,"h":114,"pivot":[26.0,9.0],"at":[26.0,-107.0],"z":2,"r0":0},"head":{"x":247,"y":0,"w":154,"h":147,"pivot":[100.2,145.6],"at":[3.0,-192.0],"z":5,"r0":0},"torso":{"x":405,"y":0,"w":167,"h":91,"pivot":[97.4,91.0],"at":[0.0,-107.0],"z":3,"r0":0}}},"grazi":{"height":313.54,"parts":{"armF":{"x":0,"y":0,"w":28,"h":28,"pivot":[1.92,13.06],"at":[39.36,-154.94],"z":6,"r0":0},"armF2":{"x":32,"y":0,"w":59,"h":29,"pivot":[3.46,14.21],"at":[65.28,-154.94],"z":7,"r0":0,"parent":"armF"},"legB":{"x":95,"y":0,"w":75,"h":57,"pivot":[23.42,3.84],"at":[-51.84,-37.44],"z":2,"r0":0},"legF":{"x":174,"y":0,"w":75,"h":61,"pivot":[46.08,3.84],"at":[46.08,-37.44],"z":2,"r0":0},"head":{"x":253,"y":0,"w":170,"h":144,"pivot":[105.79,142.66],"at":[5.76,-171.84],"z":5,"r0":0},"torso":{"x":427,"y":0,"w":216,"h":140,"pivot":[100.03,137.28],"at":[0.0,-37.44],"z":3,"r0":0}},"pose":{"aponta":{"x":651,"y":0,"w":238,"h":338,"feet":[103.49,318.34]}}},"bispo":{"height":331.11,"parts":{"armF":{"x":0,"y":0,"w":22,"h":31,"pivot":[0.98,15.21],"at":[33.15,-169.26],"z":6,"r0":0},"armF2":{"x":26,"y":0,"w":73,"h":32,"pivot":[3.51,15.21],"at":[53.62,-169.26],"z":7,"r0":0,"parent":"armF"},"legB":{"x":103,"y":0,"w":75,"h":95,"pivot":[50.5,2.92],"at":[-25.35,-89.31],"z":2,"r0":0},"legF":{"x":182,"y":0,"w":77,"h":85,"pivot":[24.38,2.92],"at":[23.4,-89.31],"z":2,"r0":0},"head":{"x":263,"y":0,"w":131,"h":150,"pivot":[72.34,146.25],"at":[1.95,-184.86],"z":5,"r0":0},"torso":{"x":398,"y":0,"w":147,"h":111,"pivot":[75.86,105.3],"at":[0.0,-89.31],"z":3,"r0":0}},"pose":{"ora":{"x":553,"y":0,"w":243,"h":337,"feet":[120.9,334.62]},"grita":{"x":800,"y":0,"w":228,"h":337,"feet":[77.03,334.62]}}},"lohan":{"height":333.83,"parts":{"legB":{"x":0,"y":0,"w":77,"h":106,"pivot":[54.15,7.6],"at":[-22.8,-90.25],"z":2,"r0":0},"legF":{"x":81,"y":0,"w":78,"h":96,"pivot":[20.9,7.6],"at":[20.9,-90.25],"z":2,"r0":0},"head":{"x":163,"y":0,"w":150,"h":157,"pivot":[83.22,152.38],"at":[0.0,-181.45],"z":5,"r0":0},"torso":{"x":317,"y":0,"w":155,"h":108,"pivot":[61.37,98.8],"at":[0.0,-90.25],"z":3,"r0":0}},"pose":{"flash":{"x":480,"y":0,"w":184,"h":342,"feet":[83.22,333.83]}}},"rafinha":{"height":333.83,"parts":{"legB":{"x":0,"y":0,"w":73,"h":64,"pivot":[31.54,7.6],"at":[-45.6,-48.45],"z":2,"r0":0},"legF":{"x":77,"y":0,"w":58,"h":54,"pivot":[23.37,7.6],"at":[43.7,-48.45],"z":2,"r0":0},"head":{"x":139,"y":0,"w":150,"h":154,"pivot":[83.22,153.33],"at":[0.0,-180.5],"z":5,"r0":0},"torso":{"x":293,"y":0,"w":231,"h":140,"pivot":[100.13,136.8],"at":[0.0,-48.45],"z":3,"r0":0}},"pose":{"grito":{"x":532,"y":0,"w":268,"h":341,"feet":[83.03,333.64]},"solo":{"x":804,"y":0,"w":248,"h":341,"feet":[126.35,333.45]}}},"douglas":{"height":330.22,"parts":{"legB":{"x":0,"y":0,"w":74,"h":128,"pivot":[53.2,7.6],"at":[-24.7,-118.75],"z":2,"r0":0},"legF":{"x":78,"y":0,"w":80,"h":128,"pivot":[20.9,7.6],"at":[17.1,-118.75],"z":2,"r0":0},"head":{"x":162,"y":0,"w":88,"h":115,"pivot":[49.78,108.87],"at":[9.5,-221.35],"z":5,"r0":0},"torso":{"x":254,"y":0,"w":152,"h":124,"pivot":[78.66,117.8],"at":[0.0,-118.75],"z":3,"r0":0}},"pose":{"grito":{"x":414,"y":0,"w":169,"h":328,"feet":[82.27,326.23]},"cavaco":{"x":587,"y":0,"w":178,"h":327,"feet":[99.56,326.23]},"arremesso":{"x":769,"y":0,"w":260,"h":316,"feet":[133.19,318.63]}}},"fidelis":{"height":338.2,"parts":{"legB":{"x":0,"y":0,"w":78,"h":128,"pivot":[53.58,5.7],"at":[-34.01,-122.36],"z":2,"r0":0},"legF":{"x":82,"y":0,"w":97,"h":128,"pivot":[20.9,5.7],"at":[11.59,-122.36],"z":2,"r0":0},"head":{"x":183,"y":0,"w":101,"h":110,"pivot":[62.7,108.49],"at":[-9.31,-229.71],"z":5,"r0":0},"torso":{"x":288,"y":0,"w":150,"h":115,"pivot":[93.29,109.25],"at":[-9.31,-122.36],"z":3,"r0":0}},"pose":{"lanca":{"x":446,"y":0,"w":234,"h":338,"feet":[142.5,338.2]},"fogo":{"x":684,"y":0,"w":198,"h":338,"feet":[109.82,338.01]}}},"arthur":{"height":330.98,"parts":{"legB":{"x":0,"y":0,"w":69,"h":120,"pivot":[45.79,4.75],"at":[-22.8,-114.76],"z":2,"r0":0},"legF":{"x":73,"y":0,"w":69,"h":118,"pivot":[20.9,4.75],"at":[20.9,-114.76],"z":2,"r0":0},"head":{"x":146,"y":0,"w":109,"h":121,"pivot":[57.76,120.27],"at":[0.0,-210.71],"z":5,"r0":0},"torso":{"x":259,"y":0,"w":132,"h":103,"pivot":[68.97,97.85],"at":[0.0,-114.76],"z":3,"r0":0}},"pose":{"canta":{"x":399,"y":0,"w":177,"h":331,"feet":[87.97,330.79]},"raiva":{"x":580,"y":0,"w":164,"h":331,"feet":[95.38,330.79]},"come":{"x":748,"y":0,"w":155,"h":331,"feet":[68.97,330.79]}}},"lucas":{"height":341.43,"parts":{"legB":{"x":0,"y":0,"w":84,"h":140,"pivot":[55.86,7.6],"at":[-33.25,-133.0],"z":2,"r0":0},"legF":{"x":88,"y":0,"w":95,"h":140,"pivot":[23.75,7.6],"at":[18.05,-133.0],"z":2,"r0":0},"head":{"x":187,"y":0,"w":103,"h":119,"pivot":[49.4,117.23],"at":[-16.15,-224.2],"z":5,"r0":0},"torso":{"x":294,"y":0,"w":210,"h":173,"pivot":[135.85,167.39],"at":[0.0,-133.0],"z":3,"r0":0}},"pose":{"lanca":{"x":512,"y":0,"w":238,"h":344,"feet":[141.93,341.43]},"fralda":{"x":754,"y":0,"w":267,"h":341,"feet":[106.59,341.43]},"grito":{"x":1025,"y":0,"w":197,"h":341,"feet":[106.78,341.43]}}},"duda":{"height":334.4,"parts":{"legB":{"x":0,"y":0,"w":106,"h":146,"pivot":[79.61,7.6],"at":[-31.35,-139.27],"z":2,"r0":0},"legF":{"x":110,"y":0,"w":116,"h":147,"pivot":[20.9,7.6],"at":[16.15,-139.27],"z":2,"r0":0},"head":{"x":230,"y":0,"w":133,"h":97,"pivot":[68.4,95.38],"at":[-0.95,-239.02],"z":5,"r0":0},"torso":{"x":367,"y":0,"w":211,"h":136,"pivot":[117.23,130.72],"at":[0.0,-139.27],"z":3,"r0":0}},"pose":{"canta":{"x":586,"y":0,"w":228,"h":334,"feet":[118.18,334.21]},"coram":{"x":818,"y":0,"w":267,"h":329,"feet":[140.41,328.89]},"fashion":{"x":1089,"y":0,"w":185,"h":331,"feet":[101.41,330.5]}}},"cardoso":{"height":329.46,"parts":{"legB":{"x":0,"y":0,"w":70,"h":155,"pivot":[39.14,-0.95],"at":[-34.2,-156.37],"z":2,"r0":0},"legF":{"x":74,"y":0,"w":56,"h":151,"pivot":[24.51,-0.95],"at":[20.9,-156.37],"z":2,"r0":0},"head":{"x":134,"y":0,"w":93,"h":108,"pivot":[55.1,103.74],"at":[0.0,-225.72],"z":5,"r0":0},"torso":{"x":231,"y":0,"w":235,"h":97,"pivot":[86.64,96.52],"at":[0.0,-155.42],"z":3,"r0":0}},"pose":{"baixo":{"x":470,"y":0,"w":267,"h":358,"feet":[118.18,357.53]},"barriga":{"x":741,"y":0,"w":216,"h":331,"feet":[126.16,331.31]},"tablet":{"x":961,"y":0,"w":158,"h":366,"feet":[79.04,365.89]}}}}/*FIM-META*/;
  var H = 76;                       // altura do chibi em unidades lógicas (igual para os dois)
  var R = 4;                        // escala de pixels do canvas (o motor ajusta com Rig.setScale)
  var BOX = 176;                    // buffer quadrado em unidades lógicas (cabe o corpo deitado no K.O.)
  var imgs = {}, buf = null, bctx = null;
  var portraitOrder = ['nutri', 'lutador', 'emanuelly', 'enzo', 'pedro', 'naju', 'grazi', 'bispo', 'lohan', 'rafinha', 'douglas', 'fidelis', 'arthur', 'lucas', 'duda', 'cardoso'];
  var portraitSheet = new Image(); portraitSheet.src = 'assets/retratos.png?v=cardoso2';
  ['controle', 'itens', 'inimigos', 'guitarra'].forEach(function (w) { var i = new Image(); i.src = 'assets/' + w + '.png?v=duda'; imgs[w] = i; });
  function ensure(who) {
    if (!META[who]) return null;
    if (!imgs[who]) { var i = new Image(); i.src = 'assets/' + who + '.png?v=cardoso'; imgs[who] = i; }
    return imgs[who];
  }
  // itens recortados da arte de referência (px do atlas = 4x a unidade lógica)
  var ITENS = {"tomate":{"x":0,"y":0,"w":55,"h":56},"banana":{"x":59,"y":0,"w":48,"h":60},"cacho":{"x":111,"y":0,"w":61,"h":64},"cenoura":{"x":176,"y":0,"w":56,"h":54},"halter":{"x":236,"y":0,"w":80,"h":70}};
  var ALIAS = { maca: 'tomate', brocolis: 'cacho' };
  // inimigos recortados da arte do Marcos; face: para que lado a arte original olha (-1 = esquerda)
  var INIM = { fome: { x: 0, y: 0, w: 191, h: 176, face: -1 }, batata: { x: 195, y: 0, w: 148, h: 184, face: 1 },
    xtudo: { x: 347, y: 0, w: 584, h: 540, face: 1 } };
  var ebuf = null, ebctx = null, EBOX = 96;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(p) { p = clamp(p, 0, 1); return p * p * (3 - 2 * p); }
  // sobe até 1 em [a,b], fica e desce em [c,d]
  function bell(t, a, b, c, d) { return t < a ? 0 : t < b ? ease((t - a) / (b - a)) : t < c ? 1 : t < d ? 1 - ease((t - c) / (d - c)) : 0; }
  function lerp(a, b, p) { return a + (b - a) * p; }

  // pose: { root:{dx,dy,rot}, torso, head, armF, armB, legF, legB } -> { rot (graus), dx, dy }
  function P() { return { root: { dx: 0, dy: 0, rot: 0 }, torso: { rot: 0, dx: 0, dy: 0 }, head: { rot: 0, dx: 0, dy: 0 },
    armF: { rot: 0, dx: 0, dy: 0 }, armF2: { rot: 0, dx: 0, dy: 0 }, armB2: { rot: 0, dx: 0, dy: 0 }, armB: { rot: 0, dx: 0, dy: 0 }, legF: { rot: 0, dx: 0, dy: 0 }, legB: { rot: 0, dx: 0, dy: 0 }, prop: null }; }

  // passada: pernas alternam com giro amplo e o pé que vai à frente sobe; o corpo sobe e desce duas vezes por ciclo
  function walkLegs(p, ph) {
    var sn = Math.sin(ph);
    p.legF.rot = 28 * sn; p.legB.rot = -28 * sn;
    p.legF.dy = -3.5 * Math.max(0, -Math.cos(ph)); p.legB.dy = -3.5 * Math.max(0, Math.cos(ph));
    p.root.dy = -Math.abs(Math.sin(ph)) * 2.6;
  }
  var POSES = {
    // Marcos Felipe: arte de guarda fechada como base; soco, chute e guitarra (olhos abertos / solando) são artes inteiras
    lutador: function (s, t) {
      var p = P(), b = Math.sin(t * 7), ph = t * 11;
      p.root.dy = -Math.abs(b) * 1.4; p.head.rot = -b; p.torso.rot = b * 0.8;
      if (s === 'walk') {
        walkLegs(p, ph); p.torso.rot = 4; p.head.rot = Math.sin(ph) * 2;
      } else if (s === 'jump') {
        p.legF.rot = -40; p.legB.rot = 22; p.torso.rot = -4; p.root.dy = 0;
      } else if (s === 'attack1' || s === 'attack2' || s === 'throw') {   // jab, direto (e o arremesso do halter)
        var e = bell(t, 0, 0.05, 0.14, 0.24);
        p.full = s === 'attack2' ? 'direto' : 'soco'; p.root.dx = -3 + 6 * e; p.root.dy = 0;
      } else if (s === 'attack3' || s === 'jumpkick') {                    // chute com a arte da perna esticada
        var c = bell(t, 0, 0.08, 0.3, 0.44);
        p.full = 'chute'; p.root.dx = -2 + 5 * c; p.root.dy = s === 'jumpkick' ? 0 : -2 * c;
      } else if (s === 'cutin') {                                          // destaque do especial: guitarra, olhos abertos
        p.full = 'guitarra'; p.root.dy = 0;
      } else if (s === 'special') {                                        // solando de olhos fechados, no ritmo
        var beat = Math.sin(t * 9);
        p.full = t < 0.2 ? 'guitarra' : 'solo'; p.root.dy = -Math.abs(beat) * 2; p.root.rot = beat * 1.5; p.root.dx = 0;
      } else if (s === 'hurt') {
        var h = 1 - ease(t / 0.3);
        p.torso.rot = -16 * h; p.head.rot = -10 * h; p.root.dx = -3 * h; p.root.dy = 0;
      } else if (s === 'ko') {
        var f = ease(t / 0.3);
        p.root.rot = -86 * f; p.root.dy = 0; p.legF.rot = -10 * f; p.head.rot = 6 * f;
      } else if (s === 'pet') {
        var q = ease(t / 0.3);
        p.legF.rot = -48 * q; p.legB.rot = 36 * q; p.root.dy = 7 * q; p.torso.rot = 20 * q; p.head.rot = 6 * q;
      } else if (s === 'victory') {
        p.full = 'guitarra'; p.root.dy = -Math.abs(Math.sin(t * 6)) * 5;
      }
      return p;
    },
    // Emanuelly: arte de três-quartos com o braço de acenar levantado (como a Lorrany); a outra mão fica no punho, desenhada
    // Emanuelly: abraçada no livro (base); lápis/caneta/borracha saem com a arte do arremesso
    emanuelly: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') { p.legF.rot = 12 * Math.sin(ph); p.legB.rot = -12 * Math.sin(ph); p.root.dy = -Math.abs(Math.sin(ph)) * 2; p.head.rot = Math.sin(ph) * 2; p.torso.rot = 2 * Math.sin(ph); }
      else if (s === 'jump') { p.legF.rot = -15; p.legB.rot = 10; p.root.dy = 0; p.head.rot = -3; }
      else if (s === 'throw' || s === 'attack1') { var e = bell(t, 0, 0.04, 0.14, 0.24); p.full = 'lanca'; p.root.dx = -2 + 5 * e; p.root.dy = 0; }
      else if (s === 'special') { p.full = 'le'; p.root.dy = -Math.abs(Math.sin(t * 3)) * 1.5; }   // lendo a redação com o braço no ar
      else if (s === 'hurt') { var h = 1 - ease(t / 0.3); p.torso.rot = -14 * h; p.head.rot = -10 * h; p.root.dx = -3 * h; p.root.dy = 0; }
      else if (s === 'ko') { var f = ease(t / 0.3); p.root.rot = -86 * f; p.root.dy = 0; p.head.rot = 6 * f; }
      else if (s === 'pet') { var q = ease(t / 0.3); p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q; }
      else if (s === 'victory') { p.root.dy = -Math.abs(Math.sin(t * 6)) * 5; p.head.rot = Math.sin(t * 6) * 3; }
      return p;
    },
    // Cardoso segura o contrabaixo na base; golpe, barrigada e tablet são poses inteiras.
    cardoso: function (s, t) {
      var p=P(), b=Math.sin(t*5), ph=t*12;
      p.root.dy=-Math.abs(b)*1.1;
      if (s==='walk') { walkLegs(p,ph); p.torso.rot=1.5*Math.sin(ph); }
      else if (s==='jump') { p.legF.rot=-25; p.legB.rot=17; p.root.dy=0; }
      else if (s==='attack1') { p.full='baixo'; p.root.dx=5*bell(t,0,0.07,0.2,0.3); p.root.dy=0; }
      else if (s==='barriga') { p.full='barriga'; p.root.dx=8*bell(t,0,0.12,0.24,0.43); p.root.dy=0; }
      else if (s==='cutin' || s==='special') { p.full='tablet'; p.root.dy=0; }
      else if (s==='victory') { p.full='tablet'; p.root.dy=-Math.abs(Math.sin(t*6))*5; }
      else if (s==='hurt') { var h=1-ease(t/0.3); p.root.rot=-8*h; p.root.dx=-3*h; p.root.dy=0; }
      else if (s==='ko') { var f=ease(t/0.3); p.root.rot=-86*f; p.root.dy=0; }
      else if (s==='pet') { var q=ease(t/0.3); p.legF.rot=-35*q; p.legB.rot=25*q; p.root.dy=8*q; p.torso.rot=18*q; }
      return p;
    },
    // Duda Souza: guarda de punhos (base); canta no microfone (choques), pose fashion (+30 HP) e braços abertos no Coram Deo
    duda: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.root.dy = -Math.abs(b) * 1.2;
      if (s === 'walk') { walkLegs(p, ph); }
      else if (s === 'jump') { p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; }
      else if (s === 'throw') { p.full = 'canta'; p.root.dx = Math.sin(t * 60) * 0.6; p.root.dy = 0; }
      else if (s === 'attack1') { var c = bell(t, 0, 0.06, 0.14, 0.26); p.root.dx = 5 * c; p.root.dy = 0; }
      else if (s === 'fashion') { p.full = 'fashion'; p.root.dy = -Math.abs(Math.sin(t * 5)) * 1.5; }
      else if (s === 'cutin' || s === 'special' || s === 'victory') { p.full = 'coram'; p.root.dy = s === 'victory' ? -Math.abs(Math.sin(t * 6)) * 5 : -Math.abs(Math.sin(t * 3)) * 1.5; }
      else if (s === 'hurt') { var h = 1 - ease(t / 0.3); p.root.rot = -8 * h; p.root.dx = -3 * h; p.root.dy = 0; }
      else if (s === 'ko') { var f = ease(t / 0.3); p.root.rot = -86 * f; p.root.dy = 0; }
      else if (s === 'pet') { var q = ease(t / 0.3); p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; }
      return p;
    },
    // Lucas Garcia: punho erguido com o microfone (base); arremesso do microfone, fralda cagada e o grito são artes inteiras
    lucas: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') { walkLegs(p, ph); p.head.rot = Math.sin(ph) * 2; p.torso.rot = 3; }
      else if (s === 'jump') { p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; p.head.rot = -3; }
      else if (s === 'throw') { var e = bell(t, 0, 0.04, 0.14, 0.24); p.full = 'lanca'; p.root.dx = -2 + 5 * e; p.root.dy = 0; }
      else if (s === 'attack1' || s === 'fralda') { var c = bell(t, 0, 0.06, 0.18, 0.32); p.full = 'fralda'; p.root.dx = -3 + 7 * c; p.root.dy = 0; }
      else if (s === 'cutin' || s === 'special') { p.full = 'grito'; p.root.dx = s === 'special' ? Math.sin(t * 60) * 0.8 : 0; p.root.dy = 0; }
      else if (s === 'victory') { p.full = 'grito'; p.root.dy = -Math.abs(Math.sin(t * 6)) * 5; }
      else if (s === 'hurt') { var h = 1 - ease(t / 0.3); p.torso.rot = -14 * h; p.head.rot = -10 * h; p.root.dx = -3 * h; p.root.dy = 0; }
      else if (s === 'ko') { var f = ease(t / 0.3); p.root.rot = -86 * f; p.root.dy = 0; p.head.rot = 6 * f; }
      else if (s === 'pet') { var q = ease(t / 0.3); p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q; }
      return p;
    },
    // Arthur: braços cruzados; canta no microfone (onda sonora), come bolo (+20 HP) e encara a tela no especial
    arthur: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') { walkLegs(p, ph); p.head.rot = Math.sin(ph) * 2; p.torso.rot = 3; }
      else if (s === 'jump') { p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; p.head.rot = -3; }
      else if (s === 'throw' || s === 'attack1') { p.full = 'canta'; p.root.dx = Math.sin(t * 60) * 0.6; p.root.dy = 0; }
      // come o bolo (arte própria), mastigando
      else if (s === 'eat') { p.full = 'come'; p.root.dy = -Math.abs(Math.sin(t * 14)) * 1.2; }
      else if (s === 'cutin' || s === 'special') { p.full = 'raiva'; p.root.dy = 0; }
      else if (s === 'victory') { p.full = 'canta'; p.root.dy = -Math.abs(Math.sin(t * 6)) * 5; }
      else if (s === 'hurt') { var h = 1 - ease(t / 0.3); p.torso.rot = -14 * h; p.head.rot = -10 * h; p.root.dx = -3 * h; p.root.dy = 0; }
      else if (s === 'ko') { var f = ease(t / 0.3); p.root.rot = -86 * f; p.root.dy = 0; p.head.rot = 6 * f; }
      else if (s === 'pet') { var q = ease(t / 0.3); p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q; }
      return p;
    },
    // Fidelis: controle na mão; arremessa o controle (arte própria); no especial pega fogo e dispara controle sem parar
    fidelis: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') { walkLegs(p, ph); p.head.rot = Math.sin(ph) * 2; p.torso.rot = 3; }
      else if (s === 'jump') { p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; p.head.rot = -3; }
      else if (s === 'throw' || s === 'attack1' || s === 'lob') { var e = bell(t, 0, 0.04, 0.14, 0.24); p.full = 'lanca'; p.root.dx = -2 + 5 * e; p.root.dy = 0; }
      else if (s === 'cutin') { p.full = 'fogo'; p.root.dy = 0; }
      else if (s === 'special') { p.full = Math.floor(t * 12) % 2 ? 'lanca' : 'fogo'; p.root.dx = Math.sin(t * 50) * 0.6; p.root.dy = 0; }
      else if (s === 'victory') { p.full = 'fogo'; p.root.dy = -Math.abs(Math.sin(t * 6)) * 5; }
      else if (s === 'hurt') { var h = 1 - ease(t / 0.3); p.torso.rot = -14 * h; p.head.rot = -10 * h; p.root.dx = -3 * h; p.root.dy = 0; }
      else if (s === 'ko') { var f = ease(t / 0.3); p.root.rot = -86 * f; p.root.dy = 0; p.head.rot = 6 * f; }
      else if (s === 'pet') { var q = ease(t / 0.3); p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q; }
      return p;
    },
    // Enzo Gabriel: mesma pose de arte da Emanuelly (aceno + punho); basquete e teclado
    enzo: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.armF.rot = 55 + b * 4; p.armF2.rot = -120;   // guarda: punho perto do rosto (como a Naju)
      p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') {
        walkLegs(p, ph);
        p.armF.rot = 55 + 8 * Math.sin(ph); p.armF2.rot = -120 - 8 * Math.sin(ph); p.head.rot = Math.sin(ph) * 2; p.torso.rot = 3;
      } else if (s === 'jump') {
        p.armF.rot = 5; p.armF2.rot = -20; p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; p.head.rot = -3;
      } else if (s === 'throw') {                 // lápis, caneta ou borracha: braço por cima e solta à frente
        var e = t < 0.07 ? ease(t / 0.07) : 1 - ease((t - 0.07) / 0.13);
        p.armF.rot = t < 0.07 ? lerp(55, -12, e) : lerp(45, -12, e); p.armF2.rot = t < 0.07 ? lerp(-120, -70, e) : lerp(-5, -70, e);   // arremesso por cima, sem cobrir o rosto
        p.torso.rot = t < 0.07 ? -5 * e : 6 * (1 - e);
        if (t < 0.07) p.prop = 'basquete';
      } else if (s === 'attack1') {               // caderno na cabeça do monstro
        var c = t < 0.1 ? ease(t / 0.1) : 1 - ease((t - 0.1) / 0.18);
        p.armF.rot = t < 0.1 ? lerp(55, -10, c) : lerp(80, -10, c); p.armF2.rot = t < 0.1 ? lerp(-120, -55, c) : lerp(-10, -55, c);
        p.torso.rot = t < 0.1 ? -6 * c : 9 * (1 - c); p.prop = 'basquete';
      } else if (s === 'special') {               // dança: braço sobe e desce no ritmo, quadril balança, passinho e pulinho
        var o = ease(Math.min(1, t / 0.2)), bt = t * 9, sw = Math.sin(bt);
        p.armF.rot = lerp(55, -50 + sw * 55, o); p.armF2.rot = lerp(-120, -40 - sw * 35, o);
        p.torso.rot = sw * 8 * o; p.head.rot = -sw * 7 * o; p.root.dx = sw * 3 * o; p.root.dy = -Math.abs(Math.cos(bt)) * 4 * o;
        p.legF.rot = (-12 + sw * 18) * o; p.legB.rot = (12 + sw * 18) * o;
      } else if (s === 'hurt') {
        var h = 1 - ease(t / 0.3);
        p.torso.rot = -14 * h; p.head.rot = -10 * h; p.armF.rot = 150; p.armF2.rot = -40; p.root.dx = -3 * h; p.root.dy = 0;
      } else if (s === 'ko') {
        var f = ease(t / 0.3);
        p.root.rot = -86 * f; p.root.dy = 0; p.armF.rot = lerp(55, 170, f); p.armF2.rot = lerp(-120, -10, f); p.head.rot = 6 * f;
      } else if (s === 'pet') {
        var q = ease(t / 0.3);
        p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q;
        p.armF.rot = lerp(55, 70 + Math.sin(t * 9) * 10, q); p.armF2.rot = lerp(-120, -40 + Math.sin(t * 9) * 14, q);
      } else if (s === 'victory') {               // o aceno da arte
        p.armF.rot = 6 + Math.sin(t * 10) * 8; p.armF2.rot = -10 + Math.sin(t * 10) * 22; p.root.dy = -Math.abs(Math.sin(t * 6)) * 5; p.head.rot = Math.sin(t * 6) * 3;
      }
      return p;
    },
    // Pedro Guilherme: mesma arte-base do Enzo; teclado pequeno que atira semínimas, voadora e solo com raio
    // Pedro Guilherme: keytar empunhado como arma (base); voadora com a arte própria
    pedro: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') { walkLegs(p, ph); p.head.rot = Math.sin(ph) * 2; p.torso.rot = 2; }
      else if (s === 'jump') { p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; p.head.rot = -3; }
      else if (s === 'throw') { var e = 1 - ease(Math.min(1, t / 0.15)); p.root.dx = -2.5 * e; p.torso.rot = -4 * e; p.root.dy = 0; }   // coice do disparo
      else if (s === 'attack1') { var c = bell(t, 0, 0.06, 0.14, 0.26); p.root.dx = 5 * c; p.torso.rot = 8 * c; p.root.dy = 0; }   // pancada com o teclado
      else if (s === 'jumpkick') { p.full = 'voadora'; p.root.dy = 0; }
      else if (s === 'special') { p.root.dx = Math.sin(t * 60) * 0.8; p.torso.rot = -3; p.root.dy = 0; }   // segura o disparo do raio
      else if (s === 'hurt') { var h = 1 - ease(t / 0.3); p.torso.rot = -14 * h; p.head.rot = -10 * h; p.root.dx = -3 * h; p.root.dy = 0; }
      else if (s === 'ko') { var f = ease(t / 0.3); p.root.rot = -86 * f; p.root.dy = 0; p.head.rot = 6 * f; }
      else if (s === 'pet') { var q = ease(t / 0.3); p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q; }
      else if (s === 'victory') { p.full = 'voadora'; p.root.dy = -6 - Math.abs(Math.sin(t * 6)) * 5; }
      return p;
    },
    // Naju: arte com o punho perto da boca (segurando o microfone); braço com cotovelo, antebraço aponta para cima
    naju: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.armF.rot = b * 3; p.armF2.rot = b * 4; p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') {
        walkLegs(p, ph); p.armF.rot = 6 * Math.sin(ph); p.armF2.rot = 8 * Math.sin(ph); p.head.rot = Math.sin(ph) * 2; p.torso.rot = 3;
      } else if (s === 'jump') {
        p.armF.rot = -45; p.armF2.rot = -10; p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; p.head.rot = -3;
      } else if (s === 'throw') {               // microfone lançado: braço esticado à frente segurando o fio
        var e = ease(Math.min(1, t / 0.06));
        p.armF.rot = lerp(0, -12, e); p.armF2.rot = lerp(0, 88, e); p.torso.rot = 6 * e; p.prop = 'fio';
      } else if (s === 'attack1') {             // pancada de microfone de cima para baixo
        var c = t < 0.1 ? ease(t / 0.1) : 1 - ease((t - 0.1) / 0.18);
        p.armF.rot = t < 0.1 ? lerp(0, -60, c) : lerp(30, -60, c); p.armF2.rot = t < 0.1 ? lerp(0, -20, c) : lerp(110, -20, c);
        p.torso.rot = t < 0.1 ? -6 * c : 9 * (1 - c);
      } else if (s === 'attack2') {             // gira o microfone pelo fio em volta da cabeça
        var o2 = ease(Math.min(1, t / 0.08));
        p.armF.rot = lerp(0, -70, o2) + Math.sin(t * 30) * 5; p.armF2.rot = lerp(0, 75, o2);   // mão acima do ombro p.prop = 'micGiro'; p.spinT = t;
        p.torso.rot = Math.sin(t * 30) * 3; p.legF.rot = -10; p.legB.rot = 10;
      } else if (s === 'special') {             // canta gritando no microfone
        var o = ease(Math.min(1, t / 0.15));
        p.armF.rot = -4 * o; p.armF2.rot = -6 * o; p.head.rot = -7 * o + Math.sin(t * 40) * 1.2 * o; p.torso.rot = -4 * o;
        p.legF.rot = -16 * o; p.legB.rot = 16 * o; p.root.dy = Math.sin(t * 45) * 0.6 * o; p.scream = o;
      } else if (s === 'hurt') {
        var h = 1 - ease(t / 0.3);
        p.torso.rot = -14 * h; p.head.rot = -10 * h; p.armF.rot = 40; p.armF2.rot = 70; p.root.dx = -3 * h; p.root.dy = 0;
      } else if (s === 'ko') {
        var f = ease(t / 0.3);
        p.root.rot = -86 * f; p.root.dy = 0; p.armF.rot = 40 * f; p.armF2.rot = 120 * f; p.head.rot = 6 * f;
      } else if (s === 'pet') {
        var q = ease(t / 0.3);
        p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q;
        p.armF.rot = lerp(0, 40, q); p.armF2.rot = lerp(0, 100 + Math.sin(t * 9) * 14, q);
      } else if (s === 'victory') {
        p.armF.rot = -70 + Math.sin(t * 10) * 6; p.armF2.rot = -15; p.root.dy = -Math.abs(Math.sin(t * 6)) * 5; p.head.rot = Math.sin(t * 6) * 3;
      }
      return p;
    },
    // Grazi: arte com o braço da frente esticado (pistola de cola quente na mão); no especial vira a arte apontando
    grazi: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.armF.rot = -8 + b * 3; p.armF2.rot = -22 + b * 3; p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') {
        walkLegs(p, ph); p.armF.rot = -8 + 6 * Math.sin(ph); p.armF2.rot = -22; p.head.rot = Math.sin(ph) * 2; p.torso.rot = 3;
      } else if (s === 'jump') {
        p.armF.rot = -45; p.armF2.rot = -30; p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; p.head.rot = -3;
      } else if (s === 'throw') {               // dispara a cola: braço reto e coice
        var e = 1 - ease(Math.min(1, t / 0.18));
        p.armF.rot = -4 - 10 * e; p.armF2.rot = -6 * e; p.torso.rot = -3 * e; p.root.dx = -1.5 * e;
      } else if (s === 'attack1') {             // pancada com a pistola, de cima para baixo
        var c = t < 0.1 ? ease(t / 0.1) : 1 - ease((t - 0.1) / 0.18);
        p.armF.rot = t < 0.1 ? lerp(-8, -95, c) : lerp(25, -95, c); p.armF2.rot = t < 0.1 ? lerp(-22, -40, c) : lerp(0, -40, c);
        p.torso.rot = t < 0.1 ? -6 * c : 9 * (1 - c);
      } else if (s === 'attack2') {             // furacão: gira com o braço aberto
        var sp = t * 32; p.spinT = t;
        p.armF.rot = -20 + Math.sin(sp) * 25; p.armF2.rot = 0; p.root.dx = Math.sin(sp) * 2.5; p.torso.rot = Math.sin(sp) * 8;
        p.head.rot = -Math.sin(sp) * 6; p.legF.rot = Math.sin(sp) * 14; p.legB.rot = -Math.sin(sp) * 14; p.root.dy = -3;
      } else if (s === 'special') {             // aponta para a frente com os dois braços (arte própria)
        p.point = true; p.root.dy = -Math.abs(Math.sin(t * 6)) * 1.5;
      } else if (s === 'hurt') {
        var h = 1 - ease(t / 0.3);
        p.torso.rot = -14 * h; p.head.rot = -10 * h; p.armF.rot = 40; p.armF2.rot = 30; p.root.dx = -3 * h; p.root.dy = 0;
      } else if (s === 'ko') {
        var f = ease(t / 0.3);
        p.root.rot = -86 * f; p.root.dy = 0; p.armF.rot = 60 * f; p.armF2.rot = 20 * f; p.head.rot = 6 * f;
      } else if (s === 'pet') {
        var q = ease(t / 0.3);
        p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q;
        p.armF.rot = lerp(-8, 50 + Math.sin(t * 9) * 10, q); p.armF2.rot = lerp(-22, 20, q);
      } else if (s === 'victory') {
        p.armF.rot = -80 + Math.sin(t * 10) * 8; p.armF2.rot = -20; p.root.dy = -Math.abs(Math.sin(t * 6)) * 5; p.head.rot = Math.sin(t * 6) * 3;
      }
      return p;
    },
    // Douglas Feijó: mãos no bolso de base; cavaquinho (claves), arremesso do cavaquinho e o grito no microfone são artes inteiras
    douglas: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') { walkLegs(p, ph); p.head.rot = Math.sin(ph) * 2; p.torso.rot = 3; }
      else if (s === 'jump') { p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; p.head.rot = -3; }
      else if (s === 'throw' || s === 'attack1') { p.full = 'cavaco'; p.root.dy = -Math.abs(Math.sin(t * 30)) * 1.2; p.root.dx = s === 'attack1' ? 4 * bell(t, 0, 0.06, 0.14, 0.24) : 0; }
      else if (s === 'lanca') { p.full = 'arremesso'; p.root.dx = -3 + 5 * bell(t, 0, 0.05, 0.15, 0.3); p.root.dy = 0; }
      else if (s === 'special' || s === 'cutin') { p.full = 'grito'; p.root.dx = Math.sin(t * 60) * 0.7; p.root.dy = 0; }
      else if (s === 'victory') { p.full = 'cavaco'; p.root.dy = -Math.abs(Math.sin(t * 6)) * 5; }
      else if (s === 'hurt') { var h = 1 - ease(t / 0.3); p.torso.rot = -14 * h; p.head.rot = -10 * h; p.root.dx = -3 * h; p.root.dy = 0; }
      else if (s === 'ko') { var f = ease(t / 0.3); p.root.rot = -86 * f; p.root.dy = 0; p.head.rot = 6 * f; }
      else if (s === 'pet') { var q = ease(t / 0.3); p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q; }
      return p;
    },
    // Lohan: arte segurando a câmera; o estabilizador com iPhone aparece na mão no ataque; super flash com a câmera no rosto
    lohan: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') { walkLegs(p, ph); p.head.rot = Math.sin(ph) * 2; p.torso.rot = 3; }
      else if (s === 'jump') { p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; p.head.rot = -3; }
      else if (s === 'attack1') {                 // golpe de estabilizador: o bastão com o iPhone varre para a frente
        var c = t < 0.08 ? ease(t / 0.08) : 1 - ease(Math.min(1, (t - 0.08) / 0.2));
        p.obj = { kind: 'gimbal', x: 49, y: -134, rot: lerp(0.4, -1.3, c) }; p.torso.rot = 8 * c; p.root.dx = 3 * c;
      } else if (s === 'throw') {                 // solta a câmera voadora: tronco para a frente
        var e = 1 - ease(Math.min(1, t / 0.2)); p.torso.rot = 8 * e; p.head.rot = 3 * e;
      } else if (s === 'special' || s === 'cutin' || s === 'victory') { p.full = 'flash'; p.root.dy = s === 'victory' ? -Math.abs(Math.sin(t * 6)) * 5 : 0; }
      else if (s === 'hurt') { var h = 1 - ease(t / 0.3); p.torso.rot = -14 * h; p.head.rot = -10 * h; p.root.dx = -3 * h; p.root.dy = 0; }
      else if (s === 'ko') { var f = ease(t / 0.3); p.root.rot = -86 * f; p.root.dy = 0; p.head.rot = 6 * f; }
      else if (s === 'pet') { var q = ease(t / 0.3); p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q; }
      return p;
    },
    // Rafinha: baquetas na mão; joga pratos, dá o dash; o destaque do especial aponta as baquetas e no solo levanta os braços
    rafinha: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') { walkLegs(p, ph); p.head.rot = Math.sin(ph) * 2; p.torso.rot = 3; }
      else if (s === 'jump') { p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; p.head.rot = -3; }
      else if (s === 'throw' || s === 'attack1') {  // arremessa o prato / bate de baqueta: arte das baquetas apontadas
        var e = bell(t, 0, 0.04, 0.14, 0.22); p.full = 'grito'; p.root.dx = -2 + 4 * e; p.root.dy = 0;
      } else if (s === 'dash') { p.torso.rot = 16; p.head.rot = 6; p.legF.rot = -35; p.legB.rot = 30; p.root.dy = -2; }
      else if (s === 'cutin') { p.full = 'grito'; p.root.dy = 0; }
      else if (s === 'special' || s === 'victory') { var bt = Math.sin(t * 14); p.full = 'solo'; p.root.dy = -Math.abs(bt) * 3; p.root.rot = bt * 1.5; }
      else if (s === 'hurt') { var h = 1 - ease(t / 0.3); p.torso.rot = -14 * h; p.head.rot = -10 * h; p.root.dx = -3 * h; p.root.dy = 0; }
      else if (s === 'ko') { var f = ease(t / 0.3); p.root.rot = -86 * f; p.root.dy = 0; p.head.rot = 6 * f; }
      else if (s === 'pet') { var q = ease(t / 0.3); p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q; }
      return p;
    },
    // Bispo André: arte com o soco esticado para a frente; ora e grita com artes inteiras próprias
    bispo: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.armF.rot = -4 + b * 3; p.armF2.rot = -6 + b * 2; p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') {
        walkLegs(p, ph); p.armF.rot = -4 + 7 * Math.sin(ph); p.armF2.rot = -10; p.head.rot = Math.sin(ph) * 2; p.torso.rot = 3;
      } else if (s === 'jump') {
        p.armF.rot = -50; p.armF2.rot = -30; p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; p.head.rot = -3;
      } else if (s === 'throw') {               // arremessa a Bíblia por cima
        var e = t < 0.07 ? ease(t / 0.07) : 1 - ease(Math.min(1, (t - 0.07) / 0.13));
        p.armF.rot = t < 0.07 ? lerp(-4, -110, e) : lerp(10, -110, e); p.armF2.rot = t < 0.07 ? lerp(-6, -30, e) : lerp(0, -30, e);
        p.torso.rot = t < 0.07 ? -5 * e : 6 * (1 - e);
        if (t < 0.07) p.prop = 'biblia';
      } else if (s === 'attack1') {             // direto: corpo vai junto com o soco
        var c = t < 0.1 ? ease(t / 0.1) : 1 - ease((t - 0.1) / 0.18);
        p.armF.rot = lerp(-4, 2, c); p.armF2.rot = lerp(-40, 0, c); p.root.dx = 5 * c; p.torso.rot = 6 * c;
      } else if (s === 'pray') {                // oração: braços para o céu (arte própria)
        p.full = 'ora'; p.root.dy = -Math.abs(Math.sin(t * 4)) * 1.5;
      } else if (s === 'special') {             // grita no microfone apontando (arte própria), tremendo
        p.full = 'grita'; p.root.dx = Math.sin(t * 70) * 0.8; p.root.dy = 0;
      } else if (s === 'hurt') {
        var h = 1 - ease(t / 0.3);
        p.torso.rot = -14 * h; p.head.rot = -10 * h; p.armF.rot = 40; p.armF2.rot = 30; p.root.dx = -3 * h; p.root.dy = 0;
      } else if (s === 'ko') {
        var f = ease(t / 0.3);
        p.root.rot = -86 * f; p.root.dy = 0; p.armF.rot = 60 * f; p.armF2.rot = 20 * f; p.head.rot = 6 * f;
      } else if (s === 'pet') {
        var q = ease(t / 0.3);
        p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q;
        p.armF.rot = lerp(-4, 50 + Math.sin(t * 9) * 10, q); p.armF2.rot = lerp(-6, 20, q);
      } else if (s === 'victory') {
        p.full = 'ora'; p.root.dy = -Math.abs(Math.sin(t * 6)) * 5;
      }
      return p;
    },
    // Lorrany: arte segurando a prancheta junto ao peito (braços na arte do tronco); no beijinho vira a arte se esticando
    nutri: function (s, t) {
      var p = P(), b = Math.sin(t * 5), ph = t * 12;
      p.root.dy = -Math.abs(b) * 1.2; p.head.rot = b * 1.5; p.torso.rot = b * 0.8;
      if (s === 'walk') {
        walkLegs(p, ph); p.head.rot = Math.sin(ph) * 2; p.torso.rot = 3;
      } else if (s === 'jump') {
        p.legF.rot = -30; p.legB.rot = 20; p.root.dy = 0; p.head.rot = -3;
      } else if (s === 'throw') {                 // joga a fruta: tronco dá o tranco para a frente
        var e = 1 - ease(Math.min(1, t / 0.2));
        p.torso.rot = 9 * e; p.head.rot = 4 * e; p.root.dx = 2 * e;
      } else if (s === 'attack1') {               // pancada de prancheta: corpo todo para a frente
        var c = t < 0.1 ? ease(t / 0.1) : 1 - ease((t - 0.1) / 0.18);
        p.torso.rot = 14 * c; p.head.rot = 5 * c; p.root.dx = 5 * c; p.legB.rot = 12 * c;
      } else if (s === 'special') {               // beijinho: na ponta do pé, esticada até a bochecha dele
        var k = bell(t, 0.3, 0.5, 1.1, 1.4);
        p.kiss = bell(t, 0.3, 0.55, 1.05, 1.3);
        if (k > 0.25) { p.full = 'beijo'; p.root.dy = 0; } else { p.torso.rot = 30 * k; p.root.dx = 8 * k; }
      } else if (s === 'hurt') {
        var h = 1 - ease(t / 0.3);
        p.torso.rot = -14 * h; p.head.rot = -10 * h; p.root.dx = -3 * h; p.root.dy = 0;
      } else if (s === 'ko') {
        var f = ease(t / 0.3);
        p.root.rot = -86 * f; p.root.dy = 0; p.head.rot = 6 * f;
      } else if (s === 'pet') {
        var q = ease(t / 0.3);
        p.legF.rot = -40 * q; p.legB.rot = 30 * q; p.root.dy = 8 * q; p.torso.rot = 22 * q; p.head.rot = 8 * q;
      } else if (s === 'victory') {
        p.root.dy = -Math.abs(Math.sin(t * 6)) * 5; p.head.rot = Math.sin(t * 6) * 3;
      }
      return p;
    }
  };

  // ponta da mão de cada braço (unidades do atlas, a partir do pivô) para desenhar objetos na mão
  var HAND = { lutador: [74, 2], nutri: [66, -72], emanuelly: [69, -48], enzo: [64, -41], pedro: [64, -41], naju: [18.5, -37.5], grazi: [80, 0], bispo: [77, 0] };

  // guitarra (pixel art da foto do Marcos): pivô no meio do corpo, desenhada no tronco dele
  var GTR = { x: -4, y: -12, rot: 58, fa: -70, fb: -85, ba: -85 };
  // teclado do Enzo num suporte em X, com as teclas acendendo no ritmo
  function drawKeys(c, k) {
    c.save(); c.translate(k.x, k.y); c.globalAlpha = Math.min(1, k.o * 2);
    if (k.small) { c.rotate(-0.25); c.scale(0.62, 0.62); }
    c.strokeStyle = '#2a2a33'; c.lineWidth = 1.6;
    if (!k.small) { c.beginPath(); c.moveTo(-12, 3); c.lineTo(9, 30); c.moveTo(12, 3); c.lineTo(-9, 30); c.stroke(); }   // suporte
    c.fillStyle = '#0d0d14'; c.fillRect(-24, -4, 48, 9);
    c.fillStyle = '#26262f'; c.fillRect(-23, -3.4, 46, 2.4);
    c.fillStyle = '#ff3b6b'; c.fillRect(-21, -2.8, 2, 1.2); c.fillStyle = '#3bff9a'; c.fillRect(-18, -2.8, 2, 1.2);   // luzinhas
    var lit = Math.floor(k.t * 14) % 15, lit2 = (lit * 7 + 3) % 15;
    for (var i = 0; i < 15; i++) {                                                // teclas brancas
      c.fillStyle = i === lit || i === lit2 ? '#ffe066' : '#f4f4f8'; c.fillRect(-22.5 + i * 3, -1, 2.6, 5.4);
    }
    c.fillStyle = '#0d0d14';
    [0, 1, 3, 4, 5, 7, 8, 10, 11, 12].forEach(function (i) { c.fillRect(-20.6 + i * 3, -1, 1.6, 3.2); });     // teclas pretas
    c.restore();
  }
  function drawGuitar(c, g) {
    var im = imgs.guitarra; if (!im || !im.complete || !im.naturalWidth) return;
    var s = 0.5;
    c.save(); c.translate(g.x, g.y); c.rotate(g.rot * Math.PI / 180); c.imageSmoothingEnabled = false;
    c.drawImage(im, -19 * s, -76 * s, im.width * s, im.height * s);
    if (g.solo) {
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.25;                 // cordas vibrando
      for (var i = 0; i < 3; i++) {
        var v = Math.sin(g.t * 70 + i * 2) * 0.35, sx = (17.6 + i * 0.8) * s;
        c.beginPath(); c.moveTo(-19 * s + sx, 6 * s - 76 * s + 70 * s); c.quadraticCurveTo(-19 * s + sx + v, -20, -19 * s + sx, -76 * s + 14 * s); c.stroke();
      }
      c.fillStyle = '#fffbe0';                                                        // brilhos piscando nas ferragens douradas
      [[15, 64], [22, 80], [20, 6], [13, 88]].forEach(function (q, i) {
        var a = Math.max(0, Math.sin(g.t * 9 + i * 1.7)); if (a < 0.6) return;
        var x = (q[0] - 19) * s, y = (q[1] - 76) * s, r = a * 1.6;
        c.fillRect(x - r, y - 0.25, r * 2, 0.5); c.fillRect(x - 0.25, y - r, 0.5, r * 2);
      });
    }
    c.restore();
  }
  // caderno da Emanuelly: fechado (capa roxa com espiral) ou aberto com a redação (linhas que vão sendo escritas)
  function drawBook(c, open, t) {
    var L = '#2a1530';
    if (!open) {
      c.fillStyle = L; c.fillRect(-5.5, -7, 11, 14); c.fillStyle = '#8a4fd8'; c.fillRect(-5, -6.5, 10, 13);
      c.fillStyle = '#b98cf0'; c.fillRect(-3, -4, 6, 3); c.fillStyle = '#e9e4f2'; for (var i = 0; i < 6; i++) c.fillRect(-6, -5.6 + i * 2.2, 2, 0.9);
      return;
    }
    var n = Math.floor(Math.min(1, (t || 0) * 1.2) * 14);
    c.fillStyle = L; c.fillRect(-13, -8.5, 26, 16); c.fillStyle = '#8a4fd8'; c.fillRect(-12.5, -8, 25, 15);
    c.fillStyle = '#fbf8ef'; c.fillRect(-12, -7.5, 11.5, 14); c.fillRect(0.5, -7.5, 11.5, 14);
    c.fillStyle = '#9fc3e8'; for (var y = 0; y < 6; y++) { c.fillRect(-11.5, -5 + y * 2, 10.5, 0.35); c.fillRect(1, -5 + y * 2, 10.5, 0.35); }
    c.fillStyle = '#e86b8a'; c.fillRect(-10.5, -7.5, 0.35, 14);
    c.fillStyle = '#2b2b3a';                                                 // a redação sendo escrita
    for (var j = 0; j < n; j++) { var pg = j < 7 ? -10 : 1.5, ln = j % 7; c.fillRect(pg, -5.7 + ln * 2, 3 + ((j * 7) % 6), 0.7); }
    c.fillStyle = '#c9c4d6'; for (var i2 = 0; i2 < 7; i2++) c.fillRect(-0.6, -7 + i2 * 2, 1.2, 0.9);
  }
  // Naju gritando no microfone: bocão aberto com dentes e língua, por cima do sorriso (px da peça da cabeça)
  function screamFace(c, a) {
    var mx = 99, my = 128, w = 15 * a + 4, h = 15 * a + 3;
    c.save(); c.lineJoin = 'round';
    c.fillStyle = '#c47a52'; c.beginPath(); c.ellipse(mx, my - 3, 20, 9, 0, 0, Math.PI * 2); c.fill();      // tapa o sorriso
    c.fillStyle = '#3a0810'; c.strokeStyle = '#140308'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(mx, my, w, h, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.save(); c.beginPath(); c.ellipse(mx, my, w - 1.5, h - 1.5, 0, 0, Math.PI * 2); c.clip();
    c.fillStyle = '#f6f2ea'; c.fillRect(mx - w, my - h, w * 2, h * 0.32);                                  // dentes de cima
    c.fillStyle = '#e8e2d6'; c.fillRect(mx - w, my + h * 0.72, w * 2, h * 0.3);                            // de baixo
    c.fillStyle = '#e0607a'; c.beginPath(); c.ellipse(mx + 2, my + h * 0.55, w * 0.6, h * 0.38, 0, 0, Math.PI * 2); c.fill();   // língua
    c.fillStyle = '#7a1424'; c.beginPath(); c.ellipse(mx, my - h * 0.05, w * 0.3, h * 0.22, 0, 0, Math.PI * 2); c.fill();      // goela
    c.restore(); c.restore();
  }
  function drawMic(c) {   // microfone: cabo preto, globo prateado com grade (cabeça para +y local = para a boca)
    c.translate(0, -4);   // origem no meio do cabo (onde a mão segura)
    c.fillStyle = '#0d0d12'; c.fillRect(-1.6, -1, 3.2, 9);
    c.fillStyle = '#2a2a33'; c.fillRect(-1.1, -0.5, 2.2, 8);
    c.fillStyle = '#0d0d12'; c.beginPath(); c.arc(0, -3.6, 3.8, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#b9bcc6'; c.beginPath(); c.arc(0, -3.6, 3, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#6d7180'; c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(-3, -3.6); c.lineTo(3, -3.6); c.moveTo(0, -6.6); c.lineTo(0, -0.6); c.moveTo(-2.1, -5.7); c.lineTo(2.1, -1.5); c.moveTo(2.1, -5.7); c.lineTo(-2.1, -1.5); c.stroke();
    c.fillStyle = '#fff'; c.fillRect(-1.6, -5.6, 1, 1);
  }
  function drawProp(c, who, prop, k, parts, pose) {
    var h = HAND[who];
    if (parts) h = [h[0] - (parts.armF2.at[0] - parts.armF.at[0]), h[1] - (parts.armF2.at[1] - parts.armF.at[1])];   // mão no antebraço
    c.save(); c.translate(h[0] * k, h[1] * k);
    if (prop === 'prancheta') {
      c.rotate(0.3); c.fillStyle = '#2b1a12'; c.fillRect(-5.5, -7.5, 11, 15);
      c.fillStyle = '#9a6235'; c.fillRect(-5, -7, 10, 14); c.fillStyle = '#f4efe2'; c.fillRect(-3.5, -5, 7, 10.5);
      c.fillStyle = '#9fb3c8'; for (var i = 0; i < 4; i++) c.fillRect(-2.5, -3.5 + i * 2.4, 5, 0.6);
      c.fillStyle = '#c7c9cc'; c.fillRect(-2, -8, 4, 2);
    } else if (prop === 'lapis' || prop === 'borracha' || prop === 'caneta' || prop === 'basquete') {
      drawItem(c, prop, 0, 0, prop === 'lapis' ? -1.2 : 0.3, 1);
    } else if (prop === 'colaquente') {         // pistola de cola quente: corpo rosa, gatilho, bastão de cola atrás, bico prateado
      c.rotate(0.5); c.scale(0.62, 0.62); c.translate(2, 2);   // tamanho de mão e cano na horizontal na pose base
      c.fillStyle = '#1a1014'; c.fillRect(-4.5, -6.2, 15, 7.4); c.fillRect(-2.6, -0.5, 5.2, 8.6);
      c.fillStyle = '#ff5fa8'; c.fillRect(-4, -5.7, 14, 6.4); c.fillStyle = '#ff9fcd'; c.fillRect(-4, -5.7, 14, 1.6);
      c.fillStyle = '#d23c86'; c.fillRect(-2.1, 0, 4.2, 7.6);                                   // cabo
      c.fillStyle = '#1a1014'; c.fillRect(2.4, 0.6, 1.6, 3); c.fillStyle = '#ffe066'; c.fillRect(2.7, 0.9, 1, 2.4);   // gatilho
      c.fillStyle = '#f3f0dc'; c.fillRect(-9, -4.3, 5.2, 3.2); c.fillStyle = '#cfc9a8'; c.fillRect(-9, -2.2, 5.2, 1.1);   // bastão de cola
      c.fillStyle = '#1a1014'; c.beginPath(); c.moveTo(9.6, -5); c.lineTo(15, -2.6); c.lineTo(9.6, -0.2); c.fill();
      c.fillStyle = '#c9cdd4'; c.beginPath(); c.moveTo(10, -4.3); c.lineTo(14, -2.6); c.lineTo(10, -0.9); c.fill();   // bico
    } else if (prop === 'biblia') {
      drawItem(c, 'biblia', 2, 0, 0.3, 0.9);
    } else if (prop === 'mic') {                // na mão, globo virado para a boca
      c.rotate(-1.25); drawMic(c);
    } else if (prop === 'fio') {                // só a ponta do fio saindo da mão (o resto vai até o microfone no ar)
      c.strokeStyle = '#111'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, 0); c.lineTo(3, 2); c.stroke();
    } else if (prop === 'micGiro') {            // microfone rodando no fio em volta da mão
      var ang = (pose && pose.spinT || 0) * 26;
      for (var g = 3; g >= 0; g--) {
        var aa = ang - g * 0.32, rx = Math.cos(aa) * 17, ry = Math.sin(aa) * 6 - 6;
        c.globalAlpha = g ? 0.18 : 1;
        if (!g) { c.strokeStyle = '#111'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 0); c.lineTo(rx, ry); c.stroke(); }
        c.save(); c.translate(rx, ry); c.rotate(aa + 1.6); drawMic(c); c.restore();
      }
      c.globalAlpha = 1;
    } else if (prop === 'teclinho') {
      drawKeys(c, { x: 0, y: 0, t: 0.3, o: 1, small: true });
    } else if (prop === 'caderno') {
      c.rotate(-0.4); drawBook(c, false);
    } else if (prop === 'halter' || prop === 'fruta') {
      drawItem(c, prop === 'halter' ? 'halter' : 'tomate', 0, 0, 0, 1);
    }
    c.restore();
  }

  // cor e raio (px do atlas) da tampa do cotovelo do braço da frente; tirados da própria arte
  var ELBOW = {"nutri": ["#f0f5f8", 13.4, [20.5, -19.0]], "emanuelly": ["#fddfd5", 14.6, [29.4, -15.3]], "enzo": ["#c07554", 14.6, [32.2, -10.1]], "pedro": ["#f7b799", 14.6, [32.2, -10.0]], "grazi": ["#f6ad8c", 13.6, [0, 0]], "bispo": ["#c7dcef", 14, [0, 0]]};   // [cor, raio, centro relativo ao ombro] em px do atlas
  var WRIST = {"nutri": ["#e7eff6", 13.4, [10.8, -8.1]], "emanuelly": ["#f9d7cc", 14.2, [15.5, -1.1]], "enzo": ["#bf7351", 14.2, [12.6, -8.9]], "pedro": ["#f6b798", 13.6, [11.8, -8.7]], "grazi": ["#f6ad8c", 13.6, [0, 0]], "bispo": ["#c7dcef", 14, [0, 0]]};   // tampa redonda na ponta cortada do antebraço
  var HEADS = { nutri: 0.86, emanuelly: 0.86, fidelis: 0.86, arthur: 0.86, lucas: 0.86, cardoso: 1.35, enzo: 0.86, pedro: 0.86, naju: 0.86, grazi: 0.8, bispo: 0.86, lohan: 0.86, rafinha: 0.86 };   // cabeça/corpo como o Marcos (~38% da altura)
  var BODY = { grazi: [0.84, 0.9], duda: [0.875, 0.875] };
  // altura da virilha em cada perna [trás, frente], em px da peça (medida na borda de dentro): acima dela a perna não gira
  var CROTCH = { naju: [43, 47], douglas: [32, 41], arthur: [46, 45], lucas: [49, 58], duda: [38, 43], cardoso: [46, 45] };   // duda: o corpo todo menor (tamanho da Grazi)
  function compose(c, who, state, t, o) {
    var bs = BODY[who]; if (!bs) return compose0(c, who, state, t, o);
    c.save(); c.scale(bs[0], bs[1]); compose0(c, who, state, t, o); c.restore();
  }
  function compose0(c, who, state, t, o) {
    var M = META[who], img = imgs[who];
    var k = H / M.height, pose = POSES[who](state, t);
    if (who === 'naju' && !pose.prop && !(o && o.noMic)) pose.prop = 'mic';
    if (who === 'grazi' && !pose.prop && !pose.point) pose.prop = 'colaquente';
    var full = pose.full || (pose.point && 'aponta');
    if (full && M.pose && M.pose[full]) {   // pose inteira desenhada da arte (Grazi apontando, Bispo orando e gritando)
      var ap = M.pose[full]; c.save(); c.translate(pose.root.dx, pose.root.dy);
      c.drawImage(img, ap.x, ap.y, ap.w, ap.h, -ap.feet[0] * k, -ap.feet[1] * k, ap.w * k, ap.h * k); c.restore(); return;
    }
    if (who === 'naju' && o && o.noMic && pose.prop === 'mic') pose.prop = null;
    var torso = M.parts.torso, tr = pose.torso;
    c.save();
    c.translate(pose.root.dx, pose.root.dy); c.rotate(pose.root.rot * Math.PI / 180);
    var list = Object.keys(M.parts).map(function (n) { return [n, M.parts[n]]; }).sort(function (a, b) { return a[1].z - b[1].z; });
    list.forEach(function (e) {
      var n = e[0], part = e[1], q = pose[n] || { rot: 0, dx: 0, dy: 0 };
      c.save();
      if (n !== 'legF' && n !== 'legB' && n !== 'torso') {   // filhos do tronco giram com ele
        c.translate(torso.at[0] * k, torso.at[1] * k); c.rotate(tr.rot * Math.PI / 180); c.translate(-torso.at[0] * k, -torso.at[1] * k);
      }
      if (part.parent) {   // antebraço: pendurado no cotovelo; q.rot é a dobra relativa ao braço
        var pp = M.parts[part.parent], pq = pose[part.parent];
        c.translate(pp.at[0] * k + (pq.dx || 0), pp.at[1] * k + (pq.dy || 0)); c.rotate((pq.rot - (pp.r0 || 0)) * Math.PI / 180);
        c.translate((part.at[0] - pp.at[0]) * k + (q.dx || 0), (part.at[1] - pp.at[1]) * k + (q.dy || 0)); c.rotate((q.rot || 0) * Math.PI / 180);
      } else if (part.follow) {   // manga curta: gira junto com o braço, só uma fração do ângulo
        var fp = M.parts[part.follow], fq = pose[part.follow];
        c.translate(part.at[0] * k, part.at[1] * k); c.rotate((fq.rot - (fp.r0 || 0)) * (part.fk || 0.5) * Math.PI / 180);
      } else if ((n === 'legF' || n === 'legB') && CROTCH[who]) {   // passada abaixo da virilha: o alto da perna fica parado
        var cr = CROTCH[who][n === 'legB' ? 0 : 1];
        c.translate(part.at[0] * k, part.at[1] * k);
        c.save(); c.translate(q.dx || 0, (cr - part.pivot[1]) * k + (q.dy || 0)); c.rotate((q.rot - (part.r0 || 0)) * Math.PI / 180);
        c.drawImage(img, part.x, part.y + cr, part.w, part.h - cr, -part.pivot[0] * k, 0, part.w * k, (part.h - cr) * k); c.restore();
        c.drawImage(img, part.x, part.y, part.w, cr + 5, -part.pivot[0] * k, -part.pivot[1] * k, part.w * k, (cr + 5) * k);   // por cima, cobrindo a emenda
        c.restore(); return;
      } else {
        c.translate(part.at[0] * k + (q.dx || 0), part.at[1] * k + (q.dy || 0));
        c.rotate(((n === 'torso' ? tr.rot : q.rot) - (part.r0 || 0)) * Math.PI / 180); // r0: ângulo da peça na arte original
      }
      var prof = n === 'head' && who === 'nutri' && pose.kiss > 0.2;   // no beijo a cabeça dela vira de perfil
      var elb = n === 'armF' && ELBOW[who] && M.parts.armF2, ex = 0, ey = 0;
      if (elb && WRIST[who]) {   // cotovelo redondo: disco na dobra desenhado ANTES dos dois pedaços do braço;
        // eles cobrem o miolo e só sobra a curva com contorno por fora (fecha o buraco quando o braço dobra)
        var wr = WRIST[who], f2 = M.parts.armF2, q2 = pose.armF2 || {};
        ex = (f2.at[0] - part.at[0]) * k + (q2.dx || 0); ey = (f2.at[1] - part.at[1]) * k + (q2.dy || 0);
        c.fillStyle = '#1a1014'; c.beginPath(); c.arc(ex, ey, (wr[1] + 1.6) * k, 0, Math.PI * 2); c.fill();
        c.fillStyle = wr[0]; c.beginPath(); c.arc(ex, ey, wr[1] * k, 0, Math.PI * 2); c.fill();
      }
      if (n === 'head' && HEADS[who]) c.scale(HEADS[who], HEADS[who]);   // cabeça menor, presa no pescoço (proporção do Marcos)
      if (!prof) c.drawImage(img, part.x, part.y, part.w, part.h, -part.pivot[0] * k, -part.pivot[1] * k, part.w * k, part.h * k);
      if (n === 'torso' && pose.guitar) drawGuitar(c, pose.guitar);
      if (n === 'torso' && pose.keys) drawKeys(c, pose.keys);
      if (n === 'torso' && pose.book) { c.save(); c.translate(pose.book.x, pose.book.y); c.rotate(-0.12); drawBook(c, true, pose.book.t); c.restore(); }
      if (n === (M.parts.armF2 ? 'armF2' : 'armF') && pose.prop) drawProp(c, who, pose.prop, k, n === 'armF2' ? M.parts : null, pose);
      var fo = o && o.boca != null ? o : window.Rig.falando && window.Rig.falando.who === who ? window.Rig.falando : null;   // quem está falando agora (culto)
      if (n === 'head' && fo && BOCA[who]) { c.save(); c.scale(k, k); c.translate(-part.pivot[0], -part.pivot[1]); falaFace(c, BOCA[who], fo.boca, fo.vogal, img, part); c.restore(); }
      if (n === 'head' && pose.scream) { c.save(); c.scale(k, k); c.translate(-part.pivot[0], -part.pivot[1]); screamFace(c, pose.scream); c.restore(); }
      if (n === 'head' && (pose.kiss || (o && o.mark))) {   // rosto desenhado por cima, em px da peça
        c.scale(k, k); c.translate(-part.pivot[0], -part.pivot[1]);
        if (who === 'nutri') { if (prof) profileHead(c, pose.kiss); } else { if (who === 'lutador') { c.translate(-12.7, -3.3); c.scale(0.857, 0.857); } markFace(c, o.mark); }   // cabeça nova do Marcos: bochechas em (37,91) e (97,91)
      }
      c.restore();
    });
    if (pose.obj && window.Objetos) { try { window.Objetos.draw(c, pose.obj.kind, t, pose.obj.x * k, pose.obj.y * k, pose.obj.rot || 0, 1); } catch (e) { /* objeto do codex com erro não derruba o boneco */ } }
    c.restore();
  }

  function ell(c, x, y, rx, ry, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
  // boca falando (apresentadores do culto), em px da peça da cabeça: x,y = centro da boca na arte, w/h = abertura máxima;
  // pele = arte que já é de boca aberta (Lucas gritando): fecha com os pixels do próprio bigode e do queixo,
  // que se afastam conforme a boca abre e revelam os dentes e a língua da arte original
  var BOCA = { bispo: { x: 86, y: 122, w: 11, h: 9 }, arthur: { x: 80, y: 101, w: 12, h: 8 },
    lucas: { pele: { x0: 50, x1: 81, top: 84, mid: 95, bot: 106, cima: [80, 84], baixo: [106, 110], min: 0.55 } } };   // Lucas fala gritando: nunca fecha de todo
  function falaFace(c, b, a, v, img, part) {
    a = Math.max(0, Math.min(1, a || 0));
    if (b.pele) {
      if (!img || !part) return;
      var p = b.pele; a = (p.min || 0) + (1 - (p.min || 0)) * a;
      var w = p.x1 - p.x0, hu = (p.mid - p.top) * (1 - a), hd = (p.bot - p.mid) * (1 - a);
      c.save(); c.imageSmoothingEnabled = true;   // esticar suave: vira barba contínua, sem faixas
      if (hu > 0.3) c.drawImage(img, part.x + p.x0, part.y + p.cima[0], w, p.cima[1] - p.cima[0], p.x0, p.top, w, hu);
      if (hd > 0.3) c.drawImage(img, part.x + p.x0, part.y + p.baixo[0], w, p.baixo[1] - p.baixo[0], p.x0, p.bot - hd, w, hd);
      if (a < 0.3) { c.fillStyle = '#3b1420'; c.fillRect(p.x0 + 4, p.top + hu - 0.5, w - 8, 1.2); }   // lábios se encontrando
      c.restore(); return;
    }
    if (a < 0.05) return;
    var rx = b.w * (v === 'o' || v === 'u' ? 0.62 : v === 'e' || v === 'i' ? 1 : 0.85), ry = b.h * a * (v === 'e' || v === 'i' ? 0.6 : 1), cy = b.y + ry * 0.35;
    ell(c, b.x, cy, rx + 1.5, ry + 1.5, '#7a2d2f');   // lábio
    ell(c, b.x, cy, rx, ry, '#2b0d12');                // fundo da boca
    c.save(); c.beginPath(); c.ellipse(b.x, cy, rx, ry, 0, 0, Math.PI * 2); c.clip();
    if (ry > 3) { c.fillStyle = '#f2ece4'; c.fillRect(b.x - rx, cy - ry, rx * 2, Math.min(3, ry * 0.4)); }   // dentes de cima
    ell(c, b.x, cy + ry * 0.75, rx * 0.6, ry * 0.45, '#c2565c');   // língua
    c.restore();
  }
  // Nutri de perfil no beijo (olhando para +x). Desenhada uma vez em px da arte (mesma densidade da peça
  // da cabeça) e guardada num canvas; coordenadas no espaço da peça 'head' (pivô do pescoço em ~111,136).
  var PROF = null, PROF_OX = 10, PROF_OY = 10;
  function profileCanvas() {
    if (PROF) return PROF;
    PROF = document.createElement('canvas'); PROF.width = 220; PROF.height = 210;
    var c = PROF.getContext('2d'); c.translate(PROF_OX, PROF_OY); c.lineJoin = 'round'; c.lineCap = 'round';
    var SK = '#ea9564', SKL = '#f6b183', SKS = '#c8703f', LN = '#4a2416', HAIR = '#1a1b2b', HD = '#0d0d16', HL = '#4a5d8c', HL2 = '#7f93c4';
    function P(pts, close) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 6) c.bezierCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], pts[i + 4], pts[i + 5]); if (close !== false) c.closePath(); }
    function E(x, y, rx, ry, r, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, r || 0, 0, Math.PI * 2); c.fill(); }
    var skin = [100, 8, 140, 6, 166, 36, 166, 64, 166, 74, 164, 82, 166, 88, 169, 92, 173, 96, 172, 99, 171, 102, 168, 103, 166, 104,
      164, 118, 166, 124, 163, 128, 160, 133, 152, 137, 142, 137, 128, 137, 116, 132, 106, 124, 70, 140, 30, 110, 30, 70, 34, 30, 64, 10, 100, 8];
    var hairBack = [150, 30, 134, 0, 70, -6, 40, 16, 14, 38, 4, 80, 10, 116, 16, 140, 6, 166, 14, 190, 24, 200, 34, 194, 42, 188,
      50, 198, 62, 202, 72, 192, 82, 200, 96, 202, 104, 188, 110, 170, 104, 150, 104, 136, 100, 124, 96, 104, 100, 80, 106, 58, 124, 40, 150, 30];
    var bang = [58, 30, 86, 0, 148, 0, 166, 26, 174, 40, 174, 56, 168, 66, 162, 54, 154, 44, 146, 42, 146, 50, 142, 56, 136, 60,
      134, 50, 128, 40, 116, 36, 112, 44, 106, 50, 98, 54, 94, 44, 80, 34, 58, 30];
    var lips = [166, 104, 170, 104, 175, 106, 175, 110, 175, 112, 172, 112.5, 172, 113, 175, 114, 175, 117, 173, 120, 170, 122, 166, 121, 164, 119];
    // 1. rosto; o cabelo de trás vem depois e cobre a nuca até atrás da orelha
    c.fillStyle = SK; c.strokeStyle = LN; c.lineWidth = 2.4; P(skin); c.fill(); c.stroke();
    c.save(); P(skin); c.clip();
    var cg = c.createRadialGradient(146, 108, 2, 146, 108, 22); cg.addColorStop(0, SKL); cg.addColorStop(1, 'rgba(246,177,131,0)');
    c.fillStyle = cg; c.fillRect(120, 84, 52, 48);                          // luz na bochecha redonda
    c.translate(-2, 7); c.fillStyle = SKS; c.globalAlpha = 0.5; P(bang); c.fill();   // sombra da franja na testa
    c.restore(); c.globalAlpha = 1;
    var g = c.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, HAIR); g.addColorStop(1, HD);
    c.fillStyle = g; P(hairBack); c.fill(); c.strokeStyle = HD; c.lineWidth = 3; c.stroke();
    // 2. pescoço com a sombra do queixo
    c.fillStyle = SK; c.strokeStyle = LN; c.lineWidth = 2.4;
    var neck = [108, 122, 110, 136, 110, 150, 108, 160, 120, 162, 132, 162, 136, 156, 132, 146, 130, 136, 108, 122];
    P(neck); c.fill(); c.stroke();
    c.save(); P(neck); c.clip(); var ng = c.createLinearGradient(0, 124, 0, 150); ng.addColorStop(0, SKS); ng.addColorStop(1, 'rgba(200,112,63,0)');
    c.fillStyle = ng; c.fillRect(100, 118, 40, 34); c.restore();
    c.globalAlpha = 0.5; E(146, 108, 10, 6, 0, '#ff6b8e'); c.globalAlpha = 1;   // bochecha corada
    // 3. biquinho
    c.fillStyle = '#d94468'; c.strokeStyle = '#5e1224'; c.lineWidth = 2; P(lips, false); c.fill(); c.stroke();
    c.lineWidth = 1.6; c.beginPath(); c.moveTo(166.5, 112.5); c.lineTo(173, 112.5); c.stroke();
    E(171, 108, 2.6, 1.2, -0.2, '#ff9fb6'); E(170.5, 116, 2.2, 1, 0.2, '#ff8aa6');
    // 4. olho fechado, pálpebra, cílios e sobrancelha
    c.strokeStyle = '#1c0f12'; c.lineWidth = 3.4;
    c.beginPath(); c.moveTo(138, 86); c.quadraticCurveTo(149, 95, 160, 87); c.stroke();
    c.lineWidth = 2.2;
    [[159, 87.5, 166, 83], [156, 90, 163, 90.5], [160.5, 86, 168, 87]].forEach(function (l) { c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(l[2], l[3]); c.stroke(); });
    c.strokeStyle = SKS; c.lineWidth = 1.6; c.beginPath(); c.moveTo(141, 79); c.quadraticCurveTo(150, 76, 158, 79); c.stroke();
    c.strokeStyle = '#2a1510'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(137, 69); c.quadraticCurveTo(150, 62, 162, 67); c.stroke();
    // 5. orelha e brinco
    c.fillStyle = SK; c.strokeStyle = LN; c.lineWidth = 2.2;
    c.beginPath(); c.ellipse(108, 98, 7.5, 11, 0.1, 0, Math.PI * 2); c.fill(); c.stroke();
    c.strokeStyle = SKS; c.lineWidth = 1.8; c.beginPath(); c.arc(109, 98, 4.2, -1.3, 1.4); c.stroke();
    c.strokeStyle = '#b8862a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(108, 108.5); c.lineTo(108, 112); c.stroke();
    E(108, 115.5, 3.8, 3.8, 0, '#f2c46a'); c.strokeStyle = '#7a5410'; c.lineWidth = 1.4; c.beginPath(); c.arc(108, 115.5, 3.8, 0, Math.PI * 2); c.stroke();
    E(107, 114.2, 1.4, 1.1, 0, '#fff4c8');
    // 6. franja em mechas varrida para a frente
    c.fillStyle = HAIR; P(bang); c.fill(); c.strokeStyle = HD; c.lineWidth = 2.6; c.stroke();
    // 7. brilho do cabelo: anel no topo e fios
    c.strokeStyle = HL; c.lineWidth = 5; c.globalAlpha = 0.9;
    c.beginPath(); c.moveTo(56, 34); c.quadraticCurveTo(96, 6, 144, 18); c.stroke();
    c.strokeStyle = HL2; c.lineWidth = 2; c.beginPath(); c.moveTo(74, 24); c.quadraticCurveTo(100, 12, 128, 15); c.stroke();
    c.strokeStyle = HL; c.lineWidth = 1.8; c.globalAlpha = 0.7;
    [[34, 50, 22, 110, 28, 180], [52, 56, 42, 120, 50, 190], [74, 64, 68, 130, 76, 194], [92, 70, 90, 120, 96, 186],
     [146, 14, 164, 30, 166, 52], [120, 10, 144, 24, 150, 44]].forEach(function (q) {
      c.beginPath(); c.moveTo(q[0], q[1]); c.quadraticCurveTo(q[2], q[3], q[4], q[5]); c.stroke(); });
    c.strokeStyle = HD; c.lineWidth = 2.2; c.globalAlpha = 0.9;          // fios escuros dão volume
    [[24, 70, 16, 130, 20, 186], [44, 76, 34, 140, 40, 184], [64, 84, 58, 150, 66, 196], [84, 90, 82, 150, 88, 198]].forEach(function (q) {
      c.beginPath(); c.moveTo(q[0], q[1]); c.quadraticCurveTo(q[2], q[3], q[4], q[5]); c.stroke(); });
    c.globalAlpha = 1;
    return PROF;
  }
  function profileHead(c, a) {
    var turn = Math.min(1, (a - 0.2) / 0.25);
    c.save(); c.translate(110, 0); c.scale(0.75 + 0.25 * turn, 1); c.translate(-110, 0);   // gira: abre de lado
    c.imageSmoothingEnabled = true; c.drawImage(profileCanvas(), -PROF_OX, -PROF_OY);
    c.restore();
  }
  // Lutador depois do beijo: cora e fica com a marca de batom na bochecha da frente
  function markFace(c, m) {
    c.save(); c.globalAlpha = Math.min(1, m) * 0.55;
    ell(c, 58, 110, 11, 6, '#ff6f8f'); ell(c, 128, 110, 11, 6, '#ff6f8f');
    c.globalAlpha = Math.min(1, m * 2);
    c.translate(128, 110); c.rotate(-0.35); c.scale(1.6, 1.6);
    ell(c, -3.5, -2, 5, 3, '#e0306a'); ell(c, 3.5, -2, 5, 3, '#e0306a'); ell(c, 0, 2.5, 7.5, 3.5, '#e0306a');
    c.fillStyle = '#7a0f30'; c.fillRect(-7, -0.3, 14, 1.2);
    c.restore();
  }
  function drawItem(c, kind, x, y, rot, scale) {
    if (kind === 'cola') {   // bolota de cola quente: gota redonda e brilhante, com dois respingos (sem rabo)
      c.save(); c.translate(x, y); var sc3 = scale || 1; c.scale(sc3, sc3);
      c.fillStyle = '#3a2a10'; c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(0, 0, 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f2c95a'; c.beginPath(); c.arc(0.8, 1, 2.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff'; c.fillRect(-2.6, -2.6, 2, 1.6);
      c.fillStyle = '#3a2a10'; c.beginPath(); c.arc(-6, -3, 1.8, 0, Math.PI * 2); c.arc(-7, 2.5, 1.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(-6, -3, 1.1, 0, Math.PI * 2); c.arc(-7, 2.5, 0.9, 0, Math.PI * 2); c.fill();
      c.restore(); return true;
    }
    if ((kind === 'crash' || kind === 'ride' || kind === 'drone' || kind === 'clave_sol' || kind === 'clave_fa' || kind === 'cavaquinho' || kind === 'bolo' || kind === 'micreia') && window.Objetos) {   // pratos do Rafinha e câmera voadora do Lohan (desenho do codex)
      window.Objetos.draw(c, kind, performance.now() / 1000, x, y, rot || 0, 1); return true;
    }
    if (kind === 'controle') {   // controle do Fidelis (recortado da arte dele)
      var ci = imgs.controle; if (!ci || !ci.naturalWidth) return false;
      c.save(); c.translate(x, y); if (rot) c.rotate(rot); var sc = (scale || 1) * 16 / ci.naturalWidth; c.scale(sc, sc);
      c.drawImage(ci, -ci.naturalWidth / 2, -ci.naturalHeight / 2); c.restore(); return true;
    }
    if (kind === 'biblia') {   // Bíblia de capa preta, cruz e beirada das páginas douradas
      c.save(); c.translate(x, y); if (rot) c.rotate(rot); var sb = scale || 1; c.scale(sb, sb);
      c.fillStyle = '#0c0a10'; c.fillRect(-7, -5.5, 14, 11);
      c.fillStyle = '#26232f'; c.fillRect(-6.5, -5, 13, 10); c.fillStyle = '#3a3646'; c.fillRect(-6.5, -5, 13, 1.4);
      c.fillStyle = '#e8c25a'; c.fillRect(-6.5, 3.4, 13, 1.2); c.fillRect(5.2, -4.4, 1.2, 8.6);
      c.fillRect(-0.6, -3.6, 1.2, 6); c.fillRect(-2.2, -2.2, 4.4, 1.1);
      c.restore(); return true;
    }
    if (kind === 'fogo') {   // bola de fogo caindo do céu: +x local aponta para onde ela vai, rastro de chama para trás
      c.save(); c.translate(x, y); if (rot) c.rotate(rot); var sf = scale || 1; c.scale(sf, sf);
      var fl = Math.floor(performance.now() / 70) % 2;
      c.fillStyle = 'rgba(255,80,20,0.4)'; c.beginPath(); c.moveTo(-28 - fl * 3, 0); c.quadraticCurveTo(-8, -10, 4, -8); c.lineTo(4, 8); c.quadraticCurveTo(-8, 10, -28 - fl * 3, 0); c.fill();
      c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(-19 + fl * 2, 0); c.quadraticCurveTo(-6, -7, 3, -5.5); c.lineTo(3, 5.5); c.quadraticCurveTo(-6, 7, -19 + fl * 2, 0); c.fill();
      c.fillStyle = '#ffd23b'; c.beginPath(); c.moveTo(-10, 0); c.quadraticCurveTo(-3, -3.5, 2, -3); c.lineTo(2, 3); c.quadraticCurveTo(-3, 3.5, -10, 0); c.fill();
      c.fillStyle = '#3a0a06'; c.beginPath(); c.arc(0, 0, 6.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ff4d1a'; c.beginPath(); c.arc(0, 0, 5.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffb340'; c.beginPath(); c.arc(1, -0.6, 3.9, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(1.8, -1.2, 2, 0, Math.PI * 2); c.fill();
      c.restore(); return true;
    }
    if (kind === 'brasa') {   // brasa da explosão
      c.save(); c.translate(x, y); var sr = scale || 1; c.scale(sr, sr);
      c.fillStyle = '#ff6a1a'; c.fillRect(-2, -2, 4, 4); c.fillStyle = '#ffe066'; c.fillRect(-1, -1, 2, 2);
      c.restore(); return true;
    }
    if (kind === 'mic') { c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale((scale || 1) * 1.5, (scale || 1) * 1.5); drawMic(c); c.restore(); return true; }
    if (kind === 'seminima') {   // nota musical (semínima) colorida com contorno
      c.save(); c.translate(x, y); var sc2 = scale || 1; c.scale(sc2, sc2);
      c.fillStyle = '#120a1a'; c.beginPath(); c.ellipse(-1.5, 3, 4.4, 3.4, -0.45, 0, Math.PI * 2); c.fill(); c.fillRect(1.2, -8.6, 2.6, 12);
      c.fillStyle = '#ffe066'; c.beginPath(); c.ellipse(-1.5, 3, 3.3, 2.3, -0.45, 0, Math.PI * 2); c.fill(); c.fillRect(1.8, -8, 1.4, 10.6);
      c.fillStyle = '#fff6c0'; c.fillRect(-3.2, 1.6, 1.6, 1);
      c.restore(); return true;
    }
    if (kind === 'lapis' || kind === 'borracha' || kind === 'caneta' || kind === 'basquete') {
      c.save(); c.translate(x, y); if (rot) c.rotate(rot); var sc = scale || 1; c.scale(sc, sc);
      if (kind === 'lapis') {                                                      // lápis amarelo apontado para +x
        c.fillStyle = '#2a1a10'; c.fillRect(-8, -2, 13, 4); c.beginPath(); c.moveTo(5, -2); c.lineTo(9.5, 0); c.lineTo(5, 2); c.fill();
        c.fillStyle = '#f5c518'; c.fillRect(-6, -1.4, 11, 2.8); c.fillStyle = '#ffe36b'; c.fillRect(-6, -1.4, 11, 0.9);
        c.fillStyle = '#c9cdd4'; c.fillRect(-7.2, -1.4, 1.4, 2.8); c.fillStyle = '#f08aa8'; c.fillRect(-7.6, -1.3, 0.9, 2.6);
        c.fillStyle = '#f2d2a2'; c.beginPath(); c.moveTo(5, -1.4); c.lineTo(8.4, 0); c.lineTo(5, 1.4); c.fill();
        c.fillStyle = '#333'; c.fillRect(7.6, -0.4, 1.2, 0.8);
      } else if (kind === 'basquete') {                                           // bola laranja com gomos pretos
        c.fillStyle = '#1a0e08'; c.beginPath(); c.arc(0, 0, 6.2, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#e8741e'; c.beginPath(); c.arc(0, 0, 5.4, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#f7a04a'; c.beginPath(); c.arc(-1.8, -1.8, 2.2, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#1a0e08'; c.lineWidth = 0.7;
        c.beginPath(); c.moveTo(-5.4, 0); c.lineTo(5.4, 0); c.moveTo(0, -5.4); c.lineTo(0, 5.4); c.stroke();
        c.beginPath(); c.arc(-6.5, 0, 4.6, -0.9, 0.9); c.stroke(); c.beginPath(); c.arc(6.5, 0, 4.6, Math.PI - 0.9, Math.PI + 0.9); c.stroke();
      } else if (kind === 'caneta') {                                             // caneta azul de tampa
        c.fillStyle = '#10142a'; c.fillRect(-8.5, -1.9, 15, 3.8); c.beginPath(); c.moveTo(6.5, -1.6); c.lineTo(9.5, 0); c.lineTo(6.5, 1.6); c.fill();
        c.fillStyle = '#e8eef8'; c.fillRect(-4, -1.3, 10.5, 2.6); c.fillStyle = 'rgba(120,150,200,0.6)'; c.fillRect(-4, 0.4, 10.5, 0.9);
        c.fillStyle = '#2a5bd8'; c.fillRect(-8, -1.3, 4.6, 2.6); c.fillRect(-7, -2.6, 4, 1.2);                         // tampa e clipe
        c.fillStyle = '#c9cdd4'; c.beginPath(); c.moveTo(6.5, -1.2); c.lineTo(8.8, 0); c.lineTo(6.5, 1.2); c.fill();
        c.fillStyle = '#2a5bd8'; c.fillRect(8.2, -0.4, 1, 0.8);
      } else {                                                                    // borracha rosa e azul
        c.fillStyle = '#2a1a22'; c.fillRect(-4.6, -3, 9.2, 6); c.fillStyle = '#ff8fb0'; c.fillRect(-4, -2.4, 4.4, 4.8);
        c.fillStyle = '#4a8ce0'; c.fillRect(0.4, -2.4, 3.6, 4.8); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(-4, -2.4, 8, 1);
      }
      c.restore(); return true;
    }
    var m = ITENS[kind] || ITENS[ALIAS[kind]], img = imgs.itens;
    if (!m || !img.complete || !img.naturalWidth) return false;
    var w = m.w / 4 * (scale || 1), h = m.h / 4 * (scale || 1);
    c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.imageSmoothingEnabled = true;
    c.drawImage(img, m.x, m.y, m.w, m.h, -w / 2, -h / 2, w, h); c.restore();
    return true;
  }

  function enemyPose(state, t) {
    var q = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, alpha: 1 }, e;
    if (state === 'walk') {
      var w = t * 9;
      q.dy = -Math.abs(Math.sin(w)) * 2.5; q.rot = Math.sin(w) * 5; q.sy = 1 - 0.07 * Math.abs(Math.cos(w)); q.sx = 2 - q.sy;
    } else if (state === 'attack') {
      if (t < 0.35) { e = ease(t / 0.35); q.rot = -10 * e; q.sx = 1 - 0.08 * e; q.sy = 1 + 0.08 * e; q.dx = -2 * e; }
      else { e = bell(t, 0.35, 0.42, 0.52, 0.7); q.rot = 12 * e; q.sx = 1 + 0.18 * e; q.sy = 1 - 0.12 * e; q.dx = 5 * e; }
    } else if (state === 'hurt') {
      q.rot = -12; q.dx = Math.sin(t * 60) * 1.2; q.sy = 0.94; q.sx = 1.05;
    } else if (state === 'ko') {
      e = ease(t / 0.35); q.rot = -80 * e; q.sy = 1 - 0.25 * e; q.alpha = t > 0.5 ? Math.max(0, 1 - (t - 0.5) * 2.5) : 1;
    } else {
      q.sy = 1 + 0.04 * Math.sin(t * 4); q.sx = 1 - 0.03 * Math.sin(t * 4);
    }
    return q;
  }

  // ---------- Gatinho de rua (laranja rajado e branco), desenhado em peças na densidade da arte ----------
  // Coordenadas em px do gato olhando para a direita; pés em (70,130). CAT_S converte px em unidades do jogo.
  var CAT_S = 0.2, CATC = null;
  var C_OR = '#ec9a45', C_ORD = '#c4682a', C_STR = '#a8521c', C_WH = '#fff6ea', C_WHS = '#e6d2bb', C_LN = '#3a2214', C_PK = '#f59ab0';
  function catPart(draw) {
    var cv = document.createElement('canvas'); cv.width = 170; cv.height = 160;
    var c = cv.getContext('2d'); c.translate(10, 10); c.lineJoin = 'round'; c.lineCap = 'round'; draw(c); return cv;
  }
  function cP(c, pts) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 6) c.bezierCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], pts[i + 4], pts[i + 5]); c.closePath(); }
  function cE(c, x, y, rx, ry, col, line, r) { c.beginPath(); c.ellipse(x, y, rx, ry, r || 0, 0, Math.PI * 2); if (col) { c.fillStyle = col; c.fill(); } if (line) { c.strokeStyle = C_LN; c.lineWidth = line; c.stroke(); } }
  function cL(c, col, w, segs) { c.strokeStyle = col; c.lineWidth = w; segs.forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); if (q.length > 4) c.quadraticCurveTo(q[2], q[3], q[4], q[5]); else c.lineTo(q[2], q[3]); c.stroke(); }); }
  function catParts() {
    if (CATC) return CATC;
    CATC = {};
    CATC.tail = catPart(function (c) {
      var tp = function () { c.beginPath(); c.moveTo(38, 124); c.bezierCurveTo(8, 128, 0, 96, 16, 80); };
      tp(); c.strokeStyle = C_LN; c.lineWidth = 14; c.stroke();
      tp(); c.strokeStyle = C_OR; c.lineWidth = 9; c.stroke();
      cL(c, C_STR, 4, [[28, 120, 26, 128], [15, 112, 9, 117], [8, 100, 3, 101], [9, 88, 4, 85]]);
      cE(c, 16, 80, 4, 4, C_WH);
    });
    CATC.body = catPart(function (c) {
      var body = [34, 130, 22, 112, 26, 84, 48, 70, 62, 60, 86, 62, 96, 76, 104, 92, 102, 114, 100, 130];
      cP(c, body); c.fillStyle = C_OR; c.fill(); c.strokeStyle = C_LN; c.lineWidth = 3; c.stroke();
      c.save(); cP(c, body); c.clip();
      cP(c, [72, 70, 92, 68, 104, 88, 102, 130, 90, 132, 80, 132, 74, 130, 76, 110, 66, 86, 72, 70]); c.fillStyle = C_WH; c.fill();   // peito branco
      cE(c, 50, 106, 22, 22, C_OR); c.strokeStyle = C_ORD; c.lineWidth = 2.5; c.beginPath(); c.arc(50, 106, 22, Math.PI * 1.05, Math.PI * 1.9); c.stroke();  // coxa
      cL(c, C_STR, 3.5, [[46, 72, 42, 84], [56, 66, 54, 78], [34, 92, 46, 98], [31, 106, 44, 110], [36, 120, 46, 121]]);
      c.globalAlpha = 0.35; cE(c, 86, 120, 14, 10, C_WHS); c.globalAlpha = 1;
      c.restore();
      cE(c, 40, 129, 13, 5, C_WH, 2);                                              // pata de trás
      [[81, 76], [93, 88]].forEach(function (l) {                                   // patas da frente
        c.fillStyle = C_WH; c.strokeStyle = C_LN; c.lineWidth = 2;
        c.beginPath(); c.moveTo(l[0] - 5, 98); c.lineTo(l[0] - 5, 126); c.quadraticCurveTo(l[0], 132, l[0] + 5, 126); c.lineTo(l[0] + 5, 98); c.fill(); c.stroke();
        cE(c, l[0], 128.5, 7, 4, C_WH, 2);
        cL(c, C_WHS, 1.4, [[l[0] - 2, 126, l[0] - 2, 130], [l[0] + 2, 126, l[0] + 2, 130]]);
      });
    });
    function head(eyes) {
      return catPart(function (c) {
        [[62, 36, 62, 4, 86, 24], [88, 22, 108, 4, 112, 36]].forEach(function (e) {   // orelhas
          c.beginPath(); c.moveTo(e[0], e[1]); c.quadraticCurveTo(e[2] - 2, e[3] + 10, e[2], e[3]); c.quadraticCurveTo(e[2] + 6, e[3] + 10, e[4], e[5]); c.closePath();
          c.fillStyle = C_OR; c.fill(); c.strokeStyle = C_LN; c.lineWidth = 3; c.stroke();
          c.beginPath(); c.moveTo(e[0] + 5, e[1] - 4); c.lineTo(e[2], e[3] + 7); c.lineTo(e[4] - 5, e[5] + 2); c.closePath(); c.fillStyle = C_PK; c.fill();
        });
        var hd = [54, 48, 52, 28, 70, 20, 86, 20, 104, 20, 118, 28, 116, 48, 120, 52, 116, 56, 114, 58, 110, 70, 98, 74, 86, 74, 72, 74, 60, 70, 56, 58, 50, 56, 52, 52, 54, 48];
        cP(c, hd); c.fillStyle = C_OR; c.fill(); c.strokeStyle = C_LN; c.lineWidth = 3; c.stroke();
        c.save(); cP(c, hd); c.clip();
        cE(c, 86, 62, 18, 12, C_WH); cE(c, 86, 74, 12, 6, C_WH);                    // focinho e queixo brancos
        cL(c, C_STR, 3, [[78, 21, 79, 30], [86, 20, 86, 29], [94, 21, 93, 30], [54, 42, 64, 45], [55, 49, 63, 50], [118, 42, 108, 45], [117, 49, 109, 50]]);
        c.restore();
        c.globalAlpha = 0.45; cE(c, 68, 58, 6, 3.5, C_PK); cE(c, 104, 58, 6, 3.5, C_PK); c.globalAlpha = 1;
        if (eyes === 'open') {
          [[73, 45], [99, 45]].forEach(function (e) {
            cE(c, e[0], e[1], 6.5, 7.5, '#8ad25e', 2.2); cE(c, e[0], e[1] + 1, 2.4, 5.5, '#141016');
            cE(c, e[0] - 2, e[1] - 3, 2.2, 2.2, '#ffffff'); cE(c, e[0] + 2.5, e[1] + 3, 1, 1, '#ffffff');
          });
        } else {
          cL(c, C_LN, 2.6, [[67, 47, 73, 41, 79, 47], [93, 47, 99, 41, 105, 47]]);   // olhinhos fechados ^ ^
        }
        c.beginPath(); c.moveTo(82.5, 56); c.lineTo(89.5, 56); c.lineTo(86, 60); c.closePath(); c.fillStyle = C_PK; c.fill(); c.strokeStyle = C_LN; c.lineWidth = 1.5; c.stroke();
        cL(c, C_LN, 1.6, [[86, 60, 86, 62.5], [86, 62.5, 84, 65, 81, 63.5], [86, 62.5, 88, 65, 91, 63.5]]);
        c.globalAlpha = 0.9; cL(c, '#fffaf0', 1.2, [[74, 59, 62, 55, 48, 55], [74, 62, 62, 62, 48, 64], [98, 59, 110, 55, 124, 55], [98, 62, 110, 62, 124, 64]]); c.globalAlpha = 1;
      });
    }
    CATC.headOpen = head('open'); CATC.headShut = head('shut');
    return CATC;
  }
  // mão fazendo carinho: dedos para +x local; antebraço vem de fora do quadro
  function petHand(c, x, y, ang, who, flip) {
    var SK = who === 'lutador' ? '#e3a582' : who === 'emanuelly' ? '#fbd8c8' : who === 'enzo' ? '#c47a52' : who === 'pedro' ? '#eeaa8c' : who === 'naju' ? '#c47a52' : who === 'grazi' ? '#f6ad8c' : who === 'bispo' ? '#da8662' : who === 'lohan' || who === 'rafinha' ? '#8a5236' : '#e48c5c', SKD = who === 'lutador' ? '#c27f5c' : who === 'emanuelly' ? '#d99c86' : who === 'enzo' ? '#94532f' : who === 'pedro' ? '#c07a5c' : who === 'naju' ? '#94532f' : who === 'grazi' ? '#d07f60' : who === 'bispo' ? '#b0603f' : who === 'lohan' || who === 'rafinha' ? '#5e3420' : '#b8703f';
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(0.85, flip ? -0.85 : 0.85); c.lineJoin = 'round'; c.lineCap = 'round';
    // braço de verdade: antebraço afinando até o punho e cotovelo dobrado (nada de cabo de vassoura)
    var E = [-44, 2], S = [-44 - 170 * Math.cos(0.6), 2 - 170 * Math.sin(0.6)], Wr = [-3, 0];
    function seg(a, b, wa, wb) {
      var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      c.beginPath(); c.moveTo(a[0] + nx * wa, a[1] + ny * wa); c.lineTo(b[0] + nx * wb, b[1] + ny * wb);
      c.lineTo(b[0] - nx * wb, b[1] - ny * wb); c.lineTo(a[0] - nx * wa, a[1] - ny * wa); c.closePath();
    }
    function shape(i) {   // 0 braço, 1 cotovelo, 2 antebraço
      if (i === 0) seg(S, E, 15, 11.5); else if (i === 2) seg(E, Wr, 11, 9); else { c.beginPath(); c.arc(E[0], E[1], 11.4, 0, Math.PI * 2); }
    }
    var lut = who === 'lutador', bare = who === 'emanuelly' || who === 'enzo' || who === 'pedro' || who === 'grazi' || who === 'lohan' || who === 'rafinha', cols = lut || bare ? [SK, SK, SK] : who === 'naju' ? ['#55555f', '#55555f', '#55555f'] : ['#f2f2f6', '#f2f2f6', '#f2f2f6'];
    c.fillStyle = C_LN; c.strokeStyle = C_LN; c.lineWidth = 5;
    for (var i = 0; i < 3; i++) { shape(i); c.fill(); c.stroke(); }
    for (i = 0; i < 3; i++) { shape(i); c.fillStyle = cols[i]; c.fill(); }
    if (lut) {
      c.save(); shape(0); c.clip(); c.fillStyle = '#2e2629'; c.translate(E[0], E[1]); c.rotate(0.6); c.fillRect(-200, -20, 170, 40); c.restore();   // manga curta escura
      cL(c, '#c27f5c', 1.6, [[E[0] + 6, E[1] - 6, E[0] + 9, E[1] - 1, E[0] + 6, E[1] + 5]]);
      c.save(); shape(2); c.clip(); c.fillStyle = '#c8202a'; c.fillRect(-24, -14, 24, 28); c.restore();       // bandagem vermelha
      cL(c, '#ef5050', 2.2, [[-21, -8, -17, 8], [-13, -8, -9, 8]]);
    } else if (bare) {                                                                // braço nu (vestido de alcinha)
      cL(c, SKD, 1.6, [[E[0] + 6, E[1] - 6, E[0] + 9, E[1] - 1, E[0] + 6, E[1] + 5]]);
    } else {
      cL(c, '#c9cad6', 1.8, [[E[0] - 4, E[1] - 8, E[0] + 1, E[1] - 2, E[0] - 3, E[1] + 6], [E[0] + 8, E[1] - 7, E[0] + 11, E[1], E[0] + 8, E[1] + 7]]);   // dobras da manga
      c.save(); shape(2); c.clip(); c.fillStyle = '#ffffff'; c.fillRect(-14, -12, 11, 24); c.restore();         // punho da camisa
      cL(c, '#c9cad6', 1.6, [[-14, -9, -14, 9]]);
    }
    // mão gordinha de chibi vista de lado, palma para baixo
    var m = [-4, -11, 6, -15, 20, -13, 27, -6, 31, -2, 31, 6, 25, 9, 16, 13, 4, 13, -4, 11];
    c.beginPath(); c.moveTo(m[0], m[1]); for (var k = 2; k < m.length; k += 6) c.bezierCurveTo(m[k], m[k + 1], m[k + 2], m[k + 3], m[k + 4], m[k + 5]); c.closePath();
    c.fillStyle = SK; c.fill(); c.strokeStyle = C_LN; c.lineWidth = 2.6; c.stroke();
    cL(c, SKD, 1.8, [[18, -8, 24, -4, 27, 2], [14, -3, 20, 1, 22, 7], [10, 3, 15, 6, 16, 11]]);   // dedos
    cE(c, 4, -14, 6, 4, SK, 2.2, -0.35);                                              // polegar
    c.globalAlpha = 0.35; cE(c, 10, -6, 6, 2.5, '#fff'); c.globalAlpha = 1;
    c.restore();
  }
  function drawCatRig(ctx, state, t, x, y, opts) {
    var P = catParts(), hands = opts && opts.hands;
    if (hands && hands.length) state = 'purr';
    var tailR = state === 'purr' ? -12 + Math.sin(t * 5) * 6 : state === 'lick' ? Math.sin(t * 1.5) * 8 : Math.sin(t * 2.2) * 12;
    var headR = state === 'purr' ? 9 + Math.sin(t * 34) * 0.7 : state === 'lick' ? 14 + Math.sin(t * 6) * 3 : Math.sin(t * 1.3) * 3;
    var shut = state === 'purr' || state === 'lick' || (t % 3.2) < 0.13;
    var breathe = 1 + 0.018 * Math.sin(t * 3), buzz = state === 'purr' ? Math.sin(t * 55) * 0.6 : 0;
    function part(cv, px, py, rot, sy) {
      ctx.save(); ctx.translate(px, py); if (rot) ctx.rotate(rot * Math.PI / 180); if (sy) ctx.scale(1, sy);
      ctx.drawImage(cv, -10 - px, -10 - py); ctx.restore();
    }
    ctx.save(); ctx.imageSmoothingEnabled = true;
    ctx.translate(x + buzz * CAT_S, y); ctx.scale(CAT_S, CAT_S); ctx.translate(-70, -130);
    part(P.tail, 38, 124, tailR);
    part(P.body, 70, 130, 0, breathe);
    ctx.save(); ctx.translate(0, (1 - breathe) * 60);
    part(shut ? P.headShut : P.headOpen, 82, 68, headR);
    if (state === 'lick') {                                                          // patinha levantada e linguinha
      var ly = 70 + Math.sin(t * 8) * 4;
      cE(ctx, 94, ly, 7, 5.5, C_WH, 2); cE(ctx, 92, 68, 2.5, 2, C_PK);
    }
    ctx.restore();
    (hands || []).forEach(function (h, i) {                                          // carinho: cabeça e costas
      var u = (1 - Math.cos(t * 6 + i * 1.7)) / 2;
      var slot = h.slot != null ? h.slot : h.from > 0 ? 1 : 0;
      if (slot === 1) petHand(ctx, 116 - 20 * u, 4 + 8 * u, Math.PI * 0.94, h.who, true);           // cabeça
      else if (slot === 2) petHand(ctx, 128 - 8 * u, 84 - 10 * u, Math.PI * 1.12, h.who, false);     // queixinho
      else if (slot === 3) petHand(ctx, 24 + 14 * u, 112 - 6 * u, -Math.PI * 0.12, h.who, false);   // barriguinha
      else petHand(ctx, 44 - 16 * u, 58 + 12 * u, Math.PI * 0.2, h.who);                           // costas
    });
    ctx.restore();
    return true;
  }

  // enquadramento do retrato: fx = centro do rosto na largura da cabeça, z = zoom, dy = sobe/desce
  var PORTRAIT = { cardoso: [0.5, 1, 0], duda: [0.5, 1, 0], lucas: [0.5, 1, 0], arthur: [0.5, 1, 0], fidelis: [0.5, 1, 0], douglas: [0.5, 1, 0], lohan: [0.5, 1, 0], rafinha: [0.5, 1, 0], bispo: [0.5, 1, 0], grazi: [0.5, 0.92, 0], nutri: [0.5, 0.88, 0], lutador: [0.55, 0.95, -3], emanuelly: [0.5, 1, 0], naju: [0.62, 1, 0], pedro: [0.53, 1, 0], enzo: [0.5, 1, 0] };
  window.Rig = {
    height: H,
    item: drawItem,
    cat: drawCatRig,
    hasEnemy: function (kind) { var i = imgs.inimigos; return !!(INIM[kind] && i.complete && i.naturalWidth); },
    // inimigo recortado com animação por transformação; pés em (x,y)
    enemy: function (ctx, kind, state, t, x, y, facing, opts) {
      if (!this.hasEnemy(kind) || kind === 'xtudo') return false;
      opts = opts || {};
      var m = INIM[kind], q = enemyPose(state, t || 0), w = m.w / 4, h = m.h / 4;
      if (!ebuf) { ebuf = document.createElement('canvas'); ebuf.width = ebuf.height = Math.round(EBOX * R); ebctx = ebuf.getContext('2d'); }
      if (ebuf.width !== Math.round(EBOX * R)) { ebuf.width = ebuf.height = Math.round(EBOX * R); }
      var c = ebctx;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, ebuf.width, ebuf.height);
      c.setTransform(R * (facing * m.face < 0 ? -1 : 1), 0, 0, R, ebuf.width / 2, ebuf.height * 0.8);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.translate(q.dx, q.dy); c.rotate(q.rot * Math.PI / 180); c.scale(q.sx, q.sy);
      c.drawImage(imgs.inimigos, m.x, m.y, m.w, m.h, -w / 2, -h, w, h);
      if (opts.flash) {
        c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop';
        c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(0, 0, ebuf.width, ebuf.height); c.globalCompositeOperation = 'source-over';
      }
      ctx.save(); ctx.globalAlpha *= q.alpha; ctx.imageSmoothingEnabled = true;
      ctx.drawImage(ebuf, x - EBOX / 2, y - EBOX * 0.8, EBOX, EBOX); ctx.restore();
      return true;
    },
    _gtr: GTR,
    ready: function (who) { var i = ensure(who); return !!(i && i.complete && i.naturalWidth); },
    setScale: function (r) { R = Math.max(1, r); buf = null; ebuf = null; },
    // mesmo contrato de Sprites.drawChibi: pés em (x,y), unidades lógicas
    draw: function (ctx, who, state, t, x, y, facing, opts) {
      if (!this.ready(who)) return false;
      opts = opts || {};
      if (!buf) { buf = document.createElement('canvas'); buf.width = buf.height = Math.round(BOX * R); bctx = buf.getContext('2d'); }
      bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, buf.width, buf.height);
      bctx.setTransform(R * (facing < 0 ? -1 : 1), 0, 0, R, buf.width / 2, buf.height * 0.75);
      bctx.imageSmoothingEnabled = true; bctx.imageSmoothingQuality = 'high';
      compose(bctx, who, state, t || 0, opts);
      if (opts.flash) {
        bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.globalCompositeOperation = 'source-atop';
        bctx.fillStyle = 'rgba(255,255,255,0.75)'; bctx.fillRect(0, 0, buf.width, buf.height);
        bctx.globalCompositeOperation = 'source-over';
      }
      ctx.save();
      if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(buf, x - BOX / 2, y - BOX * 0.75, BOX, BOX);
      ctx.restore();
      return true;
    },
    // corpo inteiro direto no ctx (nítido em qualquer escala), para o corte do especial
    big: function (ctx, who, state, t, x, y, facing, s, o) {   // o opcional: { boca: 0..1, vogal } para falar
      if (!this.ready(who)) return false;
      ctx.save(); ctx.translate(x, y); ctx.scale(s * (facing < 0 ? -1 : 1), s); ctx.imageSmoothingEnabled = true;
      compose(ctx, who, state, t || 0, o); ctx.restore();
      return true;
    },
    falando: null,   // { who, boca: 0..1, vogal }: as artes revisadas (Bispo) também leem daqui
    falaFace: function (c, b, a, v) { falaFace(c, b, a, v); },
    // retrato do HUD: cabeça recortada, 28x28 a partir do canto (x,y)
    portrait: function (ctx, who, x, y) {
      var n = portraitOrder.indexOf(who);
      if (n < 0 || !portraitSheet.complete || !portraitSheet.naturalWidth) return false;
      ctx.drawImage(portraitSheet,(n%5)*56,Math.floor(n/5)*56,56,56,x,y,28,28);
      return true;
    }
  };
}());
