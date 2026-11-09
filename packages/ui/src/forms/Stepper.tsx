import * as React from "react";
import { Pressable, View } from "react-native";
import { Text } from "../components/ui/text";
import { Surface, useDepthStyle, usePressState } from "../ds/depth";
import { Glyph } from "../ds/Glyph";
import { ArrowCounterClockwiseIcon, MinusIcon, PlusIcon, type PhosphorIcon } from "../ds/icons";
import { formatStepped, stepValue, type NumericRange } from "../ds/logic";
import { cn } from "../lib/utils";
import { useTheme } from "../theme/ThemeProvider";

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: PhosphorIcon;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const press = usePressState(undefined);
  const shadow = useDepthStyle(disabled ? "flat" : press.pressed ? "pressed" : "raisedSm");
  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(
        "min-h-touch w-14 items-center justify-center rounded-md",
        press.pressed ? "bg-control-track" : "bg-secondary",
      )}
      style={shadow}
    >
      <Glyph icon={icon} tone={disabled ? "muted" : "foreground"} size={20} />
    </Pressable>
  );
}

/**
 * Figma `Stepper`: precise numeric value with − / + buttons in an inset bed. When the value differs
 * from `defaultValue` it lights up (a lit value may glow) and offers Reset. Values are snapped to
 * `step` and clamped to min/max (`stepValue`, unit-tested).
 */
export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  defaultValue,
  disabled,
}: NumericRange & {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  /** Value Reset returns to; also decides the Changed (lit) state. */
  defaultValue?: number;
  disabled?: boolean;
}) {
  const t = useTheme();
  const range = { min, max, step };
  const changed = defaultValue !== undefined && value !== defaultValue;
  const text = formatStepped(value, step);
  return (
    <View
      className="gap-2 self-stretch"
      style={disabled ? { opacity: t.control.disabledOpacity } : undefined}
    >
      <View className="min-h-5 flex-row items-center justify-between">
        <Text className="text-muted-foreground text-xs font-medium uppercase tracking-overline">
          {label}
        </Text>
        {changed && !disabled && (
          <Pressable
            onPress={() => onChange(defaultValue)}
            accessibilityRole="button"
            accessibilityLabel={`Reset ${label}`}
            hitSlop={12}
            className="flex-row items-center gap-1"
          >
            <Glyph icon={ArrowCounterClockwiseIcon} tone="signal" size={12} />
            <Text className="text-control-fill text-xs font-medium uppercase">Reset</Text>
          </Pressable>
        )}
      </View>
      <Surface depth="inset" radius="lg" className="flex-row items-center gap-2 p-1.5">
        <StepButton
          icon={MinusIcon}
          label={`Decrease ${label}`}
          disabled={!!disabled || value <= min}
          onPress={() => onChange(stepValue(value, -1, range))}
        />
        <View
          className="flex-1 flex-row items-baseline justify-center gap-1"
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ text: `${text}${unit ? " " + unit : ""}` }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) =>
            !disabled &&
            onChange(stepValue(value, e.nativeEvent.actionName === "increment" ? 1 : -1, range))
          }
        >
          <Text
            className={cn(
              "font-mono text-2xl font-bold",
              changed ? "text-control-fill" : "text-foreground",
            )}
            numberOfLines={1}
          >
            {text}
          </Text>
          {unit ? <Text className="text-muted-foreground font-mono text-xs">{unit}</Text> : null}
        </View>
        <StepButton
          icon={PlusIcon}
          label={`Increase ${label}`}
          disabled={!!disabled || value >= max}
          onPress={() => onChange(stepValue(value, 1, range))}
        />
      </Surface>
    </View>
  );
}
