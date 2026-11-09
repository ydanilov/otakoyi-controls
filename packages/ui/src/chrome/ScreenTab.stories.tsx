import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { fn } from "storybook/test";
import { Surface } from "../ds/depth";
import { componentDocs } from "../stories/docs";
import { ScreenTab } from "./Navigation";

const meta = {
  title: "Chrome/Screen Tab",
  component: ScreenTab,
  args: { label: "Live 1", active: true, onPress: fn() },
  decorators: [
    (Story) => (
      <Surface depth="inset" radius="lg" className="flex-row self-start p-1" style={{ width: 160 }}>
        <Story />
      </Surface>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "One tab of a Tab Bar: a pult screen name, or a range in the Activity Log.",
          use: ["Only inside a Tab Bar (the inset bed)."],
          avoid: ["Standalone buttons — use Button."],
          do: ["Name screens after what they control (“Lights”, “Scenes”)."],
          dont: ["Don't make the active tab glow; raised is enough."],
          anatomy: [
            "Active: raised SM, bg secondary, foreground text",
            "Inactive: no surface, muted text",
          ],
          behaviour: ["Press selects; the bar handles state."],
          a11y: ["Role `tab`, `selected` when active."],
          content: ["≤ 12 characters; truncates with ellipsis."],
          figma: {
            component: "Screen Tab",
            node: "10:39",
            variants: [
              ["State=Active", "active"],
              ["State=Inactive", "active={false}"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ScreenTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};
export const Inactive: Story = { args: { active: false } };
export const Both: Story = {
  render: (args) => (
    <View style={{ flexDirection: "row", flex: 1 }}>
      <ScreenTab {...args} active />
      <ScreenTab {...args} active={false} />
    </View>
  ),
};
