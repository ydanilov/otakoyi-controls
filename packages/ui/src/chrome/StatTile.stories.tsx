import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { StatTile } from "./Status";

const meta = {
  title: "Chrome/Stat Tile",
  component: StatTile,
  args: { label: "Devices", value: "3", size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["md", "lg"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "A labelled number inside a card: connected devices, FPS, uptime.",
          use: ["Read-only figures on the Installation surface or in Settings."],
          avoid: ["Live control values on the pult — use the Label control.", "Anything tappable."],
          do: ["Group 2–4 tiles in a row inside one card."],
          dont: ["Don't give tiles depth — they are flat information nested in a card."],
          anatomy: [
            "Flat tile (bg muted, radius md)",
            "Caption (Control/Label, uppercase)",
            "Value (mono; LG = Control/Readout LG)",
          ],
          behaviour: ["Static."],
          a11y: ["One element: “Devices: 3”."],
          content: ["Caption ≤ 10 characters; value ≤ 6 characters (LG) — longer values truncate."],
          figma: {
            component: "Stat Tile",
            node: "46:147",
            variants: [
              ["Size=MD", 'size="md"'],
              ["Size=LG", 'size="lg"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof StatTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {};
export const Large: Story = { args: { size: "lg" } };
export const Row: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <StatTile label="Devices" value="3" size="lg" />
      <StatTile label="FPS" value="59.9" size="lg" />
      <StatTile label="Uptime" value="4d" size="lg" />
    </View>
  ),
};
