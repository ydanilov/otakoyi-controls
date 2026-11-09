import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { Pressable, View } from "react-native";
import { Text } from "../components/ui/text";
import { GearSixIcon } from "../ds/icons";
import { ListRow } from "../forms/ListRow";
import { componentDocs } from "../stories/docs";
import { ListCard, Section } from "./Cards";

const meta = {
  title: "Containers/Section",
  component: Section,
  args: { title: "Installation", children: null },
  decorators: [
    (Story) => (
      <View style={{ width: 358 }}>
        <Story />
      </View>
    ),
  ],
  render: (args) => (
    <Section {...args}>
      <ListCard>
        <ListRow title="Title" icon={GearSixIcon} value="Value" onPress={() => {}} />
        <ListRow title="Title" icon={GearSixIcon} value="Value" onPress={() => {}} />
        <ListRow title="Title" icon={GearSixIcon} value="Value" onPress={() => {}} />
      </ListCard>
    </Section>
  ),
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "Slot container: an uppercase caption over a group, usually a List Card.",
          use: ["Grouping in the Settings and Installation sheets (Installation, Modes, Help)."],
          avoid: ["Inside a Console Panel — the panel has its own caption."],
          do: ["Use nouns for captions."],
          dont: ["Don't nest sections."],
          anatomy: [
            "Caption (Control/Label, uppercase, muted) + optional action",
            "Children (slot)",
          ],
          behaviour: ["Static."],
          a11y: ["Caption has role `header` for VoiceOver rotor navigation."],
          content: ["Caption ≤ 20 characters."],
          figma: { component: "Section", node: "47:128", variants: [["slot", "children"]] },
        }),
      },
    },
  },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAction: Story = {
  args: {
    action: (
      <Pressable accessibilityRole="button">
        <Text className="text-control-fill text-xs font-medium uppercase">Edit</Text>
      </Pressable>
    ),
  },
};
