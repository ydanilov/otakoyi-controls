import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Button } from "./button";
import { Text } from "./text";

const meta = {
  title: "Primitives (Reusables)/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Button",
          purpose:
            "shadcn button with variants default/destructive/outline/secondary/ghost/link and sizes.",
          prefer: "the DS `Button` (chrome/Button) with neumorphic depth",
          a11y: ["Role `button`; label from the child Text."],
        }),
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {(["default", "secondary", "outline", "ghost", "destructive", "link"] as const).map((v) => (
        <Button key={v} variant={v}>
          <Text>{v}</Text>
        </Button>
      ))}
    </View>
  ),
};
