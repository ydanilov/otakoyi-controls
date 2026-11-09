import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { StepperGroup, type StepperItem } from "./Installation";

const ITEMS: StepperItem[] = [
  { id: "temp", label: "Temperature", min: 15, max: 30, step: 0.5, unit: "°C", defaultValue: 22 },
  { id: "speed", label: "Speed", min: 0.1, max: 4, step: 0.1, unit: "×", defaultValue: 1 },
];

function Demo({ disabled }: { disabled?: boolean }) {
  const [values, setValues] = React.useState<Record<string, number>>({ temp: 24.5, speed: 1 });
  return (
    <View style={{ width: 358 }}>
      <StepperGroup
        items={ITEMS}
        values={values}
        onChange={(id, v) => setValues((s) => ({ ...s, [id]: v }))}
        disabled={disabled}
      />
    </View>
  );
}

const meta = {
  title: "Patterns/Stepper Group",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "Several precise values that belong together, with one Reset all.",
          use: ["Lobby pults: a few safe, stepped parameters."],
          avoid: ["Performance values — Fader Bank / Knob Group."],
          do: ["Give every item a `defaultValue`."],
          dont: ["Don't mix more than ~4 steppers in one group."],
          anatomy: [
            "Console Panel (caption)",
            "Steppers",
            "Reset all (Secondary, disabled when nothing changed)",
          ],
          behaviour: ["`onChange(id, value)` per stepper; Reset all sends every default."],
          a11y: ["See Stepper."],
          content: ["Caption ≤ 20 characters."],
          figma: { component: "Stepper Group (Patterns)", node: "85:2329" },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Reset all" }));
    await expect(await canvas.findByText("22.0")).toBeVisible();
  },
};
export const Disabled: Story = { args: { disabled: true } };
