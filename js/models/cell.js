function createCell(row, col) {
  return {
    row,
    col,
    mine: false,
    revealed: false,
    flagged: false,
    adjacent: 0,
    timeReward: false,
    timeRewardCreatedAt: 0
  };
}

module.exports = {
  createCell
};
