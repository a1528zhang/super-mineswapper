const { DOUBLE_CLICK_MS, LONG_PRESS_MS } = require('../config/game-config');
const { isInsideRect } = require('../ui/draw-utils');
const { getCellFromPoint } = require('../ui/layout');

function createTouchController(options) {
  const { getLayout, onReset, onRevealAroundNumber, onRevealCell, onToggleFlag } = options;
  let touchStartTime = 0;
  let touchStartCell = null;
  let lastClickCell = null;
  let lastClickTime = 0;

  function handleTouchStart(event) {
    const point = getTouchPoint(event);
    if (!point) {
      touchStartCell = null;
      return;
    }

    touchStartTime = Date.now();
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

    if (isInsideRect(point, layout.resetButton)) {
      onReset();
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
