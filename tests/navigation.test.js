'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, evalJSON, $id, click } = require('./helpers/load-app');

function visibleScreenIds(dom) {
  return ['mode-screen', 'setup-screen', 'game-screen', 'end-screen', 'tournament-screen']
    .filter(id => !$id(dom, id).classList.contains('hidden'));
}

describe('Screen navigation', () => {
  test('boots on the Mode Select screen only', async () => {
    const dom = await loadApp();
    assert.deepEqual(visibleScreenIds(dom), ['mode-screen']);
  });

  test('Play Mode card opens the setup screen and builds its inputs', async () => {
    const dom = await loadApp();
    click(dom, '#mode-play-btn');
    assert.deepEqual(visibleScreenIds(dom), ['setup-screen']);
    assert.ok($id(dom, 'n-0'), 'player name inputs should be built by initSetup()');
  });

  test('setup screen "Mode Select" button returns to Mode Select', async () => {
    const dom = await loadApp();
    click(dom, '#mode-play-btn');
    click(dom, '#setup-back-btn');
    assert.deepEqual(visibleScreenIds(dom), ['mode-screen']);
  });

  test('Tournament Management card opens the tournament screen showing the roster builder', async () => {
    const dom = await loadApp();
    click(dom, '#mode-tmm-btn');
    assert.deepEqual(visibleScreenIds(dom), ['tournament-screen']);
    assert.notEqual($id(dom, 'tmm-roster-card').style.display, 'none');
  });

  test('tournament screen "Mode Select" button returns to Mode Select', async () => {
    const dom = await loadApp();
    click(dom, '#mode-tmm-btn');
    click(dom, '#tourn-back-btn');
    assert.deepEqual(visibleScreenIds(dom), ['mode-screen']);
  });

  test('exactly one screen is visible at a time regardless of which was entered last', async () => {
    const dom = await loadApp();
    click(dom, '#mode-play-btn');
    click(dom, '#setup-back-btn');
    click(dom, '#mode-tmm-btn');
    assert.equal(visibleScreenIds(dom).length, 1);
    assert.deepEqual(visibleScreenIds(dom), ['tournament-screen']);
  });
});

describe('Sound & high-contrast toggles are wired on every screen', () => {
  test('toggling sound flips the icon/label on every sound button at once', async () => {
    const dom = await loadApp();
    assert.equal($id(dom, 'sound-toggle-mode').textContent, '🔊');
    click(dom, '#sound-toggle-mode');
    assert.equal($id(dom, 'sound-toggle-mode').textContent, '🔇');
    assert.equal($id(dom, 'sound-toggle-setup').textContent, '🔇', 'all sound toggle buttons share one soundEnabled flag');
  });

  test('toggling high contrast adds the hc-mode class to <html> and flips aria-pressed', async () => {
    const dom = await loadApp();
    click(dom, '#hc-toggle-mode');
    assert.ok(dom.window.document.documentElement.classList.contains('hc-mode'));
    assert.equal($id(dom, 'hc-toggle-mode').getAttribute('aria-pressed'), 'true');
  });
});
