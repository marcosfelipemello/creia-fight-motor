// SegundaForma: desenha a cena inteira e a 2ª forma sem erro; nome novo só no Imperador; cresce e respira
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
const sandbox = { CreiaCombat: { segundaForma: { cena: 1.5 } }, document: { createElement: () => ({ width: 0, height: 0, getContext: fakeCtx }) } };
sandbox.window = sandbox;
vm.runInNewContext(fs.readFileSync(__dirname + '/../js/segunda-forma-visual.js', 'utf8'), sandbox);
const SF = sandbox.SegundaForma, ctx = fakeCtx();
assert(SF && SF.corpo && SF.fundo && SF.letreiro && SF.inicio, 'API completa');
const imp = { stage: 10, kind: 'emperor', name: 'O Imperador Podrão de Bangu', w: 120, h: 130, forma: 2, transT: 1.5 };
SF.inicio(imp);
assert.equal(imp.name, 'O Podrão Tamanho Família', 'Imperador ganha o nome da 2ª forma');
const outro = { stage: 8, kind: 'tower', name: 'A Torre de Salgadinhos', w: 90, h: 90, forma: 2, transT: 1.5 };
SF.inicio(outro);
assert.equal(outro.name, 'A Torre de Salgadinhos', 'a Torre não troca de nome (ela se divide)');
const pastel9 = { stage: 9, kind: 'pastel9', name: 'O Pastel Supremo' }; SF.inicio(pastel9); assert.equal(pastel9.name, 'O Pastel Supremo', 'o parceiro do Caldo de Cana mantém o nome');
const x = { stage: 1, kind: 'burger', name: 'O X-Tudo Furioso' }; SF.inicio(x); assert.equal(x.name, 'O X-Tudo Duplo Bacon');
let desenhos = 0; const desenhar = () => { desenhos++; };
for (let tr = 1.5; tr >= 0; tr -= 0.05) for (const b of [imp, outro]) {
  b.transT = tr;
  SF.fundo(ctx, 480, 270, b, 3); SF.corpo(ctx, b, 330, 236, desenhar, 3); SF.letreiro(ctx, 480, 270, b, 330, 236, 3); SF.letreiro(ctx, 480, 270, b, 100, 236, 3);
}
assert(desenhos > 0, 'desenha o chefe de verdade');
imp.transT = 1.5; assert(Math.abs(SF.escala(imp, 0) - 1) < 1e-9, 'começa no tamanho normal');
imp.transT = 0; const e = SF.escala(imp, 0); assert(e > 1.15 && e < 1.3, 'termina maior (tamanho família): ' + e);
console.log('segunda-forma-visual ok');
