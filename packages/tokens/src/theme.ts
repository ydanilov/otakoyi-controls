import base from "../tokens.json";
import { bestOn, contrast, distance, isHex, mix, parseHex, withAlpha } from "./color";

export type Mode = "dark" | "light";
export type StatusName = "online" | "warning" | "critical" | "offline" | "studio";

/** Brand layer — comes from the installation config (`theme`), set by the studio in the builder. */
export interface BrandInput {
  primary?: string;
  onPrimary?: string;
  accent?: string;
  mode?: Mode;
  /** Font family name; must be one of the embedded fonts or a font asset shipped with the config. */
  font?: string;
  /** Optional overrides of the neutral surfaces, e.g. a client's own background. */
  background?: string;
  surface?: string;
  /**
   * Figma Brand mode colours (`brand/*` variables, one mode per client): primary while pressed,
   * the primary-tinted surface (dark mode), text on accent, and the primary darkened to ≥ 3:1 on
   * the light background for lines and LEDs (`primary-signal-light`). Derived when missing.
   */
  primaryPressed?: string;
  primarySubtle?: string;
  onAccent?: string;
  primarySignalLight?: string;
}

export interface Theme {
  mode: Mode;
  font: { sans: string; mono: string };
  color: {
    background: string;
    surface: string;
    surfaceRaised: string;
    border: string;
    text: string;
    textMuted: string;
    overlay: string;
    /** iOS system sheet background (Figma iOS 27 · System › Sheet) and its grabber. */
    sheet: string;
    sheetGrabber: string;
    /** The sheet toolbar's round Close / Back button (iOS glass button). */
    sheetButton: string;
    primary: string;
    onPrimary: string;
    primaryPressed: string;
    primarySubtle: string;
    accent: string;
    onAccent: string;
    focus: string;
  };
  /** Colours used by the Skia controls. */
  control: {
    track: string;
    trackBorder: string;
    fill: string;
    fillPressed: string;
    thumb: string;
    tick: string;
    label: string;
    valueText: string;
    disabledOpacity: number;
    /** Overlay when another device holds control ("view only"). */
    viewOnlyOverlay: string;
  };
  status: Record<StatusName, string>;
  /** Debug page scrims (Figma Debug Tag / Debug HUD); the hairline is `status.warning`. */
  debug: { tagBackground: string; hudBackground: string };
  /** Touch light (press response): sizes, opacities and timings. See tokens.json `touchLight`. */
  touchLight: TouchLightTokens;
  /** Neumorphic shadow / highlight colours for the current mode (Figma `elevation/*`). See depth.ts. */
  elevation: Record<keyof typeof base.elevation.dark, string>;
  space: typeof base.space;
  radius: typeof base.radius;
  stroke: typeof base.stroke;
  touch: typeof base.touch;
  motion: typeof base.motion;
  fontSize: typeof base.font.size;
  lineHeight: typeof base.font.lineHeight;
  fontWeight: typeof base.font.weight;
  size: typeof base.control;
}

export const baseTokens = base;

/** Touch light tokens (Figma `Touch Light`): diameters, opacities, the core colour, timings. */
export type TouchLightTokens = typeof base.touchLight;

export interface BrandIssue {
  level: "error" | "warning";
  token: keyof BrandInput;
  message: string;
  ratio?: number;
}

/** WCAG thresholds: 3:1 for UI components and large text, 4.5:1 for body text. */
export const CONTRAST_UI = 3;
export const CONTRAST_TEXT = 4.5;

/**
 * Validate a brand before publishing. Errors block publishing in the builder; warnings are shown.
 * Status colours are never part of a brand, so they cannot be broken by one.
 */
