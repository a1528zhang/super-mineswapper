const { COLS } = require('../config/game-config');

function hasWon(board, revealedCount, mineCount) {
  return revealedCount === board.length * COLS - mineCount;
}

function flagRemainingMines(board) {
  let addedFlags = 0;

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = board[row][col];
      if (cell.mine && !cell.flagged) {
        cell.flagged = true;
        addedFlags += 1;
      }
    }
  }

  return addedFlags;
}

module.exports = {
  hasWon,
  flagRemainingMines
};
