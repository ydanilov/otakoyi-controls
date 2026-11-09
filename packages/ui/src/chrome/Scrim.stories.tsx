import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { Text } from "../components/ui/text";
import { componentDocs } from "../stories/docs";
import { Button } from "./Button";
import { Scrim } from "./Scrim";

const meta = {
  title: "Chrome/Scrim",
  component: Scrim,
  args: { onPress: fn() },
  decorators: [
    (Story) => (
      <View style={{ width: 360, height: 300, padding: 16, gap: 12 }}>
        <Text className="text-foreground text-lg font-semibold">Console behind the scrim</Text>
        <Button label="Take control" />
        <Text className="text-muted-foreground text-sm">The scrim dims this content.</Text>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Dims the console behind the iPad form sheet and the web/Android context menu. Dim only — no blur (ADR-013, HIG).",
          use: [
            "Behind custom overlays that the system does not present (context menu fallback, story stand-ins).",
          ],
          avoid: [
            "Behind the iPad Installation inspector — it never dims.",
            "Behind native sheets — the system dims.",
          ],
          do: ["Let a tap dismiss non-critical overlays."],
          dont: ["Don't add blur or tint; `color.overlay` per mode is the only dim."],
          anatomy: ["Overlay colour (`color.overlay`)", "Optional dismiss target"],
          behaviour: ["`onPress` dismisses; without it the scrim only blocks touches."],
          a11y: ["Dismiss target is a button labelled “Close” (or `dismissLabel`)."],
          content: ["No content."],
          figma: { component: "Scrim", node: "46:187" },
        }),
      },
    },
  },
} satisfies Meta<typeof Scrim>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dismissable: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Close" }));
    await expect(args.onPress).toHaveBeenCalled();
  },
};
export const Blocking: Story = { args: { onPress: undefined } };
