import { describe, expect, it, vi } from "vitest";
import { argValue, encodeMessage, message, type OscMessage } from "@osc/core";
import { Control, parseConfig, type ControlOf } from "@osc/schema";
import demo from "../../schema/examples/demo-installation.json";
import { coerceValue } from "./coerce";
import { initialValue, messagesFor, toggleInGroup } from "./logic";
import { analyzeBlock, createBeatDetector, groupBands, rmsLevel } from "./mic";
import {
  angleToPosition,
  createDeltaAccumulator,
  crossfadeMix,
  crossfadePosition,
  crossfadeLabel,
  crossfadeShares,
  hueDrag,
  jogDelta,
  knobAngle,
  knobMode,
  wrapHue,
} from "./modes";
import { promptValue, togglePreset } from "./prompt";
import { PultStore } from "./store";
import { createThumbstick, thumbstickDeflection, type Deflection } from "./thumbstick";

const parsed = parseConfig(demo);
if (!parsed.ok) throw new Error("demo config invalid");
const cfg = parsed.config;
const all = cfg.pults.flatMap((p) => p.pages.flatMap((g) => g.controls)) as Control[];
const get = <T extends Control["type"]>(id: string) => all.find((c) => c.id === id) as ControlOf<T>;
const wire = (msgs: OscMessage[]) =>
  msgs.map((m) => {
    expect(() => encodeMessage(m)).not.toThrow();
    return [m.address, ...m.args.map(argValue)];
  });

describe("fader: crossfade", () => {
  it("centre detent holds exactly 0.5 and the ends still reach 0 and 1", () => {
    expect(crossfadeMix(0, 0.04)).toBe(0);
    expect(crossfadeMix(1, 0.04)).toBe(1);
    expect(crossfadeMix(0.5, 0.04)).toBe(0.5);
    expect(crossfadeMix(0.47, 0.04)).toBe(0.5);
    expect(crossfadeMix(0.535, 0.04)).toBe(0.5);
    expect(crossfadeMix(0.23, 0.04)).toBeCloseTo(0.25);
    expect(crossfadeMix(0.77, 0.04)).toBeCloseTo(0.75);
  });

  it("is continuous at the edge of the detent and monotonic", () => {
    expect(crossfadeMix(0.46, 0.04)).toBeCloseTo(0.5);
    expect(crossfadeMix(0.54, 0.04)).toBeCloseTo(0.5);
    let prev = -1;
    for (let p = 0; p <= 1; p += 0.01) {
      const m = crossfadeMix(p, 0.04);
      expect(m).toBeGreaterThanOrEqual(prev);
      prev = m;
    }
  });

  it("round-trips mix → position, and no detent is the identity", () => {
    for (const m of [0, 0.1, 0.25, 0.5, 0.8, 1])
      expect(crossfadeMix(crossfadePosition(m, 0.04), 0.04)).toBeCloseTo(m);
    expect(crossfadeMix(0.37, 0)).toBe(0.37);
  });

  it("shows A / B shares and sends the mix as a float", () => {
    expect(crossfadeShares(0.25)).toEqual({ a: 75, b: 25 });
    expect(crossfadeLabel(undefined, 0.7)).toBe("A 30 · B 70");
    expect(crossfadeLabel({ a: "Day", b: "Night" }, 0.5)).toBe("Day 50 · Night 50");
    const xf = get<"fader">("xfade");
    expect(initialValue(xf)).toBe(0.5);
    expect(wire(messagesFor(xf, 0.25))).toEqual([["/live/mix", 0.25]]);
  });
});

