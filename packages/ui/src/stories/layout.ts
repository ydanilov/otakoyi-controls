/**
 * Layout sensor (owner's rule: layout problems are caught against Figma before they reach users).
 * Runs in the browser on React Native Web output:
 * - `pnpm test-storybook` calls `layoutViolations()` after every story, in dark and light, and fails
 *   the run on any violation (and if no sheet layout was checked at all — the sensor went blind);
 * - sheet / drawer / inspector stories call `expectSheetLayout()` in `play` to compare the
 *   header height and the header → first content gap with the Figma frame (`SHEET` in ds/logic).
 *
 * It reads the test ids `SheetScaffold` renders (`LAYOUT_TEST_ID` in containers/Sheet.tsx).
 * Invariants for every scaffold on the page:
 * 1. the header's box never intersects anything the body shows (text glyphs, icons, images,
 *    controls, filled or bordered boxes), measured where the body actually shows it (clipped
 *    by the body — content scrolled out of view does not count);
 * 2. the header lies inside the scaffold, the body below or under it lies inside the scaffold;
 * 3. nothing in the body is cut off at the left or right edge of the surface or of a clipping
 *    frame around it (the phone / drawer frame, the screen); vertical overflow is fine: it scrolls.
 */

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface LayoutReport {
  /** How many scaffolds were checked. */
  checked: number;
  violations: string[];
}

const EPS = 0.5;
const area = (b: Box) => Math.max(0, b.right - b.left) * Math.max(0, b.bottom - b.top);
const box = (r: DOMRect | Box): Box => ({
  left: r.left,
  top: r.top,
  right: r.right,
  bottom: r.bottom,
});
function intersect(a: Box, b: Box): Box | null {
  const r = {
    left: Math.max(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  };
  return r.right - r.left > EPS && r.bottom - r.top > EPS ? r : null;
}
const fmt = (b: Box) =>
  `[${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.right - b.left)}×${Math.round(b.bottom - b.top)}]`;

function visible(el: Element): boolean {
  const s = getComputedStyle(el);
  return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > 0;
}

function painted(el: Element): boolean {
  const s = getComputedStyle(el);
  const bg = s.backgroundColor;
  const filled = !!bg && bg !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(bg);
  const bordered = ["Top", "Right", "Bottom", "Left"].some(
    (side) =>
      parseFloat(s.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 &&
      !/rgba\([^)]*,\s*0\)$/.test(s.getPropertyValue(`border-${side.toLowerCase()}-color`)),
  );
  return filled || bordered;
}

/** Everything the body draws, as tight boxes with a short label for the report. */
function contentBoxes(body: Element): Array<{ b: Box; what: string; el: Element }> {
  const out: Array<{ b: Box; what: string; el: Element }> = [];
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent?.trim();
    if (!text || !n.parentElement || !visible(n.parentElement)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects()))
      if (area(r) > 0)
        out.push({ b: box(r), what: `text "${text.slice(0, 24)}"`, el: n.parentElement });
  }
  for (const el of Array.from(body.querySelectorAll("*"))) {
    if (!visible(el)) continue;
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role");
    const media = ["svg", "img", "canvas", "input", "textarea", "video"].includes(tag);
    const control = role === "button" || role === "switch" || role === "checkbox";
    if (!media && !control && !painted(el)) continue;
    if (el.closest("svg") && tag !== "svg") continue;
    const r = el.getBoundingClientRect();
    if (area(r) <= 0) continue;
    const label = el.getAttribute("aria-label") ?? el.getAttribute("data-testid") ?? "";
    out.push({ b: box(r), what: `${role ?? tag}${label ? ` "${label.slice(0, 24)}"` : ""}`, el });
  }
  return out;
}

/** Inside a horizontally scrolling container (chips, image strips): overflow there is intended. */
function inHorizontalScroller(el: Element, stop: Element): boolean {
  for (let p = el.parentElement; p && p !== stop; p = p.parentElement) {
    const o = getComputedStyle(p).overflowX;
    if ((o === "auto" || o === "scroll") && p.scrollWidth > p.clientWidth + 1) return true;
  }
  return false;
}

/**
 * The horizontal window the surface really has: its own box cut by every ancestor that clips
 * (overflow hidden / scroll — a phone or drawer frame, the screen). A story frame wider than the
 * test browser is not "cut off" while the page itself can still scroll to it.
 */
