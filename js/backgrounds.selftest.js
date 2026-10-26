/* Run with: node js/backgrounds.selftest.js */
'use strict';
const assert = require('node:assert/strict');

const expectedPlaces = [
  'Praça Guilherme da Silveira', 'Calçadão de Bangu', 'Largo de Bangu',
  'Fábrica / Bangu Shopping', 'Estádio de Moça Bonita', 'Feira livre',
  'Plataforma do trem', 'Rua Bela Flor', 'Serra do Mendanha', 'Bangu à noite'
];
let canvases = 0;

class Canvas {
  constructor() { this._width = 0; this._height = 0; this.ctx = null; canvases++; }
  get width() { return this._width; }
  set width(value) { this._width = value; this.ctx = null; }
  get height() { return this._height; }
  set height(value) { this._height = value; this.ctx = null; }
  getContext(type) {
    assert.equal(type, '2d');
    if (!this.ctx) this.ctx = new Context(this);
    return this.ctx;
  }
}
class Context {
  constructor(canvas) {
    this.canvas = canvas; this.sx = 1; this.sy = 1;
    this.imageSmoothingEnabled = true; this.fillStyle = '#000000';
    this.globalAlpha = 1; this.shapeHash = 2166136261;
    this.ground = false;
  }
  scale(x, y) { this.sx *= x; this.sy *= y; }
  fillRect(x, y, w, h) {
    for (const n of [x, y, w, h]) assert(Number.isFinite(n), 'nonfinite pixel rect');
    assert(w >= 0 && h >= 0, 'negative pixel rect');
    if (x === 0 && y === 170 && w >= 3000 && h >= 3) this.ground = true;
    for (const n of [x, y, w, h]) {
      this.shapeHash = Math.imul(this.shapeHash ^ Math.round(n * 2), 16777619) >>> 0;
    }
  }
  fillText() { throw new Error('scene used system font'); }
}

global.window = global;
global.document = { createElement(kind) {
  assert.equal(kind, 'canvas');
  return new Canvas();
} };
require('./backgrounds.js');

assert.deepEqual(window.Backgrounds.places, expectedPlaces);
assert.equal(new Set(window.Backgrounds.places).size, 10, 'places must be unique');
assert.equal(typeof window.Backgrounds.drawFront, 'function');
const signatures = new Set();
for (let stage = 1; stage <= 10; stage++) {
  let sceneSignature;
  for (const camX of [0, 1, 119, 480, 1199, 1200, 1201, 1800, 2519, 2520]) {
    const calls = [];
    const ctx = {
      imageSmoothingEnabled: true,
      fillRect() { throw new Error('uncached draw in frame'); },
      drawImage(canvas, x, y, w, h) {
        for (const n of [x, y, w, h]) assert(Number.isFinite(n), 'nonfinite layer');
        assert(y === 0 || canvas.width === 48, 'background layer moved vertically');
        calls.push({ canvas, x, y, w, h });
      }
    };
    window.Backgrounds.draw(ctx, stage, camX, 15.25);
    assert.equal(ctx.imageSmoothingEnabled, false);
    assert(calls.length >= 10 && calls.length <= 15, 'missing cached layers or crowd');
    assert.deepEqual(calls.slice(0, 5).map(v => v.canvas.width),
      [960, 2048, 2048, 2048, 3600]);
    assert.equal(calls.at(-1).canvas.width, 6000, 'missing 3000-unit ground');
    assert.equal(calls.at(-1).canvas.height, 540, 'ground is not HD');
    assert.equal(calls[0].x, 0);
    assert.equal(calls[3].x, -camX * 0.2);
    assert.equal(calls[4].x, -camX * 0.5);
    assert.equal(calls.at(-1).x, -camX);
    for (const layer of [calls[0], calls[3], calls[4], calls.at(-1)]) {
      assert(layer.x <= 0 && layer.x + layer.w >= 480,
        'parallax layer leaves viewport uncovered');
    }
    assert(calls.at(-1).canvas.getContext('2d').ground,
      'walkable ground missing at y=170');
    assert.equal(canvases, stage * 37, 'scene cache was rebuilt');
    if (sceneSignature === undefined) {
      const mid = calls[4].canvas.getContext('2d').shapeHash;
      const near = calls.at(-1).canvas.getContext('2d').shapeHash;
      sceneSignature = `${mid}:${near}`;
    }
  }
  assert(!signatures.has(sceneSignature), `stage ${stage} repeats another scene layout`);
  signatures.add(sceneSignature);
  process.stdout.write(`stage ${stage}: ${expectedPlaces[stage - 1]} — HD parallax and coverage OK\n`);
}

const fallback = { drawImage() {}, imageSmoothingEnabled: true };
window.Backgrounds.draw(fallback, 'unknown', NaN, 0);
assert.equal(canvases, 370, 'fallback should reuse stage 1 cache');
