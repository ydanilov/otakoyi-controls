import { describe, expect, it } from "vitest";
import { message } from "@osc/core";
import { parseConfig, type Control } from "@osc/schema";
import demo from "../../schema/examples/demo-installation.json";
import {
  DebugStore,
  RateWindow,
  Ring,
  debugAddress,
  formatAgo,
  formatClock,
  formatDebugValue,
  formatOscArgs,
  formatRate,
} from "./debug";

function clock(start = 1_000_000) {
  let t = start;
  return { now: () => t, tick: (ms: number) => (t += ms) };
}

describe("RateWindow", () => {
  it("counts events per second over a sliding window", () => {
    const w = new RateWindow(1000);
    for (let i = 0; i < 10; i++) w.hit(1000 + i * 50);
    expect(w.rate(1450)).toBe(10);
    // 1 s after the first hit it has left the window.
    expect(w.rate(2000)).toBe(9);
    expect(w.rate(3000)).toBe(0);
  });

  it("scales to messages per second for other window sizes", () => {
    const w = new RateWindow(500);
    w.hit(0, 5);
    expect(w.rate(100)).toBe(10);
  });
});

describe("Ring", () => {
  it("keeps the newest items, oldest first", () => {
    const r = new Ring<number>(3);
    for (let i = 1; i <= 5; i++) r.push(i);
    expect(r.items()).toEqual([3, 4, 5]);
  });
});

describe("formatting", () => {
  it("shows OSC arguments the way the HUD does", () => {
    expect(formatOscArgs(message("/a", 0.6).args)).toBe("0.600");
    expect(formatOscArgs(message("/a", "ambient").args)).toBe('"ambient"');
    expect(formatOscArgs([{ type: "i", value: 3 }, { type: "T" }])).toBe("3 T");
  });

  it("formats values, rates, clock and age", () => {
    expect(formatDebugValue(0.4123)).toBe("0.412");
    expect(formatDebugValue({ x: 0.5, y: 0.25 })).toBe("0.500 0.250");
    expect(formatDebugValue({ delta: 0.02 })).toBe("+0.020");
    expect(formatDebugValue(true)).toBe("1");
    expect(formatRate(0)).toBe("0");
    expect(formatRate(2.46)).toBe("2.5");
    expect(formatRate(48.4)).toBe("48");
    expect(formatClock(new Date(2026, 0, 1, 10, 21, 4, 218).getTime())).toBe("10:21:04.218");
    expect(formatAgo(null, 0)).toBe("—");
    expect(formatAgo(1000, 1062)).toBe("62 ms ago");
    expect(formatAgo(0, 3400)).toBe("3.4 s ago");
  });

  it("names a control's address or template", () => {
    const r = parseConfig(demo);
    if (!r.ok) throw new Error("demo invalid");
    const controls = r.config.pults.flatMap((p) => p.pages.flatMap((pg) => pg.controls));
    const fader = controls.find((c) => c.type === "fader") as Control;
    expect(debugAddress(fader)).toBe((fader as { address: string }).address);
    const group = {
      type: "buttonGroup",
      id: "g",
      buttons: [
        { id: "a", label: "A", address: "/l/a" },
        { id: "b", label: "B", address: "/l/b" },
      ],
    } as unknown as Control;
    expect(debugAddress(group)).toBe("/l/a · /l/b");
    const meter = {
      type: "meter",
      id: "audio",
      feedback: "/wall/audio/level",
    } as unknown as Control;
    expect(debugAddress(meter)).toBe("/wall/audio/level");
  });
});

describe("DebugStore", () => {
  it("tracks per-control value and rate, and the out rate", () => {
    const c = clock();
    const d = new DebugStore({ now: c.now });
    expect(d.control("brightness")).toBeNull();
    for (let i = 0; i < 12; i++) {
      d.sent("brightness", [message("/wall/brightness", 0.5 + i / 100)]);
      c.tick(80);
    }
    const s = d.control("brightness")!;
    expect(s.value).toBe("0.610");
    expect(s.rate).toBe(12);
    expect(d.rates()).toEqual({ out: 12, in: 0 });
    c.tick(2000);
    expect(d.control("brightness")!.rate).toBe(0);
    expect(d.rates().out).toBe(0);
  });

  it("logs sent and received OSC with timestamps in a ring of logSize", () => {
    const c = clock();
    const d = new DebugStore({ now: c.now, logSize: 3 });
    d.sent("a", [message("/a", 1)]);
    c.tick(10);
    d.received("/sys/fps", "59.900");
    c.tick(10);
    d.sent("b", [message("/b", 2), message("/c", 3)]);
    const log = d.entries();
    expect(log.map((e) => `${e.dir} ${e.address} ${e.args}`)).toEqual([
      "in /sys/fps 59.900",
      "out /b 2",
      "out /c 3",
    ]);
    expect(log[0]!.at).toBe(1_000_010);
    expect(d.lastIn).toBe(1_000_010);
    expect(d.rates()).toEqual({ out: 3, in: 1 });
  });

  it("measures the round-trip of the protocol ping", () => {
    const c = clock();
    const d = new DebugStore({ now: c.now });
    const at = d.ping();
    c.tick(12);
    d.pong(at);
    expect(d.rtt).toBe(12);
    d.pong(123); // a pong for a ping it never sent
    expect(d.rtt).toBe(12);
  });

  it("notifies subscribers and resets on a new connection", () => {
    const d = new DebugStore();
    let n = 0;
    const off = d.subscribe(() => n++);
    d.sent("a", [message("/a", 1)]);
    d.setFps(59.9);
    d.setFps(59.9); // unchanged: no notification
    expect(n).toBe(2);
    expect(d.fps).toBe(59.9);
    d.reset();
    expect(d.entries()).toHaveLength(0);
    expect(d.control("a")).toBeNull();
    expect(d.fps).toBeNull();
    off();
    d.sent("a", [message("/a", 1)]);
    expect(n).toBe(3);
  });

  it("ignores an empty send", () => {
    const d = new DebugStore();
    d.sent("a", []);
    expect(d.entries()).toHaveLength(0);
    expect(d.control("a")).toBeNull();
  });
});
