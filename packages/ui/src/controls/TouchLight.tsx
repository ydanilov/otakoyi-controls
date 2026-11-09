import {
  Circle,
  Group,
  Path,
  RadialGradient,
  Skia,
  vec,
  type SkPath,
  type SkRRect,
} from "@shopify/react-native-skia";
import {
  innerLightCenter,
  innerLightRadius,
  pinMatches,
  pinPoint,
  touchLightAllowed,
  touchLightMotion,
  touchLightSize,
  type LitShape,
  type TouchLightPin,
} from "@osc/controls";
import { withAlpha, type Theme } from "@osc/tokens";
import * as React from "react";
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, {
  Circle as SvgCircle,
  Defs,
  RadialGradient as SvgRadial,
  Stop,
} from "react-native-svg";
import { CONTINUOUS } from "../ds/depth";
import { useTheme } from "../theme/ThemeProvider";

/**
 * Touch light (Figma `Touch Light` 134:795), per Apple Liquid Glass: the touched element
 * illuminates from within, starting under the fingertip — white only, clipped to the element.
 * One hook (`useTouchLight`) holds the touch point and the animated level; three layers draw it:
 * - `InnerLight` (Skia): the thumb / disc / stick / wheel itself gets a radial white gradient at the
 *   touch point (faders, knobs, thumbstick, jog wheel) — no separate halo layer;
 * - `TouchLightSkia` (Skia): halo + core clipped to a surface (XY pad);
 * - `TouchLightView` (views): halo + core clipped to a pad, button, toggle, segment, quick action.
 * Sizes, opacities and timings: `t.touchLight` (tokens.json); the maths: `@osc/controls`.
 */

type Num = number | SharedValue<number>;

const PinContext = React.createContext<TouchLightPin | null>(null);

/**
 * Pins the touch light of the controls inside at a point (fractions of each surface), at full
 * strength — for stories and static snapshots, where no finger is on the screen.
 */
export function PinTouchLight({
  at,
  children,
}: {
  at: TouchLightPin | null | undefined;
  children: React.ReactNode;
}) {
  return <PinContext.Provider value={at ?? null}>{children}</PinContext.Provider>;
}

export interface TouchLight {
  /** False when disabled / view-only: nothing is drawn. */
  allowed: boolean;
  /** The pin for this light (stories), or null. */
  pin: TouchLightPin | null;
  /** Touch point in the surface, px. */
  x: SharedValue<number>;
  y: SharedValue<number>;
  /** 0..1 opacity of the light (1 while pinned). */
  level: SharedValue<number>;
  /** Bloom scale (fromScale → 1). */
  scale: SharedValue<number>;
  /** Finger down at (x, y). Worklet; also callable from the JS thread. */
  down: (x: number, y: number) => void;
  /** Finger moved: follows 1:1, no easing. */
  move: (x: number, y: number) => void;
  /** Finger lifted: fades out. */
  up: () => void;
}

/**
 * The touch light's state for one surface. `index` is the cell in a multi-cell control (segment,
 * group button) — it only matters for `PinTouchLight`.
 */