describe("relative (endless) fader and knob", () => {
  it("converts pixels to a delta of the range", () => {
    expect(jogDelta(150, 300, 1)).toBe(0.5);
    expect(jogDelta(-300, 300, 2)).toBe(-2);
    expect(jogDelta(150, 300, 1, 0.2)).toBeCloseTo(0.1);
  });

  it("accumulates deltas inside the throttle window instead of dropping them", () => {
    vi.useFakeTimers();
    let t = 0;
    const sent: number[] = [];
    const acc = createDeltaAccumulator(
      10,
      (d) => sent.push(d),
      () => t,
    );
    acc.push(0.1); // leading: sent now
    t = 20;
    acc.push(0.05);
    t = 40;
    acc.push(0.05);
    t = 60;
    acc.push(-0.02);
    t = 100;
    vi.advanceTimersByTime(100);
    expect(sent).toEqual([0.1, 0.08]);
    acc.push(0.3);
    acc.push(-0.3); // nets to zero → nothing sent
    acc.flush();
    expect(sent).toEqual([0.1, 0.08]);
    acc.push(0.01);
    acc.flush();
    expect(sent).toEqual([0.1, 0.08, 0.01]);
    vi.useRealTimers();
  });

  it("sends deltas, never absolute values, and ignores feedback", () => {
    const jog = get<"fader">("jog");
    expect(initialValue(jog)).toBeNull();
    expect(wire(messagesFor(jog, { delta: -0.125 }))).toEqual([["/live/jog", -0.125]]);
    expect(messagesFor(jog, { delta: 0 })).toEqual([]);
    expect(messagesFor(jog, 0.5)).toEqual([]);
    const zoom = get<"knob">("zoom");
    expect(wire(messagesFor(zoom, { delta: 0.02 }))).toEqual([["/live/zoom", 0.02]]);
    expect(coerceValue(jog, { delta: 5 })).toEqual({ delta: 1 });
    expect(coerceValue(jog, 0.5)).toBeUndefined();
  });

  it("v1 `endless: true` still means a relative knob", () => {
    expect(knobMode({ mode: "absolute", endless: true })).toBe("relative");
    expect(knobMode({ mode: "hue", endless: true })).toBe("hue");
  });
});

describe("knob travel and hue", () => {
  it("clamps to the ends of the travel", () => {
    expect(knobAngle(-0.5)).toBe(-120);
    expect(knobAngle(2)).toBe(120);
    expect(angleToPosition(0)).toBe(0.5);
    expect(angleToPosition(-120)).toBe(0);
    expect(angleToPosition(-170)).toBe(0); // in the gap, left side: hard stop at min
    expect(angleToPosition(170)).toBe(1); // in the gap, right side: hard stop at max
    expect(angleToPosition(60, 240)).toBeCloseTo(0.75);
    expect(angleToPosition(90, 360)).toBeCloseTo(0.75);
  });

  it("hue wraps past 360 in both directions", () => {
    expect(wrapHue(370)).toBe(10);
    expect(wrapHue(-30)).toBe(330);
    expect(wrapHue(360)).toBe(0);
    expect(hueDrag(350, 50, 360)).toBe(40); // 50 px of a 360 px turn = +50° → 400° → 40°
    expect(hueDrag(10, -36, 360)).toBe(334);
  });

  it("hue knob sends 0..360 and wraps incoming values", () => {
    const color = get<"knob">("color");
    expect(initialValue(color)).toBe(0);
    expect(wire(messagesFor(color, 400))).toEqual([["/live/color", 40]]);
    expect(coerceValue(color, -90)).toBe(270);
  });
});

describe("thumbstick", () => {
  const size = { width: 200, height: 200 };

  it("maps the finger to −1..1 with y up, limited to the circle", () => {
    expect(thumbstickDeflection({ x: 200, y: 100 }, size, 0)).toEqual({ x: 1, y: 0 });
    expect(thumbstickDeflection({ x: 100, y: 0 }, size, 0)).toEqual({ x: 0, y: 1 });
    const far = thumbstickDeflection({ x: 400, y: -200 }, size, 0);
    expect(Math.hypot(far.x, far.y)).toBeCloseTo(1);
    expect(far.x).toBeCloseTo(far.y); // up-right diagonal
  });

  it("ignores the dead zone and rescales the travel outside it", () => {
    expect(thumbstickDeflection({ x: 105, y: 100 }, size, 0.1)).toEqual({ x: 0, y: 0 });
    expect(thumbstickDeflection({ x: 110, y: 100 }, size, 0.1)).toEqual({ x: 0, y: 0 });
    expect(thumbstickDeflection({ x: 155, y: 100 }, size, 0.1).x).toBeCloseTo(0.5);
    expect(thumbstickDeflection({ x: 200, y: 100 }, size, 0.1).x).toBe(1);
  });

  it("repeats at rateHz while held and springs to 0, 0 on release", () => {
    vi.useFakeTimers();
    const sent: Deflection[] = [];
    const stick = createThumbstick({ rateHz: 30 }, (d) => sent.push(d));
    stick.start({ x: 0.5, y: 0 });
    expect(sent).toHaveLength(1);
    vi.advanceTimersByTime(100); // 3 ticks at 30 Hz, even with the finger still
    expect(sent).toHaveLength(4);
    stick.move({ x: 0, y: -1 });
    vi.advanceTimersByTime(34);
    expect(sent.at(-1)).toEqual({ x: 0, y: -1 });
    stick.release();
    expect(sent.at(-1)).toEqual({ x: 0, y: 0 });
    const n = sent.length;
    vi.advanceTimersByTime(500);
    expect(sent).toHaveLength(n); // nothing after release
    stick.release();
    expect(sent).toHaveLength(n); // releasing twice sends 0, 0 once
    vi.useRealTimers();
  });

  it("messages: x y deflection, and the optional click", () => {
    const cam = get<"thumbstick">("cam");
    expect(wire(messagesFor(cam, { x: 0.25, y: -1 }))).toEqual([["/live/cam", 0.25, -1]]);
    expect(wire(messagesFor(cam, { x: 0, y: 0 }))).toEqual([["/live/cam", 0, 0]]);
    expect(wire(messagesFor(cam, { pressed: true }))).toEqual([["/live/cam/reset", 1]]);
    expect(coerceValue(cam, { x: 3, y: -3 })).toEqual({ x: 1, y: -1 });
  });
});

