import { describe, expect, it } from "vitest";
import { decodeMessage, encodeMessage, message, type OscMessage } from "@osc/core";
import { parseConfig, type Target } from "@osc/schema";
import demo from "../../schema/examples/demo-installation.json";
import { ECHO_WINDOW_MS, PultStore } from "./store";

function setup() {
  const r = parseConfig(demo);
  if (!r.ok) throw new Error("demo invalid");
  const sent: Array<{ target: Target; msgs: OscMessage[] }> = [];
  const store = new PultStore(r.config, r.config.pults[0]!, {
    send: (target, msgs) => sent.push({ target, msgs }),
  });
  const control = (id: string) => store.controls().find((c) => c.id === id)!;
  return { store, sent, control };
}

describe("PultStore", () => {
  it("accumulates a relative control's change since the session started", () => {
    const { store, control } = setup();
    const jog = { ...control("intensity"), mode: "relative" } as ReturnType<typeof control>;
    let notified = 0;
    store.subscribeMeta(jog.id, () => notified++);
    expect(store.offset(jog.id)).toBe(0);
    store.interact(jog, { delta: 0.015 });
    store.interact(jog, { delta: 0.005 });
    expect(store.offset(jog.id)).toBeCloseTo(0.02);
    expect(notified).toBe(2);
    store.setMode("view");
    store.interact(jog, { delta: 1 });
    expect(store.offset(jog.id)).toBeCloseTo(0.02);
    expect(store.offset("speed")).toBe(0);
  });

  it("starts every control at its initial value", () => {
    const { store } = setup();
    expect(store.get("speed")).toBe(1);
    expect(store.get("hue")).toBe(0);
    expect(store.get("logo")).toBe(false);
  });

  it("sends OSC to the resolved target on interaction and notifies subscribers", () => {
    const { store, sent, control } = setup();
    let notified = 0;
    store.subscribe("intensity", () => notified++);
    expect(store.interact(control("intensity"), 0.3)).toBe(true);
    expect(store.get("intensity")).toBe(0.3);
    expect(notified).toBe(1);
    expect(sent[0]!.target.port).toBe(7000);
    expect(sent[0]!.msgs[0]!.address).toBe("/wall/intensity");
  });

  it("blocks sending in view-only mode and while the studio holds control", () => {
    const { store, sent, control } = setup();
    for (const mode of ["view", "studio-has-control", "offline"] as const) {
      store.setMode(mode);
      expect(store.interact(control("flash"), { pressed: true })).toBe(false);
    }
    expect(sent).toHaveLength(0);
  });

  it("applies feedback from the installation to the right controls", () => {
    const { store } = setup();
    store.receive(message("/wall/intensity", 0.8));
    store.receive(message("/wall/mode", "react"));
    store.receive(message("/sys/fps", 59.94));
    store.receive(message("/wall/audio/level", 0.5));
    store.receive(message("/wall/logo", 1));
    expect(store.get("intensity")).toBeCloseTo(0.8);
    expect(store.get("mode")).toBe(1);
    expect(store.get("status")).toBe("59.94");
    expect(store.get("audio")).toBe(0.5);
    expect(store.get("logo")).toBe(true);
  });

  it("ignores feedback on unknown addresses", () => {
    const { store } = setup();
    expect(() => store.receive(message("/unknown", 1))).not.toThrow();
  });
});

describe("PultStore: the installation echoing our own commands", () => {
  function echoSetup(patch?: (cfg: Record<string, unknown>) => void) {
    const cfg = structuredClone(demo) as unknown as Record<string, unknown>;
    patch?.(cfg);
    const r = parseConfig(cfg);
    if (!r.ok) throw new Error("demo invalid");
    let now = 0;
    const sent: OscMessage[] = [];
    const store = new PultStore(
      r.config,
      r.config.pults[0]!,
      { send: (_t, msgs) => sent.push(...msgs) },
      { now: () => now },
    );
    const changes: unknown[] = [];
    store.onChange((_id, v) => changes.push(v));
    /** The installation echoes `m` back as real OSC: floats come back as float32. */
    const echo = (m: OscMessage) => store.receive(decodeMessage(encodeMessage(m)));
    const control = (id: string) => store.control(id)!;
    return { store, sent, changes, echo, control, advance: (ms: number) => (now += ms) };
  }

  it("an XY drag is not rewound by the late, float32 echoes of its older positions", () => {
    const { store, sent, changes, echo, control, advance } = echoSetup();
    const xy = control("position");
    const path = Array.from({ length: 20 }, (_, i) => ({ x: i / 23, y: 1 - i / 31 }));
    for (const [i, p] of path.entries()) {
      store.interact(xy, p);
      advance(33);
      if (i >= 3) echo(sent[i - 3]!); // the echo lags three messages behind
    }
    for (const m of sent.slice(-3)) echo(m);
    expect(store.get("position")).toEqual(path.at(-1));
    expect(changes).toEqual(path); // only the device's own moves, no echo in between
  });

  it("hsb colour channels and a separate feedback address are matched per channel", () => {
    const { store, sent, changes, echo, control } = echoSetup((cfg) => {
      type Raw = { pults: { pages: { controls: Record<string, unknown>[] }[] }[] };
      const lobby = (cfg as unknown as Raw).pults[0]!.pages.flatMap((p) => p.controls);
      const tint = lobby.find((c) => c.id === "tint")!;
      tint.format = "hsb";
      tint.feedback = "/wall/tint/state";
    });
    store.interact(control("tint"), "#FF8000");
    store.interact(control("tint"), "#0080FF");
    expect(sent.map((m) => m.address)).toContain("/wall/tint/h");
    for (const m of sent)
      echo({ ...m, address: m.address.replace("/wall/tint", "/wall/tint/state") });
    expect(store.get("tint")).toBe("#0080FF");
    expect(changes).toEqual(["#FF8000", "#0080FF"]);
    // The installation's own colour still applies.
    store.receive(message("/wall/tint/state/b", 0));
    expect(store.get("tint")).toBe("#000000");
  });

  it("a value that is not an echo applies even with commands in flight", () => {
    const { store, echo, sent, control } = echoSetup();
    store.interact(control("intensity"), 0.3);
    store.interact(control("intensity"), 0.4);
    store.receive(message("/wall/intensity", 0.9));
    expect(store.get("intensity")).toBe(0.9);
    // The stale echo of 0.3 does not undo it; the echo of the newest command (0.4) arriving after
    // the installation's own change means the installation applied 0.4 last.
    echo(sent[0]!);
    expect(store.get("intensity")).toBe(0.9);
    echo(sent[1]!);
    expect(store.get("intensity")).toBeCloseTo(0.4, 6);
  });

  it("forgets what it sent after the echo window", () => {
    const { store, echo, sent, control, advance } = echoSetup();
    store.interact(control("intensity"), 0.3);
    store.interact(control("intensity"), 0.4);
    advance(ECHO_WINDOW_MS + 1);
    echo(sent[0]!);
    expect(store.get("intensity")).toBeCloseTo(0.3, 6);
  });
});
