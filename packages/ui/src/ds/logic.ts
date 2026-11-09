/**
 * Pure decisions behind the design-system components (AGENTS.md rule 6): components only draw and
 * forward gestures; everything that decides a value, a layout or a presentation lives here, tested.
 */
import { PHONE_BREAKPOINT } from "../pult/layout";

export interface NumericRange {
  min: number;
  max: number;
  /** Increment of the stepper; also sets the decimals shown. */
  step: number;
}

const clamp = (v: number, lo: number, hi: number) => {
  "worklet";
  return Math.min(hi, Math.max(lo, v));
};

/** Decimal places implied by a step (0.1 → 1, 0.25 → 2, 5 → 0). */
export function stepDecimals(step: number): number {
  const s = String(step);
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
}

/** Snap to the step grid anchored at `min`, without float noise (0.1 + 0.2 → 0.3). */
export function snapToStep(value: number, r: NumericRange): number {
  const snapped = r.min + Math.round((value - r.min) / r.step) * r.step;
  return Number(clamp(snapped, r.min, r.max).toFixed(stepDecimals(r.step)));
}

/** Stepper −/+ : one step in `direction`, snapped and clamped. */
export function stepValue(value: number, direction: 1 | -1, r: NumericRange): number {
  return snapToStep(value + direction * r.step, r);
}

/** Stepper display: fixed decimals from the step, so 22 shows as 22.0 when step is 0.5. */
export function formatStepped(value: number, step: number): string {
  return value.toFixed(stepDecimals(step));
}

export type ValueInputResult =
  { ok: true; value: number; clamped: boolean } | { ok: false; reason: "empty" | "nan" };

/**
 * Value Input commit: accepts "250", "0,5" (comma decimals from iOS locales), " 12.5 ".
 * Out-of-range numbers are clamped to min/max (and reported as `clamped`), never rejected.
 */
export function parseValueInput(
  text: string,
  r: { min?: number; max?: number; step?: number },
): ValueInputResult {
  const s = text.trim().replace(",", ".");
  if (s === "" || s === "-" || s === ".") return { ok: false, reason: "empty" };
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return { ok: false, reason: "nan" };
  const n = Number(s);
  const lo = r.min ?? -Infinity;
  const hi = r.max ?? Infinity;
  let v = clamp(n, lo, hi);
  if (r.step) v = Number((Math.round(v / r.step) * r.step).toFixed(stepDecimals(r.step)));
  v = clamp(v, lo, hi);
  return { ok: true, value: v, clamped: v !== n };
}

export type FormFactor = "phone" | "tablet";

/** Phone below the 600 pt breakpoint, tablet from it (the same split the pult grid uses). */
export function formFactor(windowWidth: number): FormFactor {
  return windowWidth < PHONE_BREAKPOINT ? "phone" : "tablet";
}

/** What opens over the pult (ADR-013, Apple HIG). */
export type OverlaySurface = "settings" | "installation" | "dialog";

/**
 * Native stack options for a sheet route (expo-router `Stack.Screen options`, SDK 58
 * `presentation: "formSheet"`). On iPhone a form sheet is a system sheet with detents; on iPad it
 * is the centred form sheet over a dimmed console.
 */
export interface SheetOptions {
  presentation: "formSheet";
  sheetAllowedDetents: number[];
  sheetGrabberVisible: boolean;
  sheetInitialDetentIndex: number;
}

export type Presentation =
  | { kind: "sheet"; options: SheetOptions }
  /** iPad Installation: a 390 pt trailing inspector panel inside the pult screen, no dimming. */
  | { kind: "inspector"; width: number }
  /** iPad Settings: a 400 pt floating drawer from the leading edge over the dimmed pult. */
  | { kind: "drawer"; width: number };

/**
 * iPad Settings drawer (Figma Tablet / 04 Settings): 400 pt wide, 12 pt in from the left and the
 * bottom, its top 12 pt under the status bar, radius 28.
 */
export const DRAWER = { width: 400, inset: 12, top: 12, radius: 28 } as const;

/** A swipe to the left on the drawer closes it: far enough (80 pt) or fast enough. */
export function drawerCloses(translationX: number, velocityX: number): boolean {
  "worklet";
  return translationX < -80 || velocityX < -600;
}

/** Width of the iPad Installation inspector (HIG inspector width). */
export const INSPECTOR_WIDTH = 390;

/**
 * Sheet chrome metrics (Figma Client · Template › Phone / 07 Settings 104:7979, Phone / 10
 * Installation 104:8937 — "Toolbar - Top - iPhone"; Tablet / 07 Settings drawer 99:7941; Tablet / 10
 * Installation inspector 99:7287). `content` is the gap from the header's bottom edge to the first
 * content element. The layout sensor (Storybook) checks the rendered sheets against these.
 */
