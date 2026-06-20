const { roundRect } = require('./draw-utils');
const { drawImageIcon } = require('./image-assets');

function drawCell(ctx, cell, x, y, size) {
  const baseImageName = drawCellBase(ctx, cell, x, y, size);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (cell.revealed && cell.mine) {
    drawMine(ctx, x + size / 2, y + size / 2, size);
    return;
  }

  if (cell.revealed && cell.adjacent > 0) {
    if (baseImageName === `number${cell.adjacent}`) {
      return;
    }

    ctx.fillStyle = getNumberColor(cell.adjacent);
    ctx.font = `700 ${Math.floor(size * 0.46)}px sans-serif`;
    ctx.fillText(String(cell.adjacent), x + size / 2, y + size / 2 + 1);
    return;
  }

  if (cell.flagged) {
    drawFlag(ctx, x + size / 2, y + size / 2, size);
    return;
  }

  if (!cell.revealed && cell.timeReward) {
    drawTimeReward(ctx, x + size / 2, y + size / 2, size);
  }
}

function drawCellBase(ctx, cell, x, y, size) {
  const imageName = getCellBaseImageName(cell);
  if (imageName && drawImageIcon(ctx, imageName, x + size / 2, y + size / 2, size - 2)) {
    return imageName;
  }

  const gap = 2;
  const innerX = x + gap;
  const innerY = y + gap;
  const innerSize = size - gap * 2;

  if (cell.revealed) {
    ctx.fillStyle = cell.mine ? '#fca5a5' : '#f8fafc';
  } else {
    ctx.fillStyle = cell.flagged ? '#facc15' : '#38bdf8';
  }

  roundRect(ctx, innerX, innerY, innerSize, innerSize, 5);
  ctx.fill();
  return null;
}

function getCellBaseImageName(cell) {
  if (!cell.revealed) {
    return 'covered';
  }

  if (cell.mine) {
    return 'empty';
  }

  return cell.adjacent > 0 ? `number${cell.adjacent}` : 'empty';
}

function drawFlag(ctx, centerX, centerY, size) {
  if (drawImageIcon(ctx, 'flag', centerX, centerY, size * 0.66)) {
    return;
  }

  const poleHeight = size * 0.5;
  const poleX = centerX - size * 0.11;
  const poleTop = centerY - poleHeight * 0.5;

  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.beginPath();
  ctx.moveTo(poleX, poleTop);
  ctx.lineTo(poleX, poleTop + poleHeight);
  ctx.stroke();

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(poleX, poleTop);
  ctx.lineTo(poleX + size * 0.36, poleTop + size * 0.12);
  ctx.lineTo(poleX, poleTop + size * 0.24);
  ctx.closePath();
  ctx.fill();
}

function drawMine(ctx, centerX, centerY, size) {
  if (drawImageIcon(ctx, 'mine', centerX, centerY, size * 0.68)) {
    return;
  }

  const radius = size * 0.18;

  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = Math.max(2, size * 0.04);
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * size * 0.28, centerY + Math.sin(angle) * size * 0.28);
    ctx.stroke();
  }

  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

function drawTimeReward(ctx, centerX, centerY, size) {
  if (drawImageIcon(ctx, 'time', centerX, centerY, size * 0.78)) {
    return;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${Math.floor(size * 0.42)}px sans-serif`;
  ctx.fillText('+', centerX, centerY - size * 0.08);

  ctx.font = `700 ${Math.floor(size * 0.3)}px sans-serif`;
  ctx.fillText('10', centerX, centerY + size * 0.2);
}

function getNumberColor(number) {
  const colors = [
    '',
    '#2563eb',
    '#16a34a',
    '#dc2626',
    '#7c3aed',
    '#b45309',
    '#0891b2',
    '#334155',
    '#0f172a'
  ];
  return colors[number] || '#0f172a';
}

module.exports = {
  drawCell
};
