const {
  COLS,
  MAX_ROWS
} = require('../config/game-config');
const { drawCell } = require('./cell-view');
const { roundRect } = require('./draw-utils');
const { drawImageIcon, drawImageRect } = require('./image-assets');
const { getLayout } = require('./layout');

const RULE_LINES = [
  '1. 点击格子翻开，首次点击不会踩雷。',
  '2. 长按格子可以插旗；也可以点“插旗”切换插旗模式。',
  '3. 双击已翻开的数字，周围旗子数量正确时会自动展开。',
  '4. 一整行安全格都翻开，且剩余旗子都插在雷上时，该行会消失并得分。',
  '5. 倒计时归零、踩到雷，或地图长到死线都会失败。',
  '6. 部分格子会出现时间奖励，及时翻开可增加剩余时间。'
];

function createRenderer(ctx, viewportWidth, viewportHeight) {
  let layout = getLayout(viewportWidth, viewportHeight, MAX_ROWS);

  function draw(game, options) {
    layout = getLayout(viewportWidth, viewportHeight, game.board.length || MAX_ROWS);
    drawBackground();
    if (options && options.showTitle) {
      drawTitleScreen();
      if (options.showRules) {
        drawRulesModal();
      }
      return layout;
    }

    drawHeader(game, options || {});
    drawTimer(game);
    drawBoard(game);
    drawDeadline();
    if (options && options.showRules) {
      drawRulesModal();
    }
    return layout;
  }

  function drawBackground() {
    ctx.fillStyle = '#edf2f7';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 14, 18, viewportWidth - 28, viewportHeight - 36, 8);
    ctx.fill();
  }

  function drawTitleScreen() {
    const { startButton } = layout;
    const centerX = viewportWidth / 2;
    const titleY = Math.max(78, viewportHeight * 0.12);
    const iconSize = Math.min(238, viewportWidth - 104, viewportHeight * 0.3);
    const iconY = Math.max(218, viewportHeight * 0.38);

    drawTitleBackground();
    drawTitleDecorations(centerX, iconY, iconSize);
    drawTitleLogo(centerX, titleY);
    drawTitleIconCard(centerX, iconY, iconSize);
    drawStartButton(startButton);
  }

  function drawTitleBackground() {
    ctx.save();
    ctx.fillStyle = '#fbf7ee';
    roundRect(ctx, 14, 18, viewportWidth - 28, viewportHeight - 36, 8);
    ctx.fill();

    ctx.globalAlpha = 0.42;
    ctx.fillStyle = '#efe4cf';
    ctx.translate(viewportWidth * 0.5, viewportHeight * 0.55);
    ctx.rotate(-0.22);
    roundRect(ctx, -viewportWidth * 0.58, -34, viewportWidth * 1.16, 68, 20);
    ctx.fill();
    ctx.restore();
  }

  function drawTitleDecorations(centerX, iconY, iconSize) {
    drawFloatingIcon('mine', viewportWidth * 0.17, viewportHeight * 0.24, 34, -0.14);
    drawFloatingIcon('flag', viewportWidth * 0.83, viewportHeight * 0.25, 34, 0.13);
    drawFloatingIcon('score', viewportWidth * 0.18, viewportHeight * 0.63, 31, 0.12);
    drawFloatingIcon('time', viewportWidth * 0.82, viewportHeight * 0.62, 33, -0.1);

    drawMiniTile(viewportWidth * 0.2, viewportHeight * 0.78, 'number1', -0.08);
    drawMiniTile(viewportWidth * 0.8, viewportHeight * 0.78, 'number2', 0.08);
    drawMiniTile(viewportWidth * 0.12, iconY + iconSize * 0.16, 'number3', 0.1);
    drawMiniTile(viewportWidth * 0.88, iconY + iconSize * 0.14, 'number4', -0.1);
  }

  function drawFloatingIcon(name, centerX, centerY, size, rotation) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.globalAlpha = 0.95;
    if (!drawImageIcon(ctx, name, 0, 0, size)) {
      ctx.fillStyle = '#d8cdb7';
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMiniTile(centerX, centerY, imageName, rotation) {
    const size = 42;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.globalAlpha = 0.9;
    drawImageIcon(ctx, imageName, 0, 0, size);
    ctx.restore();
  }

  function drawTitleIconCard(centerX, iconY, iconSize) {
    const cardPadding = 14;
    const cardSize = iconSize + cardPadding * 2;

    ctx.save();
    ctx.shadowColor = 'rgba(100, 80, 48, 0.18)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, centerX - cardSize / 2, iconY - cardSize / 2, cardSize, cardSize, 28);
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, centerX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize, 26);
    ctx.clip();
    if (!drawImageRect(ctx, 'titleIcon', centerX, iconY, iconSize, iconSize)) {
      ctx.fillStyle = '#6b5f4a';
      ctx.font = '700 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('超级扫雷', centerX, iconY);
    }
    ctx.restore();
  }

  function drawTitleLogo(centerX, y) {
    ctx.save();
    ctx.translate(centerX, y);
    ctx.rotate(-0.035);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 42px sans-serif';
    ctx.lineJoin = 'round';

    ctx.shadowColor = 'rgba(120, 53, 15, 0.32)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    ctx.strokeStyle = '#8a4b16';
    ctx.lineWidth = 8;
    ctx.strokeText('超级扫雷', 0, 0);

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#ff4d2e';
    ctx.fillText('超级扫雷', 3, 3);

    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.strokeText('超级扫雷', 0, 0);

    ctx.fillStyle = '#ff8c1a';
    ctx.fillText('超级扫雷', 0, 0);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.font = '900 17px sans-serif';
    ctx.fillText('SUPER MINESWEEPER', 0, 34);
    drawTitleSpark(-104, -24, 7);
    drawTitleSpark(108, -18, 6);
    drawTitleSpark(82, 24, 4);
    ctx.restore();
  }

  function drawTitleSpark(x, y, size) {
    ctx.save();
    ctx.fillStyle = '#fff3a3';
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.32, y - size * 0.32);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size * 0.32, y + size * 0.32);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.32, y + size * 0.32);
    ctx.lineTo(x - size, y);
    ctx.lineTo(x - size * 0.32, y - size * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawStartButton(button) {
    ctx.save();
    ctx.shadowColor = 'rgba(199, 134, 30, 0.28)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 7;
    drawHeaderButton(button, '#ffe08a', '#c7861e');
    ctx.restore();

    ctx.fillStyle = '#713f12';
    ctx.font = '700 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('开始游戏', button.x + button.width / 2, button.y + button.height / 2 + 1);
  }

  function drawHeader(game, options) {
    const { flagModeButton, homeButton, musicButton, resetButton, rulesButton } = layout;

    drawHomeButton(homeButton);
    drawRulesButton(rulesButton);
    drawMusicButton(musicButton, options.musicEnabled !== false);
    drawInfoPills(game);

    drawFlagModeButton(flagModeButton, game.flagMode);
    drawResetButton(resetButton);
  }

  function drawHomeButton(button) {
    drawHeaderButton(button, '#e9f1f7', '#b5c5d0');

    drawButtonImageIcon(button, 'exit') || drawBackIcon(button, '#334155');
  }

  function drawRulesButton(button) {
    drawHeaderButton(button, '#f3ead7', '#d8cdb7');

    drawButtonImageIcon(button, 'help') || drawQuestionIcon(button, '#6b5f4a');
  }

  function drawMusicButton(button, enabled) {
    drawHeaderButton(button, enabled ? '#dcfce7' : '#fee2e2', enabled ? '#86efac' : '#fecaca');

    drawButtonImageIcon(button, 'volume') || drawSoundIcon(button, enabled);
  }

  function drawFlagModeButton(button, active) {
    drawHeaderButton(button, active ? '#ffe08a' : '#f3ead7', active ? '#c7861e' : '#cdbf9e');

    const iconSize = 18;
    const text = active ? '插旗中' : '插旗';
    const textWidth = measureButtonText(text);
    const contentWidth = iconSize + 5 + textWidth;
    const iconCenterX = button.x + (button.width - contentWidth) / 2 + iconSize / 2;
    const centerY = button.y + button.height / 2;

    drawImageIcon(ctx, 'flag', iconCenterX, centerY, iconSize);

    ctx.fillStyle = active ? '#713f12' : '#334155';
    ctx.font = '700 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, iconCenterX + iconSize / 2 + 5 + textWidth / 2, centerY + 1);
  }

  function drawResetButton(button) {
    drawHeaderButton(button, '#e9f1f7', '#b5c5d0');

    drawButtonImageIcon(button, 'repeat') || drawReplayIcon(button, '#334155');
  }

  function drawHeaderButton(button, fill, stroke) {
    ctx.fillStyle = fill;
    roundRect(ctx, button.x, button.y, button.width, button.height, 8);
    ctx.fill();

    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    roundRect(ctx, button.x + 1, button.y + 1, button.width - 2, button.height - 2, 7);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    roundRect(ctx, button.x + 5, button.y + 4, button.width - 10, 9, 5);
    ctx.fill();
  }

  function drawButtonImageIcon(button, imageName) {
    const centerX = button.x + button.width / 2;
    const centerY = button.y + button.height / 2;
    const iconSize = Math.min(button.width, button.height) - 10;

    return drawImageIcon(ctx, imageName, centerX, centerY, iconSize);
  }

  function drawBackIcon(button, color) {
    const centerX = button.x + button.width / 2;
    const centerY = button.y + button.height / 2;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX + 6, centerY - 8);
    ctx.lineTo(centerX - 5, centerY);
    ctx.lineTo(centerX + 6, centerY + 8);
    ctx.stroke();
    ctx.restore();
  }

  function drawQuestionIcon(button, color) {
    const centerX = button.x + button.width / 2;
    const centerY = button.y + button.height / 2;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = '900 19px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', centerX, centerY + 1);
    ctx.restore();
  }

  function drawSoundIcon(button, enabled) {
    const color = enabled ? '#166534' : '#991b1b';
    const centerX = button.x + button.width / 2;
    const centerY = button.y + button.height / 2;

    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY - 4);
    ctx.lineTo(centerX - 6, centerY - 4);
    ctx.lineTo(centerX, centerY - 9);
    ctx.lineTo(centerX, centerY + 9);
    ctx.lineTo(centerX - 6, centerY + 4);
    ctx.lineTo(centerX - 10, centerY + 4);
    ctx.closePath();
    ctx.fill();

    if (enabled) {
      ctx.beginPath();
      ctx.arc(centerX + 2, centerY, 6, -0.72, 0.72);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX + 3, centerY, 10, -0.66, 0.66);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(centerX + 5, centerY - 6);
      ctx.lineTo(centerX + 13, centerY + 6);
      ctx.moveTo(centerX + 13, centerY - 6);
      ctx.lineTo(centerX + 5, centerY + 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawReplayIcon(button, color) {
    const centerX = button.x + button.width / 2;
    const centerY = button.y + button.height / 2;
    const radius = Math.min(button.width, button.height) * 0.25;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -0.22, Math.PI * 1.55);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + radius - 1, centerY - radius - 4);
    ctx.lineTo(centerX + radius + 8, centerY - radius - 1);
    ctx.lineTo(centerX + radius + 2, centerY + radius * 0.38);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function measureButtonText(text) {
    ctx.save();
    ctx.font = '700 15px sans-serif';
    const width = ctx.measureText(text).width;
    ctx.restore();
    return width;
  }

  function drawInfoPills(game) {
    const { flagModeButton, padding } = layout;
    const items = [
      { icon: 'mine', value: game.mineCount },
      { icon: 'flag', value: game.flaggedCount },
      { icon: 'score', value: game.score }
    ];
    const gap = 14;
    let x = padding;
    const y = flagModeButton.y + (flagModeButton.height - 28) / 2;

    for (let i = 0; i < items.length; i += 1) {
      const width = getInfoItemWidth(items[i]);
      drawInfoPill(x, y, width, items[i]);
      x += width + gap;
    }
  }

  function getInfoItemWidth(item) {
    ctx.save();
    ctx.font = '700 15px sans-serif';
    const iconSize = item.icon === 'flag' ? 21 : 20;
    const valueText = String(item.value);
    const valueSlotWidth = Math.max(ctx.measureText('000').width, ctx.measureText(valueText).width);
    ctx.restore();
    return iconSize + 6 + valueSlotWidth;
  }

  function drawInfoPill(x, y, width, item) {
    ctx.fillStyle = '#334155';
    ctx.font = '700 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const iconSize = item.icon === 'flag' ? 21 : 20;
    const valueText = String(item.value);
    const valueWidth = ctx.measureText(valueText).width;
    const valueSlotWidth = Math.max(ctx.measureText('000').width, valueWidth);
    const iconCenterX = x + iconSize / 2;
    const textCenterX = x + iconSize + 6 + valueSlotWidth / 2;
    const centerY = y + 14;

    if (item.icon && drawImageIcon(ctx, item.icon, iconCenterX, centerY, iconSize)) {
      ctx.fillText(valueText, textCenterX, centerY + 1);
      return;
    }

    ctx.fillText(`${item.label || ''} ${valueText}`, x + width / 2, centerY + 1);
  }

  function drawTimer(game) {
    const { timer } = layout;

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatTime(game.remainingSeconds), timer.x + timer.width / 2, timer.y + timer.height / 2 + 1);
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
    const { boardX, boardY, boardSize, maxBoardHeight, cellSize } = layout;
    const clearAnimation = getClearAnimation(game);
    const growAnimation = getGrowAnimation(game);

    ctx.fillStyle = '#d8cdb7';
    roundRect(ctx, boardX - 4, boardY - 4, boardSize + 8, maxBoardHeight + 8, 8);
    ctx.fill();

    for (let row = 0; row < game.board.length; row += 1) {
      const drawY = boardY + row * cellSize +
        getGrowRowOffset(row, growAnimation, cellSize) +
        getClearRowOffset(row, clearAnimation, cellSize);
      const alpha = getGrowRowAlpha(row, growAnimation) * getClearRowAlpha(row, clearAnimation);
      ctx.save();
      ctx.globalAlpha = alpha;

      for (let col = 0; col < COLS; col += 1) {
        drawCell(ctx, game.board[row][col], boardX + col * cellSize, drawY, cellSize);
      }

      ctx.restore();
    }
  }

  function getGrowAnimation(game) {
    if (!game.growingRows) {
      return null;
    }

    const elapsed = Date.now() - game.growAnimationStartedAt;
    const duration = game.growAnimationDuration || 1;
    const progress = Math.min(1, Math.max(0, elapsed / duration));

    return {
      progress: easeOutCubic(progress),
      fadeProgress: easeOutCubic(progress),
      rowCount: game.growingRows
    };
  }

  function drawDeadline() {
    const { boardX, boardY, boardSize, maxBoardHeight } = layout;
    const y = boardY + maxBoardHeight;

    ctx.save();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    if (ctx.setLineDash) {
      ctx.setLineDash([9, 8]);
    }

    ctx.beginPath();
    ctx.moveTo(boardX, y + 0.5);
    ctx.lineTo(boardX + boardSize, y + 0.5);
    ctx.stroke();

    if (ctx.setLineDash) {
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  function drawRulesModal() {
    const { rulesCloseButton, rulesModal } = layout;
    const modalPadding = 22;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.46)';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#fffaf0';
    roundRect(ctx, rulesModal.x, rulesModal.y, rulesModal.width, rulesModal.height, 14);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#d8cdb7';
    ctx.lineWidth = 2;
    roundRect(ctx, rulesModal.x + 1, rulesModal.y + 1, rulesModal.width - 2, rulesModal.height - 2, 13);
    ctx.stroke();

    ctx.fillStyle = '#713f12';
    ctx.font = '900 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('玩法说明', rulesModal.x + modalPadding, rulesModal.y + 31);

    drawCloseButton(rulesCloseButton);
    drawRuleLines(
      RULE_LINES,
      rulesModal.x + modalPadding,
      rulesModal.y + 72,
      rulesModal.width - modalPadding * 2,
      rulesModal.height - 96
    );
    ctx.restore();
  }

  function drawCloseButton(button) {
    drawHeaderButton(button, '#e9f1f7', '#b5c5d0');

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(button.x + 10, button.y + 10);
    ctx.lineTo(button.x + button.width - 10, button.y + button.height - 10);
    ctx.moveTo(button.x + button.width - 10, button.y + 10);
    ctx.lineTo(button.x + 10, button.y + button.height - 10);
    ctx.stroke();
  }

  function drawRuleLines(lines, x, y, maxWidth, maxHeight) {
    ctx.fillStyle = '#334155';
    ctx.font = '700 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const lineHeight = 22;
    let cursorY = y;
    for (let i = 0; i < lines.length; i += 1) {
      const wrapped = wrapText(lines[i], maxWidth);
      for (let j = 0; j < wrapped.length; j += 1) {
        if (cursorY + lineHeight > y + maxHeight) {
          return;
        }
        ctx.fillText(wrapped[j], x, cursorY);
        cursorY += lineHeight;
      }
      cursorY += 8;
    }
  }

  function wrapText(text, maxWidth) {
    const lines = [];
    let line = '';

    for (let i = 0; i < text.length; i += 1) {
      const nextLine = line + text[i];
      if (line && ctx.measureText(nextLine).width > maxWidth) {
        lines.push(line);
        line = text[i];
        continue;
      }
      line = nextLine;
    }

    if (line) {
      lines.push(line);
    }

    return lines;
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

  function getGrowRowOffset(row, animation, cellSize) {
    if (!animation) {
      return 0;
    }

    const distance = animation.rowCount * cellSize;
    return -distance * (1 - animation.progress);
  }

  function getClearRowOffset(row, animation, cellSize) {
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

  function getGrowRowAlpha(row, animation) {
    if (!animation || row >= animation.rowCount) {
      return 1;
    }

    return animation.fadeProgress;
  }

  function getClearRowAlpha(row, animation) {
    if (!animation || !animation.rows[row]) {
      return 1;
    }

    return 1 - easeOutCubic(animation.progress);
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  return {
    draw,
    getLayout: () => layout
  };
}

module.exports = {
  createRenderer
};
