import { argValue, type OscArg, type OscMessage } from "@osc/core";
import { applyHsbFeedback, colorFromArgs, hsbToHex, type Hsb } from "./color";
import {
  HSB_CHANNELS,
  hsbAddress,
  initialValue,
  isGroupValue,
  messagesFor,
  type ControlValue,
  type HsbChannel,
} from "./logic";
import { knobMode, wrapHue } from "./modes";
import type { PromptAck } from "./prompt";
import {
  targetOf,
  type AnyControl,
  type Control,
  type InstallationConfig,
  type Pult,
  type Target,
} from "@osc/schema";

/**
 * Who may send right now. Mirrors the bridge's control lease:
 * one device controls, others view; a studio session always wins.
 */
export type ControlMode = "control" | "view" | "studio-has-control" | "offline";

export interface Transport {
  send(target: Target, messages: OscMessage[]): void;
  /**
   * Optional: take the raw interaction instead of OSC. A pult connected to a bridge uses it to send
   * `{pult, id, value}`; the bridge validates it and is the one that sends OSC. `previous` is the
   * value before this interaction (what `messagesFor` diffs against).
   */
  interact?(pult: string, control: Control, value: ControlValue, previous?: ControlValue): void;
}

type Listener = () => void;

/**
 * How long OSC this store sent is remembered to recognise the installation's echo of it, ms.
 * An echo normally arrives within a few ms on a LAN; past this window a matching value is treated
 * as the installation's own state again.
 */
export const ECHO_WINDOW_MS = 2000;
/** Per control, at most this many sent messages are remembered (a 60 Hz drag over the window). */
const ECHO_KEEP = 128;

/** One OSC message this store sent for a control: `slot` is its address relative to the control's. */
interface Sent {
  slot: string;
  args: OscArg[];
  at: number;
}

export interface PultStoreOptions {
  /** Clock for echo recognition (the bridge passes its own, tests a fake one). */
  now?: () => number;
}

/**
 * Shared state of every control in a pult. The app and the web pult keep one store per pult;
 * the bridge broadcasts changes so every device shows the same values.
 */
export class PultStore {
  private values = new Map<string, ControlValue>();
  private listeners = new Map<string, Set<Listener>>();
  private modeListeners = new Set<Listener>();
  private changeListeners = new Set<(id: string, value: ControlValue) => void>();
  private byFeedback = new Map<string, Control[]>();
  /** Per control: confirmation of the last prompt sent, and a revision of its server-side data. */
  private acks = new Map<string, PromptAck>();
  private revs = new Map<string, number>();
  /** Relative (endless) controls: the change sent since this store was created (session start). */
  private offsets = new Map<string, number>();
  private metaListeners = new Map<string, Set<Listener>>();
  /** `hsb` colour pickers: the last full HSB known per control (a grey keeps its hue here). */
  private hsb = new Map<string, Hsb>();
  private localSeq = 0;
  /**
   * OSC this store sent per control, oldest first, and the value that sent it — to tell the
   * installation's echo of our own (possibly older, in-flight) commands from its own state changes.
   */
  private sent = new Map<string, Sent[]>();
  private sentValue = new Map<string, ControlValue>();
  private now: () => number;
  mode: ControlMode = "control";

  constructor(
    readonly config: InstallationConfig,
    readonly pult: Pult,
    private transport: Transport,
    opts: PultStoreOptions = {},
  ) {
    this.now = opts.now ?? Date.now;
    for (const c of this.controls()) {
      this.values.set(c.id, initialValue(c));
      const fb = feedbackBase(c);
      // A button group listens on every button's own address; an `hsb` colour picker on its three
      // channel addresses (`<feedback or address>/h`, `/s`, `/b`).
      const addrs =
        c.type === "buttonGroup" && !c.feedback
          ? c.buttons.map((b) => b.address)
          : c.type === "colorPicker" && c.format === "hsb" && fb
            ? HSB_CHANNELS.map((ch) => hsbAddress(fb, ch))
            : [fb];
      for (const a of addrs) if (a) this.byFeedback.set(a, [...(this.byFeedback.get(a) ?? []), c]);
    }
  }

  controls(): Control[] {
    return this.pult.pages
      .flatMap((p) => p.controls)
      .filter((c): c is Control => c.type !== "unsupported");
  }

  get(id: string): ControlValue {
    return this.values.get(id) ?? null;
  }

  subscribe(id: string, fn: Listener): () => void {
    const set = this.listeners.get(id) ?? new Set();
    set.add(fn);
    this.listeners.set(id, set);
    return () => set.delete(fn);
  }

  subscribeMode(fn: Listener): () => void {
    this.modeListeners.add(fn);
    return () => this.modeListeners.delete(fn);
  }

  /** Every value change, from any source. The bridge uses it to broadcast state to devices. */
  onChange(fn: (id: string, value: ControlValue) => void): () => void {
    this.changeListeners.add(fn);
    return () => this.changeListeners.delete(fn);
  }

  /** Current value of every control, for a device that just connected. */
  snapshot(): Record<string, ControlValue> {
    return Object.fromEntries(this.values);
  }

