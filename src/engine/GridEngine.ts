import type { LayoutItem, TilePosition, TileSize } from '../types';

// Sentinel value marking a cell as occupied by a tile with the given id.
// The matrix stores tile ids so we can look up who owns a cell in O(1).
type Cell = string | null; // null = empty, string = tile id

export class GridEngine {
  private matrix: Cell[][];
  private columns: number;

  constructor(columns: number, initialRows = 20) {
    this.columns = columns;
    this.matrix = GridEngine.createMatrix(columns, initialRows);
  }

  private static createMatrix(columns: number, rows: number): Cell[][] {
    return Array.from({ length: rows }, () => Array(columns).fill(null));
  }

  // ── Accessors ────────────────────────────────────────────────────────────

  get rowCount(): number {
    return this.matrix.length;
  }

  get columnCount(): number {
    return this.columns;
  }

  // ── Core operations ──────────────────────────────────────────────────────

  isOccupied(pos: TilePosition, size: TileSize, ignoreId?: string): boolean {
    for (let row = pos.y; row < pos.y + size.h; row++) {
      for (let col = pos.x; col < pos.x + size.w; col++) {
        if (col < 0 || col >= this.columns) return true; // out of bounds
        this.growIfNeeded(row);
        const cell = this.matrix[row]![col]!;
        if (cell !== null && cell !== ignoreId) return true;
      }
    }
    return false;
  }

  isInBounds(pos: TilePosition, size: TileSize): boolean {
    return pos.x >= 0 && pos.x + size.w <= this.columns && pos.y >= 0;
  }

  placeAt(id: string, pos: TilePosition, size: TileSize): void {
    for (let row = pos.y; row < pos.y + size.h; row++) {
      this.growIfNeeded(row);
      for (let col = pos.x; col < pos.x + size.w; col++) {
        this.matrix[row]![col] = id;
      }
    }
  }

  removeFrom(pos: TilePosition, size: TileSize): void {
    for (let row = pos.y; row < pos.y + size.h; row++) {
      if (row >= this.matrix.length) break;
      for (let col = pos.x; col < pos.x + size.w; col++) {
        if (col < this.columns) this.matrix[row]![col] = null;
      }
    }
  }

  removeById(id: string): void {
    for (let row = 0; row < this.matrix.length; row++) {
      for (let col = 0; col < this.columns; col++) {
        if (this.matrix[row]![col] === id) {
          this.matrix[row]![col] = null;
        }
      }
    }
  }

  // ── Placement search ─────────────────────────────────────────────────────

  /**
   * Scan top-left to bottom-right for the first position where `size` fits.
   * Returns null if the grid (up to maxRows) is full.
   */
  findFirstFit(size: TileSize, maxRows = this.matrix.length + size.h): TilePosition | null {
    for (let row = 0; row < maxRows; row++) {
      this.growIfNeeded(row + size.h - 1);
      for (let col = 0; col <= this.columns - size.w; col++) {
        const pos: TilePosition = { x: col, y: row };
        if (!this.isOccupied(pos, size)) return pos;
      }
    }
    return null;
  }

  /**
   * Returns ids of all tiles that overlap the given region, excluding ignoreId.
   */
  getCollisions(pos: TilePosition, size: TileSize, ignoreId?: string): Set<string> {
    const hits = new Set<string>();
    for (let row = pos.y; row < pos.y + size.h; row++) {
      if (row >= this.matrix.length) break;
      for (let col = pos.x; col < pos.x + size.w; col++) {
        if (col >= this.columns) break;
        const cell = this.matrix[row]![col]!;
        if (cell !== null && cell !== ignoreId) hits.add(cell);
      }
    }
    return hits;
  }

  // ── Serialization ────────────────────────────────────────────────────────

  /**
   * Rebuild the entire matrix from a layout snapshot.
   * Call this when restoring a saved layout.
   */
  loadLayout(items: LayoutItem[]): void {
    const maxRow = items.reduce((m, item) => Math.max(m, item.position.y + item.size.h), 0);
    this.matrix = GridEngine.createMatrix(this.columns, Math.max(maxRow + 5, 20));
    for (const item of items) {
      this.placeAt(item.id, item.position, item.size);
    }
  }

  /**
   * Dump the positions of all occupied cells grouped by tile id.
   * Useful for debugging — not the same as a layout snapshot.
   */
  debugDump(): Record<string, TilePosition[]> {
    const out: Record<string, TilePosition[]> = {};
    for (let row = 0; row < this.matrix.length; row++) {
      for (let col = 0; col < this.columns; col++) {
        const id = this.matrix[row]![col];
        if (id) {
          if (!out[id]) out[id] = [];
          out[id]!.push({ x: col, y: row });
        }
      }
    }
    return out;
  }

  // ── Internal helpers ─────────────────────────────────────────────────────

  private growIfNeeded(rowIndex: number): void {
    while (this.matrix.length <= rowIndex) {
      this.matrix.push(Array(this.columns).fill(null));
    }
  }
}