export function useTouchLight({
  disabled,
  index = 0,
}: { disabled?: boolean; index?: number } = {}): TouchLight {
  const t = useTheme();
  const reduce = useReducedMotion();
  const { fromScale, inMs, outMs } = touchLightMotion(reduce, t.touchLight);
  const allowed = touchLightAllowed(disabled);
  const ctx = React.useContext(PinContext);
  const pin = pinMatches(ctx, index) ? ctx : null;
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const level = useSharedValue(0);
  const scale = useSharedValue(fromScale);
  const enabled = useSharedValue(allowed);

  React.useEffect(() => {
    enabled.value = allowed;
    if (!allowed) {
      cancelAnimation(level);
      level.value = 0;
    }
  }, [allowed, enabled, level]);

  const pinned = !!pin && allowed;
  React.useEffect(() => {
    if (pinned) {
      level.value = 1;
      scale.value = 1;
    } else level.value = 0;
  }, [pinned, level, scale]);

  const down = React.useCallback(
    (px: number, py: number) => {
      "worklet";
      if (!enabled.value) return;
      x.value = px;
      y.value = py;
      // A fresh bloom starts small; a re-press during the fade continues from where it is.
      if (level.value < 0.05) scale.value = fromScale;
      scale.value = withTiming(1, { duration: inMs, easing: Easing.out(Easing.quad) });
      level.value = withTiming(1, { duration: inMs, easing: Easing.out(Easing.quad) });
    },
    [enabled, x, y, level, scale, fromScale, inMs],
  );
  const move = React.useCallback(
    (px: number, py: number) => {
      "worklet";
      x.value = px;
      y.value = py;
    },
    [x, y],
  );
  const up = React.useCallback(() => {
    "worklet";
    level.value = withTiming(0, { duration: outMs, easing: Easing.in(Easing.quad) });
  }, [level, outMs]);

  return { allowed, pin: allowed ? pin : null, x, y, level, scale, down, move, up };
}

/** Halo + core colours (white) with their opacities (a radial gradient to 0 each). */
function lightColors(t: Theme) {
  const tk = t.touchLight;
  const c = tk.color;
  return {
    halo: [withAlpha(c, tk.haloOpacity), withAlpha(c, tk.haloOpacity * 0.45), withAlpha(c, 0)],
    core: [withAlpha(c, tk.coreOpacity), withAlpha(c, tk.coreOpacity * 0.4), withAlpha(c, 0)],
  };
}
const STOPS = [0, 0.5, 1];

export interface TouchLightSkiaProps {
  allowed: boolean;
  halo: number;
  core: number;
  colors: { halo: string[]; core: string[] };
  transform: SharedValue<
    Array<{ translateX: number } | { translateY: number } | { scale: number }>
  >;
  opacity: SharedValue<number>;
  /** The surface's shape: the light never leaves it. */
  clip: SkRRect;
}

/**
 * Halo + core light in a Skia surface (XY pad) of `width` × `height`, clipped to its rounded shape
 * (`radius`), centred on the finger (or the pin).
 */
export function useTouchLightSkia(
  light: TouchLight,
  width: number,
  height: number,
  radius: number,
): TouchLightSkiaProps {
  const t = useTheme();
  const { halo, core } = touchLightSize(width, t.touchLight);
  const colors = React.useMemo(() => lightColors(t), [t]);
  const at = useLightPoint(light, width, height);
  const pinned = !!light.pin;
  const transform = useDerivedValue(() => [
    { translateX: at.x.value },
    { translateY: at.y.value },
    { scale: pinned ? 1 : light.scale.value },
  ]);
  const opacity = useDerivedValue(() => (pinned ? 1 : light.level.value));
  const clip = React.useMemo(
    () => Skia.RRectXY(Skia.XYWHRect(0, 0, width, height), radius, radius),
    [width, height, radius],
  );
  return { allowed: light.allowed, halo, core, colors, transform, opacity, clip };
}

/** Halo + core in a Skia canvas (props from `useTouchLightSkia`). No hooks: safe in Canvas. */
export function TouchLightSkia({
  allowed,
  halo,
  core,
  colors,
  transform,
  opacity,
  clip,
}: TouchLightSkiaProps) {
  if (!allowed || halo <= 0) return null;
  return (
    <Group clip={clip}>
      <Group transform={transform} opacity={opacity}>
        <Circle cx={0} cy={0} r={halo / 2}>
          <RadialGradient c={vec(0, 0)} r={halo / 2} colors={colors.halo} positions={STOPS} />
        </Circle>
        <Circle cx={0} cy={0} r={core / 2}>
          <RadialGradient c={vec(0, 0)} r={core / 2} colors={colors.core} positions={STOPS} />
        </Circle>
      </Group>
    </Group>
  );
}

