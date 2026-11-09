import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { ConnectionStatus } from "./Status";

const meta = {
  title: "Chrome/Connection",
  component: ConnectionStatus,
  args: { state: "online" },
  argTypes: { state: { control: "inline-radio", options: ["online", "connecting", "offline"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Connection to the installation's bridge, shown in the Pult Header on every pult screen.",
          use: [
            "Top-right of the Pult Header; on the Installation surface next to the installation name.",
          ],
          avoid: ["Per-control status — controls show view-only through their disabled state."],
          do: ["Keep it visible at all times while a pult is open."],
          dont: [
            "Don't recolour with the brand — status colours are never brandable (AGENTS.md rule 2).",
          ],
          anatomy: [
            "LED (lit + glow for online and connecting, unlit for offline)",
            "Word: Online / Connecting / Offline",
          ],
          behaviour: ["Driven by the bridge connection state; no interaction."],
          a11y: [
            "One element, label “Connection: Online”.",
            "Colour is never the only signal — the word is always shown.",
          ],
          content: ["Fixed words; do not localise into longer phrases than ~12 characters."],
          figma: {
            component: "Connection",
            node: "10:31",
            variants: [
              ["State=Online", 'state="online"'],
              ["State=Connecting", 'state="connecting"'],
              ["State=Offline", 'state="offline"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ConnectionStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Online: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByLabelText("Connection: Online")).toBeVisible();
  },
};
export const Connecting: Story = { args: { state: "connecting" } };
export const Offline: Story = { args: { state: "offline" } };
export const All: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 24 }}>
      <ConnectionStatus state="online" />
      <ConnectionStatus state="connecting" />
      <ConnectionStatus state="offline" />
    </View>
  ),
};
