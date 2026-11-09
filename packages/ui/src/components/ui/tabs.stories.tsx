import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Text } from "./text";

const meta = {
  title: "Primitives (Reusables)/Tabs",
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Tabs",
          purpose: "shadcn tabs (`@rn-primitives/tabs`).",
          prefer: "the DS `TabBar` / `ScreenTab`",
          a11y: ["Tablist / tab roles with selected state."],
        }),
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj;

function Demo() {
  const [v, setV] = React.useState("a");
  return (
    <Tabs value={v} onValueChange={setV} style={{ width: 320 }}>
      <TabsList>
        <TabsTrigger value="a">
          <Text>Today</Text>
        </TabsTrigger>
        <TabsTrigger value="b">
          <Text>Week</Text>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="a">
        <Text>Today's events</Text>
      </TabsContent>
      <TabsContent value="b">
        <Text>This week's events</Text>
      </TabsContent>
    </Tabs>
  );
}
export const Default: Story = { render: () => <Demo /> };
