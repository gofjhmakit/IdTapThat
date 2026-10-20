'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, evalJSON, $, $all, $id, click } = require('./helpers/load-app');

describe('Options & themes', () => {
  test('every screen topbar has an Options button next to sound', async () => {
    const dom = await loadApp();
    for (const id of ['options-btn-mode', 'options-btn-setup', 'options-btn-tourn', 'options-btn-game']) {
      const btn = $id(dom, id);
      assert.ok(btn, `${id} should exist`);
      assert.ok(btn.parentElement.querySelector('.sound-toggle-btn'), `${id} should sit beside the sound toggle`);
    }
  });

  test('Options button opens the modal with one preview tile per theme', async () => {
    const dom = await loadApp();
    assert.ok($id(dom, 'options-modal').classList.contains('hidden'));
    click(dom, '#options-btn-mode');
    assert.ok(!$id(dom, 'options-modal').classList.contains('hidden'));
    const tiles = $all(dom, '.theme-tile');
    assert.equal(tiles.length, evalJSON(dom, 'THEMES.length'));
    tiles.forEach(t => assert.ok(t.querySelector('.theme-preview svg'), `${t.dataset.theme} needs a preview`));
    assert.equal($(dom, '.theme-tile[aria-checked="true"]').dataset.theme, 'default');
  });

  test('picking a theme applies it and persists it across reloads', async () => {
    const dom = await loadApp();
    click(dom, '#options-btn-mode');
    click(dom, '.theme-tile[data-theme="daylight"]');
    assert.equal(dom.window.document.documentElement.dataset.theme, 'daylight');
    assert.equal($(dom, '.theme-tile[aria-checked="true"]').dataset.theme, 'daylight');
    assert.equal(dom.window.localStorage.getItem('idtapthat_theme'), 'daylight');

    const reopened = await loadApp({ seedLocalStorage: { idtapthat_theme: 'daylight' } });
    assert.equal(reopened.window.document.documentElement.dataset.theme, 'daylight');
  });

  test('choosing the default theme clears the data-theme attribute', async () => {
    const dom = await loadApp({ seedLocalStorage: { idtapthat_theme: 'slate' } });
    click(dom, '#options-btn-mode');
    click(dom, '.theme-tile[data-theme="default"]');
    assert.equal(dom.window.document.documentElement.dataset.theme, undefined);
  });

  test('an unknown saved theme falls back to default', async () => {
    const dom = await loadApp({ seedLocalStorage: { idtapthat_theme: 'no-such-theme' } });
    assert.equal(dom.window.document.documentElement.dataset.theme, undefined);
    assert.equal(evalJSON(dom, 'currentTheme'), 'default');
  });

  test('close button and backdrop close the Options modal', async () => {
    const dom = await loadApp();
    click(dom, '#options-btn-mode');
    click(dom, '#options-close');
    assert.ok($id(dom, 'options-modal').classList.contains('hidden'));
    click(dom, '#options-btn-mode');
    click(dom, '#options-modal');
    assert.ok($id(dom, 'options-modal').classList.contains('hidden'));
  });
});
