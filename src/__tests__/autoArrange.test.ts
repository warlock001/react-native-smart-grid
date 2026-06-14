import { describe, it, expect } from '@jest/globals';
import { autoArrange, applyGravity } from '../engine/autoArrange';
import type { PlacedTile } from '../types';

const t = (id: string, x: number, y: number, w: number, h: number): PlacedTile => ({
  id,
  position: { x, y },
  size: { w, h },
  data: null,
});

const pos = (tiles: PlacedTile[], id: string) => tiles.find((t) => t.id === id)!.position;

describe('autoArrange', () => {
  it('packs tiles with no gaps from (0,0)', () => {
    // Two 1x1 tiles with a gap between them — should be compacted
    const tiles = [t('a', 0, 0, 1, 1), t('b', 3, 3, 1, 1)];
    const result = autoArrange(tiles, 4);
    // Both should be at row 0 with no empty columns between them
    expect(pos(result, 'a').y).toBe(0);
    expect(pos(result, 'b').y).toBe(0);
    expect(pos(result, 'b').x).toBe(1);
  });

  it('places larger tiles first (largest area first)', () => {
    const tiles = [
      t('small', 0, 0, 1, 1),
      t('big', 1, 0, 2, 2),
    ];
    const result = autoArrange(tiles, 4);
    // big (area 4) goes first, landing at (0,0)
    expect(pos(result, 'big')).toEqual({ x: 0, y: 0 });
    // small (area 1) fits next to or below big
    expect(pos(result, 'small').x).toBeGreaterThanOrEqual(2);
  });

  it('preserves all tile ids', () => {
    const tiles = [t('a', 0, 0, 1, 1), t('b', 2, 2, 1, 1), t('c', 3, 3, 1, 1)];
    const result = autoArrange(tiles, 4);
    expect(result.map((t) => t.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('preserves tile data', () => {
    const tiles: PlacedTile<string>[] = [
      { id: 'x', position: { x: 5, y: 5 }, size: { w: 1, h: 1 }, data: 'hello' },
    ];
    const result = autoArrange(tiles, 4);
    expect(result[0]!.data).toBe('hello');
  });
});

describe('applyGravity', () => {
  it('gravity none returns tiles unchanged', () => {
    const tiles = [t('a', 0, 2, 1, 1)];
    expect(applyGravity(tiles, 4, 'none')).toEqual(tiles);
  });

  it('gravity up slides tiles to fill empty rows above', () => {
    // tile at row 3 with rows 0-2 empty
    const tiles = [t('a', 0, 3, 1, 1)];
    const result = applyGravity(tiles, 4, 'up');
    expect(pos(result, 'a')).toEqual({ x: 0, y: 0 });
  });

  it('gravity up stops at an occupied cell', () => {
    const tiles = [t('a', 0, 0, 1, 1), t('b', 0, 3, 1, 1)];
    const result = applyGravity(tiles, 4, 'up');
    expect(pos(result, 'a')).toEqual({ x: 0, y: 0 }); // already at top
    expect(pos(result, 'b')).toEqual({ x: 0, y: 1 }); // slides up to row 1
  });

  it('gravity left slides tiles to fill empty columns to the left', () => {
    const tiles = [t('a', 3, 0, 1, 1)];
    const result = applyGravity(tiles, 4, 'left');
    expect(pos(result, 'a')).toEqual({ x: 0, y: 0 });
  });

  it('gravity left stops at an occupied cell', () => {
    const tiles = [t('a', 0, 0, 1, 1), t('b', 3, 0, 1, 1)];
    const result = applyGravity(tiles, 4, 'left');
    expect(pos(result, 'a')).toEqual({ x: 0, y: 0 });
    expect(pos(result, 'b')).toEqual({ x: 1, y: 0 });
  });
});
