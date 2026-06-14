import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import type { Tile, PlacedTile, GridConfig, CollisionBehavior, Gravity, TilePosition, TileSize, HapticEvent, LayoutItem } from '../types';
import { GridEngine } from '../engine/GridEngine';
import { resolveCollisions } from '../engine/collisions';
import { autoArrange as autoArrangeAlgo, applyGravity } from '../engine/autoArrange';
import {
  tileToPixelRect,
  gridTotalHeight,
  isInViewport,
} from '../layout/LayoutCalculator';
import { GridDragProvider, useGridDrag } from '../context/GridDragContext';
import { DraggableTile } from './DraggableTile';
import { GhostTile } from './GhostTile';
import { DragLayer } from './DragLayer';

/** Imperative handle exposed via `ref`. */
export type SmartGridRef = {
  /** Re-packs all tiles using largest-first bin-packing. Fires `onLayoutChange`. */
  autoArrange: () => void;
  /** Returns a plain `LayoutItem[]` you can JSON.stringify and save anywhere. Does not include tile `data`. */
  serializeLayout: () => LayoutItem[];
  /** Restores a previously serialized layout. Fires `onLayoutChange`. */
  restoreLayout: (layout: LayoutItem[]) => void;
  /** Clears the entire selection. Equivalent to `setSelection([])`. */
  clearSelection: () => void;
  /** Programmatically set the selected tile IDs. Pass `[]` to clear. Fires `onSelectionChange`. */
  setSelection: (ids: string[]) => void;
};

/** Argument passed to `renderTile`. */
export type RenderTileInfo<TData> = {
  /** The tile being rendered, including your custom `data`. */
  item: Tile<TData>;
  /** `true` while this tile is actively being dragged (the placeholder left behind). */
  isActive: boolean;
  /**
   * `true` when this tile is in the current selection.
   * Selection is entered via long press — either immediately (when `draggable={false}`)
   * or on release without moving (when draggable). Use to show contextual actions like a delete button.
   */
  isSelected: boolean;
};

/**
 * Props for `SmartGrid`.
 *
 * `position` and `size` on each tile are optional:
 * - Both provided → tile is placed exactly where specified.
 * - `size` only → tile is auto-placed via bin-packing.
 * - Neither → tile defaults to 1×1 and is auto-placed in order.
 */
export type SmartGridProps<TData = unknown> = {
  /** Array of tiles to render. `position` and `size` are optional — omit them to let the grid auto-place. */
  data: Tile<TData>[];
  /** Render function for each tile. Return any React Native view — SmartGrid handles absolute positioning. */
  renderTile: (info: RenderTileInfo<TData>) => React.ReactNode;

  /** Number of grid columns. @default 4 */
  columns?: number;
  /** Height of one grid row in pixels. @default 100 */
  rowHeight?: number;
  /** Gap between tiles in pixels. @default 8 */
  gap?: number;
  /** Outer padding of the grid in pixels. @default 8 */
  padding?: number;

  /**
   * How dropped tiles interact with tiles already occupying the target space.
   * - `'push'` — displaced tiles are moved to the next available slot.
   * - `'swap'` — dragged tile and the tile at the drop center exchange positions.
   * @default 'push'
   */
  collisionBehavior?: CollisionBehavior;
  /**
   * Compact tiles toward the origin after every drop.
   * - `'none'` — tiles stay where dropped.
   * - `'up'`   — tiles slide upward to fill empty rows.
   * - `'left'` — tiles slide left to fill empty columns.
   * @default 'none'
   */
  gravity?: Gravity;
  /** When `true`, shows a resize handle on each tile's bottom-right corner. @default false */
  isEditing?: boolean;
  /**
   * Master switch — when `false`, no tile in the grid can be dragged regardless of individual `tile.draggable` flags.
   * @default true
   */
  draggable?: boolean;
  /**
   * Master switch — when `false`, no tile in the grid can be selected regardless of individual `tile.selectable` flags.
   * @default true
   */
  selectable?: boolean;
  /**
   * When `true`, long-pressing multiple tiles adds them all to the selection array.
   * When `false`, selecting a tile deselects all others (single-select mode).
   * @default true
   */
  multiSelect?: boolean;

  /** Called after every drag, drop, or resize with the updated `LayoutItem[]`. Merge this back into your state to keep the grid in sync. */
  onLayoutChange?: (layout: LayoutItem[]) => void;
  /** Called when the user taps a tile (quick press, no drag). Use this to open detail views, modals, folders, etc. */
  onTilePress?: (tile: Tile<TData>) => void;
  /** Called when the user begins dragging a tile (fires after the 300ms long-press activates, before the first move). */
  onTileDragStart?: (tile: Tile<TData>) => void;
  /** Called when a tile is dropped at a new position. */
  onTileDrop?: (tile: Tile<TData>, position: TilePosition) => void;
  /** Called when a tile is resized via the resize handle. */
  onTileResize?: (tile: Tile<TData>, newSize: TileSize) => void;
  /**
   * Called whenever the selection array changes. Receives the full array of currently selected tile IDs.
   *
   * Selection changes when:
   * - Long press on a tile toggles it (immediately if `draggable={false}`, on release otherwise).
   * - Tap on a tile while selection is active toggles it.
   * - A real drag-and-drop clears the entire selection.
   * - `clearSelection()` or `setSelection()` is called on the ref.
   */
  onSelectionChange?: (ids: string[]) => void;
  /**
   * Called at key interaction moments so you can trigger haptic feedback
   * with whichever haptics library you prefer — no dependency added.
   *
   * @example
   * onHaptic={(event) => {
   *   if (event === 'pick-up') HapticFeedback.trigger('impactMedium');
   *   if (event === 'snap')    HapticFeedback.trigger('selection');
   *   if (event === 'drop')    HapticFeedback.trigger('notificationSuccess');
   *   if (event === 'resize')  HapticFeedback.trigger('impactLight');
   * }}
   */
  onHaptic?: (event: HapticEvent) => void;
};

