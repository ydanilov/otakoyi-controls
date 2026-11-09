import { describe, expect, it } from "vitest";
import { parseConfig, type Control } from "@osc/schema";
import demo from "../../schema/examples/demo-installation.json";
import { coerceValue } from "./coerce";

const r = parseConfig(demo);
if (!r.ok) throw new Error("demo invalid");
const all = r.config.pults.flatMap((p) => p.pages.flatMap((g) => g.controls)) as Control[];
const c = (id: string) => all.find((x) => x.id === id)!;

describe("coerceValue", () => {
  it("clamps numbers into range and rejects non-numbers", () => {
    expect(coerceValue(c("intensity"), 7)).toBe(1);
    expect(coerceValue(c("intensity"), -1)).toBe(0);
    expect(coerceValue(c("intensity"), "1")).toBeUndefined();
    expect(coerceValue(c("intensity"), Number.NaN)).toBeUndefined();
  });
  it("accepts only known scenes, options and grid cells", () => {
    expect(coerceValue(c("scene"), "day")).toBe("day");
    expect(coerceValue(c("scene"), "nope")).toBeUndefined();
    expect(coerceValue(c("mode"), 2)).toBe(2);
    expect(coerceValue(c("mode"), 3)).toBeUndefined();
    expect(coerceValue(c("pads"), { cell: 11, on: true })).toEqual({ cell: 11, on: true });
    expect(coerceValue(c("pads"), { cell: 12, on: true })).toBeUndefined();
  });
  it("never lets a device drive a display-only control", () => {
    expect(coerceValue(c("audio"), 0.5)).toBeUndefined();
    expect(coerceValue(c("status"), "hi")).toBeUndefined();
  });
  it("only confirms hold-to-confirm with true and validates colours", () => {
    expect(coerceValue(c("blackout"), true)).toBe(true);
    expect(coerceValue(c("blackout"), 1)).toBeUndefined();
    expect(coerceValue(c("tint"), "#c6ff3d")).toBe("#C6FF3D");
    expect(coerceValue(c("tint"), "red")).toBeUndefined();
  });
});
