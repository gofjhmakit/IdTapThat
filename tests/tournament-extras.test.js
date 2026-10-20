'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, evalIn, evalJSON, $id, $all, click, setValue } = require('./helpers/load-app');

function seed(dom, { n = 8, format = 'swiss', podSize = 2, numRounds = 4, bestOf = 1, seated = false }) {
  const list = JSON.stringify(Array.from({ length: n }, (_, i) => ({ name: 'P' + i, color: '#e94560' })));
  evalIn(dom, `
    TOURNAMENT = createTournament(${list}, '${format}', ${numRounds}, ${podSize}, ${bestOf});
    TOURNAMENT.seated = ${seated};
    TOURNAMENT.started = true;
    generateNextTournamentRound();
  `);
}

/** Record a random winner on every open table, then advance to the next round. */
const PLAY_ROUND = `(() => {
  const r = TOURNAMENT.currentRound - 1;
  TOURNAMENT.rounds[r].forEach((t, ti) => {
    if (t.result) return;
    setPodWinner(r, ti, t.playerIndices[Math.random() < .5 ? 0 : 1], Math.random() < .5 ? 0 : 1);
  });
})()`;
const NEXT_ROUND = `TOURNAMENT.currentRound++; generateNextTournamentRound();`;

describe('Best of 3', () => {
  test('the Match selector shows only for 1v1 pods and Best of 1 is the default', async () => {
    const dom = await loadApp();
    click(dom, '#mode-tmm-btn');
    assert.equal($id(dom, 'tourn-podsize-sel').value, '2', '1v1 is the default pod size');
    assert.equal($id(dom, 'tourn-bestof-sel').value, '1');
    assert.equal($id(dom, 'tourn-bestof-sel').style.display, '');
    $id(dom, 'tourn-podsize-sel').value = '4';
    $id(dom, 'tourn-podsize-sel').dispatchEvent(new dom.window.Event('change'));
    assert.equal($id(dom, 'tourn-bestof-sel').style.display, 'none');
    $id(dom, 'tourn-podsize-sel').value = '2';
    $id(dom, 'tourn-podsize-sel').dispatchEvent(new dom.window.Event('change'));
    assert.equal($id(dom, 'tourn-bestof-sel').style.display, '');
  });

  test('best of 3 is ignored for 4-player pods', async () => {
    const dom = await loadApp();
    seed(dom, { podSize: 4, bestOf: 3 });
    assert.equal(evalJSON(dom, 'TOURNAMENT.bestOf'), 1);
  });

  test('a BO3 result records the game score and offers 2–0 / 2–1 buttons', async () => {
    const dom = await loadApp();
    seed(dom, { n: 2, bestOf: 3 });
    evalIn(dom, 'renderTMM()');
    const labels = $all(dom, '.pod-player-btn').map(b => b.textContent.trim());
    assert.deepEqual(labels, ['2–0', '2–1', '2–0', '2–1']);
    evalIn(dom, 'setPodWinner(0, 0, TOURNAMENT.rounds[0][0].playerIndices[1], 1)');
    assert.deepEqual(evalJSON(dom, 'TOURNAMENT.rounds[0][0].result.games'), [2, 1]);
    const s = evalJSON(dom, 'computeStandings()');
    const w = evalJSON(dom, 'TOURNAMENT.rounds[0][0].playerIndices[1]');
    assert.equal(s[w].gameWins, 2);
    assert.equal(s[w].gameLosses, 1);
    assert.equal(s[1 - w].gameWins, 1);
    assert.equal(s[1 - w].gameLosses, 2);
  });

  test('a BO1 result has no game score', async () => {
    const dom = await loadApp();
    seed(dom, { n: 2 });
    evalIn(dom, 'setPodWinner(0, 0, TOURNAMENT.rounds[0][0].playerIndices[0])');
    assert.equal(evalJSON(dom, 'TOURNAMENT.rounds[0][0].result.games'), undefined);
  });
});

