const { COLS, MAX_ROWS } = require('../config/game-config');

function getLayout(viewportWidth, viewportHeight, rows) {
  const padding = 20;
  const top = 174;
  const rowCount = rows || MAX_ROWS;
  const maxBoardWidth = Math.min(viewportWidth - padding * 2, viewportHeight - top - 42);
  const maxCellWidth = Math.floor(maxBoardWidth / COLS);
  const maxCellHeight = Math.floor((viewportHeight - top - 42) / MAX_ROWS);
  const cellSize = Math.max(12, Math.min(maxCellWidth, maxCellHeight));
  const boardSize = cellSize * COLS;
  const boardHeight = cellSize * rowCount;
  const maxBoardHeight = cellSize * MAX_ROWS;
  const boardX = Math.floor((viewportWidth - boardSize) / 2);
  const boardY = top;

  return {
    padding,
    top,
    cellSize,
    boardSize,
    boardHeight,
    maxBoardHeight,
    boardX,
    boardY,
    timer: {
      x: boardX,
      y: boardY - 40,
      width: boardSize,
      height: 30
    },
    resetButton: {
      x: viewportWidth - padding - 88,
      y: 78,
      width: 88,
      height: 38
    },
    flagModeButton: {
      x: viewportWidth - padding - 184,
      y: 78,
      width: 88,
      height: 38
    }
  };
}

function getCellFromPoint(layout, x, y) {
  const { boardX, boardY, boardSize, boardHeight, cellSize } = layout;

  if (x < boardX || x >= boardX + boardSize || y < boardY || y >= boardY + boardHeight) {
    return null;
  }

  return {
    row: Math.floor((y - boardY) / cellSize),
    col: Math.floor((x - boardX) / cellSize)
  };
}

module.exports = {
  getLayout,
  getCellFromPoint
};
