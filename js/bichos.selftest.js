/* Run with: node js/bichos.selftest.js */
'use strict';
const assert = require('node:assert/strict');
const kinds = ['rato', 'barata', 'cachorro'];
const canvases = [];
function context() {
  const c = { paints: 0, images: [], transforms: [], depth: 0, globalAlpha: 1 };
  for (const name of ['moveTo','lineTo','quadraticCurveTo','ellipse','translate','scale','rotate']) {
    c[name] = (...args) => {
      assert(args.every(Number.isFinite), `${name}: nonfinite argument`);
      if (['translate','scale','rotate'].includes(name)) c.transforms.push([name, ...args]);
    };
  }
  c.beginPath = c.closePath = () => {};
  c.fill = c.stroke = () => { c.paints++; };
  c.fillRect = (...args) => {
    assert(args.every(Number.isFinite), 'fillRect: nonfinite argument'); c.paints++;
  };
  c.drawImage = (image, ...args) => {
    assert(image && image.width > 0 && image.height > 0, 'missing image');
    assert(args.every(Number.isFinite), 'drawImage: nonfinite argument');
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
require('./bichos.js');
assert.deepEqual(window.Bichos.kinds, kinds);
for (const kind of kinds) {
  const poses = [];
  for (const t of [0, 0.07, 0.21, 0.5, 1.1, 2.6]) {
    for (const facing of [1,-1]) {
      const out = context();
      assert.equal(window.Bichos.draw(out, kind, t, 100, 200, facing), true);
      assert(out.images.length >= 6, `${kind}: missing animated part`);
      assert(out.images.every(image => image.ctx.paints > 0), `${kind}: empty part`);
      assert(out.images.every(image => image.width % 2 === 0 && image.height % 2 === 0), `${kind}: not cached at 2x`);
      assert.equal(out.depth, 0, `${kind}: unbalanced context`);
      if (facing === -1) assert(out.transforms.some(v => v[0] === 'scale' && v[1] === -1), `${kind}: no mirror`);
      poses.push(JSON.stringify(out.transforms));
    }
  }
  assert(new Set(poses).size > 6, `${kind}: no animation over time`);
}
assert.equal(window.Bichos.draw(context(), 'pneu', 0, 0, 0, 1), false);
const before = canvases.length;
for (const kind of kinds) window.Bichos.draw(context(), kind, 0, 0, 0, 1);
assert.equal(canvases.length, before, 'parts were not reused from cache');
process.stdout.write('OK: 3 bichos x 6 tempos x 2 direções; partes HD 2x e cache verificados\n');
