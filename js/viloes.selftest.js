/* Run with: node js/viloes.selftest.js */
'use strict';
const assert = require('node:assert/strict');
const kinds = {
  pastel: [40,30], brigadeiro: [26,28], salsicha: [30,44], pipoca: [34,40],
  sorvete: [28,46], donut: [38,36], chips: [32,42], nugget: [26,26],
  milkshake: [30,48], pizzinha: [36,34], acucar: [30,30], bala: [28,24],
  churros: [22,50]
};
const canvases = [];
function context() {
  const c = { paints: 0, images: [], depth: 0, globalAlpha: 1 };
  for (const method of ['moveTo','lineTo','quadraticCurveTo','ellipse','translate','scale','rotate']) {
    c[method] = (...args) => {
      for (const n of args) assert(Number.isFinite(n), `${method}: nonfinite argument`);
    };
  }
  c.beginPath = c.closePath = () => {};
  c.fill = c.stroke = () => { c.paints++; };
  c.fillRect = (...args) => {
    for (const n of args) assert(Number.isFinite(n), 'fillRect: nonfinite argument');
    c.paints++;
  };
  c.drawImage = (image, ...args) => {
    assert(image && image.width > 0 && image.height > 0, 'empty image');
    for (const n of args) assert(Number.isFinite(n), 'drawImage: nonfinite argument');
    c.images.push({ image, args });
    c.paints++;
  };
  c.save = () => { c.depth++; };
  c.restore = () => { assert(c.depth > 0, 'unbalanced restore'); c.depth--; };
  return c;
}
global.window = global;
global.document = { createElement(name) {
  assert.equal(name, 'canvas');
  const canvas = { width: 0, height: 0, ctx: context(), getContext(type) {
    assert.equal(type, '2d');
    return this.ctx;
  } };
  canvases.push(canvas);
  return canvas;
} };
require('./viloes.js');
assert.deepEqual(Object.keys(window.Viloes).sort(), ['drawEnemy','enemySize']);
for (const [kind, [w,h]] of Object.entries(kinds)) {
  assert.deepEqual(window.Viloes.enemySize(kind), { w, h });
  for (const state of ['idle','walk','attack','hurt','ko']) {
    for (const t of [0, 0.13, 0.6, 1.4, 3.2]) {
      for (const facing of [1,-1]) {
        const out = context();
        const flash = t === 0.6;
        assert.equal(window.Viloes.drawEnemy(out, kind, state, t, 100, 200, facing, { flash }), true);
        assert(out.images.length >= 2, `${kind}/${state}: nothing drawn`);
        assert.equal(out.depth, 0, `${kind}/${state}: unbalanced context`);
        for (const {image} of out.images) assert(image.ctx.paints > 0, `${kind}/${state}: empty cached image`);
        assert.equal(out.images[0].image.width, w * 2);
        assert.equal(out.images[0].image.height, h * 2);
        assert.equal(out.images[1].image.width, w * 2);
        assert.equal(out.images[1].image.height, h * 2);
      }
    }
  }
}
assert.equal(window.Viloes.enemySize('missing'), null);
assert.equal(window.Viloes.drawEnemy(context(), 'missing', 'idle', 0, 0, 0, 1), false);
assert.equal(window.Viloes.enemySize('constructor'), null);
assert.equal(window.Viloes.drawEnemy(context(), 'constructor', 'idle', 0, 0, 0, 1), false);
const before = canvases.length;
window.Viloes.drawEnemy(context(), 'pastel', 'idle', 0, 0, 0, 1);
assert.equal(canvases.length, before, 'cache did not reuse art');
assert(canvases.some(c => c.ctx.globalCompositeOperation === 'source-in'), 'flash has no white mask');
process.stdout.write(`OK: ${Object.keys(kinds).length} kinds x 5 states x 5 times x 2 directions; ${canvases.length} HD cached parts\n`);
