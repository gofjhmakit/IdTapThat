'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, evalIn, evalJSON, $id, setValue } = require('./helpers/load-app');

function seedTwoPlayers(dom) {
  evalIn(dom, `
    G = createInitialState();
    G.setupCount = 2; G.setupLife = 40;
    G.players = [
      { name:'A', color:'#111', life:40, poison:0, cdr:{1:0}, timer:0, eliminated:false, elimRound:null, elimCause:'', elimTime:null, _commanderName:'', artUrl:null },
      { name:'B', color:'#222', life:40, poison:0, cdr:{0:0}, timer:0, eliminated:false, elimRound:null, elimCause:'', elimTime:null, _commanderName:'', artUrl:null },
    ];
    G.curIdx = 0; G.round = 1; G.over = false; G.winner = -1;
    lifeUndoStack.length = 0; pendingElim = null;
    snapshotHistory(); renderGame();
  `);
}

function seedFourPlayers(dom) {
  evalIn(dom, `
    G = createInitialState();
    G.setupCount = 4; G.setupLife = 40;
    G.players = ['A','B','C','D'].map(n => ({
      name:n, color:'#111', life:40, poison:0, cdr:{}, timer:0,
      eliminated:false, elimRound:null, elimCause:'', elimTime:null, _commanderName:'', artUrl:null
    }));
    G.curIdx = 0; G.round = 1; G.over = false; G.winner = -1;
    lifeUndoStack.length = 0; pendingElim = null;
    snapshotHistory(); renderGame();
  `);
}

describe('Play Mode: setup -> startGame', () => {
  test('builds G.players from the setup screen defaults', async () => {
    const dom = await loadApp();
    evalIn(dom, 'initSetup()');
    evalIn(dom, 'startGame()');
    const players = evalJSON(dom, 'G.players');
    assert.equal(players.length, 4);
    assert.deepEqual(players.map(p => p.name), ['Aragorn', 'Gandalf', 'Legolas', 'Gimli']);
    assert.ok(players.every(p => p.life === 40 && !p.eliminated));
    assert.equal(evalJSON(dom, 'G.over'), false);
    assert.equal(evalJSON(dom, 'G.round'), 1);
  });

  test('picks up a custom player count, starting life, and typed names', async () => {
    const dom = await loadApp();
    evalIn(dom, 'G.setupCount = 2; G.setupLife = 20; initSetup();');
    setValue(dom, '#n-0', 'Xander');
    setValue(dom, '#n-1', 'Yara');
    evalIn(dom, 'startGame()');
    const players = evalJSON(dom, 'G.players');
    assert.equal(players.length, 2);
    assert.deepEqual(players.map(p => p.name), ['Xander', 'Yara']);
    assert.ok(players.every(p => p.life === 20));
  });

  test('a blank name input falls back to "Player N"', async () => {
    const dom = await loadApp();
    evalIn(dom, 'G.setupCount = 2; initSetup();');
    setValue(dom, '#n-0', '   ');
    evalIn(dom, 'startGame()');
    assert.equal(evalJSON(dom, 'G.players[0].name'), 'Player 1');
  });

  test('initializes a full pairwise commander-damage matrix', async () => {
    const dom = await loadApp();
    evalIn(dom, 'G.setupCount = 3; initSetup(); startGame();');
    const cdr = evalJSON(dom, 'G.players.map(p => p.cdr)');
    assert.deepEqual(cdr, [{ 1: 0, 2: 0 }, { 0: 0, 2: 0 }, { 0: 0, 1: 0 }]);
  });
});

