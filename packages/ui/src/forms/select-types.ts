export type SelectValue = string | number;

export interface SelectOption<T extends SelectValue = string> {
  label: string;
  value: T;
}

/** Shared by `Select.tsx` (web, Android: RN pull-down) and `Select.ios.tsx` (native SwiftUI menu). */
export interface SelectProps<T extends SelectValue = string> {
  /** Row label on the left ("Output"). */
  label: string;
  value: T;
  options: ReadonlyArray<SelectOption<T>>;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Render the menu open (Figma `State=Open`, stories). Web/Android only. */
  defaultOpen?: boolean;
  /**
   * `row` (default): a settings row — label left, value + caret right (Figma `Select`).
   * `button`: an iOS pop-up button on its own — a raised capsule with the value and the up/down
   * caret (Figma `Pult Select`, Icon/caret-up-down), e.g. the scene selects of the Mix pattern;
   * `label` is then only the VoiceOver name.
   */
  variant?: "row" | "button";
  /** Button variant: the value and caret sit at the start (default) or the end of the button. */
  align?: "start" | "end";
  /** Pop-up button glyph: ⌃⌄ for a choice (Mix), ⌄ for a pull-down (Prompt Mix, Figma caret-down). */
  caret?: "updown" | "down";
}

export const selectedLabel = <T extends SelectValue>(
  options: ReadonlyArray<SelectOption<T>>,
  value: T,
) => options.find((o) => o.value === value)?.label ?? String(value);
