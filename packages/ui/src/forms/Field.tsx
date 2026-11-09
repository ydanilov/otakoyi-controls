import * as React from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { Text } from "../components/ui/text";
import { Surface } from "../ds/depth";
import { Glyph } from "../ds/Glyph";
import type { PhosphorIcon } from "../ds/icons";
import { formatStepped, parseValueInput } from "../ds/logic";
import { cn } from "../lib/utils";
import { useTheme } from "../theme/ThemeProvider";

export type FieldState = "default" | "focus" | "error" | "disabled";

/** Focus = accent ring, error = critical ring. Both stay on top of the inset bed. */
const RING: Record<FieldState, string> = {
  default: "border-transparent",
  focus: "border-ring",
  error: "border-destructive",
  disabled: "border-transparent",
};

const NO_OUTLINE = { outlineWidth: 0 } as const;

/**
 * Figma `Input`: label + recessed text field (+ optional leading icon) + error line.
 * Used for “Enter address and PIN” (pairing); the pult itself never has free-text fields.
 */
export function TextField({
  label,
  icon,
  error,
  disabled,
  focused: forcedFocus,
  onFocus,
  onBlur,
  ...props
}: Omit<TextInputProps, "editable" | "style"> & {
  label: string;
  icon?: PhosphorIcon;
  /** Error message under the field; switches the ring to critical. */
  error?: string | undefined;
  disabled?: boolean;
  /** Force the focus look (Figma `State=Focus`, stories). */
  focused?: boolean;
}) {
  const t = useTheme();
  const [focus, setFocus] = React.useState(false);
  const state: FieldState = disabled
    ? "disabled"
    : error
      ? "error"
      : (forcedFocus ?? focus)
        ? "focus"
        : "default";
  return (
    <View
      className="gap-1.5 self-stretch"
      style={disabled ? { opacity: t.control.disabledOpacity } : undefined}
    >
      <Text className="text-muted-foreground text-xs font-medium uppercase tracking-overline">
        {label}
      </Text>
      <Surface
        depth="inset"
        radius="md"
        className={cn("min-h-touch flex-row items-center gap-2 border px-3", RING[state])}
      >
        {icon && <Glyph icon={icon} tone={state === "focus" ? "accent" : "muted"} size={16} />}
        <TextInput
          {...props}
          editable={!disabled}
          accessibilityLabel={label}
          accessibilityHint={error}
          placeholderTextColor={t.color.textMuted}
          selectionColor={t.color.focus}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          className="text-foreground min-h-touch flex-1 font-sans text-md"
          style={NO_OUTLINE}
        />
      </Surface>
      {error ? (
        <Text className="text-destructive text-xs" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Figma `Value Input`: a label and a small recessed numeric field with a unit, for precise values
 * in settings (delay, port, timeout). Numeric keyboard; on commit the value is clamped to min/max
 * and snapped to the step. Text that is not a number shows the error ring until fixed or reverted.
 */
export function ValueInput({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step,
  disabled,
  focused: forcedFocus,
  invalid,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  focused?: boolean;
  /** Force the error look (Figma `State=Error`, stories). */
  invalid?: boolean;
}) {
  const t = useTheme();
  const format = React.useCallback(
    (v: number) => (step ? formatStepped(v, step) : String(v)),
    [step],
  );
  const [text, setText] = React.useState(format(value));
  const [focus, setFocus] = React.useState(false);
  const [bad, setBad] = React.useState(false);
  React.useEffect(() => {
    if (!focus) setText(format(value));
  }, [value, focus, format]);

  const commit = () => {
    const r = parseValueInput(text, { min, max, step });
    if (!r.ok) {
      setBad(r.reason === "nan");
      if (r.reason === "empty") setText(format(value));
      return;
    }
    setBad(false);
    setText(format(r.value));
    if (r.value !== value) onChange(r.value);
  };

  const state: FieldState = disabled
    ? "disabled"
    : invalid || bad
      ? "error"
      : (forcedFocus ?? focus)
        ? "focus"
        : "default";
  const range =
    min !== undefined && max !== undefined
      ? `${min} to ${max}${unit ? " " + unit : ""}`
      : undefined;
  return (
    <View
      className="min-h-touch flex-row items-center gap-3"
      style={disabled ? { opacity: t.control.disabledOpacity } : undefined}
    >
      <Text className="text-foreground flex-1 text-sm" numberOfLines={1}>
        {label}
      </Text>
      <Surface
        depth="inset"
        radius="sm"
        className={cn("h-9 w-24 flex-row items-center gap-1 border px-2", RING[state])}
      >
        <TextInput
          value={text}
          onChangeText={(s) => {
            setText(s);
            if (bad) setBad(false);
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => {
            setFocus(false);
            commit();
          }}
          onSubmitEditing={commit}
          editable={!disabled}
          keyboardType="decimal-pad"
          returnKeyType="done"
          selectTextOnFocus
          accessibilityLabel={label}
          accessibilityHint={range ? `Number from ${range}` : undefined}
          selectionColor={t.color.focus}
          className={cn(
            "h-9 min-w-0 flex-1 text-right font-mono text-sm",
            state === "error" ? "text-destructive" : "text-foreground",
          )}
          style={NO_OUTLINE}
        />
        {unit ? <Text className="text-muted-foreground font-mono text-xs">{unit}</Text> : null}
      </Surface>
    </View>
  );
}
