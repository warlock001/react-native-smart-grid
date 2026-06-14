import React, { createContext, useContext, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { PlacedTile, TilePosition, TileSize, HapticEvent } from '../types';
import type { PixelRect } from '../layout/LayoutCalculator';

export type DragState = {
  dragAbsX: SharedValue<number>;
  dragAbsY: SharedValue<number>;
  isDragging: SharedValue<boolean>;

  activeTile: PlacedTile | null;
  ghostPosition: TilePosition | null;
  initialRect: PixelRect | null;
  selectedTileIds: string[];

  containerPageX: React.MutableRefObject<number>;
  containerPageY: React.MutableRefObject<number>;
  scrollYRef: React.MutableRefObject<number>;

  startDrag: (tile: PlacedTile, rect: PixelRect) => void;
  updateGhost: (pos: TilePosition) => void;
  endDrag: (finalPosition: TilePosition | null) => void;
  selectTile: (tile: PlacedTile) => void;
  onTilePress: (tile: PlacedTile) => void;

  isEditing: boolean;
  /** Grid-level master switch — false disables drag on every tile. */
  draggable: boolean;
  /** Grid-level master switch — false disables selection on every tile. */
  selectable: boolean;
  commitResize: (tile: PlacedTile, newSize: TileSize) => void;
};

const GridDragContext = createContext<DragState | null>(null);

export function useGridDrag(): DragState {
  const ctx = useContext(GridDragContext);
  if (!ctx) throw new Error('useGridDrag must be used within SmartGrid');
  return ctx;
}

type Props = {
  children: React.ReactNode;
  isEditing: boolean;
  draggable: boolean;
  selectable: boolean;
  multiSelect: boolean;
  selectedTileIds: string[];
  onDrop: (tile: PlacedTile, newPosition: TilePosition) => void;
  onResize: (tile: PlacedTile, newSize: TileSize) => void;
  onSelect: (ids: string[]) => void;
  onTilePress?: (tile: PlacedTile) => void;
  onHaptic?: (event: HapticEvent) => void;
};

export function GridDragProvider({
  children,
  isEditing,
  draggable,
  selectable,
  multiSelect,
  selectedTileIds,
  onDrop,
  onResize,
  onSelect,
  onTilePress,
  onHaptic,
}: Props) {
  const dragAbsX = useSharedValue(0);
  const dragAbsY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const [activeTile, setActiveTile] = useState<PlacedTile | null>(null);
  const [ghostPosition, setGhostPosition] = useState<TilePosition | null>(null);
  const [initialRect, setInitialRect] = useState<PixelRect | null>(null);

  const ghostRef = useRef<TilePosition | null>(null);
  const activeTileRef = useRef<PlacedTile | null>(null);

  const containerPageX = useRef(0);
  const containerPageY = useRef(0);
  const scrollYRef = useRef(0);

  function startDrag(tile: PlacedTile, rect: PixelRect) {
    activeTileRef.current = tile;
    ghostRef.current = tile.position;
    isDragging.value = true;
    setActiveTile(tile);
    setInitialRect(rect);
    setGhostPosition(tile.position);
    onHaptic?.('pick-up');
  }

  function selectTile(tile: PlacedTile) {
    const already = selectedTileIds.includes(tile.id);
    if (already) {
      onSelect(selectedTileIds.filter((id) => id !== tile.id));
    } else if (multiSelect) {
      onSelect([...selectedTileIds, tile.id]);
    } else {
      onSelect([tile.id]);
    }
    onHaptic?.('pick-up');
  }

  function updateGhost(pos: TilePosition) {
    if (pos.x === ghostRef.current?.x && pos.y === ghostRef.current?.y) return;
    ghostRef.current = pos;
    setGhostPosition(pos);
    onHaptic?.('snap');
  }

  function endDrag(finalPosition: TilePosition | null) {
    const tile = activeTileRef.current;
    isDragging.value = false;
    activeTileRef.current = null;
    ghostRef.current = null;
    setActiveTile(null);
    setGhostPosition(null);
    setInitialRect(null);
    onHaptic?.('drop');

    if (!tile || !finalPosition) return;

    const stationary =
      finalPosition.x === tile.position.x && finalPosition.y === tile.position.y;

    if (stationary && selectable && tile.selectable !== false) {
      const already = selectedTileIds.includes(tile.id);
      if (already) {
        onSelect(selectedTileIds.filter((id) => id !== tile.id));
      } else if (multiSelect) {
        onSelect([...selectedTileIds, tile.id]);
      } else {
        onSelect([tile.id]);
      }
    } else if (!stationary) {
      onSelect([]);
      onDrop(tile, finalPosition);
    }
  }

  function commitResize(tile: PlacedTile, newSize: TileSize) {
    onHaptic?.('resize');
    onResize(tile, newSize);
  }

  function handleTilePress(tile: PlacedTile) {
    if (selectable && selectedTileIds.length > 0 && tile.selectable !== false) {
      const already = selectedTileIds.includes(tile.id);
      if (already) {
        onSelect(selectedTileIds.filter((id) => id !== tile.id));
      } else if (multiSelect) {
        onSelect([...selectedTileIds, tile.id]);
      } else {
        onSelect([tile.id]);
      }
    } else {
      onTilePress?.(tile);
    }
  }

  return (
    <GridDragContext.Provider
      value={{
        dragAbsX,
        dragAbsY,
        isDragging,
        activeTile,
        ghostPosition,
        initialRect,
        selectedTileIds,
        containerPageX,
        containerPageY,
        scrollYRef,
        startDrag,
        updateGhost,
        endDrag,
        selectTile,
        onTilePress: handleTilePress,
        isEditing,
        draggable,
        selectable,
        commitResize,
      }}
    >
      {children}
    </GridDragContext.Provider>
  );
}
