// EscaladaVisual: as 4 telas desenham sem erro em todos os degraus, com e sem arte carregada
const assert = require('assert'), fs = require('fs'), vm = require('vm');
function fakeCtx() {
  const grad = { addColorStop() {} };
  return new Proxy({}, { get(o, k) {
    if (k in o) return o[k];
    if (k === 'measureText') return s => ({ width: String(s).length * 6 });
    if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad;
    return () => {};
  }, set(o, k, v) { o[k] = v; return true; } });
}
const sandbox = { document: { createElement: () => ({ width: 0, height: 0, getContext: fakeCtx }) } };
sandbox.window = sandbox;
vm.runInNewContext(fs.readFileSync(__dirname + '/../js/escalada-visual.js', 'utf8'), sandbox);
const E = sandbox.EscaladaVisual, ctx = fakeCtx();
assert(E && E.torre && E.subida && E.campeao && E.derrota, 'API completa');
const lista = Array.from({ length: 19 }, (_, i) => 'r' + i);
let chamadas = 0; const big = () => { chamadas++; return true; };
for (let d = 0; d <= 19; d++) for (const t of [0, 0.3, 0.8, 1.2, 3]) {
  E.torre(ctx, 480, 270, { lista, degrau: d, t, lutador: 'eu', nomes: {}, big, cenario: g => {}, cenarioNome: 'X', recorde: d, pronto: d % 2 === 0, quit: d === 3 });
  if (d) E.subida(ctx, 480, 270, { lista, degrau: d, t, lutador: 'eu', nomes: {}, big });
  E.derrota(ctx, 480, 270, { degrau: d, t, who: 'eu', nome: 'EU', recorde: 5, big });
}
for (const t of [0, 0.2, 0.5, 2, 6]) E.campeao(ctx, 480, 270, { who: 'eu', t, nome: 'EU', big });
assert(chamadas > 0, 'desenha os lutadores pelo big()');
E.torre(ctx, 480, 270, {}); E.subida(ctx, 480, 270, {}); E.campeao(ctx, 480, 270, {}); E.derrota(ctx, 480, 270, {});   // sem arte nenhuma
console.log('escalada-visual ok');
