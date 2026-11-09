import { baseTokens } from "@osc/tokens";
import { describe, expect, it } from "vitest";
import {
  innerLightCenter,
  innerLightRadius,
  pinMatches,
  pinPoint,
  touchLightAllowed,
  touchLightMotion,
  touchLightSize,
} from "./touchLight";

const tk = baseTokens.touchLight;

describe("touch light", () => {
  it("is white only, subtle: halo 7 %, core 12 %, inner 16 %", () => {
    expect(tk.color).toBe("#FFFFFF");
    expect(tk.haloOpacity).toBe(0.07);
    expect(tk.coreOpacity).toBe(0.12);
    expect(tk.innerOpacity).toBe(0.16);
  });

  it("sizes a pad's halo (Figma: 112 on a 150 pad) and the core at half of it", () => {
    expect(touchLightSize(150, tk).halo).toBeCloseTo(112, 0);
    expect(touchLightSize(150, tk).core).toBeCloseTo(56, 0);
    // A wide surface (XY pad, block button) keeps a fingertip-sized light.
    expect(touchLightSize(2000, tk).halo).toBe(tk.haloMax);
  });

  it("has no size for an unmeasured surface", () => {
    expect(touchLightSize(0, tk)).toEqual({ halo: 0, core: 0 });
    expect(touchLightSize(Number.NaN, tk).halo).toBe(0);
  });

  it("is never shown when disabled or view-only", () => {
    expect(touchLightAllowed(true)).toBe(false);
    expect(touchLightAllowed(false)).toBe(true);
    expect(touchLightAllowed(undefined)).toBe(true);
  });

  it("blooms in 120 ms with scale 0.6 → 1 and fades out in 260 ms", () => {
    expect(touchLightMotion(false, tk)).toEqual({ fromScale: 0.6, inMs: 120, outMs: 260 });
  });

  it("drops the scale under Reduce Motion but keeps the fade", () => {
    expect(touchLightMotion(true, tk)).toEqual({ fromScale: 1, inMs: 120, outMs: 260 });
  });

  it("starts the inner light under the finger, kept inside the element", () => {
    const thumb = { kind: "rect", x: 156, y: 4, width: 40, height: 48 } as const;
    expect(innerLightCenter({ x: 170, y: 20 }, thumb)).toEqual({ x: 170, y: 20 });
    // Finger slid past the thumb: the light stays on its edge.
    expect(innerLightCenter({ x: 260, y: -40 }, thumb)).toEqual({ x: 196, y: 4 });
    const disc = { kind: "circle", cx: 80, cy: 80, r: 48 } as const;
    expect(innerLightCenter({ x: 90, y: 80 }, disc)).toEqual({ x: 90, y: 80 });
    const far = innerLightCenter({ x: 80, y: 0 }, disc);
    expect(far.x).toBeCloseTo(80);
    expect(far.y).toBeCloseTo(32);
    expect(innerLightCenter({ x: 80, y: 80 }, disc)).toEqual({ x: 80, y: 80 });
    expect(innerLightRadius(disc)).toBe(48);
    expect(innerLightRadius(thumb)).toBe(24);
  });

  it("pins at a fraction of the surface, per cell", () => {
    expect(pinPoint({ x: 0.5, y: 0.25 }, 200, 80)).toEqual({ x: 100, y: 20 });
    expect(pinPoint({ x: 2, y: -1 }, 200, 80)).toEqual({ x: 200, y: 0 });
    expect(pinMatches({ x: 0.5, y: 0.5 })).toBe(true);
    expect(pinMatches({ x: 0.5, y: 0.5 }, 1)).toBe(false);
    expect(pinMatches({ x: 0.5, y: 0.5, index: 1 }, 1)).toBe(true);
    expect(pinMatches(null)).toBe(false);
  });
});
