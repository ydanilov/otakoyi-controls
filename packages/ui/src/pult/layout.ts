import type { AnyControl, Cell, FormFactor, PanelPattern } from "@osc/schema";

export { reflowForPhone, type Cell } from "@osc/schema";

/** Below this width (pt) the pult uses the page's phone layout. */
export const PHONE_BREAKPOINT = 600;

/** Smallest height (pt) per grid row a stretchable control gets before a page is split. */
export const MIN_ROW = 40;

/** Sizes (pt) from `@osc/tokens` (`theme.size`) that the layout needs. */
export interface ControlSizes {
  padRegularH: number;
  padCompactH: number;
  picturePadRegular: number;
  picturePadCompact: number;
  pultPhoneGap: number;
  pultPhonePadX: number;
  pultPhonePadTop: number;
  pultPhonePadBottom: number;
  pultTabletGap: number;
  pultTabletPadX: number;
  pultTabletPadY: number;
}

/**
 * Height (pt) a control has in Figma (its component's height), or undefined when it stretches
 * (vertical faders, XY pads, meters, button grids, scene lists, colour pickers, thumbsticks,
 * prompts…). Fixed-height controls keep this height; the layout never stretches them on a phone.
 */
export function naturalHeightFor(c: AnyControl, s: ControlSizes): number | undefined {
  switch (c.type) {
    case "fader":
      return c.orientation === "horizontal" ? 82 : undefined;
    case "knob":
      return c.size === "compact" ? 138 : 186;
    case "segmented":
      return c.label ? 78 : 56;
    case "buttonGroup":
      return c.label ? 104 : 78;
    case "label":
      return 118;
    case "gyroscope":
      // Figma Gyroscope: header 18 + 12 + card 124 + 12 + message 18 (pult "lab / phone / motion").
      return 184;
    case "toggle":
      if (c.style === "switch") return 46;
      if (c.image) return c.size === "compact" ? s.picturePadCompact : s.picturePadRegular;
      return c.size === "compact" ? s.padCompactH : s.padRegularH;
    case "button":
    case "holdToConfirm":
      return c.type === "button" && c.size === "compact" ? s.padCompactH : s.padRegularH;
    default:
      return undefined;
  }
}

/**
 * Height (pt) of a Console-Panel pattern (its Figma component's height). `count` = controls in
 * the panel (knobs, list rows).
 */
export function panelMinHeight(pattern: PanelPattern, count: number): number {
  switch (pattern) {
    case "faderBank":
      return 466;
    case "knobGroup":
      return 58 + Math.ceil(count / 2) * 186 + (Math.ceil(count / 2) - 1) * 12;
    case "knobRow":
      return 244;
    case "layerToggles":
      return 136;
    case "cameraControl":
      return 366;
    case "sceneBar":
      return 114;
    case "showActions":
      return 146;
    case "list":
      return count * 56 + Math.max(0, count - 1);
    case "stack":
      return 58 + count * 82 + (count - 1) * 12;
  }
}

/** Panels that stretch like a control without a fixed height (a fader bank fills its column). */
const STRETCHY_PANELS: ReadonlySet<PanelPattern> = new Set(["faderBank"]);

/** Spacing of the pult body per form factor (Figma: phone Pult frame, tablet Console frame). */
export interface PultMetrics {
  /** Gap between controls, both directions. */
  gap: number;
  padX: number;
  padTop: number;
  padBottom: number;
  /** Tablet: the last control of every column stretches to the bottom (Console columns). */
  stretchLast: boolean;
}

export function pultMetrics(ff: FormFactor, s: ControlSizes): PultMetrics {
  return ff === "phone"
    ? {
        gap: s.pultPhoneGap,
        padX: s.pultPhonePadX,
        padTop: s.pultPhonePadTop,
        padBottom: s.pultPhonePadBottom,
        stretchLast: false,
      }
    : {
        gap: s.pultTabletGap,
        padX: s.pultTabletPadX,
        padTop: s.pultTabletPadY,
        padBottom: s.pultTabletPadY,
        stretchLast: true,
      };
}

