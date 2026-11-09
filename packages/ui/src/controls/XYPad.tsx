import {
  Canvas,
  Circle,
  Group,
  Line,
  RoundedRect,
  rect,
  rrect,
  vec,
} from "@shopify/react-native-skia";
import { createThrottle } from "@osc/controls";
import * as React from "react";
import { View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { useDerivedValue, useSharedValue, withSpring } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "../theme/ThemeProvider";
import { InsetRRect, LitCircle } from "./skia";
import { ControlFrame } from "./ControlFrame";
import type { ControlProps } from "./types";
import { TouchLightSkia, useTouchLight, useTouchLightSkia } from "./TouchLight";
import { useHeldValue } from "./useHeldValue";
import { useLayout } from "./useLayout";

type Point = { x: number; y: number };
const isPoint = (v: unknown): v is Point =>
  typeof v === "object" && v !== null && "x" in v && "y" in v;

/** Two-axis pad. Point is normalised 0..1 with y growing upwards; the schema maps it to each axis range. */
export function XYPad({ control: c, value, onChange, disabled }: ControlProps<"xy">) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const start = isPoint(value) ? value : { x: 0.5, y: 0.5 };
  const px = useSharedValue(start.x);
  const py = useSharedValue(start.y);
  const active = useSharedValue(0);
  const dragging = useSharedValue(false);
  const [display, hold, release] = useHeldValue<Point>(start);

  // Feedback (another device, the installation) moves the dot unless the finger is on it. No state
  // is set here: the readout derives from `value` (useHeldValue).
  React.useEffect(() => {
    if (dragging.value || !isPoint(value)) return;
    px.value = value.x;
    py.value = value.y;
  }, [value, px, py, dragging]);

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const throttle = React.useMemo(
    () => createThrottle<Point>(c.throttleHz, (v) => onChangeRef.current(v)),
    [c.throttleHz],
  );
  React.useEffect(() => () => throttle.cancel(), [throttle]);

  const report = React.useCallback(
    (x: number, y: number, final: boolean) => {
      const p = { x, y };
      throttle.push(p);
      if (final) {
        throttle.flush();
        release();
      } else hold(p);
    },
    [throttle, hold, release],
  );

  const { width: w, height: h } = size;
  const spring = c.springBack;
  const light = useTouchLight({ disabled: !!disabled });
  const lightProps = useTouchLightSkia(light, w, h, t.radius.md);
  const pan = usePanGesture({
    enabled: !disabled,
    minDistance: 0,
    shouldCancelWhenOutside: false,
    onBegin: (e) => {
      "worklet";
      dragging.value = true;
      active.value = 1;
      light.down(e.x, e.y);
      px.value = Math.min(1, Math.max(0, e.x / w));
      py.value = Math.min(1, Math.max(0, 1 - e.y / h));
      scheduleOnRN(report, px.value, py.value, false);
    },
    onUpdate: (e) => {
      "worklet";
      light.move(e.x, e.y);
      px.value = Math.min(1, Math.max(0, e.x / w));
      py.value = Math.min(1, Math.max(0, 1 - e.y / h));
      scheduleOnRN(report, px.value, py.value, false);
    },
    onFinalize: () => {
      "worklet";
      dragging.value = false;
      active.value = 0;
      light.up();
      if (spring) {
        px.value = withSpring(0.5);
        py.value = withSpring(0.5);
        scheduleOnRN(report, 0.5, 0.5, true);
      } else scheduleOnRN(report, px.value, py.value, true);
    },
  });

  const dotX = useDerivedValue(() => px.value * w);
  const dotY = useDerivedValue(() => (1 - py.value) * h);
  const vTop = useDerivedValue(() => vec(px.value * w, 0));
  const vBottom = useDerivedValue(() => vec(px.value * w, h));
  const hLeft = useDerivedValue(() => vec(0, (1 - py.value) * h));
  const hRight = useDerivedValue(() => vec(w, (1 - py.value) * h));
  const haloFill = useDerivedValue(() => active.value * 0.15);
  const glow = useDerivedValue(() => 0.4 + active.value * 0.6);
  const r = t.radius.md;

  const axis = (v: number, a: { min: number; max: number }) =>
    (a.min + v * (a.max - a.min)).toFixed(2);
  return (
    <ControlFrame
      label={c.label}
      value={`${axis(display.x, c.x)}, ${axis(display.y, c.y)}`}
      disabled={disabled}
    >
      <GestureDetector gesture={pan}>
        <View
          className="flex-1"
          onLayout={onLayout}
          accessible
          accessibilityLabel={c.label ?? c.id}
          accessibilityHint="Two-axis pad"
        >
          {w > 0 && (
            <Canvas style={{ width: w, height: h }}>
              <InsetRRect t={t} color={t.control.track} x={0} y={0} width={w} height={h} r={r} />
              <Group clip={rrect(rect(0, 0, w, h), r, r)}>
                {/* Touch light: under the finger, clipped to the pad, below the cursor. */}
                <TouchLightSkia {...lightProps} />
                {/* Crosshair through the cursor: the signal colour at 10 %. */}
                <Line p1={vTop} p2={vBottom} color={t.control.fill} strokeWidth={1} opacity={0.1} />
                <Line p1={hLeft} p2={hRight} color={t.control.fill} strokeWidth={1} opacity={0.1} />
                {/* While dragging: a 52 pt halo ring around the cursor. */}
                <Circle cx={dotX} cy={dotY} r={26} color={t.control.fill} opacity={haloFill} />
                <Circle
                  cx={dotX}
                  cy={dotY}
                  r={25.5}
                  color={t.control.fill}
                  style="stroke"
                  strokeWidth={1}
                  opacity={active}
                />
                {/* Cursor: a raised dot ringed in the signal colour, glowing. */}
                <LitCircle
                  cx={dotX}
                  cy={dotY}
                  r={t.size.xyDot / 2}
                  color={t.control.fill}
                  glow={glow}
                />
                <Circle
                  cx={dotX}
                  cy={dotY}
                  r={t.size.xyDot / 2 - 3}
                  color={t.color.surfaceRaised}
                />
              </Group>
            </Canvas>
          )}
        </View>
      </GestureDetector>
    </ControlFrame>
  );
}
