/* Run with: node js/criancas.selftest.js */
'use strict';
const assert = require('node:assert/strict');
const canvases = [];
function context() {
  const c = { paints: 0, images: [], transforms: [], depth: 0, globalAlpha: 1 };
  for (const name of ['moveTo','lineTo','quadraticCurveTo','ellipse','translate','scale','rotate']) {
    c[name] = (...args) => {
      assert(args.every(Number.isFinite), `${name}: nonfinite coordinate`);
      if (name === 'translate' || name === 'scale' || name === 'rotate') c.transforms.push([name, ...args]);
    };
  }
  c.beginPath = c.closePath = () => {};
  c.fill = c.stroke = () => { c.paints++; };
  c.fillRect = (...args) => {
    assert(args.every(Number.isFinite), 'fillRect: nonfinite coordinate');
    c.paints++;
  };
  c.drawImage = (image, ...args) => {
    assert(image && image.width > 0 && image.height > 0, 'missing image');
    assert(args.every(Number.isFinite), 'drawImage: nonfinite coordinate');
    c.images.push(image); c.paints++;
  };
  c.save = () => { c.depth++; };
  c.restore = () => { assert(c.depth > 0, 'unbalanced restore'); c.depth--; };
  return c;
}
global.window = global;
global.document = { createElement(name) {
  assert.equal(name, 'canvas');
  const canvas = { width: 0, height: 0, ctx: context(), getContext(type) {
    assert.equal(type, '2d'); return this.ctx;
  } };
  canvases.push(canvas); return canvas;
} };
require('./criancas.js');
assert.equal(window.Criancas.count, 6);
for (let i = 0; i < 6; i++) {
  const poses = [];
  for (const t of [0, 0.11, 0.33, 0.7, 1.4, 3.25]) {
    for (const facing of [1, -1]) {
      for (const hit of [false, true]) {
        const out = context();
        assert.equal(window.Criancas.draw(out, i, t, 100, 200, facing, { hit }), true);
        assert.equal(out.images.length, 6, `child ${i}: missing body part`);
        assert(out.images.every(image => image.ctx.paints > 0), `child ${i}: empty body part`);
        assert(out.images.every(image => image.width === 32 || image.width === 84), 'not cached at 2x');
        assert.equal(out.depth, 0, `child ${i}: unbalanced context`);
        if (facing === -1) assert(out.transforms.some(v => v[0] === 'scale' && v[1] === -1), 'not mirrored');
        if (hit) assert(out.paints > 6, 'hit has no shine');
        poses.push(JSON.stringify(out.transforms));
      }
    }
  }
  assert(new Set(poses).size > 6, `child ${i}: running does not change with time`);
}
assert.equal(window.Criancas.draw(context(), -1, 0, 0, 0, 1), false);
assert.equal(window.Criancas.draw(context(), 6, 0, 0, 0, 1), false);
const before = canvases.length;
window.Criancas.draw(context(), 0, 0, 0, 0, 1);
assert.equal(canvases.length, before, 'parts were not cached');
process.stdout.write('OK: 6 crianças x 6 tempos x 2 direções x hit sim/não; peças 2x e cache verificados\n');
