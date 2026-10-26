/* Run with: node js/objetos.selftest.js */
'use strict';
const assert = require('node:assert/strict');
const kinds = ['crash','ride','drone','gimbal','clave_sol','clave_fa','cavaquinho','bolo','micreia'];
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
require('./objetos.js');
assert.deepEqual(window.Objetos.kinds, kinds);
for (const kind of kinds) {
  const poses = new Set();
  for (const t of [0, 0.06, 0.17, 0.42, 1.2, 2.8]) {
    for (const rot of [0, Math.PI / 4, -Math.PI / 2]) {
      for (const facing of [1,-1]) {
        const out = context();
        assert.equal(window.Objetos.draw(out, kind, t, 100, 200, rot, facing), true);
        assert(out.images.length >= 2, `${kind}: missing piece`);
        assert(out.images.every(image => image.ctx.paints > 0), `${kind}: empty piece`);
        assert(out.images.every(image => image.width % 2 === 0 && image.height % 2 === 0), `${kind}: not 2x`);
        assert.equal(out.depth, 0, `${kind}: unbalanced context`);
        assert(out.transforms.some(v => v[0] === 'rotate' && v[1] === rot), `${kind}: rot ignored`);
        if (facing === -1) assert(out.transforms.some(v => v[0] === 'scale' && v[1] === -1), `${kind}: facing ignored`);
        poses.add(JSON.stringify(out.transforms));
      }
    }
  }
  assert(poses.size > 10, `${kind}: animation does not change with time/rotation`);
}
assert.equal(window.Objetos.draw(context(), 'unknown', 0, 0, 0, 0, 1), false);
const before = canvases.length;
for (const kind of kinds) window.Objetos.draw(context(), kind, 0, 0, 0, 0, 1);
assert.equal(canvases.length, before, 'pieces were not reused from cache');
process.stdout.write('OK: 9 objetos x 6 tempos x 3 rotações x 2 direções; peças HD 2x e cache verificados\n');
