import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  RoundedRect,
  Shadow,
  vec,
} from "@shopify/react-native-skia";
import {
  PICKER_STYLES,
  brightnessGradient,
  createThrottle,
  hexToHsb,
  hsbReadout,
  hsbToHex,
  saturationGradient,
  squarePoint,
  squareToSb,
  stripPosition,
  stripX,
  syncHsb,
  type Hsb,
  type PickerSlider,
  type PickerStyle,
} from "@osc/controls";
import { Control, type ControlOf } from "@osc/schema";
import { withAlpha } from "@osc/tokens";
import * as React from "react";
import { Pressable, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { Text } from "@osc/ui/components/ui/text";
import { cn } from "@osc/ui/lib/utils";
import { CONTINUOUS, Surface, useDepthStyle } from "../ds/depth";
import { useControlServices, viewPrefKey } from "../platform/services";
import { useTheme } from "../theme/ThemeProvider";
import { Knob } from "./Knob";
import type { ControlProps } from "./types";
import { useLayout } from "./useLayout";

/** The colour model's own black and white (not design colours): the S × B field shading. */
const WHITE = hsbToHex({ h: 0, s: 0, b: 1 });
const BLACK = hsbToHex({ h: 0, s: 0, b: 0 });

/** Hue strip colours: 0°, 60°, … 360° at full saturation and brightness. */
const HUE_STRIP = Array.from({ length: 7 }, (_, i) => hsbToHex({ h: i * 60, s: 1, b: 1 }));
/** Strip / slider height and thumb (Figma: 28 pt capsules). */
const STRIP = 28;
/** Cursor on the square (Figma: 24 pt, 3 pt white ring). */
const CURSOR = 24;
const RING = 3;
/** Values leave through a throttle while dragging (the last one always on release). */
const SEND_HZ = 30;
const STYLE_LABEL: Record<PickerStyle, string> = {
  square: "Square",
  knobs: "Knobs",
};

/**
 * Color Picker (Figma Patterns › Color Picker 139:1797, Style=Square / Knobs). Header: title, live
 * swatch and hex. A capsule segmented control switches the picker style — a local view preference
 * kept per control on the device (`viewPrefs`); `pickerStyle` in the config is the default (Square).
 * `sliders` adds precise saturation / brightness sliders under the Square's hue strip. Every style edits the same hue / saturation / brightness and sends the same value
 * (`format`: by default three addresses `/h` `/s` `/b`, or one rgb, hsv or hex message — @osc/controls
 * `messagesFor`). With `swatches` it is a palette instead.
 * Maths: `@osc/controls` color.ts.
 */
export function ColorPicker(props: ControlProps<"colorPicker">) {
  return props.control.swatches?.length ? <SwatchPicker {...props} /> : <HsbPicker {...props} />;
}

function HsbPicker({ control: c, value, onChange, disabled }: ControlProps<"colorPicker">) {
  const t = useTheme();
  const services = useControlServices();
  const initialHex = typeof value === "string" ? value : (c.default ?? "#FFFFFF");
  const [hsb, setHsbState] = React.useState<Hsb>(() => hexToHsb(initialHex));
  // The newest HSB, also between renders (several edits can land before React renders).
  const latest = React.useRef(hsb);
  const setHsb = React.useCallback((next: Hsb) => {
    latest.current = next;
    setHsbState(next);
  }, []);
  const [style, setStyle] = React.useState<PickerStyle>(c.pickerStyle ?? "square");
  const key = viewPrefKey(services.pult, c.id, "pickerStyle");

  // The user's own choice of style, kept on this device.
  React.useEffect(() => {
    let live = true;
    services.viewPrefs
      .get(key)
      .then((v) => {
        if (live && v && (PICKER_STYLES as readonly string[]).includes(v))
          setStyle(v as PickerStyle);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [services.viewPrefs, key]);
  const choose = (s: PickerStyle) => {
    setStyle(s);
    void services.viewPrefs.set(key, s).catch(() => {});
  };

  // Feedback (another device, the installation) moves the picker unless it is the same colour or
  // the finger is on it. Adjusted during render, not copied in an effect: at feedback rates an
  // effect that sets state on every value change makes React abort with "Maximum update depth
  // exceeded" (see useHeldValue).
  const dragging = React.useRef(false);
  const [seen, setSeen] = React.useState(value);
  if (seen !== value) {
    setSeen(value);
    if (!dragging.current && typeof value === "string") setHsb(syncHsb(latest.current, value));
  }

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const throttle = React.useMemo(
    () => createThrottle<string>(SEND_HZ, (v) => onChangeRef.current(v)),
    [],
  );
  React.useEffect(() => () => throttle.cancel(), [throttle]);
  const edit = React.useCallback(
    (patch: Partial<Hsb>, final = false) => {
      const next = { ...latest.current, ...patch };
      setHsb(next);
      throttle.push(hsbToHex(next));
      dragging.current = !final;
      if (final) throttle.flush();
    },
    [throttle, setHsb],
  );

  const hex = hsbToHex(hsb);
  return (
    <Surface
      depth="raised"
      radius="lg"
      className={cn("flex-1 gap-4 p-4", disabled && "opacity-40")}
      pointerEvents={disabled ? "none" : "auto"}
    >
      <View className="min-h-[18px] flex-row items-center gap-2">
        <Text
          className="text-muted-foreground flex-1 text-xs font-medium uppercase tracking-overline"
          numberOfLines={1}
        >
          {c.label ?? "Colour"}
        </Text>
        <View
          testID="color-swatch"
          style={[
            CONTINUOUS,
            {
              width: 18,
              height: 18,
              borderRadius: 6,
              backgroundColor: hex,
              borderWidth: 1,
              borderColor: t.elevation.edgeLight,
            },
          ]}
        />
        <Text className="text-foreground font-mono text-sm" accessibilityLabel={`Colour ${hex}`}>
          {hex}
        </Text>
      </View>
      <StyleSwitch value={style} onChange={choose} />
      <View className="flex-1">
        {style === "square" && (
          <SquareBody hsb={hsb} edit={edit} disabled={disabled} sliders={c.sliders ?? []} />
        )}
        {style === "knobs" && <KnobsBody c={c} hsb={hsb} edit={edit} disabled={disabled} />}
      </View>
    </Surface>
  );
}

type Edit = (patch: Partial<Hsb>, final?: boolean) => void;

/** iOS capsule segmented control: Square | Knobs (the selected one raised). */
function StyleSwitch({
  value,
  onChange,
}: {
  value: PickerStyle;
  onChange: (s: PickerStyle) => void;
}) {
  const raised = useDepthStyle("raisedSm");
  return (
    <View
      className="bg-control-track h-[34px] flex-row rounded-full p-[3px]"
      style={CONTINUOUS}
      accessibilityRole="radiogroup"
      accessibilityLabel="Picker style"
    >
      {PICKER_STYLES.map((s) => {
        const on = s === value;
        return (
          <Pressable
            key={s}
            onPress={() => onChange(s)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            className={cn("flex-1 items-center justify-center rounded-full", on && "bg-card")}
            style={[CONTINUOUS, on ? raised : undefined]}
          >
            <Text
              className={cn(
                "text-sm",
                on ? "text-foreground font-semibold" : "text-muted-foreground font-medium",
              )}
            >
              {STYLE_LABEL[s]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Builds the knob configs the Knobs style uses (hue ring, saturation, brightness). */
function useKnobControls(id: string) {
  return React.useMemo(() => {
    const knob = (props: Record<string, unknown>) =>
      Control.parse({ type: "knob", address: "/-", ...props }) as ControlOf<"knob">;
    return {
      hue: knob({ id: `${id}-h`, label: "Hue", mode: "hue", travel: 360, unit: "°", int: true }),
      s: knob({
        id: `${id}-s`,
        label: "Saturation",
        min: 0,
        max: 100,
        int: true,
        unit: "%",
      }),
      b: knob({
        id: `${id}-b`,
        label: "Brightness",
        min: 0,
        max: 100,
        int: true,
        unit: "%",
      }),
    };
  }, [id]);
}

/**
 * Style=Knobs: a big hue ring knob, then compact Saturation and Brightness knobs side by side.
 * The ring's segments and centre swatch are tinted with the current S and B; the saturation arc
 * runs hsb(h, 0, B) → hsb(h, 1, B), the brightness arc hsb(h, S, 0) → hsb(h, S, 1).
 */
function KnobsBody({
  c,
  hsb,
  edit,
  disabled,
}: {
  c: ControlOf<"colorPicker">;
  hsb: Hsb;
  edit: Edit;
  disabled?: boolean | undefined;
}) {
  const k = useKnobControls(c.id);
  const [s0, s1] = saturationGradient(hsb.h, hsb.b);
  const [b0, b1] = brightnessGradient(hsb.h, hsb.s);
  return (
    <View className="flex-1 gap-2">
      <View className="flex-[1.35]">
        <Knob
          control={k.hue}
          value={hsb.h}
          onChange={(v) => typeof v === "number" && edit({ h: v }, true)}
          disabled={disabled}
          paint={{ kind: "hueRing", s: hsb.s, b: hsb.b }}
        />
      </View>
      <View className="flex-1 flex-row gap-4">
        <View className="flex-1">
          <Knob
            control={k.s}
            value={Math.round(hsb.s * 100)}
            onChange={(v) => typeof v === "number" && edit({ s: v / 100 }, true)}
            disabled={disabled}
            paint={{ kind: "gradient", from: s0, to: s1 }}
          />
        </View>
        <View className="flex-1">
          <Knob
            control={k.b}
            value={Math.round(hsb.b * 100)}
            onChange={(v) => typeof v === "number" && edit({ b: v / 100 }, true)}
            disabled={disabled}
            paint={{ kind: "gradient", from: b0, to: b1 }}
          />
        </View>
      </View>
    </View>
  );
}

/** A drag surface that reports the finger's position (JS thread; values go through a throttle). */
function useDrag(enabled: boolean, onMove: (x: number, y: number, final: boolean) => void) {
  const ref = React.useRef(onMove);
  ref.current = onMove;
  return usePanGesture({
    enabled,
    runOnJS: true,
    minDistance: 0,
    shouldCancelWhenOutside: false,
    onBegin: (e) => ref.current(e.x, e.y, false),
    onUpdate: (e) => ref.current(e.x, e.y, false),
    onFinalize: (e) => ref.current(e.x, e.y, true),
  });
}

/** The 24 pt cursor: current colour inside a 3 pt white ring, with a soft shadow. */
function Cursor({ x, y, color, ring }: { x: number; y: number; color: string; ring: string }) {
  const t = useTheme();
  return (
    <Group>
      <Circle cx={x} cy={y} r={CURSOR / 2} color={color}>
        <Shadow dx={0} dy={2} blur={4} color={t.elevation.shadow} />
      </Circle>
      <Circle
        cx={x}
        cy={y}
        r={CURSOR / 2 - RING / 2}
        color={ring}
        style="stroke"
        strokeWidth={RING}
      />
    </Group>
  );
}

/** A 28 pt capsule strip (hue strip, saturation / brightness sliders) with a round thumb. */
function Strip({
  colors,
  position,
  thumbColor,
  label,
  valueText,
  disabled,
  onMove,
}: {
  colors: string[];
  position: number;
  thumbColor: string;
  label: string;
  valueText: string;
  disabled?: boolean | undefined;
  onMove: (p: number, final: boolean) => void;
}) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const w = size.width;
  const pan = useDrag(!disabled, (x, _y, final) => onMove(stripPosition(x, w, STRIP), final));
  const tx = stripX(position, w, STRIP);
  const ring = WHITE;
  return (
    <GestureDetector gesture={pan}>
      <View
        style={{ height: STRIP }}
        onLayout={onLayout}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: valueText }}
      >
        {w > 0 && (
          <Canvas style={{ width: w, height: STRIP }}>
            <RoundedRect x={0} y={0} width={w} height={STRIP} r={STRIP / 2}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(w, 0)}
                colors={colors}
                positions={colors.map((_, i) => i / (colors.length - 1))}
              />
            </RoundedRect>
            <RoundedRect
              x={0.5}
              y={0.5}
              width={w - 1}
              height={STRIP - 1}
              r={STRIP / 2}
              color={t.elevation.edgeLight}
              style="stroke"
              strokeWidth={1}
            />
            <Circle cx={tx} cy={STRIP / 2} r={STRIP / 2} color={thumbColor}>
              <Shadow dx={0} dy={2} blur={4} color={t.elevation.shadow} />
            </Circle>
            <Circle
              cx={tx}
              cy={STRIP / 2}
              r={STRIP / 2 - RING / 2}
              color={ring}
              style="stroke"
              strokeWidth={RING}
            />
          </Canvas>
        )}
      </View>
    </GestureDetector>
  );
}

/** H / S / B readout in three equal columns (label muted, value mono). */
function Readout({ hsb }: { hsb: Hsb }) {
  const r = hsbReadout(hsb);
  return (
    <View className="flex-row" testID="hsb-readout">
      {(["h", "s", "b"] as const).map((k) => (
        <View key={k} className="flex-1 flex-row items-center justify-center gap-1.5">
          <Text className="text-muted-foreground text-xs font-medium uppercase">{k}</Text>
          <Text className="text-foreground font-mono text-sm">{r[k]}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Style=Square: a Photoshop-style saturation × brightness field (hue base, white → transparent
 * left to right, transparent → black top to bottom) with a round cursor, a hue strip, the optional
 * saturation (hsb(h, 0, B) → hsb(h, 1, B)) and brightness (hsb(h, S, 0) → hsb(h, S, 1)) sliders,
 * and the readout.
 */
function SquareBody({
  hsb,
  edit,
  disabled,
  sliders,
}: {
  hsb: Hsb;
  edit: Edit;
  disabled?: boolean | undefined;
  sliders: readonly PickerSlider[];
}) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const { width: w, height: h } = size;
  const pan = useDrag(!disabled, (x, y, final) => edit(squareToSb(x, y, w, h), final));
  const p = squarePoint(hsb.s, hsb.b, w, h);
  const base = hsbToHex({ h: hsb.h, s: 1, b: 1 });
  const r = t.radius.md;
  const ro = hsbReadout(hsb);
  return (
    <View className="flex-1 gap-[14px]">
      <GestureDetector gesture={pan}>
        <View
          className="flex-1"
          onLayout={onLayout}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Saturation and brightness"
          accessibilityValue={{ text: `Saturation ${ro.s}, brightness ${ro.b}` }}
        >
          {w > 0 && h > 0 && (
            <Canvas style={{ width: w, height: h }}>
              <RoundedRect x={0} y={0} width={w} height={h} r={r} color={base} />
              <RoundedRect x={0} y={0} width={w} height={h} r={r}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(w, 0)}
                  colors={[WHITE, withAlpha(WHITE, 0)]}
                />
              </RoundedRect>
              <RoundedRect x={0} y={0} width={w} height={h} r={r}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, h)}
                  colors={[withAlpha(BLACK, 0), BLACK]}
                />
              </RoundedRect>
              <RoundedRect
                x={0.5}
                y={0.5}
                width={w - 1}
                height={h - 1}
                r={r}
                color={t.elevation.edgeLight}
                style="stroke"
                strokeWidth={1}
              />
              <Cursor x={p.x} y={p.y} color={hsbToHex(hsb)} ring={WHITE} />
            </Canvas>
          )}
        </View>
      </GestureDetector>
      <Strip
        colors={HUE_STRIP}
        position={hsb.h / 360}
        thumbColor={base}
        label="Hue"
        valueText={ro.h}
        disabled={disabled}
        onMove={(q, final) => edit({ h: q * 360 }, final)}
      />
      {sliders.map((k) =>
        k === "saturation" ? (
          <Strip
            key={k}
            colors={saturationGradient(hsb.h, hsb.b)}
            position={hsb.s}
            thumbColor={hsbToHex(hsb)}
            label="Saturation"
            valueText={ro.s}
            disabled={disabled}
            onMove={(q, final) => edit({ s: q }, final)}
          />
        ) : (
          <Strip
            key={k}
            colors={brightnessGradient(hsb.h, hsb.s)}
            position={hsb.b}
            thumbColor={hsbToHex(hsb)}
            label="Brightness"
            valueText={ro.b}
            disabled={disabled}
            onMove={(q, final) => edit({ b: q }, final)}
          />
        ),
      )}
      <Readout hsb={hsb} />
    </View>
  );
}

/** Palette mode (`swatches`): the client's colours as swatches; the selected one has a ring. */
function SwatchPicker({ control: c, value, onChange, disabled }: ControlProps<"colorPicker">) {
  const current = typeof value === "string" ? value.toUpperCase() : (c.default ?? "#FFFFFF");
  return (
    <View className={cn("flex-1 gap-2", disabled && "opacity-40")}>
      <View className="min-h-5 flex-row items-center justify-between gap-2">
        <Text className="text-muted-foreground text-xs font-medium uppercase tracking-overline">
          {c.label ?? "Colour"}
        </Text>
        <Text className="text-foreground font-mono text-sm">{current}</Text>
      </View>
      <View className="flex-1 flex-row flex-wrap gap-2">
        {(c.swatches ?? []).map((hex) => {
          const active = hex.toUpperCase() === current;
          return (
            <Pressable
              key={hex}
              disabled={disabled}
              onPress={() => onChange(hex.toUpperCase())}
              accessibilityRole="radio"
              accessibilityLabel={hex}
              accessibilityState={{ selected: active }}
              style={{ backgroundColor: hex }}
              className={cn(
                "min-h-touch min-w-touch flex-1 rounded-md border-2",
                active ? "border-foreground" : "border-transparent",
              )}
            />
          );
        })}
      </View>
    </View>
  );
}
