import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function ButtonStory({
  label,
  pressed,
  disabled,
  size,
}: {
  label: string;
  pressed: boolean;
  disabled: boolean;
  size?: "regular" | "compact" | undefined;
}) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "button",
        id: "flash",
        address: "/fx/flash",
        label,
        ...(size ? { size } : {}),
      }),
    [label, size],
  );
  // A sized pad keeps its Figma size inside a larger cell.
  return (
    <ControlHarness
      control={control}
      value={{ pressed }}
      disabled={disabled}
      width={size ? 200 : 150}
      height={size ? 120 : 88}
    />
  );
}

const meta = {
  title: "Controls/Button (Pad)",
  component: ButtonStory,
  args: { label: "Flash", pressed: false, disabled: false },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Momentary pult button: fires while held (strobe, flash, trigger). Schema type `button`; drawn as the Figma Pad.",
          use: ["Triggers and momentary effects on the pult."],
          avoid: ["App chrome actions — Button (chrome).", "Latched on/off — Toggle."],
          do: ["Use short verbs or effect names as labels."],
          dont: ["Don't rely on long presses — the press itself is the action."],
          anatomy: ["Pad (raised; lit fill while pressed)", "Label (centred, scales down to 70 %)"],
          behaviour: [
            `Sends \`press\` args on touch down and \`release\` args on touch up — ${OSC_SOURCE}.`,
            "Feedback can light the pad (`{ pressed: true }`).",
          ],
          a11y: ["Role `button`, label = control label."],
          content: ["Label ≤ 12 characters; shrinks to 70 % then truncates."],
          figma: {
            component: "Pad",
            node: "12:40",
            variants: [
              ["State=Idle", "—"],
              ["State=Pressed", "value { pressed: true }"],
              ["State=Disabled", "disabled"],
              ["Size=Regular", 'size: "regular" (150×88)'],
              ["Size=Compact", 'size: "compact" (104×64)'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ButtonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
export const Pressed: Story = { args: { pressed: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Regular: Story = { args: { size: "regular" } };
export const Compact: Story = { args: { size: "compact" } };
export const CompactPressed: Story = { args: { size: "compact", pressed: true } };
