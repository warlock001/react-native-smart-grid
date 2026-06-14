import { GridEngine } from './GridEngine';
import type { PlacedTile, TilePosition, Gravity } from '../types';

export function autoArrange<TData>(tiles: PlacedTile<TData>[], columns: number): PlacedTile<TData>[] {
  const engine = new GridEngine(columns);

  const sorted = [...tiles].sort(
    (a, b) => b.size.w * b.size.h - a.size.w * a.size.h
  );

  const newPositions = new Map<string, TilePosition>();
  for (const tile of sorted) {
    const pos = engine.findFirstFit(tile.size) ?? tile.position;
    engine.placeAt(tile.id, pos, tile.size);
    newPositions.set(tile.id, pos);
  }

  return tiles.map((t) => ({ ...t, position: newPositions.get(t.id) ?? t.position }));
}

export function applyGravity<TData>(
  tiles: PlacedTile<TData>[],
  columns: number,
  gravity: Gravity
): PlacedTile<TData>[] {
  if (gravity === 'none') return tiles;

  const engine = new GridEngine(columns);

  const sorted = [...tiles].sort(
    gravity === 'up'
      ? (a, b) => a.position.y - b.position.y || a.position.x - b.position.x
      : (a, b) => a.position.x - b.position.x || a.position.y - b.position.y
  );

  const newPositions = new Map<string, TilePosition>();
  for (const tile of sorted) {
    const pos = slideToward(tile.position, tile.size, engine, gravity);
    engine.placeAt(tile.id, pos, tile.size);
    newPositions.set(tile.id, pos);
  }

  return tiles.map((t) => ({ ...t, position: newPositions.get(t.id) ?? t.position }));
}

function slideToward(
  start: TilePosition,
  size: { w: number; h: number },
  engine: GridEngine,
  gravity: 'up' | 'left'
): TilePosition {
  let { x, y } = start;
  if (gravity === 'up') {
    while (y > 0 && !engine.isOccupied({ x, y: y - 1 }, size)) y--;
  } else {
    while (x > 0 && !engine.isOccupied({ x: x - 1, y }, size)) x--;
  }
  return { x, y };
}
