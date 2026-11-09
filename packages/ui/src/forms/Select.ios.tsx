import { Host, Picker } from "@expo/ui";
import { View } from "react-native";
import { Text } from "../components/ui/text";
import { CONTINUOUS, useDepthStyle } from "../ds/depth";
import { useTheme } from "../theme/ThemeProvider";
import { selectedLabel, type SelectProps, type SelectValue } from "./select-types";

export type { SelectOption, SelectProps } from "./select-types";

/**
 * Figma `Select` on iOS: the native SwiftUI pull-down (`Picker` with menu appearance from
 * `@expo/ui`, SDK 58), so the menu, checkmark, haptics and VoiceOver are the system's own.
 * Tinted with the brand accent and forced to the pult's colour scheme.
 * `defaultOpen` is ignored: a native menu cannot be opened programmatically.
 */
export function Select<T extends SelectValue>({
  label,
  value,
  options,
  onChange,
  disabled,
  variant = "row",
  align = "start",
}: SelectProps<T>) {
  const t = useTheme();
  const raised = useDepthStyle("raisedSm");
  if (variant === "button")
    return (
      // Pop-up button: the native menu inside the raised capsule of the Figma `Pult Select`.
      <View
        className="bg-card min-h-10 flex-1 flex-row items-center rounded-md px-1.5"
        style={[
          CONTINUOUS,
          raised,
          { justifyContent: align === "end" ? "flex-end" : "flex-start" },
          disabled ? { opacity: t.control.disabledOpacity } : undefined,
        ]}
        accessibilityLabel={`${label}: ${selectedLabel(options, value)}`}
      >
        <Host matchContents colorScheme={t.mode} seedColor={t.color.text}>
          <Picker selectedValue={value} onValueChange={onChange} enabled={!disabled}>
            {options.map((o) => (
              <Picker.Item key={String(o.value)} label={o.label} value={o.value} />
            ))}
          </Picker>
        </Host>
      </View>
    );
  return (
    <View
      className="min-h-touch flex-row items-center gap-3"
      style={disabled ? { opacity: t.control.disabledOpacity } : undefined}
      accessibilityLabel={`${label}: ${selectedLabel(options, value)}`}
    >
      <Text className="text-foreground flex-1 text-sm" numberOfLines={1}>
        {label}
      </Text>
      <Host matchContents colorScheme={t.mode} seedColor={t.color.accent}>
        <Picker selectedValue={value} onValueChange={onChange} enabled={!disabled}>
          {options.map((o) => (
            <Picker.Item key={String(o.value)} label={o.label} value={o.value} />
          ))}
        </Picker>
      </Host>
    </View>
  );
}
