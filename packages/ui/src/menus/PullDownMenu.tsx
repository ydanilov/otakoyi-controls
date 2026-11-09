import * as React from "react";
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { ThemeLayer } from "../theme/ThemeProvider";
import { MENU_WIDTH, MenuList } from "./MenuList";
import type { MenuItem } from "./menu-types";

export type { MenuItem } from "./menu-types";

export interface PullDownMenuProps {
  /** The button that opens the menu (e.g. a DS `Button`); it receives `onPress`. */
  children: React.ReactElement;
  /** VoiceOver name of the trigger, e.g. "Add image". */
  label: string;
  items: readonly MenuItem[];
  /** Render open (stories). Web / Android only. */
  defaultOpen?: boolean;
}

/**
 * Pull-down menu (HIG): commands from a button, 3+ items — e.g. the image source picker
 * (Take Photo / Photo Library / Choose File / Uploads). Web and Android: an RN popover under the
 * trigger; iOS: the system menu (`PullDownMenu.ios.tsx`, `@expo/ui` `Menu`).
 */
export function PullDownMenu({ children, label, items, defaultOpen }: PullDownMenuProps) {
  const win = useWindowDimensions();
  const anchor = React.useRef<React.ComponentRef<typeof View>>(null);
  const [rect, setRect] = React.useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );
  const open = () => anchor.current?.measureInWindow((x, y, w, h) => setRect({ x, y, w, h }));
  React.useEffect(() => {
    if (defaultOpen) requestAnimationFrame(open);
  }, [defaultOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => setRect(null);
  const left = rect ? Math.max(8, Math.min(rect.x, win.width - MENU_WIDTH - 8)) : 0;
  return (
    <>
      {/* The trigger is the caller's button; it gets the press handler and menu semantics. */}
      <View ref={anchor} collapsable={false} style={{ alignSelf: "flex-start" }}>
        {React.cloneElement(
          children as React.ReactElement<{
            onPress?: () => void;
            accessibilityLabel?: string;
            accessibilityHint?: string;
            "aria-expanded"?: boolean;
          }>,
          {
            onPress: open,
            accessibilityLabel: label,
            accessibilityHint: "Opens a menu",
            "aria-expanded": !!rect,
          },
        )}
      </View>
      <Modal visible={!!rect} transparent animationType="fade" onRequestClose={close}>
        <ThemeLayer>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
          {rect && (
            <MenuList
              items={items}
              onClose={close}
              style={{ position: "absolute", left, top: rect.y + rect.h + 6 }}
            />
          )}
        </ThemeLayer>
      </Modal>
    </>
  );
}
