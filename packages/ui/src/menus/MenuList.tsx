import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { Text } from "../components/ui/text";
import { Surface } from "../ds/depth";
import { Glyph } from "../ds/Glyph";
import { orderMenuItems } from "../ds/logic";
import { cn } from "../lib/utils";
import type { MenuItem } from "./menu-types";

export const MENU_WIDTH = 240;

/**
 * The floating list used by the web / Android menus (iOS uses the system menu): raised popover,
 * 44 pt rows, destructive items last and in red with a separator before them.
 */
export function MenuList({
  items,
  onClose,
  style,
}: {
  items: readonly MenuItem[];
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const ordered = orderMenuItems(items);
  const firstDestructive = ordered.findIndex((i) => i.destructive);
  return (
    <Surface
      depth="raised"
      radius="lg"
      fill={false}
      className="bg-popover overflow-hidden py-1"
      style={[{ width: MENU_WIDTH }, style]}
      accessibilityRole="menu"
    >
      {ordered.map((item, i) => (
        <View key={item.key}>
          {i === firstDestructive && i > 0 && <View className="bg-border my-1 h-px" />}
          <Pressable
            disabled={item.disabled}
            onPress={() => {
              onClose();
              item.onSelect();
            }}
            accessibilityRole="menuitem"
            accessibilityLabel={item.label}
            aria-disabled={!!item.disabled}
            className={cn(
              "min-h-touch flex-row items-center gap-3 px-4 active:bg-muted",
              item.disabled && "opacity-40",
            )}
          >
            <Text
              className={cn(
                "text-md flex-1",
                item.destructive ? "text-destructive" : "text-foreground",
              )}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            {item.icon && (
              <Glyph
                icon={item.icon}
                tone={item.destructive ? "critical" : "foreground"}
                size={18}
              />
            )}
          </Pressable>
        </View>
      ))}
    </Surface>
  );
}
