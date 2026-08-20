'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, evalIn, evalJSON } = require('./helpers/load-app');

describe('fmtTime', () => {
  test('formats under an hour as mm:ss', async () => {
    const dom = await loadApp();
    assert.equal(evalIn(dom, 'fmtTime(0)'), '00:00');
    assert.equal(evalIn(dom, 'fmtTime(5)'), '00:05');
    assert.equal(evalIn(dom, 'fmtTime(65)'), '01:05');
    assert.equal(evalIn(dom, 'fmtTime(599)'), '09:59');
  });

  test('formats an hour or more as h:mm:ss', async () => {
    const dom = await loadApp();
    assert.equal(evalIn(dom, 'fmtTime(3600)'), '1:00:00');
    assert.equal(evalIn(dom, 'fmtTime(3661)'), '1:01:01');
  });
});

describe('lifeColor', () => {
  test('red at or below 0', async () => {
    const dom = await loadApp();
    assert.equal(evalIn(dom, 'lifeColor(0, 40)'), '#ff3c3c');
    assert.equal(evalIn(dom, 'lifeColor(-5, 40)'), '#ff3c3c');
  });
  test('pale warning at/under 20% of the starting life', async () => {
    const dom = await loadApp();
    assert.equal(evalIn(dom, 'lifeColor(8, 40)'), '#ff8b94'); // 40*0.2 === 8
    assert.equal(evalIn(dom, 'lifeColor(1, 40)'), '#ff8b94');
  });
  test('white above the warning threshold', async () => {
    const dom = await loadApp();
    assert.equal(evalIn(dom, 'lifeColor(9, 40)'), '#fff');
    assert.equal(evalIn(dom, 'lifeColor(40, 40)'), '#fff');
  });
});

describe('calcMaxCdr', () => {
  test('0 when the player has no commander-damage entries', async () => {
    const dom = await loadApp();
    evalIn(dom, "G.players = [{ cdr: {} }]");
    assert.equal(evalIn(dom, 'calcMaxCdr(0)'), 0);
  });
  test('the maximum of all recorded commander damage', async () => {
    const dom = await loadApp();
    evalIn(dom, "G.players = [{ cdr: { 1: 5, 2: 17, 3: 0 } }]");
    assert.equal(evalIn(dom, 'calcMaxCdr(0)'), 17);
  });
});

describe('escapeHtml', () => {
  test('neutralizes tags, quotes, and ampersands so injected names cannot break out of markup', async () => {
    const dom = await loadApp();
    const out = evalIn(dom, `escapeHtml("<img src=x onerror=alert(1)>&\\"'")`);
    assert.ok(!out.includes('<img'), `should not contain a raw tag: ${out}`);
    assert.ok(out.includes('&lt;img'));
    assert.ok(out.includes('&amp;'));
    assert.ok(out.includes('&quot;'));
    assert.ok(out.includes('&#39;'));
  });
});

describe('gridLayout / orientedLayout', () => {
  test('gridLayout picks sensible [cols, rows] per player count', async () => {
    const dom = await loadApp();
    assert.deepEqual(evalJSON(dom, 'gridLayout(2)'), [2, 1]);
    assert.deepEqual(evalJSON(dom, 'gridLayout(3)'), [3, 1]);
    assert.deepEqual(evalJSON(dom, 'gridLayout(4)'), [2, 2]);
    assert.deepEqual(evalJSON(dom, 'gridLayout(6)'), [3, 2]);
    assert.deepEqual(evalJSON(dom, 'gridLayout(8)'), [4, 2]);
  });
});
