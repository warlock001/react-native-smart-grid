import type { GridConfig, TilePosition, TileSize } from '../types';
import { columnWidth } from '../layout/LayoutCalculator';

/**
 * Convert an absolute screen position (from gesture handler) to a grid cell,
 * accounting for the container's page offset and the current scroll position.
 *
 * The returned position is clamped so the tile stays within grid bounds.
 */
export function pixelToGrid(
  absX: number,
  absY: number,
  containerPageX: number,
  containerPageY: number,
  scrollY: number,
  config: GridConfig,
  size: TileSize,
  containerWidth: number
): TilePosition {
  const colW = columnWidth(config, containerWidth);
  const relX = absX - containerPageX - config.padding;
  const relY = absY - containerPageY + scrollY - config.padding;

  const x = Math.floor(relX / (colW + config.gap));
  const y = Math.floor(relY / (config.rowHeight + config.gap));

  return {
    x: Math.max(0, Math.min(x, config.columns - size.w)),
    y: Math.max(0, y),
  };
}
