import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import * as React from "react";
import { Pressable, View } from "react-native";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Text } from "@osc/ui/components/ui/text";
import { cn } from "@osc/ui/lib/utils";
import { CONTINUOUS, useDepthStyle } from "../ds/depth";
import { useTheme } from "../theme/ThemeProvider";
import type { ControlProps } from "./types";
import { TouchLightView, usePressLight, useTouchLight } from "./TouchLight";
import { useLayout } from "./useLayout";

/**
 * Critical actions (blackout, shutdown, reset). The command is sent only after the button is held
 * for `holdMs`; releasing early cancels. Figma Hold to Confirm: a raised key (radius 14) with the
 * label (critical tone: red); while held it presses in and a ring fills along its edge in the
 * accent colour ("HOLD…"); when sent it flashes the critical fill ("SENT").
 */
export function HoldToConfirm({ control: c, onChange, disabled }: ControlProps<"holdToConfirm">) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const progress = useSharedValue(0);
  const [state, setState] = React.useState<"idle" | "holding" | "done">("idle");
  const critical = c.tone === "critical";
  // Figma Hold to Confirm: the ring fills in the brand accent colour, whatever the tone.
  const accent = t.color.accent;
  const r = t.size.padRadius;

  const confirm = React.useCallback(() => {
    setState("done");
    onChange(true);
    setTimeout(() => setState("idle"), 1200);
  }, [onChange]);

  const onPressIn = () => {
    if (disabled) return;
    setState("holding");
    progress.value = withTiming(1, { duration: c.holdMs, easing: Easing.linear }, (finished) => {
      "worklet";
      if (finished) scheduleOnRN(confirm);
    });
  };
  const onPressOut = () => {
    if (state === "done") return;
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: t.motion.duration.fast });
    setState("idle");
  };

  const light = useTouchLight({ disabled: !!disabled });
  const lit = usePressLight(light, { onPressIn, onPressOut });

  const { width: w, height: h } = size;
  const stroke = t.stroke.default;
  const inset = stroke / 2;
  const ring = React.useMemo(() => {
    return Skia.PathBuilder.Make()
      .addRRect(Skia.RRectXY(Skia.XYWHRect(inset, inset, w - inset * 2, h - inset * 2), r, r))
      .build();
  }, [w, h, inset, r]);
  // Idle: a raised key; holding: pressed in; done: the critical fill with its glow.
  const depth = useDepthStyle(
    disabled ? "flat" : state === "holding" ? "pressed" : state === "done" ? "flat" : "raised",
    state === "done" ? "critical" : false,
  );
  const end = useDerivedValue(() => progress.value);

  const label = state === "holding" ? "Hold…" : state === "done" ? "Sent" : (c.label ?? "Hold");
  return (
    <Pressable
      ref={lit.ref}
      onPressIn={lit.onPressIn}
      onPressMove={lit.onPressMove}
      onPressOut={lit.onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={c.label ?? c.id}
      accessibilityHint={`Press and hold for ${(c.holdMs / 1000).toFixed(1)} seconds to confirm`}
      className={cn("flex-1", disabled && "opacity-40")}
    >
      <View
        onLayout={onLayout}
        className={cn(
          "bg-card flex-1 items-center justify-center",
          state === "done" && "bg-destructive",
        )}
        style={[CONTINUOUS, { borderRadius: r }, depth]}
      >
        {/* Touch light: inside the button, below the ring and the label. */}
        <TouchLightView light={light} radius={r} />
        {w > 0 && (
          <Canvas style={{ position: "absolute", width: w, height: h }} pointerEvents="none">
            <Path
              path={ring}
              color={accent}
              style="stroke"
              strokeWidth={stroke}
              start={0}
              end={end}
              strokeCap="round"
            />
          </Canvas>
        )}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          className={cn(
            "px-2 text-sm font-semibold uppercase",
            critical ? "text-status-critical" : "text-foreground",
            state === "done" && "text-foreground",
          )}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
