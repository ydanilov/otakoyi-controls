import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function ThumbstickStory({ disabled, press }: { disabled: boolean; press: boolean }) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "thumbstick",
        id: "cam",
        address: "/camera/move",
        label: "Camera",
        ...(press ? { press: "/camera/reset" } : {}),
      }),
    [press],
  );
  return (
    <ControlHarness
      control={control}
      value={{ x: 0, y: 0 }}
      disabled={disabled}
      width={220}
      height={220}
    />
  );
}

const meta = {
  title: "Controls/Thumbstick",
  component: ThumbstickStory,
  args: { disabled: false, press: true },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Relative 2-D joystick for moving things (camera, a light, a particle field) at a speed. Schema type `thumbstick` (ADR-015).",
          use: ["Continuous movement where the stick's deflection is a speed, not a position."],
          avoid: ["Setting an absolute position — XY Pad."],
          do: ["Keep a dead zone (`deadzone`, default 0.1) so a resting thumb sends nothing."],
          dont: ["Don't map it to values that must hold when released — it springs back to 0, 0."],
          anatomy: ["Label + x/y readout", "Inset well", "Raised stick (lit ring while held)"],
          behaviour: [
            `While held it sends \`address\` with x, y in −1..1 (y up) at \`rateHz\` (30); on release it springs back and sends 0, 0 once — ${OSC_SOURCE}.`,
            "Radial dead zone; travel outside it is rescaled to the full range.",
            "Optional `press` address: a tap sends 1 then 0 (click).",
          ],
          a11y: ["Role `adjustable`; the deflection is read as x and y."],
          content: ["Label ≤ 12 characters."],
          figma: {
            component: "Thumbstick",
            node: "31:250",
            variants: [
              ["State=Idle", "—"],
              ["State=Dragging", "finger down (runtime)"],
              ["State=Pressed", "tap with `press` (runtime)"],
              ["State=Disabled", "disabled"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ThumbstickStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
export const WithoutClick: Story = { args: { press: false } };
export const Disabled: Story = { args: { disabled: true } };
