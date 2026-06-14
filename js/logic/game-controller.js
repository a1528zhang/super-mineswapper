const { GAME_STATES, MAX_ROWS, NEW_ROW_INTERVAL_SECONDS, ROW_CLEAR_ANIMATION_MS } = require('../config/game-config');
const {
  addGrowthRow,
  countFlags,
  countMines,
  countRevealedSafeCells,
  createBoard,
  findFullyRevealedSafeRows,
  floodReveal,
  forEachNeighbor,
  placeMines,
  removeRows,
  revealAllMines
} = require('./board');
const { hasWon } = require('./victory');

function createGameController() {
  const game = {
    board: [],
    state: GAME_STATES.READY,
    revealedCount: 0,
    flaggedCount: 0,
    mineCount: 0,
    firstMove: true,
    startTime: 0,
    finishedAt: 0,
    elapsedSeconds: 0,
    nextGrowthAt: NEW_ROW_INTERVAL_SECONDS,
    clearingRows: [],
    clearAnimationStartedAt: 0,
    clearAnimationDuration: ROW_CLEAR_ANIMATION_MS
  };

  function reset() {
    game.board = createBoard();
    game.state = GAME_STATES.READY;
    game.revealedCount = 0;
    game.flaggedCount = 0;
    game.mineCount = 0;
    game.firstMove = true;
    game.startTime = 0;
    game.finishedAt = 0;
    game.elapsedSeconds = 0;
    game.nextGrowthAt = NEW_ROW_INTERVAL_SECONDS;
    game.clearingRows = [];
    game.clearAnimationStartedAt = 0;
    game.clearAnimationDuration = ROW_CLEAR_ANIMATION_MS;
  }

  function revealCell(row, col) {
    if (isFinished()) {
      return;
    }

    const cell = game.board[row][col];
    if (cell.revealed || cell.flagged) {
      return;
    }

    if (game.firstMove) {
      placeMines(game.board, row, col);
      game.mineCount = countMines(game.board);
      game.firstMove = false;
      game.state = GAME_STATES.PLAYING;
      startTimer();
    }

    if (cell.mine) {
      cell.revealed = true;
      game.state = GAME_STATES.LOST;
      revealAllMines(game.board);
      stopTimer();
      return;
    }

    revealSafeCell(cell);
    finishTurn();
  }

  function revealAroundNumber(row, col) {
    if (isFinished()) {
      return;
    }

    const cell = game.board[row][col];
    if (!cell.revealed || cell.mine || cell.adjacent <= 0) {
      return;
    }

    const hiddenUnflaggedNeighbors = [];
    let flaggedNeighbors = 0;

    forEachNeighbor(game.board, row, col, (neighbor) => {
      if (neighbor.flagged) {
        flaggedNeighbors += 1;
        return;
      }

      if (!neighbor.revealed && !neighbor.flagged) {
        hiddenUnflaggedNeighbors.push(neighbor);
      }
    });

    if (flaggedNeighbors !== cell.adjacent || hiddenUnflaggedNeighbors.length === 0) {
      return;
    }

    for (let i = 0; i < hiddenUnflaggedNeighbors.length; i += 1) {
      const neighbor = hiddenUnflaggedNeighbors[i];
      if (neighbor.mine) {
        neighbor.revealed = true;
        game.state = GAME_STATES.LOST;
        revealAllMines(game.board);
        stopTimer();
        return;
      }
    }

    for (let i = 0; i < hiddenUnflaggedNeighbors.length; i += 1) {
      revealSafeCell(hiddenUnflaggedNeighbors[i]);
    }

    finishTurn();
  }

  function toggleFlag(row, col) {
    if (isFinished()) {
      return;
    }

    const cell = game.board[row][col];
    if (cell.revealed) {
      return;
    }

    cell.flagged = !cell.flagged;
    game.flaggedCount += cell.flagged ? 1 : -1;

    if (game.state === GAME_STATES.READY && !game.firstMove) {
      game.state = GAME_STATES.PLAYING;
      startTimer();
    }
  }

  function updateElapsedTime() {
    if (!game.startTime) {
      game.elapsedSeconds = 0;
      return;
    }

    const endTime = game.finishedAt || Date.now();
    game.elapsedSeconds = Math.floor((endTime - game.startTime) / 1000);
  }

  function tick() {
    updateElapsedTime();
    commitFinishedRowClearAnimation();

    if (game.state !== GAME_STATES.PLAYING) {
      return;
    }

    while (game.elapsedSeconds >= game.nextGrowthAt && game.state === GAME_STATES.PLAYING) {
      addGrowthRow(game.board);
      game.mineCount = countMines(game.board);
      game.flaggedCount = countFlags(game.board);
      game.revealedCount = countRevealedSafeCells(game.board);
      game.nextGrowthAt += NEW_ROW_INTERVAL_SECONDS;
      checkOverflowLoss();
    }
  }

  function isFinished() {
    return game.state === GAME_STATES.WON || game.state === GAME_STATES.LOST;
  }

  function revealSafeCell(cell) {
    game.revealedCount += floodReveal(game.board, cell);
  }

  function finishTurn() {
    startRowClearAnimation();

    if (hasWon(game.board, game.revealedCount, game.mineCount)) {
      return;
    }

    checkOverflowLoss();
  }

  function startRowClearAnimation() {
    if (game.clearingRows.length > 0) {
      return;
    }

    const rows = findFullyRevealedSafeRows(game.board);
    if (rows.length === 0) {
      syncCounts();
      return;
    }

    game.clearingRows = rows;
    game.clearAnimationStartedAt = Date.now();
    game.clearAnimationDuration = ROW_CLEAR_ANIMATION_MS;
  }

  function commitFinishedRowClearAnimation() {
    if (game.clearingRows.length === 0) {
      return;
    }

    const elapsed = Date.now() - game.clearAnimationStartedAt;
    if (elapsed < game.clearAnimationDuration) {
      return;
    }

    removeRows(game.board, game.clearingRows);
    game.clearingRows = [];
    game.clearAnimationStartedAt = 0;
    syncCounts();
  }

  function syncCounts() {
    game.mineCount = countMines(game.board);
    game.flaggedCount = countFlags(game.board);
    game.revealedCount = countRevealedSafeCells(game.board);
  }

  function checkOverflowLoss() {
    if (game.board.length >= MAX_ROWS) {
      game.state = GAME_STATES.LOST;
      revealAllMines(game.board);
      stopTimer();
    }
  }

  function startTimer() {
    if (game.startTime) {
      return;
    }

    game.startTime = Date.now();
    game.finishedAt = 0;
    updateElapsedTime();
  }

  function stopTimer() {
    if (!game.startTime || game.finishedAt) {
      return;
    }

    game.finishedAt = Date.now();
    updateElapsedTime();
  }

  reset();

  return {
    game,
    reset,
    revealCell,
    revealAroundNumber,
    toggleFlag,
    tick,
    updateElapsedTime
  };
}

module.exports = {
  createGameController
};
