import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { brandDriftFromFigma, brandFromFigma, type FigmaBrandModes } from "./figma";
import { baseTokens, createTheme } from "./theme";

const figma = JSON.parse(
  readFileSync(new URL("../figma/brand-modes.json", import.meta.url), "utf8"),
) as FigmaBrandModes;

describe("Figma Brand modes", () => {
  it("tokens.json brandDefaults = the Otakoyi mode, every mode a valid brand", () => {
    expect(brandDriftFromFigma(figma, baseTokens.brandDefaults as Record<string, string>)).toEqual(
      [],
    );
  });

  it("reports drift", () => {
    const changed = structuredClone(figma);
    changed.modes.Otakoyi!["brand/primary"] = "#00FF00";
    expect(
      brandDriftFromFigma(changed, baseTokens.brandDefaults as Record<string, string>)[0],
    ).toMatch(/brand\/primary is #00FF00/);
  });

  it("maps a mode to the config theme; the Aurora mode recolours the theme", () => {
    const { theme, unknown, dropped } = brandFromFigma(figma.modes["Aurora · Template"]!);
    expect(unknown).toEqual([]);
    expect(dropped).toEqual([]);
    expect(theme).toMatchObject({ primary: "#5CE6C8", accent: "#B7A6FF", onAccent: "#0D0A1A" });
    const dark = createTheme(theme);
    expect(dark.color.primary).toBe("#5CE6C8");
    expect(dark.color.primaryPressed).toBe("#3BBFA3");
    expect(dark.color.primarySubtle).toBe("#132723");
    expect(dark.control.fill).toBe("#5CE6C8");
    const light = createTheme({ ...theme, mode: "light" });
    expect(light.control.fill).toBe("#1F8C75");
  });

  it("drops a signal-light colour that is too pale and derives it", () => {
    const { theme, dropped } = brandFromFigma({
      "brand/primary": "#5CE6C8",
      "brand/primary-signal-light": "#AAF0E0",
    });
    expect(theme.primarySignalLight).toBeUndefined();
    expect(dropped[0]).toMatch(/needs 3:1/);
  });
});
