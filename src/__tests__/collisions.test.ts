import { describe, it, expect } from '@jest/globals';
import { resolveCollisions } from '../engine/collisions';
import type { PlacedTile } from '../types';

const t = (id: string, x: number, y: number, w: number, h: number): PlacedTile => ({
  id,
  position: { x, y },
  size: { w, h },
  data: null,
});

const pos = (tiles: PlacedTile[], id: string) => tiles.find((t) => t.id === id)!.position;

describe('resolveCollisions — push', () => {
  it('moves dragged tile to empty space with no side effects', () => {
    const tiles = [t('a', 0, 0, 1, 1), t('b', 2, 0, 1, 1)];
    const result = resolveCollisions(tiles, 'a', { x: 1, y: 0 }, 'push', 4);
    expect(pos(result, 'a')).toEqual({ x: 1, y: 0 });
    expect(pos(result, 'b')).toEqual({ x: 2, y: 0 }); // untouched
  });

  it('displaces a colliding tile to the next free space', () => {
    //  [a a][b b]  — full row, b must move to row 1
    const tiles = [t('a', 0, 0, 2, 1), t('b', 2, 0, 2, 1)];
    const result = resolveCollisions(tiles, 'a', { x: 2, y: 0 }, 'push', 4);
    expect(pos(result, 'a')).toEqual({ x: 2, y: 0 });
    expect(pos(result, 'b')).not.toEqual({ x: 2, y: 0 });
  });

  it('displaces multiple colliding tiles', () => {
    // row 0: [a a][b][c]  — drop a (2-wide) at x=2 → collides with both b and c
    const tiles = [t('a', 0, 0, 2, 1), t('b', 2, 0, 1, 1), t('c', 3, 0, 1, 1)];
    const result = resolveCollisions(tiles, 'a', { x: 2, y: 0 }, 'push', 4);
    expect(pos(result, 'a')).toEqual({ x: 2, y: 0 });
    expect(pos(result, 'b')).not.toEqual({ x: 2, y: 0 });
    expect(pos(result, 'c')).not.toEqual({ x: 3, y: 0 });
  });

  it('returns tiles unchanged when dropped on its own position', () => {
    const tiles = [t('a', 0, 0, 2, 2), t('b', 2, 0, 2, 2)];
    const result = resolveCollisions(tiles, 'a', { x: 0, y: 0 }, 'push', 4);
    expect(result).toEqual(tiles);
  });

  it('preserves tile ids and data', () => {
    const tiles: PlacedTile<{ label: string }>[] = [
      { id: 'x', position: { x: 0, y: 0 }, size: { w: 2, h: 1 }, data: { label: 'hello' } },
      { id: 'y', position: { x: 2, y: 0 }, size: { w: 2, h: 1 }, data: { label: 'world' } },
    ];
    const result = resolveCollisions(tiles, 'x', { x: 2, y: 0 }, 'push', 4);
    expect(result.find((t) => t.id === 'x')!.data.label).toBe('hello');
    expect(result.find((t) => t.id === 'y')!.data.label).toBe('world');
  });
});

describe('resolveCollisions — swap', () => {
  it('exchanges positions of dragged tile and target tile', () => {
    const tiles = [t('a', 0, 0, 1, 1), t('b', 1, 0, 1, 1)];
    const result = resolveCollisions(tiles, 'a', { x: 1, y: 0 }, 'swap', 4);
    expect(pos(result, 'a')).toEqual({ x: 1, y: 0 });
    expect(pos(result, 'b')).toEqual({ x: 0, y: 0 });
  });

  it('moves to empty space when no tile at target center', () => {
    const tiles = [t('a', 0, 0, 1, 1), t('b', 3, 3, 1, 1)];
    const result = resolveCollisions(tiles, 'a', { x: 1, y: 1 }, 'swap', 4);
    expect(pos(result, 'a')).toEqual({ x: 1, y: 1 });
    expect(pos(result, 'b')).toEqual({ x: 3, y: 3 }); // untouched
  });

  it('does not move third tiles', () => {
    const tiles = [t('a', 0, 0, 1, 1), t('b', 1, 0, 1, 1), t('c', 2, 0, 1, 1)];
    const result = resolveCollisions(tiles, 'a', { x: 1, y: 0 }, 'swap', 4);
    expect(pos(result, 'c')).toEqual({ x: 2, y: 0 }); // untouched
  });
});