export function checkBrand(brand: BrandInput): BrandIssue[] {
  const issues: BrandIssue[] = [];
  for (const k of [
    "primary",
    "onPrimary",
    "accent",
    "background",
    "surface",
    "primaryPressed",
    "primarySubtle",
    "onAccent",
    "primarySignalLight",
  ] as const) {
    const v = brand[k];
    if (v !== undefined && !isHex(v))
      issues.push({ level: "error", token: k, message: `${k} must be a hex colour, got "${v}"` });
  }
  if (issues.length) return issues;

  const t = createTheme(brand);
  const primaryOnBg = contrast(t.color.primary, t.color.background);
  if (primaryOnBg < CONTRAST_UI)
    issues.push({
      level: "error",
      token: "primary",
      message: `Primary needs ${CONTRAST_UI}:1 against the background to be visible as a control fill`,
      ratio: round(primaryOnBg),
    });
  const onPrimary = contrast(t.color.onPrimary, t.color.primary);
  if (onPrimary < CONTRAST_TEXT)
    issues.push({
      level: brand.onPrimary ? "error" : "warning",
      token: "onPrimary",
      message: `Text on primary needs ${CONTRAST_TEXT}:1`,
      ratio: round(onPrimary),
    });
  if (brand.primarySignalLight) {
    const light = createTheme({ ...brand, mode: "light" }).color.background;
    const r = contrast(brand.primarySignalLight, light);
    if (r < SIGNAL_CONTRAST)
      issues.push({
        level: "error",
        token: "primarySignalLight",
        message: `primary-signal-light needs ${SIGNAL_CONTRAST}:1 against the light background (lines, LEDs)`,
        ratio: round(r),
      });
  }
  const accentOnBg = contrast(t.color.accent, t.color.background);
  if (accentOnBg < CONTRAST_UI)
    issues.push({
      level: "warning",
      token: "accent",
      message: `Accent is hard to see on the background`,
      ratio: round(accentOnBg),
    });
  for (const [name, hex] of Object.entries(t.status)) {
    if (distance(t.color.primary, hex) < 0.08)
      issues.push({
        level: "warning",
        token: "primary",
        message: `Primary is close to the "${name}" status colour; operators may confuse them`,
      });
  }
  return issues;
}

/** Minimum contrast of control lines (arcs, fills, LEDs) against the background. */
export const SIGNAL_CONTRAST = 3;

const round = (n: number) => Math.round(n * 100) / 100;

/** Merge base tokens with a brand into the full semantic theme. Pure and deterministic. */
export function createTheme(brand: BrandInput = {}): Theme {
  const mode: Mode = brand.mode ?? (base.brandDefaults.mode as Mode);
  const n = base.color[mode];
  const background = brand.background ?? n.background;
  const surface = brand.surface ?? n.surface;
  const primary = brand.primary ?? base.brandDefaults.primary;
  const accent = brand.accent ?? base.brandDefaults.accent;
  const ink = [
    n.text,
    base.color.dark.background,
    base.color.light.background,
    "#FFFFFF",
    "#000000",
  ];
  const defaults = base.brandDefaults as Record<string, string>;
  // A brand without its own primary (or with the default one) takes the Otakoyi mode's other
  // colours too (Figma Brand).
  const stock = !brand.primary || brand.primary.toUpperCase() === defaults.primary!.toUpperCase();
  const own = (k: keyof BrandInput) =>
    (brand[k] as string | undefined) ?? (stock ? defaults[k] : undefined);
  const onPrimary = brand.onPrimary ?? own("onPrimary") ?? bestOn(primary, ink);
  const towardBg = mode === "dark" ? "#000000" : "#FFFFFF";
  const primaryPressed = own("primaryPressed") ?? mix(primary, towardBg, 0.18);
  const { $description: _d, ...status } = base.color.status;
  // Lines, arcs and LEDs must read on the background. A pale brand colour (neon lime on a light
  // theme) is darkened for those uses only; buttons keep the exact brand colour.
  let signal = primary;
  const signalLight = own("primarySignalLight");
  if (
    mode === "light" &&
    signalLight &&
    contrast(primary, background) < SIGNAL_CONTRAST &&
    contrast(signalLight, background) >= SIGNAL_CONTRAST
  )
    signal = signalLight;
  for (let i = 0; i < 20 && contrast(signal, background) < SIGNAL_CONTRAST; i++) {
    signal = mix(signal, mode === "dark" ? "#FFFFFF" : "#000000", 0.08);
  }

  return {
    mode,
    font: { sans: brand.font ?? base.brandDefaults.font, mono: base.font.family.mono },
    color: {
      background,
      surface,
      surfaceRaised: brand.surface ? mix(surface, n.text, 0.06) : n.surfaceRaised,
      border: brand.background || brand.surface ? mix(surface, n.text, 0.14) : n.border,
      text: n.text,
      textMuted: n.textMuted,
      overlay: n.overlay,
      sheet: n.sheet,
      sheetGrabber: n.sheetGrabber,
      sheetButton: n.sheetButton,
      primary,
      onPrimary,
      primaryPressed,
      primarySubtle:
        (mode === "dark" && !brand.background ? own("primarySubtle") : undefined) ??
        mix(background, primary, 0.16),
      accent,
      onAccent: own("onAccent") ?? bestOn(accent, ink),
      focus: accent,
    },
    control: {
      // Recessed beds (neumorphic "inset"): darker than the background in dark mode,
      // a touch deeper than the background in light mode.
      track: mode === "dark" ? mix(background, "#000000", 0.22) : mix(background, n.text, 0.07),
      trackBorder:
        mode === "dark" ? mix(background, "#000000", 0.36) : mix(background, n.text, 0.15),
      fill: signal,
      fillPressed: primaryPressed,
      thumb: n.text,
      tick: mix(background, n.text, mode === "dark" ? 0.22 : 0.33),
      label: n.textMuted,
      valueText: n.text,
      disabledOpacity: 0.38,
      viewOnlyOverlay: withAlpha(background, 0.55),
    },
    status,
    debug: { tagBackground: base.debug.tagBackground, hudBackground: base.debug.hudBackground },
    touchLight: base.touchLight,
    elevation: { ...base.elevation[mode] },
    space: base.space,
    radius: base.radius,
    stroke: base.stroke,
    touch: base.touch,
    motion: base.motion,
    fontSize: base.font.size,
    lineHeight: base.font.lineHeight,
    fontWeight: base.font.weight,
    size: base.control,
  };
}

