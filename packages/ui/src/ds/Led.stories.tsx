import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { StatusLed } from "./Led";

const meta = {
  title: "Foundations/LED",
  component: StatusLed,
  args: { tone: "signal", lit: true, size: 8 },
  argTypes: {
    tone: {
      control: "select",
      options: ["signal", "accent", "critical", "warning", "online", "offline", "studio"],
    },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "The status light used across the DS (Connection, Chip, Switch, Activity Row, Release Note).",
          use: ["A small, glanceable state next to text."],
          avoid: ["As the only signal — always pair with a word or icon."],
          do: ["Lit LEDs glow (they are lit values)."],
          dont: ["Don't use brand colours for status; status tones are never brandable."],
          anatomy: ["Dot; lit = tone colour + glow, unlit = recessed tick colour"],
          behaviour: ["Static."],
          a11y: ["Decorative; the parent provides the text."],
          content: ["—"],
          figma: {
            component: "LED layers inside Connection, Chip, Switch (no standalone component)",
          },
        }),
      },
    },
  },
} satisfies Meta<typeof StatusLed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lit: Story = {};
export const Unlit: Story = { args: { lit: false } };
export const Tones: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 20 }}>
      {(["signal", "accent", "online", "warning", "critical", "studio", "offline"] as const).map(
        (t) => (
          <StatusLed key={t} tone={t} size={10} />
        ),
      )}
    </View>
  ),
};
