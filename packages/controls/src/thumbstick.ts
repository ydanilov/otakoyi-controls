/**
 * Thumbstick (relative 2-D joystick, ADR-015). While held it reports the stick's deflection at a
 * fixed rate — even when the finger is still, because a held stick means "keep moving" — and on
 * release it springs to the centre and reports 0, 0 once.
 */

export interface Deflection {
  /** −1..1, right is positive. */
  x: number;
  /** −1..1, up is positive. */
  y: number;
}

export const CENTRE: Deflection = { x: 0, y: 0 };

const r4 = (v: number) => {
  "worklet";
  const r = Math.round(v * 1e4) / 1e4;
  return r === 0 ? 0 : r; // no -0 on the wire
};

/**
 * Finger position on the pad (px from the top-left) → deflection. The stick's reach is the largest
 * circle in the pad; beyond it the deflection keeps its direction at full length. A radial dead zone
 * ignores small movements around the centre, and the travel outside it is rescaled so the output
 * still starts at 0 and reaches 1.
 */
export function thumbstickDeflection(
  pointer: { x: number; y: number },
  size: { width: number; height: number },
  deadzone: number,
): Deflection {
  "worklet";
  const radius = Math.max(1, Math.min(size.width, size.height) / 2);
  const dx = (pointer.x - size.width / 2) / radius;
  const dy = -(pointer.y - size.height / 2) / radius;
  const mag = Math.hypot(dx, dy);
  const dz = Math.min(0.95, Math.max(0, deadzone));
  if (mag <= dz || mag === 0) return { x: 0, y: 0 };
  const reach = Math.min(1, mag);
  const scaled = (reach - dz) / (1 - dz);
  return { x: r4((dx / mag) * scaled), y: r4((dy / mag) * scaled) };
}

export interface Timers {
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(id: unknown): void;
}

const defaultTimers: Timers = {
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (id) => clearInterval(id as ReturnType<typeof setInterval>),
};

/**
 * Drives a held thumbstick. `send` receives every report: one on `start`, then one every
 * 1000 / rateHz ms with the latest deflection, and a final 0, 0 on `release`.
 */
export function createThumbstick(
  opts: { rateHz: number },
  send: (d: Deflection) => void,
  timers: Timers = defaultTimers,
) {
  let held = false;
  let current: Deflection = CENTRE;
  let timer: unknown = null;
  const stop = () => {
    if (timer !== null) timers.clearInterval(timer);
    timer = null;
  };
  return {
    start(d: Deflection) {
      stop();
      held = true;
      current = d;
      send(current);
      timer = timers.setInterval(() => send(current), 1000 / Math.max(1, opts.rateHz));
    },
    move(d: Deflection) {
      if (held) current = d;
    },
    /** Spring to the centre: stop repeating and report 0, 0 once. */
    release() {
      if (!held) return;
      held = false;
      stop();
      current = CENTRE;
      send(CENTRE);
    },
    /** Stop without reporting (component unmounted). */
    dispose() {
      held = false;
      stop();
    },
    get held() {
      return held;
    },
    get current() {
      return current;
    },
  };
}
