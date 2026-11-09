import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { fn } from "storybook/test";
import { HandPalmIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { DEFAULT_QUICK_ACTIONS, QuickActionsRow } from "./Installation";

const meta = {
  title: "Patterns/Quick Actions Row",
  component: QuickActionsRow,
  args: { onAction: fn() },
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
          purpose: "The installation's quick actions in one Console Panel, evenly spread.",
          use: ["Top of the Installation surface (iPhone sheet, iPad inspector)."],
          avoid: ["More than 4 actions — they stop fitting a phone row."],
          do: ["Keep the order Flash · (Idle) · Restart · Blackout across installations."],
          dont: ["Don't add pult controls here."],
          anatomy: ["Console Panel “Quick actions”", "Quick Actions (2–4)"],
          behaviour: [
            "`onAction(id)` after the tap or completed hold. Restart and Blackout hold 1.5 s by default.",
          ],
          a11y: ["Each action is its own button with hold hint."],
          content: ["Action captions one word."],
          figma: { component: "Quick Actions Row (Patterns)", node: "85:2024" },
        }),
      },
    },
  },
} satisfies Meta<typeof QuickActionsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithIdle: Story = {
  args: {
    actions: [
      DEFAULT_QUICK_ACTIONS[0]!,
      { id: "idle", label: "Idle", icon: HandPalmIcon },
      DEFAULT_QUICK_ACTIONS[1]!,
      DEFAULT_QUICK_ACTIONS[2]!,
    ],
  },
};
