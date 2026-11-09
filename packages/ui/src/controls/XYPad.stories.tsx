import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function XYStory({
  x,
  y,
  disabled,
  springBack,
}: {
  x: number;
  y: number;
  disabled: boolean;
  springBack: boolean;
}) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "xy",
        id: "focus",
        address: "/wall/focus",
        label: "Focus point",
        springBack,
      }),
    [springBack],
  );
  return (
    <ControlHarness
      control={control}
      value={{ x, y }}
      disabled={disabled}
      width={300}
      height={246}
    />
  );
}

const meta = {
  title: "Controls/XY Pad",
  component: XYStory,
  args: { x: 0.5, y: 0.5, disabled: false, springBack: false },
  argTypes: {
    x: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    y: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Two linked parameters on one surface: camera pan/tilt, a light's position, filter cutoff × resonance. Schema type `xy`.",
          use: ["Two values that people change together."],
          avoid: ["Return-to-centre joysticks — the Thumbstick (feat/new-controls)."],
          do: ["Map axes so up = more."],
          dont: ["Don't put an XY pad in a cell smaller than 2 × 2 grid units."],
          anatomy: ["Label + x/y readout", "Inset pad with grid ticks", "Lit dot + crosshair"],
          behaviour: [
            `Sends \`address\` with two floats (x, y) mapped to \`x\`/\`y\` ranges — ${OSC_SOURCE}. Throttled to \`throttleHz\`.`,
            "Absolute: the dot jumps to the finger (an XY surface has no hidden thumb).",
            "`springBack` returns to the centre on release.",
          ],
          a11y: ["Role `adjustable`; value reads both axes."],
          content: ["Label ≤ 16 characters."],
          figma: {
            component: "XY Pad",
            node: "11:147",
            variants: [
              ["State=Default", "—"],
              ["State=Dragging", "finger down (runtime)"],
              ["State=Disabled", "disabled"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof XYStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Offset: Story = { args: { x: 0.75, y: 0.3 } };
export const SpringBack: Story = { args: { springBack: true } };
export const Disabled: Story = { args: { disabled: true } };
