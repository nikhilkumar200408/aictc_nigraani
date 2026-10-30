const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../public/logic.js');

test('APH workflow pathways contain expected stages', () => {
  assert.deepEqual(L.PATHS['Only Scrutiny'], ['Scrutiny']);
  assert.deepEqual(L.PATHS['Only EVC'], ['EVC']);
  assert.deepEqual(L.PATHS['Only SAC/SHC'], ['SAC/SHC']);
  assert.deepEqual(L.PATHS['Scrutiny + EVC + SAC/SHC'], ['Scrutiny','EVC','SAC/SHC']);
});

test('escalation levels are derived from overdue age', () => {
  assert.equal(L.lvl(0), 'Upcoming');
  assert.equal(L.lvl(-3), 'L1 · Regional Officer');
  assert.equal(L.lvl(-10), 'L2 · Regional Director');
  assert.equal(L.lvl(-20), 'L3 · Bureau Head');
});

test('audit hash chain detects tampering', () => {
  const first={t:1,actor:'Admin',act:'LOGIN',det:'admin@example.org'};
  first.h=L.entryHash('00000000',first);
  const second={t:2,actor:'Officer',act:'STAGE COMPLETE',det:'APP-1'};
  second.h=L.entryHash(first.h,second);
  assert.equal(L.verifyChain([first,second]),true);
  second.det='tampered';
  assert.equal(L.verifyChain([first,second]),false);
});
