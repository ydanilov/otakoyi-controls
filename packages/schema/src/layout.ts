/**
 * Grid placement helpers shared by the schema migration (v1 → v2) and the pult renderer.
 * Pure TS, no React.
 */

export interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Phone layout derived from a tablet grid: every control keeps its reading order (top-to-bottom,
 * left-to-right) and takes half a row (narrow controls) or a full row (wide ones), then controls are
 * packed into 12 columns. Halves pair up, so the phone screen fills without gaps.
 *
 * Schema v2 stores an explicit phone layout per page (ADR-014); this is how a v1 config's single
 * `grid` becomes its phone layout when it is migrated.
 */
export function reflowForPhone(tablet: Iterable<[string, Cell]>, cols = 12): Map<string, Cell> {
  const ordered = [...tablet].sort(([, a], [, b]) => a.y - b.y || a.x - b.x);
  const height: number[] = Array(cols).fill(0); // skyline: next free row per column
  const out = new Map<string, Cell>();
  for (const [id, g] of ordered) {
    const half = cols / 2;
    const w = g.w * 2 <= half ? half : cols;
    // Lowest position where the control fits, preferring the left-most column.
    let best = { x: 0, y: Infinity };
    for (let x = 0; x + w <= cols; x++) {
      const y = Math.max(...height.slice(x, x + w));
      if (y < best.y) best = { x, y };
    }
    const cell = { x: best.x, y: best.y, w, h: g.h };
    for (let i = cell.x; i < cell.x + w; i++) height[i] = cell.y + cell.h;
    out.set(id, cell);
  }
  return out;
}
