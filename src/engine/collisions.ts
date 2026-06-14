import { GridEngine } from './GridEngine';
import type { PlacedTile, TilePosition, CollisionBehavior } from '../types';

export function resolveCollisions<TData>(
  tiles: PlacedTile<TData>[],
  draggedId: string,
  targetPosition: TilePosition,
  behavior: CollisionBehavior,
  columns: number
): PlacedTile<TData>[] {
  if (behavior === 'swap') return resolveSwap(tiles, draggedId, targetPosition);
  return resolvePush(tiles, draggedId, targetPosition, columns);
}

function resolveSwap<TData>(
  tiles: PlacedTile<TData>[],
  draggedId: string,
  targetPosition: TilePosition
): PlacedTile<TData>[] {
  const dragged = tiles.find((t) => t.id === draggedId);
  if (!dragged) return tiles;

  const cx = targetPosition.x + dragged.size.w / 2;
  const cy = targetPosition.y + dragged.size.h / 2;

  const swapTarget = tiles.find(
    (t) =>
      t.id !== draggedId &&
      cx > t.position.x &&
      cx < t.position.x + t.size.w &&
      cy > t.position.y &&
      cy < t.position.y + t.size.h
  );

  const fromPos = dragged.position;
  return tiles.map((t) => {
    if (t.id === draggedId) return { ...t, position: targetPosition };
    if (swapTarget && t.id === swapTarget.id) return { ...t, position: fromPos };
    return t;
  });
}

function resolvePush<TData>(
  tiles: PlacedTile<TData>[],
  draggedId: string,
  targetPosition: TilePosition,
  columns: number
): PlacedTile<TData>[] {
  const dragged = tiles.find((t) => t.id === draggedId);
  if (!dragged) return tiles;

  const engine = new GridEngine(columns);
  const others = tiles.filter((t) => t.id !== draggedId);

  for (const t of others) {
    engine.placeAt(t.id, t.position, t.size);
  }

  const collisions = engine.getCollisions(targetPosition, dragged.size);

  if (collisions.size === 0) {
    return tiles.map((t) => (t.id === draggedId ? { ...t, position: targetPosition } : t));
  }

  // Claim the target space, then re-home displaced tiles in top-left order.
  for (const id of collisions) {
    engine.removeById(id);
  }
  engine.placeAt(draggedId, targetPosition, dragged.size);

  const displaced = others
    .filter((t) => collisions.has(t.id))
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

  const newPositions = new Map<string, TilePosition>();
  for (const t of displaced) {
    const pos = engine.findFirstFit(t.size) ?? t.position;
    engine.placeAt(t.id, pos, t.size);
    newPositions.set(t.id, pos);
  }

  return tiles.map((t) => {
    if (t.id === draggedId) return { ...t, position: targetPosition };
    const pos = newPositions.get(t.id);
    return pos ? { ...t, position: pos } : t;
  });
}
