import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { OscLog, type OscLogLine } from "./OscLog";

const LINES: OscLogLine[] = [
  { key: 6, time: "10:21:05.004", dir: "in", address: "/wall/audio/level", value: "0.37" },
  { key: 5, time: "10:21:04.950", dir: "in", address: "/sys/fps", value: "59.9" },
  { key: 4, time: "10:21:04.402", dir: "out", address: "/wall/hue-drift", value: "0.412" },
  { key: 3, time: "10:21:04.231", dir: "in", address: "/wall/brightness", value: "0.600" },
  { key: 2, time: "10:21:04.218", dir: "out", address: "/wall/brightness", value: "0.600" },
  { key: 1, time: "10:21:03.877", dir: "out", address: "/scene", value: "1 2.0" },
];

const meta = {
  title: "Patterns/OSC Log",
  component: OscLog,
  args: { lines: LINES },
  render: (args) => (
    <View style={{ width: 358 }}>
      <OscLog {...args} />
    </View>
  ),
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "The Debug page's live OSC log: what left the pult (→) and what came back from the installation (←).",
          use: ["The OSC log section of the Debug page."],
          avoid: ["The bridge's activity feed — Activity Log."],
          do: ["Pass lines newest first; the card shows up to `max` (50)."],
          dont: ["Don't show it on the pult."],
          anatomy: [
            "Raised card, 14 / 16 pt padding, 6 pt between lines",
            "Line (mono 11): timestamp (muted), arrow, address, value",
            "Arrow: → sent in the signal colour, ← received in the studio colour",
          ],
          behaviour: [
            "Data from `DebugStore` (a 50-event ring buffer, `@osc/controls`), re-read four times a second while the Debug page is open.",
            "Empty: “No OSC yet”.",
          ],
          a11y: ["A list; each line reads “time sent|received address value”."],
          content: ["Address and value clip to one line."],
          figma: { component: "OSC Log", node: "128:486" },
        }),
      },
    },
  },
} satisfies Meta<typeof OscLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("/wall/audio/level")).toBeVisible();
    await expect(await canvas.findByText("10:21:03.877")).toBeVisible();
  },
};
export const Empty: Story = {
  args: { lines: [] },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No OSC yet")).toBeVisible();
  },
};
