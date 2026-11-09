import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Bold } from "lucide-react-native";
import { Icon } from "./icon";
import { Toggle } from "./toggle";

const meta = {
  title: "Primitives (Reusables)/Toggle",
  component: Toggle,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Toggle",
          purpose: "shadcn toggle button (pressed state).",
          prefer: "the Toggle control (pult) or `LedSwitch` (settings)",
          a11y: ["Role button with pressed state; pass a label."],
        }),
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj;

function Demo() {
  const [on, setOn] = React.useState(false);
  return (
    <Toggle pressed={on} onPressedChange={setOn} accessibilityLabel="Bold">
      <Icon as={Bold} />
    </Toggle>
  );
}
export const Default: Story = { render: () => <Demo /> };
