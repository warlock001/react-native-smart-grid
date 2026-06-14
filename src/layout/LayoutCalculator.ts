import type { TilePosition, TileSize, GridConfig } from '../types';

export type PixelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function columnWidth(config: GridConfig, containerWidth: number): number {
  const available = containerWidth - config.padding * 2 - config.gap * (config.columns - 1);
  return available / config.columns;
}

export function tileToPixelRect(
  position: TilePosition,
  size: TileSize,
  config: GridConfig,
  containerWidth: number
): PixelRect {
  const colW = columnWidth(config, containerWidth);
  const { gap, padding, rowHeight } = config;
  return {
    x: padding + position.x * (colW + gap),
    y: padding + position.y * (rowHeight + gap),
    width: size.w * colW + (size.w - 1) * gap,
    height: size.h * rowHeight + (size.h - 1) * gap,
  };
}

export function gridTotalHeight(
  tiles: Array<{ position: TilePosition; size: TileSize }>,
  config: GridConfig
): number {
  if (tiles.length === 0) return config.padding * 2;
  const maxRow = tiles.reduce((m, t) => Math.max(m, t.position.y + t.size.h), 0);
  return config.padding * 2 + maxRow * config.rowHeight + Math.max(0, maxRow - 1) * config.gap;
}

export function isInViewport(
  rect: PixelRect,
  scrollY: number,
  viewportHeight: number,
  overscan = 200
): boolean {
  return (
    rect.y + rect.height >= scrollY - overscan &&
    rect.y <= scrollY + viewportHeight + overscan
  );
}
