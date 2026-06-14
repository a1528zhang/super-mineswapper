const { COLS } = require('../config/game-config');

function getLayout(viewportWidth, viewportHeight) {
  const padding = 20;
  const top = 154;
  const maxBoardWidth = Math.min(viewportWidth - padding * 2, viewportHeight - top - 42);
  const cellSize = Math.floor(maxBoardWidth / COLS);
  const boardSize = cellSize * COLS;
  const boardX = Math.floor((viewportWidth - boardSize) / 2);
  const boardY = top;

  return {
    padding,
    top,
    cellSize,
    boardSize,
    boardX,
    boardY,
    resetButton: {
      x: viewportWidth - padding - 88,
      y: 78,
      width: 88,
      height: 38
    }
  };
}

function getCellFromPoint(layout, x, y) {
  const { boardX, boardY, boardSize, cellSize } = layout;

  if (x < boardX || x >= boardX + boardSize || y < boardY || y >= boardY + boardSize) {
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
