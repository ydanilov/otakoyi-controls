import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { InstallationSwitcher } from "./Installation";

const meta = {
  title: "Patterns/Installation Switcher",
  component: InstallationSwitcher,
  args: {
    installations: [
      { id: "lobby", name: "Aurora Hall — Lobby", status: "current" },
      { id: "rooftop", name: "Aurora Hall — Rooftop", status: "offline" },
      { id: "demo", name: "Demo installation", status: "online" },
    ],
    onSelect: fn(),
    onAdd: fn(),
  },
  decorators: [
    (Story) => (
      <View style={{ width: 358 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Installations this device has paired with, plus “Add an installation” (QR pairing, ADR-012).",
          use: ["Settings sheet, when this device is paired with several installations."],
          avoid: ["Switching pults inside one installation — Pult Card."],
          do: ["Mark the open installation “current”."],
          dont: ["Don't hide offline installations; show the status."],
          anatomy: [
            "Console Panel “Installations”",
            "List Card of rows (monitor icon, name, status)",
            "Add row (scan icon, chevron)",
          ],
          behaviour: [
            "`onSelect(id)`; `onAdd` opens the scanner. Without `onAdd` the add row is hidden.",
          ],
          a11y: ["Rows read “Aurora Hall — Lobby: current”."],
          content: ["Names ≤ 28 characters, wrap to 2 lines."],
          figma: { component: "Installation Switcher (Patterns)", node: "85:2127" },
        }),
      },
    },
  },
} satisfies Meta<typeof InstallationSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Add an installation" }));
    await expect(args.onAdd).toHaveBeenCalled();
  },
};
