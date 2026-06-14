const { GAME_STATES } = require('../config/game-config');

function getStatusText(state) {
  if (state === GAME_STATES.WON) {
    return '胜利！所有安全格都已打开';
  }

  if (state === GAME_STATES.LOST) {
    return '踩雷了，点击重开再试一次';
  }

  if (state === GAME_STATES.READY) {
    return '点击格子开始，长按可以插旗';
  }

  return '继续排雷，长按可插旗';
}

module.exports = {
  getStatusText
};
