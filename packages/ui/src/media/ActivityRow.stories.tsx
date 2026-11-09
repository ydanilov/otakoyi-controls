import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { ListCard } from "../containers/Cards";
import { componentDocs } from "../stories/docs";
import { ActivityRow } from "./ActivityRow";

const meta = {
  title: "Media & actions/Activity Row",
  component: ActivityRow,
  args: { kind: "control", text: "iPhone · FOH took control", time: "18:42" },
  argTypes: {
    kind: { control: "inline-radio", options: ["control", "restart", "error", "studio"] },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 358 }}>
        <ListCard>
          <Story />
        </ListCard>
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "One event in the installation's activity log (from the bridge log, ADR-005).",
          use: ["Inside the Activity Log pattern's List Card."],
          avoid: ["Live notifications — the header banners cover current state."],
          do: ["Name the device and what happened (“iPad · Main stage took control”)."],
          dont: ["Don't show raw OSC addresses."],
          anatomy: [
            "LED in the kind's status colour",
            "Kind icon (muted)",
            "Text (Body/SM, 2 lines)",
            "Time (mono)",
          ],
          behaviour: ["Static."],
          a11y: ["One element: “Control: iPhone · FOH took control, 18:42”."],
          content: ["Text ≤ 60 characters, wraps to 2 lines then truncates."],
          figma: {
            component: "Activity Row",
            node: "85:421",
            variants: [
              ["Kind=Control", 'kind="control"'],
              ["Kind=Restart", 'kind="restart"'],
              ["Kind=Error", 'kind="error"'],
              ["Kind=Studio", 'kind="studio"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ActivityRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Control: Story = {};
export const Restart: Story = {
  args: { kind: "restart", text: "Installation restarted by iPad · Main stage", time: "18:30" },
};
export const Error: Story = {
  args: { kind: "error", text: "Connection lost for 12 s", time: "17:58" },
};
export const Studio: Story = {
  args: { kind: "studio", text: "Studio connected remotely", time: "16:05" },
};
