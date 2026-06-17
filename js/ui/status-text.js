const { GAME_STATES } = require('../config/game-config');

function getStatusText(state, stopReason, score) {
  if (state === GAME_STATES.WON) {
    return `胜利！最终分数 ${formatScore(score)}`;
  }

  if (state === GAME_STATES.LOST) {
    if (stopReason === 'timeout') {
      return `时间耗尽，最终分数 ${formatScore(score)}`;
    }

    if (stopReason === 'overflow') {
      return `地图已满，最终分数 ${formatScore(score)}`;
    }

    return `踩雷了，最终分数 ${formatScore(score)}`;
  }

  if (state === GAME_STATES.READY) {
    return '点击格子开始，长按可以插旗';
  }

  return '继续排雷，长按可插旗';
}

function formatScore(score) {
  return score || 0;
}

module.exports = {
  getStatusText
};
