import * as React from "react";
import { Platform, Pressable, ScrollView, View, type ScrollViewProps } from "react-native";
import { Text } from "../components/ui/text";
import { Glyph } from "../ds/Glyph";
import { CaretLeftIcon, XIcon, type PhosphorIcon } from "../ds/icons";
import { SHEET } from "../ds/logic";
import { useTheme } from "../theme/ThemeProvider";

/**
 * Test hooks of the layout sensor (`layoutViolations`, run by `pnpm test-storybook` on every
 * story): the header's box must never intersect what the body shows, and the body must stay
 * inside the viewport. Do not rename them without updating `stories/layout.ts`.
 */
export const LAYOUT_TEST_ID = {
  scaffold: "layout-scaffold",
  header: "layout-header",
  body: "layout-body",
} as const;

/**
 * The one layout every sheet, drawer and inspector uses: a header, then a scrolling body that
 * starts below it. Both parts are real views in normal flow — the header never floats over the
 * content, and the content never slides under it.
 *
 * Why it is built this way (the Settings / Installation overlap on iPhone, Expo Go): the sheets
 * used to put a layout-only toolbar and a bare ScrollView side by side. Yoga lays that out
 * correctly (the web build matches Figma), but on iOS the ScrollView is a native view the system
 * sheet may re-frame: react-native-screens sets a `formSheet`'s ScrollView to the sheet's own frame
 * — origin (0, 0), full height — unless a non-collapsed header view sits before it, and Fabric
 * flattens a layout-only header away (no native view to measure). Then the content starts under
 * the toolbar. Now:
 * - the header and the body are real views (`collapsable={false}`), the ScrollView lives inside
 *   the body and the body clips: whatever frames the ScrollView natively, its coordinate space
 *   starts below the header;
 * - the ScrollView adds no system insets of its own (`contentInsetAdjustmentBehavior="never"`):
 *   the sheet already sits below the status bar, and the spacing comes from Figma, not from UIKit.
 *
 * `floatingHeader`: the iPad inspector's round Close × floats over the body's top-right corner
 * (Figma Tablet / 10 Installation); the body keeps its content clear of it (the sensor checks it).
 */
export function SheetScaffold({
  header,
  children,
  floatingHeader,
  contentContainerClassName,
  keyboardShouldPersistTaps,
  testID,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  /** Absolute position of a floating header (inspector Close ×); omit for a header in flow. */
  floatingHeader?: { top: number; right: number };
  /** Padding and gaps of the scrolling content (Figma spacing: `pt-3` = 12 pt below the header). */
  contentContainerClassName?: string;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
  /** Test id of the whole surface (e.g. `settings-panel`). */
  testID?: string;
}) {
  const headerView = (
    <View
      collapsable={false}
      testID={LAYOUT_TEST_ID.header}
      style={
        floatingHeader
          ? {
              position: "absolute",
              top: floatingHeader.top,
              right: floatingHeader.right,
              zIndex: 1,
            }
          : { flexShrink: 0, zIndex: 1 }
      }
    >
      {header}
    </View>
  );
  return (
    <View style={{ flex: 1 }} testID={testID}>
      <View style={{ flex: 1 }} testID={LAYOUT_TEST_ID.scaffold} collapsable={false}>
        {!floatingHeader && headerView}
        <View
          collapsable={false}
          testID={LAYOUT_TEST_ID.body}
          style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerClassName={contentContainerClassName}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            automaticallyAdjustsScrollIndicatorInsets={false}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          >
            {children}
          </ScrollView>
        </View>
        {floatingHeader && headerView}
      </View>
    </View>
  );
}

/**
 * A sheet route's surface (Figma iOS 27 · System › Sheet - iPhone): the system sheet colour. On
 * iOS the system draws the sheet and its grabber around it; the web pult draws the grabber itself.
 */
export function SheetSurface({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.color.sheet }}>{children}</View>;
}

/**
 * iPhone sheet toolbar (Figma "Toolbar - Top - iPhone" in Phone / 07 Settings, Phone / 10
 * Installation): 16 pt below the sheet's top edge a 44 pt row — round Close × leading, the title
 * centred; a pushed view puts Back leading and Close trailing — then 10 pt to the content
 * (`SHEET.toolbar`, 70 pt in all). Put it in `SheetScaffold`'s `header`.
 */
export function SheetToolbar({
  title,
  onClose,
  onBack,
}: {
  title: string;
  onClose: () => void;
  onBack?: (() => void) | undefined;
}) {
  const t = useTheme();
  const m = SHEET.toolbar;
  return (
    <View
      style={{
        height: m.height,
        paddingTop: m.top,
        paddingBottom: m.bottom,
        paddingHorizontal: 16,
        backgroundColor: t.color.sheet,
      }}
    >
      {Platform.OS === "web" && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 6,
            alignSelf: "center",
            width: 60,
            height: 4,
            borderRadius: 2,
            backgroundColor: t.color.sheetGrabber,
          }}
        />
      )}
      <View style={{ height: m.row, flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 44 }}>
          {onBack ? (
            <ToolbarButton icon={CaretLeftIcon} label="Back" onPress={onBack} />
          ) : (
            <ToolbarButton icon={XIcon} label={`Close ${title}`} onPress={onClose} />
          )}
        </View>
        <Text
          className="text-foreground flex-1 text-center text-lg font-semibold"
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
        <View style={{ width: 44 }}>
          {onBack && <ToolbarButton icon={XIcon} label={`Close ${title}`} onPress={onClose} />}
        </View>
      </View>
    </View>
  );
}

/** iOS sheet toolbar button (Figma Toolbar › Button Group): a 44 pt glass circle, white symbol. */
function ToolbarButton({
  icon,
  label,
  onPress,
}: {
  icon: PhosphorIcon;
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: t.color.sheetButton,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Glyph icon={icon} size={22} color={t.color.text} />
    </Pressable>
  );
}
