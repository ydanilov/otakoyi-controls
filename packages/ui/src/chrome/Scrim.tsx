import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

/**
 * Figma `Scrim`: dims the console behind an overlay (iPad form sheet). Dim only, no blur — the
 * system sheets bring their own material (ADR-013, HIG). Tapping it dismisses the overlay when
 * `onPress` is given. The iPad Installation inspector does not dim at all.
 */
export function Scrim({
  onPress,
  dismissLabel = "Close",
}: {
  onPress?: () => void;
  dismissLabel?: string;
}) {
  const t = useTheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={onPress ? "auto" : "none"}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: t.color.overlay }]} />
      {onPress && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
        />
      )}
    </View>
  );
}
