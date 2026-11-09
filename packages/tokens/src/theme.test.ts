import { describe, expect, it } from "vitest";
import { contrast, mix, parseHex, toHex } from "./color";
import { CONTRAST_TEXT, SIGNAL_CONTRAST, checkBrand, createTheme, themeToCssVars } from "./theme";

describe("color helpers", () => {
  it("round-trips hex", () => {
    expect(toHex(parseHex("#c6ff3d"))).toBe("#C6FF3D");
    expect(toHex(parseHex("#000000B3"))).toBe("#000000B3");
  });
  it("computes WCAG contrast", () => {
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrast("#777777", "#777777")).toBeCloseTo(1, 5);
  });
  it("mixes endpoints exactly", () => {
    expect(mix("#112233", "#AABBCC", 0)).toBe("#112233");
    expect(mix("#112233", "#AABBCC", 1)).toBe("#AABBCC");
  });
});

describe("createTheme", () => {
  it("is deterministic", () => {
    expect(createTheme({ primary: "#FF3366" })).toEqual(createTheme({ primary: "#FF3366" }));
  });

  it("applies the brand and derives on-colours with readable contrast", () => {
    for (const primary of ["#C6FF3D", "#1D4ED8", "#FF3366", "#111111", "#FFE600"]) {
      const t = createTheme({ primary, mode: "light" });
      expect(t.color.primary).toBe(primary);
      expect(contrast(t.control.fill, t.color.background)).toBeGreaterThanOrEqual(SIGNAL_CONTRAST);
      expect(contrast(t.color.onPrimary, primary)).toBeGreaterThanOrEqual(CONTRAST_TEXT);
    }
  });

  it("never lets a brand override status colours", () => {
    const t = createTheme({ primary: "#EF4444", accent: "#22C55E" });
    expect(t.status.critical).toBe("#FF4D5E");
    expect(t.status.online).toBe("#5CF27A");
    expect(Object.keys(t.status).sort()).toEqual([
      "critical",
      "offline",
      "online",
      "studio",
      "warning",
    ]);
  });

  it("switches neutrals with mode", () => {
    expect(createTheme({ mode: "dark" }).color.background).toBe("#22252C");
    expect(createTheme({ mode: "light" }).color.background).toBe("#E4E8EE");
  });

  it("exposes shadcn-named CSS vars", () => {
    const vars = themeToCssVars(createTheme({ primary: "#1D4ED8" }));
    expect(vars["--primary"]).toBe("29 78 216");
    expect(vars["--radius"]).toBe("12px");
    expect(vars["--accent"]).not.toBe(vars["--brand-accent"]); // shadcn accent stays a neutral surface
  });
});

describe("checkBrand", () => {
  it("passes the studio default", () => {
    expect(checkBrand({}).filter((i) => i.level === "error")).toEqual([]);
  });
  it("blocks invalid hex", () => {
    expect(checkBrand({ primary: "red" })[0]).toMatchObject({ level: "error", token: "primary" });
  });
  it("blocks a primary invisible on the background", () => {
    const issues = checkBrand({ primary: "#141416", mode: "dark" });
    expect(issues.some((i) => i.level === "error" && i.token === "primary")).toBe(true);
  });
  it("errors on an explicit onPrimary that is unreadable", () => {
    const issues = checkBrand({ primary: "#C6FF3D", onPrimary: "#FFFFFF" });
    expect(issues.some((i) => i.level === "error" && i.token === "onPrimary")).toBe(true);
  });
  it("warns when primary looks like a status colour", () => {
    const issues = checkBrand({ primary: "#EF4444" });
    expect(issues.some((i) => i.level === "warning" && i.message.includes("critical"))).toBe(true);
  });
});
