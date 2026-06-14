const { ROWS, COLS, MINES } = require('../config/game-config');
const { drawCell } = require('./cell-view');
const { roundRect } = require('./draw-utils');
const { getLayout } = require('./layout');
const { getStatusText } = require('./status-text');

function createRenderer(ctx, viewportWidth, viewportHeight) {
  let layout = getLayout(viewportWidth, viewportHeight);

  function draw(game) {
    layout = getLayout(viewportWidth, viewportHeight);
    drawBackground();
    drawHeader(game);
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

    drawInfoPill(padding, 102, `雷 ${MINES}`);
    drawInfoPill(padding + 78, 102, `旗 ${game.flaggedCount}`);

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
    roundRect(ctx, x, y, 66, 28, 8);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.font = '700 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 33, y + 15);
  }

  function drawBoard(game) {
    const { boardX, boardY, boardSize, cellSize } = layout;

    ctx.fillStyle = '#94a3b8';
    roundRect(ctx, boardX - 4, boardY - 4, boardSize + 8, boardSize + 8, 8);
    ctx.fill();

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        drawCell(ctx, game.board[row][col], boardX + col * cellSize, boardY + row * cellSize, cellSize);
      }
    }
  }

  function drawHint() {
    const { boardY, boardSize } = layout;
    const y = boardY + boardSize + 28;

    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('点击打开格子，长按插旗，双击数字自动展开', viewportWidth / 2, y);
  }

  return {
    draw,
    getLayout: () => layout
  };
}

module.exports = {
  createRenderer
};
