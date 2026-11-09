import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Text } from "./text";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const meta = {
  title: "Primitives (Reusables)/Toggle Group",
  component: ToggleGroup,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "ToggleGroup",
          purpose: "shadcn toggle group (single or multiple).",
          prefer: "the Segmented control (single) or Button Group (multi, feat/new-controls)",
          a11y: ["Group with pressed items."],
        }),
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj;

function Demo() {
  const [v, setV] = React.useState<string | undefined>("calm");
  return (
    <ToggleGroup type="single" value={v} onValueChange={setV}>
      <ToggleGroupItem value="calm" isFirst>
        <Text>Calm</Text>
      </ToggleGroupItem>
      <ToggleGroupItem value="storm" isLast>
        <Text>Storm</Text>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
export const Default: Story = { render: () => <Demo /> };
