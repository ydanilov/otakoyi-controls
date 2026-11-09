import { describe, expect, it } from "vitest";
import {
  METER_PEAK_HOLD_MS,
  METER_SEGMENTS,
  NO_PEAK,
  meterSegments,
  meterZones,
  segmentZone,
  stepPeak,
} from "./meter";

const zones = { warn: 0.7, critical: 0.9 };

describe("meter", () => {
  it("has 24 segments in three zones", () => {
    const s = meterSegments(0, zones);
    expect(s).toHaveLength(METER_SEGMENTS);
    expect(s.filter((x) => x.zone === "signal")).toHaveLength(16);
    expect(s.filter((x) => x.zone === "warning")).toHaveLength(5);
    expect(s.filter((x) => x.zone === "critical")).toHaveLength(3);
    expect(segmentZone(0, 24, zones)).toBe("signal");
    expect(segmentZone(23, 24, zones)).toBe("critical");
  });

  it("lights segments up to the level and glows the top three", () => {
    const s = meterSegments(0.45, zones);
    expect(s.filter((x) => x.lit)).toHaveLength(11);
    expect(s.filter((x) => x.glow).map((x) => x.index)).toEqual([8, 9, 10]);
    expect(meterSegments(0.97, zones).filter((x) => x.lit)).toHaveLength(23);
    expect(meterSegments(2, zones).every((x) => x.lit)).toBe(true);
    expect(meterSegments(Number.NaN, zones).some((x) => x.lit)).toBe(false);
  });

  it("uses warnAt / criticalAt when set", () => {
    expect(meterZones({ min: 0, max: 1 })).toEqual({ warn: 0.7, critical: 0.9 });
    expect(meterZones({ min: 0, max: 100, warnAt: 50, criticalAt: 80 })).toEqual({
      warn: 0.5,
      critical: 0.8,
    });
  });

  it("holds the peak 1.5 s, then lets it fall", () => {
    let p = stepPeak(NO_PEAK, 0.9, 1000);
    expect(p.peak).toBe(0.9);
    p = stepPeak(p, 0.3, 1000 + METER_PEAK_HOLD_MS);
    expect(p.peak).toBe(0.9);
    const later = stepPeak(p, 0.3, 1000 + METER_PEAK_HOLD_MS + 500);
    expect(later.peak).toBeCloseTo(0.6);
    // Steps do not compound the fall.
    const again = stepPeak(later, 0.3, 1000 + METER_PEAK_HOLD_MS + 500);
    expect(again.peak).toBeCloseTo(0.6);
    expect(stepPeak(later, 0.3, 1000 + METER_PEAK_HOLD_MS + 5000).peak).toBe(0.3);
    expect(stepPeak(later, 0.95, 9000)).toEqual({ peak: 0.95, top: 0.95, at: 9000 });
  });
});
