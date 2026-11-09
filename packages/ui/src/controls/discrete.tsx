import { formatValue, isGroupValue, toggleInGroup } from "@osc/controls";
import type { UnsupportedControl } from "@osc/schema";
import type { PadSize } from "@osc/schema";
import * as React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Text } from "@osc/ui/components/ui/text";
import { cn } from "@osc/ui/lib/utils";
import { CONTINUOUS, useDepthStyle, usePressState } from "../ds/depth";
import { LedSwitch } from "../forms/LedSwitch";
import { Glyph } from "../ds/Glyph";
import { iconByName } from "../ds/iconByName";
import type { PhosphorIcon } from "../ds/icons";
import { useControlServices } from "../platform/services";
import { useTheme } from "../theme/ThemeProvider";
import { ControlFrame } from "./ControlFrame";
import { TouchLightView, usePressLight, useTouchLight } from "./TouchLight";
import type { ControlProps } from "./types";
import { useLayout } from "./useLayout";

type PadLook = "rest" | "on" | "pressed";

/**
 * Shared pad (Figma `Pad` / `Toggle`): a raised key. `on` (latched) = lit ring + soft glow on a
 * pressed-in key — never a solid fill; `pressed` (a momentary key under the finger) = the lit key
 * with the active glow. Glow appears only on lit / pressed keys.
 */
function Pad({
  look = "rest",
  disabled,
  children,
  className,
  style,
  onPressIn,
  onPressOut,
  lightIndex,
  ...props
}: Omit<React.ComponentProps<typeof Pressable>, "style"> & {
  look?: PadLook;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  /** Cell index for a pinned touch light (stories) in multi-pad controls. */
  lightIndex?: number;
}) {
  const t = useTheme();
  const light = useTouchLight({ disabled: !!disabled, index: lightIndex });
  const lit = usePressLight(light, { onPressIn, onPressOut });
  const press = usePressState(undefined, { onPressIn: lit.onPressIn, onPressOut: lit.onPressOut });
  // A latched pad under the finger sinks a little more; a resting one goes Neu/Pressed.
  const depth = look === "pressed" ? "flat" : look === "on" || press.pressed ? "pressed" : "raised";
  const shadow = useDepthStyle(
    disabled ? "flat" : depth,
    !disabled && look !== "rest" ? "signal" : false,
    look === "pressed" ? "active" : "rest",
  );
  return (
    <Pressable
      ref={lit.ref}
      disabled={disabled}
      onPressIn={press.onPressIn}
      onPressMove={lit.onPressMove}
      onPressOut={press.onPressOut}
      className={cn(
        "min-h-touch flex-1 items-center justify-center px-3",
        look === "pressed" ? "bg-primary" : "bg-card",
        className,
      )}
      style={[
        CONTINUOUS,
        {
          borderRadius: t.size.padRadius,
          borderWidth: look === "on" ? 1.5 : 0,
          borderColor: t.control.fill,
        },
        shadow,
        style,
      ]}
      {...props}
    >
      {/* Touch light: above the key fill, below the label. */}
      <TouchLightView light={light} radius={t.size.padRadius} />
      {children}
    </Pressable>
  );
}

function PadLabel({ pressed, children }: { pressed?: boolean; children: React.ReactNode }) {
  return (
    <Text
      className={cn(
        "text-center text-sm font-semibold",
        pressed ? "text-primary-foreground" : "text-foreground",
      )}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
    >
      {children}
    </Text>
  );
}

/** Pad caption: ON lit in the signal colour (the pad's LED), OFF muted. Figma Control/Label. */
function PadState({ on }: { on: boolean }) {
  const t = useTheme();
  return (
    <Text
      className="text-xs font-medium uppercase tracking-overline"
      style={
        on
          ? {
              color: t.control.fill,
              textShadowColor: t.control.fill,
              textShadowRadius: 6,
              textShadowOffset: { width: 0, height: 0 },
            }
          : { color: t.color.textMuted }
      }
    >
      {on ? "ON" : "OFF"}
    </Text>
  );
}

/** Fixed Figma size of a sized pad (regular 150×88, compact 104×64), centred in its cell. */
function useSizedBox(size: PadSize | undefined) {
  const t = useTheme();
  if (!size) return null;
  return size === "compact"
    ? { maxWidth: t.size.padCompactW, maxHeight: t.size.padCompactH }
    : { maxWidth: t.size.padRegularW, maxHeight: t.size.padRegularH };
}

