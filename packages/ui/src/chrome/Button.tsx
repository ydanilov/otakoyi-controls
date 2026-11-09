import * as React from "react";
import { Pressable, View, type PressableProps } from "react-native";
import { Text } from "../components/ui/text";
import { useDepthStyle, usePressState, type Depth, type GlowTone } from "../ds/depth";
import { Glyph, onStatus, toneColor, type Tone } from "../ds/Glyph";
import type { PhosphorIcon } from "../ds/icons";
import { cn } from "../lib/utils";
import { useTheme } from "../theme/ThemeProvider";
import { TouchLightView, usePressLight, useTouchLight } from "../controls/TouchLight";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const SIZE: Record<ButtonSize, { box: string; text: string; icon: number; radius: "sm" | "md" }> = {
  sm: { box: "h-8 px-3 gap-1.5 rounded-sm", text: "text-xs", icon: 14, radius: "sm" },
  md: { box: "h-10 px-4 gap-2 rounded-md", text: "text-sm", icon: 16, radius: "md" },
  lg: { box: "h-[52px] px-5 gap-2 rounded-md", text: "text-sm", icon: 18, radius: "md" },
};

const FILL: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  ghost: "bg-transparent",
  destructive: "bg-destructive",
};

/** Depth per variant and state: raised at rest, pressed (inset) under the finger, flat when disabled. */
function depthFor(variant: ButtonVariant, pressed: boolean, disabled: boolean): Depth {
  if (variant === "ghost" || disabled) return "flat";
  return pressed ? "pressed" : "raisedSm";
}
/** Glow only while pressed, and only on lit variants (ADR-013 addendum). */
function glowFor(variant: ButtonVariant, pressed: boolean, disabled: boolean): GlowTone | false {
  if (!pressed || disabled) return false;
  return variant === "primary" ? "signal" : variant === "destructive" ? "critical" : false;
}

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: PhosphorIcon;
  /** Force the pressed look (Figma `State=Pressed`, stories). */
  pressed?: boolean;
  /** Stretch to the container width. */
  block?: boolean;
  className?: string;
};

/**
 * App-chrome button (Figma `Button`). Primary = the one main action on a screen; Secondary = other
 * actions; Ghost = low-emphasis inline actions; Destructive = removes or stops something.
 */
export function Button({
  label,
  variant = "primary",
  size = "md",
  icon,
  pressed: forced,
  disabled,
  block,
  className,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const t = useTheme();
  const isDisabled = !!disabled;
  const light = useTouchLight({ disabled: isDisabled });
  const lit = usePressLight(light, { onPressIn, onPressOut });
  const press = usePressState(forced, { onPressIn: lit.onPressIn, onPressOut: lit.onPressOut });
  const shadow = useDepthStyle(
    depthFor(variant, press.pressed, isDisabled),
    glowFor(variant, press.pressed, isDisabled),
    "active",
  );
  const ink =
    variant === "primary"
      ? t.color.onPrimary
      : variant === "destructive"
        ? onStatus(t, t.status.critical)
        : t.color.text;
  const s = SIZE[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-disabled={isDisabled}
      ref={lit.ref}
      disabled={isDisabled}
      onPressIn={press.onPressIn}
      onPressMove={lit.onPressMove}
      onPressOut={press.onPressOut}
      hitSlop={size === "sm" ? 6 : undefined}
      className={cn(
        "flex-row items-center justify-center",
        s.box,
        FILL[variant],
        variant === "ghost" && press.pressed && "bg-muted",
        block && "self-stretch",
        className,
      )}
      style={[shadow, isDisabled && { opacity: t.control.disabledOpacity }]}
      {...props}
    >
      {/* Touch light: inside the button, below the icon and label. */}
      <TouchLightView light={light} radius={t.radius[s.radius]} />
      {icon && <Glyph icon={icon} size={s.icon} color={ink} />}
      <Text className={cn("font-semibold", s.text)} style={{ color: ink }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Figma `Icon Button`: a 44 pt round raised button; `active` sinks it and lights the icon. */
export function IconButton({
  icon,
  label,
  active,
  tone,
  size = 44,
  pressed: forced,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: Omit<PressableProps, "children" | "style"> & {
  icon: PhosphorIcon;
  /** VoiceOver label — required, the button has no visible text. */
  label: string;
  active?: boolean;
  /** Icon tone at rest. Active icons are always lit (signal). */
  tone?: Tone;
  size?: number;
  pressed?: boolean;
}) {
  const t = useTheme();
  const press = usePressState(forced, { onPressIn, onPressOut });
  const sunk = active || press.pressed;
  const shadow = useDepthStyle(disabled ? "flat" : sunk ? "pressed" : "raisedSm");
  const color = active ? t.control.fill : toneColor(t, tone ?? "muted");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-disabled={!!disabled}
      aria-selected={!!active}
      disabled={disabled}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={Math.max(0, (44 - size) / 2)}
      className={cn(
        "items-center justify-center rounded-full",
        sunk ? "bg-control-track" : "bg-card",
      )}
      style={[
        { width: size, height: size },
        shadow,
        disabled && { opacity: t.control.disabledOpacity },
      ]}
      {...props}
    >
      <View pointerEvents="none">
        <Glyph icon={icon} size={Math.round(size * 0.45)} color={color} />
      </View>
    </Pressable>
  );
}
