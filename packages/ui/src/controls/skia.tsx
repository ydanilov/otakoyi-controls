import { BlurMask, Canvas, Circle, Group, RoundedRect, Shadow } from "@shopify/react-native-skia";
import type { Theme } from "@osc/tokens";
import type * as React from "react";
import type { SharedValue } from "react-native-reanimated";

/**
 * Skia versions of the Figma effect styles, for the continuous controls (fader, jog, knob).
 * Figma blur radii are CSS-like; Skia blurs take a sigma (≈ radius / 2).
 *
 * - Raised (Neu/Raised, Neu/Raised SM): a drop shadow straight down + a contact shadow, then the
 *   body with a 1 px top edge light and a soft dark bottom edge.
 * - Inset (Neu/Inset, Neu/Pressed): the body with an inner shadow from the top and an inner
 *   highlight from the bottom.
 * - Lit: a value line / LED with Glow/Primary Active (12 + 3) scaled by `glow` (rest ≈ 40 %).
 */

type Num = number | SharedValue<number>;

export const sigma = (cssBlur: number) => cssBlur / 2;

export interface Box {
  x: Num;
  y: Num;
  width: Num;
  height: Num;
  r: number;
}

/** Neu/Raised (or Raised SM with `sm`) rounded rect. */
export function RaisedRRect({
  t,
  color,
  sm,
  ...b
}: Box & { t: Theme; color: string; sm?: boolean }) {
  const e = t.elevation;
  return (
    <Group>
      <Group transform={[{ translateY: sm ? 6 : 14 }]}>
        <RoundedRect {...b} color={e.shadow}>
          <BlurMask blur={sigma(sm ? 16 : 32) * 0.8} style="normal" />
        </RoundedRect>
      </Group>
      <Group transform={[{ translateY: sm ? 1 : 2 }]}>
        <RoundedRect {...b} color={e.shadowContact}>
          <BlurMask blur={sigma(sm ? 2 : 4)} style="normal" />
        </RoundedRect>
      </Group>
      <RoundedRect {...b} color={color}>
        <Shadow dx={0} dy={1} blur={0} color={e.edgeLight} inner />
        <Shadow dx={0} dy={sm ? -1 : -2} blur={sigma(sm ? 5 : 8)} color={e.edgeDark} inner />
      </RoundedRect>
    </Group>
  );
}

/** Neu/Inset (or Neu/Pressed with `pressed`) rounded rect: a recessed bed. */
export function InsetRRect({
  t,
  color,
  pressed,
  ...b
}: Box & { t: Theme; color: string; pressed?: boolean }) {
  const e = t.elevation;
  return (
    <RoundedRect {...b} color={color}>
      <Shadow
        dx={0}
        dy={pressed ? 2 : 3}
        blur={sigma(pressed ? 6 : 8)}
        color={e.insetShadow}
        inner
      />
      <Shadow dx={0} dy={-1} blur={sigma(pressed ? 3 : 4)} color={e.insetHighlight} inner />
    </RoundedRect>
  );
}

/** A lit rounded rect (fill line, LED) with its glow; `glow` 0..1 (rest ≈ 0.4, active 1). */
export function LitRRect({
  color,
  glow,
  ...b
}: Box & { color: string; glow: SharedValue<number> | number }) {
  return (
    <Group>
      <RoundedRect {...b} color={color} opacity={glow}>
        <BlurMask blur={sigma(12)} style="outer" />
      </RoundedRect>
      <RoundedRect {...b} color={color} opacity={glow}>
        <BlurMask blur={sigma(3)} style="outer" />
      </RoundedRect>
      <RoundedRect {...b} color={color} />
    </Group>
  );
}

export interface Disc {
  cx: Num;
  cy: Num;
  r: Num;
}

export function RaisedCircle({ t, color, ...c }: Disc & { t: Theme; color: string }) {
  const e = t.elevation;
  return (
    <Group>
      <Group transform={[{ translateY: 14 }]}>
        <Circle {...c} color={e.shadow}>
          <BlurMask blur={sigma(32) * 0.8} style="normal" />
        </Circle>
      </Group>
      <Group transform={[{ translateY: 2 }]}>
        <Circle {...c} color={e.shadowContact}>
          <BlurMask blur={sigma(4)} style="normal" />
        </Circle>
      </Group>
      <Circle {...c} color={color}>
        <Shadow dx={0} dy={1} blur={0} color={e.edgeLight} inner />
        <Shadow dx={0} dy={-2} blur={sigma(8)} color={e.edgeDark} inner />
      </Circle>
    </Group>
  );
}

export function InsetCircle({
  t,
  color,
  pressed,
  children,
  ...c
}: Disc & { t: Theme; color: string; pressed?: boolean; children?: React.ReactNode }) {
  const e = t.elevation;
  return (
    <Circle {...c} color={color}>
      <Shadow
        dx={0}
        dy={pressed ? 2 : 3}
        blur={sigma(pressed ? 6 : 8)}
        color={e.insetShadow}
        inner
      />
      <Shadow dx={0} dy={-1} blur={sigma(pressed ? 3 : 4)} color={e.insetHighlight} inner />
      {children}
    </Circle>
  );
}

/** A lit dot (knob indicator, encoder LEDs) with Glow/Primary scaled by `glow`. */
export function LitCircle({
  color,
  glow,
  ...c
}: Disc & { color: string; glow: SharedValue<number> | number }) {
  return (
    <Group>
      <Circle {...c} color={color} opacity={glow}>
        <BlurMask blur={sigma(8)} style="outer" />
      </Circle>
      <Circle {...c} color={color} opacity={glow}>
        <BlurMask blur={sigma(2)} style="outer" />
      </Circle>
      <Circle {...c} color={color} />
    </Group>
  );
}

/**
 * A canvas the size of its control that may draw `overhang` pt beyond it on every side (Figma lets
 * a disc's drop shadow or a glow spill out of the component). Children draw in the control's own
 * coordinates; touches go to the view underneath.
 */
export function OverhangCanvas({
  width,
  height,
  overhang = 24,
  children,
}: {
  width: number;
  height: number;
  overhang?: number;
  children: React.ReactNode;
}) {
  const o = overhang;
  return (
    <Canvas
      style={{
        position: "absolute",
        left: -o,
        top: -o,
        width: width + o * 2,
        height: height + o * 2,
      }}
      pointerEvents="none"
    >
      <Group transform={[{ translateX: o }, { translateY: o }]}>{children}</Group>
    </Canvas>
  );
}
