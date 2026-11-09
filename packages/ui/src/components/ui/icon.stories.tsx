import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Settings } from "lucide-react-native";
import { Icon } from "./icon";

const meta = {
  title: "Primitives (Reusables)/Icon (Lucide)",
  component: Icon,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Icon",
          purpose:
            "Lucide icon wrapper with NativeWind className, used inside the Reusables primitives.",
          prefer: "`Glyph` with Phosphor icons (Figma `Icon/<name>`)",
          a11y: ["Decorative; label the parent."],
        }),
      },
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { as: Settings, size: 24 } };
