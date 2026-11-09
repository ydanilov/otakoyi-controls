import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function MeterStory({
  value,
  orientation,
}: {
  value: number;
  orientation: "vertical" | "horizontal";
}) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "meter",
        id: "audio",
        feedback: "/audio/level",
        label: "Audio",
        warnAt: 0.7,
        criticalAt: 0.9,
        orientation,
      }),
    [orientation],
  );
  const vertical = orientation === "vertical";
  return (
    <ControlHarness
      control={control}
      value={value}
      width={vertical ? 100 : 300}
      height={vertical ? 226 : 90}
      showOsc={false}
    />
  );
}

const meta = {
  title: "Controls/Meter",
  component: MeterStory,
  args: { value: 0.5, orientation: "vertical" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Display-only level from the installation: audio level, crowd count, load. Schema type `meter`.",
          use: ["Live feedback the operator needs at a glance."],
          avoid: ["Anything the user sets — meters never send."],
          do: ["Set `warnAt` / `criticalAt` so the colour means something."],
          dont: ["Don't brand the warning/critical colours — they are status tokens."],
          anatomy: [
            "Label + value",
            "Recessed well (30 pt, radius 12)",
            "24 LED segments: signal ≤ 70 %, warning 70–90 %, critical > 90 % (or `warnAt` / `criticalAt`); unlit = zone colour at 13 %",
            "Top 3 lit segments glow",
            "Peak-hold line (white)",
            "dB scale 0 / −6 / −12 / −24 / −48, mono 9 pt (vertical: right; horizontal: below)",
          ],
          behaviour: [
            `Sends nothing (${OSC_SOURCE}); listens on \`feedback\`.`,
            "Peak hold: rises with the level, holds 1.5 s, then falls (`stepPeak`).",
          ],
          a11y: ["Value is read as text; status words come from the parent screen if needed."],
          content: ["Label ≤ 10 characters."],
          figma: {
            component: "Meter",
            node: "11:172",
            variants: [
              ["Level=Normal", "value < warnAt"],
              ["Level=Warning", "warnAt ≤ value < criticalAt"],
              ["Level=Critical", "value ≥ criticalAt"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof MeterStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: { value: 0.45 } };
export const Warning: Story = { args: { value: 0.82 } };
export const Critical: Story = { args: { value: 0.97 } };
export const Silent: Story = { args: { value: 0 } };
export const Horizontal: Story = { args: { orientation: "horizontal", value: 0.6 } };
