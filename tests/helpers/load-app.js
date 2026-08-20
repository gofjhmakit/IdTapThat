'use strict';
const path = require('path');
const { JSDOM } = require('jsdom');

const APP_PATH = path.join(__dirname, '..', '..', 'index.html');

/**
 * jsdom has no real <canvas> 2D rendering backend without the native
 * `canvas` package. drawChart() only needs the context to not throw —
 * we don't assert on pixels — so stub the handful of methods it calls.
 */
function stubCanvas(window) {
  const ctxStub = {
    clearRect(){}, fillRect(){}, beginPath(){}, closePath(){}, moveTo(){}, lineTo(){},
    stroke(){}, fill(){}, arc(){}, save(){}, restore(){}, translate(){}, rotate(){},
    setLineDash(){}, fillText(){}, strokeText(){},
    measureText(){ return { width: 0 }; },
  };
  ['fillStyle','strokeStyle','lineWidth','font','textAlign','lineJoin'].forEach(prop => {
    Object.defineProperty(ctxStub, prop, { value: undefined, writable: true });
  });
  window.HTMLCanvasElement.prototype.getContext = function () { return ctxStub; };
}

/**
 * Loads the real index.html into a fresh jsdom window and runs its inline
 * script, so tests exercise the actual app code rather than a
 * reimplementation. Each call returns a fully isolated window (own globals,
 * own localStorage) — analogous to opening the app in a brand-new tab.
 *
 * `seedLocalStorage` (optional {key: string} map) is written via jsdom's
 * `beforeParse` hook, i.e. *before* the app's inline <script> runs — this
 * is what lets tests simulate "reopen the app after a browser reload" for
 * persisted state (career history, TMM tournament state, prefs).
 */
async function loadApp({ seedLocalStorage } = {}) {
  const dom = await JSDOM.fromFile(APP_PATH, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    pretendToBeVisual: true,
    beforeParse(window) {
      stubCanvas(window);
      window.alert = msg => { window.__lastAlert = msg; };
      window.confirm = () => true;
      // startGame()/startTournamentPod-era code call startTick(), which sets a
      // repeating setInterval. Tests drive time-dependent logic (tick(),
      // timers) directly rather than waiting on the wall clock, so a real
      // interval here would just be a handle nothing ever clears — and a
      // live interval keeps the Node process (and `node --test`) from
      // exiting. Stub it out; one-shot setTimeout calls are unaffected.
      window.setInterval = () => 1;
      window.clearInterval = () => {};
      if (seedLocalStorage) {
        for (const [k, v] of Object.entries(seedLocalStorage)) window.localStorage.setItem(k, v);
      }
    },
  });
  const { window } = dom;
  // Let the DOMContentLoaded-driven init (showScreen('mode'), event wiring) settle.
  await new Promise(resolve => window.setTimeout(resolve, 0));
  return dom;
}

/**
 * Evaluate an expression/statement in the app's own script realm. This is
 * required (not just convenient) to read/write top-level `let`/`const`
 * globals like G and TOURNAMENT: per spec, `let`/`const` declared at a
 * script's top level do NOT become properties of `window` (unlike `var`
 * and function declarations), so `dom.window.G` is undefined even though
 * `dom.window.eval('G')` sees it.
 */
function evalIn(dom, code) {
  return dom.window.eval(code);
}

/** Same as evalIn, but marshals the result through JSON so objects/arrays
 *  compare cleanly against plain Node objects instead of being foreign-
 *  realm values (avoids assert.deepStrictEqual cross-realm pitfalls). */
function evalJSON(dom, expr) {
  const json = dom.window.eval(`JSON.stringify((${expr}))`);
  return json === undefined ? undefined : JSON.parse(json);
}

function $id(dom, id) { return dom.window.document.getElementById(id); }
function $(dom, sel) { return dom.window.document.querySelector(sel); }
function $all(dom, sel) { return Array.from(dom.window.document.querySelectorAll(sel)); }

function click(dom, sel) {
  const el = typeof sel === 'string' ? $(dom, sel) : sel;
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

function setValue(dom, sel, value) {
  const el = typeof sel === 'string' ? $(dom, sel) : sel;
  el.value = value;
  el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
}

function keydown(dom, sel, key) {
  const el = typeof sel === 'string' ? $(dom, sel) : sel;
  el.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

module.exports = { loadApp, evalIn, evalJSON, $, $all, $id, click, setValue, keydown, APP_PATH };
