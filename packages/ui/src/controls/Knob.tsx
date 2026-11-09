import {
  BlurMask,
  Circle,
  Group,
  Path,
  Shadow,
  Skia,
  SweepGradient,
  vec,
  type SkPath,
} from "@shopify/react-native-skia";
import type { Theme } from "@osc/tokens";
import {
  FINE_POINTERS,
  KNOB_TRAVEL,
  createDeltaAccumulator,
  createThrottle,
  fineBadge,
  formatOffset,
  formatValue,
  stepDecimals,
  hsbToHex,
  hsvToHex,
  hueDrag,
  hueRingColors,
  jogDelta,
  knobMode,
  knobStart,
  positionToValue,
  relativeDrag,
  resetValue,
  spreadDialTicks,
  startDrag,
  valueToPosition,
  wrapHue,
  type DragState,
  type Range,
} from "@osc/controls";
import * as React from "react";
import { View } from "react-native";
import {
  GestureDetector,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from "react-native-gesture-handler";
import { useDerivedValue, useSharedValue, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "../theme/ThemeProvider";
import { InsetCircle, LitCircle, OverhangCanvas, RaisedCircle } from "./skia";
import { InnerLight, useInnerLight, useTouchLight, type TouchLight } from "./TouchLight";
import { animateGlow, useFineSpread, useGlow } from "./states";
import { ControlFrame } from "./ControlFrame";
import type { ControlProps } from "./types";
import { useHeldValue } from "./useHeldValue";
import { useLayout } from "./useLayout";
import { useRelativeOffset } from "../pult/context";

/** Pixels of drag for a full sweep. Relative drag avoids jumps when the knob is touched. */
const SWEEP_PX = 220;

/**
 * How the Color Picker (Style=Knobs) paints its knobs; plain knobs leave it out.
 * - `hueRing`: the hue knob's ring segments and centre swatch are `hsb(hue, s, b)` — they
 *   re-render with the current saturation and brightness (48 segments over the 240° face).
 * - `gradient`: an absolute knob's arc is a gradient `from` → `to` (track: the full gradient at
 *   ~22 %; value arc: the gradient up to the value); the indicator is white, not lit.
 */
export type KnobPaint =
  { kind: "hueRing"; s: number; b: number } | { kind: "gradient"; from: string; to: string };

export type KnobProps = ControlProps<"knob"> & { paint?: KnobPaint };

/** Hue ring segments in the Color Picker (Figma: 48 over the 240° face). */
const RING_SEGMENTS = 48;
/** Opacity of a gradient knob's track (the full gradient, dimmed). */
const GRADIENT_TRACK_OPACITY = 0.22;

/** The hue ring's colours, computed (not hand-picked): 0°, 60°, … 360°. */
const HUE_STOPS = Array.from({ length: 7 }, (_, i) => hsvToHex(i / 6, 1, 1));

/**
 * Rotary knob (ADR-015), relative drag up/right to increase (a touch never moves it).
 * - `absolute`: arc over `travel` degrees (240° by default), hard stops at min and max.
 * - `relative`: endless encoder, the needle turns freely and the change is sent.
 * - `hue`: colour wheel, 0..360° that wraps around.
 * Two fingers = fine mode (`fineFactor`): the badge shows the coefficient and the tick ring
 * spreads apart around the needle. Double-tap = back to default (absolute and hue). The lit arc
 * glows, fully while touched (`@osc/controls` states).
 */
export function Knob(props: KnobProps) {
  const mode = knobMode(props.control);
  if (mode === "relative") return <EncoderKnob {...props} />;
  if (mode === "hue") return <HueKnob {...props} />;
  return <AbsoluteKnob {...props} />;
}

/**
 * Dial geometry shared by the three knobs, from the Figma Knob (a 160 pt body): arc ring
 * r 59.4–66, well r 57, raised disc r 48, cap r 33, indicator at r 40, stops at r 72–80.
 * Compact (`size: "compact"`) draws the dial at ~0.7×; labels keep their size.
 */
function useDial(size: { width: number; height: number }, compact: boolean) {
  const t = useTheme();
  const { width: w, height: h } = size;
  // Figma Knob: the 160 pt body under the header; the disc's shadow may spill out (OverhangCanvas).
  const fit = Math.max(0, Math.min(w, h));
  const d = compact ? fit * t.size.knobCompactScale : fit;
  const k = d / 160;
  return {
    w,
    h,
    d,
    k,
    cx: w / 2,
    cy: h / 2,
    arcR: 62.7 * k,
    arcW: 6.6 * k,
    well: 57 * k,
    disc: 48 * k,
    cap: 33 * k,
  };
}

type Dial = ReturnType<typeof useDial>;

/** Knob touch light: the raised disc itself lights up from where the finger is on it. */
function useKnobLight(light: TouchLight, dial: Dial) {
  const { cx, cy, disc } = dial;
  return useInnerLight(light, { kind: "circle", cx, cy, r: disc });
}

/** End stops of the travel: short ticks just outside the arc (Figma `Stop`). */
function stopsPath(dial: Dial, start: number, travel: number) {
  const b = Skia.PathBuilder.Make();
  for (const deg of [start, start + travel]) {
    const a = ((deg - 90) * Math.PI) / 180;
    const r1 = 72 * dial.k;
    const r2 = 79 * dial.k;
    b.moveTo(dial.cx + Math.cos(a) * r1, dial.cy + Math.sin(a) * r1).lineTo(
      dial.cx + Math.cos(a) * r2,
      dial.cy + Math.sin(a) * r2,
    );
  }
  return b.build();
}

/**
 * Well, raised disc and cap: the body every knob shares (Figma Well / Disc / Cap). The touch
 * light (`light`) sits on the disc, below the cap and the indicator.
 */
function DialBody({
  dial,
  t,
  cap,
  light,
}: {
  dial: Dial;
  t: Theme;
  cap?: number;
  light?: React.ReactNode;
}) {
  return (
    <>
      <InsetCircle t={t} cx={dial.cx} cy={dial.cy} r={dial.well} color={t.color.background} />
      <RaisedCircle t={t} cx={dial.cx} cy={dial.cy} r={dial.disc} color={t.color.surfaceRaised} />
      {light}
      <InsetCircle
        t={t}
        pressed
        cx={dial.cx}
        cy={dial.cy}
        r={cap ?? dial.cap}
        color={t.color.surface}
      />
    </>
  );
}

/** A lit stroke (value arc) with Glow/Primary scaled by `glow`. */
function LitStroke({
  path,
  color,
  width,
  glow,
}: {
  path: SkPath | SharedValue<SkPath>;
  color: string;
  width: number;
  glow: SharedValue<number>;
}) {
  return (
    <>
      <Path path={path} color={color} style="stroke" strokeWidth={width} opacity={glow}>
        <BlurMask blur={4} style="outer" />
      </Path>
      <Path path={path} color={color} style="stroke" strokeWidth={width} opacity={glow}>
        <BlurMask blur={1} style="outer" />
      </Path>
      <Path path={path} color={color} style="stroke" strokeWidth={width} />
    </>
  );
}

/** Needle end points for an angle (degrees, 0 = up, clockwise). */
const needle = (deg: number, cx: number, cy: number, from: number, to: number) => {
  "worklet";
  const a = ((deg - 90) * Math.PI) / 180;
  return {
    p1: vec(cx + Math.cos(a) * from, cy + Math.sin(a) * from),
    p2: vec(cx + Math.cos(a) * to, cy + Math.sin(a) * to),
  };
};

function AbsoluteKnob({ control: c, value, onChange, disabled, paint }: KnobProps) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const range: Range = React.useMemo(
    () => ({ min: c.min, max: c.max, step: c.step, curve: c.curve, invert: c.invert, int: c.int }),
    [c.min, c.max, c.step, c.curve, c.invert, c.int],
  );
  const initial = typeof value === "number" ? value : c.centered ? (c.min + c.max) / 2 : c.min;
  const pos = useSharedValue(valueToPosition(initial, range));
  const drag = useSharedValue<DragState>(startDrag(0, 1));
  const dragging = useSharedValue(false);
  const [display, hold, release] = useHeldValue(initial);
  const [fine, setFine] = React.useState(false);
  const glow = useGlow();
  const light = useTouchLight({ disabled: !!disabled });
  const spread = useFineSpread(fine);

  // Feedback moves the knob unless the finger is on it; the readout derives from `value`.
  React.useEffect(() => {
    if (dragging.value || typeof value !== "number") return;
    pos.value = valueToPosition(value, range);
  }, [value, range, pos, dragging]);

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const throttle = React.useMemo(
    () => createThrottle<number>(c.throttleHz, (v) => onChangeRef.current(v)),
    [c.throttleHz],
  );
  React.useEffect(() => () => throttle.cancel(), [throttle]);

  const report = React.useCallback(
    (p: number, final: boolean) => {
      const v = positionToValue(p, range);
      if (c.sendOn === "change") throttle.push(v);
      if (final) {
        setFine(false);
        if (c.sendOn === "release") onChangeRef.current(v);
        else throttle.flush();
        release();
      } else hold(v);
    },
    [range, c.sendOn, throttle, hold, release],
  );

  const reset = React.useCallback(() => {
    const v = resetValue(c);
    pos.value = valueToPosition(v, range);
    throttle.cancel();
    release();
    onChangeRef.current(v);
  }, [c, range, pos, throttle, release]);

  const fineFactor = c.fineFactor;
  const pan = usePanGesture({
    enabled: !disabled,
    minDistance: 4,
    onBegin: (e) => {
      "worklet";
      animateGlow(glow, true);
      light.down(e.x, e.y);
    },
    onActivate: (e) => {
      "worklet";
      dragging.value = true;
      drag.value = startDrag(pos.value, e.numberOfPointers);
      // Both fingers landed together: fine mode from the start.
      if (e.numberOfPointers >= FINE_POINTERS) scheduleOnRN(setFine, true);
    },
    onUpdate: (e) => {
      "worklet";
      light.move(e.x, e.y);
      const wasFine = drag.value.pointers >= 2;
      const r = relativeDrag(
        drag.value,
        pos.value,
        e.translationX - e.translationY,
        e.numberOfPointers,
        SWEEP_PX,
        fineFactor,
      );
      drag.value = r.state;
      pos.value = r.pos;
      if (r.fine !== wasFine) scheduleOnRN(setFine, r.fine);
      scheduleOnRN(report, pos.value, false);
    },
    onFinalize: () => {
      "worklet";
      animateGlow(glow, false);
      light.up();
      if (!dragging.value) return;
      dragging.value = false;
      scheduleOnRN(report, pos.value, true);
    },
  });
  const doubleTap = useTapGesture({
    enabled: !disabled && c.doubleTapReset,
    numberOfTaps: 2,
    onActivate: () => {
      "worklet";
      scheduleOnRN(reset);
    },
  });
  const gesture = useSimultaneousGestures(pan, doubleTap);

  const dial = useDial(size, c.size === "compact");
  const lightProps = useKnobLight(light, dial);
  const { w, h, d, cx, cy, arcR, arcW, k } = dial;
  const travel = c.travel;
  const start = knobStart(travel);
  const oval = Skia.XYWHRect(cx - arcR, cy - arcR, arcR * 2, arcR * 2);
  // Skia measures angles from 3 o'clock; ours from 12 o'clock.
  const skStart = start - 90;
  const track = Skia.PathBuilder.Make().addArc(oval, skStart, travel).build();
  const centerPos = c.centered ? 0.5 : 0;
  const fillPath = useDerivedValue(() => {
    const from = skStart + centerPos * travel;
    return Skia.PathBuilder.Make()
      .addArc(oval, from, (pos.value - centerPos) * travel)
      .build();
  });
  const dot = useDerivedValue(() => needle(start + pos.value * travel, cx, cy, 0, 40 * k).p2);
  const dotX = useDerivedValue(() => dot.value.x);
  const dotY = useDerivedValue(() => dot.value.y);
  const lit = fine ? t.color.accent : t.control.fill;
  const gradient = paint?.kind === "gradient" ? paint : null;
  const stops = stopsPath(dial, start, travel);
  const step = c.step ?? (c.max - c.min) / 100;
  return (
    <ControlFrame
      label={c.label}
      align="center"
      value={
        c.showValue
          ? formatValue(display, { unit: c.unit, decimals: stepDecimals(c.step) })
          : undefined
      }
      badge={fine ? fineBadge(fineFactor) : undefined}
      disabled={disabled}
    >
      <GestureDetector gesture={gesture}>
        <View
          className="flex-1"
          onLayout={onLayout}
          accessible
          accessibilityRole="adjustable"
          accessibilityState={{ disabled: !!disabled }}
          aria-disabled={!!disabled}
          accessibilityLabel={c.label ?? c.id}
          accessibilityValue={{
            text: formatValue(display, { unit: c.unit, decimals: stepDecimals(c.step) }),
          }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => {
            const next = Math.min(
              c.max,
              Math.max(c.min, display + (e.nativeEvent.actionName === "increment" ? step : -step)),
            );
            pos.value = valueToPosition(next, range);
            release();
            onChange(next);
          }}
        >
          {d > 0 && (
            <OverhangCanvas width={w} height={h}>
              <Path path={track} color={t.control.track} style="stroke" strokeWidth={arcW}>
                <Shadow dx={0} dy={3} blur={4} color={t.elevation.insetShadow} inner />
                <Shadow dx={0} dy={-1} blur={2} color={t.elevation.insetHighlight} inner />
              </Path>
              {gradient ? (
                <>
                  {/* Colour Picker: the full gradient dimmed on the track, then the value arc. */}
                  <Path
                    path={track}
                    style="stroke"
                    strokeWidth={arcW}
                    opacity={GRADIENT_TRACK_OPACITY}
                  >
                    <SweepGradient
                      c={vec(cx, cy)}
                      colors={[gradient.from, gradient.to]}
                      positions={[0, travel / 360]}
                      transform={[{ rotate: (skStart * Math.PI) / 180 }]}
                      origin={vec(cx, cy)}
                    />
                  </Path>
                  <Path path={fillPath} style="stroke" strokeWidth={arcW}>
                    <SweepGradient
                      c={vec(cx, cy)}
                      colors={[gradient.from, gradient.to]}
                      positions={[0, travel / 360]}
                      transform={[{ rotate: (skStart * Math.PI) / 180 }]}
                      origin={vec(cx, cy)}
                    />
                  </Path>
                </>
              ) : (
                /* The lit value arc: full glow while touched, ~40 % at rest. */
                <LitStroke path={fillPath} color={lit} width={arcW} glow={glow} />
              )}
              <Path
                path={stops}
                color={t.control.tick}
                style="stroke"
                strokeWidth={2.5 * k}
                strokeCap="round"
              />
              <DialBody dial={dial} t={t} light={<InnerLight {...lightProps} />} />
              {gradient ? (
                <Circle cx={dotX} cy={dotY} r={2.5 * k * 1.4} color={t.control.thumb} />
              ) : (
                <LitCircle cx={dotX} cy={dotY} r={3.5 * k} color={lit} glow={glow} />
              )}
            </OverhangCanvas>
          )}
        </View>
      </GestureDetector>
    </ControlFrame>
  );
}

/** Endless encoder: full ring, the needle turns with the finger, the change is sent. */
function EncoderKnob({ control: c, onChange, disabled }: ControlProps<"knob">) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const angle = useSharedValue(0);
  const last = useSharedValue(0);
  const [fine, setFine] = React.useState(false);
  const total = useRelativeOffset(c.id);
  const glow = useGlow();
  const light = useTouchLight({ disabled: !!disabled });
  const spread = useFineSpread(fine);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const acc = React.useMemo(
    () => createDeltaAccumulator(c.throttleHz, (delta) => onChangeRef.current({ delta })),
    [c.throttleHz],
  );
  React.useEffect(() => () => acc.cancel(), [acc]);
  const span = c.max - c.min;
  const travel = c.travel;
  const fineFactor = c.fineFactor;
  const push = React.useCallback(
    (px: number, pointers: number) => {
      const isFine = pointers >= FINE_POINTERS;
      setFine(isFine);
      const d = jogDelta(px, SWEEP_PX, span, isFine ? fineFactor : 1);
      total.add(d);
      acc.push(d);
    },
    [acc, span, fineFactor, total.add],
  );
  const end = React.useCallback(() => {
    setFine(false);
    acc.flush();
  }, [acc]);

  const pan = usePanGesture({
    enabled: !disabled,
    minDistance: 4,
    onBegin: (e) => {
      "worklet";
      animateGlow(glow, true);
      light.down(e.x, e.y);
    },
    onActivate: () => {
      "worklet";
      last.value = 0;
    },
    onUpdate: (e) => {
      "worklet";
      light.move(e.x, e.y);
      const dist = e.translationX - e.translationY;
      const step = dist - last.value;
      last.value = dist;
      const factor = e.numberOfPointers >= 2 ? fineFactor : 1;
      angle.value = angle.value + (step / SWEEP_PX) * travel * factor;
      scheduleOnRN(push, step, e.numberOfPointers);
    },
    onFinalize: () => {
      "worklet";
      animateGlow(glow, false);
      light.up();
      scheduleOnRN(end);
    },
  });

  const dial = useDial(size, c.size === "compact");
  const lightProps = useKnobLight(light, dial);
  const { w, h, d, cx, cy, k } = dial;
  const start = knobStart(KNOB_TRAVEL);
  // The indicator turns freely; the dot ring (every 10° of the 240° face) lights the two dots
  // next to it and spreads ×1.8 around it in fine mode.
  const indicator = useDerivedValue(() => needle(angle.value, cx, cy, 0, 30 * k).p2);
  const indX = useDerivedValue(() => indicator.value.x);
  const indY = useDerivedValue(() => indicator.value.y);
  const wrapped = useDerivedValue(() => ((((angle.value + 180) % 360) + 360) % 360) - 180);
  const dots = useDerivedValue(() => {
    const unlit = Skia.PathBuilder.Make();
    const lit = Skia.PathBuilder.Make();
    const ring = spreadDialTicks(25, start, KNOB_TRAVEL, wrapped.value, spread.value, 0);
    for (const deg of ring) {
      const a = ((deg - 90) * Math.PI) / 180;
      const x = cx + Math.cos(a) * 64 * k;
      const y = cy + Math.sin(a) * 64 * k;
      if (Math.abs(deg - wrapped.value) <= 10 * spread.value) lit.addCircle(x, y, 2.5 * k);
      else unlit.addCircle(x, y, 2 * k);
    }
    return { unlit: unlit.build(), lit: lit.build() };
  });
  const unlitDots = useDerivedValue(() => dots.value.unlit);
  const litDots = useDerivedValue(() => dots.value.lit);
  // Knurled disc edge: ribs that turn with the encoder.
  const knurl = useDerivedValue(() => {
    const b = Skia.PathBuilder.Make();
    for (let i = 0; i < 56; i++) {
      const a = ((angle.value + (i * 360) / 56 - 90) * Math.PI) / 180;
      b.moveTo(cx + Math.cos(a) * 40.5 * k, cy + Math.sin(a) * 40.5 * k).lineTo(
        cx + Math.cos(a) * 45 * k,
        cy + Math.sin(a) * 45 * k,
      );
    }
    return b.build();
  });
  const lit = fine ? t.color.accent : t.control.fill;
  const stops = stopsPath(dial, start, KNOB_TRAVEL);
  return (
    <ControlFrame
      label={c.label}
      align="center"
      value={c.showValue ? formatOffset(total.value, { int: c.int, unit: c.unit }) : undefined}
      badge={fine ? fineBadge(fineFactor) : undefined}
      relative
      disabled={disabled}
    >
      <GestureDetector gesture={pan}>
        <View
          className="flex-1"
          onLayout={onLayout}
          accessible
          accessibilityRole="adjustable"
          accessibilityState={{ disabled: !!disabled }}
          aria-disabled={!!disabled}
          accessibilityLabel={c.label ?? c.id}
          accessibilityHint="Endless. Turn to nudge."
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) =>
            onChange({
              delta: (c.step ?? span / 100) * (e.nativeEvent.actionName === "increment" ? 1 : -1),
            })
          }
        >
          {d > 0 && (
            <OverhangCanvas width={w} height={h}>
              <Path path={unlitDots} color={t.control.tick} />
              <Path path={litDots} color={lit} opacity={glow}>
                <BlurMask blur={4} style="outer" />
              </Path>
              <Path path={litDots} color={lit} />
              <Path
                path={stops}
                color={t.control.tick}
                style="stroke"
                strokeWidth={2.5 * k}
                strokeCap="round"
              />
              <InsetCircle t={t} cx={cx} cy={cy} r={dial.well} color={t.color.background} />
              <RaisedCircle t={t} cx={cx} cy={cy} r={dial.disc} color={t.color.surfaceRaised} />
              {/* Touch light: on the disc, below the knurl, cap and indicator. */}
              <InnerLight {...lightProps} />
              <Path
                path={knurl}
                color={t.control.track}
                style="stroke"
                strokeWidth={1.5 * k}
                strokeCap="round"
              />
              <InsetCircle t={t} pressed cx={cx} cy={cy} r={35 * k} color={t.color.surface} />
              <Circle cx={indX} cy={indY} r={3 * k} color={t.control.thumb} />
            </OverhangCanvas>
          )}
        </View>
      </GestureDetector>
    </ControlFrame>
  );
}

