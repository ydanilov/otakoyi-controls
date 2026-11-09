import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Progress } from "./progress";

const meta = {
  title: "Primitives (Reusables)/Progress",
  component: Progress,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Progress",
          purpose: "shadcn linear progress bar.",
          prefer: "`ProgressRing` or the upload bar in `ImageUpload`",
          a11y: ["Role progressbar with value."],
        }),
      },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 64 },
  render: (args) => (
    <View style={{ width: 280 }}>
      <Progress {...args} />
    </View>
  ),
};
