import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { GearSixIcon } from "../ds/icons";
import { ListRow } from "../forms/ListRow";
import { componentDocs } from "../stories/docs";
import { ListCard } from "./Cards";

const meta = {
  title: "Containers/List Card",
  component: ListCard,
  decorators: [
    (Story) => (
      <View style={{ width: 358 }}>
        <Story />
      </View>
    ),
  ],
  render: () => (
    <ListCard>
      <ListRow title="Title" icon={GearSixIcon} value="Value" onPress={() => {}} />
      <ListRow title="Title" icon={GearSixIcon} value="Value" onPress={() => {}} />
      <ListRow title="Title" icon={GearSixIcon} value="Value" onPress={() => {}} />
    </ListCard>
  ),
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Slot container: a raised card that stacks List Rows (or Activity Rows) with hairline separators.",
          use: ["Any list of settings, installations or events."],
          avoid: [
            "A single row — a row alone can sit in a Section.",
            "Grids of controls — Console Panel.",
          ],
          do: ["Pass rows as children; the card draws the separators."],
          dont: ["Don't add your own dividers or margins between rows."],
          anatomy: [
            "Raised card (Neu/Raised, radius lg, clips)",
            "Children (slot)",
            "Hairline separators inset 16 pt",
          ],
          behaviour: ["Static container; falsy children are skipped."],
          a11y: ["Rows keep their own roles; the card adds none."],
          content: ["Up to ~8 rows; longer lists belong on their own page (sheets may scroll)."],
          figma: { component: "List Card", node: "47:101", variants: [["slot", "children"]] },
        }),
      },
    },
  },
} satisfies Meta<typeof ListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeRows: Story = {};
