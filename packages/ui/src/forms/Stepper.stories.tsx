import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { Stepper } from "./Stepper";

function Demo({ initial = 22, disabled }: { initial?: number; disabled?: boolean }) {
  const [v, setV] = React.useState(initial);
  return (
    <View style={{ width: 358 }}>
      <Stepper
        label="Temperature"
        unit="°C"
        min={15}
        max={30}
        step={0.5}
        defaultValue={22}
        value={v}
        onChange={setV}
        disabled={disabled}
      />
    </View>
  );
}

const meta = {
  title: "Forms/Stepper",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Precise value changed in fixed steps with − / +: temperature, speed multiplier, count.",
          use: [
            "Values with a natural step where a fader would be too coarse.",
            "Lobby pults: big targets, no dragging.",
          ],
          avoid: [
            "Continuous values performed live — use Fader or Knob.",
            "Typing an exact number — use Value Input.",
          ],
          do: ["Set `defaultValue` so a changed value lights up and offers Reset."],
          dont: ["Don't use steps finer than the installation reacts to."],
          anatomy: [
            "Caption + Reset link (when changed)",
            "Inset bed (Neu/Inset)",
            "− / + buttons (raised SM, pressed when held)",
            "Mono readout (Control/Readout LG) + unit; lit signal when changed",
          ],
          behaviour: [
            "Each press = `stepValue()`: one step, snapped to the step grid, clamped to min/max (unit-tested).",
            "− / + disable at min / max.",
            "Reset returns to `defaultValue`.",
          ],
          a11y: [
            "Readout is `adjustable`: VoiceOver swipe up/down = + / −; value read with unit.",
            "Buttons labelled “Increase/Decrease Temperature”, 56 × 44 pt.",
          ],
          content: ["Caption ≤ 16 characters; values up to 6 characters at LG size."],
          figma: {
            component: "Stepper",
            node: "85:344",
            variants: [
              ["State=Default", "value = defaultValue"],
              ["State=Changed", "value ≠ defaultValue"],
              ["State=Disabled", "disabled"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Increase Temperature" }));
    await expect(await canvas.findByText("22.5")).toBeVisible();
    await userEvent.click(await canvas.findByRole("button", { name: "Reset Temperature" }));
    await expect(await canvas.findByText("22.0")).toBeVisible();
  },
};
export const Changed: Story = { args: { initial: 24.5 } };
export const AtMaximum: Story = { args: { initial: 30 } };
export const Disabled: Story = { args: { disabled: true } };
