import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Input } from "./input";

const meta = {
  title: "Primitives (Reusables)/Input",
  component: Input,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Input",
          purpose: "shadcn text input.",
          prefer: "the DS `TextField` (Figma Input) or `ValueInput`",
          a11y: ["Pass `accessibilityLabel` — there is no built-in label."],
        }),
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const [v, setV] = React.useState("192.168.1.20");
  return (
    <Input value={v} onChangeText={setV} accessibilityLabel="Address" style={{ width: 280 }} />
  );
}
export const Default: Story = { render: () => <Demo /> };
