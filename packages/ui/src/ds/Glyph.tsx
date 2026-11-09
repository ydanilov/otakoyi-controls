import { bestOn, glowColor, type Theme } from "@osc/tokens";
import type { PhosphorIcon } from "./icons";
import { useTheme } from "../theme/ThemeProvider";

/**
 * Colour roles for icons and other non-text marks. Resolved from the theme, so icons follow the
 * client brand and mode like NativeWind text classes do.
 */
export type Tone =
  | "foreground"
  | "muted"
  | "signal"
  | "accent"
  | "onPrimary"
  | "critical"
  | "warning"
  | "online"
  | "offline"
  | "studio";

export function toneColor(t: Theme, tone: Tone): string {
  switch (tone) {
    case "foreground":
      return t.color.text;
    case "muted":
      return t.color.textMuted;
    case "onPrimary":
      return t.color.onPrimary;
    case "signal":
    case "accent":
    case "critical":
    case "warning":
    case "online":
    case "studio":
      return glowColor(t, tone);
    case "offline":
      return t.status.offline;
  }
}

/** Readable ink on a status fill (destructive buttons, studio banner). */
export function onStatus(t: Theme, fill: string): string {
  return bestOn(fill, [t.color.text, t.color.background, t.color.onPrimary]);
}

/** A Phosphor icon (Figma `Icon/<name>`) coloured by tone. Decorative unless given a label. */
export function Glyph({
  icon: Icon,
  tone = "foreground",
  color,
  size = 20,
  label,
}: {
  icon: PhosphorIcon;
  tone?: Tone;
  /** Explicit colour (from the theme), overriding `tone`. */
  color?: string;
  size?: number;
  /** Accessible name; omit for decorative icons next to text. */
  label?: string;
}) {
  const t = useTheme();
  return (
    <Icon
      size={size}
      weight="regular"
      color={color ?? toneColor(t, tone)}
      {...(label ? { title: label } : {})}
    />
  );
}
