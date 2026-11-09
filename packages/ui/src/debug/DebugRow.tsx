import * as React from "react";
import { View } from "react-native";
import { Text } from "../components/ui/text";

const MONO_VALUE = "text-foreground font-mono text-sm";
const MONO_SUB = "text-muted-foreground font-mono text-[11px] leading-[15px]";

/**
 * Figma `Debug Row` (128:485): one row of the Debug page, inside a List Card (separator inset 16).
 * - `metric`: label left, value in mono right (Bridge, Round trip, Sent, Protocol…);
 * - `control`: label with the control's OSC address in mono below it; the last value sent in mono
 *   on the right with its send rate below.
 */
export function DebugRow(
  props:
    | { kind?: "metric"; label: string; value: string }
    | {
        kind: "control";
        label: string;
        /** OSC address or template, e.g. `/wall/brightness`, `/cue/{index}`. */
        address: string;
        /** Last value sent; "—" before the first message. */
        value: string;
        /** Send rate, e.g. `12 msg/s`, or "—". */
        rate: string;
      },
) {
  if (props.kind === "control") {
    const { label, address, value, rate } = props;
    return (
      <View
        className="min-h-[57px] flex-row items-center gap-3 px-4 py-2"
        accessible
        accessibilityLabel={`${label}, ${address}: ${value}, ${rate}`}
      >
        <View className="flex-1 gap-0.5">
          <Text className="text-foreground text-md" numberOfLines={1}>
            {label}
          </Text>
          <Text className={MONO_SUB} numberOfLines={1}>
            {address}
          </Text>
        </View>
        <View className="max-w-[50%] items-end gap-0.5">
          <Text className={MONO_VALUE} numberOfLines={1}>
            {value}
          </Text>
          <Text className={MONO_SUB} numberOfLines={1}>
            {rate}
          </Text>
        </View>
      </View>
    );
  }
  const { label, value } = props;
  return (
    <View
      className="min-h-12 flex-row items-center gap-3 px-4 py-2"
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text className="text-foreground text-md shrink" numberOfLines={1}>
        {label}
      </Text>
      <Text className={`${MONO_VALUE} flex-1 text-right`} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