  control(id: string): Control | undefined {
    return this.controls().find((c) => c.id === id);
  }

  /** Confirmation state of the last prompt this control sent (bridge `prompt` message). */
  ack(id: string): PromptAck | null {
    return this.acks.get(id) ?? null;
  }

  /** An older ack never replaces a newer one. */
  setAck(id: string, ack: PromptAck) {
    const cur = this.acks.get(id);
    if (cur && cur.seq > ack.seq) return;
    if (cur && cur.seq === ack.seq && cur.state === ack.state) return;
    this.acks.set(id, ack);
    this.metaListeners.get(id)?.forEach((f) => f());
  }

  /** Bumped when a control's data on the bridge changed (prompt presets, image library). */
  rev(id: string): number {
    return this.revs.get(id) ?? 0;
  }

  bumpRev(id: string) {
    this.revs.set(id, this.rev(id) + 1);
    this.metaListeners.get(id)?.forEach((f) => f());
  }

  /**
   * Accumulated change of a relative control (jog wheel, encoder knob) since the session started —
   * what its header shows at rest (Figma `+12`, `+0.02`).
   */
  offset(id: string): number {
    return this.offsets.get(id) ?? 0;
  }

  subscribeMeta(id: string, fn: Listener): () => void {
    const set = this.metaListeners.get(id) ?? new Set();
    set.add(fn);
    this.metaListeners.set(id, set);
    return () => set.delete(fn);
  }

  setMode(mode: ControlMode) {
    this.mode = mode;
    this.modeListeners.forEach((f) => f());
  }

  get canSend(): boolean {
    return this.mode === "control";
  }

  /** A local interaction: update state and send OSC. Ignored unless this device holds control. */
  interact(control: AnyControl, value: ControlValue): boolean {
    if (control.type === "unsupported" || !this.canSend) return false;
    if (isDelta(value)) {
      this.offsets.set(control.id, this.offset(control.id) + value.delta);
      this.metaListeners.get(control.id)?.forEach((f) => f());
    }
    const previous = this.get(control.id);
    this.set(control.id, value);
    if (this.transport.interact) {
      this.transport.interact(this.pult.id, control, value, previous);
      return true;
    }
    const msgs = messagesFor(control, value, previous);
    const target = targetOf(this.config, this.pult, control);
    if (msgs.length && target) {
      this.transport.send(target, msgs);
      this.rememberSent(control, msgs, value);
    }
    // Direct OSC (no bridge) has nobody to confirm a prompt: treat it as applied.
    if (control.type === "prompt")
      this.setAck(control.id, { state: "applied", seq: ++this.localSeq });
    return true;
  }

  /** A value from another device (via the bridge) or feedback from the installation. */
  set(id: string, value: ControlValue) {
    if (sameValue(this.values.get(id), value)) return;
    this.values.set(id, value);
    // A copy: a listener that (re)subscribes while being notified is not called again in this pass.
    for (const f of [...(this.listeners.get(id) ?? [])]) f();
    for (const f of [...this.changeListeners]) f(id, value);
  }

  /**
   * Apply an incoming OSC message to every control listening on its address.
   *
   * Installations echo what they receive (docs/integration.md). For a control this store is
   * sending at full rate (a drag), the echo of an older command arrives after newer ones were sent,
   * and it never equals the value it came from: it went through the control's range and back, and
   * OSC floats are float32. Applying such an echo as new state rewinds the control and broadcasts
   * the stale value to every device, the sender included — at 30 Hz, against the finger. So an echo
   * of our own command is recognised as one (`isOwnEcho`); every other message is installation
   * state and applies as before.
   */
  receive(msg: OscMessage) {
    for (const c of this.byFeedback.get(msg.address) ?? []) {
      if (this.isOwnEcho(c, msg)) continue;
      if (c.type === "colorPicker" && c.format === "hsb") {
        this.receiveHsb(c, msg);
        continue;
      }
      const v = feedbackValue(c, msg, this.get(c.id));
      if (v !== undefined) this.set(c.id, v);
    }
  }

  private rememberSent(c: Control, msgs: OscMessage[], value: ControlValue) {
    const base = sendBase(c);
    const at = this.now();
    const list = this.recentSent(c.id, at);
    for (const m of msgs) list.push({ slot: slotOf(m.address, base), args: m.args, at });
    if (list.length > ECHO_KEEP) list.splice(0, list.length - ECHO_KEEP);
    this.sent.set(c.id, list);
    this.sentValue.set(c.id, value);
  }

  /** What this store sent for a control within the echo window, oldest first. */
  private recentSent(id: string, now: number): Sent[] {
    const list = this.sent.get(id) ?? [];
    const fresh = list.findIndex((e) => now - e.at <= ECHO_WINDOW_MS);
    if (fresh !== 0) list.splice(0, fresh < 0 ? list.length : fresh);
    return list;
  }

