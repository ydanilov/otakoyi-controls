import * as React from "react";

/**
 * What a continuous control shows: the finger's value while the control is held, otherwise the
 * value it was given (the store: this device, another device, installation feedback).
 *
 * It is derived during render on purpose. Copying `value` into state from an effect costs a second
 * render per change; with feedback arriving at 30–60 Hz every commit then schedules another one and
 * React aborts with "Maximum update depth exceeded" (fix/feedback-echo-loop).
 *
 * `hold(v)` while dragging; `release()` when the gesture ends (or for a one-off change that goes
 * through `onChange`) — from then on the control follows `value` again.
 */
export function useHeldValue<T>(value: T): [shown: T, hold: (v: T) => void, release: () => void] {
  const [held, setHeld] = React.useState<{ v: T } | null>(null);
  const hold = React.useCallback((v: T) => setHeld({ v }), []);
  const release = React.useCallback(() => setHeld(null), []);
  return [held ? held.v : value, hold, release];
}
