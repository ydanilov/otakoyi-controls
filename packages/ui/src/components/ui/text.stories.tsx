import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Text } from "./text";

const meta = {
  title: "Primitives (Reusables)/Text",
  component: Text,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Text",
          purpose:
            "Typography primitive used by every component; variants h1–h4, p, lead, large, small, muted, code.",
          prefer:
            "`Text` with token classes (`text-sm`, `font-semibold`, `text-muted-foreground`) — it is the one primitive used everywhere",
          a11y: ["Heading variants set role heading + aria-level."],
          content: ["Font sizes come from tokens.json `font.size`."],
        }),
      },
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      {(
        ["h1", "h2", "h3", "h4", "lead", "large", "default", "small", "muted", "code"] as const
      ).map((v) => (
        <Text key={v} variant={v}>
          {v} — Otakoyi Control
        </Text>
      ))}
    </View>
  ),
};
