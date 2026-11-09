import * as React from "react";
import { View } from "react-native";
import { Text } from "@osc/ui/components/ui/text";
import { cn } from "@osc/ui/lib/utils";
import { Glyph } from "../ds/Glyph";
import { ArrowsClockwiseIcon } from "../ds/icons";

/**
 * Label + value header around a control body. Keeps every control's chrome identical.
 * - `split` (default): label left, value right — horizontal faders and the other controls;
 * - `center`: label and value centred above the body with a 6 pt gap — vertical faders, knobs.
 */
export type HeaderAlign = "split" | "center";

export function ControlFrame({
  label,
  align = "split",
  value,
  children,
  className,
  disabled,
  badge,
  relative,
  valueMuted,
}: {
  /** Value in the muted colour: nothing live to show (Figma Gyroscope Off: `—`). */
  valueMuted?: boolean;
  /** Endless (relative) control: the arrows-clockwise glyph before the value (Figma). */
  relative?: boolean;
  /** Header layout (Figma): `center` for vertical faders and knobs. */
  align?: HeaderAlign;
  /** Short state marker next to the value, e.g. FINE while fine-adjusting. */
  badge?: string | undefined;
  label?: string | undefined;
  value?: string | undefined;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean | undefined;
}) {
  return (
    <View className={cn("flex-1 gap-2", disabled && "opacity-40", className)}>
      {(label || value) && (
        <View
          className={cn(
            // Figma: 18 pt with a value (mono 13 / 18), 14 pt with the label alone.
            value !== undefined || badge ? "min-h-[18px]" : "min-h-[14px]",
            "flex-row items-center",
            align === "center" ? "justify-center gap-1.5" : "justify-between gap-2",
          )}
          testID={align === "center" ? "control-header-center" : undefined}
        >
          {label ? (
            <Text
              className="text-muted-foreground shrink text-xs font-medium uppercase tracking-overline"
              numberOfLines={1}
            >
              {label}
            </Text>
          ) : align === "center" ? null : (
            <View />
          )}
          <View className="shrink-0 flex-row items-center gap-1.5">
            {badge && (
              <Text className="bg-brand-accent text-brand-accent-foreground overflow-hidden rounded-full px-1.5 font-mono text-xs">
                {badge}
              </Text>
            )}
            {relative && <Glyph icon={ArrowsClockwiseIcon} tone="muted" size={14} />}
            {value !== undefined && (
              <Text
                className={cn(
                  "font-mono text-sm",
                  valueMuted ? "text-muted-foreground" : "text-foreground",
                )}
                numberOfLines={1}
              >
                {value}
              </Text>
            )}
          </View>
        </View>
      )}
      <View className="flex-1">{children}</View>
    </View>
  );
}
