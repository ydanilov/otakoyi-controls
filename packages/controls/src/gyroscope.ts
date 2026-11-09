/**
 * Gyroscope (device tilt): the phone becomes the controller. Switched on, the pose it is held in
 * becomes the centre; tilting it from there moves a point. Roll (left / right) is x, pitch
 * (top edge away / towards you) is y, both −1..1 with y up, `range` degrees reaching ±1 and
 * clamped beyond. The platform part (permission, sensor) sits behind `MotionInput` in @osc/ui;
 * everything that decides what is sent is here.
 */
import { createThrottle } from "./logic";

/** One orientation reading from the platform, in degrees. */
export interface TiltSample {
  /**
   * Rotation around the device's x axis (W3C `beta`, expo-sensors `rotation.beta`): grows when
   * the top edge comes up towards the user.
   */
  pitch: number;
  /**
   * Rotation around the device's y axis (W3C `gamma`, expo-sensors `rotation.gamma`): grows when
   * the right edge goes down.
   */
  roll: number;
}

/** What a gyroscope sends and syncs: −1..1 each, y up. */
export interface Tilt {
  x: number;
  y: number;
}

export const LEVEL: Tilt = { x: 0, y: 0 };

const r4 = (v: number) => {
  const r = Math.round(v * 1e4) / 1e4;
  return r === 0 ? 0 : r; // no -0 on the wire
};
const clamp1 = (v: number) => Math.min(1, Math.max(-1, v));

/** Signed difference a − b of two angles in degrees, wrapped into −180..180. */
export function angleDelta(a: number, b: number): number {
  const d = ((((a - b) % 360) + 540) % 360) - 180;
  return d === -180 ? 180 : d;
}

/**
 * Orientation → tilt from the captured centre. Tilting the top edge away (pitch down) is up,
 * dropping the right edge (roll up) is right. `rangeDeg` of tilt reaches ±1; beyond it the value
 * is clamped, so the dot stays on the ring.
 */
export function tiltFrom(sample: TiltSample, centre: TiltSample, rangeDeg: number): Tilt {
  const range = Math.max(1, rangeDeg);
  return {
    x: r4(clamp1(angleDelta(sample.roll, centre.roll) / range)),
    y: r4(clamp1(-angleDelta(sample.pitch, centre.pitch) / range)),
  };
}

/** Header readout (Figma: `x 0.42  y 0.28`; `—` when there is nothing to show). */
export function formatTilt(t: Tilt | null): string {
  if (!t) return "—";
  const f = (v: number) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(2);
  return `x ${f(t.x)}  y ${f(t.y)}`;
}

/** A synced value that is a tilt (another device, feedback), or null. */
export function asTilt(v: unknown): Tilt | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  return typeof o.x === "number" && typeof o.y === "number" && isFinite(o.x) && isFinite(o.y)
    ? { x: clamp1(o.x), y: clamp1(o.y) }
    : null;
}

/**
 * Drives a switched-on gyroscope. `start()` arms it; the first sample after that is the centre
 * (sent as 0, 0) and every sample is turned into a tilt and sent through a leading + trailing
 * throttle at `rateHz`. `stop()` (switch off, app in the background, control lost) drops what is
 * pending and reports the centre, 0, 0, once — what the Off state draws.
 */
export function createGyroscope(
  opts: { rateHz: number; range: number },
  send: (t: Tilt) => void,
  now: () => number = Date.now,
) {
  let live = false;
  let centre: TiltSample | null = null;
  let current: Tilt = LEVEL;
  const throttle = createThrottle<Tilt>(Math.max(1, opts.rateHz), send, now);
  return {
    start() {
      throttle.cancel();
      live = true;
      centre = null;
      current = LEVEL;
    },
    /** A sensor reading; ignored while off. Returns the tilt it maps to. */
    sample(s: TiltSample): Tilt | null {
      if (!live || !Number.isFinite(s.pitch) || !Number.isFinite(s.roll)) return null;
      centre ??= s;
      current = tiltFrom(s, centre, opts.range);
      throttle.push(current);
      return current;
    },
    /** Take the next reading as the new centre. */
    recentre() {
      centre = null;
    },
    stop() {
      if (!live) return;
      live = false;
      throttle.cancel();
      centre = null;
      current = LEVEL;
      send(LEVEL);
    },
    /** Stop without reporting (unmounted). */
    dispose() {
      live = false;
      throttle.cancel();
    },
    get live() {
      return live;
    },
    get current() {
      return current;
    },
  };
}

/**
 * Figma Gyroscope `State` (+ `unsupported`, drawn like Permission denied without the Settings
 * button): View only wins — a device without control never reads its sensor.
 */
export type GyroscopeState = "off" | "live" | "denied" | "unsupported" | "viewOnly";

export function gyroscopeState(s: {
  live: boolean;
  denied: boolean;
  available: boolean;
  disabled: boolean;
}): GyroscopeState {
  if (s.disabled) return "viewOnly";
  if (!s.available) return "unsupported";
  if (s.denied) return "denied";
  return s.live ? "live" : "off";
}

/** The message line under the card, per state (Figma copy). */
export const GYROSCOPE_MESSAGES: Record<GyroscopeState, string> = {
  off: "Turn on and tilt the phone to move the point.",
  live: "Sending tilt to the installation.",
  denied: "Motion access is off for Otakoyi.",
  unsupported: "Tilt isn’t available on this device.",
  viewOnly: "Only the controlling device sends its tilt.",
};
