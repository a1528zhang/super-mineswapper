const { createGameController } = require('./js/logic/game-controller');
const { createTouchController } = require('./js/input/touch-controller');
const { createRenderer } = require('./js/ui/renderer');

const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

const systemInfo = wx.getSystemInfoSync();
const pixelRatio = systemInfo.pixelRatio || 1;
const viewportWidth = systemInfo.windowWidth;
const viewportHeight = systemInfo.windowHeight;

canvas.width = Math.floor(viewportWidth * pixelRatio);
canvas.height = Math.floor(viewportHeight * pixelRatio);
canvas.style.width = `${viewportWidth}px`;
canvas.style.height = `${viewportHeight}px`;
ctx.scale(pixelRatio, pixelRatio);

const gameController = createGameController();
const renderer = createRenderer(ctx, viewportWidth, viewportHeight);

function draw() {
  gameController.tick();
  renderer.draw(gameController.game);
}

function resetGame() {
  gameController.reset();
  draw();
}

function revealCell(row, col) {
  gameController.revealCell(row, col);
  draw();
}

function toggleFlag(row, col) {
  gameController.toggleFlag(row, col);
  draw();
}

function toggleFlagMode() {
  gameController.toggleFlagMode();
  draw();
}

function revealAroundNumber(row, col) {
  gameController.revealAroundNumber(row, col);
  draw();
}

const touchController = createTouchController({
  getFlagMode: () => gameController.game.flagMode,
  getLayout: renderer.getLayout,
  onReset: resetGame,
  onRevealCell: revealCell,
  onRevealAroundNumber: revealAroundNumber,
  onToggleFlag: toggleFlag,
  onToggleFlagMode: toggleFlagMode
});

wx.onTouchStart(touchController.handleTouchStart);
wx.onTouchEnd(touchController.handleTouchEnd);
wx.onShow(draw);

function animate() {
  draw();
  scheduleNextFrame(animate);
}

function scheduleNextFrame(callback) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(callback);
    return;
  }

  setTimeout(callback, 16);
}

animate();
