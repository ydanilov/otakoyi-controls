import { describe, expect, it } from "vitest";
import {
  brightnessGradient,
  hexToHsb,
  hsbReadout,
  hsbToHex,
  hueRingColors,
  saturationGradient,
  squarePoint,
  squareToSb,
  stripPosition,
  stripX,
  syncHsb,
  wrapDeg,
} from "./color";
import { formatDelta } from "./logic";

describe("colour picker maths", () => {
  it("converts HSB ↔ hex (Figma sample #3A4CA6 = 230°, 65 %, 65 %)", () => {
    expect(hsbToHex({ h: 230, s: 0.65, b: 0.65 })).toBe("#3A4CA6");
    const c = hexToHsb("#3A4CA6");
    expect(c.h).toBeCloseTo(230, 0);
    expect(c.s).toBeCloseTo(0.65, 2);
    expect(c.b).toBeCloseTo(0.65, 2);
    expect(hsbToHex({ h: 0, s: 1, b: 1 })).toBe("#FF0000");
    expect(hsbToHex({ h: 360, s: 1, b: 1 })).toBe("#FF0000");
    expect(hsbToHex({ h: 120, s: 0, b: 1 })).toBe("#FFFFFF");
    expect(hsbToHex({ h: 120, s: 1, b: 0 })).toBe("#000000");
  });

  it("wraps hue", () => {
    expect(wrapDeg(-30)).toBe(330);
    expect(wrapDeg(720)).toBe(0);
    expect(wrapDeg(Number.NaN)).toBe(0);
  });

  it("keeps the chosen hue / saturation when feedback is grey or black", () => {
    const cur = { h: 230, s: 0.65, b: 0.65 };
    expect(syncHsb(cur, "#3A4CA6")).toBe(cur);
    expect(syncHsb(cur, "#000000")).toEqual({ h: 230, s: 0.65, b: 0 });
    const grey = syncHsb(cur, "#808080");
    expect(grey.h).toBe(230);
    expect(grey.s).toBe(0);
    expect(syncHsb(cur, "#FF0000").h).toBe(0);
  });

  it("tints the hue ring with S and B (segment colour = hsb(segmentHue, S, B))", () => {
    const full = hueRingColors(48, 1, 1);
    expect(full).toHaveLength(48);
    expect(full[0]).toBe("#FF0000");
    expect(full[16]).toBe("#00FF00");
    const dim = hueRingColors(48, 0.65, 0.65);
    expect(dim[0]).toBe(hsbToHex({ h: 0, s: 0.65, b: 0.65 }));
    expect(hueRingColors(6, 0, 1).every((c) => c === "#FFFFFF")).toBe(true);
  });

  it("builds the saturation and brightness gradients", () => {
    expect(saturationGradient(230, 0.65)).toEqual([
      hsbToHex({ h: 230, s: 0, b: 0.65 }),
      hsbToHex({ h: 230, s: 1, b: 0.65 }),
    ]);
    expect(brightnessGradient(230, 0.65)).toEqual(["#000000", hsbToHex({ h: 230, s: 0.65, b: 1 })]);
  });

  it("maps the S × B square both ways", () => {
    expect(squarePoint(0.65, 0.65, 326, 196)).toEqual({ x: 211.9, y: 68.6 });
    const sb = squareToSb(211.9, 68.6, 326, 196);
    expect(sb.s).toBeCloseTo(0.65);
    expect(sb.b).toBeCloseTo(0.65);
    expect(squareToSb(-10, 500, 326, 196)).toEqual({ s: 0, b: 0 });
    expect(squareToSb(10, 10, 0, 0)).toEqual({ s: 0, b: 0 });
  });

  it("maps strips with the thumb kept inside", () => {
    expect(stripX(0, 326, 28)).toBe(14);
    expect(stripX(1, 326, 28)).toBe(312);
    expect(stripPosition(14, 326, 28)).toBe(0);
    expect(stripPosition(312, 326, 28)).toBe(1);
    expect(stripPosition(163, 326, 28)).toBeCloseTo(0.5);
  });

  it("formats the readout", () => {
    expect(hsbReadout({ h: 230.4, s: 0.65, b: 0.649 })).toEqual({ h: "230°", s: "65%", b: "65%" });
    expect(hsbReadout({ h: 359.8, s: 1, b: 1 }).h).toBe("0°");
  });
});

describe("relative indicator", () => {
  it("shows a signed change", () => {
    expect(formatDelta(12)).toBe("+12");
    expect(formatDelta(0.02)).toBe("+0.02");
    expect(formatDelta(-0.5)).toBe("−0.50");
    expect(formatDelta(0)).toBe("0");
    expect(formatDelta(3, { unit: "°" })).toBe("+3°");
  });
});
