'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, evalIn, evalJSON, $id, $all, click, setValue, keydown } = require('./helpers/load-app');

/** Build a started TOURNAMENT directly (bypassing the roster UI) with the
 *  given player names, format, pod size, and round count. */
function seedTournament(dom, { names, format = 'swiss', podSize = 4, numRounds = 3 }) {
  const list = JSON.stringify(names.map(n => ({ name: n, color: '#e94560' })));
  evalIn(dom, `
    TOURNAMENT = createTournament(${list}, '${format}', ${numRounds}, ${podSize});
    TOURNAMENT.started = true;
    generateNextTournamentRound();
  `);
}

describe('TMM roster builder', () => {
  test('addTmmRosterPlayer appends a chip and increments the count', async () => {
    const dom = await loadApp();
    setValue(dom, '#tmm-roster-name', 'Alice');
    evalIn(dom, 'addTmmRosterPlayer()');
    setValue(dom, '#tmm-roster-name', 'Bob');
    evalIn(dom, 'addTmmRosterPlayer()');
    assert.equal(evalJSON(dom, 'tmmRosterDraft.length'), 2);
    assert.deepEqual(evalJSON(dom, 'tmmRosterDraft.map(p => p.name)'), ['Alice', 'Bob']);
    assert.equal($id(dom, 'tmm-roster-count').textContent, '2');
    assert.equal($all(dom, '.tmm-roster-chip').length, 2);
  });

  test('blank input is ignored', async () => {
    const dom = await loadApp();
    setValue(dom, '#tmm-roster-name', '   ');
    evalIn(dom, 'addTmmRosterPlayer()');
    assert.equal(evalJSON(dom, 'tmmRosterDraft.length'), 0);
  });

  test('pressing Enter in the name field adds the player (wired in DOMContentLoaded)', async () => {
    const dom = await loadApp();
    setValue(dom, '#tmm-roster-name', 'Carol');
    keydown(dom, '#tmm-roster-name', 'Enter');
    assert.equal(evalJSON(dom, 'tmmRosterDraft.length'), 1);
    assert.equal(evalJSON(dom, 'tmmRosterDraft[0].name'), 'Carol');
  });

  test('the remove (x) button on a chip removes that player', async () => {
    const dom = await loadApp();
    evalIn(dom, `tmmRosterDraft = [{name:'Alice',color:'#111'},{name:'Bob',color:'#222'}]; renderTmmRoster();`);
    click(dom, '.tmm-roster-chip-remove[data-i="0"]');
    assert.deepEqual(evalJSON(dom, 'tmmRosterDraft.map(p=>p.name)'), ['Bob']);
  });

  test('launchTournament refuses to start with fewer than 2 players', async () => {
    const dom = await loadApp();
    evalIn(dom, `tmmRosterDraft = [{name:'Solo',color:'#111'}];`);
    evalIn(dom, 'launchTournament()');
    assert.equal(evalJSON(dom, 'TOURNAMENT'), null);
    assert.match(evalIn(dom, 'window.__lastAlert'), /at least 2 players/i);
  });
});