describe('Tiebreakers', () => {
  test('equal points are broken by opponents\' match-win %', async () => {
    const dom = await loadApp();
    seed(dom, { n: 4 });
    // P0 beat P1, P2 beat P3; then P2 beat P0, P1 beat P3.
    // P0 and P1 are both 1-1, but P0 faced P1 (1-1) and P2 (2-0) while
    // P1 faced P0 (1-1) and P3 (0-2), so P0 ranks higher.
    evalIn(dom, `
      TOURNAMENT.rounds = [
        [{ playerIndices: [0, 1], result: { placement: [0, 1] }, bye: false },
         { playerIndices: [2, 3], result: { placement: [2, 3] }, bye: false }],
        [{ playerIndices: [0, 2], result: { placement: [2, 0] }, bye: false },
         { playerIndices: [1, 3], result: { placement: [1, 3] }, bye: false }],
      ];
      TOURNAMENT.currentRound = 2;
    `);
    const ranked = evalJSON(dom, 'rankStandings(computeStandings()).map(p => p.name)');
    assert.deepEqual(ranked, ['P2', 'P0', 'P1', 'P3']);
    const omw = evalJSON(dom, 'computeStandings().map(p => Math.round(p.omw * 100))');
    assert.equal(omw[0], 75);  // (50% + 100%) / 2
    assert.equal(omw[1], 42);  // (50% + 33% floor) / 2
  });

  test('match-win % is floored at 33% and byes are not counted as opponents', async () => {
    const dom = await loadApp();
    seed(dom, { n: 3 });
    evalIn(dom, `
      TOURNAMENT.rounds = [[
        { playerIndices: [0, 1], result: { placement: [0, 1] }, bye: false },
        { playerIndices: [2], result: { placement: [2] }, bye: true },
      ]];
    `);
    const s = evalJSON(dom, 'computeStandings()');
    assert.equal(s[1].mwp, 1 / 3);
    assert.deepEqual(s[2].opponents, []);
    assert.equal(s[2].points, 3);
  });
});

describe('Swiss duel pairing', () => {
  test('14 players over 4 rounds never get a rematch', async () => {
    const dom = await loadApp();
    for (let run = 0; run < 40; run++) {
      seed(dom, { n: 14, numRounds: 4 });
      for (let r = 1; r < 4; r++) { evalIn(dom, PLAY_ROUND); evalIn(dom, NEXT_ROUND); }
      const pairs = evalJSON(dom, `TOURNAMENT.rounds.flatMap(ts => ts.filter(t => !t.bye).map(t => [...t.playerIndices].sort((a,b)=>a-b).join('-')))`);
      assert.equal(new Set(pairs).size, pairs.length, `rematch in run ${run}: ${pairs}`);
    }
  });

  test('13 players: everyone plays every round except one bye, and no one gets two byes in 4 rounds', async () => {
    const dom = await loadApp();
    for (let run = 0; run < 20; run++) {
      seed(dom, { n: 13, numRounds: 4 });
      for (let r = 1; r < 4; r++) { evalIn(dom, PLAY_ROUND); evalIn(dom, NEXT_ROUND); }
      const byes = evalJSON(dom, 'TOURNAMENT.rounds.map(ts => ts.filter(t => t.bye).map(t => t.playerIndices[0]))');
      byes.forEach(b => assert.equal(b.length, 1));
      assert.equal(new Set(byes.flat()).size, 4);
    }
  });

  test('losers keep playing: every player is paired in every round', async () => {
    const dom = await loadApp();
    seed(dom, { n: 14, numRounds: 3 });
    evalIn(dom, PLAY_ROUND); evalIn(dom, NEXT_ROUND);
    const seated = evalJSON(dom, 'TOURNAMENT.rounds[1].flatMap(t => t.playerIndices).sort((a,b)=>a-b)');
    assert.deepEqual(seated, Array.from({ length: 14 }, (_, i) => i));
  });
});

describe('Draft seating', () => {
  test('applying a seating reorders the roster and round 1 pairs across the table', async () => {
    const dom = await loadApp();
    click(dom, '#mode-tmm-btn');
    for (const n of ['A', 'B', 'C', 'D', 'E', 'F']) { setValue(dom, '#tmm-roster-name', n); evalIn(dom, 'addTmmRosterPlayer()'); }
    evalIn(dom, 'openSeatingModal()');
    assert.ok(!$id(dom, 'seating-modal').classList.contains('hidden'));
    const draw = evalJSON(dom, 'seatingDraw.map(i => tmmRosterDraft[i].name)');
    evalIn(dom, 'applySeating()');
    assert.deepEqual(evalJSON(dom, 'tmmRosterDraft.map(p => p.name)'), draw);
    assert.equal(evalJSON(dom, 'tmmRosterSeated'), true);
    assert.equal($id(dom, 'tmm-seated-note').style.display, '');

    $id(dom, 'tourn-podsize-sel').value = '2';
    click(dom, '#tourn-launch-btn');
    const pairs = evalJSON(dom, 'TOURNAMENT.rounds[0].map(t => t.playerIndices.map(i => TOURNAMENT.players[i].name))');
    assert.deepEqual(pairs, [[draw[0], draw[3]], [draw[1], draw[4]], [draw[2], draw[5]]]);
  });

  test('changing the roster clears the seating', async () => {
    const dom = await loadApp();
    for (const n of ['A', 'B', 'C']) { setValue(dom, '#tmm-roster-name', n); evalIn(dom, 'addTmmRosterPlayer()'); }
    evalIn(dom, 'openSeatingModal(); applySeating()');
    assert.equal(evalJSON(dom, 'tmmRosterSeated'), true);
    setValue(dom, '#tmm-roster-name', 'D'); evalIn(dom, 'addTmmRosterPlayer()');
    assert.equal(evalJSON(dom, 'tmmRosterSeated'), false);
  });

  test('odd seated count: the last seat gets the round-1 bye', async () => {
    const dom = await loadApp();
    seed(dom, { n: 5, seated: true });
    assert.deepEqual(evalJSON(dom, 'TOURNAMENT.rounds[0].map(t => t.playerIndices)'), [[0, 2], [1, 3], [4]]);
  });

  test('reshuffling round 1 ignores the seating', async () => {
    const dom = await loadApp();
    seed(dom, { n: 8, seated: true });
    const before = evalJSON(dom, 'JSON.stringify(TOURNAMENT.rounds[0])');
    let changed = false;
    for (let i = 0; i < 10 && !changed; i++) {
      evalIn(dom, 'reshuffleCurrentRound()');
      changed = evalJSON(dom, 'JSON.stringify(TOURNAMENT.rounds[0])') !== before;
    }
    assert.ok(changed);
  });
});

