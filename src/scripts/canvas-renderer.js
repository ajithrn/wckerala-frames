/**
 * Creates a rounded rectangle path.
 */
export function drawRoundedPath(ctx, x, y, width, height, radius = 0) {
  const r = Math.min(radius || 0, width / 2, height / 2);
  if (r <= 0) {
    ctx.rect(x, y, width, height);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/**
 * Draws and clips an image within an area applying crop zoom and pan offsets.
 */
export function drawFittedImage(ctx, image, area, mode = 'cover', crop = { zoom: 1, x: 0, y: 0 }) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;

  const baseFit = mode === 'contain'
    ? Math.min(area.width / imageWidth, area.height / imageHeight)
    : Math.max(area.width / imageWidth, area.height / imageHeight);

  const scale = baseFit * (mode === 'contain' ? 0.82 : crop.zoom);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;

  const allowOffset = mode !== 'contain';
  const maxOffsetX = allowOffset ? Math.max(0, (drawWidth - area.width) / 2) : 0;
  const maxOffsetY = allowOffset ? Math.max(0, (drawHeight - area.height) / 2) : 0;

  const drawX = area.x + (area.width - drawWidth) / 2 + crop.x * maxOffsetX;
  const drawY = area.y + (area.height - drawHeight) / 2 + crop.y * maxOffsetY;

  ctx.save();
  ctx.beginPath();
  drawRoundedPath(ctx, area.x, area.y, area.width, area.height, area.radius || 0);
  ctx.clip();
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

/**
 * Renders centered multiline text and returns the next vertical Y position.
 */
export function renderMultilineText(ctx, text, { centerX, y, font, color = '#000000', maxWidth, lineHeight }) {
  if (!text || !text.trim()) return y;

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const words = text.trim().split(/\s+/);
  let currentLine = '';
  let currentY = y;

  words.forEach((word, index) => {
    const candidateLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(candidateLine).width > maxWidth && index > 0) {
      ctx.fillText(currentLine, centerX, currentY);
      currentLine = word;
      currentY += lineHeight;
    } else {
      currentLine = candidateLine;
    }
  });

  ctx.fillText(currentLine, centerX, currentY);
  return currentY + lineHeight;
}

/**
 * Loads an image from a URL as an HTMLImageElement.
 */
export function loadImage(src, crossOrigin = false) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image from: ${src}`));
    image.src = src;
    if (image.complete && image.naturalWidth > 0) resolve(image);
  });
}

/**
 * Preloads canvas typography with a timeout fallback.
 */
export async function ensureFonts(fontSpecs, timeoutMs = 1200) {
  if (!document.fonts || typeof document.fonts.load !== 'function') return;
  try {
    const fontPromises = fontSpecs.map((spec) => document.fonts.load(spec));
    await Promise.race([
      Promise.all(fontPromises),
      new Promise((resolve) => setTimeout(resolve, timeoutMs))
    ]);
  } catch {}
}

/**
 * Renders the complete composite frame (photo, artwork overlay, and text).
 */
export function renderFrameComposite(ctx, config, frame, sourceImage, frameImage, isCustomPhoto, crop, profile) {
  const { width, height } = config.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const fitMode = isCustomPhoto ? 'cover' : 'contain';

  if (config.composition.mode === 'aperture') {
    const area = frame.photoArea;
    drawFittedImage(ctx, sourceImage, area, fitMode, crop);
    ctx.drawImage(frameImage, 0, 0, width, height);

    if (config.composition.showProfileFields) {
      const textConfig = config.composition.text ?? {};
      const centerX = area.x + area.width / 2;
      const startY = textConfig.startY ?? area.y + area.height + (textConfig.gap ?? 28);
      const maxWidth = textConfig.maxWidth ?? Math.max(area.width + 120, 360);

      const nextY = renderMultilineText(ctx, profile.userName ?? '', {
        centerX,
        y: startY,
        font: textConfig.nameFont ?? '700 40px "DM Sans"',
        color: textConfig.color ?? '#0d1f2d',
        maxWidth,
        lineHeight: textConfig.nameLineHeight ?? 46
      });

      renderMultilineText(ctx, profile.companyName ?? '', {
        centerX,
        y: nextY + (textConfig.companyGap ?? 4),
        font: textConfig.companyFont ?? '500 26px "DM Sans"',
        color: textConfig.companyColor ?? '#50616b',
        maxWidth,
        lineHeight: textConfig.companyLineHeight ?? 32
      });
    }
  } else {
    const area = config.composition.photoArea;
    drawFittedImage(ctx, sourceImage, area, fitMode, crop);
    ctx.drawImage(frameImage, 0, 0, width, height);

    const centerX = area.x + area.width / 2;
    const maxWidth = area.width;

    renderMultilineText(ctx, profile.userName ?? '', {
      centerX,
      y: config.composition.nameY,
      font: '700 48px "DM Sans"',
      maxWidth,
      lineHeight: 54
    });

    renderMultilineText(ctx, profile.companyName ?? '', {
      centerX,
      y: config.composition.companyY,
      font: '400 30px "DM Sans"',
      maxWidth,
      lineHeight: 38
    });
  }
}
