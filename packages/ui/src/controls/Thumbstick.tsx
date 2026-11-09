import { BlurMask, Canvas, Circle, Path, Skia, type SkPath } from "@shopify/react-native-skia";
import {
  CENTRE,
  createThumbstick,
  thumbstickDeflection,
  type Deflection,
  type LitShape,
} from "@osc/controls";
import * as React from "react";
import { View } from "react-native";
import {
  GestureDetector,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from "react-native-gesture-handler";
import {
  useDerivedValue,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "../theme/ThemeProvider";
import { InsetCircle, RaisedCircle } from "./skia";
import { ControlFrame } from "./ControlFrame";
import type { ControlProps } from "./types";
import { InnerLight, useInnerLight, useTouchLight } from "./TouchLight";
import { useHeldValue } from "./useHeldValue";
import { useLayout } from "./useLayout";

/**
 * Thumbstick (ADR-015): relative 2-D joystick. While held it sends the deflection at `rateHz`
 * (the repeater lives in @osc/controls), springs back to the centre on release and sends 0, 0.
 * A tap sends the optional `press` click.
 */
export function Thumbstick({ control: c, value, onChange, disabled }: ControlProps<"thumbstick">) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const { width: w, height: h } = size;
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const remote = asDeflection(value);
  const [display, setDisplay, releaseDisplay] = useHeldValue<Deflection>(remote ?? CENTRE);
  const held = React.useRef(false);

  // Another device moving the stick (synced through the bridge): follow it while not held here.
  // No state is set here: the readout derives from `value` (useHeldValue).
  const rx = remote?.x;
  const ry = remote?.y;
  React.useEffect(() => {
    if (held.current || rx === undefined || ry === undefined) return;
    dx.value = rx;
    dy.value = ry;
  }, [rx, ry, dx, dy]);

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const stick = React.useMemo(
    () => createThumbstick({ rateHz: c.rateHz }, (d) => onChangeRef.current(d)),
    [c.rateHz],
  );
  React.useEffect(() => () => stick.dispose(), [stick]);

  const start = React.useCallback(
    (d: Deflection) => {
      held.current = true;
      setDisplay(d);
      stick.start(d);
    },
    [stick, setDisplay],
  );
  const move = React.useCallback(
    (d: Deflection) => {
      setDisplay(d);
      stick.move(d);
    },
    [stick, setDisplay],
  );
  const release = React.useCallback(() => {
    held.current = false;
    releaseDisplay();
    stick.release();
  }, [stick, releaseDisplay]);
  const click = React.useCallback(() => {
    onChangeRef.current({ pressed: true });
    onChangeRef.current({ pressed: false });
  }, []);

  const deadzone = c.deadzone;
  const light = useTouchLight({ disabled: !!disabled });
  const pan = usePanGesture({
    enabled: !disabled,
    minDistance: 2,
    shouldCancelWhenOutside: false,
    onBegin: (e) => {
      "worklet";
      light.down(e.x, e.y);
    },
    onActivate: (e) => {
      "worklet";
      const d = thumbstickDeflection({ x: e.x, y: e.y }, { width: w, height: h }, deadzone);
      dx.value = d.x;
      dy.value = d.y;
      scheduleOnRN(start, d);
    },
    onUpdate: (e) => {
      "worklet";
      light.move(e.x, e.y);
      const d = thumbstickDeflection({ x: e.x, y: e.y }, { width: w, height: h }, deadzone);
      dx.value = d.x;
      dy.value = d.y;
      scheduleOnRN(move, d);
    },
    onFinalize: () => {
      "worklet";
      light.up();
      dx.value = withSpring(0);
      dy.value = withSpring(0);
      scheduleOnRN(release);
    },
  });
  const tap = useTapGesture({
    enabled: !disabled && !!c.press,
    onActivate: () => {
      "worklet";
      scheduleOnRN(click);
    },
  });
  const gesture = useSimultaneousGestures(pan, tap);

  // Figma Thumbstick (a 180 pt body, scaled to the cell): raised base r 88, recessed collar r 75 with
  // a guide ring r 69 and four ticks; the raised stick r 48 with a knurl of dots, a dish r 34 and
  // a centre dot; while pushed, a lit arc on the collar points where the stick goes.
  const k = Math.max(0, Math.min(w, h)) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const reach = 47 * k;
  const capX = useDerivedValue(() => cx + dx.value * reach);
  const capY = useDerivedValue(() => cy - dy.value * reach);
  // Touch light: the stick itself lights up from where the finger is on it.
  const stickShape = useDerivedValue<LitShape>(() => ({
    kind: "circle",
    cx: capX.value,
    cy: capY.value,
    r: 48 * k,
  }));
  const lightProps = useInnerLight(light, stickShape);
  const knurl = useDerivedValue(() => {
    const b = Skia.PathBuilder.Make();
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const a2 = a + Math.PI / 36;
      b.addCircle(capX.value + Math.cos(a) * 45 * k, capY.value + Math.sin(a) * 45 * k, 1.5 * k);
      b.addCircle(capX.value + Math.cos(a2) * 41 * k, capY.value + Math.sin(a2) * 41 * k, 1.5 * k);
    }
    return b.build();
  });
  const ticks = React.useMemo(() => {
    const b = Skia.PathBuilder.Make();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      b.moveTo(cx + Math.cos(a) * 58 * k, cy + Math.sin(a) * 58 * k).lineTo(
        cx + Math.cos(a) * 66 * k,
        cy + Math.sin(a) * 66 * k,
      );
    }
    return b.build();
  }, [cx, cy, k]);
  // Direction arc: centred on the push, 30° + 90° × the deflection wide.
  const direction = useDerivedValue(() => {
    const b = Skia.PathBuilder.Make();
    const m = Math.min(1, Math.hypot(dx.value, dy.value));
    if (m > 0.02) {
      const deg = (Math.atan2(-dy.value, dx.value) * 180) / Math.PI;
      const span = 30 + 90 * m;
      const r = 77 * k;
      b.addArc(Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2), deg - span / 2, span);
    }
    return b.build();
  });
  const dishX = capX;
  const dishY = capY;
  return (
    <ControlFrame
      label={c.label}
      value={`${display.x.toFixed(2)}, ${display.y.toFixed(2)}`}
      disabled={disabled}
    >
      <GestureDetector gesture={gesture}>
        <View
          className="flex-1"
          onLayout={onLayout}
          accessible
          accessibilityLabel={c.label ?? c.id}
          accessibilityHint="Joystick. Hold and push to move; let go to stop."
        >
          {w > 0 && (
            <Canvas style={{ width: w, height: h }}>
              <RaisedCircle t={t} cx={cx} cy={cy} r={88 * k} color={t.color.surface} />
              <InsetCircle t={t} cx={cx} cy={cy} r={75 * k} color={t.control.track} />
              <Circle
                cx={cx}
                cy={cy}
                r={69 * k}
                color={t.control.trackBorder}
                style="stroke"
                strokeWidth={Math.max(1, k)}
              />
              <Path
                path={ticks}
                color={t.control.tick}
                style="stroke"
                strokeWidth={2 * k}
                strokeCap="butt"
              />
              <LitArc path={direction} color={t.control.fill} width={4 * k} />
              <RaisedCircle t={t} cx={capX} cy={capY} r={48 * k} color={t.color.surfaceRaised} />
              {/* Touch light: the stick lit from within, below its knurl and dish. */}
              <InnerLight {...lightProps} />
              <Path path={knurl} color={t.control.track} />
              <InsetCircle t={t} pressed cx={dishX} cy={dishY} r={34 * k} color={t.color.surface} />
              <InsetCircle t={t} cx={dishX} cy={dishY} r={5 * k} color={t.control.track} />
            </Canvas>
          )}
        </View>
      </GestureDetector>
    </ControlFrame>
  );
}

/** The lit direction arc on the collar (Glow/Primary). */
function LitArc({
  path,
  color,
  width,
}: {
  path: SharedValue<SkPath>;
  color: string;
  width: number;
}) {
  return (
    <>
      <Path path={path} color={color} style="stroke" strokeWidth={width} strokeCap="round">
        <BlurMask blur={4} style="outer" />
      </Path>
      <Path path={path} color={color} style="stroke" strokeWidth={width} strokeCap="round" />
    </>
  );
}

/** A deflection value (another device's stick), or undefined for anything else (a click). */
function asDeflection(v: unknown): Deflection | undefined {
  if (typeof v !== "object" || v === null || !("x" in v) || !("y" in v)) return undefined;
  const { x, y } = v as { x: unknown; y: unknown };
  return typeof x === "number" && typeof y === "number" ? { x, y } : undefined;
}
