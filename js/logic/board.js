const { COLS, INITIAL_ROWS, MINES, TIME_REWARD_CHANCE } = require('../config/game-config');
const { createCell } = require('../models/cell');

function createHiddenCell(row, col, now, withReward) {
  const cell = createCell(row, col);
  if (withReward && Math.random() < TIME_REWARD_CHANCE) {
    cell.timeReward = true;
    cell.timeRewardCreatedAt = now || Date.now();
  }
  return cell;
}

function createBoard(rows) {
  const rowCount = rows || INITIAL_ROWS;
  const board = [];
  const now = Date.now();

  for (let row = 0; row < rowCount; row += 1) {
    const line = [];
    for (let col = 0; col < COLS; col += 1) {
      line.push(createHiddenCell(row, col, now, false));
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
      if (nextRow >= 0 && nextRow < board.length && nextCol >= 0 && nextCol < COLS) {
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
  const mineCount = Math.min(MINES, board.length * COLS - 1);

  while (placed < mineCount) {
    const row = Math.floor(Math.random() * board.length);
    const col = Math.floor(Math.random() * COLS);
    const cell = board[row][col];
    const isSafeCell = row === safeRow && col === safeCol;

    if (cell.mine || isSafeCell) {
      continue;
    }

    cell.mine = true;
    placed += 1;
  }
  recalculateAdjacency(board);
}

function recalculateAdjacency(board) {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      board[row][col].row = row;
      board[row][col].col = col;
      board[row][col].adjacent = countAdjacentMines(board, row, col);
    }
  }
}

function revealAllMines(board) {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col].mine) {
        board[row][col].revealed = true;
      }
    }
  }
}

function createGrowthRow(board) {
  const row = [];
  const now = Date.now();
  for (let col = 0; col < COLS; col += 1) {
    row.push(createHiddenCell(0, col, now, true));
  }

  const mineCount = getGrowthMineCount(board);
  let placed = 0;
  while (placed < mineCount) {
    const col = Math.floor(Math.random() * COLS);
    if (row[col].mine) {
      continue;
    }

    row[col].mine = true;
    placed += 1;
  }

  return row;
}

function addGrowthRow(board) {
  board.unshift(createGrowthRow(board));
  recalculateAdjacency(board);
}

function findFullyRevealedSafeRows(board) {
  const rows = [];

  for (let row = 0; row < board.length; row += 1) {
    if (isFullyRevealedSafeRow(board[row])) {
      rows.push(row);
    }
  }

  return rows;
}

function removeRows(board, rowsToRemove) {
  if (!rowsToRemove || rowsToRemove.length === 0) {
    return 0;
  }

  const lookup = {};
  for (let i = 0; i < rowsToRemove.length; i += 1) {
    lookup[rowsToRemove[i]] = true;
  }

  let removedRows = 0;
  for (let row = board.length - 1; row >= 0; row -= 1) {
    if (lookup[row]) {
      board.splice(row, 1);
      removedRows += 1;
    }
  }

  if (removedRows) {
    recalculateAdjacency(board);
  }

  return removedRows;
}

function removeFullyRevealedSafeRows(board) {
  return removeRows(board, findFullyRevealedSafeRows(board));
}

function countMines(board) {
  let total = 0;

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col].mine) {
        total += 1;
      }
    }
  }

  return total;
}

function countRevealedSafeCells(board) {
  let total = 0;

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = board[row][col];
      if (cell.revealed && !cell.mine) {
        total += 1;
      }
    }
  }

  return total;
}

function countFlags(board) {
  let total = 0;

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col].flagged) {
        total += 1;
      }
    }
  }

  return total;
}

function getGrowthMineCount(board) {
  const mineRatio = Math.max(1, Math.round(MINES / INITIAL_ROWS));
  const maxMines = COLS - 1;
  return Math.min(maxMines, mineRatio + Math.floor(Math.random() * 2));
}

function isFullyRevealedSafeRow(row) {
  for (let col = 0; col < row.length; col += 1) {
    const cell = row[col];

    if (cell.mine) {
      if (cell.revealed || !cell.flagged) {
        return false;
      }
      continue;
    }

    if (cell.flagged || !cell.revealed) {
      return false;
    }
  }

  return true;
}

function floodReveal(board, startCell) {
  const queue = [startCell];
  const revealedCells = [];

  while (queue.length > 0) {
    const cell = queue.shift();
    if (cell.revealed || cell.flagged) {
      continue;
    }

    cell.revealed = true;
    revealedCells.push(cell);

    if (cell.adjacent !== 0) {
      continue;
    }

    forEachNeighbor(board, cell.row, cell.col, (neighbor) => {
      if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
        queue.push(neighbor);
      }
    });
  }

  return revealedCells;
}

module.exports = {
  createBoard,
  addGrowthRow,
  countFlags,
  countMines,
  countRevealedSafeCells,
  findFullyRevealedSafeRows,
  placeMines,
  recalculateAdjacency,
  removeRows,
  removeFullyRevealedSafeRows,
  revealAllMines,
  floodReveal,
  forEachNeighbor
};