describe("buttonGroup", () => {
  const g = get<"buttonGroup">("layers");

  it("latches each button independently", () => {
    let v = initialValue(g);
    expect(v).toEqual({ on: ["particles"] });
    v = toggleInGroup(g, v, "text");
    expect(v).toEqual({ on: ["particles", "text"], changed: "text" });
    v = toggleInGroup(g, v, "lines");
    expect(v.on).toEqual(["particles", "lines", "text"]);
    v = toggleInGroup(g, v, "particles");
    expect(v).toEqual({ on: ["lines", "text"], changed: "particles" });
  });

  it("sends only the changed button; a full sync sends every button", () => {
    expect(wire(messagesFor(g, { on: ["text"], changed: "text" }))).toEqual([
      ["/live/layer/text", 1],
    ]);
    expect(wire(messagesFor(g, { on: [], changed: "text" }))).toEqual([["/live/layer/text", 0]]);
    expect(wire(messagesFor(g, { on: ["logo"] }))).toEqual([
      ["/live/layer/particles", 0],
      ["/live/layer/lines", 0],
      ["/live/layer/text", 0],
      ["/live/layer/logo", "on"],
    ]);
  });

  it("rejects unknown buttons", () => {
    expect(coerceValue(g, { on: ["nope"] })).toBeUndefined();
    expect(coerceValue(g, { on: ["text"], changed: "nope" })).toBeUndefined();
    expect(coerceValue(g, { on: ["text", "lines"], changed: "text" })).toEqual({
      on: ["lines", "text"],
      changed: "text",
    });
  });

  it("feedback on a button's address lights only that button", () => {
    const pult = cfg.pults.find((p) => p.id === "live")!;
    const store = new PultStore(cfg, pult, { send: () => {} });
    store.receive(message("/live/layer/text", 1));
    expect(store.get("layers")).toEqual({ on: ["particles", "text"] });
    store.receive(message("/live/layer/particles", 0));
    expect(store.get("layers")).toEqual({ on: ["text"] });
  });
});

describe("image", () => {
  it("ready message is <address> <absolute path>", () => {
    const photo = get<"image">("photo");
    expect(
      wire(messagesFor(photo, { image: "abc", path: "/srv/otakoyi/uploads/demo/abc.jpg" })),
    ).toEqual([["/live/image", "/srv/otakoyi/uploads/demo/abc.jpg"]]);
    expect(messagesFor(photo, null)).toEqual([]);
  });

  it("a device can never set the path itself", () => {
    expect(
      coerceValue(get("photo"), { image: "x", path: "C:/Windows/system.ini" }),
    ).toBeUndefined();
  });
});

