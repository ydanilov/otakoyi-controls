import type { OscArg, OscMessage } from "@osc/core";
import type { Control } from "@osc/schema";
import type { ControlValue } from "./logic";

/**
 * Debug page (Installation › Debug, Settings › Developer › Debug; Figma Debug Tag / Debug HUD). Pure
 * TS: the session feeds it what goes out and comes back, the page reads it a few times a second.
 *
 * - per control: the OSC address (or template), the last value sent and the send rate;
 * - totals: messages out / in per second over a sliding window, round-trip time of the protocol
 *   ping, the installation's FPS (telemetry);
 * - a ring buffer of the last `logSize` OSC events (→ sent, ← received) with timestamps.
 *
 * Works the same for a real bridge and the demo simulator: both go through `Session`.
 */

/** Messages per second over a sliding window (default 1 s). */
export class RateWindow {
  private hits: number[] = [];
  constructor(readonly windowMs = 1000) {}

  hit(now: number, n = 1) {
    for (let i = 0; i < n; i++) this.hits.push(now);
    this.trim(now);
  }

  /** Events per second in the window ending at `now`. */
  rate(now: number): number {
    this.trim(now);
    return (this.hits.length * 1000) / this.windowMs;
  }

  private trim(now: number) {
    const from = now - this.windowMs;
    let i = 0;
    while (i < this.hits.length && this.hits[i]! <= from) i++;
    if (i) this.hits.splice(0, i);
  }
}

/** Fixed-size ring buffer; `items()` is oldest first. */
export class Ring<T> {
  private buf: T[] = [];
  constructor(readonly size: number) {}
  push(item: T) {
    this.buf.push(item);
    if (this.buf.length > this.size) this.buf.splice(0, this.buf.length - this.size);
  }
  items(): readonly T[] {
    return this.buf;
  }
  clear() {
    this.buf = [];
  }
}

export type DebugDir = "out" | "in";

export interface DebugLogEntry {
  seq: number;
  /** Epoch ms. */
  at: number;
  dir: DebugDir;
  address: string;
  /** Arguments as text, e.g. `0.600` or `"ambient"`. */
  args: string;
}

export interface DebugControlStats {
  /** Last value sent, as text. */
  value: string;
  /** Messages per second this control sent over the window. */
  rate: number;
  at: number;
}

/** One OSC argument as the Debug page shows it: floats with 3 decimals, strings quoted. */
export function formatOscArg(a: OscArg): string {
  switch (a.type) {
    case "f":
    case "d":
      return a.value.toFixed(3);
    case "i":
      return String(a.value);
    case "h":
      return a.value.toString();
    case "s":
      return JSON.stringify(a.value);
    case "b":
      return `<${a.value.byteLength} B>`;
    case "T":
      return "T";
    case "F":
      return "F";
    default:
      return a.type;
  }
}

export function formatOscArgs(args: readonly OscArg[]): string {
  return args.map(formatOscArg).join(" ");
}

/** A control value as text (feedback that arrived as a value, not as raw OSC). */
export function formatDebugValue(v: ControlValue): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(3);
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "string") return JSON.stringify(v);
  if ("x" in v && "y" in v) return `${v.x.toFixed(3)} ${v.y.toFixed(3)}`;
  if ("delta" in v) return (v.delta >= 0 ? "+" : "") + v.delta.toFixed(3);
  if ("pressed" in v) return v.pressed ? "1" : "0";
  if ("cell" in v) return `${v.cell} ${v.on ? 1 : 0}`;
  if ("on" in v && Array.isArray(v.on)) return v.on.join(" ") || "—";
  return JSON.stringify(v);
}

