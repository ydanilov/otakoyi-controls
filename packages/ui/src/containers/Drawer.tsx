import * as React from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { IconButton } from "../chrome/Button";
import { Text } from "../components/ui/text";
import { CaretLeftIcon, XIcon } from "../ds/icons";
import { DRAWER, drawerCloses } from "../ds/logic";
import { useTheme } from "../theme/ThemeProvider";

/**
 * iPad Settings (ADR-013; Figma Demo › Tablet / 04 Settings 106:209, Client · Template 99:7941): a floating
 * drawer from the leading edge — 400 pt wide, 12 pt in from the left and the bottom, its top under
 * the status bar, radius 28, dark fill — over the dimmed pult. Slides in from the left; a swipe to
 * the left or a tap on the dim closes it (so does the round close button). The body scrolls; the
 * pult never does. iPhone keeps the system sheet (`presentationFor`).
 */
export function Drawer({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** VoiceOver name of the drawer ("Settings"). */
  label: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const offset = useSharedValue(open ? 0 : -(DRAWER.width + DRAWER.inset));
  const drag = useSharedValue(0);
  const speed = useSharedValue(0);
  const [mounted, setMounted] = React.useState(open);
  const shut = -(DRAWER.width + DRAWER.inset);

  React.useEffect(() => {
    if (open) setMounted(true);
    const to = open ? 0 : shut;
    drag.value = 0;
    if (reduce) {
      offset.value = to;
      if (!open) setMounted(false);
      return;
    }
    offset.value = withTiming(to, { duration: t.motion.duration.base }, (finished) => {
      "worklet";
      if (finished && !open) scheduleOnRN(setMounted, false);
    });
  }, [open, reduce, offset, drag, shut, t.motion.duration.base]);

  // Swipe left to close (the drawer follows the finger, never past its open position).
  const pan = usePanGesture({
    activeOffsetX: [-12, 1000],
    failOffsetY: [-20, 20],
    onUpdate: (e) => {
      "worklet";
      drag.value = Math.min(0, e.translationX);
      speed.value = e.velocityX;
    },
    onFinalize: () => {
      "worklet";
      if (drawerCloses(drag.value, speed.value)) scheduleOnRN(onClose);
      else drag.value = withTiming(0, { duration: 150 });
    },
  });

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value + drag.value }],
  }));
  const dim = useAnimatedStyle(() => ({
    opacity: (1 - Math.min(1, -(offset.value + drag.value) / (DRAWER.width + DRAWER.inset))) * 0.55,
  }));
  if (!mounted) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.color.overlay }, dim]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={`Close ${label}`}
          testID="drawer-dim"
        />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View
          // Reanimated views are not NativeWind-interop'd: layout and colour go in `style`.
          style={[
            {
              position: "absolute",
              left: DRAWER.inset,
              top: insets.top + DRAWER.top,
              bottom: insets.bottom + DRAWER.inset,
              width: DRAWER.width,
              borderRadius: DRAWER.radius,
              borderCurve: "continuous",
              overflow: "hidden",
              backgroundColor: t.control.track,
              borderWidth: 1,
              borderColor: t.elevation.edgeLight,
              boxShadow: `0px 20px 40px 0px ${t.elevation.shadow}`,
            },
            slide,
          ]}
          accessibilityViewIsModal
          accessibilityLabel={label}
          testID="drawer"
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/**
 * The drawer's header (Figma): a large title (28 semibold) and a round close button; a pushed page
 * puts a back button before the title.
 */
export function DrawerHeader({
  title,
  onClose,
  onBack,
}: {
  title: string;
  onClose: () => void;
  onBack?: (() => void) | undefined;
}) {
  return (
    <View className="min-h-[72px] flex-row items-center gap-3 pb-2 pl-5 pr-4 pt-5">
      {onBack && <IconButton icon={CaretLeftIcon} label="Back" size={36} onPress={onBack} />}
      <Text
        className="text-foreground flex-1 text-2xl font-semibold"
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <IconButton icon={XIcon} label={`Close ${title}`} onPress={onClose} />
    </View>
  );
}

/** Width of the window the drawer may take (never wider than the window minus its insets). */
export function useDrawerWidth() {
  const { width } = useWindowDimensions();
  return Math.min(DRAWER.width, width - DRAWER.inset * 2);
}
