import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { UnsupportedPlaceholder } from "./discrete";

const meta = {
  title: "Controls/Unsupported",
  component: UnsupportedPlaceholder,
  args: {
    control: {
      id: "x",
      type: "unsupported",
      originalType: "laserHarp",
    },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 260, height: 96 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Shown in a grid cell for a control type this app version does not know (ADR-001). The rest of the pult keeps working.",
          use: ["Automatically, by the renderer."],
          avoid: ["Placing it by hand."],
          do: ["Ship new control types in an app release before configs use them."],
          dont: ["Don't hide the cell — the layout must stay as designed."],
          anatomy: ["Dashed outline", "“Update the app” + the missing type"],
          behaviour: ["Sends nothing."],
          a11y: ["Read as text."],
          content: ["Fixed copy."],
          figma: { component: "Unsupported Control", node: "12:151" },
        }),
      },
    },
  },
} satisfies Meta<typeof UnsupportedPlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
