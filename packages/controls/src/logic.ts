/**
 * Platform-agnostic control logic: value mapping, gestures, throttling and OSC message building.
 * The Skia components (app) and the web pult only draw and forward gestures; everything that decides
 * *what* is sent lives here and is unit-tested.
 */
import { message, toArg, type OscMessage } from "@osc/core";
import type { Control, ControlOf } from "@osc/schema";
import type { MicFrame } from "./mic";
import { knobMode, wrapHue } from "./modes";
import type { PromptValue } from "./prompt";

export type Curve = "linear" | "log" | "exp";

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** Position 0..1 on the control → normalised value 0..1 through a response curve. */
export function applyCurve(pos: number, curve: Curve): number {
  const p = clamp(pos);
  if (curve === "log") return p * p; // fine control at the bottom (perceived loudness / brightness)
  if (curve === "exp") return Math.sqrt(p);
  return p;
}

export function invertCurve(value: number, curve: Curve): number {
  const v = clamp(value);
  if (curve === "log") return Math.sqrt(v);
  if (curve === "exp") return v * v;
  return v;
}

export interface Range {
  min: number;
  max: number;
  step?: number | undefined;
  curve?: Curve;
  invert?: boolean;
  int?: boolean;
}

/** Control position (0..1) → output value in the control's range. */
export function positionToValue(pos: number, r: Range): number {
  const p = r.invert ? 1 - clamp(pos) : clamp(pos);
  let v = r.min + applyCurve(p, r.curve ?? "linear") * (r.max - r.min);
  if (r.step) v = r.min + Math.round((v - r.min) / r.step) * r.step;
  if (r.int) v = Math.round(v);
  return roundFloat(clamp(v, Math.min(r.min, r.max), Math.max(r.min, r.max)));
}

/** Output value → control position (0..1). Used for feedback and defaults. */
export function valueToPosition(value: number, r: Range): number {
  const n = (value - r.min) / (r.max - r.min || 1);
  const p = invertCurve(clamp(n), r.curve ?? "linear");
  return r.invert ? 1 - p : p;
}

const roundFloat = (v: number) => Math.round(v * 1e6) / 1e6;

// ---------- gestures ----------

/** Fader: pointer position along the track → position. Vertical faders grow upwards. */
export function faderPosition(
  pointer: { x: number; y: number },
  size: { width: number; height: number },
  orientation: "vertical" | "horizontal",
): number {
  return orientation === "vertical"
    ? clamp(1 - pointer.y / size.height)
    : clamp(pointer.x / size.width);
}

/**
 * Relative drag (used for knobs and for "fine" fader moves): pixels moved → position delta.
 * `sensitivity` is pixels for a full 0→1 sweep; holding a second finger can raise it for fine control.
 */
export function dragDelta(dx: number, dy: number, sensitivity = 200): number {
  "worklet";
  return (dx - dy) / sensitivity;
}

/** Fingers at which a drag switches to fine mode. */
export const FINE_POINTERS = 2;

/**
 * Relative drag state, shared by faders and knobs (runs as a worklet on the UI thread).
 * The anchor is re-taken whenever the number of fingers changes, so adding or lifting the second
 * finger never makes the value jump — it only changes the speed from that point on.
 */
export interface DragState {
  /** Position (0..1) when the current segment started. */
  anchor: number;
  /** Drag distance (px) when the current segment started. */
  anchorDistance: number;
  pointers: number;
}

export function startDrag(pos: number, pointers: number): DragState {
  "worklet";
  return { anchor: pos, anchorDistance: 0, pointers };
}

/**
 * Next position for a relative drag. `distance` = px dragged in the increasing direction since the
 * gesture began; `length` = px for a full 0→1 sweep. Returns the new position and the updated state.
 */
export function relativeDrag(
  state: DragState,
  current: number,
  distance: number,
  pointers: number,
  length: number,
  fineFactor: number,
): { pos: number; state: DragState; fine: boolean } {
  "worklet";
  let st = state;
  if (pointers !== state.pointers) st = { anchor: current, anchorDistance: distance, pointers };
  const fine = st.pointers >= FINE_POINTERS;
  const factor = fine ? fineFactor : 1;
  const pos = Math.min(
    1,
    Math.max(0, st.anchor + ((distance - st.anchorDistance) / Math.max(1, length)) * factor),
  );
  return { pos, state: st, fine };
}