/** Colour wheel: hue ring, the cap shows the current colour, wraps past 360°. */
function HueKnob({ control: c, value, onChange, disabled, paint }: KnobProps) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const initial = typeof value === "number" ? wrapHue(value) : wrapHue(c.default ?? 0);
  const hue = useSharedValue(initial);
  const startHue = useSharedValue(initial);
  const dragging = useSharedValue(false);
  const [display, hold, release] = useHeldValue(initial);
  const [fine, setFine] = React.useState(false);
  const glow = useGlow();
  const light = useTouchLight({ disabled: !!disabled });

  // Feedback turns the wheel unless the finger is on it; the readout derives from `value`.
  React.useEffect(() => {
    if (dragging.value || typeof value !== "number") return;
    hue.value = wrapHue(value);
  }, [value, hue, dragging]);

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const throttle = React.useMemo(
    () => createThrottle<number>(c.throttleHz, (v) => onChangeRef.current(v)),
    [c.throttleHz],
  );
  React.useEffect(() => () => throttle.cancel(), [throttle]);
  const report = React.useCallback(
    (h: number, final: boolean, isFine: boolean) => {
      const v = c.int ? Math.round(h) % 360 : h;
      setFine(isFine && !final);
      throttle.push(v);
      if (final) {
        throttle.flush();
        release();
      } else hold(v);
    },
    [throttle, c.int, hold, release],
  );
  const reset = React.useCallback(() => {
    const v = wrapHue(c.default ?? 0);
    hue.value = v;
    throttle.cancel();
    release();
    onChangeRef.current(v);
  }, [c.default, hue, throttle, release]);

  const fineFactor = c.fineFactor;
  const pan = usePanGesture({
    enabled: !disabled,
    minDistance: 4,
    onBegin: (e) => {
      "worklet";
      animateGlow(glow, true);
      light.down(e.x, e.y);
    },
    onActivate: () => {
      "worklet";
      dragging.value = true;
      startHue.value = hue.value;
    },
    onUpdate: (e) => {
      "worklet";
      light.move(e.x, e.y);
      const factor = e.numberOfPointers >= 2 ? fineFactor : 1;
      // One full turn per 1.5 sweeps of drag: precise enough to land on a colour.
      hue.value = hueDrag(startHue.value, e.translationX - e.translationY, SWEEP_PX * 1.5, factor);
      scheduleOnRN(report, hue.value, false, e.numberOfPointers >= 2);
    },
    onFinalize: () => {
      "worklet";
      animateGlow(glow, false);
      light.up();
      if (!dragging.value) return;
      dragging.value = false;
      scheduleOnRN(report, hue.value, true, false);
    },
  });
  const doubleTap = useTapGesture({
    enabled: !disabled && c.doubleTapReset,
    numberOfTaps: 2,
    onActivate: () => {
      "worklet";
      scheduleOnRN(reset);
    },
  });
  const gesture = useSimultaneousGestures(pan, doubleTap);

  const dial = useDial(size, c.size === "compact");
  const lightProps = useKnobLight(light, dial);
  const { w, h, d, cx, cy, k } = dial;
  const start = knobStart(KNOB_TRAVEL);
  // The spectrum runs over the 240° face: hue 0 at the start stop, 360 at the end stop.
  const bandR = 61.5 * k;
  const band = 9 * k;
  const spectrum = Skia.PathBuilder.Make()
    .addArc(Skia.XYWHRect(cx - bandR, cy - bandR, bandR * 2, bandR * 2), 0, KNOB_TRAVEL)
    .build();
  const dot = useDerivedValue(
    () => needle(start + (hue.value / 360) * KNOB_TRAVEL, cx, cy, 0, bandR).p2,
  );
  const dotX = useDerivedValue(() => dot.value.x);
  const dotY = useDerivedValue(() => dot.value.y);
  const stops = stopsPath(dial, start, KNOB_TRAVEL);
  // Colour Picker: the ring re-renders with the current saturation and brightness.
  const tint = paint?.kind === "hueRing" ? paint : null;
  const ring = React.useMemo(() => {
    if (!tint || bandR <= 0) return null;
    const colors = hueRingColors(RING_SEGMENTS, tint.s, tint.b);
    const oval = Skia.XYWHRect(cx - bandR, cy - bandR, bandR * 2, bandR * 2);
    const sweep = KNOB_TRAVEL / RING_SEGMENTS;
    return colors.map((color, i) => ({
      color,
      // Slight overlap so no seams show between segments.
      path: Skia.PathBuilder.Make()
        .addArc(oval, start - 90 + i * sweep, sweep + 0.6)
        .build(),
    }));
  }, [tint?.s, tint?.b, cx, cy, bandR, start]); // eslint-disable-line react-hooks/exhaustive-deps
  const current = tint
    ? hsbToHex({ h: display, s: tint.s, b: tint.b })
    : hsvToHex(display / 360, 1, 1);
  return (
    <ControlFrame
      label={c.label}
      align="center"
      value={c.showValue ? formatValue(Math.round(display), { unit: c.unit ?? "°" }) : undefined}
      badge={fine ? fineBadge(fineFactor) : undefined}
      disabled={disabled}
    >
      <GestureDetector gesture={gesture}>
        <View
          className="flex-1"
          onLayout={onLayout}
          accessible
          accessibilityRole="adjustable"
          accessibilityState={{ disabled: !!disabled }}
          aria-disabled={!!disabled}
          accessibilityLabel={c.label ?? c.id}
          accessibilityValue={{ text: `${Math.round(display)}°` }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => {
            const next = wrapHue(display + (e.nativeEvent.actionName === "increment" ? 10 : -10));
            hue.value = next;
            release();
            onChange(next);
          }}
        >
          {d > 0 && (
            <OverhangCanvas width={w} height={h}>
              {ring ? (
                ring.map((seg, i) => (
                  <Path
                    key={i}
                    path={seg.path}
                    color={seg.color}
                    style="stroke"
                    strokeWidth={band}
                  />
                ))
              ) : (
                <Group
                  transform={[{ rotate: ((start - 90) * Math.PI) / 180 }]}
                  origin={vec(cx, cy)}
                >
                  <Path path={spectrum} style="stroke" strokeWidth={band}>
                    <SweepGradient
                      c={vec(cx, cy)}
                      colors={HUE_STOPS}
                      positions={HUE_STOPS.map((_, i) => ((i / 6) * KNOB_TRAVEL) / 360)}
                    />
                  </Path>
                </Group>
              )}
              <Path
                path={stops}
                color={t.control.tick}
                style="stroke"
                strokeWidth={2.5 * k}
                strokeCap="round"
              />
              <DialBody dial={dial} t={t} light={<InnerLight {...lightProps} />} />
              {/* The current colour is the lit value: it glows, fully while touched. */}
              <Circle cx={cx} cy={cy} r={20 * k} color={current} opacity={glow}>
                <BlurMask blur={5} style="outer" />
              </Circle>
              <Circle cx={cx} cy={cy} r={20 * k} color={current} />
              <Circle
                cx={cx}
                cy={cy}
                r={19 * k}
                color={t.control.trackBorder}
                style="stroke"
                strokeWidth={2 * k}
              />
              <Circle cx={dotX} cy={dotY} r={5 * k} color={t.control.thumb} />
              <Circle
                cx={dotX}
                cy={dotY}
                r={5 * k}
                color={t.color.background}
                style="stroke"
                strokeWidth={2 * k}
              />
            </OverhangCanvas>
          )}
        </View>
      </GestureDetector>
    </ControlFrame>
  );
}
