import { describe, expect, it } from "vitest";
import { message, type OscMessage } from "@osc/core";
import { parseConfig, ColorPicker, type ControlOf, type InstallationConfig } from "@osc/schema";
import { applyHsbFeedback, colorFromArgs } from "./color";
import { hsbMessages, hsbWire, messagesFor } from "./logic";
import { PultStore } from "./store";

const picker = (props: Record<string, unknown> = {}): ControlOf<"colorPicker"> =>
  ColorPicker.parse({ id: "c", type: "colorPicker", address: "/light/color", ...props });

const wire = (msgs: OscMessage[]) =>
  msgs.map((m) => [m.address, ...m.args.map((a) => ("value" in a ? a.value : null))]);

describe("colour over OSC: hsb (default) — three addresses", () => {
  it("is the default format, hue in degrees", () => {
    const c = picker();
    expect(c.format).toBe("hsb");
    expect(c.hueRange).toBe("degrees");
    expect(wire(messagesFor(c, "#FF0000"))).toEqual([
      ["/light/color/h", 0],
      ["/light/color/s", 1],
      ["/light/color/b", 1],
    ]);
  });

  it("sends only the channels that changed since the previous value", () => {
    const c = picker();
    // #FF0000 → #800000: brightness only.
    expect(wire(messagesFor(c, "#800000", "#FF0000"))).toEqual([["/light/color/b", 0.501961]]);
    // Same hue and brightness, less saturation.
    expect(wire(messagesFor(c, "#FF8080", "#FF0000"))).toEqual([["/light/color/s", 0.498039]]);
    // Hue only.
    expect(wire(messagesFor(c, "#00FF00", "#FF0000"))).toEqual([["/light/color/h", 120]]);
    // Nothing changed: nothing sent.
    expect(messagesFor(c, "#FF0000", "#FF0000")).toEqual([]);
  });

  it("never sends an undefined channel (grey has no hue, black no saturation)", () => {
    const c = picker();
    expect(wire(messagesFor(c, "#808080"))).toEqual([
      ["/light/color/s", 0],
      ["/light/color/b", 0.501961],
    ]);
    expect(wire(messagesFor(c, "#000000"))).toEqual([["/light/color/b", 0]]);
    expect(hsbWire("#000000")).toEqual({ b: 0 });
  });

  it("sends a channel again once it is defined after a grey or black", () => {
    const c = picker();
    // Grey → red: hue was undefined, so it is sent even though it is 0.
    expect(wire(messagesFor(c, "#FF0000", "#808080"))).toEqual([
      ["/light/color/h", 0],
      ["/light/color/s", 1],
      ["/light/color/b", 1],
    ]);
    // Black → grey: saturation becomes defined (0) and is sent.
    expect(wire(messagesFor(c, "#808080", "#000000"))).toEqual([
      ["/light/color/s", 0],
      ["/light/color/b", 0.501961],
    ]);
  });

  it("hueRange unit sends hue 0..1", () => {
    const c = picker({ hueRange: "unit" });
    expect(wire(hsbMessages(c, "#00FF00"))[0]).toEqual(["/light/color/h", 0.333333]);
  });

  it("keeps the single-message formats as an explicit opt-in", () => {
    expect(wire(messagesFor(picker({ format: "hsvFloat" }), "#00FF00"))).toEqual([
      ["/light/color", 0.333333, 1, 1],
    ]);
    expect(wire(messagesFor(picker({ format: "rgbInt" }), "#00FF00"))).toEqual([
      ["/light/color", 0, 255, 0],
    ]);
    expect(wire(messagesFor(picker({ format: "hex" }), "#00ff00"))).toEqual([
      ["/light/color", "#00FF00"],
    ]);
  });
});

describe("colour feedback", () => {
  it("applies one channel at a time", () => {
    expect(applyHsbFeedback(undefined, "#FF0000", "h", 120)).toEqual({ h: 120, s: 1, b: 1 });
    expect(applyHsbFeedback(undefined, "#FF0000", "h", 0.5, "unit")).toEqual({
      h: 180,
      s: 1,
      b: 1,
    });
    expect(applyHsbFeedback(undefined, "#FF0000", "s", 2)).toEqual({ h: 0, s: 1, b: 1 });
    expect(applyHsbFeedback(undefined, "#FF0000", "b", "x")).toBeUndefined();
  });

  it("reads single-message echoes in their own format", () => {
    expect(colorFromArgs("rgbFloat", [0, 1, 0])).toBe("#00FF00");
    expect(colorFromArgs("rgbInt", [0, 255, 0])).toBe("#00FF00");
    expect(colorFromArgs("hsvFloat", [1 / 3, 1, 1])).toBe("#00FF00");
    expect(colorFromArgs("hex", ["#00ff00"])).toBe("#00FF00");
    expect(colorFromArgs("rgbFloat", [0, 1])).toBeUndefined();
  });
});

function store(props: Record<string, unknown> = {}) {
  const r = parseConfig({
    schemaVersion: 2,
    installation: { id: "t", name: "T", revision: 1 },
    targets: [{ id: "td", name: "TD", host: "127.0.0.1", port: 7000, feedbackPort: 9000 }],
    pults: [
      {
        id: "p",
        name: "P",
        pages: [
          {
            id: "pg",
            title: "Pg",
            controls: [
              {
                id: "c",
                type: "colorPicker",
                label: "Colour",
                address: "/light/color",
                default: "#FF0000",
                ...props,
              },
            ],
            layout: {
              phone: { c: { x: 0, y: 0, w: 12, h: 4 } },
              tablet: { c: { x: 0, y: 0, w: 12, h: 4 } },
            },
          },
        ],
      },
    ],
  });
  if (!r.ok) throw new Error(JSON.stringify(r));
  const cfg: InstallationConfig = r.config;
  const sent: OscMessage[][] = [];
  const s = new PultStore(cfg, cfg.pults[0]!, { send: (_t, m) => sent.push(m) });
  return { s, sent, c: s.control("c")! };
}

describe("PultStore with an hsb colour picker", () => {
  it("sends only what changed since the value it held", () => {
    const { s, sent, c } = store();
    s.interact(c, "#800000");
    s.interact(c, "#800000");
    s.interact(c, "#008000");
    expect(sent.map(wire)).toEqual([[["/light/color/b", 0.501961]], [["/light/color/h", 120]]]);
  });

  it("accepts feedback per channel and keeps a hue that arrives while the colour is grey", () => {
    const { s } = store({ default: "#808080" });
    s.receive(message("/light/color/h", 240));
    expect(s.get("c")).toBe("#808080"); // still grey: no hue to show yet
    s.receive(message("/light/color/s", 1));
    expect(s.get("c")).toBe("#000080"); // the hue from before, not red
    s.receive(message("/light/color/b", 1));
    expect(s.get("c")).toBe("#0000FF");
    s.receive(message("/light/color", 1, 0, 0)); // not this format's address
    expect(s.get("c")).toBe("#0000FF");
  });

  it("listens on <feedback>/h|s|b when a feedback address is set", () => {
    const { s } = store({ feedback: "/fb/color" });
    s.receive(message("/fb/color/h", 120));
    expect(s.get("c")).toBe("#00FF00");
  });

  it("single-message formats take their echo on the control's address", () => {
    const { s, sent, c } = store({ format: "rgbFloat" });
    s.interact(c, "#00FF00");
    expect(sent.map(wire)).toEqual([[["/light/color", 0, 1, 0]]]);
    s.receive(message("/light/color", 0, 0, 1));
    expect(s.get("c")).toBe("#0000FF");
  });
});
