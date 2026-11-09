import base from "../tokens.json";
import type { Theme } from "./theme";

/**
 * Neumorphic depth (ADR-013 addendum), mirroring the Figma effect styles:
 * - `raised` / `raisedSm` (Neu/Raised, Neu/Raised SM): interactive elements, top-level cards and panels;
 * - `inset` (Neu/Inset): beds under controls, inputs, tab bars, active states;
 * - `pressed` (Neu/Pressed): a raised element while the finger is on it;
 * - `flat`: information nested inside a card (chips, stat tiles, icon wells) — no shadow.
 * Glow (Glow/*) is added only to lit values and to buttons while pressed, never at rest.
 */
export type Depth = "flat" | "raised" | "raisedSm" | "inset" | "pressed";
export type GlowTone = "signal" | "critical" | "warning" | "accent" | "online" | "studio";

export type ElevationColor = keyof typeof base.elevation.dark;
type Effect = (typeof base.elevation.effects.raised)[number] & { inset?: boolean };

/**
 * Glow strength: `rest` = Glow/Primary (a lit value at rest), `active` = Glow/Primary Active (a
 * finger on it, a pressed button).
 */
export type GlowLevel = "rest" | "active";

const effects = base.elevation.effects as unknown as Record<
  Exclude<Depth, "flat"> | "glow" | "glowActive",
  ReadonlyArray<Effect & { color: string }>
>;

/** Colour of a glow tone in this theme. Signal = the brand's lit colour (darkened in light mode). */
export function glowColor(t: Theme, tone: GlowTone): string {
  switch (tone) {
    case "signal":
      return t.control.fill;
    case "accent":
      return t.color.accent;
    default:
      return t.status[tone];
  }
}

const css = (e: Effect, color: string) =>
  `${e.inset ? "inset " : ""}${e.x}px ${e.y}px ${e.blur}px ${e.spread}px ${color}`;

/**
 * CSS `box-shadow` string for a depth (+ optional glow). Works on web and on React Native ≥ 0.76
 * (`boxShadow` style, New Architecture), so every surface draws depth from the same tokens.
 * Returns `"none"` for flat surfaces without glow. Pressed buttons pass `level: "active"`.
 */
export function boxShadow(
  t: Theme,
  depth: Depth,
  glow?: GlowTone | false,
  level: GlowLevel = "rest",
): string {
  const parts: string[] = [];
  if (glow) {
    const c = glowColor(t, glow);
    for (const e of effects[level === "active" ? "glowActive" : "glow"]) parts.push(css(e, c));
  }
  if (depth !== "flat")
    for (const e of effects[depth]) parts.push(css(e, t.elevation[e.color as ElevationColor]));
  return parts.length ? parts.join(", ") : "none";
}