describe("mic", () => {
  const mic = get<"mic">("mic");

  it("payload shapes under the address prefix", () => {
    const frame = { level: 0.5, bands: [0.1, 0.2, 0.3], beat: true };
    expect(wire(messagesFor(mic, frame))).toEqual([
      ["/live/mic/level", 0.5],
      ["/live/mic/bands", 0.1, 0.2, 0.3, 0, 0, 0, 0, 0], // always `bands` floats
      ["/live/mic/beat", 1],
    ]);
    expect(wire(messagesFor(mic, { level: 0.2, bands: [], beat: false }))).toEqual([
      ["/live/mic/level", 0.2],
      ["/live/mic/bands", 0, 0, 0, 0, 0, 0, 0, 0],
    ]);
  });

  it("only the configured outputs are sent", () => {
    const levelOnly = Control.parse({
      id: "m",
      type: "mic",
      address: "/m",
    }) as ControlOf<"mic">;
    expect(wire(messagesFor(levelOnly, { level: 0.3, bands: [1], beat: true }))).toEqual([
      ["/m/level", 0.3],
    ]);
    expect(coerceValue(levelOnly, { bands: [1] })).toBeUndefined();
    expect(coerceValue(mic, { level: 3, bands: [2, -1] })).toEqual({ level: 1, bands: [1, 0] });
    expect(coerceValue(mic, { bands: Array(9).fill(0) })).toBeUndefined();
  });

  it("analysis: RMS level with gain, log bands, beats with cooldown", () => {
    expect(rmsLevel([0.5, -0.5, 0.5, -0.5])).toBe(0.5);
    expect(rmsLevel([0.5, -0.5], 4)).toBe(1);
    expect(rmsLevel([])).toBe(0);
    const bands = groupBands(Array(512).fill(0.5), 8);
    expect(bands).toHaveLength(8);
    expect(bands.every((b) => b === 0.5)).toBe(true);
    const beat = createBeatDetector({ cooldownMs: 200 });
    const hits = [0.1, 0.1, 0.1, 0.1, 0.6, 0.1, 0.7, 0.1].map((e, i) => beat(e, i * 33));
    expect(hits).toEqual([false, false, false, false, true, false, false, false]);
    expect(beat(0.9, 1000)).toBe(true);
    const frame = analyzeBlock(mic, { samples: [0.2, -0.2], at: 0 }, () => false);
    expect(frame).toEqual({ level: 0.2, bands: Array(8).fill(0), beat: false });
  });
});

describe("prompt", () => {
  const prompt = get<"prompt">("prompt");
  const presets = [
    { id: "forest", text: "misty forest at dawn", on: true },
    { id: "city", text: "neon city in the rain", on: true },
    { id: "sea", text: "calm sea", on: false },
  ];

  it("blend sends A, B and the mix amount", () => {
    const v = promptValue(presets, { a: "forest", b: "city", mix: 0.25 }, prompt.maxLength);
    expect(wire(messagesFor(prompt, v))).toEqual([
      ["/live/prompt/a", "misty forest at dawn"],
      ["/live/prompt/b", "neon city in the rain"],
      ["/live/prompt/mix", 0.25],
    ]);
  });

  it("a preset switched off sends an empty slot; toggling turns it back on", () => {
    let v = promptValue(presets, { a: "sea", b: "city", mix: 2 }, 500);
    expect(v).toEqual({ a: null, b: "neon city in the rain", mix: 1, aId: null, bId: "city" });
    expect(wire(messagesFor(prompt, v))[0]).toEqual(["/live/prompt/a", ""]);
    const on = togglePreset(presets, "sea");
    v = promptValue(on, { a: "sea", b: null, mix: 0 }, 4);
    expect(v.a).toBe("calm"); // cut to maxLength
  });

  it("without blend sends one prompt on the address", () => {
    const single = Control.parse({
      id: "p",
      type: "prompt",
      address: "/p",
      blend: false,
    }) as ControlOf<"prompt">;
    expect(wire(messagesFor(single, { a: "hello", b: "ignored", mix: 0.5 }))).toEqual([
      ["/p", "hello"],
    ]);
  });

  it("validates texts against maxLength", () => {
    expect(coerceValue(prompt, { a: "x".repeat(501), b: null, mix: 0 })).toBeUndefined();
    expect(coerceValue(prompt, { a: "ok", b: null, mix: 7 })).toMatchObject({
      a: "ok",
      b: null,
      mix: 1,
      aId: null,
    });
  });
});

describe("toggle switch style", () => {
  it("sends the same messages as a toggle button", () => {
    expect(wire(messagesFor(get("strobe"), true))).toEqual([["/live/strobe", 1]]);
    expect(wire(messagesFor(get("strobe"), false))).toEqual([["/live/strobe", 0]]);
  });
});
