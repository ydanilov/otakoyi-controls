import { hexToRgb, hsvToHex, rgbToHsv, type HsbChannel } from "./logic";

/**
 * Colour Picker maths (Figma Patterns › Color Picker, Style=Knobs / Square / Wheel). The picker
 * works in HSB (hue 0–360°, saturation and brightness 0–1); every style edits the same three
 * numbers, so switching styles never changes the colour. Pure, unit-tested; `packages/ui` draws.
 */

export interface Hsb {
  /** Hue, degrees 0–360 (360 wraps to 0). */
  h: number;
  /** Saturation 0–1. */
  s: number;
  /** Brightness 0–1. */
  b: number;
}

export type PickerStyle = "knobs" | "square" | "wheel";
export const PICKER_STYLES: readonly PickerStyle[] = ["knobs", "square", "wheel"];

const clamp01 = (v: number) => {
  "worklet";
  return Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
};

/** Hue into 0–360 (wraps, never NaN). */
export function wrapDeg(h: number): number {
  "worklet";
  if (!Number.isFinite(h)) return 0;
  return ((h % 360) + 360) % 360;
}

/** HSB → `#RRGGBB`. */
export function hsbToHex({ h, s, b }: Hsb): string {
  return hsvToHex(wrapDeg(h) / 360, clamp01(s), clamp01(b));
}

/** `#RRGGBB` → HSB (hue in degrees). */
export function hexToHsb(hex: string): Hsb {
  const [h, s, b] = rgbToHsv(hexToRgb(hex));
  return { h: wrapDeg(h * 360), s, b };
}

/**
 * The colour the picker keeps while a value comes back from the installation: an incoming hex is
 * applied only when it differs from the current colour, so a grey or black (no hue / saturation)
 * does not reset the hue the user had chosen.
 */
export function syncHsb(current: Hsb, incoming: string): Hsb {
  if (hsbToHex(current).toUpperCase() === incoming.toUpperCase()) return current;
  const next = hexToHsb(incoming);
  // Hue is undefined at s = 0 or b = 0; saturation is undefined at b = 0: keep ours.
  return {
    h: next.s === 0 || next.b === 0 ? current.h : next.h,
    s: next.b === 0 ? current.s : next.s,
    b: next.b,
  };
}

/**
 * Knobs style: colours of the hue ring's `count` segments, each `hsb(segmentHue, S, B)` — the ring
 * re-renders with the current saturation and brightness (Figma: 48 segments over the 240° face).
 */
export function hueRingColors(count: number, s: number, b: number): string[] {
  return Array.from({ length: count }, (_, i) => hsbToHex({ h: (i / count) * 360, s, b }));
}

/** Knobs style: the saturation arc runs `hsb(h, 0, B)` → `hsb(h, 1, B)`. */
export function saturationGradient(h: number, b: number): [string, string] {
  return [hsbToHex({ h, s: 0, b }), hsbToHex({ h, s: 1, b })];
}

/** Knobs style: the brightness arc runs `hsb(h, S, 0)` → `hsb(h, S, 1)` (also the Wheel slider). */
export function brightnessGradient(h: number, s: number): [string, string] {
  return [hsbToHex({ h, s, b: 0 }), hsbToHex({ h, s, b: 1 })];
}

/** Square style: S × B field point (px) of a colour — S left→right, B bottom→top. */
export function squarePoint(
  s: number,
  b: number,
  width: number,
  height: number,
): { x: number; y: number } {
  "worklet";
  return { x: clamp01(s) * width, y: (1 - clamp01(b)) * height };
}

/** Square style: S and B under a finger at (x, y) in a field of `width` × `height`. */
export function squareToSb(
  x: number,
  y: number,
  width: number,
  height: number,
): { s: number; b: number } {
  "worklet";
  return {
    s: width > 0 ? clamp01(x / width) : 0,
    b: height > 0 ? 1 - clamp01(y / height) : 0,
  };
}

/** Hue strip / brightness slider: position 0–1 under a finger, the thumb's centre kept inside. */
export function stripPosition(x: number, width: number, thumb: number): number {
  "worklet";
  const travel = width - thumb;
  return travel > 0 ? clamp01((x - thumb / 2) / travel) : 0;
}

/** Hue strip / brightness slider: x of the thumb's centre for a position 0–1. */
export function stripX(p: number, width: number, thumb: number): number {
  "worklet";
  return thumb / 2 + clamp01(p) * Math.max(0, width - thumb);
}

/**
 * Wheel style: hue is the angle (0° = 3 o'clock, clockwise, as Figma's angular gradient), saturation
 * the distance from the centre (0 centre → 1 rim). Point relative to the centre, px.
 */
export function wheelPoint(h: number, s: number, radius: number): { x: number; y: number } {
  "worklet";
  const a = (wrapDeg(h) * Math.PI) / 180;
  const r = clamp01(s) * radius;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

/** Wheel style: hue and saturation under a finger at (dx, dy) from the centre. Outside the rim = 1. */
export function wheelToHs(dx: number, dy: number, radius: number): { h: number; s: number } {
  "worklet";
  const d = Math.hypot(dx, dy);
  const h = d === 0 ? 0 : wrapDeg((Math.atan2(dy, dx) * 180) / Math.PI);
  return { h, s: radius > 0 ? clamp01(d / radius) : 0 };
}

/** Readout: `H 230°`, `S 65%`, `B 65%` values. */
export function hsbReadout({ h, s, b }: Hsb): { h: string; s: string; b: string } {
  return {
    h: `${Math.round(wrapDeg(h)) % 360}°`,
    s: `${Math.round(clamp01(s) * 100)}%`,
    b: `${Math.round(clamp01(b) * 100)}%`,
  };
}

// ---------- feedback from the installation ----------

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
 * `hsb` format feedback: one channel arrived on `<address>/h|s|b`. `known` is the last full HSB the
 * pult knew for this control (kept by the store, so a hue that arrives while the colour is grey is
 * not lost); `current` is the control's hex. Returns the new HSB, or undefined for a bad value.
 */
export function applyHsbFeedback(
  known: Hsb | undefined,
  current: string,
  channel: HsbChannel,
  value: unknown,
  hueRange: "degrees" | "unit" = "degrees",
): Hsb | undefined {
  if (!finite(value)) return undefined;
  const base = known ? syncHsb(known, current) : hexToHsb(current);
  if (channel === "h") return { ...base, h: wrapDeg(hueRange === "unit" ? value * 360 : value) };
  return { ...base, [channel]: clamp01(value) };
}

/**
 * Single-message formats: the installation echoes the colour on the control's own address in the
 * format it was sent (`r g b` floats or ints, `h s v` floats, or `"#RRGGBB"`). Returns `#RRGGBB`, or
 * undefined when the message does not look like a colour in that format.
 */
export function colorFromArgs(
  format: "rgbFloat" | "rgbInt" | "hsvFloat" | "hex",
  vals: unknown[],
): string | undefined {
  const [a, b, c] = vals;
  if (typeof a === "string") return /^#[0-9a-f]{6}$/i.test(a) ? a.toUpperCase() : undefined;
  if (format === "hex" || !finite(a) || !finite(b) || !finite(c)) return undefined;
  if (format === "hsvFloat") return hsvToHex(((a % 1) + 1) % 1, clamp01(b), clamp01(c));
  const k = format === "rgbInt" ? 255 : 1;
  const ch = (v: number) => Math.round(clamp01(v / k) * 255);
  return (
    "#" +
    [a, b, c]
      .map((v) => ch(v).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}