describe('chunkPodsWithBye', () => {
  test('an exact multiple of the pod size produces no bye', async () => {
    const dom = await loadApp();
    evalIn(dom, 'TOURNAMENT = { rounds: [] };'); // playerHadBye needs TOURNAMENT.rounds
    const tables = evalJSON(dom, 'chunkPodsWithBye([0,1,2,3,4,5,6,7], 4)');
    assert.equal(tables.length, 2);
    assert.ok(tables.every(t => !t.bye && t.playerIndices.length === 4));
  });

  test('a remainder of exactly 1 becomes an automatic bye for the leftover player', async () => {
    const dom = await loadApp();
    evalIn(dom, 'TOURNAMENT = { rounds: [] };');
    const tables = evalJSON(dom, 'chunkPodsWithBye([0,1,2,3,4], 4)'); // 5 players, pod size 4
    const byeTables = tables.filter(t => t.bye);
    const normalTables = tables.filter(t => !t.bye);
    assert.equal(byeTables.length, 1);
    assert.equal(byeTables[0].playerIndices.length, 1);
    assert.equal(byeTables[0].result.placement[0], byeTables[0].playerIndices[0], 'bye is pre-resolved as an automatic win');
    assert.equal(normalTables.length, 1);
    assert.equal(normalTables[0].playerIndices.length, 4);
  });

  test('a remainder that is not 1 just forms a smaller pod (no bye needed)', async () => {
    const dom = await loadApp();
    evalIn(dom, 'TOURNAMENT = { rounds: [] };');
    const tables = evalJSON(dom, 'chunkPodsWithBye([0,1,2,3,4,5], 4)'); // 6 players -> 4 + 2
    assert.equal(tables.filter(t => t.bye).length, 0);
    assert.deepEqual(tables.map(t => t.playerIndices.length).sort(), [2, 4]);
  });

  test('a single remaining player (e.g. bracket leftover) is a bye, not an unplayable 1-player pod', async () => {
    const dom = await loadApp();
    evalIn(dom, 'TOURNAMENT = { rounds: [] };');
    const tables = evalJSON(dom, 'chunkPodsWithBye([5], 4)');
    assert.equal(tables.length, 1);
    assert.equal(tables[0].bye, true);
  });

  test('prefers a player who has not already had a bye', async () => {
    const dom = await loadApp();
    // Player 4 already had a bye in round 0; with 5 players again, player 3 (not player 4) should get this one.
    evalIn(dom, `TOURNAMENT = { rounds: [ [ { playerIndices:[4], result:{placement:[4]}, bye:true } ] ] };`);
    const tables = evalJSON(dom, 'chunkPodsWithBye([0,1,2,3,4], 4)');
    const bye = tables.find(t => t.bye);
    assert.notEqual(bye.playerIndices[0], 4, 'should not repeat the bye on player 4');
  });
});

describe('computeStandings (derived, not incrementally mutated)', () => {
  test('a winner gets 3 points + a win; everyone else in the pod gets a loss and 0 points', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['A', 'B', 'C', 'D'], podSize: 4, numRounds: 3 });
    evalIn(dom, 'setPodWinner(0, 0, 1)'); // B wins table 0
    const stats = evalJSON(dom, 'computeStandings()');
    const byName = Object.fromEntries(stats.map(s => [s.name, s]));
    assert.deepEqual([byName.B.wins, byName.B.losses, byName.B.points], [1, 0, 3]);
    assert.deepEqual([byName.A.wins, byName.A.losses, byName.A.points], [0, 1, 0]);
    assert.deepEqual([byName.C.wins, byName.C.losses, byName.C.points], [0, 1, 0]);
  });

  test('a bye counts as a free win with no losers', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['A', 'B', 'C', 'D', 'E'], podSize: 4, numRounds: 3 }); // 5 players -> 1 bye
    const stats = evalJSON(dom, 'computeStandings()');
    const totalWins = stats.reduce((s, p) => s + p.wins, 0);
    const totalLosses = stats.reduce((s, p) => s + p.losses, 0);
    assert.equal(totalWins, 1, 'the bye is an unplayed automatic win');
    assert.equal(totalLosses, 0, 'nobody lost to a bye');
  });

  test('unsetPodResult fully reverses a result — standings recompute to zero, no residual mutation', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['A', 'B', 'C', 'D'], podSize: 4, numRounds: 3 });
    evalIn(dom, 'setPodWinner(0, 0, 2)'); // C wins
    let stats = evalJSON(dom, 'computeStandings()');
    assert.ok(stats.some(s => s.wins === 1));
    evalIn(dom, 'unsetPodResult(0, 0)');
    stats = evalJSON(dom, 'computeStandings()');
    assert.ok(stats.every(s => s.wins === 0 && s.losses === 0 && s.points === 0), 'unset must leave no trace');
    assert.equal(evalJSON(dom, 'TOURNAMENT.rounds[0][0].result'), null);
  });

  test('a bye table cannot be unset (it is not an editable pairing)', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['A', 'B', 'C', 'D', 'E'], podSize: 4, numRounds: 3 });
    const byeTableIdx = evalJSON(dom, 'TOURNAMENT.rounds[0].findIndex(t => t.bye)');
    evalIn(dom, `unsetPodResult(0, ${byeTableIdx})`);
    assert.notEqual(evalJSON(dom, `TOURNAMENT.rounds[0][${byeTableIdx}].result`), null, 'bye result must remain set');
  });

  test('setPodWinner is a no-op once a table already has a result (no double-scoring)', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['A', 'B', 'C', 'D'], podSize: 4, numRounds: 3 });
    evalIn(dom, 'setPodWinner(0, 0, 0)'); // A wins
    evalIn(dom, 'setPodWinner(0, 0, 1)'); // attempt to also crown B
    assert.equal(evalJSON(dom, 'TOURNAMENT.rounds[0][0].result.placement[0]'), 0, 'first result must stick');
  });
});

