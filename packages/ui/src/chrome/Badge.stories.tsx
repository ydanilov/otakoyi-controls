import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { Badge } from "./Status";

const meta = {
  title: "Chrome/Badge",
  component: Badge,
  args: { label: "Fine", tone: "accent" },
  argTypes: {
    tone: { control: "inline-radio", options: ["accent", "primary", "critical", "muted"] },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Tiny mono tag next to a value or a title: FINE while fine-adjusting, NEW on the latest release.",
          use: ["A short state marker that sits inline with text."],
          avoid: ["Status with an LED (online, countdown) — use Chip.", "Counts or long text."],
          do: ["Use the accent tone for transient modes (FINE)."],
          dont: ["Don't use status colours for brand meaning — critical only for real errors."],
          anatomy: ["Flat capsule (radius sm) in the tone colour", "Mono label, uppercase, 11 pt"],
          behaviour: ["Static. Controls show FINE automatically through ControlFrame `badge`."],
          a11y: ["Read as part of the surrounding text; keep it meaningful when read aloud."],
          content: ["1 word, ≤ 6 characters; never wraps (single line)."],
          figma: {
            component: "Badge",
            node: "10:20",
            variants: [["(no variants)", "tone selects the colour"]],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fine: Story = {};
export const New: Story = { args: { label: "New" } };
export const Tones: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <Badge label="Fine" tone="accent" />
      <Badge label="Live" tone="primary" />
      <Badge label="Error" tone="critical" />
      <Badge label="Beta" tone="muted" />
    </View>
  ),
};
