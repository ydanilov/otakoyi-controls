import { formatValue } from "@osc/controls";
import * as React from "react";
import { View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { IconButton } from "../chrome/Button";
import { Text } from "../components/ui/text";
import { Surface } from "../ds/depth";
import { PowerIcon } from "../ds/icons";
import { trackPosition } from "../ds/logic";
import { useTheme } from "../theme/ThemeProvider";
import { useLayout } from "../controls/useLayout";

/**
 * Figma `Master Bar`: master output level with a power (mute) button, pinned in the header area of
 * live pults. Muted shows OFF, dims the track and lights the power icon critical. The level is
 * set by dragging along the track (absolute: the master is never a hidden parameter).
 */
export function MasterBar({
  label = "Master",
  value,
  onChange,
  muted,
  onMutedChange,
  disabled,
}: {
  label?: string;
  /** 0…1 */
  value: number;
  onChange: (value: number) => void;
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const width = size.width;
  const pan = usePanGesture({
    enabled: !disabled && !muted,
    minDistance: 0,
    onBegin: (e) => {
      "worklet";
      scheduleOnRN(onChange, trackPosition(e.x, width));
    },
    onUpdate: (e) => {
      "worklet";
      scheduleOnRN(onChange, trackPosition(e.x, width));
    },
  });
  const pos = Math.min(1, Math.max(0, value));
  const step = 0.05;
  return (
    <Surface
      depth="raisedSm"
      radius="lg"
      className="flex-row items-center gap-3 px-3 py-2"
      style={disabled ? { opacity: t.control.disabledOpacity } : undefined}
    >
      <IconButton
        icon={PowerIcon}
        label={muted ? `Unmute ${label}` : `Mute ${label}`}
        size={36}
        tone={muted ? "critical" : "signal"}
        onPress={() => onMutedChange(!muted)}
        disabled={disabled}
      />
      <View className="flex-1 gap-1.5">
        <View className="flex-row items-baseline justify-between">
          <Text className="text-muted-foreground text-xs font-medium uppercase tracking-overline">
            {label}
          </Text>
          <Text className="text-foreground font-mono text-sm">
            {muted ? "OFF" : formatValue(pos)}
          </Text>
        </View>
        <GestureDetector gesture={pan}>
          <View
            className="justify-center"
            style={{ height: 24 }}
            onLayout={onLayout}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={label}
            accessibilityValue={{ text: muted ? "Off" : `${Math.round(pos * 100)} percent` }}
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            onAccessibilityAction={(e) =>
              onChange(
                Math.min(
                  1,
                  Math.max(0, pos + (e.nativeEvent.actionName === "increment" ? step : -step)),
                ),
              )
            }
          >
            <Surface depth="inset" radius="full" style={{ height: 6 }}>
              <View
                className="rounded-full"
                style={{
                  width: `${pos * 100}%`,
                  height: 6,
                  backgroundColor: muted ? t.control.tick : t.control.fill,
                }}
              />
            </Surface>
            <Surface
              depth="raisedSm"
              radius="full"
              fill={false}
              className="bg-secondary absolute"
              style={{ width: 16, height: 16, left: Math.max(0, pos * width - 8) }}
            />
          </View>
        </GestureDetector>
      </View>
    </Surface>
  );
}