export interface InnerLightProps {
  allowed: boolean;
  colors: string[];
  cx: SharedValue<number>;
  cy: SharedValue<number>;
  c: SharedValue<{ x: number; y: number }>;
  r: SharedValue<number>;
  opacity: SharedValue<number>;
  clip: SharedValue<SkPath>;
}

/**
 * The element lit from within (faders' thumb, knob disc, stick, jog wheel): a radial white
 * gradient (`innerOpacity` → 0) centred where the finger is on the element, clipped to the
 * element's shape (`shape`, in canvas px; may move with the value). `corner` rounds a rect shape.
 * A pinned light (stories) sits at the pin's fraction of the element.
 */
export function useInnerLight(
  light: TouchLight,
  shape: SharedValue<LitShape> | LitShape,
  corner = 0,
): InnerLightProps {
  const t = useTheme();
  const tk = t.touchLight;
  const colors = React.useMemo(
    () => [withAlpha(tk.color, tk.innerOpacity), withAlpha(tk.color, 0)],
    [tk.color, tk.innerOpacity],
  );
  const pin = light.pin;
  const px = pin?.x ?? 0.5;
  const py = pin?.y ?? 0.5;
  const pinned = !!pin;
  const lx = light.x;
  const ly = light.y;
  const isShared = !("kind" in shape);
  const fixed = isShared ? null : (shape as LitShape);
  const shared = isShared ? (shape as SharedValue<LitShape>) : null;
  // Each derived value reads `shared` itself: a mapper only follows shared values in its own closure.
  const centre = useDerivedValue(() => {
    const s = shared ? shared.value : fixed!;
    if (pinned) {
      if (s.kind === "rect") return { x: s.x + s.width * px, y: s.y + s.height * py };
      return { x: s.cx + (px - 0.5) * 2 * s.r, y: s.cy + (py - 0.5) * 2 * s.r };
    }
    return innerLightCenter({ x: lx.value, y: ly.value }, s);
  });
  const cx = useDerivedValue(() => centre.value.x);
  const cy = useDerivedValue(() => centre.value.y);
  const c = useDerivedValue(() => vec(centre.value.x, centre.value.y));
  const scale = light.scale;
  const r = useDerivedValue(
    () => innerLightRadius(shared ? shared.value : fixed!) * (pinned ? 1 : scale.value),
  );
  const level = light.level;
  const opacity = useDerivedValue(() => (pinned ? 1 : level.value));
  const clip = useDerivedValue(() => {
    const s = shared ? shared.value : fixed!;
    const b = Skia.PathBuilder.Make();
    if (s.kind === "circle") b.addCircle(s.cx, s.cy, s.r);
    else b.addRRect(Skia.RRectXY(Skia.XYWHRect(s.x, s.y, s.width, s.height), corner, corner));
    return b.build();
  });
  return { allowed: light.allowed, colors, cx, cy, c, r, opacity, clip };
}

/**
 * The inner light in a Skia canvas: the element's own shape filled with the radial gradient (so it
 * can never leave the element). Draw it right above the element's fill, below its marks.
 */
export function InnerLight({ allowed, colors, c, r, opacity, clip }: InnerLightProps) {
  if (!allowed) return null;
  return (
    <Path path={clip} opacity={opacity}>
      <RadialGradient c={c} r={r} colors={colors} />
    </Path>
  );
}

/** Touch point of a light: the pin (stories, as a fraction of `width` × `height`) or the finger. */
export function useLightPoint(light: TouchLight, width: number, height: number) {
  const pin = light.pin;
  const px = pin ? pinPoint(pin, width, height) : null;
  const x = useDerivedValue(() => (px ? px.x : light.x.value));
  const y = useDerivedValue(() => (px ? px.y : light.y.value));
  return { x, y };
}

/**
 * The light in a plain view (pads, buttons, toggles, segments): white halo + core, clipped to the
 * parent's rounded shape (`radius`), never takes touches. Render it as the parent's FIRST child so
 * labels and icons draw over it.
 */
