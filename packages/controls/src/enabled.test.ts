import { describe, expect, it } from "vitest";
import { parseConfig, type Control } from "@osc/schema";
import { conditionHolds, isEnabled } from "./enabled";

const cell = (y: number) => ({ x: 0, y, w: 12, h: 1 });
const cfg = parseConfig({
  schemaVersion: 2,
  installation: { id: "t", name: "T", revision: 1 },
  targets: [{ id: "td", name: "TD", protocol: "udp", host: "auto", port: 7000 }],
  pults: [
    {
      id: "p",
      name: "P",
      pages: [
        {
          id: "a",
          title: "A",
          controls: [
            { id: "audio", type: "toggle", address: "/audio" },
            {
              id: "mode",
              type: "segmented",
              address: "/mode",
              options: [
                { label: "React", value: "react" },
                { label: "Day", value: "day" },
              ],
            },
            {
              id: "layers",
              type: "buttonGroup",
              buttons: [{ id: "logo", label: "Logo", address: "/logo" }],
            },
            {
              id: "gain",
              type: "knob",
              address: "/gain",
              enabledWhen: [{ control: "audio", equals: 1 }],
            },
          ],
          layout: {
            phone: { audio: cell(0), mode: cell(1), layers: cell(2), gain: cell(3) },
            tablet: { audio: cell(0), mode: cell(1), layers: cell(2), gain: cell(3) },
          },
        },
      ],
    },
  ],
});
if (!cfg.ok) throw new Error("test config invalid");
const controls = cfg.config.pults[0]!.pages[0]!.controls as Control[];
const get = (id: string) => controls.find((c) => c.id === id);

describe("enabledWhen", () => {
  it("compares a toggle by on / off", () => {
    expect(conditionHolds(get("audio"), true, 1)).toBe(true);
    expect(conditionHolds(get("audio"), false, 1)).toBe(false);
    expect(conditionHolds(get("audio"), false, 0)).toBe(true);
    expect(conditionHolds(get("audio"), true, "on")).toBe(true);
    expect(conditionHolds(get("audio"), true, false)).toBe(false);
  });
  it("compares a segmented by the selected option's value or label", () => {
    expect(conditionHolds(get("mode"), 0, "react")).toBe(true);
    expect(conditionHolds(get("mode"), 1, "Day")).toBe(true);
    expect(conditionHolds(get("mode"), 1, "react")).toBe(false);
    expect(conditionHolds(get("mode"), null, "react")).toBe(false);
  });
  it("compares a button group by its lit buttons, numbers by value", () => {
    expect(conditionHolds(get("layers"), { on: ["logo"] }, "logo")).toBe(true);
    expect(conditionHolds(get("layers"), { on: [] }, "logo")).toBe(false);
    expect(conditionHolds(get("gain"), 0.5, 0.5)).toBe(true);
    expect(conditionHolds(get("gain"), 0.4, 0.5)).toBe(false);
  });
  it("needs every condition; unknown controls never lock", () => {
    const values: Record<string, unknown> = { audio: true, mode: 0 };
    const lookup = (id: string) => ({ control: get(id), value: (values[id] ?? null) as never });
    expect(isEnabled(undefined, lookup)).toBe(true);
    expect(isEnabled(get("gain")!.enabledWhen, lookup)).toBe(true);
    values.audio = false;
    expect(isEnabled(get("gain")!.enabledWhen, lookup)).toBe(false);
    expect(isEnabled([{ control: "nope", equals: 1 }], lookup)).toBe(true);
    const both = [
      { control: "audio", equals: 0 },
      { control: "mode", equals: "day" },
    ];
    expect(isEnabled(both, lookup)).toBe(false);
  });
});
