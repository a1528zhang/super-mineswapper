const IMAGE_SOURCES = {
  titleIcon: 'super-minesweeper-icon.png',
  covered: 'assets/img/covered.png',
  empty: 'assets/img/empty.png',
  mine: 'assets/img/mine.png',
  flag: 'assets/img/flag.png',
  score: 'assets/img/sparkle.png',
  skull: 'assets/img/skull.png',
  time: 'assets/img/time.png',
  number1: 'assets/img/number_1.png',
  number2: 'assets/img/number_2.png',
  number3: 'assets/img/number_3.png',
  number4: 'assets/img/number_4.png',
  number5: 'assets/img/number_5.png',
  number6: 'assets/img/number_6.png',
  number7: 'assets/img/number_7.png',
  number8: 'assets/img/number_8.png'
};

const imageCache = {};

function getImage(name) {
  if (imageCache[name]) {
    return imageCache[name];
  }

  const src = IMAGE_SOURCES[name];
  if (!src || typeof wx === 'undefined' || !wx.createImage) {
    return null;
  }

  const image = wx.createImage();
  image.src = src;
  imageCache[name] = image;
  return image;
}

function drawImageIcon(ctx, name, centerX, centerY, size) {
  const image = getImage(name);
  if (!image || !image.width || !image.height) {
    return false;
  }

  drawImageContained(ctx, image, centerX, centerY, size, size);
  return true;
}

function drawImageRect(ctx, name, centerX, centerY, maxWidth, maxHeight) {
  const image = getImage(name);
  if (!image || !image.width || !image.height) {
    return false;
  }

  drawImageContained(ctx, image, centerX, centerY, maxWidth, maxHeight);
  return true;
}

function drawImageContained(ctx, image, centerX, centerY, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  ctx.drawImage(image, centerX - width / 2, centerY - height / 2, width, height);
}

module.exports = {
  drawImageIcon,
  drawImageRect
};
