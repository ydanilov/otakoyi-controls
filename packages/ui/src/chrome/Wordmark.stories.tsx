import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { Wordmark } from "./Brand";

const meta = {
  title: "Chrome/Wordmark",
  component: Wordmark,
  args: { size: "lg" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "lg"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "“otakoyi CONTROLS” set in the brand font, next to or under the Brand Mark.",
          use: ["Connect screen (LG); Settings footer and About (SM)."],
          avoid: ["Client pults."],
          do: ["Pair with the Brand Mark on first-run screens."],
          dont: ["Don't retype the wordmark as plain text elsewhere."],
          anatomy: ["“otakoyi” (semibold)", "“CONTROLS” (uppercase, tracked, muted)"],
          behaviour: ["Static."],
          a11y: ["One element, role `header`, label “Otakoyi Controls”."],
          content: ["Fixed text."],
          figma: {
            component: "Wordmark",
            node: "46:140",
            variants: [
              ["Size=SM", 'size="sm"'],
              ["Size=LG", 'size="lg"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Wordmark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Large: Story = {};
export const Small: Story = { args: { size: "sm" } };
export const Both: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 32, alignItems: "flex-end" }}>
      <Wordmark size="sm" />
      <Wordmark size="lg" />
    </View>
  ),
};
