import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { ListCard } from "../containers/Cards";
import { GearSixIcon, SignOutIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { ListRow } from "./ListRow";

const meta = {
  title: "Forms/List Row",
  component: ListRow,
  args: { title: "Title", icon: GearSixIcon, trailing: "chevron", value: "Value", onPress: fn() },
  argTypes: {
    trailing: {
      control: "inline-radio",
      options: ["chevron", "value", "switch", "none", "destructive"],
    },
    icon: { control: false },
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
          purpose:
            "One row of a List Card: a setting, a destination, a read-only value or a sign-out.",
          use: ["Settings and installation lists inside a List Card."],
          avoid: ["The Settings menu — Nav Item.", "Pult controls."],
          do: ["Put Destructive rows last, in their own card."],
          dont: ["Don't mix trailing types arbitrarily in one card — group by kind."],
          anatomy: [
            "Leading icon (muted; critical for destructive)",
            "Title (Body/MD) + optional subtitle",
            "Trailing: value, chevron, LED switch or nothing",
          ],
          behaviour: [
            "Chevron rows navigate (`onPress`).",
            "Switch rows toggle on a tap anywhere on the row.",
            "Value / None rows are not pressable.",
          ],
          a11y: [
            "Pressable rows: role `button` (or `switch` with `checked`); label includes the value (“Output: Projector”).",
            "Row height ≥ 56 pt.",
          ],
          content: [
            "Title ≤ 28 characters, wraps to 2 lines; value ≤ 45 % of the row, truncates first.",
          ],
          figma: {
            component: "List Row",
            node: "32:123",
            variants: [
              ["Trailing=Chevron", 'trailing="chevron"'],
              ["Trailing=Value", 'trailing="value"'],
              ["Trailing=Switch", 'trailing="switch"'],
              ["Trailing=None", 'trailing="none"'],
              ["Trailing=Destructive", 'trailing="destructive"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chevron: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Title: Value" }));
    await expect(args.onPress).toHaveBeenCalled();
  },
};
export const Value: Story = { args: { trailing: "value" } };
function SwitchRow() {
  const [on, setOn] = React.useState(true);
  return (
    <ListRow
      title="Haptics"
      icon={GearSixIcon}
      trailing="switch"
      checked={on}
      onCheckedChange={setOn}
    />
  );
}
export const Switch: Story = {
  render: () => <SwitchRow />,
  play: async ({ canvas }) => {
    const row = await canvas.findByRole("switch", { name: "Haptics" });
    await userEvent.click(row);
    await expect(row).toHaveAttribute("aria-checked", "false");
  },
};
export const None: Story = { args: { trailing: "none", value: undefined } };
export const Destructive: Story = {
  args: {
    trailing: "destructive",
    title: "Forget this installation",
    icon: SignOutIcon,
    value: undefined,
  },
};
export const AllTrailing: Story = {
  render: () => (
    <>
      <ListRow
        title="Title"
        icon={GearSixIcon}
        trailing="chevron"
        value="Value"
        onPress={() => {}}
      />
      <ListRow title="Title" icon={GearSixIcon} trailing="value" value="Value" />
      <ListRow
        title="Title"
        icon={GearSixIcon}
        trailing="switch"
        checked
        onCheckedChange={() => {}}
      />
      <ListRow title="Title" icon={GearSixIcon} trailing="none" />
      <ListRow
        title="Forget this installation"
        icon={SignOutIcon}
        trailing="destructive"
        onPress={() => {}}
      />
    </>
  ),
};
