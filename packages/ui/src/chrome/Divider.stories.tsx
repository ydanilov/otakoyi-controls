import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { Divider } from "./Status";

const meta = {
  title: "Chrome/Divider",
  component: Divider,
  decorators: [
    (Story) => (
      <View style={{ width: 320 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "Hairline between groups; with a label it separates alternatives (“or”).",
          use: [
            "Between the QR scanner and “Enter address and PIN” (Type=Label).",
            "Inside dense lists when a gap is not enough.",
          ],
          avoid: [
            "Between rows of a List Card — it draws its own separators.",
            "Around cards — depth already separates them.",
          ],
          do: ["Prefer spacing first; add a divider only when groups would merge."],
          dont: ["Don't use dividers as decoration."],
          anatomy: ["1 px line in `border`", "Optional centred label (Body/XS, muted)"],
          behaviour: ["Static."],
          a11y: ["Line is hidden from VoiceOver; the label is read."],
          content: ["Label: one short word."],
          figma: {
            component: "Divider",
            node: "46:186",
            variants: [
              ["Type=Line", "no label"],
              ["Type=Label", 'label="or"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {};
export const Label: Story = { args: { label: "or" } };