export const SHEET = {
  /** iPhone sheet toolbar: 16 pt from the sheet's top edge, a 44 pt row, 10 pt below it = 70. */
  toolbar: { top: 16, row: 44, bottom: 10, height: 70 },
  /** First content element below the toolbar: Settings 12 pt, Installation 16 pt. */
  content: { settings: 12, installation: 16 },
  /** iPad Settings drawer: 72 pt header, 8 pt to the first section. */
  drawer: { header: 72, content: 8 },
  /** iPad Installation inspector: content 24 pt from the top, Close × 14 pt from the top. */
  inspector: { content: 24, close: 14 },
} as const;

/**
 * How Settings, Installation and dialogs are presented (ADR-013, HIG):
 * - Settings: iPhone system sheet, large detent; iPad a floating drawer from the left.
 * - Installation: iPhone system sheet, large detent; iPad trailing inspector (no dimming).
 * - Dialog: iPhone sheet at the medium detent (can grow to large); iPad form sheet.
 */
export function presentationFor(surface: OverlaySurface, windowWidth: number): Presentation {
  const phone = formFactor(windowWidth) === "phone";
  if (surface === "installation" && !phone) return { kind: "inspector", width: INSPECTOR_WIDTH };
  if (surface === "settings" && !phone) return { kind: "drawer", width: DRAWER.width };
  const detents = surface === "dialog" && phone ? [0.5, 1] : [1];
  return {
    kind: "sheet",
    options: {
      presentation: "formSheet",
      sheetAllowedDetents: detents,
      sheetGrabberVisible: phone,
      sheetInitialDetentIndex: 0,
    },
  };
}

/**
 * Edge swipes are shortcuts only (the header buttons are the way in): the trailing (right) edge
 * opens Installation on phone and tablet; the leading (left) edge opens Settings on phones only —
 * on iPad the leading edge belongs to the system.
 */
export function edgeSwipeEnabled(side: "left" | "right", windowWidth: number): boolean {
  return side === "right" || formFactor(windowWidth) === "phone";
}

/** Edge swipe that opens a surface: far enough (a quarter of the window) or fast enough. */
export function edgeSwipeOpens(distance: number, velocity: number, windowWidth: number): boolean {
  "worklet";
  return velocity > 600 || distance > windowWidth / 4;
}

/** How long a toast stays (ms) before it dismisses itself — long enough to reach Undo. */
export const TOAST_MS = 5000;

/** Menu order rule (HIG): destructive items go last, everything else keeps its order. */
export function orderMenuItems<T extends { destructive?: boolean | undefined }>(
  items: readonly T[],
): T[] {
  return [...items.filter((i) => !i.destructive), ...items.filter((i) => i.destructive)];
}

/** Hold-to-confirm progress 0…1 (Quick Action in hold mode). */
export function holdFraction(elapsedMs: number, holdMs: number): number {
  return holdMs <= 0 ? 1 : clamp(elapsedMs / holdMs, 0, 1);
}

/** Upload progress label for Image Upload / Image Tile, e.g. "64% · 2.1 / 3.3 MB". */
export function uploadLabel(progress: number, totalBytes?: number): string {
  const pct = `${Math.round(clamp(progress, 0, 1) * 100)}%`;
  if (!totalBytes) return pct;
  const mb = (b: number) => (b / 1_000_000).toFixed(1);
  return `${pct} · ${mb(totalBytes * clamp(progress, 0, 1))} / ${mb(totalBytes)} MB`;
}

/** Position 0…1 along a horizontal track from a touch x, for the Master Bar. */
export function trackPosition(x: number, width: number): number {
  "worklet";
  return width <= 0 ? 0 : clamp(x / width, 0, 1);
}

/** Default port of the bridge on the installation machine. */
export const BRIDGE_PORT = 8080;

export type ManualPairing =
  | { ok: true; pairing: { bridge: string; pin: string } }
  | { ok: false; field: "address" | "pin"; message: string };

/**
 * "Enter address and PIN" (ADR-012 fallback): both are printed under the pairing QR. Accepts
 * `192.168.1.20`, `192.168.1.20:8080`, `studio.local`, or a full `ws://…/ws` URL; the PIN is digits.
 * Returns the same pairing the QR deep link carries.
 */
export function manualPairing(address: string, pin: string): ManualPairing {
  const a = address.trim();
  const p = pin.trim();
  if (!a) return { ok: false, field: "address", message: "Enter the address shown under the QR" };
  let bridge: string;
  if (/^wss?:\/\//i.test(a)) bridge = a;
  else {
    const m = /^([a-z0-9.-]+|\[[0-9a-f:]+\])(?::(\d{1,5}))?\/?$/i.exec(a);
    if (!m) return { ok: false, field: "address", message: "That doesn't look like an address" };
    bridge = `ws://${m[1]}:${m[2] ?? BRIDGE_PORT}/ws`;
  }
  if (!/^wss?:\/\/[^\s/]+(\/[^\s]*)?$/i.test(bridge) || bridge.length > 256)
    return { ok: false, field: "address", message: "That doesn't look like an address" };
  if (!/^\d{4,8}$/.test(p)) return { ok: false, field: "pin", message: "The PIN is 4–8 digits" };
  return { ok: true, pairing: { bridge, pin: p } };
}
