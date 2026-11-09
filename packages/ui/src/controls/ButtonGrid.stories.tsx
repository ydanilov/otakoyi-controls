import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function GridStory({
  mode,
  disabled,
}: {
  mode: "momentary" | "toggle" | "radio";
  disabled: boolean;
}) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "buttonGrid",
        id: "cues",
        address: "/cue/{row}/{col}",
        label: "Cues",
        rows: 2,
        cols: 4,
        mode,
      }),
    [mode],
  );
  return (
    <ControlHarness
      control={control}
      value={{ cell: 5, on: true }}
      disabled={disabled}
      width={340}
      height={180}
    />
  );
}

const meta = {
  title: "Controls/Button Grid",
  component: GridStory,
  args: { mode: "radio", disabled: false },
  argTypes: { mode: { control: "inline-radio", options: ["momentary", "toggle", "radio"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "A grid of pads for cues, clips or layers. Schema type `buttonGrid`.",
          use: ["Clip launchers, cue banks, layer toggles."],
          avoid: ["Named scenes with crossfade — Scene List."],
          do: ["Use `labels` so cells say what they fire."],
          dont: ["Don't exceed 4 × 4 on phones."],
          anatomy: ["Label", "Rows × cols of pads (lit when on)"],
          behaviour: [
            `Sends the address template filled per cell (\`{row}\`, \`{col}\`, \`{index}\`) with 1 / 0 — ${OSC_SOURCE}.`,
            "`momentary`: lit while held; `toggle`: each cell latches; `radio`: one cell lit.",
          ],
          a11y: ["Each cell is a `button` labelled “Cues 6”, `selected` when lit."],
          content: ["Cell labels ≤ 6 characters."],
          figma: { component: "Button Grid", node: "12:83" },
        }),
      },
    },
  },
} satisfies Meta<typeof GridStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Radio: Story = {};
export const Toggle: Story = { args: { mode: "toggle" } };
export const Momentary: Story = { args: { mode: "momentary" } };
export const Disabled: Story = { args: { disabled: true } };
