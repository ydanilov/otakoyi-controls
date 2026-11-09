import { Button, Host, Menu, RNHostView } from "@expo/ui/swift-ui";
import { orderMenuItems } from "../ds/logic";
import { useTheme } from "../theme/ThemeProvider";
import type { PullDownMenuProps } from "./PullDownMenu";

export type { MenuItem } from "./menu-types";

/**
 * iOS pull-down menu: the system SwiftUI `Menu` (via `@expo/ui`, SDK 58) with our trigger hosted
 * inside it. Items use SF Symbols (`systemImage`); destructive items are last and red (role).
 */
export function PullDownMenu({ children, items }: PullDownMenuProps) {
  const t = useTheme();
  return (
    <Host matchContents colorScheme={t.mode} seedColor={t.color.accent}>
      <Menu label={<RNHostView matchContents>{children}</RNHostView>}>
        {orderMenuItems(items).map((i) => (
          <Button
            key={i.key}
            label={i.label}
            systemImage={i.systemImage as never}
            role={i.destructive ? "destructive" : "default"}
            onPress={i.onSelect}
          />
        ))}
      </Menu>
    </Host>
  );
}
