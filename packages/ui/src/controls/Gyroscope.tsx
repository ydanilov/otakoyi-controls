import {
  BlurMask,
  Canvas,
  Circle,
  DashPathEffect,
  Line,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import {
  asTilt,
  createGyroscope,
  formatTilt,
  gyroscopeState,
  GYROSCOPE_MESSAGES,
  LEVEL,
  type Tilt,
} from "@osc/controls";
import * as React from "react";
import { AppState, Pressable, View } from "react-native";
import { Text } from "@osc/ui/components/ui/text";
import { cn } from "@osc/ui/lib/utils";
import { Button } from "../chrome/Button";
import { Surface } from "../ds/depth";
import { MenuSwitch } from "../forms/MenuSwitch";
import { useControlServices } from "../platform/services";
import { useTheme } from "../theme/ThemeProvider";
import { ControlFrame } from "./ControlFrame";
import type { ControlProps } from "./types";
import { useLayout } from "./useLayout";

/** Figma Gyroscope (204:853) Tilt plane: 96 pt square, full-range ring r 41, half ring r 21.8, dot r 6.1. */
const PLANE = 96;
const C = PLANE / 2;
const REACH = 41;
const HALF = 21.8;
const DOT = 6.1;
/** Body height below the header (card 124 + 12 + message 18) plus the Open Settings button (12 + 48). */
const WITH_BUTTON = 124 + 12 + 18 + 12 + 48;

/**
 * Gyroscope (device tilt): the phone becomes the controller. The Menu Switch turns sending on; the
 * pose at that moment is the centre, and the tilt from it (`range` degrees = the outer ring) is
 * sent as `<address> x y` at `rateHz` (driver and mapping in @osc/controls). The inset plane shows
 * exactly what is sent. Motion comes from the platform's `MotionInput`. Sending stops when the app
 * goes to the background or the device loses control; a device without control (view only) shows
 * the tilt another device sends.
 */
export function Gyroscope({ control: c, value, onChange, disabled }: ControlProps<"gyroscope">) {
  const t = useTheme();
  const { motion } = useControlServices();
  const { size, onLayout } = useLayout();
  const [live, setLive] = React.useState(false);
  const [denied, setDenied] = React.useState(false);
  const [missing, setMissing] = React.useState(false);
  const [local, setLocal] = React.useState<Tilt>(LEVEL);
  const sensor = React.useRef<(() => void) | null>(null);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const gyro = React.useMemo(
    () => createGyroscope({ rateHz: c.rateHz, range: c.range }, (v) => onChangeRef.current(v)),
    [c.rateHz, c.range],
  );

  // Permission denied shows before the first tap when the platform already knows.
  React.useEffect(() => {
    if (!motion.available) return;
    let alive = true;
    motion.permission().then(
      (p) => alive && setDenied(p === "denied"),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [motion]);

  const stop = React.useCallback(
    (report: boolean) => {
      sensor.current?.();
      sensor.current = null;
      if (report) gyro.stop();
      else gyro.dispose();
      setLive(false);
      setLocal(LEVEL);
    },
    [gyro],
  );
  React.useEffect(
    () => () => {
      sensor.current?.();
      sensor.current = null;
      gyro.dispose();
    },
    [gyro],
  );
  // Control lost (view only / offline): this device may no longer send, so just stop reading.
  React.useEffect(() => {
    if (disabled && gyro.live) stop(false);
  }, [disabled, gyro, stop]);
  // App in the background: stop and report the centre.
  React.useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active" && gyro.live) stop(true);
    });
    return () => sub.remove();
  }, [gyro, stop]);

  const start = async () => {
    if (!(await motion.requestPermission())) return setDenied(true);
    setDenied(false);
    gyro.start();
    try {
      const off = await motion.start({ rateHz: c.rateHz }, (s) => {
        const v = gyro.sample(s);
        if (v) setLocal(v);
      });
      if (!gyro.live) return off(); // switched off (or lost control) while starting
      sensor.current = off;
      setLive(true);
    } catch {
      // Granted but no readings (no sensor, or a desktop browser): show it as unavailable.
      gyro.dispose();
      setMissing(true);
    }
  };
  const toggle = (on: boolean) => {
    if (on) void start();
    else stop(true);
  };

  const state = gyroscopeState({
    live,
    denied,
    available: motion.available && !missing,
    disabled: !!disabled,
  });
  const synced = asTilt(value);
  const shown: Tilt | null = live ? local : state === "viewOnly" ? (synced ?? LEVEL) : null;
  const dot = shown ?? LEVEL;
  const dotX = C + dot.x * REACH;
  const dotY = C - dot.y * REACH;
  const signal = t.control.fill;
  const settings = state === "denied" && motion.openSettings;
  const roomy = size.height >= WITH_BUTTON;

  return (
    <ControlFrame
      label={c.label}
      value={formatTilt(shown)}
      valueMuted={!live}
      disabled={state === "viewOnly"}
      className="gap-3"
    >
      <View className="flex-1 gap-3" onLayout={onLayout}>
        <Surface
          depth="raised"
          radius="lg"
          className="flex-row items-center justify-between py-3.5 pl-3.5 pr-5"
        >
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${c.label ?? c.id}: tilt ${formatTilt(shown ?? LEVEL)}`}
            testID={`gyroscope-plane-${c.id}`}
            style={{ width: PLANE, height: PLANE }}
          >
            <Canvas style={{ width: PLANE, height: PLANE }}>
              <RoundedRect
                x={0}
                y={0}
                width={PLANE}
                height={PLANE}
                r={8.727}
                color={t.control.track}
              />
              <RoundedRect
                x={0.5}
                y={0.5}
                width={PLANE - 1}
                height={PLANE - 1}
                r={8.3}
                color={t.control.trackBorder}
                style="stroke"
                strokeWidth={1}
              />
              <Line
                p1={vec(C - REACH, C)}
                p2={vec(C + REACH, C)}
                color={t.control.tick}
                strokeWidth={0.873}
              />
              <Line
                p1={vec(C, C - REACH)}
                p2={vec(C, C + REACH)}
                color={t.control.tick}
                strokeWidth={0.873}
              />
              <Circle
                cx={C}
                cy={C}
                r={HALF}
                color={t.control.tick}
                style="stroke"
                strokeWidth={0.873}
              >
                <DashPathEffect intervals={[2.5, 2.5]} />
              </Circle>
              <Circle
                cx={C}
                cy={C}
                r={REACH}
                color={t.control.tick}
                style="stroke"
                strokeWidth={0.873}
              />
              {live ? (
                <>
                  <Line
                    p1={vec(C, C)}
                    p2={vec(dotX, dotY)}
                    color={signal}
                    strokeWidth={1.3}
                    strokeCap="round"
                  />
                  <Circle cx={dotX} cy={dotY} r={DOT} color={signal}>
                    <BlurMask blur={5} style="outer" />
                  </Circle>
                  <Circle cx={dotX} cy={dotY} r={DOT} color={signal} />
                </>
              ) : (
                <Circle cx={dotX} cy={dotY} r={DOT} color={t.color.textMuted} />
              )}
            </Canvas>
          </View>
          <MenuSwitch
            value={live}
            onValueChange={toggle}
            label={`${c.label ?? c.id}: send tilt`}
            disabled={state !== "off" && state !== "live"}
          />
        </Surface>
        <View className="flex-row items-center gap-2">
          <Text
            className={cn(
              "shrink text-sm",
              state === "denied" ? "text-status-critical" : "text-muted-foreground",
            )}
            numberOfLines={2}
            testID={`gyroscope-message-${c.id}`}
          >
            {GYROSCOPE_MESSAGES[state]}
          </Text>
          {settings && !roomy && (
            <Pressable accessibilityRole="button" onPress={settings} hitSlop={8}>
              <Text className="text-foreground text-sm font-semibold">Open Settings</Text>
            </Pressable>
          )}
        </View>
        {settings && roomy && (
          <Button
            label="Open Settings"
            variant="secondary"
            block
            className="h-12"
            onPress={settings}
          />
        )}
      </View>
    </ControlFrame>
  );
}
