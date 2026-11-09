import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { expect } from "storybook/test";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function KnobStory({
  value,
  disabled,
  label,
  centered,
  unit,
  min,
  max,
  mode,
  size,
}: {
  mode: "absolute" | "relative" | "hue";
  size: "regular" | "compact";
  value: number;
  disabled: boolean;
  label: string;
  centered: boolean;
  unit: string;
  min: number;
  max: number;
}) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "knob",
        id: "gain",
        address: "/fx/gain",
        label,
        centered,
        unit,
        min,
        max,
        mode,
        size,
      }),
    [label, centered, unit, min, max, mode, size],
  );
  return (
    <ControlHarness control={control} value={value} disabled={disabled} width={180} height={180} />
  );
}

const meta = {
  title: "Controls/Knob",
  component: KnobStory,
  args: {
    mode: "absolute",
    label: "Gain",
    value: 0.4,
    disabled: false,
    centered: false,
    unit: "",
    min: 0,
    max: 1,
    size: "regular",
  },
  argTypes: {
    mode: { control: "inline-radio", options: ["absolute", "relative", "hue"] },
    size: { control: "inline-radio", options: ["regular", "compact"] },
    value: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "Rotary value for dense layouts: effect amounts, hue, gain. Schema type `knob`.",
          use: [
            "Many parameters in little space (Knob Group, Camera Control).",
            "Parameters people set and leave.",
          ],
          avoid: ["The main level of a layer — Fader is faster to read and ride."],
          do: ["Group knobs that belong together in a Console Panel."],
          dont: ["Don't make knobs smaller than 72 pt; the drag needs room."],
          anatomy: [
            "Header: label + value readout, centred above the dial, 6 pt apart",
            "Track arc (control track)",
            "Lit arc (control/signal) from start (or centre)",
            "Knob cap with indicator line",
          ],
          behaviour: [
            `Sends \`address\` with one float (int with \`int: true\`) per change — ${OSC_SOURCE}. Throttled like the Fader.`,
            "Relative only: dragging up/right increases by distance (220 px per full sweep); a touch never moves it.",
            "Fine mode with two fingers (×`fineFactor`); double-tap resets to `default`.",
            "`mode` (ADR-015): absolute (default) over `travel` degrees (240° in the Figma library); relative = endless encoder sending `{ delta }`; hue = colour wheel sending degrees 0–360 and wrapping.",
          ],
          a11y: [
            "Role `adjustable`, value with unit; VoiceOver swipe steps.",
            "Hit area = whole cell (≥ 72 pt).",
          ],
          content: ["Label ≤ 10 characters (the cell is narrow)."],
          figma: {
            component: "Knob",
            node: "11:112",
            variants: [
              ["Mode=Absolute", "default"],
              ["Mode=Relative", 'mode: "relative"'],
              ["Mode=Color", 'mode: "hue"'],
              ["Size=Regular | Compact", 'size: "regular" | "compact" (dial ≈ 0.7×, same labels)'],
              ["Orientation=Vertical | Horizontal", "label placement in the cell"],
              ["State=Fine", "two-finger drag (runtime)"],
              ["State=Disabled", "disabled"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof KnobStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // Knob header: label and value centred above the dial.
    await expect(await canvas.findByTestId("control-header-center")).toBeVisible();
  },
};
export const Centered: Story = {
  args: { label: "Pan", centered: true, value: 0.5, min: -1, max: 1 },
};
export const WithUnit: Story = {
  args: { label: "Hue shift", unit: "°", min: 0, max: 360, value: 45 },
};
export const Relative: Story = { args: { mode: "relative", label: "Scrub" } };
export const Hue: Story = {
  args: { mode: "hue", label: "Hue", value: 200, min: 0, max: 360, unit: "°" },
};
export const Compact: Story = { args: { size: "compact" } };
export const CompactRelative: Story = {
  args: { size: "compact", mode: "relative", label: "Scrub" },
};
export const Disabled: Story = { args: { disabled: true } };
