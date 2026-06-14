const ROWS = 9;
const COLS = 9;
const MINES = 10;
const DOUBLE_CLICK_MS = 300;
const LONG_PRESS_MS = 450;

const GAME_STATES = {
  READY: 'ready',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost'
};

module.exports = {
  ROWS,
  COLS,
  MINES,
  DOUBLE_CLICK_MS,
  LONG_PRESS_MS,
  GAME_STATES
};
