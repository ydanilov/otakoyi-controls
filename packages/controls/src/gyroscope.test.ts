import { describe, expect, it, vi } from "vitest";
import { encodeMessage, message } from "@osc/core";
import { Control, parseConfig, type ControlOf } from "@osc/schema";
import demo from "../../schema/examples/demo-installation.json";
import { coerceValue } from "./coerce";
import {
  angleDelta,
  asTilt,
  createGyroscope,
  formatTilt,
  gyroscopeState,
  GYROSCOPE_MESSAGES,
  tiltFrom,
} from "./gyroscope";
import { initialValue, messagesFor } from "./logic";
import { PultStore } from "./store";

const parsed = parseConfig(demo);
if (!parsed.ok) throw new Error("demo config invalid");
const cfg = parsed.config;
const tilt = cfg.pults
  .flatMap((p) => p.pages.flatMap((g) => g.controls))
  .find((c) => c.id === "tilt") as ControlOf<"gyroscope">;

describe("gyroscope: schema", () => {
  it("fills defaults: 30 Hz, ±30°", () => {
    expect(tilt).toMatchObject({ type: "gyroscope", address: "/live/tilt", rateHz: 30, range: 30 });
  });

  it("rejects a range outside 5..90° and a rate above 60 Hz", () => {
    const base = { id: "g", type: "gyroscope", address: "/g" };
    expect(Control.safeParse({ ...base, range: 2 }).success).toBe(false);
    expect(Control.safeParse({ ...base, range: 120 }).success).toBe(false);
    expect(Control.safeParse({ ...base, rateHz: 120 }).success).toBe(false);
    expect(Control.safeParse({ ...base, preset: "gyroscope/steer", range: 20 }).success).toBe(true);
  });
});

describe("gyroscope: mapping", () => {
  const centre = { pitch: 40, roll: 0 };

  it("the captured pose is the centre", () => {
    expect(tiltFrom(centre, centre, 30)).toEqual({ x: 0, y: 0 });
  });

  it("roll right is +x, top edge away (pitch down) is +y, range reaches ±1", () => {
    expect(tiltFrom({ pitch: 40, roll: 15 }, centre, 30)).toEqual({ x: 0.5, y: 0 });
    expect(tiltFrom({ pitch: 10, roll: 0 }, centre, 30)).toEqual({ x: 0, y: 1 });
    expect(tiltFrom({ pitch: 55, roll: -30 }, centre, 30)).toEqual({ x: -1, y: -0.5 });
  });

  it("clamps beyond the range", () => {
    expect(tiltFrom({ pitch: -50, roll: 80 }, centre, 30)).toEqual({ x: 1, y: 1 });
  });

  it("wraps across ±180° instead of jumping", () => {
    expect(angleDelta(-175, 175)).toBe(10);
    expect(angleDelta(175, -175)).toBe(-10);
    expect(tiltFrom({ pitch: -175, roll: 0 }, { pitch: 175, roll: 0 }, 20).y).toBe(-0.5);
  });

  it("formats the header like Figma", () => {
    expect(formatTilt({ x: 0.42, y: 0.28 })).toBe("x 0.42  y 0.28");
    expect(formatTilt({ x: -0.5, y: 0 })).toBe("x −0.50  y 0.00");
    expect(formatTilt(null)).toBe("—");
    expect(asTilt({ x: 3, y: -0.2 })).toEqual({ x: 1, y: -0.2 });
    expect(asTilt({ pressed: true })).toBeNull();
  });
});

describe("gyroscope: driver", () => {
  it("first sample is the centre, then throttled at rateHz, stop reports 0 0 once", () => {
    vi.useFakeTimers();
    let t = 0;
    const sent: { x: number; y: number }[] = [];
    const g = createGyroscope(
      { rateHz: 10, range: 30 },
      (v) => sent.push(v),
      () => t,
    );
    expect(g.sample({ pitch: 0, roll: 0 })).toBeNull(); // off: ignored
    g.start();
    g.sample({ pitch: 20, roll: 5 }); // centre
    expect(sent).toEqual([{ x: 0, y: 0 }]);
    t = 30;
    g.sample({ pitch: 20, roll: 20 });
    t = 60;
    g.sample({ pitch: 20, roll: 35 }); // coalesced with the previous one
    expect(sent).toHaveLength(1);
    t = 100;
    vi.advanceTimersByTime(100);
    expect(sent).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);
    g.stop();
    g.stop();
    expect(sent.at(-1)).toEqual({ x: 0, y: 0 });
    expect(sent).toHaveLength(3);
    expect(g.live).toBe(false);
    vi.useRealTimers();
  });

  it("recentre takes the next reading as the new centre", () => {
    const sent: { x: number; y: number }[] = [];
    const g = createGyroscope(
      { rateHz: 1000, range: 30 },
      (v) => sent.push(v),
      () => 1e9,
    );
    g.start();
    g.sample({ pitch: 0, roll: 0 });
    g.recentre();
    expect(g.sample({ pitch: 0, roll: 30 })).toEqual({ x: 0, y: 0 });
    g.dispose();
  });
});

describe("gyroscope: OSC and sync", () => {
  it("sends <address> f x f y", () => {
    const msgs = messagesFor(tilt, { x: 0.42, y: -0.28 });
    msgs.forEach((m) => expect(() => encodeMessage(m)).not.toThrow());
    expect(msgs).toEqual([
      {
        address: "/live/tilt",
        args: [
          { type: "f", value: 0.42 },
          { type: "f", value: -0.28 },
        ],
      },
    ]);
    expect(messagesFor(tilt, null)).toEqual([]);
    expect(initialValue(tilt)).toEqual({ x: 0, y: 0 });
  });

  it("the bridge clamps a synced tilt and rejects anything else", () => {
    expect(coerceValue(tilt, { x: 2, y: -0.5 })).toEqual({ x: 1, y: -0.5 });
    expect(coerceValue(tilt, { x: "1", y: 0 })).toBeUndefined();
    expect(coerceValue(tilt, 0.5)).toBeUndefined();
  });

  it("feedback from the installation moves the dot", () => {
    const pult = cfg.pults.find((p) => p.pages.some((g) => g.controls.includes(tilt)))!;
    const store = new PultStore(cfg, pult, { send: () => {} });
    store.receive(message("/live/tilt", 0.25, -2));
    expect(store.get("tilt")).toEqual({ x: 0.25, y: -1 });
    store.receive(message("/live/tilt", 0.5));
    expect(store.get("tilt")).toEqual({ x: 0.25, y: -1 });
  });
});

describe("gyroscope: state", () => {
  it("view only wins, then unsupported, then denied, then live / off", () => {
    const s = { live: true, denied: true, available: true, disabled: true };
    expect(gyroscopeState(s)).toBe("viewOnly");
    expect(gyroscopeState({ ...s, disabled: false, available: false })).toBe("unsupported");
    expect(gyroscopeState({ ...s, disabled: false })).toBe("denied");
    expect(gyroscopeState({ ...s, disabled: false, denied: false })).toBe("live");
    expect(gyroscopeState({ ...s, disabled: false, denied: false, live: false })).toBe("off");
    expect(GYROSCOPE_MESSAGES.denied).toBe("Motion access is off for Otakoyi.");
  });
});
