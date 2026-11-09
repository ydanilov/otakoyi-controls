import { Control, type ControlOf, type ControlType } from "@osc/schema";

type Input<T extends ControlType> = { type: T; id: string } & Record<string, unknown>;

/**
 * Builds a fully defaulted control for a story through the real zod schema, so stories always see
 * what the app sees after a config is parsed (layout lives per form factor, not on the control).
 * If the schema changes shape (e.g. per-form-factor layouts), this is the one place to update.
 */
export function makeControl<T extends ControlType>(input: Input<T>): ControlOf<T> {
  return Control.parse(input) as ControlOf<T>;
}
