import type { ControlValue } from "@osc/controls";
import type { ControlOf, ControlType } from "@osc/schema";

/** Contract every control component follows: draw `value`, report interactions through `onChange`. */
export interface ControlProps<T extends ControlType> {
  control: ControlOf<T>;
  value: ControlValue;
  onChange: (value: ControlValue) => void;
  /** View-only (another device holds control) or offline. Interaction is blocked, value still updates. */
  disabled?: boolean;
}
