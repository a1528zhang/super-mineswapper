const { ROWS, COLS, MINES } = require('../config/game-config');
const { createCell } = require('../models/cell');

function createBoard() {
  const board = [];

  for (let row = 0; row < ROWS; row += 1) {
    const line = [];
    for (let col = 0; col < COLS; col += 1) {
      line.push(createCell(row, col));
    }
    board.push(line);
  }

  return board;
}

function forEachNeighbor(board, row, col, callback) {
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;
      if (nextRow >= 0 && nextRow < ROWS && nextCol >= 0 && nextCol < COLS) {
        callback(board[nextRow][nextCol]);
      }
    }
  }
}

function countAdjacentMines(board, row, col) {
  let total = 0;

  forEachNeighbor(board, row, col, (neighbor) => {
    if (neighbor.mine) {
      total += 1;
    }
  });

  return total;
}

function placeMines(board, safeRow, safeCol) {
  let placed = 0;

  while (placed < MINES) {
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);
    const cell = board[row][col];
    const isSafeCell = row === safeRow && col === safeCol;

    if (cell.mine || isSafeCell) {
      continue;
    }

    cell.mine = true;
    placed += 1;
  }

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      board[row][col].adjacent = countAdjacentMines(board, row, col);
    }
  }
}

function revealAllMines(board) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col].mine) {
        board[row][col].revealed = true;
      }
    }
  }
}

function floodReveal(board, startCell) {
  const queue = [startCell];
  let revealedCount = 0;

  while (queue.length > 0) {
    const cell = queue.shift();
    if (cell.revealed || cell.flagged) {
      continue;
    }

    cell.revealed = true;
    revealedCount += 1;

    if (cell.adjacent !== 0) {
      continue;
    }

    forEachNeighbor(board, cell.row, cell.col, (neighbor) => {
      if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
        queue.push(neighbor);
      }
    });
  }

  return revealedCount;
}

module.exports = {
  createBoard,
  placeMines,
  revealAllMines,
  floodReveal,
  forEachNeighbor
};
