import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Separator } from "./separator";

const meta = {
  title: "Primitives (Reusables)/Separator",
  component: Separator,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Separator",
          purpose: "shadcn separator.",
          prefer: "the DS `Divider`",
          a11y: ["Decorative by default."],
        }),
      },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <View style={{ width: 280 }}>
      <Separator />
    </View>
  ),
};
