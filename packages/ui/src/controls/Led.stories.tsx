import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { Led } from "./discrete";

const meta = {
  title: "Controls/LED (control)",
  component: Led,
  args: { on: true },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "The on/off LED inside controls (switch-style Toggle, Button Group strip): lit in the control signal colour, dark in the inset bed.",
          use: ["Inside control bodies."],
          avoid: ["Chrome status — use the DS `StatusLed` (tones, glow)."],
          do: ["Pair with a label or button."],
          dont: ["Don't use status colours here; control LEDs follow the brand signal."],
          anatomy: ["8 pt dot"],
          behaviour: ["Static."],
          a11y: ["Decorative."],
          content: ["—"],
          figma: { component: "LED layers in Toggle (switch) and Button Group" },
        }),
      },
    },
  },
} satisfies Meta<typeof Led>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};
export const Off: Story = { args: { on: false } };
export const Both: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <Led on />
      <Led on={false} />
    </View>
  ),
};
