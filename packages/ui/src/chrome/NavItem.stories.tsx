import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { fn } from "storybook/test";
import { SlidersHorizontalIcon, LifebuoyIcon, MonitorIcon, QrCodeIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { NavItem } from "./Navigation";

const meta = {
  title: "Chrome/Nav Item",
  component: NavItem,
  args: { icon: MonitorIcon, label: "Installation", active: false, onPress: fn() },
  argTypes: { icon: { control: false } },
  decorators: [
    (Story) => (
      <View style={{ width: 280 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "A destination in the Settings menu (Control preferences, Pairing QR, What's new, Help).",
          use: ["The Settings sheet's menu."],
          avoid: ["Settings with a value or switch — use List Row."],
          do: ["Mark the page that is open with `active`."],
          dont: ["Don't use glow; active is inset + lit icon."],
          anatomy: ["Row 44 pt", "Icon (muted → lit signal when active)", "Label"],
          behaviour: ["Press navigates; active sits in an inset bed."],
          a11y: ["Role `button`, `selected` when active."],
          content: ["≤ 24 characters, one line."],
          figma: {
            component: "Nav Item",
            node: "46:209",
            variants: [
              ["State=Default", "—"],
              ["State=Active", "active"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof NavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { active: true } };
export const Menu: Story = {
  render: () => (
    <View style={{ gap: 4 }}>
      <NavItem icon={SlidersHorizontalIcon} label="Control preferences" active />
      <NavItem icon={QrCodeIcon} label="Pair a device" />
      <NavItem icon={LifebuoyIcon} label="Help" />
    </View>
  ),
};
