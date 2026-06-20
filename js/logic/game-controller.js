const {
  GAME_STATES,
  MAX_ROWS,
  MIN_ROWS,
  MIN_NEW_ROW_INTERVAL_SECONDS,
  NEW_ROW_INTERVAL_SECONDS,
  ROW_CLEAR_ANIMATION_MS,
  DIFFICULTY_STEP_SECONDS,
  TIME_LIMIT_SECONDS,
  TIME_REWARD_CHANCE,
  TIME_REWARD_LIFETIME_SECONDS,
  TIME_REWARD_SECONDS,
  ROW_GROW_ANIMATION_MS
} = require('../config/game-config');
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
const { flagRemainingMines, hasWon } = require('./victory');

function createGameController() {
  const game = {
    board: [],
    state: GAME_STATES.READY,
    revealedCount: 0,
    flaggedCount: 0,
    score: 0,
    mineCount: 0,
    firstMove: true,
    flagMode: false,
    startTime: 0,
    finishedAt: 0,
    elapsedSeconds: 0,
    bonusSeconds: 0,
    remainingSeconds: TIME_LIMIT_SECONDS,
    growthIntervalSeconds: NEW_ROW_INTERVAL_SECONDS,
    nextGrowthAt: NEW_ROW_INTERVAL_SECONDS,
    stopReason: '',
    clearingRows: [],
    clearAnimationStartedAt: 0,
    clearAnimationDuration: ROW_CLEAR_ANIMATION_MS,
    growingRows: 0,
    growAnimationStartedAt: 0,
    growAnimationDuration: ROW_GROW_ANIMATION_MS
  };

  function reset() {
    game.board = createBoard();
    game.state = GAME_STATES.READY;
    game.revealedCount = 0;
    game.flaggedCount = 0;
    game.score = 0;
    game.mineCount = 0;
    game.firstMove = true;
    game.flagMode = false;
    game.startTime = 0;
    game.finishedAt = 0;
    game.elapsedSeconds = 0;
    game.bonusSeconds = 0;
    game.remainingSeconds = TIME_LIMIT_SECONDS;
    game.growthIntervalSeconds = NEW_ROW_INTERVAL_SECONDS;
    game.nextGrowthAt = NEW_ROW_INTERVAL_SECONDS;
    game.stopReason = '';
    game.clearingRows = [];
    game.clearAnimationStartedAt = 0;
    game.clearAnimationDuration = ROW_CLEAR_ANIMATION_MS;
    game.growingRows = 0;
    game.growAnimationStartedAt = 0;
    game.growAnimationDuration = ROW_GROW_ANIMATION_MS;
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
      game.stopReason = 'mine';
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
        game.stopReason = 'mine';
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
    if (cell.flagged && cell.timeReward) {
      cell.timeReward = false;
      cell.timeRewardCreatedAt = 0;
    }
    game.flaggedCount += cell.flagged ? 1 : -1;
    startRowClearAnimation();

    if (game.state === GAME_STATES.READY && !game.firstMove) {
      game.state = GAME_STATES.PLAYING;
      startTimer();
    }
  }

  function toggleFlagMode() {
    if (isFinished()) {
      return;
    }

    game.flagMode = !game.flagMode;
  }

  function updateElapsedTime() {
    if (!game.startTime) {
      game.elapsedSeconds = 0;
      return;
    }

    const endTime = game.finishedAt || Date.now();
    game.elapsedSeconds = Math.floor((endTime - game.startTime) / 1000);
    game.remainingSeconds = Math.max(0, TIME_LIMIT_SECONDS + game.bonusSeconds - game.elapsedSeconds);
    game.growthIntervalSeconds = getGrowthIntervalSeconds(game.elapsedSeconds);
  }

  function tick() {
    updateElapsedTime();
    expireTimeRewards();
    commitFinishedRowClearAnimation();
    commitFinishedRowGrowAnimation();

    if (game.state !== GAME_STATES.PLAYING) {
      return;
    }

    if (game.remainingSeconds <= 0) {
      game.state = GAME_STATES.LOST;
      game.stopReason = 'timeout';
      revealAllMines(game.board);
      stopTimer();
      return;
    }

    fillMinimumRows();

    while (game.elapsedSeconds >= game.nextGrowthAt && game.state === GAME_STATES.PLAYING) {
      addAnimatedGrowthRow();
      game.mineCount = countMines(game.board);
      game.flaggedCount = countFlags(game.board);
      game.revealedCount = countRevealedSafeCells(game.board);
      game.nextGrowthAt += getGrowthIntervalSeconds(game.nextGrowthAt);
      checkOverflowLoss();
    }
  }

  function fillMinimumRows() {
    let addedRows = 0;

    while (game.board.length < MIN_ROWS && game.state === GAME_STATES.PLAYING) {
      addAnimatedGrowthRow();
      addedRows += 1;
      checkOverflowLoss();
    }

    if (addedRows > 0) {
      syncCounts();
    }
  }

  function isFinished() {
    return game.state === GAME_STATES.WON || game.state === GAME_STATES.LOST;
  }

  function revealSafeCell(cell) {
    const revealedCells = floodReveal(game.board, cell);
    game.revealedCount += revealedCells.length;
    collectTimeRewards(revealedCells);
    spawnTimeRewards(revealedCells.length);
  }

  function collectTimeRewards(cells) {
    for (let i = 0; i < cells.length; i += 1) {
      const cell = cells[i];
      if (!cell.mine && cell.timeReward) {
        game.bonusSeconds += TIME_REWARD_SECONDS;
        cell.timeReward = false;
        cell.timeRewardCreatedAt = 0;
      }
    }

    updateElapsedTime();
  }

  function expireTimeRewards() {
    const now = Date.now();
    const lifetimeMs = TIME_REWARD_LIFETIME_SECONDS * 1000;

    for (let row = 0; row < game.board.length; row += 1) {
      for (let col = 0; col < game.board[row].length; col += 1) {
        const cell = game.board[row][col];
        if (!cell.revealed && cell.timeReward && now - cell.timeRewardCreatedAt >= lifetimeMs) {
          cell.timeReward = false;
          cell.timeRewardCreatedAt = 0;
        }
      }
    }
  }

  function spawnTimeRewards(revealCount) {
    if (!revealCount) {
      return;
    }

    const now = Date.now();
    const spawnChance = 1 - Math.pow(1 - TIME_REWARD_CHANCE, revealCount);

    for (let row = 0; row < game.board.length; row += 1) {
      for (let col = 0; col < game.board[row].length; col += 1) {
        const cell = game.board[row][col];
        if (cell.revealed || cell.flagged || cell.timeReward) {
          continue;
        }

        if (Math.random() < spawnChance) {
          cell.timeReward = true;
          cell.timeRewardCreatedAt = now;
        }
      }
    }
  }

  function finishTurn() {
    startRowClearAnimation();

    if (hasWon(game.board, game.revealedCount, game.mineCount)) {
      game.state = GAME_STATES.WON;
      game.flaggedCount += flagRemainingMines(game.board);
      stopTimer();
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
    game.score += getScoreForClearedRows(rows.length);
    game.clearAnimationStartedAt = Date.now();
    game.clearAnimationDuration = ROW_CLEAR_ANIMATION_MS;
  }

  function getScoreForClearedRows(rowCount) {
    if (rowCount === 1) {
      return 1;
    }

    if (rowCount === 2) {
      return 3;
    }

    if (rowCount === 3) {
      return 5;
    }

    return 5 + rowCount * 2;
  }

  function getGrowthIntervalSeconds(elapsedSeconds) {
    const difficultySteps = Math.floor((elapsedSeconds || 0) / DIFFICULTY_STEP_SECONDS);
    return Math.max(MIN_NEW_ROW_INTERVAL_SECONDS, NEW_ROW_INTERVAL_SECONDS - difficultySteps);
  }

  function addAnimatedGrowthRow() {
    addGrowthRow(game.board);
    startRowGrowAnimation(1);
  }

  function startRowGrowAnimation(rowCount) {
    game.growingRows += rowCount;
    game.growAnimationStartedAt = Date.now();
    game.growAnimationDuration = ROW_GROW_ANIMATION_MS;
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

  function commitFinishedRowGrowAnimation() {
    if (!game.growingRows) {
      return;
    }

    const elapsed = Date.now() - game.growAnimationStartedAt;
    if (elapsed < game.growAnimationDuration) {
      return;
    }

    game.growingRows = 0;
    game.growAnimationStartedAt = 0;
  }

  function syncCounts() {
    game.mineCount = countMines(game.board);
    game.flaggedCount = countFlags(game.board);
    game.revealedCount = countRevealedSafeCells(game.board);
  }

  function checkOverflowLoss() {
    if (game.board.length >= MAX_ROWS) {
      game.state = GAME_STATES.LOST;
      game.stopReason = 'overflow';
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
    toggleFlagMode,
    tick,
    updateElapsedTime
  };
}

module.exports = {
  createGameController
};
