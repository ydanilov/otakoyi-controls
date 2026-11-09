import { brandFromFigma, type BrandInput, type FigmaBrandModes } from "@osc/tokens";
import figmaBrands from "@osc/tokens/figma/brand-modes.json";

/**
 * Brands of Storybook's Brand switcher: every mode of the Figma `Brand` variable collection (one
 * per client — `packages/tokens/figma/brand-modes.json`, the same colours the exporter writes into
 * a client's config `theme`), then the two sample clients of the app's `/gallery` screen. The mode
 * (dark / light) is a separate toggle.
 */
const fromFigma = Object.fromEntries(
  Object.entries((figmaBrands as FigmaBrandModes).modes).map(([name, vars]) => [
    name
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    {
      name: name === (figmaBrands as FigmaBrandModes).defaultMode ? `${name} (default)` : name,
      brand: brandFromFigma(vars).theme as BrandInput,
    },
  ]),
) as Record<string, { name: string; brand: BrandInput }>;

export const STORY_BRANDS: Record<string, { name: string; brand: BrandInput }> = {
  ...fromFigma,
  clientA: { name: "Sample · orange", brand: { primary: "#FF5A1F", accent: "#FFD23F" } },
  clientB: { name: "Sample · blue", brand: { primary: "#3D5AFE", accent: "#00BFA5" } },
};

export type StoryBrandId = string;
