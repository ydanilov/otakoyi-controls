import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { Text } from "../components/ui/text";
import { componentDocs } from "../stories/docs";
import { EdgeSwipe } from "./EdgeSwipe";

function Demo() {
  const [last, setLast] = React.useState("—");
  return (
    <View style={{ width: 390, height: 400 }} className="bg-card rounded-lg">
      <View className="flex-1 items-center justify-center gap-2">
        <Text className="text-muted-foreground text-sm">Swipe in from the left or right edge</Text>
        <Text className="text-foreground font-mono text-sm">opened: {last}</Text>
      </View>
      <EdgeSwipe side="left" onOpen={() => setLast("Settings")} />
      <EdgeSwipe side="right" onOpen={() => setLast("Installation")} />
    </View>
  );
}

const meta = {
  title: "Containers/Edge Swipe",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Shortcut gestures on the pult screen edges (ADR-013): right edge → Installation (phone and tablet), left edge → Settings (phone only).",
          use: ["Once per pult screen, next to the Pult Header buttons."],
          avoid: ["As the only way in — the header buttons are the primary path."],
          do: ["Keep controls 20 pt away from the edges so swipes don't fight them."],
          dont: ["Don't enable the left edge on iPad — it belongs to the system there."],
          anatomy: ["Invisible 20 pt strip on the edge"],
          behaviour: [
            "Opens when dragged a quarter of the window or flicked (`edgeSwipeOpens`).",
            "`edgeSwipeEnabled(side, width)` turns the left edge off on tablets (unit-tested).",
          ],
          a11y: ["Hidden from VoiceOver; the header buttons are the accessible path."],
          content: ["—"],
          figma: { component: "(gesture — no component)" },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Phone: Story = {};
