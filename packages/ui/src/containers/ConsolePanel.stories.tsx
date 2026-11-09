import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { Knob } from "../controls/Knob";
import { makeControl } from "../stories/controls";
import { componentDocs } from "../stories/docs";
import { ConsolePanel } from "./Cards";

function KnobInPanel() {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "knob",
        id: "hue",
        address: "/mix/hue",
        label: "Hue shift",
        min: 0,
        max: 360,
        unit: "°",
      }),
    [],
  );
  const [v, setV] = React.useState<unknown>(45);
  return (
    <ConsolePanel title="Mix">
      <View style={{ height: 150 }}>
        <Knob control={control} value={v as number} onChange={setV} />
      </View>
    </ConsolePanel>
  );
}

const meta = {
  title: "Containers/Console Panel",
  component: ConsolePanel,
  args: { title: "Mix", children: null },
  decorators: [
    (Story) => (
      <View style={{ width: 200 }}>
        <Story />
      </View>
    ),
  ],
  render: () => <KnobInPanel />,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Slot container: the raised hardware panel that groups related controls or actions under a caption.",
          use: ["A knob with its caption, Quick Actions, a Stepper Group, the Activity Log."],
          avoid: [
            "Plain lists — List Card.",
            "Wrapping every single control on the pult (the grid already spaces them).",
          ],
          do: ["Keep one topic per panel."],
          dont: ["Don't put a panel inside a panel."],
          anatomy: [
            "Raised panel (Neu/Raised, radius lg, 16 pt padding)",
            "Caption + optional action",
            "Children (slot), 12 pt gap",
          ],
          behaviour: ["Static container."],
          a11y: ["Caption has role `header`."],
          content: ["Caption ≤ 20 characters."],
          figma: { component: "Console Panel", node: "47:158", variants: [["slot", "children"]] },
        }),
      },
    },
  },
} satisfies Meta<typeof ConsolePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithKnob: Story = {};
