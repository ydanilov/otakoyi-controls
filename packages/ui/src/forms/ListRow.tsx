import * as React from "react";
import { Pressable, View } from "react-native";
import { Text } from "../components/ui/text";
import { Glyph } from "../ds/Glyph";
import { CaretRightIcon, type PhosphorIcon } from "../ds/icons";
import { cn } from "../lib/utils";
import { useTheme } from "../theme/ThemeProvider";
import { MenuSwitch } from "./MenuSwitch";

export type ListRowTrailing = "chevron" | "value" | "switch" | "none" | "destructive";

/**
 * Figma `List Row`: one row in a List Card (settings, installation switcher).
 * - `chevron`: navigates (optional value shown before the chevron);
 * - `value`: read-only value;
 * - `switch`: Menu Switch (iOS size, LED on the thumb), the whole row toggles;
 * - `destructive`: critical text and icon (Forget this installation, Remove);
 * - `none`: title only.
 */
export function ListRow({
  title,
  subtitle,
  icon,
  trailing = "chevron",
  value,
  checked,
  onCheckedChange,
  onPress,
  disabled,
}: {
  title: string;
  subtitle?: string;
  icon?: PhosphorIcon;
  trailing?: ListRowTrailing;
  /** Trailing value text (chevron / value rows). */
  value?: string;
  /** Switch rows. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  const destructive = trailing === "destructive";
  const isSwitch = trailing === "switch";
  const press = isSwitch ? () => onCheckedChange?.(!checked) : onPress;
  const body = (
    <>
      {icon && <Glyph icon={icon} tone={destructive ? "critical" : "muted"} size={20} />}
      <View className="flex-1 gap-0.5">
        <Text
          className={cn("text-md", destructive ? "text-destructive" : "text-foreground")}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value !== undefined && (trailing === "chevron" || trailing === "value") && (
        <Text className="text-muted-foreground max-w-[45%] text-sm" numberOfLines={1}>
          {value}
        </Text>
      )}
      {trailing === "chevron" && <Glyph icon={CaretRightIcon} tone="muted" size={16} />}
      {isSwitch && (
        // The row itself is the switch for VoiceOver; the drawn switch is decoration.
        <View
          pointerEvents="none"
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <MenuSwitch value={!!checked} label={title} disabled={disabled} decorative />
        </View>
      )}
    </>
  );
  const className = "min-h-14 flex-row items-center gap-3.5 px-4 py-2";
  if (!press || trailing === "value" || trailing === "none")
    return (
      <View
        className={className}
        accessible
        accessibilityLabel={value ? `${title}: ${value}` : title}
      >
        {body}
      </View>
    );
  return (
    <Pressable
      onPress={press}
      disabled={disabled}
      accessibilityRole={isSwitch ? "switch" : "button"}
      accessibilityLabel={value ? `${title}: ${value}` : title}
      aria-checked={isSwitch ? !!checked : undefined}
      aria-disabled={!!disabled}
      className={cn(className, "active:bg-muted")}
      style={disabled ? { opacity: t.control.disabledOpacity } : undefined}
    >
      {body}
    </Pressable>
  );
}
