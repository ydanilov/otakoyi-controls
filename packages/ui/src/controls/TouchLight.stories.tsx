import type { ControlValue } from "@osc/controls";
import type { Control } from "@osc/schema";
import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect } from "storybook/test";
import { Text } from "../components/ui/text";
import { Button as ChromeButton } from "../chrome/Button";
import { FlashlightIcon } from "../ds/icons";
import { QuickAction } from "../media/QuickAction";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs } from "../stories/docs";
import { PinTouchLight } from "./TouchLight";

type Kind =
  | "fader"
  | "faderHorizontal"
  | "crossfade"
  | "jog"
  | "knob"
  | "knobCompact"
  | "encoder"
  | "hue"
  | "pad"
  | "toggle"
  | "holdToConfirm"
  | "buttonGroup"
  | "segmented"
  | "xy"
  | "thumbstick"
  | "quickAction"
  | "button";

const KINDS: Kind[] = [
  "fader",
  "faderHorizontal",
  "crossfade",
  "jog",
  "knob",
  "knobCompact",
  "encoder",
  "hue",
  "pad",
  "toggle",
  "holdToConfirm",
  "buttonGroup",
  "segmented",
  "xy",
  "thumbstick",
  "quickAction",
  "button",
];

/** A control per kind, its value and the cell it is shown in. */
function sample(kind: Kind): { control: Control; value: ControlValue; w: number; h: number } {
  const fader = { type: "fader", id: "master", address: "/master", label: "Master" } as const;
  switch (kind) {
    case "fader":
      return { control: makeControl(fader), value: 0.6, w: 96, h: 260 };
    case "faderHorizontal":
      return {
        control: makeControl({ ...fader, orientation: "horizontal" }),
        value: 0.4,
        w: 300,
        h: 96,
      };
    case "crossfade":
      return {
        control: makeControl({
          ...fader,
          label: "Day / Night",
          mode: "crossfade",
          orientation: "horizontal",
          labels: { a: "Day", b: "Night" },
        }),
        value: 0.5,
        w: 300,
        h: 120,
      };
    case "jog":
      return {
        control: makeControl({ ...fader, label: "Scrub", mode: "relative" }),
        value: null,
        w: 96,
        h: 260,
      };
    case "knob":
      return {
        control: makeControl({ type: "knob", id: "speed", address: "/speed", label: "Speed" }),
        value: 0.4,
        w: 180,
        h: 200,
      };
    case "knobCompact":
      return {
        control: makeControl({
          type: "knob",
          id: "speed",
          address: "/speed",
          label: "Speed",
          size: "compact",
        }),
        value: 0.4,
        w: 140,
        h: 160,
      };
    case "encoder":
      return {
        control: makeControl({
          type: "knob",
          id: "nudge",
          address: "/nudge",
          label: "Nudge",
          mode: "relative",
        }),
        value: null,
        w: 180,
        h: 200,
      };
    case "hue":
      return {
        control: makeControl({
          type: "knob",
          id: "hue",
          address: "/hue",
          label: "Hue",
          mode: "hue",
        }),
        value: 200,
        w: 180,
        h: 200,
      };
    case "pad":
      return {
        control: makeControl({ type: "button", id: "go", address: "/go", label: "Go" }),
        value: null,
        w: 180,
        h: 110,
      };
    case "toggle":
      return {
        control: makeControl({ type: "toggle", id: "strobe", address: "/strobe", label: "Strobe" }),
        value: true,
        w: 180,
        h: 110,
      };
    case "holdToConfirm":
      return {
        control: makeControl({
          type: "holdToConfirm",
          id: "blackout",
          address: "/blackout",
          label: "Blackout",
          tone: "critical",
        }),
        value: null,
        w: 200,
        h: 96,
      };
    case "buttonGroup":
      return {
        control: makeControl({
          type: "buttonGroup",
          id: "layers",
          label: "Layers",
          buttons: [
            { id: "bg", label: "BG", address: "/layer/1" },
            { id: "fx", label: "FX", address: "/layer/2" },
            { id: "txt", label: "TXT", address: "/layer/3" },
          ],
          default: ["bg"],
        }),
        value: null,
        w: 300,
        h: 110,
      };
    case "segmented":
      return {
        control: makeControl({
          type: "segmented",
          id: "mode",
          address: "/mode",
          label: "Mode",
          options: [
            { label: "Calm", value: 0 },
            { label: "Pulse", value: 1 },
            { label: "Storm", value: 2 },
          ],
        }),
        value: 0,
        w: 300,
        h: 88,
      };
    case "xy":
      return {
        control: makeControl({ type: "xy", id: "pos", address: "/pos", label: "Position" }),
        value: { x: 0.5, y: 0.5 },
        w: 220,
        h: 200,
      };
    case "thumbstick":
      return {
        control: makeControl({ type: "thumbstick", id: "cam", address: "/cam", label: "Camera" }),
        value: null,
        w: 200,
        h: 200,
      };
    default:
      // Not pult controls: rendered directly below.
      return { control: makeControl({ type: "label", id: "x" }), value: null, w: 0, h: 0 };
  }
}

function Sample({ kind, disabled }: { kind: Kind; disabled: boolean }) {
  if (kind === "quickAction")
    return <QuickAction icon={FlashlightIcon} label="Flash" disabled={disabled} />;
  if (kind === "button") return <ChromeButton label="Take control" disabled={disabled} />;
  const s = sample(kind);
  return (
    <ControlHarness
      control={s.control}
      value={s.value}
      disabled={disabled}
      width={s.w}
      height={s.h}
      showOsc={false}
    />
  );
}

