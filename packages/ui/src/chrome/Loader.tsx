import * as React from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Text } from "../components/ui/text";
import { cn } from "../lib/utils";
import { useTheme } from "../theme/ThemeProvider";

function Dot({ color, index, still }: { color: string; index: number; still: boolean }) {
  const t = useTheme();
  const o = useSharedValue(still ? (index === 0 ? 1 : 0.35) : 0.25);
  React.useEffect(() => {
    if (still) return;
    const d = t.motion.duration.slow;
    o.value = withDelay(
      index * (d / 2),
      withRepeat(
        withSequence(withTiming(1, { duration: d }), withTiming(0.25, { duration: d })),
        -1,
      ),
    );
  }, [still, index, o, t.motion.duration.slow]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }, style]}
    />
  );
}

/**
 * Figma `Loader`: three LEDs that chase while something is in progress, with a short label.
 * With Reduce Motion on, the dots hold still (the first one lit).
 */
export function Loader({
  label = "Loading…",
  tone = "primary",
}: {
  label?: string;
  tone?: "primary" | "warning";
}) {
  const t = useTheme();
  const still = useReducedMotion();
  const color = tone === "warning" ? t.status.warning : t.control.fill;
  return (
    <View
      className="flex-row items-center gap-2"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <View className="flex-row gap-1">
        {[0, 1, 2].map((i) => (
          <Dot key={i} index={i} color={color} still={still} />
        ))}
      </View>
      {label ? (
        <Text className={cn("text-muted-foreground text-xs")} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}
