import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { expect } from "storybook/test";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

type Args = {
  label: string;
  mode: "absolute" | "relative" | "crossfade";
  orientation: "vertical" | "horizontal";
  response: "relative" | "absolute";
  centered: boolean;
  unit: string;
  int: boolean;
  value: number;
  disabled: boolean;
};

function FaderStory({ value, disabled, ...c }: Args) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "fader",
        id: "master",
        address: "/master",
        ...c,
        ...(c.mode === "crossfade" ? { labels: { a: "Day", b: "Night" } } : {}),
      }),
    [c.label, c.mode, c.orientation, c.response, c.centered, c.unit, c.int], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const vertical = c.orientation === "vertical";
  return (
    <ControlHarness
      control={control}
      value={value}
      disabled={disabled}
      width={vertical ? 96 : 320}
      height={vertical ? 300 : 96}
    />
  );
}

const meta = {
  title: "Controls/Fader",
  component: FaderStory,
  args: {
    label: "Master",
    mode: "absolute",
    orientation: "vertical",
    response: "relative",
    centered: false,
    unit: "",
    int: false,
    value: 0.6,
    disabled: false,
  },
  argTypes: {
    mode: { control: "inline-radio", options: ["absolute", "relative", "crossfade"] },
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
    response: { control: "inline-radio", options: ["relative", "absolute"] },
    value: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Continuous value on a straight track: levels, speeds, intensities. The workhorse of the live VJ pult (ADR-013). Schema type `fader`.",
          use: [
            "One continuous parameter with a known range.",
            "Banks of levels (Fader Bank pattern).",
          ],
          avoid: [
            "A few named states — Segmented.",
            "Two linked axes — XY Pad.",
            "Exact numbers typed in — Value Input / Stepper.",
          ],
          do: ["Keep relative response (the default) for anything the audience sees."],
          dont: [
            "Don't switch to absolute for critical parameters: a stray touch jumps the value.",
          ],
          anatomy: [
            "Header: label (Control/Label) + value readout (Control/Value) + FINE badge — centred above the track, 6 pt apart, on vertical faders and jog wheels; label left / value right on horizontal ones",
            "Track bed (control track, inset)",
            "Fill (control/signal)",
            "Thumb line",
          ],
          behaviour: [
            `Sends \`address\` with one float (int when \`int: true\`) per change — ${OSC_SOURCE}. Throttled to \`throttleHz\` (60); the last value is always sent on release; \`sendOn: "release"\` sends only on release.`,
            "`mode` (ADR-015): absolute (default) sends a value; relative is an endless jog wheel that sends the change since the last message (`{ delta }`, no position, no reset); crossfade is a bipolar A/B mix with a centre detent and end labels.",
            "Touch response (ADR-007), absolute and crossfade: relative (default) — a touch changes nothing; dragging moves the value by the distance dragged, 1:1 with the track. Absolute: the value jumps to the finger.",
            "Fine mode: drag with two fingers — ×`fineFactor` (0.2) slower; FINE badge and focus-coloured border.",
            "Double-tap returns to `default` (`doubleTapReset`, on by default).",
            "Feedback from the installation moves the fader unless a finger is on it. `centered` fills from the middle.",
          ],
          a11y: [
            "Role `adjustable`; label = control label; value = formatted value + unit; VoiceOver swipe up/down steps by `step` (or 1 % of the range).",
            "Hint: “Drag to adjust. Two fingers for fine control. Double-tap to reset.”",
            "Track ≥ 44 pt across; no decorative motion (drawing follows the finger).",
          ],
          content: ["Label ≤ 12 characters on phone (ellipsis beyond).", "Unit 1–3 characters."],
          figma: {
            component: "Fader",
            node: "11:79",
            variants: [
              ["Mode=Absolute", 'mode: "absolute" (touch: response relative | absolute)'],
              ["Orientation=Vertical | Horizontal", 'orientation: "vertical" | "horizontal"'],
              ["State=Default", "—"],
              ["State=Fine", "two-finger drag (runtime)"],
              ["State=Off", "value = min"],
              ["State=Disabled", "disabled (view only / offline)"],
              ["Mode=Relative (jog wheel)", 'mode: "relative" — sends { delta }'],
              ["Mode=Crossfade", 'mode: "crossfade" + labels { a, b } + detent'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof FaderStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("slider", { name: "Master" })).toBeVisible();
    // Vertical: label and value centred above the track.
    await expect(await canvas.findByTestId("control-header-center")).toBeVisible();
  },
};
export const Horizontal: Story = {
  args: { orientation: "horizontal", label: "Speed", unit: "×" },
  play: async ({ canvas }) => {
    // Horizontal keeps label left / value right.
    await canvas.findByText("Speed");
    await expect(canvas.queryByTestId("control-header-center")).toBeNull();
  },
};
export const Absolute: Story = { args: { response: "absolute" } };
export const Centered: Story = {
  args: { centered: true, label: "Pan", value: 0.5, orientation: "horizontal" },
};
export const RelativeJog: Story = {
  args: { mode: "relative", orientation: "horizontal", label: "Scrub" },
};
export const Crossfade: Story = {
  args: { mode: "crossfade", orientation: "horizontal", label: "Mix", value: 0.5 },
};
export const Off: Story = { args: { value: 0 } };
export const Disabled: Story = { args: { disabled: true } };
