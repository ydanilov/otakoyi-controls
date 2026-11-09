import { View, useWindowDimensions } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { edgeSwipeEnabled, edgeSwipeOpens } from "../ds/logic";

/**
 * Edge-swipe shortcut (ADR-013): an invisible 20 pt strip on a screen edge; a swipe toward the
 * centre calls `onOpen`. Right edge → Installation (phone and tablet); left edge → Settings
 * (phones only — `edgeSwipeEnabled`). Never the only way in: the Pult Header has buttons for both.
 */
export function EdgeSwipe({ side, onOpen }: { side: "left" | "right"; onOpen: () => void }) {
  const win = useWindowDimensions();
  const dir = side === "left" ? 1 : -1;
  const distance = useSharedValue(0);
  const velocity = useSharedValue(0);
  const width = win.width;
  const enabled = edgeSwipeEnabled(side, width);
  const pan = usePanGesture({
    enabled,
    activeOffsetX: dir > 0 ? [-1000, 8] : [-8, 1000],
    failOffsetY: [-16, 16],
    onUpdate: (e) => {
      "worklet";
      distance.value = dir * e.translationX;
      velocity.value = dir * e.velocityX;
    },
    onFinalize: () => {
      "worklet";
      if (edgeSwipeOpens(distance.value, velocity.value, width)) scheduleOnRN(onOpen);
      distance.value = 0;
      velocity.value = 0;
    },
  });
  if (!enabled) return null;
  return (
    <GestureDetector gesture={pan}>
      <View
        className="absolute bottom-0 top-0"
        style={{ width: 20, [side]: 0 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </GestureDetector>
  );
}
