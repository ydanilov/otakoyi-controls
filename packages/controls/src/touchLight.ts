import type { TouchLightTokens } from "@osc/tokens";

/**
 * Touch light (Figma `Touch Light` 134:795, board "Touch light — press response" 134:15404): the
 * press response per Apple Liquid Glass — the touched element illuminates from within, starting
 * under the fingertip. Pure numbers here; `packages/ui` draws it.
 *
 * - WHITE light only, clipped to the touched element; it never spills onto the track or around it.
 * - Faders, knobs, thumbstick, jog wheel (`inner`): no separate layer — the thumb / disc / stick /
 *   wheel itself gets a radial white gradient (`innerOpacity` ≈ 16 % at the centre → 0) at the
 *   touch point.
 * - Pads, buttons, toggles, segments, quick actions, XY pad (`surface`): halo (`haloOpacity` 7 %)
 *   + core (`coreOpacity` 12 %, `coreScale` × the halo), clipped to the surface.
 * - In: `inMs` ease-out (scale `fromScale` → 1, opacity 0 → 1); follows the finger 1:1; out:
 *   `outMs`. Reduce Motion: opacity only. Never on a disabled or view-only control.
 */

export interface TouchLightSize {
  /** Halo diameter, px. */
  halo: number;
  /** Core diameter, px. */
  core: number;
}

/** Light size in a pad / button / segment / XY surface of `width` px. */
export function touchLightSize(width: number, tk: TouchLightTokens): TouchLightSize {
  "worklet";
  const m = Number.isFinite(width) && width > 0 ? width : 0;
  const halo = Math.min(m * tk.padScale, tk.haloMax);
  return { halo, core: halo * tk.coreScale };
}

/** Whether a control may show the light at all: never when disabled or view-only. */
export function touchLightAllowed(disabled: boolean | undefined): boolean {
  "worklet";
  return !disabled;
}

export interface TouchLightMotion {
  /** Scale the light starts from when it blooms in (1 = no scale animation). */
  fromScale: number;
  inMs: number;
  outMs: number;
}

/** Bloom in / fade out timings. Reduce Motion keeps the opacity fade and drops the scale. */
export function touchLightMotion(reduceMotion: boolean, tk: TouchLightTokens): TouchLightMotion {
  "worklet";
  return { fromScale: reduceMotion ? 1 : tk.fromScale, inMs: tk.inMs, outMs: tk.outMs };
}

/** The shape an inner light is clipped to: a circle (knob disc, stick) or a rectangle (thumb, wheel). */
export type LitShape =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x: number; y: number; width: number; height: number };

/**
 * Where the inner light's centre sits: the touch point, kept inside the touched element. A finger
 * that slides off the thumb keeps the light on the thumb's nearest edge.
 */
export function innerLightCenter(
  touch: { x: number; y: number },
  shape: LitShape,
): { x: number; y: number } {
  "worklet";
  const tx = Number.isFinite(touch.x) ? touch.x : 0;
  const ty = Number.isFinite(touch.y) ? touch.y : 0;
  if (shape.kind === "rect") {
    return {
      x: Math.min(shape.x + shape.width, Math.max(shape.x, tx)),
      y: Math.min(shape.y + shape.height, Math.max(shape.y, ty)),
    };
  }
  const dx = tx - shape.cx;
  const dy = ty - shape.cy;
  const d = Math.hypot(dx, dy);
  if (d <= shape.r || d === 0) return { x: shape.cx + (d === 0 ? 0 : dx), y: shape.cy + dy };
  return { x: shape.cx + (dx / d) * shape.r, y: shape.cy + (dy / d) * shape.r };
}

/** Radius of the inner light's gradient: half the element's larger side (the Figma radial fill). */
export function innerLightRadius(shape: LitShape): number {
  "worklet";
  return shape.kind === "circle" ? shape.r : Math.max(shape.width, shape.height) / 2;
}

/**
 * A light pinned at a point (stories, Figma "State=Pressed" snapshots): `x` / `y` are fractions of
 * the surface (0..1); `index` picks the cell in a multi-cell control (segment, group button).
 */
export interface TouchLightPin {
  x: number;
  y: number;
  index?: number;
}

/** Whether a pin applies to the light of cell `index` (0 for single-surface controls). */
export function pinMatches(pin: TouchLightPin | null | undefined, index = 0): boolean {
  return !!pin && (pin.index ?? 0) === index;
}

/** Pinned point in px for a surface of `width` × `height`, clamped to the surface. */
export function pinPoint(
  pin: TouchLightPin,
  width: number,
  height: number,
): { x: number; y: number } {
  "worklet";
  const c = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0.5));
  return { x: c(pin.x) * width, y: c(pin.y) * height };
}
