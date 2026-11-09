import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Switch } from "./switch";

const meta = {
  title: "Primitives (Reusables)/Switch",
  component: Switch,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Switch",
          purpose: "shadcn switch (`@rn-primitives/switch`).",
          prefer: "the DS `LedSwitch` (Figma Switch)",
          a11y: ["Role switch with checked."],
        }),
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj;

function Demo() {
  const [on, setOn] = React.useState(true);
  return <Switch checked={on} onCheckedChange={setOn} accessibilityLabel="Haptics" />;
}
export const Default: Story = { render: () => <Demo /> };
