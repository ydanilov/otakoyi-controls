import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta = {
  title: "Primitives (Reusables)/Select",
  component: Select,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Select",
          purpose: "shadcn select (`@rn-primitives/select`), used by `PultSelect`.",
          prefer: "the DS `Select` (native iOS menu via @expo/ui)",
          a11y: ["Trigger button + listbox options."],
        }),
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <View style={{ width: 240, minHeight: 200 }}>
      <Select defaultValue={{ value: "projector", label: "Projector" }}>
        <SelectTrigger accessibilityLabel="Output">
          <SelectValue placeholder="Output" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="projector" label="Projector">
            Projector
          </SelectItem>
          <SelectItem value="led" label="LED wall">
            LED wall
          </SelectItem>
        </SelectContent>
      </Select>
    </View>
  ),
};
