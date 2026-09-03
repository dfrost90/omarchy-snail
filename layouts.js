export const LAYOUT_GAP = 10;

export function createDwindleLayout(count, active, width, height, gap = LAYOUT_GAP) {
  const mainWidth = Math.round(width * 0.6);
  const sideX = mainWidth + gap;
  const sideWidth = width - sideX;
  const positions = Array(count);

  for (let index = 0; index <= active; index += 1) {
    positions[index] = index < active
      ? { x: 0, y: -height - gap, w: mainWidth, h: height }
      : { x: 0, y: 0, w: mainWidth, h: height };
  }

  const futureCount = count - active - 1;
  let remainder = { x: sideX, y: 0, w: sideWidth, h: height };

  for (let offset = 0; offset < futureCount; offset += 1) {
    const index = active + offset + 1;
    const remainingTiles = futureCount - offset;

    if (remainingTiles === 1) {
      positions[index] = { ...remainder };
      continue;
    }

    if (offset % 2 === 0) {
      const tileHeight = Math.round((remainder.h - gap) * 0.5);
      positions[index] = { x: remainder.x, y: remainder.y, w: remainder.w, h: tileHeight };
      remainder = {
        x: remainder.x,
        y: remainder.y + tileHeight + gap,
        w: remainder.w,
        h: remainder.h - tileHeight - gap
      };
    } else {
      const tileWidth = Math.round((remainder.w - gap) * 0.5);
      positions[index] = { x: remainder.x, y: remainder.y, w: tileWidth, h: remainder.h };
      remainder = {
        x: remainder.x + tileWidth + gap,
        y: remainder.y,
        w: remainder.w - tileWidth - gap,
        h: remainder.h
      };
    }
  }

  return positions;
}

export function createScrollingLayout(count, active, width, height, gap = LAYOUT_GAP) {
  const columnWidth = Math.round(width * 0.49);
  const columnStep = columnWidth + gap;

  return Array.from({ length: count }, (_, index) => ({
    x: (index - active) * columnStep,
    y: 0,
    w: columnWidth,
    h: height
  }));
}

export function createCompactLayout(count, active, width, height, gap = LAYOUT_GAP) {
  return Array.from({ length: count }, (_, index) => ({
    x: (index - active) * (width + gap),
    y: 0,
    w: width,
    h: height
  }));
}
