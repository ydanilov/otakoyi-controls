/**
 * Fader and knob modes (ADR-015): crossfade detent, relative (endless) deltas, knob travel and the
 * hue wheel. Pure functions; the gesture worklets call the "worklet" ones on the UI thread.
 */
import type { ControlOf } from "@osc/schema";

const clamp01 = (v: number) => {
  "worklet";
  return Math.min(1, Math.max(0, v));
};
const round6 = (v: number) => Math.round(v * 1e6) / 1e6;

// ---------- crossfade ----------

/**
 * Crossfade position (0..1 along the track) → mix (0..1) with a centre detent: the middle
 * `±detent` of the track holds exactly 0.5, the rest of each half is stretched to stay continuous,
 * so the ends still reach 0 and 1.
 */
export function crossfadeMix(pos: number, detent: number): number {
  "worklet";
  const p = clamp01(pos);
  const d = Math.min(0.49, Math.max(0, detent));
  if (d === 0) return p;
  const half = 0.5 - d;
  if (p <= half) return (p / half) * 0.5;
  if (p >= 0.5 + d) return 0.5 + ((p - 0.5 - d) / half) * 0.5;
  return 0.5;
}

/** Inverse of `crossfadeMix` (mix → track position), for feedback and defaults. */
export function crossfadePosition(mix: number, detent: number): number {
  const m = clamp01(mix);
  const d = Math.min(0.49, Math.max(0, detent));
  const half = 0.5 - d;
  if (m < 0.5) return (m / 0.5) * half;
  if (m > 0.5) return 0.5 + d + ((m - 0.5) / 0.5) * half;
  return 0.5;
}

/** How much of A and of B is in a mix, in percent — what the crossfade shows under its labels. */
export function crossfadeShares(mix: number): { a: number; b: number } {
  const b = Math.round(clamp01(mix) * 100);
  return { a: 100 - b, b };
}

/**
 * Crossfade header value (Figma Prompt Mix "A 30 · B 70"): each side's share, named by `labels`
 * (A / B by default). The fader's ends carry LEDs only.
 */
export function crossfadeLabel(
  labels: { a?: string | undefined; b?: string | undefined } | undefined,
  mix: number,
): string {
  const s = crossfadeShares(mix);
  return `${labels?.a ?? "A"} ${s.a} · ${labels?.b ?? "B"} ${s.b}`;
}

// ---------- relative (endless) ----------

/**
 * Pixels dragged → value change for an endless control. A drag of `lengthPx` (the track, or one
 * full knob sweep) moves `span` (max − min); `factor` is the fine-mode multiplier.
 */
export function jogDelta(distancePx: number, lengthPx: number, span: number, factor = 1): number {
  "worklet";
  return (distancePx / Math.max(1, lengthPx)) * span * factor;
}

/**
 * Throttle for deltas. Unlike `createThrottle` (which keeps only the latest value), deltas that
 * arrive inside the window are summed, so no movement is lost: the first delta is sent at once,
 * the rest are accumulated and sent at most `hz` times a second, and `flush()` sends what is left.
 * Zero sums are never sent.
 */
export function createDeltaAccumulator(
  hz: number,
  send: (delta: number) => void,
  now: () => number = Date.now,
) {
  const interval = 1000 / hz;
  let last = -Infinity;
  let pending = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const emit = () => {
    timer = null;
    if (pending === 0) return;
    const d = round6(pending);
    pending = 0;
    last = now();
    if (d !== 0) send(d);
  };
  return {
    push(delta: number) {
      if (!Number.isFinite(delta) || delta === 0) return;
      pending += delta;
      const t = now();
      if (t - last >= interval && !timer) emit();
      else if (!timer) timer = setTimeout(emit, Math.max(0, interval - (t - last)));
    },
    flush() {
      if (timer) clearTimeout(timer);
      emit();
    },
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = 0;
    },
    /** Not yet sent. */
    get pending() {
      return pending;
    },
  };
}

// ---------- knob ----------

/** Default knob travel (degrees), matching the Figma library. */
export const KNOB_TRAVEL = 240;

/** Effective knob mode; v1 `endless: true` still means relative. */
export function knobMode(
  c: Pick<ControlOf<"knob">, "mode" | "endless">,
): ControlOf<"knob">["mode"] {
  return c.mode === "absolute" && c.endless ? "relative" : c.mode;
}

/** Angle of the start of the arc: the gap is centred at the bottom. Degrees, 0 = up, clockwise. */
export const knobStart = (travel = KNOB_TRAVEL) => {
  "worklet";
  return -travel / 2;
};

/** Knob position (0..1) → needle angle in degrees (0 = up, clockwise). Clamped to the travel. */
export const knobAngle = (pos: number, travel = KNOB_TRAVEL) => {
  "worklet";
  return knobStart(travel) + clamp01(pos) * travel;
};

/**
 * Needle angle → position, clamped to the travel: past either end of the arc the knob stays at
 * 0 or 1 (an absolute knob has hard stops; only the hue wheel wraps).
 */
export function angleToPosition(angle: number, travel = KNOB_TRAVEL): number {
  // Normalise into (-180, 180] so "just past the top" never reads as the far end.
  const a = ((((angle + 180) % 360) + 360) % 360) - 180;
  return clamp01((a - knobStart(travel)) / travel);
}

/** Hue in degrees, wrapped into [0, 360). */
export function wrapHue(deg: number): number {
  "worklet";
  const h = ((deg % 360) + 360) % 360;
  return Math.round(h * 1e4) / 1e4;
}

/** Hue wheel drag: pixels → degrees, wrapping past 360 instead of stopping. */
export function hueDrag(hue: number, distancePx: number, pxPerTurn: number, factor = 1): number {
  "worklet";
  return wrapHue(hue + (distancePx / Math.max(1, pxPerTurn)) * 360 * factor);
}