type Args = {
  kind: Kind;
  /** Pin the light (static snapshots): off = it only appears under a real finger / pointer. */
  pinned: boolean;
  /** Pinned point, fractions of the touch surface. */
  pinX: number;
  pinY: number;
  /** Which cell (segment, group button) the pin lights. */
  pinIndex: number;
  disabled: boolean;
};

function TouchLightStory({ kind, pinned, pinX, pinY, pinIndex, disabled }: Args) {
  return (
    <PinTouchLight at={pinned ? { x: pinX, y: pinY, index: pinIndex } : null}>
      <Sample kind={kind} disabled={disabled} />
    </PinTouchLight>
  );
}

const meta = {
  title: "Controls/Touch Light",
  component: TouchLightStory,
  args: { kind: "pad", pinned: true, pinX: 0.4, pinY: 0.45, pinIndex: 0, disabled: false },
  argTypes: {
    kind: { control: "select", options: KINDS },
    pinX: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    pinY: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    pinIndex: { control: { type: "range", min: 0, max: 2, step: 1 } },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Press response of every control: while a finger is down a soft light blooms under it inside the control's touch surface, follows it 1:1 and fades on release — like the iOS 26 text-field touch highlight. Not a control itself; `useTouchLight()` + `TouchLightSkia` / `TouchLightView`.",
          use: [
            "Every pressable or draggable control: Fader (all modes), Knob (all modes and sizes), Pad, Toggle, Hold to Confirm, Group Button, Segmented (per segment), Quick Action, Button, XY Pad, Thumbstick.",
          ],
          avoid: [
            "Status or value display — that is the glow (Glow/Primary), not the touch light.",
          ],
          do: [
            "Draw it above the surface fill and below labels, icons, LEDs and grips.",
            "Clip it to the surface's rounded shape on pads, buttons, toggles, segments, quick actions and the XY pad.",
          ],
          dont: [
            "Don't make it brighter or tint it: white only, it must never wash out a label (halo 7 %, core 12 %, inner 16 %).",
            "Don't let it spill onto the track or around the control.",
            "Don't show it on disabled or view-only controls.",
          ],
          anatomy: [
            "Inner light (faders, knobs, thumbstick, jog wheel) — the thumb / disc / stick / wheel itself gets a radial white gradient, `touchLight.innerOpacity` (16 %) at the touch point → 0, clipped to it (`InnerLight`)",
            "Halo (pads, buttons, toggles, segments, quick actions, XY) — white at `touchLight.haloOpacity` (7 %), 0.75 × the surface width up to 112 px; core white at `touchLight.coreOpacity` (12 %), half the halo; clipped to the surface",
          ],
          behaviour: [
            "In: 120 ms ease-out, scale 0.6 → 1, opacity 0 → 1. Follows the finger 1:1 (no lag). Out: 260 ms ease-in.",
            "Starts under the fingertip and stays inside the touched element: on a fader thumb, below its LED and grips; on the knob disc, below the cap; on the stick, below its knurl and dish; on the jog wheel, below the detents.",
            "Story args `pinned` / `pinX` / `pinY` / `pinIndex` pin it at a point (`PinTouchLight`) so it shows in static snapshots.",
          ],
          a11y: [
            "Purely visual; no role. Reduce Motion: opacity fade only, no scale.",
            "Never the only feedback: depth (Neu/Pressed) and glow still change.",
          ],
          figma: {
            component: "Touch Light",
            node: "134:795",
            variants: [
              ['Board "Touch light — press response"', "134:15404 — per-control placement"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof TouchLightStory>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A pad with the light pinned off-centre: the label stays readable on top of it. */
export const Pad: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByTestId("touch-light")).toBeInTheDocument();
    await expect(await canvas.findByText("Go")).toBeVisible();
  },
};
export const Fader: Story = { args: { kind: "fader" } };
export const FaderHorizontal: Story = { args: { kind: "faderHorizontal" } };
export const Knob: Story = { args: { kind: "knob", pinX: 0.65, pinY: 0.35 } };
export const Segmented: Story = { args: { kind: "segmented", pinIndex: 1, pinX: 0.5, pinY: 0.5 } };
export const XYPad: Story = { args: { kind: "xy", pinX: 0.3, pinY: 0.4 } };
export const Thumbstick: Story = { args: { kind: "thumbstick" } };
export const Button: Story = { args: { kind: "button", pinX: 0.3, pinY: 0.5 } };

/** Disabled / view-only: no light, even when pinned. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.queryAllByTestId("touch-light")).toHaveLength(0);
  },
};

/** Every control with the light pinned at the same point of its surface. */
export const AllControls: Story = {
  args: { pinX: 0.5, pinY: 0.45 },
  render: ({ pinned, pinX, pinY, pinIndex, disabled }) => (
    <PinTouchLight at={pinned ? { x: pinX, y: pinY, index: pinIndex } : null}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20, maxWidth: 860 }}>
        {KINDS.map((k) => (
          <View key={k} style={{ gap: 6, alignItems: "flex-start" }}>
            <Text className="text-muted-foreground font-mono text-xs">{k}</Text>
            <Sample kind={k} disabled={disabled} />
          </View>
        ))}
      </View>
    </PinTouchLight>
  ),
};