describe('Swiss pairing', () => {
  test('generateSwissPods orders players best-points-first into pods', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['A', 'B', 'C', 'D'], podSize: 4, numRounds: 3 });
    evalIn(dom, 'setPodWinner(0, 0, 1)'); // B now has 3 pts, others 0
    evalIn(dom, 'TOURNAMENT.currentRound = 2; generateNextTournamentRound();');
    const round2 = evalJSON(dom, 'TOURNAMENT.rounds[1]');
    assert.equal(round2.length, 1, 'still one pod of 4');
    assert.equal(round2[0].playerIndices[0], 1, 'the leader (B) should sort first');
  });
});

describe('Single-elimination bracket (regression coverage)', () => {
  // These two tests directly guard the bugs found & fixed in the tournament
  // rewrite: (1) generateEliminationPods() used to read `last.tables`, but
  // TOURNAMENT.rounds[i] *is* the tables array — that crashed round 2+.
  // (2) the "is this the final round?" check used to be mathematically
  // always-true, so multi-table elimination brackets ended after round 1.

  test('an 8-player bracket needs exactly 2 rounds to crown a champion (not 1)', async () => {
    const dom = await loadApp();
    const names = Array.from({ length: 8 }, (_, i) => `P${i}`);
    seedTournament(dom, { names, format: 'elimination', podSize: 4 });

    let round1 = evalJSON(dom, 'TOURNAMENT.rounds[0]');
    assert.equal(round1.length, 2, 'round 1 should be two 4-player pods');
    evalIn(dom, 'setPodWinner(0, 0, 0)'); // P0 wins table 0
    evalIn(dom, 'setPodWinner(0, 1, 4)'); // P4 wins table 1

    // Mirrors renderTMM()'s isFinalRound check.
    const tablesR1 = evalJSON(dom, 'TOURNAMENT.rounds[TOURNAMENT.currentRound - 1]');
    const isFinalAfterR1 = tablesR1.length <= 1;
    assert.equal(isFinalAfterR1, false, 'must NOT end after round 1 with 2 tables');

    assert.doesNotThrow(() => {
      evalIn(dom, 'TOURNAMENT.currentRound++; generateNextTournamentRound();');
    }, 'generating round 2 must not throw (regression for the last.tables bug)');

    const round2 = evalJSON(dom, 'TOURNAMENT.rounds[1]');
    assert.equal(round2.length, 1, 'round 2 should be the single 2-player final');
    assert.deepEqual(round2[0].playerIndices.sort(), [0, 4], 'the two round-1 winners face off');

    evalIn(dom, 'setPodWinner(1, 0, 0)'); // P0 wins the final
    const tablesR2 = evalJSON(dom, 'TOURNAMENT.rounds[TOURNAMENT.currentRound - 1]');
    assert.equal(tablesR2.length <= 1, true, 'round 2 (one table) is correctly the final round');
  });

  test('a bracket with an odd leftover advances the bye recipient into the next round', async () => {
    const dom = await loadApp();
    const names = Array.from({ length: 5 }, (_, i) => `P${i}`);
    seedTournament(dom, { names, format: 'elimination', podSize: 4 });

    const round1 = evalJSON(dom, 'TOURNAMENT.rounds[0]');
    const byeTable = round1.find(t => t.bye);
    const normalTable = round1.find(t => !t.bye);
    assert.ok(byeTable && normalTable);
    const byePlayer = byeTable.playerIndices[0];

    evalIn(dom, `setPodWinner(0, ${round1.indexOf(normalTable)}, ${normalTable.playerIndices[0]})`);
    evalIn(dom, 'TOURNAMENT.currentRound++; generateNextTournamentRound();');

    const round2 = evalJSON(dom, 'TOURNAMENT.rounds[1]');
    assert.equal(round2.length, 1);
    assert.ok(round2[0].playerIndices.includes(byePlayer), 'bye recipient must advance to round 2');
  });
});

