import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { ValueInput } from "./Field";

function Demo(
  props: Omit<React.ComponentProps<typeof ValueInput>, "value" | "onChange"> & { initial?: number },
) {
  const [v, setV] = React.useState(props.initial ?? 250);
  return (
    <View style={{ width: 358 }}>
      <ValueInput {...props} value={v} onChange={setV} />
    </View>
  );
}

const meta = {
  title: "Forms/Value Input",
  component: Demo,
  args: { label: "Delay", unit: "ms", min: 0, max: 1000, step: 10 },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "A precise number typed in: delays, ports, timeouts. Label left, small recessed field with a unit right.",
          use: ["Settings where the exact number matters and dragging would be imprecise."],
          avoid: [
            "Live performance values — use a Fader/Knob or the Stepper.",
            "Free text — use Input.",
          ],
          do: [
            "Always give min/max so the value is clamped to something the installation accepts.",
          ],
          dont: ["Don't reject out-of-range numbers — they are clamped on commit."],
          anatomy: [
            "Label (Body/SM)",
            "Recessed field (Neu/Inset, radius sm, 96 pt)",
            "Mono value, right-aligned",
            "Unit (mono, muted)",
          ],
          behaviour: [
            "Numeric keyboard (`decimal-pad`); commit on blur or Done.",
            "Commit runs `parseValueInput()`: comma or dot decimals, clamp to min/max, snap to step (unit-tested in `ds/logic.test.ts`).",
            "Non-numeric text shows the error ring until edited; an empty field reverts to the last value.",
          ],
          a11y: [
            "Label = row label; hint states the allowed range (“Number from 0 to 1000 ms”).",
            "Row height ≥ 44 pt.",
          ],
          content: ["Label ≤ 20 characters; unit 1–3 characters. The field shows up to 6 digits."],
          figma: {
            component: "Value Input",
            node: "88:342",
            variants: [
              ["State=Default", "—"],
              ["State=Focus", "focused (runtime)"],
              ["State=Error", "invalid text (runtime) / invalid"],
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
    const input = await canvas.findByLabelText("Delay");
    await userEvent.clear(input);
    await userEvent.type(input, "5000");
    await userEvent.tab();
    await expect(input).toHaveValue("1000");
  },
};
export const Focus: Story = { args: { focused: true } };
export const Error: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Decimal: Story = {
  args: { label: "Crossfade", unit: "s", min: 0, max: 10, step: 0.1, initial: 1.5 },
};
