const { COLS, MAX_ROWS, NEW_ROW_INTERVAL_SECONDS } = require('../config/game-config');
const { drawCell } = require('./cell-view');
const { roundRect } = require('./draw-utils');
const { getLayout } = require('./layout');
const { getStatusText } = require('./status-text');

function createRenderer(ctx, viewportWidth, viewportHeight) {
  let layout = getLayout(viewportWidth, viewportHeight, MAX_ROWS);

  function draw(game) {
    layout = getLayout(viewportWidth, viewportHeight, game.board.length || MAX_ROWS);
    drawBackground();
    drawHeader(game);
    drawTimer(game);
    drawBoard(game);
    drawHint();
    return layout;
  }

  function drawBackground() {
    ctx.fillStyle = '#edf2f7';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 14, 18, viewportWidth - 28, viewportHeight - 36, 8);
    ctx.fill();
  }

  function drawHeader(game) {
    const { resetButton, padding } = layout;

    ctx.fillStyle = '#162033';
    ctx.font = '700 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('超级扫雷', padding, 46);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText(getStatusText(game.state), padding, 82);

    drawInfoPill(padding, 102, `雷 ${game.mineCount}`);
    drawInfoPill(padding + 66, 102, `旗 ${game.flaggedCount}`);
    drawInfoPill(padding + 132, 102, `行 ${game.board.length}`);

    ctx.fillStyle = '#2563eb';
    roundRect(ctx, resetButton.x, resetButton.y, resetButton.width, resetButton.height, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('重开', resetButton.x + resetButton.width / 2, resetButton.y + resetButton.height / 2 + 1);
  }

  function drawInfoPill(x, y, text) {
    ctx.fillStyle = '#e2e8f0';
    roundRect(ctx, x, y, 56, 28, 8);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.font = '700 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 28, y + 15);
  }

  function drawTimer(game) {
    const { timer } = layout;

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatTime(game.elapsedSeconds), timer.x + timer.width / 2, timer.y + timer.height / 2 + 1);
  }

  function formatTime(seconds) {
    const value = Math.max(0, seconds || 0);
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const restSeconds = value % 60;

    return `${padTime(hours)}:${padTime(minutes)}:${padTime(restSeconds)}`;
  }

  function padTime(value) {
    return value < 10 ? `0${value}` : String(value);
  }

  function drawBoard(game) {
    const { boardX, boardY, boardSize, boardHeight, cellSize } = layout;
    const animation = getClearAnimation(game);

    ctx.fillStyle = '#94a3b8';
    roundRect(ctx, boardX - 4, boardY - 4, boardSize + 8, boardHeight + 8, 8);
    ctx.fill();

    for (let row = 0; row < game.board.length; row += 1) {
      const drawY = boardY + row * cellSize + getRowOffset(row, animation, cellSize);
      const alpha = getRowAlpha(row, animation);
      ctx.save();
      ctx.globalAlpha = alpha;

      for (let col = 0; col < COLS; col += 1) {
        drawCell(ctx, game.board[row][col], boardX + col * cellSize, drawY, cellSize);
      }

      ctx.restore();
    }
  }

  function getClearAnimation(game) {
    if (!game.clearingRows || game.clearingRows.length === 0) {
      return null;
    }

    const elapsed = Date.now() - game.clearAnimationStartedAt;
    const duration = game.clearAnimationDuration || 1;
    const progress = Math.min(1, Math.max(0, elapsed / duration));
    const rows = {};

    for (let i = 0; i < game.clearingRows.length; i += 1) {
      rows[game.clearingRows[i]] = true;
    }

    return {
      progress,
      rows,
      clearingRows: game.clearingRows
    };
  }

  function getRowOffset(row, animation, cellSize) {
    if (!animation) {
      return 0;
    }

    let clearedRowsAbove = 0;
    for (let i = 0; i < animation.clearingRows.length; i += 1) {
      if (animation.clearingRows[i] < row) {
        clearedRowsAbove += 1;
      }
    }

    return -clearedRowsAbove * cellSize * easeOutCubic(animation.progress);
  }

  function getRowAlpha(row, animation) {
    if (!animation || !animation.rows[row]) {
      return 1;
    }

    return 1 - easeOutCubic(animation.progress);
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function drawHint() {
    const { boardY, boardHeight } = layout;
    const y = boardY + boardHeight + 22;

    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`每 ${NEW_ROW_INTERVAL_SECONDS} 秒顶部增加一行，满 ${MAX_ROWS} 行失败`, viewportWidth / 2, y);
  }

  return {
    draw,
    getLayout: () => layout
  };
}

module.exports = {
  createRenderer
};
