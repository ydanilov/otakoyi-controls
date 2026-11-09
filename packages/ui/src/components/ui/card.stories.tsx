import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Text } from "./text";

const meta = {
  title: "Primitives (Reusables)/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Card",
          purpose: "shadcn card with header, content and footer slots.",
          prefer: "`ConsolePanel`, `ListCard` or `Surface`",
          a11y: ['No role; add `accessibilityRole="header"` to a title that heads a section.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card style={{ width: 320 }}>
      <CardHeader>
        <CardTitle>Lobby wall</CardTitle>
        <CardDescription>Aurora Hall · online</CardDescription>
      </CardHeader>
      <CardContent>
        <Text>Card content</Text>
      </CardContent>
      <CardFooter>
        <Text className="text-muted-foreground text-sm">Footer</Text>
      </CardFooter>
    </Card>
  ),
};
