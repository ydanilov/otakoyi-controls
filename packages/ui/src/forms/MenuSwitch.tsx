import * as React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Surface, useDepthStyle } from "../ds/depth";
import { useTheme } from "../theme/ThemeProvider";

/** Figma `Menu Switch` (156:14369): iOS 26 switch size 64×28; thumb 38×24, 2 pt inset; LED 3×12. */
const TRACK_W = 64;
const TRACK_H = 28;
const THUMB_W = 38;
const THUMB_H = 24;
const PAD = 2;
const LED_W = 3;
const LED_H = 12;

/** Thumb x for a state (pure, also used by tests). */
export const menuSwitchThumbX = (on: boolean) => (on ? TRACK_W - THUMB_W - PAD : PAD);

/**
 * Figma `Menu Switch`: the iOS-size switch for menus and lists (List Row `trailing="switch"`:
 * Settings, Installation › Modes), in the Otakoyi style — a recessed dark track (`control/track`,
 * the same in both states), a raised dark thumb (the pult Switch's material) with a 3×12 LED in
 * its middle: signal with glow when on, dim tick colour when off. The thumb slides with a spring
 * (Reduce Motion: it jumps). Disabled = 40 % opacity. The big pult `LedSwitch` with grips stays for
 * on-stage controls only.
 */
export function MenuSwitch({
  value,
  onValueChange,
  label,
  disabled,
  decorative,
}: {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  /** VoiceOver name. */
  label: string;
  disabled?: boolean;
  /** Drawn inside a row that is itself the switch (List Row): no own role or press. */
  decorative?: boolean;
}) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const thumbShadow = useDepthStyle("raised");
  const ledGlow = useDepthStyle("flat", value ? "signal" : false);
  const x = useSharedValue(menuSwitchThumbX(value));
  React.useEffect(() => {
    const to = menuSwitchThumbX(value);
    x.value = reduce ? to : withSpring(to, { damping: 20, stiffness: 320, mass: 0.8 });
  }, [value, reduce, x]);
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const body = (
    <Surface
      depth="inset"
      radius="full"
      fill={false}
      className="bg-control-track"
      style={[
        { width: TRACK_W, height: TRACK_H },
        disabled ? { opacity: t.control.disabledOpacity } : undefined,
      ]}
      testID="menu-switch"
    >
      <Animated.View
        // Reanimated views are not NativeWind-interop'd: layout and colour go in `style`.
        style={[
          {
            position: "absolute",
            top: PAD,
            left: 0,
            width: THUMB_W,
            height: THUMB_H,
            borderRadius: THUMB_H / 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: t.color.surfaceRaised,
          },
          thumbShadow,
          thumbStyle,
        ]}
      >
        <View
          testID={value ? "menu-switch-led-on" : "menu-switch-led-off"}
          style={[
            {
              width: LED_W,
              height: LED_H,
              borderRadius: LED_W / 2,
              backgroundColor: value ? t.control.fill : t.control.tick,
            },
            value ? ledGlow : undefined,
          ]}
        />
      </Animated.View>
    </Surface>
  );
  if (decorative) return body;
  return (
    <Pressable
      onPress={() => onValueChange?.(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      aria-checked={value}
      aria-disabled={!!disabled}
      hitSlop={8}
    >
      {body}
    </Pressable>
  );
}
