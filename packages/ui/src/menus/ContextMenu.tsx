import * as React from "react";
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Scrim } from "../chrome/Scrim";
import { ThemeLayer } from "../theme/ThemeProvider";
import { MENU_WIDTH, MenuList } from "./MenuList";
import type { MenuItem } from "./menu-types";

export type { MenuItem } from "./menu-types";

export interface ContextMenuProps {
  /** The element that is long-pressed (a prompt card, an image tile). */
  children: React.ReactElement;
  /** Shown lifted above the menu; defaults to the children. */
  preview?: React.ReactElement;
  items: readonly MenuItem[];
  /** VoiceOver name of the element; the menu is offered as its actions. */
  label: string;
  /** Render open (stories). Web / Android only. */
  defaultOpen?: boolean;
}

/**
 * Context menu (HIG): long-press an element → its preview lifts over a dimmed screen with the
 * menu under it. Destructive items last, in red; delete acts at once and offers Undo in a Toast
 * (no confirmation sheet, ADR-013). Web and Android: this RN version; iOS: the system context menu
 * with preview (`ContextMenu.ios.tsx`, `@expo/ui`). VoiceOver: the items are the element's
 * accessibility actions, so no long-press is needed.
 */
export function ContextMenu({ children, preview, items, label, defaultOpen }: ContextMenuProps) {
  const win = useWindowDimensions();
  const anchor = React.useRef<React.ComponentRef<typeof Pressable>>(null);
  const [rect, setRect] = React.useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );
  const open = () => anchor.current?.measureInWindow((x, y, w, h) => setRect({ x, y, w, h }));
  React.useEffect(() => {
    if (defaultOpen) requestAnimationFrame(open);
  }, [defaultOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => setRect(null);
  const enabled = items.filter((i) => !i.disabled);
  const menuTop = rect ? Math.min(rect.y + rect.h + 8, win.height - 8 - items.length * 46) : 0;
  const left = rect ? Math.max(8, Math.min(rect.x, win.width - MENU_WIDTH - 8)) : 0;
  return (
    <>
      <Pressable
        ref={anchor}
        onLongPress={open}
        delayLongPress={350}
        accessibilityLabel={label}
        accessibilityActions={enabled.map((i) => ({ name: i.key, label: i.label }))}
        onAccessibilityAction={(e) =>
          enabled.find((i) => i.key === e.nativeEvent.actionName)?.onSelect()
        }
      >
        {children}
      </Pressable>
      <Modal visible={!!rect} transparent animationType="fade" onRequestClose={close}>
        <ThemeLayer>
          <Scrim onPress={close} dismissLabel="Close menu" />
          {rect && (
            <>
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: rect.x,
                  top: rect.y,
                  width: rect.w,
                  transform: [{ scale: 1.03 }],
                }}
              >
                {preview ?? children}
              </View>
              <MenuList
                items={items}
                onClose={close}
                style={[StyleSheet.flatten({ position: "absolute", left, top: menuTop })]}
              />
            </>
          )}
        </ThemeLayer>
      </Modal>
    </>
  );
}
