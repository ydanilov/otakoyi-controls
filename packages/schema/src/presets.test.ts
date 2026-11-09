import { describe, expect, it } from "vitest";
import demo from "../examples/demo-installation.json";
import { BUILTIN_PRESETS, Control, parseConfig } from "./index";

const clone = <T>(v: T): T => structuredClone(v);
const first = (cfg: any) => cfg.pults[0].pages[0].controls;

describe("built-in presets", () => {
  it("every built-in preset produces a valid control of its type", () => {
    const needs: Record<string, object> = {
      segmented: {
        options: [
          { label: "A", value: 1 },
          { label: "B", value: 2 },
        ],
      },
      buttonGrid: { rows: 2, cols: 2, address: "/pad/{index}" },
      sceneList: { scenes: [{ id: "a", label: "A", value: 1 }] },
      meter: { feedback: "/level" },
      buttonGroup: { buttons: [{ id: "a", label: "A", address: "/a" }] },
    };
    for (const p of BUILTIN_PRESETS) {
      const control = {
        id: "c",
        address: "/x",
        ...needs[p.type],
        ...p.props,
        type: p.type,
      };
      const r = Control.safeParse(control);
      expect(r.success, `${p.id}: ${JSON.stringify(r.error?.issues)}`).toBe(true);
    }
  });

  it("ids are unique and namespaced by type", () => {
    const ids = BUILTIN_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of BUILTIN_PRESETS) expect(p.id.startsWith(p.type + "/")).toBe(true);
  });
});

describe("resolving presets in a config", () => {
  it("applies a built-in preset; explicit fields win; type can be omitted", () => {
    const cfg = clone(demo) as any;
    first(cfg)[0] = {
      id: "intensity",
      preset: "fader/brightness",
      address: "/wall/dim",
      default: 0.5,
    };
    const r = parseConfig(cfg);
    if (!r.ok) throw new Error(JSON.stringify(r));
    expect(r.config.pults[0]!.pages[0]!.controls[0]).toMatchObject({
      type: "fader",
      preset: "fader/brightness",
      curve: "log",
      default: 0.5,
      response: "relative",
    });
  });

  it("applies a custom studio preset published with the config", () => {
    const cfg = clone(demo) as any;
    cfg.presets.push({
      id: "acme-glow",
      type: "knob",
      label: "Acme glow",
      props: { min: 0, max: 10, unit: "lx", default: 3 },
    });
    first(cfg)[3] = {
      id: "hue",
      preset: "acme-glow",
      address: "/wall/glow",
    };
    const r = parseConfig(cfg);
    if (!r.ok) throw new Error(JSON.stringify(r));
    expect(r.config.pults[0]!.pages[0]!.controls[3]).toMatchObject({
      type: "knob",
      max: 10,
      unit: "lx",
      default: 3,
    });
    expect(r.config.presets.map((p) => p.id)).toEqual(["acme-speed", "acme-glow"]);
  });

  it("reports unknown presets, type mismatches and clashing ids", () => {
    const cfg = clone(demo) as any;
    cfg.presets = [{ id: "fader/brightness", type: "fader", label: "Mine", props: {} }];
    first(cfg)[0].preset = "nope";
    first(cfg)[1].preset = "knob/hue"; // control is a fader
    const r = parseConfig(cfg);
    expect(r.ok).toBe(false);
    if (r.ok || r.reason !== "invalid") return;
    const msgs = r.issues.map((i) => i.message).join("\n");
    expect(msgs).toMatch(/Unknown preset "nope"/);
    expect(msgs).toMatch(/is for knob, not fader/);
    expect(msgs).toMatch(/built-in preset id/);
  });
});
