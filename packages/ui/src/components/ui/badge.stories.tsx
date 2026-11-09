import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Badge } from "./badge";
import { Text } from "./text";

const meta = {
  title: "Primitives (Reusables)/Badge",
  component: Badge,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Badge",
          purpose: "shadcn badge.",
          prefer: "the DS `Badge` (FINE / NEW) or `Chip`",
          a11y: ["Read as text."],
        }),
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {(["default", "secondary", "destructive", "outline"] as const).map((v) => (
        <Badge key={v} variant={v}>
          <Text>{v}</Text>
        </Badge>
      ))}
    </View>
  ),
};
