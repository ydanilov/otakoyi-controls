import * as React from "react";
import { View, type ViewProps } from "react-native";
import { Button } from "../chrome/Button";
import { Badge } from "../chrome/Status";
import { Text } from "../components/ui/text";
import { Surface } from "../ds/depth";
import { Glyph } from "../ds/Glyph";
import type { PhosphorIcon } from "../ds/icons";
import { StatusLed } from "../ds/Led";
import { cn } from "../lib/utils";

/**
 * Figma `List Card`: raised card of List Rows separated by inset hairlines (Divider Type=Inset:
 * from the row text, 50 pt, to the trailing edge — iOS inset-grouped). Slot: rows as children.
 */
export function ListCard({
  children,
  className,
  inset = LIST_INSET,
  ...props
}: ViewProps & {
  className?: string;
  /** Leading inset of the separators: 50 for List Rows with icons, 16 for rows without (Debug Row). */
  inset?: number;
}) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <Surface depth="raised" radius="lg" className={cn("overflow-hidden", className)} {...props}>
      {rows.map((row, i) => (
        <React.Fragment key={i}>
          {i > 0 && <View className="bg-border/50 h-px" style={{ marginLeft: inset }} />}
          {row}
        </React.Fragment>
      ))}
    </Surface>
  );
}

/** Leading inset of a list separator: row padding 16 + icon 20 + gap 14 (Figma List Row). */
const LIST_INSET = 50;

/** Figma `Section`: an uppercase caption above a group (usually a List Card). Slot: children. */
export function Section({
  title,
  action,
  children,
  className,
}: {
  title: string;
  /** Right side of the caption, e.g. a Reset link. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("gap-2 self-stretch", className)}>
      <View className="min-h-[14px] flex-row items-center justify-between">
        <Text
          className="text-muted-foreground text-xs font-medium uppercase tracking-overline"
          accessibilityRole="header"
        >
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

/**
 * Figma `Console Panel`: the raised hardware panel that groups related controls or actions
 * (a knob with its caption, quick actions, a stepper group). Slot: children.
 */
export function ConsolePanel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Surface depth="raised" radius="lg" className={cn("gap-3 p-4", className)}>
      {(title || action) && (
        <View className="min-h-[14px] flex-row items-center justify-between">
          {title ? (
            <Text
              className="text-muted-foreground text-xs font-medium uppercase tracking-overline"
              accessibilityRole="header"
            >
              {title}
            </Text>
          ) : (
            <View />
          )}
          {action}
        </View>
      )}
      {children}
    </Surface>
  );
}

/** Figma `Release Note`: one bullet of a release. The latest release's notes are lit. */
export function ReleaseNote({ children, latest }: { children: string; latest?: boolean }) {
  return (
    <View className="flex-row items-start gap-2">
      <View className="pt-1.5">
        <StatusLed tone="signal" lit={!!latest} size={6} />
      </View>
      <Text className="text-foreground flex-1 text-sm">{children}</Text>
    </View>
  );
}

/** Figma `Release Card`: version, NEW badge, date and its Release Notes (children). */
export function ReleaseCard({
  version,
  date,
  latest,
  children,
}: {
  version: string;
  date: string;
  latest?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Surface depth="raisedSm" radius="lg" className="gap-2 p-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-foreground text-md font-semibold">{version}</Text>
        {latest && <Badge label="New" tone="accent" />}
        <View className="flex-1" />
        <Text className="text-muted-foreground text-xs">{date}</Text>
      </View>
      <View className="gap-1">{children}</View>
    </Surface>
  );
}

/**
 * Figma `Pult Card`: one pult of an installation in the switcher. The primary pult (the form
 * factor's main pult) has a lit icon and a Primary button; others are Secondary.
 */
export function PultCard({
  title,
  description,
  icon,
  primary,
  current,
  onOpen,
}: {
  title: string;
  description?: string;
  icon: PhosphorIcon;
  primary?: boolean;
  /** The pult that is open now; the button says so and is disabled. */
  current?: boolean;
  onOpen?: () => void;
}) {
  return (
    <Surface depth="raised" radius="lg" className="flex-1 gap-3 p-4">
      <Surface depth="flat" radius="md" className="h-10 w-10 items-center justify-center">
        <Glyph icon={icon} tone={primary ? "signal" : "muted"} size={20} />
      </Surface>
      <View className="gap-1">
        <Text className="text-foreground text-md font-semibold" numberOfLines={1}>
          {title}
        </Text>
        {description ? (
          <Text className="text-muted-foreground text-xs" numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      <Button
        label={current ? "Open now" : "Open"}
        variant={primary ? "primary" : "secondary"}
        disabled={current}
        onPress={onOpen}
        block
      />
    </Surface>
  );
}
