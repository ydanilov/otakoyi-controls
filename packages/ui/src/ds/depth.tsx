import { boxShadow, type Depth, type GlowLevel, type GlowTone } from "@osc/tokens";
import * as React from "react";
import {
  Platform,
  View,
  type GestureResponderEvent,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { cn } from "../lib/utils";
import { useTheme } from "../theme/ThemeProvider";

export type { Depth, GlowLevel, GlowTone };

const RADIUS = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};
export type Radius = keyof typeof RADIUS;

/**
 * Continuous (squircle) corners where the platform draws them (iOS); a no-op elsewhere. Every
 * rounded DS surface sets it so corners read like the Figma (corner smoothing) shapes.
 */
export const CONTINUOUS: ViewStyle = Platform.select({
  ios: { borderCurve: "continuous" },
  default: {},
});

/** Default fill per depth: raised cards sit on `card`, beds are the recessed control track. */
const FILL: Record<Depth, string> = {
  raised: "bg-card",
  raisedSm: "bg-card",
  inset: "bg-control-track",
  pressed: "bg-control-track",
  flat: "bg-muted",
};

/** Box-shadow style for a depth, from the theme's elevation tokens. */
export function useDepthStyle(depth: Depth, glow?: GlowTone | false, level: GlowLevel = "rest") {
  const t = useTheme();
  return React.useMemo(
    () => ({ boxShadow: boxShadow(t, depth, glow, level) }),
    [t, depth, glow, level],
  );
}

/**
 * The neumorphic building block. Every DS surface is a `Surface` with a depth:
 * raised (interactive, top-level), inset (beds, active), flat (info inside a card), pressed.
 * Glow is opt-in and reserved for lit values and pressed buttons.
 */
export function Surface({
  depth = "raised",
  glow,
  glowLevel = "rest",
  radius = "lg",
  fill = true,
  className,
  style,
  ...props
}: ViewProps & {
  depth?: Depth;
  glow?: GlowTone | false;
  /** Glow/Primary at rest, Glow/Primary Active while pressed or touched. */
  glowLevel?: GlowLevel;
  radius?: Radius;
  /** Paint the default fill for the depth. Pass false to supply your own `bg-*` class. */
  fill?: boolean;
  className?: string;
}) {
  const shadow = useDepthStyle(depth, glow, glowLevel);
  return (
    <View
      className={cn(fill && FILL[depth], RADIUS[radius], className)}
      style={[CONTINUOUS, shadow, style]}
      {...props}
    />
  );
}

/**
 * Pressed state for a pressable surface. `forced` lets stories and Figma "State=Pressed" variants
 * render the pressed look without a finger on the screen.
 */
export function usePressState(
  forced: boolean | undefined,
  handlers: {
    onPressIn?: ((e: GestureResponderEvent) => void) | null | undefined;
    onPressOut?: ((e: GestureResponderEvent) => void) | null | undefined;
  } = {},
) {
  const [down, setDown] = React.useState(false);
  return {
    pressed: forced ?? down,
    onPressIn: (e: GestureResponderEvent) => {
      setDown(true);
      handlers.onPressIn?.(e);
    },
    onPressOut: (e: GestureResponderEvent) => {
      setDown(false);
      handlers.onPressOut?.(e);
    },
  };
}