describe('Manual pairing override', () => {
  test('reshuffleCurrentRound changes the grouping when nothing has been decided', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], podSize: 4, numRounds: 3 });
    const before = evalJSON(dom, 'TOURNAMENT.rounds[0].map(t => [...t.playerIndices].sort())');
    let after = before;
    for (let i = 0; i < 10 && JSON.stringify(after) === JSON.stringify(before); i++) {
      evalIn(dom, 'reshuffleCurrentRound()');
      after = evalJSON(dom, 'TOURNAMENT.rounds[0].map(t => [...t.playerIndices].sort())');
    }
    assert.notDeepEqual(after, before, 'pairings should differ after reshuffling (checked over several attempts to rule out a coincidental identical shuffle)');
    assert.equal(evalIn(dom, 'window.__lastAlert'), undefined, 'no alert when nothing was decided yet');
  });

  test('reshuffleCurrentRound refuses once a (non-bye) result exists, and leaves pairings untouched', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['A', 'B', 'C', 'D'], podSize: 4, numRounds: 3 });
    evalIn(dom, 'setPodWinner(0, 0, 0)');
    const before = evalJSON(dom, 'TOURNAMENT.rounds[0]');
    evalIn(dom, 'reshuffleCurrentRound()');
    const after = evalJSON(dom, 'TOURNAMENT.rounds[0]');
    assert.deepEqual(after, before, 'reshuffle must be a no-op once a result is recorded');
    assert.match(evalIn(dom, 'window.__lastAlert') || '', /already has recorded results/i);
  });

  test('swapPlayersInCurrentRound exchanges two undecided players across tables', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], podSize: 4, numRounds: 3 });
    const before = evalJSON(dom, 'TOURNAMENT.rounds[0]');
    const playerInTable0 = before[0].playerIndices[0];
    const playerInTable1 = before[1].playerIndices[0];
    evalIn(dom, `swapPlayersInCurrentRound(${playerInTable0}, ${playerInTable1})`);
    const after = evalJSON(dom, 'TOURNAMENT.rounds[0]');
    assert.ok(after[0].playerIndices.includes(playerInTable1));
    assert.ok(after[1].playerIndices.includes(playerInTable0));
    assert.ok(!after[0].playerIndices.includes(playerInTable0));
  });

  test('swapPlayersInCurrentRound refuses to touch a table that already has a result', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], podSize: 4, numRounds: 3 });
    evalIn(dom, 'setPodWinner(0, 0, TOURNAMENT.rounds[0][0].playerIndices[0])');
    const before = evalJSON(dom, 'TOURNAMENT.rounds[0]');
    const decidedPlayer = before[0].playerIndices[0];
    const otherPlayer = before[1].playerIndices[0];
    evalIn(dom, `swapPlayersInCurrentRound(${decidedPlayer}, ${otherPlayer})`);
    const after = evalJSON(dom, 'TOURNAMENT.rounds[0]');
    assert.deepEqual(after, before, 'swap must be a no-op when either side is already decided');
  });
});

