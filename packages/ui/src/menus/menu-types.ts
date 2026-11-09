import type { PhosphorIcon } from "../ds/icons";

/** One command in a pull-down or context menu. */
export interface MenuItem {
  key: string;
  label: string;
  /** Icon on web / Android (Phosphor, Figma `Icon/<name>`). */
  icon?: PhosphorIcon;
  /** SF Symbol name for the native iOS menu, e.g. "camera", "photo.on.rectangle", "trash". */
  systemImage?: string;
  /** Red, and always placed last (HIG). */
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}
