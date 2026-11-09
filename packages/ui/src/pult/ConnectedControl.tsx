import type { ControlValue } from "@osc/controls";
import type { AnyControl, Control } from "@osc/schema";
import * as React from "react";
import { UnsupportedPlaceholder } from "../controls/discrete";
import { controlRegistry } from "../controls/registry";
import type { ControlProps } from "../controls/types";
import { useControlEnabled, useControlMode, useControlValue, usePultStore } from "./context";

/**
 * One control wired to the store. Studio-only controls are hidden unless the session is a studio
 * session; a control whose `enabledWhen` does not hold is drawn disabled. `extra` passes pattern props through (a Fader Bank mutes a strip's fader).
 */
export function ConnectedControl({
  control,
  studio,
  extra,
}: {
  control: AnyControl;
  studio: boolean;
  extra?: Record<string, unknown>;
}) {
  const store = usePultStore();
  const value = useControlValue(control.id);
  const mode = useControlMode();
  const enabled = useControlEnabled(control);
  const onChange = React.useCallback(
    (v: ControlValue) => store.interact(control, v),
    [store, control],
  );
  if (control.type === "unsupported") return <UnsupportedPlaceholder control={control} />;
  if (control.studioOnly && !studio) return null;
  const Component = controlRegistry[control.type] as React.ComponentType<
    ControlProps<Control["type"]> & Record<string, unknown>
  >;
  return (
    <Component
      control={control as never}
      value={value}
      onChange={onChange}
      disabled={mode !== "control" || !enabled}
      {...extra}
    />
  );
}
