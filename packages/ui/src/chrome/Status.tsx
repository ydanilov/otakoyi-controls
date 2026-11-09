import * as React from "react";
import { View } from "react-native";
import { Text } from "../components/ui/text";
import { Surface } from "../ds/depth";
import { Glyph, onStatus } from "../ds/Glyph";
import { InfoIcon } from "../ds/icons";
import { StatusLed } from "../ds/Led";
import { cn } from "../lib/utils";
import { useTheme } from "../theme/ThemeProvider";
import { Button } from "./Button";

export type Connection = "online" | "connecting" | "offline";

const CONNECTION: Record<Connection, { tone: "online" | "warning" | "offline"; label: string }> = {
  online: { tone: "online", label: "Online" },
  connecting: { tone: "warning", label: "Connecting" },
  offline: { tone: "offline", label: "Offline" },
};

/** Figma `Connection`: LED + word. Status colours, never the brand. */
export function ConnectionStatus({ state }: { state: Connection }) {
  const c = CONNECTION[state];
  return (
    <View
      className="flex-row items-center gap-2"
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Connection: ${c.label}`}
    >
      <StatusLed tone={c.tone} lit={state !== "offline"} />
      <Text className="text-muted-foreground text-xs">{c.label}</Text>
    </View>
  );
}

export type BadgeTone = "accent" | "primary" | "critical" | "muted";
const BADGE: Record<BadgeTone, string> = {
  accent: "bg-brand-accent",
  primary: "bg-primary",
  critical: "bg-destructive",
  muted: "bg-muted",
};
const BADGE_TEXT: Record<BadgeTone, string> = {
  accent: "text-brand-accent-foreground",
  primary: "text-primary-foreground",
  critical: "text-foreground",
  muted: "text-muted-foreground",
};

/** Figma `Badge`: a tiny mono tag next to a value or title — FINE, NEW, BETA. */
export function Badge({ label, tone = "accent" }: { label: string; tone?: BadgeTone }) {
  return (
    <View className={cn("self-start rounded-sm px-1.5", BADGE[tone])}>
      <Text className={cn("font-mono text-xs uppercase", BADGE_TEXT[tone])} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export type ChipTone = "primary" | "warning" | "critical" | "muted";
const CHIP_LED = {
  primary: "signal",
  warning: "warning",
  critical: "critical",
  muted: "offline",
} as const;

/** Figma `Chip`: flat status capsule (LED + short mono text), e.g. a countdown. Nested info → flat. */
export function Chip({ label, tone = "primary" }: { label: string; tone?: ChipTone }) {
  return (
    <Surface
      depth="flat"
      radius="full"
      className="min-h-9 flex-row items-center gap-2 px-3.5 py-2"
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <StatusLed tone={CHIP_LED[tone]} lit={tone !== "muted"} size={8} />
      <Text className="text-foreground font-mono text-sm" numberOfLines={1}>
        {label}
      </Text>
    </Surface>
  );
}

/** Figma `Stat Tile`: flat label + number inside a card. */
export function StatTile({
  label,
  value,
  size = "md",
  block,
  outlined,
}: {
  label: string;
  value: string;
  size?: "md" | "lg";
  /** Figma Prompt Mix › Weight: a raised-colour tile with a 1 pt border. */
  outlined?: boolean;
  /** Fill the width it is given (Installation stats: four equal tiles). */
  block?: boolean;
}) {
  return (
    <Surface
      depth="flat"
      radius="md"
      className={cn(
        block ? "self-stretch" : "self-start",
        size === "lg"
          ? "gap-0.5 p-[13px]"
          : block
            ? "gap-0.5 px-[13px] py-[11px]"
            : "gap-0.5 px-2 py-1.5",
        outlined && "bg-secondary border-border border",
      )}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text className="text-muted-foreground text-xs font-medium uppercase tracking-overline">
        {label}
      </Text>
      <Text
        className={cn(
          "text-foreground font-mono",
          size === "lg" ? "text-2xl font-bold" : "text-sm",
        )}
        numberOfLines={1}
      >
        {value}
      </Text>
    </Surface>
  );
}

/** Figma `Note`: one line of help text with an info glyph. Not a card, no depth. */
export function Note({ children }: { children: string }) {
  return (
    <View className="flex-row items-start gap-1.5">
      <View className="pt-0.5">
        <Glyph icon={InfoIcon} tone="muted" size={14} />
      </View>
      <Text className="text-muted-foreground flex-1 text-xs">{children}</Text>
    </View>
  );
}

/** Figma `Info Card`: a raised tip with an icon well. */
export function InfoCard({
  icon,
  children,
}: {
  icon?: React.ComponentProps<typeof Glyph>["icon"];
  children: string;
}) {
  return (
    <Surface depth="raisedSm" radius="md" className="flex-row items-center gap-3 px-3 py-3">
      <Glyph icon={icon ?? InfoIcon} tone="muted" size={18} />
      <Text className="text-muted-foreground flex-1 text-sm">{children}</Text>
    </Surface>
  );
}

/** Figma `Divider`: hairline, optionally with a centred label ("or"). */
export function Divider({ label }: { label?: string }) {
  if (!label) return <View className="bg-border h-px self-stretch" accessibilityElementsHidden />;
  return (
    <View className="flex-row items-center gap-3 self-stretch">
      <View className="bg-border h-px flex-1" />
      <Text className="text-muted-foreground text-xs">{label}</Text>
      <View className="bg-border h-px flex-1" />
    </View>
  );
}

/** Figma `Page Dots`: which pult screen is showing. The active dot is a lit pill. */
export function PageDots({ count, active }: { count: number; active: number }) {
  const t = useTheme();
  return (
    <View
      className="flex-row items-center gap-1.5"
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Screen ${active + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, i) =>
        i === active ? (
          <Surface
            key={i}
            depth="flat"
            glow="signal"
            radius="full"
            fill={false}
            style={{ width: 16, height: 6, backgroundColor: t.control.fill }}
          />
        ) : (
          <View
            key={i}
            className="rounded-full"
            style={{ width: 6, height: 6, backgroundColor: t.control.tick }}
          />
        ),
      )}
    </View>
  );
}

export type BannerMode = "view" | "studio";

/**
 * Header banners (ADR-013 addendum): "View only — Take control" while another device holds the
 * lease, and the studio banner while the studio is in control (no take-over possible).
 */
export function StatusBanner({
  mode,
  onTakeControl,
}: {
  mode: BannerMode;
  onTakeControl?: () => void;
}) {
  const t = useTheme();
  if (mode === "studio")
    return (
      <View
        className="bg-status-studio rounded-md px-3 py-2"
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Text className="text-sm" style={{ color: onStatus(t, t.status.studio) }}>
          The studio is controlling this installation
        </Text>
      </View>
    );
  return (
    <Surface
      depth="inset"
      radius="md"
      className="flex-row items-center gap-3 py-1.5 pl-3 pr-1.5"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text className="text-foreground flex-1 text-sm" numberOfLines={2}>
        View only — another device is in control
      </Text>
      {onTakeControl && <Button size="sm" label="Take control" onPress={onTakeControl} />}
    </Surface>
  );
}
