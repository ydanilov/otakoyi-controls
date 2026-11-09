import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { ControlFrame } from "./ControlFrame";

const meta = {
  title: "Controls/Control Frame",
  component: ControlFrame,
  args: { label: "Master", value: "0.80", badge: undefined, disabled: false, children: null },
  render: (args) => (
    <View style={{ width: 200, height: 120 }}>
      <ControlFrame {...args}>
        <View className="bg-control-track flex-1 rounded-md" />
      </ControlFrame>
    </View>
  ),
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "The shared label + value header around every control body, so all controls read the same.",
          use: ["Inside control components."],
          avoid: ["Chrome — use Section / Console Panel captions."],
          do: ["Pass `badge` for transient modes (FINE)."],
          dont: ["Don't re-implement control headers."],
          anatomy: [
            "Label (Control/Label, uppercase)",
            "Badge (accent)",
            "Value (Control/Value, mono)",
            "Body slot",
          ],
          behaviour: [
            "`align: split` (default): label left, value right — horizontal faders and other controls.",
            "`align: center`: label and value centred above the body, 6 pt apart — vertical faders (and jog wheels) and knobs.",
            "`disabled` dims the whole control to 40 %.",
          ],
          a11y: ["The control body carries the role; the frame's text is visual."],
          content: ["Label truncates first, the value never."],
          figma: { component: "Header layers of every control set" },
        }),
      },
    },
  },
} satisfies Meta<typeof ControlFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Fine: Story = { args: { badge: "FINE" } };
export const Disabled: Story = { args: { disabled: true } };
/** Vertical faders and knobs: label and value centred above the control, 6 pt apart. */
export const Centered: Story = {
  args: { align: "center" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByTestId("control-header-center")).toBeVisible();
  },
};
