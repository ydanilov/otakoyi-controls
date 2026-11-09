/**
 * Visual states of the continuous controls (fader, jog, knob), as pure numbers the Skia controls
 * animate between. ADR-013: neon glow appears only on lit values and on press.
 *
 * - **Active** (finger down or dragging): the full glow.
 * - **Rest**: lit values keep a softer glow, ~40 % of the active strength.
 * - **Fine** (two fingers): the tick marks spread apart around the thumb (×1.8) so the finer
 *   steps are visible, and the badge shows the coefficient (`×0.2`).
 */

/** Glow strength while the finger is on the control. */
export const GLOW_ACTIVE = 1;
/** Glow strength of a lit value at rest (35–45 % of active). */
export const GLOW_REST = 0.4;
/** Duration of the rest ↔ active glow animation, ms. */
export const GLOW_MS = 180;

/** Target glow strength for a control state. A value that is not lit has no glow at rest. */
export function glowLevel(active: boolean, lit = true): number {
  "worklet";
  if (active) return GLOW_ACTIVE;
  return lit ? GLOW_REST : 0;
}

/** Tick spacing multiplier in fine mode. */
export const FINE_SPREAD = 1.8;
/** Spring of the tick spread (Reanimated `withSpring` config, duration-based). */
export const FINE_SPRING = { duration: 220, dampingRatio: 0.8 } as const;

/** Badge text for fine mode: the control's `fineFactor` as a coefficient, e.g. `×0.2`. */
export function fineBadge(fineFactor: number): string {
  const f = Number.isFinite(fineFactor) && fineFactor > 0 ? fineFactor : 0.2;
  return `×${Math.round(f * 1000) / 1000}`;
}

/**
 * Tick positions (0..1 along the track) spread around the thumb: each tick's distance from
 * `center` is multiplied by `spread` (1 = rest, FINE_SPREAD in fine mode). Ticks pushed past the
 * ends are dropped. `phase` shifts an endless pattern (jog ribs) before spreading.
 */
export function spreadTicks(count: number, center: number, spread: number, phase = 0): number[] {
  "worklet";
  const out: number[] = [];
  if (count < 2) return out;
  const step = 1 / (count - 1);
  // Enough ticks to still fill the track when they are squeezed back (spread < 1 never happens,
  // but an endless pattern needs one extra on each side).
  const shift = ((phase % step) + step) % step;
  for (let i = -1; i <= count; i++) {
    const p = i * step + shift;
    const q = center + (p - center) * spread;
    if (q >= -1e-9 && q <= 1 + 1e-9) out.push(Math.min(1, Math.max(0, q)));
  }
  return out;
}

/** Same for a dial: tick angles (degrees) around the needle angle, within [start, start+travel]. */
export function spreadDialTicks(
  count: number,
  start: number,
  travel: number,
  needle: number,
  spread: number,
  phaseDeg = 0,
): number[] {
  "worklet";
  const out: number[] = [];
  if (count < 2) return out;
  if (travel >= 360) {
    // Endless ring (encoder): ticks all the way round, turning with `phaseDeg`.
    const step = 360 / count;
    for (let i = 0; i < count; i++) {
      const a = start + i * step + phaseDeg;
      const d = ((((a - needle + 180) % 360) + 360) % 360) - 180;
      if (Math.abs(d * spread) <= 180) out.push(needle + d * spread);
    }
    return out;
  }
  const step = travel / (count - 1);
  for (let i = 0; i < count; i++) {
    const q = needle + (start + i * step - needle) * spread;
    if (q >= start - 1e-6 && q <= start + travel + 1e-6) out.push(q);
  }
  return out;
}