/** Momentary pad: sends `press` on touch down and `release` on touch up. Lit only while held. */
export function ButtonControl({ control: c, value, onChange, disabled }: ControlProps<"button">) {
  const pressed =
    typeof value === "object" && value !== null && "pressed" in value && value.pressed;
  const box = useSizedBox(c.size);
  return (
    <ControlFrame disabled={disabled}>
      <View className={cn("flex-1", box && "items-center justify-center")}>
        <Pad
          look={pressed ? "pressed" : "rest"}
          disabled={disabled}
          onPressIn={() => onChange({ pressed: true })}
          onPressOut={() => onChange({ pressed: false })}
          accessibilityRole="button"
          accessibilityLabel={c.label ?? c.id}
          style={box ? [{ width: "100%", height: "100%", flex: 0 }, box] : undefined}
        >
          <PadLabel pressed={!!pressed}>{c.label ?? c.id}</PadLabel>
        </Pad>
      </View>
    </ControlFrame>
  );
}

/** Status LED: lit (control signal colour, glowing) or dark (tick colour). */
export function Led({ on, className }: { on: boolean; className?: string }) {
  const glow = useDepthStyle("flat", on ? "signal" : false);
  return (
    <View
      className={cn("h-2 w-2 rounded-full", on ? "bg-control-fill" : "bg-control-track", className)}
      style={on ? glow : undefined}
    />
  );
}

/** Figma Button Group LED strip: a short bar under the label, lit when the button is on. */
function LedBar({ on }: { on: boolean }) {
  const t = useTheme();
  const glow = useDepthStyle("flat", on ? "signal" : false);
  return (
    <View
      style={[
        { width: 40, height: 4, borderRadius: 2 },
        { backgroundColor: on ? t.control.fill : t.control.tick },
        on ? glow : undefined,
      ]}
    />
  );
}

export function ToggleControl(props: ControlProps<"toggle">) {
  if (props.control.style === "switch") return <SwitchToggle {...props} />;
  if (props.control.style === "led") return <LedToggle {...props} />;
  return <ButtonToggle {...props} />;
}

/**
 * Toggle `style: "led"` (Figma Group Button, the channel strip's ON button): a raised key that stays
 * raised; the LED strip under the label lights when on. Without a label it reads ON / OFF.
 */
function LedToggle({ control: c, value, onChange, disabled }: ControlProps<"toggle">) {
  const on = value === true;
  const label = c.label || (on ? "ON" : "OFF");
  return (
    <View className="flex-1">
      <Pad
        disabled={disabled}
        className="min-h-0 gap-1.5 px-1"
        onPress={() => onChange(!on)}
        accessibilityRole="switch"
        accessibilityState={{ checked: on, disabled: !!disabled }}
        accessibilityLabel={c.label || c.id}
      >
        <Text
          className={cn(
            "text-center text-sm font-semibold uppercase",
            on ? "text-foreground" : "text-muted-foreground",
          )}
          numberOfLines={1}
        >
          {label}
        </Text>
        <LedBar on={on} />
      </Pad>
    </View>
  );
}

/**
 * Hardware-style latching switch (toggle `style: "switch"`): the DS LED Switch on a raised card
 * row (Figma pult: Logo / Live data / Audio react).
 */
function SwitchToggle({ control: c, value, onChange, disabled }: ControlProps<"toggle">) {
  const on = value === true;
  const t = useTheme();
  const shadow = useDepthStyle("raised");
  return (
    <ControlFrame disabled={disabled}>
      <View className="flex-1 justify-center">
        <View
          className="bg-card min-h-16 flex-row items-center gap-3 px-4"
          style={[CONTINUOUS, { borderRadius: t.radius.lg }, shadow]}
        >
          <Text className="text-foreground text-md flex-1" numberOfLines={1}>
            {c.label ?? c.id}
          </Text>
          <LedSwitch
            value={on}
            onValueChange={(v) => onChange(v)}
            label={c.label ?? c.id}
            showLabel={false}
            offLed={false}
            disabled={disabled}
          />
        </View>
      </View>
    </ControlFrame>
  );
}

