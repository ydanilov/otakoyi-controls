import { describe, expect, it } from "vitest";
import { dragShift, dragTargetIndex, movePreset } from "./prompt";
import {
  FINE_SPREAD,
  GLOW_ACTIVE,
  GLOW_REST,
  fineBadge,
  glowLevel,
  spreadDialTicks,
  spreadTicks,
} from "./states";

describe("control states: active / rest glow", () => {
  it("rest glow is 35–45 % of the active glow", () => {
    expect(GLOW_REST / GLOW_ACTIVE).toBeGreaterThanOrEqual(0.35);
    expect(GLOW_REST / GLOW_ACTIVE).toBeLessThanOrEqual(0.45);
  });
  it("active = full glow; a lit value at rest glows less; an unlit one not at all", () => {
    expect(glowLevel(true)).toBe(GLOW_ACTIVE);
    expect(glowLevel(false)).toBe(GLOW_REST);
    expect(glowLevel(false, false)).toBe(0);
    expect(glowLevel(true, false)).toBe(GLOW_ACTIVE);
  });
});

describe("fine mode", () => {
  it("the badge shows the coefficient from fineFactor", () => {
    expect(fineBadge(0.2)).toBe("×0.2");
    expect(fineBadge(0.25)).toBe("×0.25");
    expect(fineBadge(0.1)).toBe("×0.1");
    expect(fineBadge(1 / 3)).toBe("×0.333");
    expect(fineBadge(NaN)).toBe("×0.2");
  });

  it("ticks spread ×1.8 around the thumb and the far ones drop off the track", () => {
    const rest = spreadTicks(11, 0.5, 1);
    expect(rest).toHaveLength(11);
    expect(rest[0]).toBeCloseTo(0);
    expect(rest[10]).toBeCloseTo(1);
    const fine = spreadTicks(11, 0.5, FINE_SPREAD);
    // Neighbours of the thumb are 1.8× further apart…
    const near = fine.filter((p) => Math.abs(p - 0.5) < 0.2).sort();
    expect(near[1]! - near[0]!).toBeCloseTo(0.1 * FINE_SPREAD);
    // …and fewer ticks fit on the track.
    expect(fine.length).toBeLessThan(rest.length);
    expect(fine.every((p) => p >= 0 && p <= 1)).toBe(true);
    // The tick under the thumb stays put.
    expect(fine).toContainEqual(0.5);
  });

  it("an endless pattern (jog ribs) shifts with the phase and still spreads around the centre", () => {
    const a = spreadTicks(5, 0.5, 1, 0.05);
    expect(a[0]).toBeCloseTo(0.05);
    const b = spreadTicks(5, 0.5, FINE_SPREAD, 0);
    expect(b).toContainEqual(0.5);
    expect(b.sort()[1]! - b.sort()[0]!).toBeCloseTo(0.25 * FINE_SPREAD);
  });

  it("dial ticks spread around the needle, within the travel; an endless ring keeps turning", () => {
    const rest = spreadDialTicks(9, -120, 240, 0, 1);
    expect(rest).toHaveLength(9);
    expect(rest[0]).toBeCloseTo(-120);
    const fine = spreadDialTicks(9, -120, 240, 0, FINE_SPREAD);
    expect(fine).toContainEqual(0);
    expect(fine.every((a) => a >= -120 && a <= 120)).toBe(true);
    expect(fine.length).toBeLessThan(9);
    const ring = spreadDialTicks(12, 0, 360, 0, 1, 15);
    expect(ring).toHaveLength(12);
    expect(ring).toContainEqual(15);
    expect(spreadDialTicks(12, 0, 360, 0, FINE_SPREAD).length).toBeLessThan(12);
  });
});

describe("drag to reorder prompts", () => {
  it("lands one place over once dragged past half a slot, clamped to the list", () => {
    expect(dragTargetIndex(1, 40, 100, 4)).toBe(1);
    expect(dragTargetIndex(1, 60, 100, 4)).toBe(2);
    expect(dragTargetIndex(1, -160, 100, 4)).toBe(0);
    expect(dragTargetIndex(1, 1000, 100, 4)).toBe(3);
  });
  it("cards between from and to shift by one slot to make room", () => {
    expect([0, 1, 2, 3].map((i) => dragShift(i, 0, 2))).toEqual([0, -1, -1, 0]);
    expect([0, 1, 2, 3].map((i) => dragShift(i, 3, 1))).toEqual([0, 1, 1, 0]);
    expect(movePreset(["a", "b", "c", "d"], "a", 2)).toEqual(["b", "c", "a", "d"]);
  });
});