describe('Play Mode: life changes & undo', () => {
  test('applyLifeDelta adjusts life and records an undo entry', async () => {
    const dom = await loadApp();
    seedTwoPlayers(dom);
    evalIn(dom, 'applyLifeDelta(0, -5)');
    assert.equal(evalJSON(dom, 'G.players[0].life'), 35);
    assert.equal(evalJSON(dom, 'lifeUndoStack.length'), 1);
    assert.equal(evalJSON(dom, 'lifeUndoStack[0].prevLife'), 40);
  });

  test('undoLifeChange steps back through multiple changes', async () => {
    const dom = await loadApp();
    seedTwoPlayers(dom);
    evalIn(dom, 'applyLifeDelta(0, -5); applyLifeDelta(0, -3);');
    assert.equal(evalJSON(dom, 'G.players[0].life'), 32);
    evalIn(dom, 'undoLifeChange()');
    assert.equal(evalJSON(dom, 'G.players[0].life'), 35);
    evalIn(dom, 'undoLifeChange()');
    assert.equal(evalJSON(dom, 'G.players[0].life'), 40);
  });

  test('setLife jumps straight to a custom amount', async () => {
    const dom = await loadApp();
    seedTwoPlayers(dom);
    evalIn(dom, 'setLife(1, 7)');
    assert.equal(evalJSON(dom, 'G.players[1].life'), 7);
  });

  test('life changes on an eliminated player are ignored', async () => {
    const dom = await loadApp();
    seedTwoPlayers(dom);
    evalIn(dom, 'G.players[0].eliminated = true; applyLifeDelta(0, -5);');
    assert.equal(evalJSON(dom, 'G.players[0].life'), 40, 'life must not change once eliminated');
  });
});

describe('Play Mode: elimination flow', () => {
  test('life <= 0 raises a pending elimination that requires confirmation', async () => {
    const dom = await loadApp();
    seedTwoPlayers(dom);
    evalIn(dom, 'applyLifeDelta(0, -40)');
    assert.equal(evalJSON(dom, 'G.players[0].life'), 0);
    assert.equal(evalJSON(dom, 'G.players[0].eliminated'), false, 'not eliminated until confirmed');
    assert.equal(evalJSON(dom, 'pendingElim.idx'), 0);
    assert.equal(evalJSON(dom, 'pendingElim.cause'), 'Life ≤ 0');
    assert.equal($id(dom, 'elim-confirm-modal').classList.contains('hidden'), false);
  });

  test('confirmElim finalizes elimination and ends the game when one player remains', async () => {
    const dom = await loadApp();
    seedTwoPlayers(dom);
    evalIn(dom, 'applyLifeDelta(0, -40)');
    evalIn(dom, 'confirmElim()');
    assert.equal(evalJSON(dom, 'G.players[0].eliminated'), true);
    assert.equal(evalJSON(dom, 'G.players[0].elimCause'), 'Life ≤ 0');
    assert.equal(evalJSON(dom, 'G.over'), true, 'last player standing ends the game');
    assert.equal(evalJSON(dom, 'G.winner'), 1);
  });

  test('undoing a life change clears a pending Life<=0 elimination if life recovers above 0', async () => {
    const dom = await loadApp();
    seedTwoPlayers(dom);
    evalIn(dom, 'applyLifeDelta(0, -40)');
    assert.ok(evalJSON(dom, 'pendingElim !== null'));
    evalIn(dom, 'undoLifeChange()');
    assert.equal(evalJSON(dom, 'pendingElim'), null);
    assert.equal($id(dom, 'elim-confirm-modal').classList.contains('hidden'), true);
  });

  test('cancelElim leaves the player alive and clears the pending state', async () => {
    const dom = await loadApp();
    seedTwoPlayers(dom);
    evalIn(dom, 'applyLifeDelta(0, -40); cancelElim();');
    assert.equal(evalJSON(dom, 'G.players[0].eliminated'), false);
    assert.equal(evalJSON(dom, 'pendingElim'), null);
  });

  test('poison >= 10 raises an elimination cause', async () => {
    const dom = await loadApp();
    seedTwoPlayers(dom);
    evalIn(dom, 'G.players[0].poison = 10; checkElim(0);');
    assert.equal(evalJSON(dom, 'pendingElim.cause'), 'Poison (10)');
  });

  test('commander damage >= 21 raises an elimination cause naming the attacker', async () => {
    const dom = await loadApp();
    seedTwoPlayers(dom);
    evalIn(dom, 'G.players[0].cdr[1] = 21; checkElim(0);');
    assert.equal(evalJSON(dom, 'pendingElim.cause'), 'Cmdr dmg from B');
  });

  test('revivePlayer clears elimination and restores at least 1 life', async () => {
    const dom = await loadApp();
    seedTwoPlayers(dom);
    evalIn(dom, 'applyLifeDelta(0, -40); confirmElim(); G.over = false;');
    evalIn(dom, 'revivePlayer(0)');
    assert.equal(evalJSON(dom, 'G.players[0].eliminated'), false);
    assert.equal(evalJSON(dom, 'G.players[0].life'), 1);
  });
});