describe('Match timer', () => {
  test('is off by default and toggles from the tools row', async () => {
    const dom = await loadApp();
    seed(dom, { n: 4 });
    evalIn(dom, 'renderTMM()');
    assert.equal($id(dom, 'tmm-timer-card').style.display, 'none');
    click(dom, '#tmm-timer-toggle-btn');
    assert.equal($id(dom, 'tmm-timer-card').style.display, '');
    assert.equal($id(dom, 'tmm-timer-clock').textContent, '50:00');
  });

  test('start, pause, overtime and reset', async () => {
    const dom = await loadApp();
    seed(dom, { n: 4 });
    evalIn(dom, 'toggleMatchTimerCard(); setMatchTimerMinutes(25)');
    assert.equal($id(dom, 'tmm-timer-clock').textContent, '25:00');
    evalIn(dom, 'startPauseMatchTimer()');
    assert.equal(evalJSON(dom, 'TOURNAMENT.timer.running'), true);
    // Jump past the end of the round.
    evalIn(dom, 'TOURNAMENT.timer.endsAt = Date.now() - 83000; onMatchTimerTick()');
    assert.equal($id(dom, 'tmm-timer-clock').textContent, '+1:23');
    assert.ok($id(dom, 'tmm-timer-clock').classList.contains('overtime'));
    assert.equal(evalJSON(dom, 'TOURNAMENT.timer.alarmed'), true);
    evalIn(dom, 'startPauseMatchTimer()');
    assert.equal(evalJSON(dom, 'TOURNAMENT.timer.running'), false);
    evalIn(dom, 'resetMatchTimer()');
    assert.equal($id(dom, 'tmm-timer-clock').textContent, '25:00');
  });

  test('advancing to the next round resets the timer', async () => {
    const dom = await loadApp();
    seed(dom, { n: 2, numRounds: 3 });
    evalIn(dom, 'toggleMatchTimerCard(); startPauseMatchTimer(); renderTMM()');
    evalIn(dom, PLAY_ROUND);
    click(dom, '#tourn-nextrnd-btn');
    assert.equal(evalJSON(dom, 'TOURNAMENT.timer.running'), false);
    assert.equal(evalJSON(dom, 'TOURNAMENT.timer.remainingMs'), 50 * 60000);
  });

  test('fmtClock formats countdown and overtime', async () => {
    const dom = await loadApp();
    assert.equal(evalJSON(dom, 'fmtClock(50 * 60000)'), '50:00');
    assert.equal(evalJSON(dom, 'fmtClock(59001)'), '1:00');
    assert.equal(evalJSON(dom, 'fmtClock(-5000)'), '+0:05');
  });
});

describe('Projector display', () => {
  test('falls back to an in-page view when popups are unavailable, and shows standings and pairings', async () => {
    const dom = await loadApp();
    dom.window.open = () => null;
    seed(dom, { n: 4 });
    evalIn(dom, 'renderTMM()');
    click(dom, '#tmm-display-btn');
    const frame = dom.window.document.querySelector('#tmm-display-frame-wrap iframe');
    assert.ok(frame);
    const text = frame.contentWindow.document.body.textContent;
    assert.match(text, /Standings/);
    assert.match(text, /Round 1 Pairings/);
    assert.match(text, /P0/);
    click(dom, '#tmm-display-close');
    assert.equal(dom.window.document.getElementById('tmm-display-frame-wrap'), null);
  });
});