/** Value a control returns to on double-tap. */
export function resetValue(c: {
  default?: number | undefined;
  centered?: boolean;
  min: number;
  max: number;
}): number {
  return c.default ?? (c.centered ? (c.min + c.max) / 2 : c.min);
}

/** XY pad: pointer → normalised point, y grows upwards. */
export function xyPosition(
  pointer: { x: number; y: number },
  size: { width: number; height: number },
) {
  return { x: clamp(pointer.x / size.width), y: clamp(1 - pointer.y / size.height) };
}

/** Hold-to-confirm progress for an elapsed press time. */
export const holdProgress = (elapsedMs: number, holdMs: number) => clamp(elapsedMs / holdMs);

// ---------- throttling ----------

/**
 * Leading + trailing throttle for continuous controls: the first move sends immediately,
 * moves inside the window are coalesced, and the last value is always sent.
 */
export function createThrottle<T>(hz: number, send: (v: T) => void, now: () => number = Date.now) {
  const interval = 1000 / hz;
  let last = -Infinity;
  let pending: { v: T } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = () => {
    timer = null;
    if (pending) {
      last = now();
      const v = pending.v;
      pending = null;
      send(v);
    }
  };
  return {
    push(v: T) {
      const t = now();
      if (t - last >= interval && !timer) {
        last = t;
        send(v);
      } else {
        pending = { v };
        if (!timer) timer = setTimeout(flush, Math.max(0, interval - (t - last)));
      }
    },
    /** Send the pending value now (on release). */
    flush() {
      if (timer) clearTimeout(timer);
      flush();
    },
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
}

// ---------- colour ----------

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

export function rgbToHsv(rgb: [number, number, number]): [number, number, number] {
  const [h, s, v] = rawHsv(rgb);
  return [roundFloat(h), roundFloat(s), roundFloat(v)];
}

/** RGB 0–255 → HSV 0–1 each, unrounded. */
function rawHsv([r, g, b]: [number, number, number]): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const d = max - Math.min(rn, gn, bn);
  let h = 0;
  if (d) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return [h / 360, max ? d / max : 0, max];
}

