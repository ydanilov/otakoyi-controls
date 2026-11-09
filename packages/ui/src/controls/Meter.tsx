import { BlurMask, Canvas, Group, RoundedRect } from "@shopify/react-native-skia";
import {
  METER_SCALE,
  METER_SEGMENTS,
  METER_UNLIT_OPACITY,
  NO_PEAK,
  clamp,
  formatValue,
  meterSegments,
  meterZones,
  stepPeak,
  type MeterZone,
  type PeakState,
} from "@osc/controls";
import * as React from "react";
import { View } from "react-native";
import { Text } from "@osc/ui/components/ui/text";
import { useTheme } from "../theme/ThemeProvider";
import { InsetRRect } from "./skia";
import { ControlFrame } from "./ControlFrame";
import type { ControlProps } from "./types";
import { useLayout } from "./useLayout";

/** Figma Meter: the well is 30 pt wide with 4 pt inside; 10 pt top / bottom; 2 pt between cells. */
const WELL = 30;
const INSET = 4;
const END = 10;
const GAP = 2;
/** Scale column: 4 pt tick, label 8 pt right of the well's edge + 8. */
const SCALE_GAP = 8;
const SCALE_W = 34;

/**
 * Level meter (Figma `Meter` 11:172), display-only: a 24-segment LED column in a recessed track.
 * Zones signal ≤ 70 % / warning 70–90 % / critical > 90 % (or `warnAt` / `criticalAt`); unlit
 * segments show their zone colour at 13 %; the top 3 lit segments glow; a white peak-hold line
 * holds ~1.5 s, then falls; dB scale 0 / −6 / −12 / −24 / −48 on the right in mono 9 pt. Status
 * colours are never brandable. Maths: `@osc/controls` meter.ts.
 */
export function Meter({ control: c, value }: ControlProps<"meter">) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const v = typeof value === "number" ? value : c.min;
  const level = clamp((v - c.min) / (c.max - c.min));
  const zones = meterZones(c);
  const peak = usePeak(level);
  const segments = meterSegments(level, zones);
  const zoneColor: Record<MeterZone, string> = {
    signal: t.control.fill,
    warning: t.status.warning,
    critical: t.status.critical,
  };
  const vertical = c.orientation !== "horizontal";
  const { width: w, height: h } = size;

  // Vertical: the well and the scale are centred together; horizontal: the well spans the width.
  const groupW = WELL + SCALE_GAP + SCALE_W;
  const wellX = vertical ? Math.max(0, (w - groupW) / 2) : 0;
  const wellW = vertical ? WELL : w;
  const wellH = vertical ? h : WELL;
  const wellY = vertical ? 0 : Math.max(0, (h - WELL - 16) / 2);
  const along = Math.max(0, (vertical ? wellH : wellW) - END * 2);
  const cell = (along - GAP * (METER_SEGMENTS - 1)) / METER_SEGMENTS;
  const pitch = cell + GAP;
  /** Rect of segment i (0 = bottom / left). */
  const seg = (i: number) =>
    vertical
      ? {
          x: wellX + INSET,
          y: wellY + END + (METER_SEGMENTS - 1 - i) * pitch,
          width: WELL - INSET * 2,
          height: cell,
        }
      : { x: wellX + END + i * pitch, y: wellY + INSET, width: cell, height: WELL - INSET * 2 };
  const peakAt = END + (1 - peak) * along; // from the top / start, px
  const showPeak = peak > 0.001;

  return (
    <ControlFrame label={c.label} value={formatValue(v)}>
      <View
        className="flex-1"
        onLayout={onLayout}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={c.label ?? c.id}
        accessibilityValue={{ min: c.min, max: c.max, now: v }}
      >
        {w > 0 && cell > 0 && (
          <Canvas style={{ width: w, height: h }}>
            <InsetRRect
              t={t}
              color={t.control.track}
              x={wellX}
              y={wellY}
              width={wellW}
              height={wellH}
              r={12}
            />
            {segments.map((s) => {
              const r = seg(s.index);
              const color = zoneColor[s.zone];
              return (
                <Group key={s.index}>
                  {s.glow && (
                    <RoundedRect {...r} r={2} color={color}>
                      <BlurMask blur={4} style="outer" />
                    </RoundedRect>
                  )}
                  <RoundedRect
                    {...r}
                    r={2}
                    color={color}
                    opacity={s.lit ? 1 : METER_UNLIT_OPACITY}
                  />
                </Group>
              );
            })}
            {showPeak && (
              <RoundedRect
                x={vertical ? wellX + INSET : wellX + (wellW - peakAt) - 1}
                y={vertical ? wellY + peakAt - 1 : wellY + INSET}
                width={vertical ? WELL - INSET * 2 : 2}
                height={vertical ? 2 : WELL - INSET * 2}
                r={1}
                color={t.color.text}
                opacity={0.9}
              />
            )}
            {vertical &&
              METER_SCALE.map((m) => (
                <RoundedRect
                  key={m.db}
                  x={wellX + WELL + SCALE_GAP}
                  y={wellY + END + m.at * along}
                  width={4}
                  height={1}
                  r={0}
                  color={t.color.textMuted}
                />
              ))}
          </Canvas>
        )}
        {vertical &&
          w > 0 &&
          cell > 0 &&
          METER_SCALE.map((m) => (
            <Text
              key={m.db}
              pointerEvents="none"
              className="text-muted-foreground absolute font-mono text-[9px] leading-3"
              style={{ left: wellX + WELL + SCALE_GAP + 8, top: wellY + END + m.at * along - 6 }}
            >
              {scaleLabel(m.db)}
            </Text>
          ))}
        {!vertical && (
          <View className="mt-1 flex-row justify-between" pointerEvents="none">
            {[...METER_SCALE].reverse().map((m) => (
              <Text key={m.db} className="text-muted-foreground font-mono text-[9px]">
                {scaleLabel(m.db)}
              </Text>
            ))}
          </View>
        )}
      </View>
    </ControlFrame>
  );
}

/**
 * Peak-hold level (0–1): rises with the level, holds ~1.5 s, then falls (`stepPeak`).
 *
 * Stepped during render, not in an effect keyed on the level: a meter gets a new level with every
 * feedback message (10–30 Hz), and an effect that sets state on each one leaves an update pending
 * after every commit — React then aborts with "Maximum update depth exceeded" (fix/feedback-echo-loop).
 * Only the fall needs a timer, and its effect runs when falling starts or stops.
 */
function usePeak(level: number): number {
  const state = React.useRef<PeakState>(NO_PEAK);
  const [, redraw] = React.useReducer((n: number) => n + 1, 0);
  state.current = stepPeak(state.current, level, Date.now());
  const falling = state.current.peak > level;
  React.useEffect(() => {
    if (!falling) return;
    const id = setInterval(redraw, 50);
    return () => clearInterval(id);
  }, [falling]);
  return state.current.peak;
}

/** Scale label: `0`, `-6`, … (Figma uses a hyphen-minus in mono). */
const scaleLabel = (db: number) => (db === 0 ? "0" : `-${Math.abs(db)}`);