/** `10:21:04.218` in the device's local time. */
export function formatClock(epochMs: number): string {
  const d = new Date(epochMs);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

/** Messages per second as the Debug page shows it: `48`, `2.5`, `0`. */
export function formatRate(r: number): string {
  if (r === 0) return "0";
  return r >= 10 ? String(Math.round(r)) : (Math.round(r * 10) / 10).toString();
}

/**
 * The OSC address a control sends on, or its template: a button group's buttons joined
 * (`/wall/logo · /wall/live-data`), an address with a `{…}` placeholder as written.
 */
export function debugAddress(c: Control): string {
  if (c.type === "buttonGroup") return c.buttons.map((b) => b.address).join(" · ");
  if (c.type === "colorPicker" && c.format === "hsb") return `${c.address}/{h,s,b}`;
  if ("address" in c && typeof c.address === "string") return c.address;
  // Display-only controls (meter, label) listen on their feedback address.
  return c.feedback ?? c.id;
}

export interface DebugStoreOptions {
  now?: () => number;
  /** Events kept in the log (Figma: ~50). */
  logSize?: number;
  /** Rate window, ms. */
  windowMs?: number;
}

/** Counters, rate windows and the OSC log behind the Debug page. */
export class DebugStore {
  readonly now: () => number;
  private log = new Ring<DebugLogEntry>(50);
  private out: RateWindow;
  private in: RateWindow;
  private perControl = new Map<string, { value: string; at: number; rate: RateWindow }>();
  private seq = 0;
  private pings = new Map<number, number>();
  private listeners = new Set<() => void>();
  /** Last round-trip time of the protocol ping, ms. */
  rtt: number | null = null;
  /** Last FPS the installation reported (telemetry), or null. */
  fps: number | null = null;
  /** When something last came back from the installation (epoch ms), or null. */
  lastIn: number | null = null;

  constructor(private opts: DebugStoreOptions = {}) {
    this.now = opts.now ?? Date.now;
    this.log = new Ring(opts.logSize ?? 50);
    this.out = new RateWindow(opts.windowMs ?? 1000);
    this.in = new RateWindow(opts.windowMs ?? 1000);
  }

  /** OSC a control sent (or that the bridge sends for it). */
  sent(controlId: string | null, msgs: readonly OscMessage[]) {
    if (!msgs.length) return;
    const at = this.now();
    for (const m of msgs) this.add("out", m.address, formatOscArgs(m.args), at);
    this.out.hit(at, msgs.length);
    if (controlId) {
      const cur = this.perControl.get(controlId) ?? {
        value: "",
        at,
        rate: new RateWindow(this.opts.windowMs ?? 1000),
      };
      cur.value = msgs.map((m) => formatOscArgs(m.args)).join(" · ");
      cur.at = at;
      cur.rate.hit(at, msgs.length);
      this.perControl.set(controlId, cur);
    }
    this.emit();
  }

  /** Something the installation sent back: raw OSC, or feedback that arrived as a value. */
  received(address: string, args: string) {
    const at = this.now();
    this.add("in", address, args, at);
    this.in.hit(at);
    this.lastIn = at;
    this.emit();
  }

  /** Start a ping; returns the timestamp to put in the protocol `ping` message. */
  ping(): number {
    const at = this.now();
    this.pings.set(at, at);
    // Never keep more than a few unanswered pings.
    if (this.pings.size > 8) this.pings.delete(this.pings.keys().next().value as number);
    return at;
  }

  /** The bridge answered `pong {at}`: round-trip time. Unknown / stale pongs are ignored. */
  pong(at: number) {
    if (!this.pings.has(at)) return;
    this.pings.delete(at);
    this.rtt = Math.max(0, this.now() - at);
    this.emit();
  }

  setFps(fps: number | null | undefined) {
    const v = typeof fps === "number" && Number.isFinite(fps) ? fps : null;
    if (v === this.fps) return;
    this.fps = v;
    this.emit();
  }

  /** Per-control tag data, or null before the control sent anything. */
  control(id: string): DebugControlStats | null {
    const c = this.perControl.get(id);
    if (!c) return null;
    return { value: c.value, rate: c.rate.rate(this.now()), at: c.at };
  }

  /** Messages per second, out and in. */
  rates(): { out: number; in: number } {
    const now = this.now();
    return { out: this.out.rate(now), in: this.in.rate(now) };
  }

  /** The OSC log, oldest first. */
  entries(): readonly DebugLogEntry[] {
    return this.log.items();
  }

  /** New connection: forget counters and the log (RTT and FPS are measured again). */
  reset() {
    this.log.clear();
    this.perControl.clear();
    this.pings.clear();
    this.out = new RateWindow(this.opts.windowMs ?? 1000);
    this.in = new RateWindow(this.opts.windowMs ?? 1000);
    this.rtt = null;
    this.fps = null;
    this.lastIn = null;
    this.emit();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private add(dir: DebugDir, address: string, args: string, at: number) {
    this.log.push({ seq: ++this.seq, at, dir, address, args });
  }

  private emit() {
    for (const l of this.listeners) l();
  }
}

/** "62 ms ago", "3.4 s ago", "—". */
export function formatAgo(sinceMs: number | null, now: number): string {
  if (sinceMs === null) return "—";
  const d = Math.max(0, now - sinceMs);
  if (d < 1000) return `${Math.round(d)} ms ago`;
  if (d < 60_000) return `${(Math.round(d / 100) / 10).toFixed(1)} s ago`;
  return `${Math.round(d / 60_000)} min ago`;
}