/** `#1D4ED8` → `29 78 216` so Tailwind opacity modifiers (`bg-primary/90`) work. */
export function hexToChannels(hex: string): string {
  const { r, g, b } = parseHex(hex);
  return [r, g, b].map((v) => Math.round(v * 255)).join(" ");
}

/**
 * CSS custom properties with shadcn / NativeWind names. Colours are RGB channel triplets
 * (`rgb(var(--primary) / <alpha-value>)` in the Tailwind preset). Used for the generated CSS,
 * for the web pult and, at runtime, for NativeWind `vars()` when a client brand is applied.
 */
export function themeToCssVars(t: Theme): Record<string, string> {
  const vars = themeToHexVars(t);
  return Object.fromEntries(
    Object.entries(vars).map(([k, v]) => [k, v.startsWith("#") ? hexToChannels(v) : v]),
  );
}

/** Same variables with plain hex values (for places that cannot use channel syntax). */
export function themeToHexVars(t: Theme): Record<string, string> {
  return {
    "--background": t.color.background,
    "--foreground": t.color.text,
    "--card": t.color.surface,
    "--card-foreground": t.color.text,
    "--popover": t.color.surfaceRaised,
    "--popover-foreground": t.color.text,
    "--primary": t.color.primary,
    "--primary-foreground": t.color.onPrimary,
    "--secondary": t.color.surfaceRaised,
    "--secondary-foreground": t.color.text,
    "--muted": t.color.surfaceRaised,
    "--muted-foreground": t.color.textMuted,
    "--accent": t.color.surfaceRaised,
    "--accent-foreground": t.color.text,
    "--brand-accent": t.color.accent,
    "--brand-accent-foreground": t.color.onAccent,
    "--destructive": t.status.critical,
    "--border": t.color.border,
    "--input": t.color.border,
    "--ring": t.color.focus,
    "--status-online": t.status.online,
    "--status-warning": t.status.warning,
    "--status-critical": t.status.critical,
    "--status-offline": t.status.offline,
    "--status-studio": t.status.studio,
    "--control-track": t.control.track,
    "--control-fill": t.control.fill,
    "--radius": `${t.radius.md}px`,
  };
}
