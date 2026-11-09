import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { TopBar } from "./Navigation";

const meta = {
  title: "Chrome/Top Bar",
  component: TopBar,
  args: { title: "Settings", onBack: fn() },
  argTypes: { trailing: { control: false } },
  decorators: [
    (Story) => (
      <View style={{ width: 390 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Title row of a sub-page inside the Settings or Installation sheet, with a back button.",
          use: ["Second-level pages: Control preferences, Pairing QR, What's new, Help."],
          avoid: [
            "The pult screen — it uses the Pult Header.",
            "Sheet roots — the system sheet / Inspector has its own title and Close.",
          ],
          do: ["Use the page name as the title, not the action."],
          dont: ["Don't put more than one trailing action."],
          anatomy: [
            "Back Icon Button (32, hit slop to 44)",
            "Title (Heading/LG)",
            "Optional trailing slot",
          ],
          behaviour: ["`onBack` pops the sub-page; without it the back button is hidden."],
          a11y: ["Title has role `header`; back button label “Back”."],
          content: ["Title ≤ 24 characters; truncates with ellipsis."],
          figma: { component: "Top Bar", node: "46:109" },
        }),
      },
    },
  },
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Back" }));
    await expect(args.onBack).toHaveBeenCalled();
  },
};
export const WithoutBack: Story = { args: { onBack: undefined } };
