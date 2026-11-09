import { Button, ContextMenu as NativeContextMenu, Host, RNHostView } from "@expo/ui/swift-ui";
import { orderMenuItems } from "../ds/logic";
import { useTheme } from "../theme/ThemeProvider";
import type { ContextMenuProps } from "./ContextMenu";

export type { MenuItem } from "./menu-types";

/**
 * iOS context menu: the system SwiftUI context menu with a preview (via `@expo/ui`, SDK 58).
 * The element and its preview are React Native views hosted in SwiftUI (`RNHostView`).
 */
export function ContextMenu({ children, preview, items }: ContextMenuProps) {
  const t = useTheme();
  return (
    <Host matchContents colorScheme={t.mode} seedColor={t.color.accent}>
      <NativeContextMenu>
        <NativeContextMenu.Items>
          {orderMenuItems(items).map((i) => (
            <Button
              key={i.key}
              label={i.label}
              systemImage={i.systemImage as never}
              role={i.destructive ? "destructive" : "default"}
              onPress={i.onSelect}
            />
          ))}
        </NativeContextMenu.Items>
        <NativeContextMenu.Trigger>
          <RNHostView matchContents>{children}</RNHostView>
        </NativeContextMenu.Trigger>
        {preview ? (
          <NativeContextMenu.Preview>
            <RNHostView matchContents>{preview}</RNHostView>
          </NativeContextMenu.Preview>
        ) : null}
      </NativeContextMenu>
    </Host>
  );
}