function ButtonToggle(props: ControlProps<"toggle">) {
  const { control: c, value, onChange, disabled } = props;
  const services = useControlServices();
  const source = c.image ? services.asset(c.image) : null;
  const box = useSizedBox(c.size);
  if (source) return <PicturePad {...props} source={source} />;
  const on = value === true;
  return (
    <ControlFrame disabled={disabled}>
      <View className={cn("flex-1", box && "items-center justify-center")}>
        <Pad
          look={on ? "on" : "rest"}
          disabled={disabled}
          onPress={() => onChange(!on)}
          accessibilityRole="switch"
          accessibilityState={{ checked: on, disabled: !!disabled }}
          accessibilityLabel={c.label ?? c.id}
          className="gap-1"
          style={box ? [{ width: "100%", height: "100%", flex: 0 }, box] : undefined}
        >
          <PadLabel>{c.label ?? c.id}</PadLabel>
          <PadState on={on} />
        </Pad>
      </View>
    </ControlFrame>
  );
}

/**
 * Picture pad (toggle with `image`, Figma Toggle Content=Image): a square key showing the image
 * (168 pt regular / 120 pt compact, smaller if the cell is). The label sits bottom-left on a
 * legibility gradient. Off: the picture at ~45 % opacity; on: full opacity, lit ring + LED.
 */