/** What the layout knows about one placed item (control or panel). */
export interface Item {
  /** Fixed height (pt) or undefined = stretches. */
  height?: number | undefined;
  /** Stretches, but never below this (pt). */
  min?: number | undefined;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One horizontally swipeable screen: its items and where they go (pt, inside the screen). */
export interface Screen {
  ids: string[];
  rects: Map<string, Rect>;
}

interface Placed {
  id: string;
  cell: Cell;
  top: number;
  h: number;
  flex: boolean;
}

const overlapX = (a: Cell, b: Cell) => a.x < b.x + b.w && b.x < a.x + a.w;

/**
 * Packs items top-down: each item sits `gap` below the lowest item above it in its columns (grid
 * `y` only orders them). Fixed items keep their height; stretchable ones start at their minimum.
 */
function pack(
  ids: readonly string[],
  cells: Map<string, Cell>,
  h: Map<string, number>,
  gap: number,
) {
  const order = [...ids].sort((a, b) => {
    const A = cells.get(a)!;
    const B = cells.get(b)!;
    return A.y - B.y || A.x - B.x;
  });
  const sky: number[] = Array(12).fill(-gap);
  const out: Placed[] = [];
  for (const id of order) {
    const c = cells.get(id)!;
    const cols = sky.slice(c.x, c.x + c.w);
    const top = Math.max(...cols) + gap;
    const height = h.get(id)!;
    for (let i = c.x; i < c.x + c.w; i++) sky[i] = top + height;
    out.push({ id, cell: c, top, h: height, flex: false });
  }
  return out;
}

/** Items below `p` in its columns, transitively (they move when `p` grows). */
function below(p: Placed, all: Placed[]): Placed[] {
  const seen = new Set<Placed>([p]);
  const queue = [p];
  while (queue.length) {
    const a = queue.shift()!;
    for (const b of all)
      if (!seen.has(b) && overlapX(a.cell, b.cell) && b.top >= a.top + a.h - 0.01) {
        seen.add(b);
        queue.push(b);
      }
  }
  seen.delete(p);
  return [...seen];
}

const bottomOf = (ps: Placed[]) => Math.max(0, ...ps.map((p) => p.top + p.h));

/**
 * Lays out one screen (ADR-006): items packed from the top with the form factor's gap; stretchable
 * items share the free height of their columns (by grid rows); on a tablet the last item of every
 * column then stretches to the bottom. A phone keeps fixed controls at their Figma height and
 * leaves free space at the bottom. Content taller than the screen is scaled down to fit.
 */
function layoutScreen(
  ids: readonly string[],
  cells: Map<string, Cell>,
  items: ReadonlyMap<string, Item>,
  innerH: number,
  m: PultMetrics,
): Map<string, number> {
  const gap = m.gap;
  const flex = new Set(ids.filter((id) => items.get(id)?.height === undefined));
  const h = new Map<string, number>();
  for (const id of ids) {
    const it = items.get(id);
    const rows = cells.get(id)!.h;
    h.set(id, it?.height ?? Math.max(it?.min ?? 0, rows * MIN_ROW + (rows - 1) * gap));
  }
  // Stretchable items take the free height below their columns, top to bottom, in proportion
  // to their grid rows among the stretchable items under them.
  for (const id of [...flex].sort((a, b) => cells.get(a)!.y - cells.get(b)!.y)) {
    const placed = pack(ids, cells, h, gap);
    const p = placed.find((q) => q.id === id)!;
    const chain = below(p, placed);
    const free = innerH - bottomOf([p, ...chain]);
    if (free <= 0) continue;
    const rows = cells.get(id)!.h;
    const all = rows + chain.filter((q) => flex.has(q.id)).reduce((n, q) => n + q.cell.h, 0);
    h.set(id, h.get(id)! + (free * rows) / all);
  }
  if (m.stretchLast) {
    const placed = pack(ids, cells, h, gap);
    for (const p of placed)
      if (below(p, placed).length === 0 && p.top + p.h < innerH) h.set(p.id, innerH - p.top);
  }
  return h;
}

/**
 * Splits a page into screens so nothing ever scrolls vertically (ADR-006) and places every item.
 * Controls that share grid rows form a band; bands are never cut. A band that does not fit under
 * the previous ones (fixed heights + stretchable items at `MIN_ROW` per row) starts a new screen.
 * `width` × `height` is the screen (the pager's viewport); paddings come from `m`.
 */
export function layoutPage(
  cells: Map<string, Cell>,
  items: ReadonlyMap<string, Item>,
  width: number,
  height: number,
  m: PultMetrics,
  cols = 12,
): Screen[] {
  const innerW = Math.max(0, width - m.padX * 2);
  const innerH = Math.max(0, height - m.padTop - m.padBottom);
  const sorted = [...cells.entries()].sort(([, a], [, b]) => a.y - b.y || a.x - b.x);
  const bands: Array<{ bottom: number; ids: string[] }> = [];
  for (const [id, c] of sorted) {
    const last = bands.at(-1);
    if (last && c.y < last.bottom) {
      last.bottom = Math.max(last.bottom, c.y + c.h);
      last.ids.push(id);
    } else bands.push({ bottom: c.y + c.h, ids: [id] });
  }
  const minH = (ids: string[]) => {
    const h = new Map<string, number>();
    for (const id of ids) {
      const it = items.get(id);
      const rows = cells.get(id)!.h;
      h.set(id, it?.height ?? Math.max(it?.min ?? 0, rows * MIN_ROW + (rows - 1) * m.gap));
    }
    return bottomOf(pack(ids, cells, h, m.gap));
  };
  const groups: string[][] = [];
  for (const b of bands) {
    const cur = groups.at(-1);
    if (cur && minH([...cur, ...b.ids]) <= innerH + 0.5) cur.push(...b.ids);
    else groups.push([...b.ids]);
  }
  if (!groups.length) return [{ ids: [], rects: new Map() }];

  const colW = (innerW - m.gap * (cols - 1)) / cols;
  return groups.map((ids) => {
    const h = layoutScreen(ids, cells, items, innerH, m);
    const placed = pack(ids, cells, h, m.gap);
    // A single band taller than the screen is scaled to fit (it can't move anywhere else). Up to
    // one gap of overflow into the bottom padding is kept as is (the Figma Console allows it).
    const total = bottomOf(placed);
    const k = total > innerH + m.gap ? innerH / total : 1;
    const rects = new Map<string, Rect>();
    for (const p of placed)
      rects.set(p.id, {
        x: m.padX + p.cell.x * (colW + m.gap),
        y: m.padTop + p.top * k,
        w: p.cell.w * colW + (p.cell.w - 1) * m.gap,
        h: p.h * k,
      });
    return { ids: placed.map((p) => p.id), rects };
  });
}

/** Layout input for a page's controls and panels: fixed heights and minimums from Figma. */
export function itemsFor(
  controls: readonly AnyControl[],
  panels: ReadonlyArray<{ id: string; pattern: PanelPattern; controls: readonly string[] }>,
  s: ControlSizes,
): Map<string, Item> {
  const out = new Map<string, Item>();
  for (const c of controls) {
    const height = naturalHeightFor(c, s);
    out.set(c.id, height === undefined ? { min: minFor(c) } : { height });
  }
  for (const p of panels) {
    const n = panelMinHeight(p.pattern, p.controls.length);
    out.set(p.id, STRETCHY_PANELS.has(p.pattern) ? { min: n } : { height: n });
  }
  return out;
}

/** Figma heights the stretchable controls never go below. */
function minFor(c: AnyControl): number | undefined {
  if (c.type === "thumbstick") return 206;
  return undefined;
}

/**
 * Console-Panel patterns (Figma Patterns) fill their column's width up to a maximum — centred when
 * capped: Fader Bank 640, Knob Row and Camera Control 480, the others 560.
 */
export function panelMaxWidth(pattern: PanelPattern): number {
  if (pattern === "faderBank") return 640;
  if (pattern === "knobRow" || pattern === "cameraControl") return 480;
  return 560;
}
