import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text } from "../components/ui/text";
import { Surface } from "../ds/depth";
import { cn } from "../lib/utils";
import { useTheme } from "../theme/ThemeProvider";

const MARK = { sm: 40, md: 128, lg: 180 } as const;

/** SVG arc path on a circle, angles in degrees clockwise from 12 o'clock. */
function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const p = (a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(rad)).toFixed(2)} ${(cy + r * Math.sin(rad)).toFixed(2)}`;
  };
  const large = to - from > 180 ? 1 : 0;
  return `M ${p(from)} A ${r} ${r} 0 ${large} 1 ${p(to)}`;
}

/**
 * Figma `Brand Mark` (Size=SM 40 / MD 128 / LG 180): the Otakoyi knob — a recessed well, a lit
 * arc (inner 90 % of a ring 5 % in from the edge) from −120° to +30° of the knob travel with its
 * glow, a raised disc (66 %), a recessed cap (44 %) and the LED at +30°. Arc and LED use the brand
 * signal colour, so a client brand recolours it.
 */
export function BrandMark({ size = "md" }: { size?: keyof typeof MARK }) {
  const t = useTheme();
  const s = MARK[size];
  const outer = s * 0.45;
  const ring = outer * 0.1;
  const r = outer - ring / 2;
  const disc = s * 0.66;
  const cap = s * 0.44;
  const led = s * 0.07;
  const ledAt = ((30 - 90) * Math.PI) / 180;
  const ledDist = s * 0.24;
  const d = arc(s / 2, s / 2, r, -120, 30);
  const sig = t.control.fill;
  const centred = (w: number) => ({
    position: "absolute" as const,
    width: w,
    height: w,
    left: (s - w) / 2,
    top: (s - w) / 2,
  });
  return (
    <View
      style={{ width: s, height: s }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Otakoyi"
    >
      <Surface depth="inset" radius="full" style={centred(s)} />
      <Svg width={s} height={s} style={{ position: "absolute" }} pointerEvents="none">
        {/* Glow/Primary (8 pt + 2 pt) approximated by wider, fainter strokes under the arc. */}
        <Path
          d={d}
          stroke={sig}
          strokeOpacity={0.12}
          strokeWidth={ring + 8}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={d}
          stroke={sig}
          strokeOpacity={0.3}
          strokeWidth={ring + 3}
          strokeLinecap="round"
          fill="none"
        />
        <Path d={d} stroke={sig} strokeWidth={ring} fill="none" />
      </Svg>
      <Surface depth="raised" radius="full" style={centred(disc)} />
      <Surface
        depth="pressed"
        radius="full"
        fill={false}
        className="bg-card"
        style={centred(cap)}
      />
      <View
        style={{
          position: "absolute",
          width: led,
          height: led,
          borderRadius: led,
          left: s / 2 + Math.cos(ledAt) * ledDist - led / 2,
          top: s / 2 + Math.sin(ledAt) * ledDist - led / 2,
          backgroundColor: sig,
          boxShadow: `0px 0px 8px 0px ${sig}, 0px 0px 2px 0px ${sig}`,
        }}
      />
    </View>
  );
}

/** Figma `Wordmark`: "otakoyi" + CONTROLS. */
export function Wordmark({
  size = "sm",
  align = "center",
}: {
  size?: "sm" | "lg";
  /** `start`: left-aligned next to a Brand Mark (Connect, phone). */
  align?: "center" | "start";
}) {
  return (
    <View
      className={align === "start" ? "items-start" : "items-center"}
      accessible
      accessibilityRole="header"
      accessibilityLabel="Otakoyi Controls"
    >
      <Text
        className={cn(
          "text-foreground",
          size === "lg" ? "text-display font-bold" : "text-lg font-semibold",
        )}
      >
        otakoyi
      </Text>
      <Text
        className={cn(
          "text-muted-foreground tracking-overline text-xs font-medium uppercase",
          size === "lg" && "mt-1",
        )}
      >
        Controls
      </Text>
    </View>
  );
}