export function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h * 6) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return (
    "#" +
    [f(5), f(3), f(1)]
      .map((x) =>
        Math.round(x * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
      .toUpperCase()
  );
}

// ---------- labels & meters ----------

export function formatValue(
  value: number | string | boolean | null,
  opts: { format?: string | undefined; unit?: string | undefined; decimals?: number } = {},
): string {
  const text =
    typeof value === "number"
      ? Number.isInteger(value)
        ? String(value)
        : value.toFixed(
            opts.decimals ?? (Math.abs(value) >= 100 ? 0 : Math.abs(value) >= 10 ? 1 : 2),
          )
      : value === null
        ? "—"
        : String(value);
  const withUnit = opts.unit ? `${text}${/^[°%×]/.test(opts.unit) ? "" : " "}${opts.unit}` : text;
  return opts.format ? opts.format.replace("{value}", withUnit) : withUnit;
}

/**
 * Decimals a value needs to show its `step` (0.1 → 1, 0.05 → 2, 1 → 0); undefined without a step
 * (formatValue then picks by magnitude: `0.60`, `12.5`, `120`).
 */
export function stepDecimals(step: number | undefined): number | undefined {
  if (!step || !Number.isFinite(step)) return undefined;
  const t = String(step);
  const e = /e-(\d+)$/.exec(t);
  if (e) return Number(e[1]);
  return t.includes(".") ? t.split(".")[1]!.length : 0;
}

/**
 * Signed change of a relative (endless) control for its header (Figma "Relative indicator",
 * option A): `+12`, `−0.02`, `0`. The ↻ glyph next to it marks the control as relative.
 */
export function formatDelta(delta: number, opts: { unit?: string | undefined } = {}): string {
  if (!Number.isFinite(delta) || Math.abs(delta) < 1e-9) return formatValue(0, opts);
  const text = formatValue(Math.abs(delta), opts);
  return `${delta > 0 ? "+" : "\u2212"}${text}`;
}

/**
 * Accumulated change of a relative control since the session started, for its header at rest
 * (Figma: `+12` for an integer knob, `+0.02` / `0.00` / `−0.15` otherwise). The sign is shown
 * unless the rounded change is zero.
 */
export function formatOffset(
  total: number,
  opts: { int?: boolean | undefined; unit?: string | undefined } = {},
): string {
  const v = Number.isFinite(total) ? total : 0;
  const abs = Math.abs(v);
  const text = opts.int ? String(Math.round(abs)) : abs.toFixed(abs >= 100 ? 0 : abs >= 10 ? 1 : 2);
  const withUnit = opts.unit ? `${text}${/^[°%×]/.test(opts.unit) ? "" : " "}${opts.unit}` : text;
  if (Number(text) === 0) return withUnit;
  return `${v > 0 ? "+" : "\u2212"}${withUnit}`;
}

export type MeterLevel = "normal" | "warning" | "critical";
export function meterLevel(
  value: number,
  c: Pick<ControlOf<"meter">, "warnAt" | "criticalAt">,
): MeterLevel {
  if (c.criticalAt !== undefined && value >= c.criticalAt) return "critical";
  if (c.warnAt !== undefined && value >= c.warnAt) return "warning";
  return "normal";
}

// ---------- button group ----------

/** Latching state of a button group: the ids that are lit, plus the one that just changed. */
export interface GroupValue {
  on: string[];
  /** The button this interaction toggled; without it, every button's state is sent (full sync). */
  changed?: string | undefined;
}

/**
 * Toggle one button of a group. Buttons latch independently: the others keep their state.
 * The result lists lit ids in button order.
 */
export function toggleInGroup(
  c: Pick<ControlOf<"buttonGroup">, "buttons">,
  current: ControlValue,
  id: string,
): GroupValue {
  const lit = new Set(isGroupValue(current) ? current.on : []);
  if (lit.has(id)) lit.delete(id);
  else lit.add(id);
  return { on: c.buttons.filter((b) => lit.has(b.id)).map((b) => b.id), changed: id };
}

export const isGroupValue = (v: unknown): v is GroupValue =>
  typeof v === "object" && v !== null && Array.isArray((v as GroupValue).on);

/** Fill `{row}`, `{col}`, `{index}` (0-based) in a button-grid address. */
export function gridCellAddress(template: string, row: number, col: number, cols: number): string {
  return template
    .replace(/\{row\}/g, String(row))
    .replace(/\{col\}/g, String(col))
    .replace(/\{index\}/g, String(row * cols + col));
}

// ---------- OSC messages per control ----------

/** The value a control holds in the shared state store (what the bridge syncs between devices). */
export type ControlValue =
  | number
  | boolean
  | string
  /** xy (0..1), thumbstick and gyroscope (−1..1). */
  | { x: number; y: number }
  /** button, thumbstick click. */
  | { pressed: boolean }
  | { cell: number; on: boolean }
  /** Relative (endless) fader or knob: change since the last message. */
  | { delta: number }
  | GroupValue
  /** Image control: a library image and its absolute path on the installation machine. */
  | { image: string; path: string }
  | MicFrame
  | PromptValue
  | null;

/** Loose view of an object value, for shape checks before reading fields. */
const rec = (v: unknown): Record<string, unknown> =>
  typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
const hasDelta = (v: unknown): v is { delta: number } =>
  typeof rec(v).delta === "number" && Number.isFinite(rec(v).delta);

const num = (v: number, int?: boolean) =>
  int ? { type: "i" as const, value: Math.round(v) } : { type: "f" as const, value: v };

/** Colour channels of the default `hsb` colour format, each on its own address. */
export const HSB_CHANNELS = ["h", "s", "b"] as const;
export type HsbChannel = (typeof HSB_CHANNELS)[number];

/** `<base>/h`, `<base>/s`, `<base>/b`. */
export function hsbAddress(base: string, ch: HsbChannel): string {
  return `${base}/${ch}`;
}

/**
 * The wire values of a colour in the `hsb` format: hue in degrees (or 0–1 with `hueRange: "unit"`),
 * saturation and brightness 0–1. A channel that is undefined for this colour is left out — hue at
 * saturation 0 or brightness 0, saturation at brightness 0 — so a grey never resets the
 * installation's hue.
 */
export function hsbWire(
  hex: string,
  hueRange: "degrees" | "unit" = "degrees",
): Partial<Record<HsbChannel, number>> {
  const [h, s, b] = rawHsv(hexToRgb(hex));
  const out: Partial<Record<HsbChannel, number>> = { b: roundFloat(b) };
  if (b > 0) out.s = roundFloat(s);
  if (b > 0 && s > 0) out.h = roundFloat(hueRange === "unit" ? h : h * 360);
  return out;
}

/**
 * `hsb` colour format: one message per channel that changed since `previous`. Without `previous`
 * (a full sync) every defined channel is sent. A channel that was undefined before (the colour was
 * grey or black) and is defined now is always sent, because the installation may hold another value.
 */
export function hsbMessages(
  c: Pick<ControlOf<"colorPicker">, "address" | "hueRange">,
  value: string,
  previous?: ControlValue,
): OscMessage[] {
  const next = hsbWire(value, c.hueRange);
  const prev = typeof previous === "string" ? hsbWire(previous, c.hueRange) : {};
  const full = typeof previous !== "string";
  return HSB_CHANNELS.flatMap((ch) => {
    const v = next[ch];
    if (v === undefined) return [];
    if (!full && prev[ch] !== undefined && prev[ch] === v) return [];
    return [{ address: hsbAddress(c.address, ch), args: [num(v)] }];
  });
}

/**
 * Build the OSC messages a control sends for a given interaction.
 * Returns [] for display-only controls. `previous` is the value the control held before this
 * interaction; controls that send only what changed (the `hsb` colour format) use it, and without
 * it they send everything (a full sync).
 */
export function messagesFor(
  c: Control,
  value: ControlValue,
  previous?: ControlValue,
): OscMessage[] {
  switch (c.type) {
    case "button": {
      const pressed =
        typeof value === "object" && value !== null && "pressed" in value
          ? value.pressed
          : Boolean(value);
      const args = pressed ? c.press : c.release;
      return args && args.length ? [message(c.address, ...args)] : [];
    }
    case "toggle":
      return [message(c.address, ...(value ? c.on : c.off))];
    case "fader":
    case "knob": {
      const relative = c.type === "fader" ? c.mode === "relative" : knobMode(c) === "relative";
      if (relative)
        return hasDelta(value) && value.delta !== 0
          ? [{ address: c.address, args: [num(roundFloat(value.delta), c.int)] }]
          : [];
      if (typeof value !== "number") return [];
      const v = c.type === "knob" && c.mode === "hue" ? wrapHue(value) : value;
      return [{ address: c.address, args: [num(v, c.int)] }];
    }
    case "thumbstick": {
      const o = rec(value);
      if (typeof o.pressed === "boolean")
        return c.press ? [message(c.press, o.pressed ? 1 : 0)] : [];
      if (typeof o.x !== "number" || typeof o.y !== "number") return [];
      return [{ address: c.address, args: [num(roundFloat(o.x)), num(roundFloat(o.y))] }];
    }
    case "gyroscope": {
      const o = rec(value);
      if (typeof o.x !== "number" || typeof o.y !== "number") return [];
      return [{ address: c.address, args: [num(roundFloat(o.x)), num(roundFloat(o.y))] }];
    }
    case "buttonGroup": {
      if (!isGroupValue(value)) return [];
      const lit = new Set(value.on);
      const buttons = value.changed ? c.buttons.filter((b) => b.id === value.changed) : c.buttons;
      return buttons.map((b) =>
        lit.has(b.id) ? message(b.address, b.value ?? 1) : message(b.address, 0),
      );
    }
    case "image": {
      const path = rec(value).path;
      return typeof path === "string" && path ? [message(c.address, path)] : [];
    }
    case "mic": {
      if (typeof value !== "object" || value === null) return [];
      const f = value as MicFrame;
      const out: OscMessage[] = [];
      for (const o of c.outputs) {
        if (o === "level" && typeof f.level === "number")
          out.push({ address: `${c.address}/level`, args: [num(roundFloat(f.level))] });
        if (o === "bands" && Array.isArray(f.bands)) {
          const bands = Array.from({ length: c.bands }, (_, i) => f.bands![i] ?? 0);
          out.push({ address: `${c.address}/bands`, args: bands.map((b) => num(roundFloat(b))) });
        }
        if (o === "beat" && f.beat === true) out.push(message(`${c.address}/beat`, 1));
      }
      return out;
    }
    case "prompt": {
      if (typeof rec(value).mix !== "number") return [];
      const p = value as PromptValue;
      if (!c.blend) return [message(c.address, p.a ?? "")];
      return [
        message(`${c.address}/a`, p.a ?? ""),
        message(`${c.address}/b`, p.b ?? ""),
        { address: `${c.address}/mix`, args: [num(roundFloat(p.mix))] },
      ];
    }
    case "xy": {
      if (typeof value !== "object" || value === null || !("x" in value)) return [];
      const x = c.x.min + value.x * (c.x.max - c.x.min);
      const y = c.y.min + value.y * (c.y.max - c.y.min);
      return [{ address: c.address, args: [num(roundFloat(x)), num(roundFloat(y))] }];
    }
    case "segmented": {
      const opt = typeof value === "number" ? c.options[value] : undefined;
      return opt ? [message(c.address, opt.value)] : [];
    }
    case "sceneList": {
      const scene = c.scenes.find((s) => s.id === value);
      if (!scene) return [];
      return [
        {
          address: c.address,
          args: [toArg(scene.value), ...(c.crossfade !== undefined ? [num(c.crossfade)] : [])],
        },
      ];
    }
    case "buttonGrid": {
      if (typeof value !== "object" || value === null || !("cell" in value)) return [];
      const row = Math.floor(value.cell / c.cols);
      const col = value.cell % c.cols;
      return [message(gridCellAddress(c.address, row, col, c.cols), value.on ? 1 : 0)];
    }
    case "holdToConfirm":
      return value === true ? [message(c.address, ...c.args)] : [];
    case "colorPicker": {
      if (typeof value !== "string") return [];
      if (c.format === "hsb") return hsbMessages(c, value, previous);
      const rgb = hexToRgb(value);
      if (c.format === "hex") return [message(c.address, value.toUpperCase())];
      if (c.format === "rgbInt")
        return [{ address: c.address, args: rgb.map((v) => num(v, true)) }];
      if (c.format === "hsvFloat")
        return [{ address: c.address, args: rgbToHsv(rgb).map((v) => num(v)) }];
      return [{ address: c.address, args: rgb.map((v) => num(roundFloat(v / 255))) }];
    }
    case "label":
    case "meter":
      return [];
  }
}

/** Initial state value of a control before any feedback arrives. */
export function initialValue(c: Control): ControlValue {
  switch (c.type) {
    case "fader":
      if (c.mode === "relative") return null; // endless: no position to hold
      return c.default ?? (c.centered || c.mode === "crossfade" ? (c.min + c.max) / 2 : c.min);
    case "knob": {
      const mode = knobMode(c);
      if (mode === "relative") return null;
      if (mode === "hue") return wrapHue(c.default ?? 0);
      return c.default ?? (c.centered ? (c.min + c.max) / 2 : c.min);
    }
    case "buttonGroup":
      return { on: c.buttons.filter((b) => c.default.includes(b.id)).map((b) => b.id) };
    case "thumbstick":
    case "gyroscope":
      return { x: 0, y: 0 };
    case "prompt":
      return { a: null, b: null, mix: c.default };
    case "mic":
      return {};
    case "image":
      return null;
    case "toggle":
      return c.default;
    case "xy":
      return { x: 0.5, y: 0.5 };
    case "segmented":
      return c.default;
    case "sceneList":
      return null;
    case "colorPicker":
      return c.default ?? c.swatches?.[0] ?? "#FFFFFF";
    case "label":
      return c.text;
    case "meter":
      return c.min;
    case "button":
      return { pressed: false };
    case "buttonGrid":
    case "holdToConfirm":
      return null;
  }
}