function clipFrame(el: Element, own: Box): { left: number; right: number } {
  let left = own.left;
  let right = own.right;
  for (let p = el.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowX;
    if (o === "visible") continue;
    const r = p.getBoundingClientRect();
    left = Math.max(left, r.left);
    right = Math.min(right, r.right);
  }
  return { left, right };
}

export function layoutViolations(root: ParentNode = document): LayoutReport {
  const violations: string[] = [];
  const scaffolds = Array.from(root.querySelectorAll('[data-testid="layout-scaffold"]')).filter(
    visible,
  );
  for (const [i, scaffold] of scaffolds.entries()) {
    const name = `scaffold ${i + 1}`;
    const header = scaffold.querySelector('[data-testid="layout-header"]');
    const body = scaffold.querySelector('[data-testid="layout-body"]');
    if (!header || !body) {
      violations.push(`${name}: missing ${header ? "body" : "header"}`);
      continue;
    }
    const s = box(scaffold.getBoundingClientRect());
    const bodyBox = box(body.getBoundingClientRect());
    // The header's own painted area: a floating header is just its button(s).
    const h = box(header.getBoundingClientRect());
    if (area(h) <= 0) violations.push(`${name}: header has no size`);
    if (h.left < s.left - EPS || h.right > s.right + EPS || h.top < s.top - EPS)
      violations.push(`${name}: header ${fmt(h)} sticks out of the surface ${fmt(s)}`);
    if (bodyBox.bottom > s.bottom + EPS || bodyBox.top < s.top - EPS)
      violations.push(`${name}: body ${fmt(bodyBox)} sticks out of the surface ${fmt(s)}`);
    const frame = clipFrame(scaffold, s);
    const seen = new Set<string>();
    for (const c of contentBoxes(body)) {
      const shown = intersect(c.b, bodyBox);
      if (!shown) continue;
      const hit = intersect(shown, h);
      if (hit && !seen.has(c.what)) {
        seen.add(c.what);
        violations.push(
          `${name}: header ${fmt(h)} overlaps ${c.what} ${fmt(shown)} — content must start below the header`,
        );
      }
      if (
        (c.b.left < frame.left - EPS || c.b.right > frame.right + EPS) &&
        !inHorizontalScroller(c.el, body) &&
        !seen.has(`clip ${c.what}`)
      ) {
        seen.add(`clip ${c.what}`);
        violations.push(`${name}: ${c.what} ${fmt(c.b)} is cut off at the side of the screen`);
      }
    }
  }
  return { checked: scaffolds.length, violations };
}

/**
 * `play` helper for sheet stories: no sensor violations, and the Figma metrics hold — the header is
 * `headerHeight` tall and the first content element starts `gap` pt below it (±1 pt).
 */
export async function expectSheetLayout(
  canvasElement: HTMLElement,
  figma: { headerHeight?: number; gap?: number; floating?: boolean },
): Promise<void> {
  // The first paint (fonts, Reanimated entering) can land after `play` starts: retry for 3 s.
  const until = Date.now() + 3000;
  for (;;) {
    try {
      return checkSheetLayout(canvasElement, figma);
    } catch (e) {
      if (Date.now() > until) throw e;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

function checkSheetLayout(
  canvasElement: HTMLElement,
  figma: { headerHeight?: number; gap?: number; floating?: boolean },
): void {
  const report = layoutViolations(canvasElement);
  if (report.checked === 0) throw new Error("layout sensor: no SheetScaffold in this story");
  if (report.violations.length) throw new Error(report.violations.join("\n"));
  const scaffold = canvasElement.querySelector('[data-testid="layout-scaffold"]')!;
  const header = box(
    scaffold.querySelector('[data-testid="layout-header"]')!.getBoundingClientRect(),
  );
  const body = scaffold.querySelector('[data-testid="layout-body"]')!;
  const bodyBox = box(body.getBoundingClientRect());
  const tops = contentBoxes(body)
    .map((c) => c.b.top)
    .filter((t) => t >= bodyBox.top - EPS);
  const first = Math.min(...tops);
  const fail = (what: string, got: number, want: number) => {
    if (Math.abs(got - want) > 1)
      throw new Error(`layout vs Figma: ${what} is ${Math.round(got)} pt, Figma says ${want} pt`);
  };
  if (figma.headerHeight !== undefined)
    fail("header height", header.bottom - header.top, figma.headerHeight);
  // A floating header sits over the body: the gap is from the body's top edge.
  const from = figma.floating ? bodyBox.top : header.bottom;
  // Text boxes include the line's leading; measure the first block that starts the content.
  if (figma.gap !== undefined)
    fail("gap from the header to the first content", first - from, figma.gap);
}
