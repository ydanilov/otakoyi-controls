import { contrast } from "./color";
import { SIGNAL_CONTRAST, checkBrand, createTheme, type BrandInput } from "./theme";

/** Figma Brand collection variable → config `theme` key (ADR-014). */
export const FIGMA_BRAND_VARS = {
  "brand/primary": "primary",
  "brand/on-primary": "onPrimary",
  "brand/primary-pressed": "primaryPressed",
  "brand/primary-subtle": "primarySubtle",
  "brand/accent": "accent",
  "brand/on-accent": "onAccent",
  "brand/primary-signal-light": "primarySignalLight",
} as const satisfies Record<string, keyof BrandInput>;

/** Variables of one Figma Brand mode (`brand/*` → hex), as the Inspector's snapshot holds them. */
export type FigmaBrandMode = Record<string, string>;

export interface FigmaBrandModes {
  collection: string;
  defaultMode: string;
  modes: Record<string, FigmaBrandMode>;
}

/**
 * A Figma Brand mode → the config's `theme` colours. `primary-signal-light` is kept only when it
 * reaches SIGNAL_CONTRAST (3:1) on the light background — like createTheme(), which otherwise
 * derives it; `dropped` lists what was left out and why.
 */
export function brandFromFigma(mode: FigmaBrandMode): {
  theme: Partial<BrandInput>;
  unknown: string[];
  dropped: string[];
} {
  const theme: Partial<BrandInput> = {};
  const unknown: string[] = [];
  const dropped: string[] = [];
  for (const [name, value] of Object.entries(mode)) {
    const key = (FIGMA_BRAND_VARS as Record<string, keyof BrandInput>)[name];
    if (!key) {
      unknown.push(name);
      continue;
    }
    (theme as Record<string, string>)[key] = value.toUpperCase();
  }
  if (theme.primarySignalLight) {
    const bg = createTheme({ mode: "light", primary: theme.primary }).color.background;
    const r = contrast(theme.primarySignalLight, bg);
    if (r < SIGNAL_CONTRAST) {
      dropped.push(
        `brand/primary-signal-light ${theme.primarySignalLight} is ${Math.round(r * 100) / 100}:1 on the light background (needs ${SIGNAL_CONTRAST}:1); derived instead`,
      );
      delete theme.primarySignalLight;
    }
  }
  return { theme, unknown, dropped };
}

/**
 * Differences between the Figma Brand modes snapshot and the code: tokens.json `brandDefaults` must
 * equal the default (Otakoyi) mode, and every mode must be a valid brand (checkBrand errors).
 * Empty = in sync. Run by `pnpm tokens:check` (and the tokens tests).
 */
export function brandDriftFromFigma(
  figma: FigmaBrandModes,
  defaults: Record<string, string>,
): string[] {
  const out: string[] = [];
  const def = figma.modes[figma.defaultMode];
  if (!def) return [`default mode "${figma.defaultMode}" is missing from the snapshot`];
  for (const [name, key] of Object.entries(FIGMA_BRAND_VARS)) {
    const want = def[name]?.toUpperCase();
    const have = defaults[key]?.toUpperCase();
    if (want !== have)
      out.push(
        `${name} is ${want ?? "missing"} in Figma "${figma.defaultMode}", ${have ?? "missing"} in tokens.json brandDefaults.${key}`,
      );
  }
  for (const [mode, vars] of Object.entries(figma.modes)) {
    const { theme, unknown } = brandFromFigma(vars);
    if (unknown.length) out.push(`mode "${mode}": unknown variables ${unknown.join(", ")}`);
    for (const i of checkBrand(theme))
      if (i.level === "error") out.push(`mode "${mode}": ${i.message}`);
  }
  return out;
}
