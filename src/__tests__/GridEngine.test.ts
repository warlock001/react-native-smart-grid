import { describe, it, expect, beforeEach } from '@jest/globals';
import { GridEngine } from '../engine/GridEngine';

describe('GridEngine', () => {
  let engine: GridEngine;

  beforeEach(() => {
    engine = new GridEngine(4);
  });

  describe('placeAt / isOccupied', () => {
    it('marks cells as occupied after placement', () => {
      engine.placeAt('a', { x: 0, y: 0 }, { w: 2, h: 2 });
      expect(engine.isOccupied({ x: 0, y: 0 }, { w: 1, h: 1 })).toBe(true);
      expect(engine.isOccupied({ x: 1, y: 1 }, { w: 1, h: 1 })).toBe(true);
    });

    it('reports empty cells as unoccupied', () => {
      engine.placeAt('a', { x: 0, y: 0 }, { w: 2, h: 2 });
      expect(engine.isOccupied({ x: 2, y: 0 }, { w: 1, h: 1 })).toBe(false);
    });

    it('ignores the specified id when checking occupancy', () => {
      engine.placeAt('a', { x: 0, y: 0 }, { w: 2, h: 2 });
      expect(engine.isOccupied({ x: 0, y: 0 }, { w: 2, h: 2 }, 'a')).toBe(false);
    });

    it('treats out-of-bounds columns as occupied', () => {
      expect(engine.isOccupied({ x: 3, y: 0 }, { w: 2, h: 1 })).toBe(true);
    });
  });

  describe('removeFrom', () => {
    it('clears cells after removal', () => {
      engine.placeAt('a', { x: 0, y: 0 }, { w: 2, h: 2 });
      engine.removeFrom({ x: 0, y: 0 }, { w: 2, h: 2 });
      expect(engine.isOccupied({ x: 0, y: 0 }, { w: 2, h: 2 })).toBe(false);
    });
  });

  describe('removeById', () => {
    it('removes all cells owned by the given id', () => {
      engine.placeAt('a', { x: 0, y: 0 }, { w: 2, h: 2 });
      engine.placeAt('b', { x: 2, y: 0 }, { w: 2, h: 1 });
      engine.removeById('a');
      expect(engine.isOccupied({ x: 0, y: 0 }, { w: 2, h: 2 })).toBe(false);
      expect(engine.isOccupied({ x: 2, y: 0 }, { w: 2, h: 1 })).toBe(true);
    });
  });

  describe('findFirstFit', () => {
    it('returns (0,0) for an empty grid', () => {
      expect(engine.findFirstFit({ w: 2, h: 2 })).toEqual({ x: 0, y: 0 });
    });

    it('skips occupied cells and finds next fit', () => {
      engine.placeAt('a', { x: 0, y: 0 }, { w: 4, h: 1 });
      expect(engine.findFirstFit({ w: 2, h: 1 })).toEqual({ x: 0, y: 1 });
    });

    it('finds a gap between tiles in the same row', () => {
      engine.placeAt('a', { x: 0, y: 0 }, { w: 1, h: 1 });
      expect(engine.findFirstFit({ w: 1, h: 1 })).toEqual({ x: 1, y: 0 });
    });

    it('returns null when no fit exists within maxRows', () => {
      // fill entire 4-column grid for 2 rows
      engine.placeAt('a', { x: 0, y: 0 }, { w: 4, h: 2 });
      expect(engine.findFirstFit({ w: 2, h: 1 }, 2)).toBeNull();
    });
  });

  describe('getCollisions', () => {
    it('returns ids of tiles overlapping the query region', () => {
      engine.placeAt('a', { x: 0, y: 0 }, { w: 2, h: 2 });
      engine.placeAt('b', { x: 2, y: 0 }, { w: 2, h: 2 });
      const hits = engine.getCollisions({ x: 1, y: 0 }, { w: 2, h: 1 });
      expect(hits).toEqual(new Set(['a', 'b']));
    });

    it('excludes the ignored id', () => {
      engine.placeAt('a', { x: 0, y: 0 }, { w: 2, h: 2 });
      const hits = engine.getCollisions({ x: 0, y: 0 }, { w: 2, h: 2 }, 'a');
      expect(hits.size).toBe(0);
    });
  });

  describe('loadLayout', () => {
    it('rebuilds the matrix from a layout snapshot', () => {
      engine.loadLayout([
        { id: 'x', position: { x: 0, y: 0 }, size: { w: 2, h: 2 } },
        { id: 'y', position: { x: 2, y: 0 }, size: { w: 2, h: 1 } },
      ]);
      expect(engine.isOccupied({ x: 0, y: 0 }, { w: 2, h: 2 })).toBe(true);
      expect(engine.isOccupied({ x: 2, y: 0 }, { w: 2, h: 1 })).toBe(true);
      expect(engine.isOccupied({ x: 2, y: 1 }, { w: 1, h: 1 })).toBe(false);
    });
  });
});
