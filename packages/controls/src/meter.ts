/**
 * Level meter (Figma `Meter` 11:172): a column of LED segments in a recessed track. Pure maths
 * for the drawing in `packages/ui`.
 * - Zones: signal up to 70 %, warning 70–90 %, critical above 90 % of the range (or the control's
 *   `warnAt` / `criticalAt`). Unlit segments show their zone colour at 13 %.
 * - The top 3 lit segments glow.
 * - Peak hold: a white line at the highest recent level; it holds ~1.5 s, then falls.
 * - dB scale 0 / −6 / −12 / −24 / −48 on the right.
 */

export const METER_SEGMENTS = 24;
export const METER_WARN = 0.7;
export const METER_CRITICAL = 0.9;
/** Opacity of an unlit segment (its zone colour). */
export const METER_UNLIT_OPACITY = 0.13;
/** How many of the top lit segments glow. */
export const METER_GLOW_TOP = 3;
/** Peak hold, ms, and how fast it falls afterwards (fraction of the range per second). */
export const METER_PEAK_HOLD_MS = 1500;
export const METER_PEAK_FALL = 0.6;
/** The scale marks (dB) and where they sit on the column (fraction from the top, Figma). */
export const METER_SCALE: ReadonlyArray<{ db: number; at: number }> = [
  { db: 0, at: 0 },
  { db: -6, at: 0.1 },
  { db: -12, at: 0.2 },
  { db: -24, at: 0.4 },
  { db: -48, at: 0.8 },
];

export type MeterZone = "signal" | "warning" | "critical";

export interface MeterSegment {
  /** 0 = bottom. */
  index: number;
  zone: MeterZone;
  lit: boolean;
  glow: boolean;
}

/** Zone thresholds as fractions of the range (the control's `warnAt` / `criticalAt` if set). */
export function meterZones(c: {
  min: number;
  max: number;
  warnAt?: number | undefined;
  criticalAt?: number | undefined;
}): { warn: number; critical: number } {
  const span = c.max - c.min || 1;
  const f = (v: number | undefined, d: number) =>
    v === undefined ? d : Math.min(1, Math.max(0, (v - c.min) / span));
  return { warn: f(c.warnAt, METER_WARN), critical: f(c.criticalAt, METER_CRITICAL) };
}

/** Zone of segment `i` of `count`: by the segment's top edge. */
export function segmentZone(
  i: number,
  count: number,
  zones: { warn: number; critical: number },
): MeterZone {
  const top = (i + 1) / count;
  if (top > zones.critical + 1e-9) return "critical";
  if (top > zones.warn + 1e-9) return "warning";
  return "signal";
}

/** Segments for a level 0–1 (a segment is lit when the level reaches its middle). */
export function meterSegments(
  level: number,
  zones: { warn: number; critical: number },
  count = METER_SEGMENTS,
): MeterSegment[] {
  const l = Math.min(1, Math.max(0, Number.isFinite(level) ? level : 0));
  const lit = Math.round(l * count);
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    zone: segmentZone(i, count, zones),
    lit: i < lit,
    glow: i < lit && i >= lit - METER_GLOW_TOP,
  }));
}

export interface PeakState {
  /** Shown peak, 0–1. */
  peak: number;
  /** The level the peak was raised to, 0–1 (it falls from here). */
  top: number;
  /** When the peak was last raised, ms. */
  at: number;
}

export const NO_PEAK: PeakState = { peak: 0, top: 0, at: 0 };

/**
 * Peak hold: rises at once with the level; holds `METER_PEAK_HOLD_MS`, then falls at
 * `METER_PEAK_FALL` per second, never below the level.
 */
export function stepPeak(state: PeakState, level: number, now: number): PeakState {
  const l = Math.min(1, Math.max(0, Number.isFinite(level) ? level : 0));
  if (l >= state.peak) return { peak: l, top: l, at: now };
  const held = now - state.at;
  if (held <= METER_PEAK_HOLD_MS) return state;
  const fallen = state.top - ((held - METER_PEAK_HOLD_MS) / 1000) * METER_PEAK_FALL;
  return { ...state, peak: Math.max(l, fallen) };
}
