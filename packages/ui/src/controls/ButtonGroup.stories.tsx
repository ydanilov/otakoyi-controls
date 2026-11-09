import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function GroupStory({ disabled, lit }: { disabled: boolean; lit: string[] }) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "buttonGroup",
        id: "layers",
        label: "Layers",
        buttons: [
          { id: "bg", label: "BG", caption: "Layer 1", address: "/layer/1" },
          { id: "fx", label: "FX", caption: "Layer 2", address: "/layer/2" },
          { id: "txt", label: "TXT", caption: "Layer 3", address: "/layer/3" },
          { id: "cam", label: "CAM", caption: "Layer 4", address: "/layer/4" },
        ],
        default: lit,
      }),
    [lit],
  );
  return (
    <ControlHarness control={control} value={null} disabled={disabled} width={340} height={110} />
  );
}

const meta = {
  title: "Controls/Button Group",
  component: GroupStory,
  args: { disabled: false, lit: ["bg", "txt"] },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Multi-select latching buttons with an LED strip: layers, effects, outputs that can be on together. Schema type `buttonGroup` (Figma Group Button inside Button Group).",
          use: ["Several independent on/off states shown as one group."],
          avoid: ["One of many — Segmented.", "A single toggle — Toggle."],
          do: ["Use short labels plus a caption for the longer name."],
          dont: ["Don't exceed 8 buttons on phones."],
          anatomy: [
            "Label",
            "LED strip (one LED per button, lit when on)",
            "Group Buttons (raised; inset + lit when on)",
          ],
          behaviour: [
            `Each button toggles on its own and sends its own \`address\` with \`value\` (default 1) when on and 0 when off — ${OSC_SOURCE}.`,
            "`default` lists the buttons that start lit.",
          ],
          a11y: ["Each button is a `switch` with `checked`, labelled with label + caption."],
          content: ["Label ≤ 4 characters; caption ≤ 10."],
          figma: {
            component: "Button Group / Group Button",
            node: "31:70",
            variants: [
              ["Group Button State=Off | On", "button lit state"],
              ["Group Button State=Disabled", "disabled"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof GroupStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AllOff: Story = { args: { lit: [] } };
export const Disabled: Story = { args: { disabled: true } };
