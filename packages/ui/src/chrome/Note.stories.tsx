import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { Note } from "./Status";

const meta = {
  title: "Chrome/Note",
  component: Note,
  args: { children: "One device controls at a time, others view." },
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
          purpose: "One line of help under a section or field.",
          use: ["Explaining a rule the user might not expect, right where it applies."],
          avoid: [
            "Tips that need attention — use Info Card.",
            "Errors — use the field error line.",
          ],
          do: ["Write one short sentence."],
          dont: ["Don't stack several notes; merge them or use an Info Card."],
          anatomy: ["Info glyph (muted, 14)", "Text (Body/XS, muted)"],
          behaviour: ["Static."],
          a11y: ["Read as plain text; the icon is decorative."],
          content: ["≤ 80 characters; wraps to more lines if longer."],
          figma: { component: "Note", node: "46:148" },
        }),
      },
    },
  },
} satisfies Meta<typeof Note>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Wrapping: Story = {
  args: {
    children:
      "Pairing codes expire after two minutes. Ask someone on site to show a new QR if yours has expired.",
  },
};
