// Esqueleto e teste de aventura cooperativa sob rede instável (150 ms, 5% de perda).
// Uso: node tests/coop-lag.js
'use strict';
const assert = require('node:assert/strict');
const { parDeClientes } = require('./rede-bancada.js');

const { host, guest, rede } = parDeClientes({ atraso: 150, variacao: 30, perda: 0.05, semente: 123456789 });
rede.tick(1 / 60);

// A sala nasce pelo cartão online da aventura, nunca pelo menu principal.
assert(!Array.from(host.textSeen).some(t=>t.includes('AVENTURA ONLINE')));
host.key('KeyS');host.key('Enter');assert.equal(host.state.scene,'adventuremenu');
host.key('KeyD');host.key('Enter');
assert(host.transport.code,'cartão online não criou a sala');
guest.transport.joinCoop(host.transport.code);
host.key('Enter');
guest.key('KeyD');
guest.key('Enter');
rede.tick(0.1);

assert.equal(host.state.scene, 'coopSetup', 'anfitrião não entrou em coopSetup');
host.commands.coop('stage', 1);
host.commands.coop('start');
rede.tick(0.1);

assert.equal(host.state.scene, 'play', 'anfitrião não iniciou a fase');
assert.equal(guest.state.scene, 'onlinePlay', 'convidado não entrou em onlinePlay');

// Spawna inimigo para garantir movimentação contínua durante o teste
if (host.api.cardosoTest && host.api.cardosoTest.spawn) {
  host.api.cardosoTest.spawn('fome', host.state.cam + 250, 210);
}
rede.tick(0.2);

rede.resetStats();
let maxEnemyJump = 0;
let lastDraws = [];

// Joga durante 5 segundos (300 quadros) medindo saltos visuais e consumo de banda
for (let f = 0; f < 300; f++) {
  const drawsBefore = guest.enemyDraws.length;
  rede.tick(1 / 60);
  const currentDraws = guest.enemyDraws.slice(drawsBefore);

  for (let i = 0; i < currentDraws.length; i++) {
    if (lastDraws[i] && lastDraws[i].kind === currentDraws[i].kind) {
      const jump = Math.abs(currentDraws[i].x - lastDraws[i].x);
      if (jump > maxEnemyJump) maxEnemyJump = jump;
    }
  }
  if (currentDraws.length > 0) {
    lastDraws = currentDraws;
  }
}

const stats = rede.medidas();
console.log('Medidas coop (5s, 150ms atraso, 5% perda):', stats);
console.log('Maior salto visual de inimigo:', maxEnemyJump.toFixed(2), 'px/quadro');

assert(guest.enemyDraws.length > 0, 'nenhum inimigo foi desenhado no convidado');
assert(maxEnemyJump <= 24, 'inimigo saltou mais que 24 px: ' + maxEnemyJump.toFixed(2));
assert(stats.bytesPorSegundo < 30000, 'banda média excedeu 30 KB/s: ' + stats.bytesPorSegundo + ' B/s');
console.log('Coop sob rede instável: OK');
host.transport.leave();