export function TouchLightView({ light, radius }: { light: TouchLight; radius: number }) {
  const t = useTheme();
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== box.w || height !== box.h) setBox({ w: width, h: height });
  };
  const { halo, core } = touchLightSize(box.w, t.touchLight);
  const colors = React.useMemo(() => lightColors(t), [t]);
  const pin = light.pin ? pinPoint(light.pin, box.w, box.h) : null;
  const style = useAnimatedStyle(() => {
    const x = pin ? pin.x : light.x.value;
    const y = pin ? pin.y : light.y.value;
    return {
      opacity: pin ? 1 : light.level.value,
      transform: [
        { translateX: x - halo / 2 },
        { translateY: y - halo / 2 },
        { scale: pin ? 1 : light.scale.value },
      ],
    };
  });
  const id = `tl${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  if (!light.allowed) return null;
  return (
    <View
      pointerEvents="none"
      testID="touch-light"
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, CONTINUOUS, { borderRadius: radius, overflow: "hidden" }]}
    >
      {halo > 0 && (
        <Animated.View
          style={[{ position: "absolute", left: 0, top: 0, width: halo, height: halo }, style]}
        >
          <Svg width={halo} height={halo}>
            <Defs>
              {(["halo", "core"] as const).map((k) => (
                <SvgRadial key={k} id={`${id}${k}`} cx="50%" cy="50%" r="50%">
                  {colors[k].map((c, i) => (
                    <Stop
                      key={i}
                      offset={STOPS[i]}
                      stopColor={c.slice(0, 7)}
                      stopOpacity={alphaOf(c)}
                    />
                  ))}
                </SvgRadial>
              ))}
            </Defs>
            <SvgCircle cx={halo / 2} cy={halo / 2} r={halo / 2} fill={`url(#${id}halo)`} />
            <SvgCircle cx={halo / 2} cy={halo / 2} r={core / 2} fill={`url(#${id}core)`} />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

/** Alpha of an `#RRGGBBAA` colour (1 for `#RRGGBB`). */
function alphaOf(hex: string): number {
  return hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1;
}

/**
 * Press handlers that drive a light from a Pressable: the touch point in the surface's own
 * coordinates (page position minus the surface's rect, so a touch on a child label still lands
 * where the finger is), following `onPressMove`. Pass the returned `ref` to the Pressable.
 */
export function usePressLight(
  light: TouchLight,
  handlers: {
    onPressIn?: ((e: GestureResponderEvent) => void) | null;
    onPressOut?: ((e: GestureResponderEvent) => void) | null;
  } = {},
) {
  const ref = React.useRef<React.ComponentRef<typeof View>>(null);
  const origin = React.useRef<{ x: number; y: number } | null>(null);
  const local = (e: GestureResponderEvent) => {
    const n = e.nativeEvent;
    const o = origin.current;
    return o ? { x: n.pageX - o.x, y: n.pageY - o.y } : { x: n.locationX, y: n.locationY };
  };
  return {
    ref,
    onPressIn: (e: GestureResponderEvent) => {
      const el = ref.current as unknown as { getBoundingClientRect?: () => DOMRectLike } | null;
      const r = el?.getBoundingClientRect?.();
      const g = globalThis as { scrollX?: number; scrollY?: number };
      origin.current = r ? { x: r.left + (g.scrollX ?? 0), y: r.top + (g.scrollY ?? 0) } : null;
      const p = local(e);
      light.down(p.x, p.y);
      handlers.onPressIn?.(e);
    },
    onPressMove: (e: GestureResponderEvent) => {
      const p = local(e);
      light.move(p.x, p.y);
    },
    onPressOut: (e: GestureResponderEvent) => {
      light.up();
      handlers.onPressOut?.(e);
    },
  };
}

interface DOMRectLike {
  left: number;
  top: number;
}