describe('Play Mode: turn & round management', () => {
  test('nextTurn skips eliminated players', async () => {
    const dom = await loadApp();
    seedFourPlayers(dom);
    evalIn(dom, 'G.players[1].eliminated = true; nextTurn();');
    assert.equal(evalJSON(dom, 'G.curIdx'), 2, 'should skip B (idx 1) and land on C (idx 2)');
  });

  test('nextTurn wraps around to the start of the order', async () => {
    const dom = await loadApp();
    seedFourPlayers(dom);
    evalIn(dom, 'G.curIdx = 3; nextTurn();');
    assert.equal(evalJSON(dom, 'G.curIdx'), 0);
  });

  test('endRound increments the round, resets round/turn timers, and starts at the first alive player', async () => {
    const dom = await loadApp();
    seedFourPlayers(dom);
    evalIn(dom, 'G.players[0].eliminated = true; G.curIdx = 3; G.timers.round = 42; G.timers.turn = 9;');
    evalIn(dom, 'endRound()');
    assert.equal(evalJSON(dom, 'G.round'), 2);
    assert.equal(evalJSON(dom, 'G.curIdx'), 1, 'first non-eliminated player (B)');
    assert.equal(evalJSON(dom, 'G.timers.round'), 0);
    assert.equal(evalJSON(dom, 'G.timers.turn'), 0);
  });

  test('checkWinner declares the sole survivor the winner', async () => {
    const dom = await loadApp();
    seedFourPlayers(dom);
    evalIn(dom, 'G.players[0].eliminated = true; G.players[1].eliminated = true; G.players[2].eliminated = true; checkWinner();');
    assert.equal(evalJSON(dom, 'G.winner'), 3);
    assert.equal(evalJSON(dom, 'G.over'), true);
  });

  test('checkWinner declares a draw (-1) when everyone is eliminated at once', async () => {
    const dom = await loadApp();
    seedFourPlayers(dom);
    evalIn(dom, `
      G.players.forEach(p => p.eliminated = true);
      checkWinner();
    `);
    assert.equal(evalJSON(dom, 'G.winner'), -1);
    assert.equal(evalJSON(dom, 'G.over'), true);
  });
});

describe('Play Mode: career history persistence', () => {
  test('saveGameRecord + loadCareerHistory + getCareerStatsByPlayer round-trip through localStorage', async () => {
    const dom = await loadApp();
    evalIn(dom, `
      G = createInitialState();
      G.players = [
        { name:'A', color:'#111', life:12, eliminated:false, elimRound:null, timer:30 },
        { name:'B', color:'#222', life:0,  eliminated:true,  elimRound:2,    timer:20 },
      ];
      G.winner = 0; G.round = 3; G.timers = { total: 60, round: 0, turn: 0, paused:false };
      saveGameRecord();
    `);
    const history = evalJSON(dom, 'loadCareerHistory()');
    assert.equal(history.length, 1);
    assert.equal(history[0].winner, 'A');
    assert.equal(history[0].rounds, 3);
    const stats = evalJSON(dom, 'getCareerStatsByPlayer(loadCareerHistory())');
    const a = stats.find(s => s.name === 'A');
    const b = stats.find(s => s.name === 'B');
    assert.equal(a.wins, 1); assert.equal(a.losses, 0);
    assert.equal(b.wins, 0); assert.equal(b.losses, 1);
  });

  test('career history persists across a simulated reload (same localStorage)', async () => {
    const dom1 = await loadApp();
    evalIn(dom1, `
      G = createInitialState();
      G.players = [{ name:'Solo', color:'#111', life:40, eliminated:false, elimRound:null, timer:5 }];
      G.winner = 0; G.round = 1; G.timers = { total: 5, round: 0, turn: 0, paused:false };
      saveGameRecord();
    `);
    const raw = dom1.window.localStorage.getItem('idtapthat_career');
    assert.ok(raw, 'game record must be written to localStorage');

    const dom2 = await loadApp({ seedLocalStorage: { idtapthat_career: raw } });
    const history = evalJSON(dom2, 'loadCareerHistory()');
    assert.equal(history.length, 1);
    assert.equal(history[0].winner, 'Solo');
  });
});
