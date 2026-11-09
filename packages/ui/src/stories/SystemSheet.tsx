import * as React from "react";
import { View } from "react-native";
import { Scrim } from "../chrome/Scrim";
import { Text } from "../components/ui/text";
import { useTheme } from "../theme/ThemeProvider";

/**
 * Story-only stand-in for the native presentations (they cannot render on the web): an iPhone
 * system sheet (medium or large detent, grabber) or the iPad form sheet over a dimmed console.
 * In the app these come from expo-router `presentation: "formSheet"` (`presentationFor()`).
 */
export function SystemSheet({
  kind,
  children,
  behind,
}: {
  kind: "phone-medium" | "phone-large" | "ipad-form-sheet";
  children: React.ReactNode;
  /** What the sheet covers (defaults to a placeholder console). */
  behind?: React.ReactNode;
}) {
  const t = useTheme();
  const phone = kind !== "ipad-form-sheet";
  const frame = phone ? { width: 390, height: 760 } : { width: 1024, height: 700 };
  return (
    <View
      style={{
        ...frame,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: t.color.background,
      }}
    >
      <View style={{ flex: 1, padding: 16 }}>
        {behind ?? <Text className="text-muted-foreground text-sm">Pult (behind the sheet)</Text>}
      </View>
      <Scrim />
      <View
        style={
          phone
            ? {
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: kind === "phone-medium" ? frame.height * 0.55 : frame.height - 48,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                backgroundColor: t.color.surface,
              }
            : {
                position: "absolute",
                width: 580,
                height: 560,
                left: (frame.width - 580) / 2,
                top: (frame.height - 560) / 2,
                borderRadius: 24,
                backgroundColor: t.color.surface,
              }
        }
      >
        {phone && (
          <View
            style={{
              alignSelf: "center",
              marginTop: 6,
              width: 36,
              height: 5,
              borderRadius: 3,
              backgroundColor: t.control.tick,
            }}
          />
        )}
        {children}
      </View>
    </View>
  );
}
