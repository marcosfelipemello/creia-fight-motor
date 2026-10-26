/* Run with: node js/bosses.selftest.js */
'use strict';
const assert = require('node:assert/strict');
global.window = global;
require('./bosses.js');
const context = {
  fillRect(...args) { for (const n of args) assert(Number.isFinite(n), 'draw coordinate is not finite'); },
  drawImage() {}, save() {}, restore() {}, translate() {}, scale() {},
  imageSmoothingEnabled: false, fillStyle: '', globalAlpha: 1
};
global.document = { createElement: () => ({ getContext: () => context }) };

function finiteBoss(b, arena) {
  for (const key of ['x', 'y', 'z', 'hp', 'maxHp', 'w', 'h']) {
    assert(Number.isFinite(b[key]), `${b.name}: ${key} is not finite`);
  }
  assert(b.x >= arena.left + b.w / 2 - 0.001, `${b.name}: beyond left`);
  assert(b.x <= arena.right - b.w / 2 + 0.001, `${b.name}: beyond right`);
  assert(b.y >= arena.top && b.y <= arena.bottom, `${b.name}: y outside arena`);
  assert(b.z >= 0, `${b.name}: negative z`);
  assert.equal(typeof b.update, 'function');
  assert.equal(typeof b.draw, 'function');
}

for (let stage = 1; stage <= 10; stage++) {
  const arena = { left: 1000, right: 1480, top: 178, bottom: 262 };
  const shots = [];
  const events = { hits: 0, warnings: 0, spawns: 0, adds: 0 };
  const G = {
    players: [
      { x: 1120, y: 210, z: 0, hp: 100, maxHp: 100, dead: false, who: 'lutador' },
      { x: 1350, y: 231, z: 0, hp: 100, maxHp: 100, dead: false, who: 'nutri' }
    ],
    arena, time: 0,
    nearestPlayer(x, y) {
      return this.players.reduce((best, p) =>
        !best || Math.hypot(x - p.x, y - p.y) < Math.hypot(x - best.x, y - best.y) ? p : best, null);
    },
    hit(x, y, rx, ry, z0, z1, dmg, knock, fromX) {
      for (const value of [x, y, rx, ry, z0, z1, dmg, knock, fromX]) assert(Number.isFinite(value));
      events.hits++;
      return 1;
    },
    shoot(p) {
      for (const key of ['x', 'y', 'z', 'vx', 'vy', 'vz', 'grav', 'r', 'dmg', 'knock', 'life']) {
        assert(Number.isFinite(p[key]), `projectile ${key} is not finite`);
      }
      assert.equal(typeof p.draw, 'function');
      shots.push(p);
    },
    spawn(kind, x, y) {
      assert.equal(kind, 'coxinha');
      assert(Number.isFinite(x) && Number.isFinite(y));
      events.spawns++;
    },
    addBoss(b) { bosses.push(b); events.adds++; },
    puddle(x, y, w, life) {
      for (const n of [x, y, w, life]) assert(Number.isFinite(n));
    },
    shake() {}, particles() {}, sound() {}, text() {}
  };
  const bosses = window.Bosses.create(stage, G);
  assert.equal(bosses.length, stage === 9 ? 2 : 1, `stage ${stage} boss count`);
  for (const b of bosses) finiteBoss(b, arena);

  for (let frame = 0; frame < 60 * 60; frame++) {
    G.time = frame / 60;
    if (stage === 8 && frame === 120) bosses[0].hp = bosses[0].maxHp / 2;
    if (stage === 10 && frame === 120) bosses[0].hp = bosses[0].maxHp * 0.65;
    if (stage === 10 && frame === 600) bosses[0].hp = bosses[0].maxHp * 0.32;
    for (const b of bosses) {
      const priorState = b.state;
      const priorTimer = b.timer;
      const priorX = b.x;
      b.update(1 / 60, G);
      finiteBoss(b, arena);
      if (priorState === 'warn' && b.state === 'attack') {
        assert(priorTimer + 1 / 60 >= 0.5, `${b.name}: attack warning too short`);
      }
      if (priorState === 'rest' && b.state === 'rest') {
        assert.equal(b.x, priorX, `${b.name}: moved while vulnerable`);
      }
      if (frame % 30 === 0) b.draw(context, b.x - arena.left, b.y - b.z);
    }
  }
  if (stage === 8) assert.equal(events.adds, 3, 'tower must split once into three');
  if (stage === 10) assert.equal(bosses[0].phase, 3, 'emperor phase 3');
  assert(shots.length + events.hits + events.spawns > 0, `stage ${stage}: no attacks`);

  const survivor = bosses.find(b => !b.dead);
  survivor.hp = 0;
  survivor.update(1 / 60, G);
  assert.equal(survivor.dead, false, 'death must be animated');
  for (let i = 0; i < 90; i++) survivor.update(1 / 60, G);
  assert.equal(survivor.dead, true, 'death must finish');
  process.stdout.write(`stage ${stage}: ${bosses.length} boss(es), ${shots.length} shots, ${events.hits} hits OK\n`);
}
