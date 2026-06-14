/** Width and height of a tile in grid units. */
export type TileSize = {
  /** Number of grid columns spanned. */
  w: number;
  /** Number of grid rows spanned. */
  h: number;
};

/** Column/row position of a tile's top-left corner (0-based). */
export type TilePosition = {
  /** Column index (0-based). */
  x: number;
  /** Row index (0-based). */
  y: number;
};

/**
 * A single tile in the grid.
 *
 * `position` and `size` are both optional:
 * - Both provided → tile is placed exactly where specified (use when restoring a saved layout).
 * - `size` only   → tile is auto-placed via bin-packing.
 * - Neither       → tile defaults to 1×1 and is auto-placed in order.
 *
 * @example
 * ```ts
 * // Explicit position + size (restored from storage)
 * { id: '1', position: { x: 0, y: 0 }, size: { w: 2, h: 2 }, data: { label: 'Music' } }
 *
 * // Size only — grid chooses placement
 * { id: '2', size: { w: 2, h: 1 }, data: { label: 'Photos' } }
 *
 * // No position, no size — defaults to 1×1, auto-placed in order
 * { id: '3', data: { label: 'Notes' } }
 *
 * // Pinned tile — cannot be dragged
 * { id: '4', data: { label: 'Header' }, draggable: false }
 *
 * // Non-selectable tile — long press fires onTilePress instead of entering selection
 * { id: '5', data: { label: 'Info' }, selectable: false }
 * ```
 */
export type Tile<TData = unknown> = {
  /** Unique identifier. Must be stable across re-renders. */
  id: string;
  /** Tile dimensions in grid units. Omit to default to 1×1. */
  size?: TileSize;
  /** Top-left position in the grid. Omit to let the grid auto-place. */
  position?: TilePosition;
  /** Your custom data — passed back to `renderTile` as `item.data`. */
  data: TData;
  /** When `true`, prevents both dragging and resizing. @default false */
  locked?: boolean;
  /** Smallest size the tile can be resized to. Only enforced when `isEditing` is true. */
  minSize?: TileSize;
  /** Largest size the tile can be resized to. Only enforced when `isEditing` is true. */
  maxSize?: TileSize;
  /** When `false`, the tile ignores the drag gesture and stays in place. @default true */
  draggable?: boolean;
  /** When `false`, long-pressing this tile fires `onTilePress` instead of entering selection. @default true */
  selectable?: boolean;
};

/** A `Tile` with `position` and `size` guaranteed to be present. Used internally after auto-placement. */
export type PlacedTile<TData = unknown> = Tile<TData> & {
  position: TilePosition;
  size: TileSize;
};

/** Internal grid configuration passed through context. */
export type GridConfig = {
  columns: number;
  rowHeight: number;
  gap: number;
  padding: number;
};

/**
 * How a dragged tile interacts with tiles it overlaps on drop.
 * - `'push'` — displaced tiles are moved to the next available slot.
 * - `'swap'` — the dragged tile and the tile at the drop center exchange positions.
 */
export type CollisionBehavior = 'push' | 'swap';

/**
 * Interaction moments passed to `onHaptic` so you can trigger device feedback.
 * - `'pick-up'` — tile long-press activated (drag started or tile selected).
 * - `'snap'`    — ghost tile snapped to a new grid position mid-drag.
 * - `'drop'`    — tile released.
 * - `'resize'`  — tile resize committed.
 */
export type HapticEvent = 'pick-up' | 'snap' | 'drop' | 'resize';

/**
 * Direction tiles compact toward after every drop.
 * - `'none'`  — tiles stay exactly where dropped.
 * - `'up'`    — tiles slide upward to fill empty rows.
 * - `'left'`  — tiles slide left to fill empty columns.
 */
export type Gravity = 'none' | 'up' | 'left';

/** Position and size of a single tile — the serializable unit returned by `serializeLayout`. */
export type LayoutItem = {
  /** Tile id — matches the `id` on the original `Tile`. */
  id: string;
  /** Current top-left grid position. */
  position: TilePosition;
  /** Current size in grid units. */
  size: TileSize;
};

/** Array of `LayoutItem` — the format used by `serializeLayout` and `restoreLayout`. */
export type SerializedLayout = LayoutItem[];
