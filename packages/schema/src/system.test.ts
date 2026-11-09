import { describe, expect, it } from "vitest";
import demo from "../examples/demo-installation.json";
import { allPults, parseConfig, SYSTEM_ADDRESSES, systemPresetOf, systemPult } from "./index";

const withSystem = (system: unknown, extra: Record<string, unknown> = {}) =>
  parseConfig({ ...demo, ...extra, system });

describe("System screen (ADR-018)", () => {
  it("is off unless the config has `system`", () => {
    const { system: _s, ...plain } = demo as Record<string, unknown>;
    const r = parseConfig(plain);
    if (!r.ok) throw new Error("demo");
    expect(systemPult(r.config)).toBeUndefined();
    expect(allPults(r.config)).toBe(r.config.pults);
  });

  it("becomes a hidden pult with the four standard controls on the default addresses", () => {
    const r = withSystem({});
    if (!r.ok) throw new Error(JSON.stringify(r));
    const p = systemPult(r.config)!;
    expect(p.id).toBe("system");
    const cs = p.pages[0]!.controls;
    expect(cs.map((c) => c.id)).toEqual(["resw", "resh", "debug", "seed"]);
    expect(cs.map((c) => ("address" in c ? c.address : null))).toEqual(
      Object.values(SYSTEM_ADDRESSES),
    );
    expect(cs[0]).toMatchObject({ type: "fader", int: true, min: 16, max: 16384, default: 1920 });
    expect(allPults(r.config).at(-1)).toEqual(p);
    expect(r.config.pults.some((x) => x.id === "system")).toBe(false);
  });

  it("reserves the pult id and checks the target", () => {
    const r = parseConfig({
      ...demo,
      system: { target: "nope" },
      pults: [{ ...(demo as { pults: object[] }).pults[0], id: "system" }],
    });
    expect(r.ok).toBe(false);
    if (r.ok || r.reason !== "invalid") return;
    const msgs = r.issues.map((i) => i.message);
    expect(msgs).toContain('Pult id "system" is reserved for the System screen');
    expect(msgs).toContain('Unknown target "nope"');
  });

  it("names the matching size preset", () => {
    expect(systemPresetOf(1280, 1280)).toBe("1280 × 1280");
    expect(systemPresetOf(1280, 720)).toBeUndefined();
    expect(systemPresetOf(undefined, 1080)).toBeUndefined();
  });
});
