import type { Control } from "@osc/schema";
import { isGroupValue, type ControlValue } from "./logic";

type OscValue = number | string | boolean | null;
type Condition = { control: string; equals: OscValue };

const same = (a: unknown, b: OscValue) =>
  a === b ||
  (typeof a === "string" && typeof b === "string" && a.toLowerCase() === b.toLowerCase());

/**
 * Does `control` (holding `value` in the store) satisfy `equals` from a Figma "Depends on"
 * condition (`when <control> = <value>`, ADR-014)? The value is compared the way the control
 * sends it: a toggle by on / off (1 / 0, true / false or its own on / off arguments), a segmented
 * or scene list by the selected option's value or label, a button group by a lit button id,
 * anything else by its value. A condition on an unknown control holds (it never locks the pult).
 */
export function conditionHolds(
  control: Control | undefined,
  value: ControlValue,
  equals: OscValue,
): boolean {
  if (!control) return true;
  switch (control.type) {
    case "toggle": {
      const on = value === true;
      if (typeof equals === "boolean") return on === equals;
      if (equals === 1 || equals === 0) return on === (equals === 1);
      if (typeof equals === "string" && /^(on|off)$/i.test(equals))
        return on === (equals.toLowerCase() === "on");
      return (on ? control.on : control.off).some((v) => same(v, equals));
    }
    case "segmented": {
      const opt = typeof value === "number" ? control.options[value] : undefined;
      return !!opt && (same(opt.value, equals) || same(opt.label, equals));
    }
    case "sceneList": {
      const s = control.scenes.find((x) => x.id === value);
      return !!s && (same(s.value, equals) || same(s.id, equals) || same(s.label, equals));
    }
    case "buttonGroup":
      return isGroupValue(value) && value.on.some((id) => same(id, equals));
    default:
      if (typeof value === "number" && typeof equals === "number")
        return Math.abs(value - equals) < 1e-9;
      return same(value, equals);
  }
}

/**
 * `enabledWhen` of a control: true when every condition holds (or there are none). The pult draws
 * the control in its Disabled state otherwise.
 */
export function isEnabled(
  conditions: readonly Condition[] | undefined,
  lookup: (id: string) => { control: Control | undefined; value: ControlValue },
): boolean {
  if (!conditions?.length) return true;
  return conditions.every((c) => {
    const { control, value } = lookup(c.control);
    return conditionHolds(control, value, c.equals);
  });
}
