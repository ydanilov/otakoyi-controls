import { View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { useDepthStyle } from "./depth";
import { toneColor, type Tone } from "./Glyph";

/**
 * Status LED. Lit LEDs glow in their tone (a lit value, so glow is allowed); unlit LEDs are a dim
 * recessed dot. Status tones are never brandable.
 */
export function StatusLed({
  tone = "signal",
  lit = true,
  size = 8,
}: {
  tone?: Exclude<Tone, "foreground" | "muted" | "onPrimary">;
  lit?: boolean;
  size?: number;
}) {
  const t = useTheme();
  const glow = useDepthStyle("flat", lit && tone !== "offline" ? tone : false);
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        lit
          ? { backgroundColor: toneColor(t, tone), ...glow }
          : { backgroundColor: t.control.tick },
      ]}
    />
  );
}
