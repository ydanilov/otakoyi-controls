/**
 * Story handlers get plain data, never a React Native Web event.
 *
 * A press / layout event carries DOM nodes and React fibers (a circular graph of the whole page).
 * Handed to a `fn()` spy, Storybook's instrumenter and actions panel serialize it: on a busy machine
 * that took longer than the test runner's timeout, and some paths threw "Converting circular
 * structure to JSON". The preview wraps every function arg so the spy sees `{ type, … }` instead.
 */
export function plainArg(v: unknown): unknown {
  if (!v || typeof v !== "object") return v;
  const o = v as Record<string, unknown>;
  const isEvent =
    "nativeEvent" in o ||
    "currentTarget" in o ||
    (typeof Event !== "undefined" && v instanceof Event);
  if (!isEvent) return v;
  const ne = (o.nativeEvent ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = { type: o.type ?? ne.type ?? "event" };
  for (const k of ["layout", "contentOffset", "text", "value", "key"]) {
    const x = ne[k] ?? o[k];
    if (x !== undefined && (typeof x !== "object" || x === null || Object.keys(x).length < 8))
      out[k] = x;
  }
  return out;
}

/** Wraps the story's function args (spies) so they receive `plainArg` values. */
export function withPlainHandlers<T extends Record<string, unknown>>(args: T): T {
  const out: Record<string, unknown> = { ...args };
  for (const [k, v] of Object.entries(args))
    if (typeof v === "function")
      out[k] = (...a: unknown[]) => (v as (...x: unknown[]) => unknown)(...a.map(plainArg));
  return out as T;
}