// ── Normalization ─────────────────────────────────────────────────────────────

function normalizeTiles<TData>(tiles: Tile<TData>[], columns: number): PlacedTile<TData>[] {
  const sized = tiles.map((t) => ({ ...t, size: t.size ?? { w: 1, h: 1 } }));
  const withPos = sized.filter((t): t is typeof t & { position: TilePosition } => t.position != null);
  const withoutPos = sized.filter((t) => t.position == null);

  if (withoutPos.length === 0) return withPos as PlacedTile<TData>[];

  const engine = new GridEngine(columns);
  for (const t of withPos) engine.placeAt(t.id, t.position, t.size);

  const result: PlacedTile<TData>[] = [...(withPos as PlacedTile<TData>[])];
  for (const t of withoutPos) {
    const pos = engine.findFirstFit(t.size);
    if (pos) {
      engine.placeAt(t.id, pos, t.size);
      result.push({ ...t, position: pos } as PlacedTile<TData>);
    }
  }
  return result;
}

// ── Inner component (has access to GridDragContext) ───────────────────────────

type InnerProps<TData> = Omit<SmartGridProps<TData>, 'data'> & { data: PlacedTile<TData>[] };

function SmartGridInner<TData>({
  data,
  renderTile,
  columns = 4,
  rowHeight = 100,
  gap = 8,
  padding = 8,
}: InnerProps<TData>) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const scrollTickRef = useRef(0);
  const [scrollTick, setScrollTick] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const containerRef = useRef<any>(null);
  const drag = useGridDrag();

  const config: GridConfig = useMemo(
    () => ({ columns, rowHeight, gap, padding }),
    [columns, rowHeight, gap, padding]
  );

  const totalHeight = useMemo(() => gridTotalHeight(data, config), [data, config]);

  const handleLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      setContainerWidth(e.nativeEvent.layout.width);
      setViewportHeight(e.nativeEvent.layout.height);
      containerRef.current?.measure(
        (_x: number, _y: number, _w: number, _h: number, pageX: number, pageY: number) => {
          drag.containerPageX.current = pageX;
          drag.containerPageY.current = pageY;
        }
      );
    },
    [drag]
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      drag.scrollYRef.current = e.nativeEvent.contentOffset.y;
      scrollTickRef.current += 1;
      setScrollTick(scrollTickRef.current);
    },
    [drag]
  );

  // Compute rect once per tile and keep it alongside the tile — avoids a second
  // tileToPixelRect call in the map below.
  const visibleTiles = useMemo(() => {
    if (containerWidth === 0) return [];
    const result: Array<{ tile: PlacedTile<TData>; rect: ReturnType<typeof tileToPixelRect> }> = [];
    for (const tile of data) {
      const rect = tileToPixelRect(tile.position, tile.size, config, containerWidth);
      if (isInViewport(rect, drag.scrollYRef.current, viewportHeight)) {
        result.push({ tile, rect });
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, config, containerWidth, viewportHeight, scrollTick]);

  // Set for O(1) isSelected lookup instead of O(n) Array.includes per rendered tile
  const selectedSet = useMemo(
    () => new Set(drag.selectedTileIds),
    [drag.selectedTileIds]
  );

  return (
    <View style={styles.root} ref={containerRef} onLayout={handleLayout}>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={!drag.activeTile}
        style={styles.scroll}
      >
        <View style={[styles.canvas, { height: totalHeight }]}>
          {containerWidth > 0 &&
            visibleTiles.map(({ tile, rect }) => {
              const isActive = drag.activeTile?.id === tile.id;
              const isSelected = selectedSet.has(tile.id);
              return (
                <DraggableTile
                  key={tile.id}
                  tile={tile}
                  rect={rect}
                  config={config}
                  containerWidth={containerWidth}
                >
                  {renderTile({ item: tile, isActive, isSelected })}
                </DraggableTile>
              );
            })}
          {drag.activeTile && containerWidth > 0 && (
            <GhostTile
              activeTile={drag.activeTile}
              config={config}
              containerWidth={containerWidth}
            />
          )}
        </View>
      </ScrollView>

      {drag.activeTile && drag.initialRect && (
        <DragLayer tile={drag.activeTile} initialRect={drag.initialRect}>
          {renderTile({ item: drag.activeTile as Tile<TData>, isActive: true, isSelected: false })}
        </DragLayer>
      )}
    </View>
  );
}

// ── Public component (provides context + ref handle) ─────────────────────────

function SmartGridWithRef<TData = unknown>(
  props: SmartGridProps<TData>,
  ref: React.ForwardedRef<SmartGridRef>
) {
  const columns = props.columns ?? 4;
  const gravity = props.gravity ?? 'none';

  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);

  const normalizedData = useMemo(
    () => normalizeTiles(props.data, columns),
    [props.data, columns]
  );

  const handleSelect = useCallback(
    (ids: string[]) => {
      setSelectedTileIds(ids);
      props.onSelectionChange?.(ids);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.onSelectionChange]
  );

  useImperativeHandle(
    ref,
    () => ({
      autoArrange() {
        const arranged = autoArrangeAlgo(normalizedData as PlacedTile[], columns);
        props.onLayoutChange?.(
          arranged.map((t) => ({ id: t.id, position: t.position, size: t.size }))
        );
      },
      serializeLayout() {
        return normalizedData.map((t) => ({ id: t.id, position: t.position, size: t.size }));
      },
      restoreLayout(layout) {
        props.onLayoutChange?.(layout);
      },
      clearSelection() {
        handleSelect([]);
      },
      setSelection(ids: string[]) {
        handleSelect(ids);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [normalizedData, columns, props.onLayoutChange, handleSelect]
  );

  const handleDrop = useCallback(
    (tile: PlacedTile, newPosition: TilePosition) => {
      const afterCollision = resolveCollisions(
        normalizedData as PlacedTile[],
        tile.id,
        newPosition,
        props.collisionBehavior ?? 'push',
        columns
      );
      const afterGravity = applyGravity(afterCollision, columns, gravity);
      const newLayout = afterGravity.map((t) => ({ id: t.id, position: t.position, size: t.size }));

      const layoutChanged = newLayout.some((item) => {
        const prev = normalizedData.find((t) => t.id === item.id);
        return !prev || prev.position.x !== item.position.x || prev.position.y !== item.position.y;
      });
      if (!layoutChanged) return;

      props.onTileDrop?.(tile as Tile<TData>, newPosition);
      props.onLayoutChange?.(newLayout);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [normalizedData, props.collisionBehavior, columns, gravity, props.onTileDrop, props.onLayoutChange]
  );

  const handleResize = useCallback(
    (tile: PlacedTile, newSize: TileSize) => {
      const withNewSize = normalizedData.map((t) =>
        t.id === tile.id ? { ...t, size: newSize } : t
      );
      const afterCollision = resolveCollisions(
        withNewSize as PlacedTile[],
        tile.id,
        (tile as PlacedTile).position,
        props.collisionBehavior ?? 'push',
        columns
      );
      const newLayout = afterCollision.map((t) => ({ id: t.id, position: t.position, size: t.size }));
      props.onTileResize?.(tile as Tile<TData>, newSize);
      props.onLayoutChange?.(newLayout);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [normalizedData, props.collisionBehavior, columns, props.onTileResize, props.onLayoutChange]
  );

  return (
    <GridDragProvider
      isEditing={props.isEditing ?? false}
      draggable={props.draggable ?? true}
      selectable={props.selectable ?? true}
      multiSelect={props.multiSelect ?? true}
      selectedTileIds={selectedTileIds}
      onDrop={handleDrop}
      onResize={handleResize}
      onSelect={handleSelect}
      onTilePress={props.onTilePress as ((tile: PlacedTile) => void) | undefined}
      onHaptic={props.onHaptic}
    >
      <SmartGridInner {...props} data={normalizedData} />
    </GridDragProvider>
  );
}

/**
 * A draggable, variable-sized tile grid for React Native.
 *
 * ---
 *
 * ### Basic usage
 * ```tsx
 * const gridRef = useRef<SmartGridRef>(null);
 *
 * <SmartGrid
 *   ref={gridRef}
 *   data={tiles}
 *   columns={4}
 *   rowHeight={100}
 *   gap={8}
 *   collisionBehavior="push"
 *   gravity="up"
 *   isEditing={isEditing}
 *   onLayoutChange={(layout) =>
 *     setTiles(prev =>
 *       prev.map(t => {
 *         const updated = layout.find(l => l.id === t.id);
 *         return updated ? { ...t, ...updated } : t;
 *       })
 *     )
 *   }
 *   renderTile={({ item, isActive, isSelected }) => (
 *     <View style={{ flex: 1, opacity: isActive ? 0.5 : 1,
 *       borderWidth: isSelected ? 2 : 0, borderColor: '#fff' }}>
 *       <Text>{item.data.label}</Text>
 *     </View>
 *   )}
 * />
 * ```
 *
 * ---
 *
 * ### Selection (long press + release)
 * Long-pressing a tile and releasing without moving selects it.
 * Tapping any tile while a selection is active toggles that tile too.
 *
 * ```tsx
 * // Multi-select (default) — accumulate selections
 * <SmartGrid
 *   multiSelect        // true by default, can omit
 *   onSelectionChange={(ids) => console.log('selected:', ids)}
 *   renderTile={({ item, isSelected }) => (
 *     <View>
 *       <Text>{item.data.label}</Text>
 *       {isSelected && <Text>✕ Delete</Text>}
 *     </View>
 *   )}
 * />
 *
 * // Single-select — picking a new tile deselects the previous one
 * <SmartGrid
 *   multiSelect={false}
 *   onSelectionChange={([id]) => setActive(id ?? null)}
 * />
 *
 * // Clear selection imperatively
 * gridRef.current?.clearSelection();
 *
 * // Or set it programmatically
 * gridRef.current?.setSelection(['tile-1', 'tile-3']);
 * ```
 *
 * ---
 *
 * ### Grid-level draggable / selectable master switches
 * These override all per-tile flags when set to `false`.
 * ```tsx
 * // View-only mode — nothing can be dragged or selected
 * <SmartGrid draggable={false} selectable={false} data={tiles} ... />
 *
 * // Read-only layout — tiles are visible but locked in place
 * <SmartGrid draggable={false} data={tiles} ... />
 *
 * // Selection disabled — long press does nothing (onTilePress still fires on tap)
 * <SmartGrid selectable={false} data={tiles} ... />
 * ```
 *
 * ### Per-tile draggable / selectable flags
 * Fine-grained control per tile when the grid-level switches are on.
 * ```tsx
 * const tiles: Tile<MyData>[] = [
 *   { id: '1', data: { label: 'Free' } },
 *   // Stays pinned in place — cannot be dragged
 *   { id: '2', data: { label: 'Pinned' }, draggable: false },
 *   // Ignored by selection — tapping fires onTilePress instead
 *   { id: '3', data: { label: 'Info' },   selectable: false },
 * ];
 * ```
 */
// Cast preserves the generic type parameter through forwardRef
export const SmartGrid = forwardRef(SmartGridWithRef) as <TData = unknown>(
  props: SmartGridProps<TData> & { ref?: React.Ref<SmartGridRef> }
) => React.ReactElement | null;

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  canvas: { position: 'relative' },
});
