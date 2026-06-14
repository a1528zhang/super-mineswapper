const { GAME_STATES } = require('../config/game-config');
const { createBoard, floodReveal, forEachNeighbor, placeMines, revealAllMines } = require('./board');
const { flagRemainingMines, hasWon } = require('./victory');

function createGameController() {
  const game = {
    board: [],
    state: GAME_STATES.READY,
    revealedCount: 0,
    flaggedCount: 0,
    firstMove: true
  };

  function reset() {
    game.board = createBoard();
    game.state = GAME_STATES.READY;
    game.revealedCount = 0;
    game.flaggedCount = 0;
    game.firstMove = true;
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
      game.firstMove = false;
      game.state = GAME_STATES.PLAYING;
    }

    if (cell.mine) {
      cell.revealed = true;
      game.state = GAME_STATES.LOST;
      revealAllMines(game.board);
      return;
    }

    revealSafeCell(cell);
    checkWin();
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
        return;
      }
    }

    for (let i = 0; i < hiddenUnflaggedNeighbors.length; i += 1) {
      revealSafeCell(hiddenUnflaggedNeighbors[i]);
    }

    checkWin();
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

    if (game.state === GAME_STATES.READY) {
      game.state = GAME_STATES.PLAYING;
    }
  }

  function isFinished() {
    return game.state === GAME_STATES.WON || game.state === GAME_STATES.LOST;
  }

  function revealSafeCell(cell) {
    game.revealedCount += floodReveal(game.board, cell);
  }

  function checkWin() {
    if (hasWon(game.revealedCount)) {
      game.state = GAME_STATES.WON;
      game.flaggedCount += flagRemainingMines(game.board);
    }
  }

  reset();

  return {
    game,
    reset,
    revealCell,
    revealAroundNumber,
    toggleFlag
  };
}

module.exports = {
  createGameController
};
