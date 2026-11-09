import { Canvas, Group, Path, RoundedRect, Shadow, Skia } from "@shopify/react-native-skia";
import {
  FINE_POINTERS,
  createDeltaAccumulator,
  fineBadge,
  formatOffset,
  jogDelta,
} from "@osc/controls";
import * as React from "react";
import { View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "../theme/ThemeProvider";
import { InsetRRect, LitRRect, sigma } from "./skia";
import { animateGlow, useFineSpread, useGlow } from "./states";
import { ControlFrame } from "./ControlFrame";
import type { ControlProps } from "./types";
import { InnerLight, useInnerLight, useTouchLight } from "./TouchLight";
import { useLayout } from "./useLayout";
import { useRelativeOffset } from "../pult/context";

/**
 * The detent LEDs and the − / + marks sit outside the body (Figma: above and below the housing of
 * a horizontal wheel), so the canvas overhangs the body by this much on those two sides.
 */
const OVERHANG = 16;

/** Angle between two ribs of the wheel (a cylinder seen from the front), degrees. */
const RIB_DEG = 7;
/** Rib opacities from the edge (dark) to the middle (bright) of the wheel — Figma 4 % … 46 %. */
const RIB_LEVELS = [0.05, 0.12, 0.2, 0.3, 0.38, 0.46];

/**
 * Endless jog wheel (`fader` with `mode: "relative"`, ADR-015). There is no position: dragging
 * scrolls the ribs and sends the change (a full track = max − min), summed per throttle window so
 * no movement is lost. Two fingers = fine (`fineFactor`): the ribs spread apart around the centre
 * index (×1.8) and the badge shows the coefficient. The centre index glows, fully while touched.
 */
export function JogFader({ control: c, onChange, disabled }: ControlProps<"fader">) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const vertical = c.orientation === "vertical";
  const { width: w, height: h } = size;
  const length = vertical ? h : w;
  const offset = useSharedValue(0);
  const last = useSharedValue(0);
  const [fine, setFine] = React.useState(false);
  const total = useRelativeOffset(c.id);
  const glow = useGlow();
  const spread = useFineSpread(fine);
  const light = useTouchLight({ disabled: !!disabled });

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const acc = React.useMemo(
    () => createDeltaAccumulator(c.throttleHz, (delta) => onChangeRef.current({ delta })),
    [c.throttleHz],
  );
  React.useEffect(() => () => acc.cancel(), [acc]);

  const span = c.max - c.min;
  const fineFactor = c.fineFactor;
  const push = React.useCallback(
    (px: number, pointers: number) => {
      const isFine = pointers >= FINE_POINTERS;
      setFine(isFine);
      const d = jogDelta(px, length, span, isFine ? fineFactor : 1);
      total.add(d);
      acc.push(d);
    },
    [acc, length, span, fineFactor, total.add],
  );
  const end = React.useCallback(() => {
    setFine(false);
    acc.flush();
  }, [acc]);

  const pan = usePanGesture({
    enabled: !disabled,
    minDistance: 2,
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
      const dist = vertical ? -e.translationY : e.translationX;
      const step = dist - last.value;
      last.value = dist;
      offset.value = offset.value + step;
      light.move(e.x, e.y);
      scheduleOnRN(push, step, e.numberOfPointers);
    },
    onFinalize: () => {
      "worklet";
      animateGlow(glow, false);
      light.up();
      scheduleOnRN(end);
    },
  });

  // Figma Fader Mode=Relative: a recessed housing with a wheel inside. The wheel's ribs are drawn
  // as a cylinder seen from the front (narrow and dark at the edges, wide and bright in the
  // middle) and roll with the drag; fine mode spreads them ×1.8. Lit detent marks either side of
  // the centre glow (fully while touched).
  const across = vertical ? w : h;
  const mid = across / 2;
  const housing = vertical ? 64 : t.size.jogHousing;
  const inset = 6;
  // Figma: the wheel's inner shadows are offset ±18 along it.
  const sx = vertical ? 0 : 18;
  const sy = vertical ? 18 : 0;
  const wheelAcross = housing - inset * 2;
  const wheelLen = Math.max(0, length - inset * 2);
  const R = wheelLen / 2;
  const levels = useDerivedValue(() => {
    const out: Array<Array<[number, number]>> = RIB_LEVELS.map(() => []);
    if (R <= 0) return out;
    const step = ((RIB_DEG * Math.PI) / 180) * spread.value;
    const phase = (((offset.value / R) % step) + step) % step;
    for (let a = -Math.PI / 2 - step + phase; a < Math.PI / 2 + step; a += step) {
      const a0 = Math.max(-Math.PI / 2, a - step / 2);
      const a1 = Math.min(Math.PI / 2, a + step / 2);
      if (a1 <= a0) continue;
      const p0 = R + Math.sin(a0) * R;
      const p1 = R + Math.sin(a1) * R;
      if (p1 - p0 < 0.6) continue;
      const lit = Math.pow(Math.cos(a), 1.5);
      const i = Math.min(RIB_LEVELS.length - 1, Math.floor(lit * RIB_LEVELS.length));
      out[i]!.push([p0, Math.max(p0 + 0.5, p1 - 1.5)]);
    }
    return out;
  });
  const ribPath = (i: number) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDerivedValue(() => {
      const b = Skia.PathBuilder.Make();
      const x0 = vertical ? mid - wheelAcross / 2 : inset;
      const y0 = vertical ? inset : mid - wheelAcross / 2;
      for (const [p0, p1] of levels.value[i] ?? []) {
        if (vertical) b.addRect(Skia.XYWHRect(x0, y0 + p0, wheelAcross, p1 - p0));
        else b.addRect(Skia.XYWHRect(x0 + p0, y0, p1 - p0, wheelAcross));
      }
      return b.build();
    });
  const ribs = RIB_LEVELS.map((_, i) => ribPath(i));
  const lit = fine ? t.color.accent : t.control.fill;
  const hx = vertical ? mid - housing / 2 : 0;
  const hy = vertical ? 0 : mid - housing / 2;
  const hw = vertical ? housing : w;
  const hh = vertical ? h : housing;
  const wx = vertical ? mid - wheelAcross / 2 : inset;
  const wy = vertical ? inset : mid - wheelAcross / 2;
  const ww = vertical ? wheelAcross : wheelLen;
  const wh = vertical ? wheelLen : wheelAcross;
  const detent = (side: -1 | 1) =>
    vertical
      ? { x: mid + side * (housing / 2 + 8) - 2, y: h / 2 - 9, width: 4, height: 18 }
      : { x: w / 2 - 9, y: mid + side * (housing / 2 + 8) - 2, width: 18, height: 4 };
  const signs = Skia.PathBuilder.Make();
  {
    // − at the low end, + at the high end, outside the housing (Figma: 14 pt icons, 10.5 pt glyphs).
    const o = housing / 2 + 7;
    const lo = vertical ? { x: mid + o, y: h - 7 } : { x: 7, y: mid + o };
    const hi = vertical ? { x: mid + o, y: 7 } : { x: w - 7, y: mid + o };
    const g = 5.25;
    signs.moveTo(lo.x - g, lo.y).lineTo(lo.x + g, lo.y);
    signs
      .moveTo(hi.x - g, hi.y)
      .lineTo(hi.x + g, hi.y)
      .moveTo(hi.x, hi.y - g)
      .lineTo(hi.x, hi.y + g);
  }
  const signPath = signs.build();
  // Touch light: the wheel itself lights up from where the finger is on it.
  const lightProps = useInnerLight(light, { kind: "rect", x: wx, y: wy, width: ww, height: wh }, 6);
  return (
    <ControlFrame
      label={c.label}
      align={vertical ? "center" : "split"}
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
          accessibilityHint="Endless. Drag to nudge."
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => {
            const d = (c.step ?? span / 100) * (e.nativeEvent.actionName === "increment" ? 1 : -1);
            onChange({ delta: d });
          }}
        >
          {w > 0 && (
            <Canvas
              style={{
                position: "absolute",
                left: vertical ? -OVERHANG : 0,
                top: vertical ? 0 : -OVERHANG,
                width: vertical ? w + OVERHANG * 2 : w,
                height: vertical ? h : h + OVERHANG * 2,
              }}
              pointerEvents="none"
            >
              <Group
                transform={[
                  { translateX: vertical ? OVERHANG : 0 },
                  { translateY: vertical ? 0 : OVERHANG },
                ]}
              >
                <InsetRRect
                  t={t}
                  color={t.control.track}
                  x={hx}
                  y={hy}
                  width={hw}
                  height={hh}
                  r={12}
                />
                {/* The wheel: dark at both ends (Figma: inner shadows ±18, blur 22). */}
                <RoundedRect x={wx} y={wy} width={ww} height={wh} r={6} color={t.control.track}>
                  <Shadow dx={sx} dy={sy} blur={sigma(22)} color={t.elevation.insetShadow} inner />
                  <Shadow
                    dx={-sx}
                    dy={-sy}
                    blur={sigma(22)}
                    color={t.elevation.insetShadow}
                    inner
                  />
                </RoundedRect>
                {ribs.map((path, i) => (
                  <Path key={i} path={path} color={t.color.textMuted} opacity={RIB_LEVELS[i]} />
                ))}
                {/* Touch light: the wheel lit from within under the finger, below the detent LEDs. */}
                <InnerLight {...lightProps} />
                {fine && (
                  <RoundedRect
                    x={hx + 0.75}
                    y={hy + 0.75}
                    width={hw - 1.5}
                    height={hh - 1.5}
                    r={12}
                    color={t.color.focus}
                    style="stroke"
                    strokeWidth={t.stroke.default}
                  />
                )}
                <LitRRect {...detent(-1)} r={2} color={lit} glow={glow} />
                <LitRRect {...detent(1)} r={2} color={lit} glow={glow} />
                <Path
                  path={signPath}
                  color={t.color.textMuted}
                  style="stroke"
                  strokeWidth={t.stroke.hairline}
                  strokeCap="round"
                />
              </Group>
            </Canvas>
          )}
        </View>
      </GestureDetector>
    </ControlFrame>
  );
}