function PicturePad({
  control: c,
  value,
  onChange,
  disabled,
  source,
}: ControlProps<"toggle"> & { source: ImageSourcePropType }) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const on = value === true;
  const target = c.size === "compact" ? t.size.picturePadCompact : t.size.picturePadRegular;
  const side = size.width > 0 ? Math.min(target, size.width, size.height) : 0;
  const r = t.size.padRadius;
  const light = useTouchLight({ disabled: !!disabled });
  const lit = usePressLight(light);
  const press = usePressState(undefined, { onPressIn: lit.onPressIn, onPressOut: lit.onPressOut });
  const shadow = useDepthStyle(
    disabled ? "flat" : on || press.pressed ? "pressed" : "raised",
    !disabled && on ? "signal" : false,
  );
  return (
    <ControlFrame disabled={disabled}>
      <View className="flex-1 items-center justify-center" onLayout={onLayout}>
        {side > 0 && (
          <Pressable
            ref={lit.ref}
            disabled={disabled}
            onPress={() => onChange(!on)}
            onPressIn={press.onPressIn}
            onPressMove={lit.onPressMove}
            onPressOut={press.onPressOut}
            accessibilityRole="switch"
            accessibilityState={{ checked: on, disabled: !!disabled }}
            accessibilityLabel={c.label ?? c.id}
            className="bg-card"
            style={[CONTINUOUS, { width: side, height: side, borderRadius: r }, shadow]}
          >
            <View
              className="flex-1 justify-end overflow-hidden px-3 pb-2.5"
              style={[CONTINUOUS, { borderRadius: r }]}
            >
              <Image
                source={source}
                resizeMode="cover"
                style={[StyleSheet.absoluteFill, { opacity: on ? 1 : PICTURE_OFF_OPACITY }]}
                accessibilityIgnoresInvertColors
              />
              {/* Legibility gradient: clear above 45 %, background colour at the bottom. */}
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
                <Defs>
                  <LinearGradient id={`pad-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0.45" stopColor={t.color.background} stopOpacity={0} />
                    <Stop offset="1" stopColor={t.color.background} stopOpacity={0.85} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill={`url(#pad-${c.id})`} />
              </Svg>
              {/* Touch light: above the picture, below the label. */}
              <TouchLightView light={light} radius={r} />
              <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                {c.label ?? c.id}
              </Text>
              <PadState on={on} />
            </View>
            {on && (
              <View
                pointerEvents="none"
                style={[
                  CONTINUOUS,
                  StyleSheet.absoluteFill,
                  { borderRadius: r, borderWidth: 1.5, borderColor: t.control.fill },
                ]}
              />
            )}
          </Pressable>
        )}
      </View>
    </ControlFrame>
  );
}

/** Off picture pads show their image dimmed (Figma: ~45 %). */
const PICTURE_OFF_OPACITY = 0.45;

/**
 * Figma `Segmented`: a raised capsule housing (4 pt padding) with the selected option as an inset
 * capsule — its label glows in the signal colour. Never a lit fill.
 */
export function Segmented({ control: c, value, onChange, disabled }: ControlProps<"segmented">) {
  const t = useTheme();
  const selected = typeof value === "number" ? value : c.default;
  const housing = useDepthStyle("raised");
  const well = useDepthStyle("pressed");
  return (
    <ControlFrame label={c.label} disabled={disabled}>
      <View className="flex-1 justify-center">
        <View
          className="bg-card h-14 flex-row gap-0.5 rounded-full p-1"
          style={[CONTINUOUS, { borderWidth: 1, borderColor: t.control.trackBorder }, housing]}
          accessibilityRole="radiogroup"
        >
          {c.options.map((o, i) => (
            <SegmentOption
              key={i}
              index={i}
              label={o.label}
              icon={iconByName(o.icon)}
              active={i === selected}
              disabled={disabled}
              well={well}
              onPress={() => onChange(i)}
            />
          ))}
        </View>
      </View>
    </ControlFrame>
  );
}

/** One Segmented option: an inset capsule when selected, with its own touch light. */
function SegmentOption({
  index,
  label,
  icon,
  active,
  disabled,
  well,
  onPress,
}: {
  index: number;
  label: string;
  /** Figma Segmented Content=Icon: the icon instead of the text (the label stays its name). */
  icon?: PhosphorIcon | null;
  active: boolean;
  disabled?: boolean;
  well: { boxShadow: string };
  onPress: () => void;
}) {
  const t = useTheme();
  const light = useTouchLight({ disabled: !!disabled, index });
  const lit = usePressLight(light);
  return (
    <Pressable
      ref={lit.ref}
      disabled={disabled}
      onPress={onPress}
      onPressIn={lit.onPressIn}
      onPressMove={lit.onPressMove}
      onPressOut={lit.onPressOut}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      className={cn(
        "flex-1 items-center justify-center rounded-full px-2",
        active && "bg-control-track",
      )}
      style={[CONTINUOUS, active ? well : undefined]}
    >
      {/* Touch light: inside the segment's capsule, below the label. */}
      <TouchLightView light={light} radius={t.radius.full} />
      {icon ? (
        <Glyph icon={icon} size={22} color={active ? t.control.fill : t.color.textMuted} />
      ) : (
        <Text
          className="text-sm"
          style={
            active
              ? {
                  color: t.control.fill,
                  textShadowColor: t.control.fill,
                  textShadowRadius: 8,
                  textShadowOffset: { width: 0, height: 0 },
                }
              : { color: t.color.textMuted }
          }
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** Grid of pads. `radio` keeps one cell lit, `toggle` latches each cell, `momentary` lights while held. */
export function ButtonGrid({ control: c, value, onChange, disabled }: ControlProps<"buttonGrid">) {
  const [lit, setLit] = React.useState<Set<number>>(new Set());
  React.useEffect(() => {
    if (typeof value !== "object" || value === null || !("cell" in value)) return;
    setLit((prev) => {
      const next = c.mode === "radio" ? new Set<number>() : new Set(prev);
      if (value.on) next.add(value.cell);
      else next.delete(value.cell);
      return next;
    });
  }, [value, c.mode]);

  const rows = Array.from({ length: c.rows }, (_, r) => r);
  const cols = Array.from({ length: c.cols }, (_, k) => k);
  return (
    <ControlFrame label={c.label} disabled={disabled}>
      <View className="flex-1 gap-2">
        {rows.map((r) => (
          <View key={r} className="flex-1 flex-row gap-2">
            {cols.map((k) => {
              const cell = r * c.cols + k;
              const on = lit.has(cell);
              const label = c.labels?.[cell] ?? String(cell + 1);
              const press = () => {
                if (c.mode === "momentary") onChange({ cell, on: true });
                else if (c.mode === "radio") onChange({ cell, on: true });
                else onChange({ cell, on: !on });
              };
              return (
                <Pad
                  key={k}
                  lightIndex={cell}
                  look={on ? (c.mode === "momentary" ? "pressed" : "on") : "rest"}
                  disabled={disabled}
                  className="min-h-0 px-1"
                  onPressIn={press}
                  onPressOut={() => c.mode === "momentary" && onChange({ cell, on: false })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${c.label ?? c.id} ${label}`}
                >
                  <PadLabel pressed={on && c.mode === "momentary"}>{label}</PadLabel>
                </Pad>
              );
            })}
          </View>
        ))}
      </View>
    </ControlFrame>
  );
}

export function SceneList({ control: c, value, onChange, disabled }: ControlProps<"sceneList">) {
  return (
    <ControlFrame label={c.label} disabled={disabled}>
      <ScrollView contentContainerClassName="gap-2" className="flex-1">
        {c.scenes.map((s) => {
          const active = value === s.id;
          return (
            <Pad
              key={s.id}
              look={active ? "on" : "rest"}
              lightIndex={c.scenes.indexOf(s)}
              disabled={disabled}
              onPress={() => onChange(s.id)}
              className="min-h-14 flex-none flex-row justify-between"
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <PadLabel>{s.label}</PadLabel>
              {active && <Led on />}
            </Pad>
          );
        })}
      </ScrollView>
    </ControlFrame>
  );
}

/** Multi-select latching buttons with an LED strip; each button toggles on its own. */
export function ButtonGroup({
  control: c,
  value,
  onChange,
  disabled,
}: ControlProps<"buttonGroup">) {
  const lit = new Set(isGroupValue(value) ? value.on : c.default);
  return (
    <ControlFrame label={c.label} disabled={disabled}>
      <View className="flex-1 flex-row gap-2">
        {c.buttons.map((b, i) => {
          const on = lit.has(b.id);
          return (
            <View key={b.id} className="flex-1 gap-1.5">
              <Pad
                lightIndex={i}
                disabled={disabled}
                className="min-h-0 gap-1.5 px-1"
                onPress={() => onChange(toggleInGroup(c, value, b.id))}
                accessibilityRole="switch"
                accessibilityState={{ checked: on, disabled: !!disabled }}
                accessibilityLabel={b.caption ? `${b.label}, ${b.caption}` : b.label}
              >
                {/* Figma Group Button: the key stays raised; the LED strip and the label light up. */}
                <Text
                  className={cn(
                    "text-center text-sm font-semibold uppercase",
                    on ? "text-foreground" : "text-muted-foreground",
                  )}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {b.label}
                </Text>
                <LedBar on={on} />
              </Pad>
              {/* The caption sits under the key (Figma Layer Toggles: BRAND, LIVE FEED…). */}
              {b.caption && (
                <Text
                  className="text-muted-foreground text-center text-xs font-medium uppercase tracking-overline"
                  numberOfLines={1}
                >
                  {b.caption}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </ControlFrame>
  );
}

/**
 * Figma `Label` (Size=MD / LG): a raised-surface card (radius 14, hairline border) with the text
 * centred in mono — MD 13 regular, LG 28 bold. `sm` and `xl` extend the scale (11 / 40).
 */
const LABEL_SIZE = {
  sm: "text-xs font-normal",
  md: "text-sm font-normal",
  lg: "text-2xl font-bold",
  xl: "text-display font-bold",
} as const;

export function LabelControl({ control: c, value }: ControlProps<"label">) {
  const t = useTheme();
  const text =
    value === null || value === undefined || value === ""
      ? c.text || "—"
      : formatValue(value as string, { format: c.format });
  return (
    <ControlFrame label={c.label}>
      <View
        className="bg-secondary flex-1 items-center justify-center border border-border px-3"
        style={[CONTINUOUS, { borderRadius: t.size.padRadius }]}
        accessible
        accessibilityRole="text"
      >
        <Text
          className={cn("text-foreground text-center font-mono", LABEL_SIZE[c.size])}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {text}
        </Text>
      </View>
    </ControlFrame>
  );
}

/** Shown for control types added in a newer app version. The rest of the pult keeps working. */
export function UnsupportedPlaceholder({ control }: { control: UnsupportedControl }) {
  return (
    <View className="flex-1 items-center justify-center gap-1 rounded-md border border-dashed border-border p-3">
      <Text className="text-foreground text-sm font-medium">Update the app</Text>
      <Text className="text-muted-foreground text-center text-xs">
        This control ({control.originalType}) needs a newer version.
      </Text>
    </View>
  );
}
