import { messagesFor, type ControlValue } from "@osc/controls";
import type { Control, ControlType } from "@osc/schema";
import * as React from "react";
import { View } from "react-native";
import { Text } from "../components/ui/text";
import { controlRegistry } from "../controls/registry";
import type { ControlProps } from "../controls/types";
import { ControlServicesProvider, type ControlServices } from "../platform/services";
import { storyServices } from "./services";

/**
 * Renders a control from the registry with local state, sized like a grid cell, and prints the
 * OSC messages `messagesFor()` would send for the current value — so a story shows behaviour too.
 * Image, mic and prompt controls get in-memory story services (`storyServices`).
 */
export function ControlHarness({
  control,
  value,
  disabled,
  width = 220,
  height = 160,
  showOsc = true,
  services: overrides,
}: {
  control: Control;
  value: ControlValue;
  disabled?: boolean;
  width?: number;
  height?: number;
  showOsc?: boolean;
  /** Replace story services, e.g. a motion input whose permission is denied. */
  services?: Partial<ControlServices>;
}) {
  const [v, setV] = React.useState<ControlValue>(value);
  const [sent, setSent] = React.useState<string>("—");
  React.useEffect(() => setV(value), [value]);
  const Component = controlRegistry[control.type] as React.ComponentType<ControlProps<ControlType>>;
  const onChange = (next: ControlValue) => {
    const msgs = messagesFor(control, next, v);
    setV(next);
    setSent(
      msgs.length
        ? msgs
            .map(
              (m) =>
                `${m.address} ${m.args.map((a) => ("value" in a ? String(a.value) : a.type)).join(" ")}`,
            )
            .join("\n")
        : "(nothing)",
    );
  };
  const services = React.useMemo(() => ({ ...storyServices(), ...overrides }), [overrides]);
  return (
    <ControlServicesProvider value={services}>
      <View style={{ gap: 12 }}>
        <View style={{ width, height }}>
          <Component control={control as never} value={v} onChange={onChange} disabled={disabled} />
        </View>
        {showOsc && (
          <Text
            className="text-muted-foreground font-mono text-xs"
            accessibilityLabel="Last OSC message"
          >
            OSC → {sent}
          </Text>
        )}
      </View>
    </ControlServicesProvider>
  );
}
