import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Label } from "./label";

const meta = {
  title: "Primitives (Reusables)/Label",
  component: Label,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Label",
          purpose: "shadcn form label (`@rn-primitives/label`).",
          prefer: "the captions built into `TextField`, `ValueInput` and `Section`",
          a11y: ["Pair with `nativeID` / `aria-labelledby` on the field."],
        }),
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: "Address" } };
