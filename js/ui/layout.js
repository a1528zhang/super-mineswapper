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
  const headerButtonY = 34;
  const headerButtonSize = 32;
  const headerButtonGap = 8;
  const headerButtonX = padding - 6;
  const actionButtonSize = headerButtonSize;
  const flagModeButtonWidth = 72;
  const actionButtonY = 82;
  const modalWidth = Math.min(viewportWidth - padding * 2, 336);
  const modalHeight = Math.min(viewportHeight - 100, 436);
  const modalX = Math.floor((viewportWidth - modalWidth) / 2);
  const modalY = Math.floor((viewportHeight - modalHeight) / 2);

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
    statusBar: {
      x: padding,
      y: 34,
      width: viewportWidth - padding * 2,
      height: 32
    },
    homeButton: {
      x: headerButtonX + headerButtonSize + headerButtonGap,
      y: headerButtonY,
      width: headerButtonSize,
      height: headerButtonSize
    },
    rulesButton: {
      x: headerButtonX + (headerButtonSize + headerButtonGap) * 2,
      y: headerButtonY,
      width: headerButtonSize,
      height: headerButtonSize
    },
    musicButton: {
      x: headerButtonX,
      y: headerButtonY,
      width: headerButtonSize,
      height: headerButtonSize
    },
    rulesModal: {
      x: modalX,
      y: modalY,
      width: modalWidth,
      height: modalHeight
    },
    rulesCloseButton: {
      x: modalX + modalWidth - 45,
      y: modalY + 12,
      width: 32,
      height: 32
    },
    resetButton: {
      x: viewportWidth - padding - actionButtonSize,
      y: actionButtonY,
      width: actionButtonSize,
      height: actionButtonSize
    },
    flagModeButton: {
      x: viewportWidth - padding - actionButtonSize - headerButtonGap - flagModeButtonWidth,
      y: actionButtonY,
      width: flagModeButtonWidth,
      height: actionButtonSize
    },
    startButton: {
      x: Math.floor((viewportWidth - 172) / 2),
      y: Math.floor(viewportHeight * 0.72),
      width: 172,
      height: 48
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
