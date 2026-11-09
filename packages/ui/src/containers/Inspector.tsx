import * as React from "react";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { IconButton } from "../chrome/Button";
import { useDepthStyle } from "../ds/depth";
import { XIcon } from "../ds/icons";
import { INSPECTOR_WIDTH, SHEET } from "../ds/logic";
import { useTheme } from "../theme/ThemeProvider";
import { SheetScaffold } from "./Sheet";

/**
 * iPad Installation inspector (ADR-013, HIG; Figma Tablet / 05 Installation): a 390 pt panel on the
 * trailing side of the pult screen with a round Close × floating top-right (the content shows its
 * own header). It does not dim the console — the operator keeps playing while it is open.
 * The body scrolls; the pult never does. On iPhone the same content goes into a system sheet
 * (`presentationFor("installation", width)`). Place it in the full-screen pult view.
 */
export function Inspector({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const shadow = useDepthStyle("raised");
  const offset = useSharedValue(open ? 0 : INSPECTOR_WIDTH);
  const [mounted, setMounted] = React.useState(open);

  React.useEffect(() => {
    if (open) setMounted(true);
    const to = open ? 0 : INSPECTOR_WIDTH;
    if (reduce) {
      offset.value = to;
      if (!open) setMounted(false);
      return;
    }
    offset.value = withTiming(to, { duration: t.motion.duration.base }, (finished) => {
      "worklet";
      if (finished && !open) scheduleOnRN(setMounted, false);
    });
  }, [open, reduce, offset, t.motion.duration.base]);

  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  if (!mounted) return null;
  return (
    // Reanimated views are not NativeWind-interop'd: layout and colour go in `style`.
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: INSPECTOR_WIDTH,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: t.color.background,
        },
        shadow,
        slide,
      ]}
      accessibilityLabel={title}
    >
      {/* Figma Tablet / 10 Installation (99:7287): the content brings its own header (24 pt from
          the top); the round close button floats top-right, 14 pt down, clear of the content. */}
      <SheetScaffold
        floatingHeader={{ top: SHEET.inspector.close, right: 16 }}
        header={<IconButton icon={XIcon} label={`Close ${title}`} onPress={onClose} />}
        contentContainerClassName="gap-6 px-4 pb-6 pt-6"
      >
        {children}
      </SheetScaffold>
    </Animated.View>
  );
}
