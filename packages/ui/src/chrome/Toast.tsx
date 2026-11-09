import * as React from "react";
import { Pressable, View } from "react-native";
import { Text } from "../components/ui/text";
import { Surface } from "../ds/depth";
import { Glyph } from "../ds/Glyph";
import type { PhosphorIcon } from "../ds/icons";
import { TOAST_MS } from "../ds/logic";

/**
 * Figma `Toast`: a short confirmation with an optional action, e.g. "Prompt deleted · Undo"
 * (ADR-013: undoable actions happen at once and offer Undo instead of asking first).
 * Dismisses itself after `durationMs` (5 s); the action dismisses it too.
 */
export function Toast({
  message,
  icon,
  actionLabel,
  onAction,
  onDismiss,
  durationMs = TOAST_MS,
}: {
  message: string;
  icon?: PhosphorIcon;
  actionLabel?: string;
  onAction?: () => void;
  /** Called when the toast times out or after the action. */
  onDismiss?: () => void;
  /** 0 keeps it until dismissed (reviews). */
  durationMs?: number;
}) {
  const dismiss = React.useRef(onDismiss);
  dismiss.current = onDismiss;
  React.useEffect(() => {
    if (!durationMs) return;
    const id = setTimeout(() => dismiss.current?.(), durationMs);
    return () => clearTimeout(id);
  }, [durationMs, message]);
  return (
    <Surface
      depth="raisedSm"
      radius="lg"
      className="min-h-14 flex-row items-center gap-3 self-stretch pl-4 pr-2"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {icon && <Glyph icon={icon} tone="muted" size={18} />}
      <Text className="text-foreground flex-1 text-sm" numberOfLines={2}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            onAction();
            dismiss.current?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          className="min-h-touch justify-center rounded-md px-3 active:bg-muted"
        >
          <Text className="text-foreground text-sm font-semibold">{actionLabel}</Text>
        </Pressable>
      ) : (
        <View className="w-2" />
      )}
    </Surface>
  );
}