  /**
   * Is `msg` the installation echoing a command this store sent for `c`? An echo of an older
   * command while newer ones are in flight is stale: the installation is about to receive the newer
   * ones. An echo of the newest command confirms the value we already hold exactly — unless the
   * installation reported a different value in between, in which case it took our command after
   * its own change and the echo is its state.
   */
  private isOwnEcho(c: Control, msg: OscMessage): boolean {
    const list = this.recentSent(c.id, this.now());
    if (!list.length) return false;
    const slot = slotOf(msg.address, feedbackBase(c));
    let i = list.length - 1;
    for (; i >= 0; i--) if (list[i]!.slot === slot && sameArgs(list[i]!.args, msg.args)) break;
    if (i < 0) return false;
    const newer = list.slice(i + 1).some((e) => e.slot === slot);
    // Echoes come back in order: what was sent before the echoed command will not be echoed now.
    this.sent.set(
      c.id,
      list.filter((e, j) => j >= i || e.slot !== slot),
    );
    if (newer) return true;
    return sameValue(this.values.get(c.id), this.sentValue.get(c.id) ?? null);
  }

  /** One channel of an `hsb` colour picker came back from the installation. */
  private receiveHsb(c: Extract<Control, { type: "colorPicker" }>, msg: OscMessage) {
    const ch = msg.address.slice(msg.address.lastIndexOf("/") + 1) as HsbChannel;
    const cur = this.get(c.id);
    const hex = typeof cur === "string" ? cur : (c.default ?? "#FFFFFF");
    const first = msg.args[0] ? argValue(msg.args[0]) : undefined;
    const next = applyHsbFeedback(this.hsb.get(c.id), hex, ch, first, c.hueRange);
    if (!next) return;
    this.hsb.set(c.id, next);
    this.set(c.id, hsbToHex(next));
  }
}

/** The address a control listens on for feedback (its `feedback`, else its own fixed address). */
function feedbackBase(c: Control): string | undefined {
  return c.feedback ?? sendBase(c);
}

/** The control's own fixed address (none for templated addresses like `/cue/{index}`). */
function sendBase(c: Control): string | undefined {
  return "address" in c && typeof c.address === "string" && !c.address.includes("{")
    ? c.address
    : undefined;
}

/**
 * Address relative to a control's base: `""` for the address itself, `"/h"` for an `hsb` channel.
 * A control that sends on `address` and hears back on `feedback` gets the same slot for both.
 */
function slotOf(address: string, base: string | undefined): string {
  return base && address.startsWith(base) ? address.slice(base.length) : address;
}

/**
 * Same OSC arguments, allowing for the trip through the installation: a float comes back as
 * float32 (and an integer-valued float may come back as an int, or the other way round).
 */
function sameArgs(a: OscArg[], b: OscArg[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => {
    const va = argValue(x);
    const vb = argValue(b[i]!);
    if (typeof va === "number" && typeof vb === "number")
      return Math.abs(va - vb) <= 1e-6 * Math.max(1, Math.abs(va));
    return va === vb && (typeof va !== "object" || va === null);
  });
}

const isDelta = (v: ControlValue): v is { delta: number } =>
  typeof v === "object" && v !== null && "delta" in v && typeof v.delta === "number";

function feedbackValue(
  c: Control,
  msg: OscMessage,
  current: ControlValue,
): ControlValue | undefined {
  const vals = msg.args.map(argValue);
  const first = vals[0];
  switch (c.type) {
    case "fader":
      // An endless jog has no position the installation could report.
      return c.mode !== "relative" && typeof first === "number" ? first : undefined;
    case "knob": {
      const mode = knobMode(c);
      if (mode === "relative" || typeof first !== "number") return undefined;
      return mode === "hue" ? wrapHue(first) : first;
    }
    case "meter":
      return typeof first === "number" ? first : undefined;
    case "buttonGroup": {
      const b = c.buttons.find((x) => x.address === msg.address);
      if (!b) return undefined;
      const lit = first === true || first === 1 || (b.value !== undefined && first === b.value);
      const on = new Set(isGroupValue(current) ? current.on : []);
      if (lit) on.add(b.id);
      else on.delete(b.id);
      return { on: c.buttons.filter((x) => on.has(x.id)).map((x) => x.id) };
    }
    case "toggle":
      return first === true || first === 1 || first === c.on[0];
    case "label":
      return first === undefined || first === null ? "" : String(first);
    case "xy": {
      const [x, y] = vals;
      if (typeof x !== "number" || typeof y !== "number") return undefined;
      return { x: (x - c.x.min) / (c.x.max - c.x.min), y: (y - c.y.min) / (c.y.max - c.y.min) };
    }
    case "gyroscope": {
      // Another device's tilt echoed by the installation: move the dot.
      const [x, y] = vals;
      if (typeof x !== "number" || typeof y !== "number") return undefined;
      return { x: Math.min(1, Math.max(-1, x)), y: Math.min(1, Math.max(-1, y)) };
    }
    case "segmented": {
      const i = c.options.findIndex((o) => o.value === first);
      return i >= 0 ? i : undefined;
    }
    case "sceneList":
      return c.scenes.find((s) => s.value === first)?.id;
    case "colorPicker":
      return c.format === "hsb" ? undefined : colorFromArgs(c.format, vals);
    default:
      return undefined;
  }
}

function sameValue(a: ControlValue | undefined, b: ControlValue): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}
