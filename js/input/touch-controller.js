const { DOUBLE_CLICK_MS, LONG_PRESS_MS } = require('../config/game-config');
const { isInsideRect } = require('../ui/draw-utils');
const { getCellFromPoint } = require('../ui/layout');

function createTouchController(options) {
  const {
    getFlagMode,
    getLayout,
    onGoHome,
    onReset,
    onRevealAroundNumber,
    onRevealCell,
    onShowRules,
    onToggleMusic,
    onToggleFlag,
    onToggleFlagMode
  } = options;
  let touchStartTime = 0;
  let touchStartCell = null;
  let touchStartPoint = null;
  let lastClickCell = null;
  let lastClickTime = 0;

  function handleTouchStart(event) {
    const point = getTouchPoint(event);
    if (!point) {
      touchStartCell = null;
      touchStartPoint = null;
      return;
    }

    touchStartTime = Date.now();
    touchStartPoint = point;
    touchStartCell = getCellFromPoint(getLayout(), point.x, point.y);
  }

  function handleTouchEnd(event) {
    const point = getTouchPoint(event);
    if (!point) {
      return;
    }

    const layout = getLayout();
    const duration = Date.now() - touchStartTime;
    const startCell = touchStartCell;
    const startPoint = touchStartPoint;

    if (isButtonTap(startPoint, point, layout.homeButton)) {
      if (onGoHome) {
        onGoHome();
      }
      clearLastClick();
      return;
    }

    if (isButtonTap(startPoint, point, layout.rulesButton)) {
      if (onShowRules) {
        onShowRules();
      }
      clearLastClick();
      return;
    }

    if (isButtonTap(startPoint, point, layout.musicButton)) {
      if (onToggleMusic) {
        onToggleMusic();
      }
      clearLastClick();
      return;
    }

    if (isButtonTap(startPoint, point, layout.resetButton)) {
      onReset();
      clearLastClick();
      return;
    }

    if (isButtonTap(startPoint, point, layout.flagModeButton)) {
      if (onToggleFlagMode) {
        onToggleFlagMode();
      }
      clearLastClick();
      return;
    }

    const endCell = getCellFromPoint(layout, point.x, point.y);
    if (!startCell || !endCell || startCell.row !== endCell.row || startCell.col !== endCell.col) {
      return;
    }

    if (duration >= LONG_PRESS_MS) {
      onToggleFlag(endCell.row, endCell.col);
      clearLastClick();
      return;
    }

    if (isDoubleClick(endCell)) {
      onRevealAroundNumber(endCell.row, endCell.col);
      clearLastClick();
      return;
    }

    if (getFlagMode && getFlagMode()) {
      onToggleFlag(endCell.row, endCell.col);
      lastClickCell = endCell;
      lastClickTime = Date.now();
      return;
    }

    onRevealCell(endCell.row, endCell.col);
    lastClickCell = endCell;
    lastClickTime = Date.now();
  }

  function isDoubleClick(cell) {
    return (
      lastClickCell &&
      Date.now() - lastClickTime <= DOUBLE_CLICK_MS &&
      lastClickCell.row === cell.row &&
      lastClickCell.col === cell.col
    );
  }

  function clearLastClick() {
    lastClickCell = null;
    lastClickTime = 0;
  }

  function isButtonTap(startPoint, endPoint, rect) {
    return isInsideRect(startPoint, rect) && isInsideRect(endPoint, rect);
  }

  return {
    handleTouchStart,
    handleTouchEnd
  };
}

function getTouchPoint(event) {
  const touch = getFirstTouch(event);

  if (touch) {
    return createPoint(touch);
  }

  return createPoint(event);
}

function getFirstTouch(event) {
  if (event.changedTouches && event.changedTouches[0]) {
    return event.changedTouches[0];
  }

  if (event.touches && event.touches[0]) {
    return event.touches[0];
  }

  return null;
}

function createPoint(source) {
  if (!source) {
    return null;
  }

  const x = source.clientX !== undefined ? source.clientX : source.x !== undefined ? source.x : source.pageX;
  const y = source.clientY !== undefined ? source.clientY : source.y !== undefined ? source.y : source.pageY;

  if (x === undefined || y === undefined) {
    return null;
  }

  return {
    x,
    y
  };
}

module.exports = {
  createTouchController
};
