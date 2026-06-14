import { describe, it, expect } from '@jest/globals';
import {
  columnWidth,
  tileToPixelRect,
  gridTotalHeight,
  isInViewport,
} from '../layout/LayoutCalculator';
import type { GridConfig } from '../types';

const BASE: GridConfig = { columns: 4, rowHeight: 100, gap: 8, padding: 8 };
// containerWidth = 400
// available = 400 - 16 - 24 = 360  (padding*2 = 16, gap*(cols-1) = 24)
// colW = 360 / 4 = 90

describe('columnWidth', () => {
  it('divides available space equally', () => {
    expect(columnWidth(BASE, 400)).toBe(90);
  });

  it('accounts for padding and gaps', () => {
    const cfg: GridConfig = { columns: 2, rowHeight: 100, gap: 10, padding: 5 };
    // available = 200 - 10 - 10 = 180, colW = 90
    expect(columnWidth(cfg, 200)).toBe(90);
  });
});

describe('tileToPixelRect', () => {
  it('positions a 1x1 tile at (0,0) correctly', () => {
    const rect = tileToPixelRect({ x: 0, y: 0 }, { w: 1, h: 1 }, BASE, 400);
    expect(rect).toEqual({ x: 8, y: 8, width: 90, height: 100 });
  });

  it('positions a 2x1 tile at column 1 correctly', () => {
    const rect = tileToPixelRect({ x: 1, y: 0 }, { w: 2, h: 1 }, BASE, 400);
    // x = padding + 1*(colW+gap) = 8 + 98 = 106
    // width = 2*90 + 1*8 = 188
    expect(rect).toEqual({ x: 106, y: 8, width: 188, height: 100 });
  });

  it('positions a 2x2 tile at (0,1) correctly', () => {
    const rect = tileToPixelRect({ x: 0, y: 1 }, { w: 2, h: 2 }, BASE, 400);
    // x = 8, y = 8 + 1*(100+8) = 116
    // width = 2*90+8 = 188, height = 2*100+8 = 208
    expect(rect).toEqual({ x: 8, y: 116, width: 188, height: 208 });
  });

  it('adjacent tiles have no gap overlap', () => {
    const r0 = tileToPixelRect({ x: 0, y: 0 }, { w: 1, h: 1 }, BASE, 400);
    const r1 = tileToPixelRect({ x: 1, y: 0 }, { w: 1, h: 1 }, BASE, 400);
    expect(r1.x - (r0.x + r0.width)).toBe(BASE.gap);
  });
});

describe('gridTotalHeight', () => {
  it('returns padding*2 for an empty tile list', () => {
    expect(gridTotalHeight([], BASE)).toBe(16);
  });

  it('calculates height for a single-row grid', () => {
    const tiles = [{ position: { x: 0, y: 0 }, size: { w: 1, h: 1 } }];
    // padding*2 + 1*rowHeight + 0*gap = 16 + 100 = 116
    expect(gridTotalHeight(tiles, BASE)).toBe(116);
  });

  it('calculates height for a two-row grid', () => {
    const tiles = [
      { position: { x: 0, y: 0 }, size: { w: 1, h: 1 } },
      { position: { x: 0, y: 1 }, size: { w: 1, h: 1 } },
    ];
    // padding*2 + 2*rowHeight + 1*gap = 16 + 200 + 8 = 224
    expect(gridTotalHeight(tiles, BASE)).toBe(224);
  });

  it('uses the tallest tile to determine row count', () => {
    const tiles = [{ position: { x: 0, y: 0 }, size: { w: 1, h: 3 } }];
    // maxRow=3, padding*2 + 3*100 + 2*8 = 16 + 300 + 16 = 332
    expect(gridTotalHeight(tiles, BASE)).toBe(332);
  });
});

describe('isInViewport', () => {
  const rect = { x: 0, y: 500, width: 100, height: 100 };

  it('includes tiles within the viewport', () => {
    expect(isInViewport(rect, 400, 600, 0)).toBe(true);
  });

  it('includes tiles within the overscan buffer', () => {
    // rect at y=500, viewport 0..600 — tile is just below visible area
    expect(isInViewport(rect, 0, 400, 200)).toBe(true);
  });

  it('excludes tiles far below the viewport', () => {
    expect(isInViewport(rect, 0, 200, 0)).toBe(false);
  });

  it('excludes tiles far above the viewport', () => {
    expect(isInViewport({ x: 0, y: 0, width: 100, height: 50 }, 300, 400, 0)).toBe(false);
  });
});
