import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { CaretLeftIcon, GearSixIcon, PowerIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { IconButton } from "./Button";

const meta = {
  title: "Chrome/Icon Button",
  component: IconButton,
  args: { icon: GearSixIcon, label: "Settings", onPress: fn() },
  argTypes: {
    icon: { control: false },
    tone: { control: "select", options: [undefined, "muted", "foreground", "critical", "signal"] },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Round icon-only button for chrome: open Settings / Installation, go back, close, mute.",
          use: ["The meaning is obvious from a standard icon (gear, back, close, power)."],
          avoid: [
            "Actions that need a word to be understood — use Button.",
            "Installation actions with a caption — use Quick Action.",
          ],
          do: ["Always pass `label` — it is the only name VoiceOver reads."],
          dont: [
            "Don't use `active` for a momentary press — active is a latched state (e.g. Installation while its inspector is open).",
          ],
          anatomy: [
            "Round body: raised at rest, inset when active or pressed",
            "Phosphor icon, 45 % of the size; lit (signal) when active",
          ],
          behaviour: [
            "`active` sinks the button and lights the icon; it never glows.",
            "Sizes below 44 pt get a hit slop up to 44 pt.",
          ],
          a11y: [
            "Role `button`, `label` required; `selected` state reflects `active`.",
            "Hit target ≥ 44 pt at any size.",
          ],
          content: [
            "No visible text. Labels are verbs or nouns: “Settings”, “Close Installation”.",
          ],
          figma: {
            component: "Icon Button",
            node: "34:91",
            variants: [
              ["State=Default", "—"],
              ["State=Active", "active"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Settings" }));
    await expect(args.onPress).toHaveBeenCalled();
  },
};
export const Active: Story = { args: { active: true } };
export const Pressed: Story = { args: { pressed: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Sizes: Story = {
  render: (args) => (
    <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
      <IconButton {...args} icon={CaretLeftIcon} label="Back" size={32} />
      <IconButton {...args} />
      <IconButton {...args} icon={PowerIcon} label="Mute master" tone="critical" size={56} />
    </View>
  ),
};
