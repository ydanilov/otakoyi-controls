import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Skeleton } from "./skeleton";

const meta = {
  title: "Primitives (Reusables)/Skeleton",
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Skeleton",
          purpose: "shadcn loading placeholder (pulse).",
          prefer:
            "the DS `Loader` (configs load before the pult shows, so the app avoids skeleton screens)",
          a11y: ["Hidden from VoiceOver; announce loading elsewhere."],
        }),
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Skeleton className="h-4 w-60" />
      <Skeleton className="h-4 w-40" />
    </View>
  ),
};
