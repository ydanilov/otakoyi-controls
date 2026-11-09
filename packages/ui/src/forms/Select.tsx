import * as React from "react";
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "../components/ui/text";
import { CONTINUOUS, Surface, useDepthStyle } from "../ds/depth";
import { Glyph } from "../ds/Glyph";
import { CaretDownIcon, CaretUpDownIcon, CheckIcon } from "../ds/icons";
import { cn } from "../lib/utils";
import { ThemeLayer, useTheme } from "../theme/ThemeProvider";
import { selectedLabel, type SelectProps, type SelectValue } from "./select-types";

export type { SelectOption, SelectProps } from "./select-types";

const MENU_WIDTH = 220;

/**
 * Figma `Select` (web and Android): a settings row whose value opens a pull-down menu that mimics
 * the iOS one — the current option carries a checkmark, the menu floats under the value.
 * On iOS, `Select.ios.tsx` renders the real SwiftUI menu through `@expo/ui`.
 */
export function Select<T extends SelectValue>({
  label,
  value,
  options,
  onChange,
  disabled,
  defaultOpen,
  variant = "row",
  align = "start",
  caret = "updown",
}: SelectProps<T>) {
  const t = useTheme();
  const win = useWindowDimensions();
  const anchor = React.useRef<React.ComponentRef<typeof Pressable>>(null);
  const [open, setOpen] = React.useState(!!defaultOpen);
  const [rect, setRect] = React.useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );

  const show = () => {
    anchor.current?.measureInWindow((x, y, w, h) => {
      setRect({ x, y, w, h });
      setOpen(true);
    });
  };
  React.useEffect(() => {
    if (defaultOpen) requestAnimationFrame(show);
  }, [defaultOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = selectedLabel(options, value);
  // The menu opens under the value: right-aligned to a row's value, aligned to a button's side.
  const startAligned = variant === "button" && align === "start";
  const left = rect
    ? Math.max(
        8,
        Math.min(startAligned ? rect.x : rect.x + rect.w - MENU_WIDTH, win.width - MENU_WIDTH - 8),
      )
    : 0;
  const top = rect ? rect.y + rect.h + 4 : 0;

  const button = variant === "button";
  const raised = useDepthStyle("raisedSm");
  const trigger = (
    <Pressable
      ref={anchor}
      onPress={show}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${current}`}
      accessibilityHint="Opens a menu"
      aria-expanded={open}
      aria-disabled={!!disabled}
      hitSlop={button ? 0 : 8}
      className={cn(
        "flex-row items-center gap-1",
        // Figma Pult Select (pop-up button): 40 pt; the plain variant keeps the 44 pt touch row.
        button ? "bg-card h-10 gap-1.5 rounded-md px-3" : "min-h-touch",
        button && align === "end" && "justify-end",
      )}
      style={button ? [CONTINUOUS, raised] : undefined}
    >
      {button ? (
        <>
          <Text className="text-foreground text-md shrink" numberOfLines={1}>
            {current}
          </Text>
          <Glyph icon={caret === "down" ? CaretDownIcon : CaretUpDownIcon} tone="muted" size={16} />
        </>
      ) : (
        <>
          <Text className="text-brand-accent text-sm font-semibold" numberOfLines={1}>
            {current}
          </Text>
          <Glyph icon={CaretUpDownIcon} tone="accent" size={14} />
        </>
      )}
    </Pressable>
  );

  return (
    <View
      className={button ? "flex-1" : "min-h-touch flex-row items-center gap-3"}
      style={disabled ? { opacity: t.control.disabledOpacity } : undefined}
    >
      {!button && (
        <Text className="text-foreground flex-1 text-sm" numberOfLines={1}>
          {label}
        </Text>
      )}
      {trigger}

      <Modal
        visible={open && !!rect}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        supportedOrientations={["portrait", "landscape"]}
      >
        {/* The modal renders outside the tree: re-apply the brand so the menu keeps its theme. */}
        <ThemeLayer>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
          <Surface
            depth="raised"
            radius="lg"
            fill={false}
            className="bg-popover absolute overflow-hidden py-1"
            style={{ left, top, width: MENU_WIDTH }}
            accessibilityRole="menu"
          >
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <Pressable
                  key={String(o.value)}
                  onPress={() => {
                    setOpen(false);
                    if (!selected) onChange(o.value);
                  }}
                  accessibilityRole="menuitem"
                  aria-checked={selected}
                  accessibilityLabel={o.label}
                  className="min-h-touch flex-row items-center gap-2 px-3 active:bg-muted"
                >
                  <View className="w-4">
                    {selected && <Glyph icon={CheckIcon} tone="foreground" size={16} />}
                  </View>
                  <Text className={cn("text-foreground text-md flex-1")} numberOfLines={1}>
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </Surface>
        </ThemeLayer>
      </Modal>
    </View>
  );
}
