import * as React from "react";
import { Pressable, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Text } from "../components/ui/text";
import { useDepthStyle, usePressState } from "../ds/depth";
import { Glyph } from "../ds/Glyph";
import type { PhosphorIcon } from "../ds/icons";
import { holdFraction } from "../ds/logic";
import { cn } from "../lib/utils";
import { useTheme } from "../theme/ThemeProvider";
import { TouchLightView, usePressLight, useTouchLight } from "../controls/TouchLight";

const SIZE = 64;
const RING = 3;

/**
 * Figma `Quick Action`: round raised action with a caption, for the Installation surface
 * (Flash, Idle, Restart, Blackout). `holdMs` makes it hold-to-confirm: a ring fills while held and
 * the action fires only when it completes; releasing early cancels. Critical actions use the
 * critical tone and should always use hold.
 */
export function QuickAction({
  icon,
  label,
  tone = "default",
  holdMs,
  onAction,
  disabled,
  pressed: forced,
  progress: forcedProgress,
}: {
  icon: PhosphorIcon;
  label: string;
  tone?: "default" | "critical";
  /** Hold-to-confirm duration; omit for a plain tap. */
  holdMs?: number;
  onAction?: () => void;
  disabled?: boolean;
  /** Force the pressed look (stories, Figma `State=Pressed`). */
  pressed?: boolean;
  /** Force the hold ring 0…1 (stories, Figma `State=Hold — holding`). */
  progress?: number;
}) {
  const t = useTheme();
  const [progress, setProgress] = React.useState(0);
  const raf = React.useRef<number | null>(null);
  const stop = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };
  React.useEffect(() => stop, []);

  const startHold = () => {
    if (!holdMs) return;
    const start = Date.now();
    const tick = () => {
      const f = holdFraction(Date.now() - start, holdMs);
      setProgress(f);
      if (f >= 1) {
        stop();
        onAction?.();
        setTimeout(() => setProgress(0), t.motion.duration.slow);
      } else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  const light = useTouchLight({ disabled: !!disabled });
  const lit = usePressLight(light, {
    onPressIn: startHold,
    onPressOut: () => {
      if (!holdMs) return;
      stop();
      setProgress((p) => (p >= 1 ? p : 0));
    },
  });
  const press = usePressState(forced, { onPressIn: lit.onPressIn, onPressOut: lit.onPressOut });
  const critical = tone === "critical";
  const shadow = useDepthStyle(
    disabled ? "flat" : press.pressed ? "pressed" : "raised",
    press.pressed && !disabled ? (critical ? "critical" : "signal") : false,
  );
  const ring = forcedProgress ?? progress;
  const r = (SIZE - RING) / 2;
  const c = 2 * Math.PI * r;
  const ink = critical ? "critical" : "foreground";
  return (
    <View
      className="items-center gap-2"
      style={disabled ? { opacity: t.control.disabledOpacity } : undefined}
    >
      <Pressable
        ref={lit.ref}
        onPress={holdMs ? undefined : onAction}
        onPressIn={press.onPressIn}
        onPressMove={lit.onPressMove}
        onPressOut={press.onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={
          holdMs ? `Press and hold for ${(holdMs / 1000).toFixed(1)} seconds` : undefined
        }
        accessibilityActions={holdMs ? [{ name: "activate" }] : undefined}
        onAccessibilityAction={holdMs ? () => onAction?.() : undefined}
        className={cn(
          "items-center justify-center rounded-full",
          press.pressed ? "bg-control-track" : "bg-card",
        )}
        style={[{ width: SIZE, height: SIZE }, shadow]}
      >
        {/* Touch light: inside the disc, below the hold ring and the icon. */}
        <TouchLightView light={light} radius={SIZE / 2} />
        {holdMs ? (
          <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }} pointerEvents="none">
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={r}
              stroke={critical ? t.status.critical : t.control.fill}
              strokeWidth={RING}
              fill="none"
              strokeDasharray={`${c}`}
              strokeDashoffset={c * (1 - ring)}
              strokeLinecap="round"
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              opacity={ring > 0 ? 1 : 0}
            />
          </Svg>
        ) : null}
        <Glyph icon={icon} tone={ink} size={24} />
      </Pressable>
      <Text
        className={cn("text-sm", critical ? "text-destructive" : "text-muted-foreground")}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
