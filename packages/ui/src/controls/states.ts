import {
  FINE_SPREAD,
  FINE_SPRING,
  GLOW_MS,
  glowLevel,
  spreadDialTicks,
  spreadTicks,
} from "@osc/controls";
import { Skia, type SkPath } from "@shopify/react-native-skia";
import * as React from "react";
import { useSharedValue, withSpring, withTiming, type SharedValue } from "react-native-reanimated";

/** Blur radius of the neon glow, px. */
export const GLOW_BLUR = 9;

/**
 * Glow strength of a control, animated between rest and active (`glowLevel`, GLOW_MS). Gesture
 * worklets call `animateGlow(glow, true)` on touch and `animateGlow(glow, false)` on release.
 */
export function useGlow(): SharedValue<number> {
  return useSharedValue(glowLevel(false));
}

export function animateGlow(glow: SharedValue<number>, active: boolean, lit = true) {
  "worklet";
  glow.value = withTiming(glowLevel(active, lit), { duration: GLOW_MS });
}

/** Tick spacing: 1 at rest, FINE_SPREAD (spring) while fine mode is on. */
export function useFineSpread(fine: boolean): SharedValue<number> {
  const spread = useSharedValue(1);
  React.useEffect(() => {
    spread.value = withSpring(fine ? FINE_SPREAD : 1, FINE_SPRING);
  }, [fine, spread]);
  return spread;
}

/**
 * Tick marks across a straight track, as one path: `count` ticks spread around `center` (0..1)
 * by `spread`, drawn `inset`..`inset+len` from both long edges. Worklet.
 */
export function trackTicksPath(
  count: number,
  center: number,
  spread: number,
  phase: number,
  w: number,
  h: number,
  vertical: boolean,
  len: number,
  both = true,
): SkPath {
  "worklet";
  const b = Skia.PathBuilder.Make();
  const ticks = spreadTicks(count, center, spread, phase);
  for (const t of ticks) {
    if (vertical) {
      const y = h * (1 - t);
      b.moveTo(0, y).lineTo(len, y);
      if (both) b.moveTo(w - len, y).lineTo(w, y);
    } else {
      const x = w * t;
      b.moveTo(x, 0).lineTo(x, len);
      if (both) b.moveTo(x, h - len).lineTo(x, h);
    }
  }
  return b.build();
}

/** Tick ring of a dial (angles in degrees, 0 = up, clockwise), from radius r1 to r2. Worklet. */
export function dialTicksPath(
  count: number,
  start: number,
  travel: number,
  needle: number,
  spread: number,
  phase: number,
  cx: number,
  cy: number,
  r1: number,
  r2: number,
): SkPath {
  "worklet";
  const b = Skia.PathBuilder.Make();
  for (const deg of spreadDialTicks(count, start, travel, needle, spread, phase)) {
    const a = ((deg - 90) * Math.PI) / 180;
    b.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1).lineTo(
      cx + Math.cos(a) * r2,
      cy + Math.sin(a) * r2,
    );
  }
  return b.build();
}
