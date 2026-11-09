import type { Control } from "@osc/schema";
import { clamp, type ControlValue } from "./logic";
import { knobMode, wrapHue } from "./modes";

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Validate a value that arrived over the network (another device, the bridge) against its control.
 * Returns a safe value — clamped into range — or undefined when it can't belong to this control.
 * The bridge runs every incoming `set` through this before it reaches OSC.
 */
export function coerceValue(c: Control, v: unknown): ControlValue | undefined {
  switch (c.type) {
    case "fader":
    case "knob": {
      const mode = c.type === "knob" ? knobMode(c) : c.mode;
      const span = Math.abs(c.max - c.min);
      if (mode === "relative") {
        // A delta larger than a full sweep in one message is not a finger.
        if (!isObj(v) || !isNum(v.delta)) return undefined;
        return { delta: clamp(v.delta, -span, span) };
      }
      if (!isNum(v)) return undefined;
      if (mode === "hue") return wrapHue(c.int ? Math.round(v) : v);
      const lo = Math.min(c.min, c.max);
      const hi = Math.max(c.min, c.max);
      const x = clamp(v, lo, hi);
      return c.int ? Math.round(x) : x;
    }
    case "toggle":
      return typeof v === "boolean" ? v : undefined;
    case "xy":
      return isObj(v) && isNum(v.x) && isNum(v.y) ? { x: clamp(v.x), y: clamp(v.y) } : undefined;
    case "button":
      return isObj(v) && typeof v.pressed === "boolean" ? { pressed: v.pressed } : undefined;
    case "segmented":
      return Number.isInteger(v) && (v as number) >= 0 && (v as number) < c.options.length
        ? (v as number)
        : undefined;
    case "sceneList":
      return typeof v === "string" && c.scenes.some((s) => s.id === v) ? v : undefined;
    case "buttonGrid":
      return isObj(v) &&
        Number.isInteger(v.cell) &&
        (v.cell as number) >= 0 &&
        (v.cell as number) < c.rows * c.cols &&
        typeof v.on === "boolean"
        ? { cell: v.cell as number, on: v.on }
        : undefined;
    case "holdToConfirm":
      return v === true ? true : undefined;
    case "colorPicker":
      return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : undefined;
    case "label":
    case "meter":
      // Display-only: values come from the installation, never from a device.
      return undefined;
    case "thumbstick":
      if (isObj(v) && typeof v.pressed === "boolean" && Object.keys(v).length === 1)
        return c.press ? { pressed: v.pressed } : undefined;
      return isObj(v) && isNum(v.x) && isNum(v.y)
        ? { x: clamp(v.x, -1, 1), y: clamp(v.y, -1, 1) }
        : undefined;
    case "gyroscope":
      return isObj(v) && isNum(v.x) && isNum(v.y)
        ? { x: clamp(v.x, -1, 1), y: clamp(v.y, -1, 1) }
        : undefined;
    case "buttonGroup": {
      if (!isObj(v) || !Array.isArray(v.on)) return undefined;
      const known = new Set(c.buttons.map((b) => b.id));
      if (!v.on.every((id) => typeof id === "string" && known.has(id))) return undefined;
      if (v.changed !== undefined && !(typeof v.changed === "string" && known.has(v.changed)))
        return undefined;
      const on = c.buttons.filter((b) => (v.on as string[]).includes(b.id)).map((b) => b.id);
      return v.changed === undefined ? { on } : { on, changed: v.changed as string };
    }
    case "mic": {
      if (!isObj(v)) return undefined;
      const frame: { level?: number; bands?: number[]; beat?: boolean } = {};
      if (c.outputs.includes("level") && isNum(v.level)) frame.level = clamp(v.level);
      if (c.outputs.includes("bands") && Array.isArray(v.bands)) {
        if (v.bands.length > c.bands || !v.bands.every(isNum)) return undefined;
        frame.bands = (v.bands as number[]).map((b) => clamp(b));
      }
      if (c.outputs.includes("beat") && typeof v.beat === "boolean") frame.beat = v.beat;
      return Object.keys(frame).length ? frame : undefined;
    }
    case "prompt": {
      if (!isObj(v) || !isNum(v.mix)) return undefined;
      const text = (t: unknown) =>
        t === null || t === undefined
          ? null
          : typeof t === "string" && t.length <= c.maxLength
            ? t
            : undefined;
      const a = text(v.a);
      const b = c.blend ? text(v.b) : null;
      if (a === undefined || b === undefined) return undefined;
      const ref = (x: unknown) => (typeof x === "string" && x.length <= 64 ? x : null);
      return { a, b, mix: clamp(v.mix), aId: ref(v.aId), bId: c.blend ? ref(v.bId) : null };
    }
    case "image":
      // The path is decided by the bridge after a validated upload (HTTP), never by a device.
      return undefined;
  }
}