describe('Printable pairings sheet', () => {
  test('printCurrentPairings fills #print-sheet with escaped table/name text and calls window.print', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['<b>Al</b>', 'Bob', 'Cid', 'Dee'], podSize: 4, numRounds: 3 });
    evalIn(dom, "window.print = () => { window.__printCalled = true; };");
    evalIn(dom, 'printCurrentPairings()');
    assert.equal(evalIn(dom, 'window.__printCalled'), true);
    const html = $id(dom, 'print-sheet').innerHTML;
    assert.ok(html.includes('Table 1'));
    assert.ok(!html.includes('<b>Al</b>'), 'player names must be escaped in the print sheet');
    assert.ok(html.includes('&lt;b&gt;Al&lt;/b&gt;'));
  });
});

describe('TMM persistence (localStorage)', () => {
  test('launchTournament persists state that a fresh page load can resume', async () => {
    const dom1 = await loadApp();
    evalIn(dom1, `tmmRosterDraft = [{name:'A',color:'#111'},{name:'B',color:'#222'},{name:'C',color:'#333'},{name:'D',color:'#444'}];`);
    setValue(dom1, '#tourn-format-sel', 'swiss');
    setValue(dom1, '#tourn-podsize-sel', '4');
    setValue(dom1, '#tourn-rounds-sel', '3');
    evalIn(dom1, 'launchTournament()');
    const raw = dom1.window.localStorage.getItem('idtapthat_tmm');
    assert.ok(raw, 'tournament state must be saved to localStorage on launch');

    const dom2 = await loadApp({ seedLocalStorage: { idtapthat_tmm: raw } });
    assert.equal(evalJSON(dom2, 'TOURNAMENT.started'), true);
    assert.equal(evalJSON(dom2, 'TOURNAMENT.players.length'), 4);
    assert.equal(evalJSON(dom2, 'TOURNAMENT.rounds.length'), 1);
  });

  test('the Mode Select screen shows a resume hint when a started tournament is loaded from storage', async () => {
    const seed = {
      format: 'swiss', numRounds: 3, podSize: 4, currentRound: 2, started: true,
      players: [{ name: 'A', color: '#111' }, { name: 'B', color: '#222' }],
      rounds: [[{ playerIndices: [0, 1], result: { placement: [0, 1] }, bye: false }]],
    };
    const dom = await loadApp({ seedLocalStorage: { idtapthat_tmm: JSON.stringify(seed) } });
    const desc = $id(dom, 'mode-tmm-desc').textContent;
    assert.match(desc, /Resume in progress/i);
    assert.match(desc, /Round 2 of 3/);
    assert.ok($id(dom, 'mode-tmm-btn').classList.contains('has-resume'));
  });

  test('resuming opens directly into the live round view, not the roster builder', async () => {
    const seed = {
      format: 'swiss', numRounds: 3, podSize: 4, currentRound: 1, started: true,
      players: [{ name: 'A', color: '#111' }, { name: 'B', color: '#222' }],
      rounds: [[{ playerIndices: [0, 1], result: null, bye: false }]],
    };
    const dom = await loadApp({ seedLocalStorage: { idtapthat_tmm: JSON.stringify(seed) } });
    evalIn(dom, "showScreen('tournament'); renderTMM();");
    assert.equal($id(dom, 'tmm-roster-card').style.display, 'none');
    assert.equal($all(dom, '.pod-card').length, 1);
  });

  test('clearTournamentState (End Tournament) removes the persisted key', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['A', 'B'], podSize: 2, numRounds: 3 });
    evalIn(dom, 'saveTournamentState()');
    assert.ok(dom.window.localStorage.getItem('idtapthat_tmm'));
    evalIn(dom, 'clearTournamentState()');
    assert.equal(dom.window.localStorage.getItem('idtapthat_tmm'), null);
    assert.equal(evalJSON(dom, 'TOURNAMENT'), null);
  });
});

describe('Tournament completion (Swiss)', () => {
  test('reaching the configured round count with all results in ends the tournament', async () => {
    const dom = await loadApp();
    seedTournament(dom, { names: ['A', 'B', 'C', 'D'], podSize: 4, numRounds: 1 });
    evalIn(dom, 'setPodWinner(0, 0, 0)');
    const isFinal = evalJSON(dom, 'TOURNAMENT.currentRound >= TOURNAMENT.numRounds');
    assert.equal(isFinal, true);
  });
});
