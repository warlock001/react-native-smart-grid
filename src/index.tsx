export type {
  Tile,
  PlacedTile,
  TileSize,
  TilePosition,
  GridConfig,
  CollisionBehavior,
  Gravity,
  HapticEvent,
  LayoutItem,
  SerializedLayout,
} from './types';

export { GridEngine } from './engine/GridEngine';
export { resolveCollisions } from './engine/collisions';
export { autoArrange, applyGravity } from './engine/autoArrange';

export type { PixelRect } from './layout/LayoutCalculator';
export {
  columnWidth,
  tileToPixelRect,
  gridTotalHeight,
  isInViewport,
} from './layout/LayoutCalculator';

export { pixelToGrid } from './utils/pixelToGrid';

export type { SmartGridRef, RenderTileInfo, SmartGridProps } from './components/SmartGrid';
export { SmartGrid } from './components/SmartGrid';
