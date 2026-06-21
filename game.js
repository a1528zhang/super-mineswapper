const { createGameController } = require('./js/logic/game-controller');
const { createTouchController } = require('./js/input/touch-controller');
const { isInsideRect } = require('./js/ui/draw-utils');
const { createRenderer } = require('./js/ui/renderer');

const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

const systemInfo = wx.getSystemInfoSync();
const pixelRatio = systemInfo.pixelRatio || 1;
const viewportWidth = systemInfo.windowWidth;
const viewportHeight = systemInfo.windowHeight;

canvas.width = Math.floor(viewportWidth * pixelRatio);
canvas.height = Math.floor(viewportHeight * pixelRatio);
if (canvas.style) {
  canvas.style.width = `${viewportWidth}px`;
  canvas.style.height = `${viewportHeight}px`;
}
ctx.scale(pixelRatio, pixelRatio);

const gameController = createGameController();
const renderer = createRenderer(ctx, viewportWidth, viewportHeight);
const backgroundMusic = createBackgroundMusic();
let showTitleScreen = true;
let showRules = false;

function draw() {
  if (!showTitleScreen) {
    gameController.tick();
  }

  renderer.draw(gameController.game, {
    musicEnabled: backgroundMusic.isEnabled(),
    showTitle: showTitleScreen,
    showRules
  });
}

function resetGame() {
  showRules = false;
  showTitleScreen = false;
  gameController.reset();
  draw();
}

function startGame() {
  showRules = false;
  showTitleScreen = false;
  gameController.reset();
  draw();
}

function goHome() {
  showRules = false;
  showTitleScreen = true;
  draw();
}

function showRulesModal() {
  showRules = true;
  draw();
}

function hideRulesModal() {
  showRules = false;
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

function toggleMusic() {
  backgroundMusic.toggle();
  draw();
}

const touchController = createTouchController({
  getFlagMode: () => gameController.game.flagMode,
  getLayout: renderer.getLayout,
  onGoHome: goHome,
  onReset: resetGame,
  onRevealCell: revealCell,
  onRevealAroundNumber: revealAroundNumber,
  onShowRules: showRulesModal,
  onToggleMusic: toggleMusic,
  onToggleFlag: toggleFlag,
  onToggleFlagMode: toggleFlagMode
});

wx.onTouchStart(touchController.handleTouchStart);
wx.onTouchEnd(handleTouchEnd);
wx.onShow(handleShow);
wx.onHide(handleHide);

backgroundMusic.play();

function createBackgroundMusic() {
  if (!wx.createInnerAudioContext) {
    return {
      isEnabled() {
        return false;
      },
      play() {},
      pause() {},
      toggle() {}
    };
  }

  const audio = wx.createInnerAudioContext();
  audio.src = 'assets/music/mine.mp3';
  audio.loop = true;
  audio.volume = 0.55;
  audio.obeyMuteSwitch = false;
  let enabled = true;

  return {
    isEnabled() {
      return enabled;
    },
    play() {
      if (!enabled) {
        return;
      }
      audio.play();
    },
    pause() {
      audio.pause();
    },
    toggle() {
      enabled = !enabled;
      if (enabled) {
        audio.play();
        return;
      }
      audio.pause();
    }
  };
}

function handleShow() {
  backgroundMusic.play();
  draw();
}

function handleHide() {
  backgroundMusic.pause();
}

function handleTouchEnd(event) {
  const point = getTouchPoint(event);
  const layout = renderer.getLayout();

  if (showRules) {
    if (isInsideRect(point, layout.rulesCloseButton)) {
      hideRulesModal();
    }
    return;
  }

  if (showTitleScreen) {
    if (isInsideRect(point, layout.startButton)) {
      startGame();
    }
    return;
  }

  touchController.handleTouchEnd(event);
}

function getTouchPoint(event) {
  const touch = event && event.changedTouches && event.changedTouches[0];
  if (!touch) {
    return null;
  }

  return {
    x: touch.clientX !== undefined ? touch.clientX : touch.x,
    y: touch.clientY !== undefined ? touch.clientY : touch.y
  };
}

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
