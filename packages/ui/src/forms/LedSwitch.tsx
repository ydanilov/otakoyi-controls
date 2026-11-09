import * as React from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from "react-native-reanimated";
import { Text } from "../components/ui/text";
import { Surface, useDepthStyle } from "../ds/depth";
import { StatusLed } from "../ds/Led";
import { useTheme } from "../theme/ThemeProvider";

/** Figma `Switch`: 104×46 capsule track, 58×40 capsule thumb with two grips, 3 pt inset. */
const TRACK_W = 104;
const TRACK_H = 46;
const THUMB_W = 58;
const THUMB_H = 40;
const PAD = (TRACK_H - THUMB_H) / 2;

/**
 * Figma `Switch`: hardware-style switch — a raised thumb with grip lines sliding in an inset bed,
 * flanked by two LEDs. Off lights the left (critical) LED, On lights the right (signal) LED.
 * `offLed={false}` (List Row, pult switch rows) keeps only the trailing LED, dark when off.
 * The thumb slides with the token motion duration; with Reduce Motion it jumps.
 */
export function LedSwitch({
  value,
  onValueChange,
  label,
  showLabel = true,
  offLed = true,
  disabled,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** VoiceOver name; also shown on the left unless `showLabel` is false (e.g. inside a List Row). */
  label: string;
  showLabel?: boolean;
  /** Show the leading (critical) LED that lights when off. */
  offLed?: boolean;
  disabled?: boolean;
}) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const thumbShadow = useDepthStyle("raisedSm");
  const x = value ? TRACK_W - THUMB_W - PAD : PAD;
  const thumbStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: reduce ? x : withTiming(x, { duration: t.motion.duration.fast }) }],
    }),
    [x, reduce],
  );
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      aria-checked={value}
      aria-disabled={!!disabled}
      className="min-h-touch flex-row items-center gap-2.5"
      style={disabled ? { opacity: t.control.disabledOpacity } : undefined}
    >
      {showLabel && (
        <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
          {label}
        </Text>
      )}
      {offLed && <StatusLed tone="critical" lit={!value && !disabled} size={8} />}
      <Surface depth="inset" radius="full" style={{ width: TRACK_W, height: TRACK_H }}>
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
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: t.color.surfaceRaised,
            },
            thumbShadow,
            thumbStyle,
          ]}
        >
          <View
            style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: t.control.track }}
          />
          <View
            style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: t.control.track }}
          />
        </Animated.View>
      </Surface>
      <StatusLed tone="signal" lit={value && !disabled} size={8} />
    </Pressable>
  );
}
