import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { LightningIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { PultCard } from "./Cards";

const meta = {
  title: "Containers/Pult Card",
  component: PultCard,
  args: {
    title: "VJ console",
    description: "4 screens · faders, knobs, thumbstick",
    icon: LightningIcon,
    primary: true,
    onOpen: fn(),
  },
  argTypes: { icon: { control: false } },
  decorators: [
    (Story) => (
      <View style={{ width: 220 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "One pult of the installation in the pult switcher (one installation can hold several pults).",
          use: ["The Installation surface (pult switcher)."],
          avoid: ["Switching screens inside a pult — Tab Bar."],
          do: ["Describe what the pult is for and what is on it."],
          dont: ["Don't mark more than one card Primary per form factor."],
          anatomy: [
            "Raised card",
            "Icon well (flat; icon lit when primary)",
            "Title (Heading/MD) + description",
            "Open button (Primary or Secondary)",
          ],
          behaviour: ["`onOpen` switches the pult; `current` disables the button (“Open now”)."],
          a11y: ["The button is the only focus stop; its label is “Open”."],
          content: ["Title ≤ 20 characters; description ≤ 50 characters, 2 lines."],
          figma: {
            component: "Pult Card",
            node: "47:246",
            variants: [
              ["Primary=true", "primary"],
              ["Primary=false", "primary={false}"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof PultCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Open" }));
    await expect(args.onOpen).toHaveBeenCalled();
  },
};
export const Secondary: Story = { args: { primary: false } };
export const Current: Story = { args: { current: true } };
