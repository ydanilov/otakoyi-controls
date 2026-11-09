import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { LockSimpleIcon, WarningIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { InfoCard } from "./Status";

const meta = {
  title: "Chrome/Info Card",
  component: InfoCard,
  args: { children: "No QR on screen? Ask on site to switch the installation to pairing mode." },
  argTypes: { icon: { control: false } },
  decorators: [
    (Story) => (
      <View style={{ maxWidth: 360 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "A raised tip that deserves a glance: what to do when something is missing.",
          use: ["Guidance on pairing, connecting and empty states."],
          avoid: [
            "Errors that block the user — use the field error or a Dialog.",
            "One-line help — use Note.",
          ],
          do: ["Lead with the situation, then the action (“No QR on screen? Ask on site…”)."],
          dont: ["Don't put buttons inside; the card is informational."],
          anatomy: ["Raised SM card (radius md)", "Icon (muted, 18)", "Text (Body/SM, muted)"],
          behaviour: ["Static."],
          a11y: ["Read as text; the icon is decorative."],
          content: ["≤ 120 characters, up to 3 lines."],
          figma: { component: "Info Card", node: "46:152" },
        }),
      },
    },
  },
} satisfies Meta<typeof InfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithIcon: Story = { args: { icon: LockSimpleIcon } };
export const Warning: Story = {
  args: {
    icon: WarningIcon,
    children: "This installation is offline. Changes will apply when it reconnects.",
  },
};
