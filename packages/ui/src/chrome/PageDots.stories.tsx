import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { PageDots } from "./Status";

const meta = {
  title: "Chrome/Page Dots",
  component: PageDots,
  args: { count: 3, active: 0 },
  argTypes: {
    count: { control: { type: "range", min: 2, max: 8, step: 1 } },
    active: { control: { type: "range", min: 0, max: 7, step: 1 } },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Which pult screen is showing when a page is split into horizontally swiped screens (ADR-006).",
          use: ["Under the pult on phones, where Screen Tabs would not fit."],
          avoid: ["Navigation between unrelated pages — use the Tab Bar with names."],
          do: ["Show only when there are 2+ screens."],
          dont: ["Don't make dots tappable targets; swipe or tabs navigate."],
          anatomy: ["Dots (unlit, 6 pt)", "Active pill (16 × 6, lit signal with glow)"],
          behaviour: ["Follows the pager; no interaction."],
          a11y: ["One element: “Screen 2 of 3”."],
          content: ["2–8 screens; more than 8 means the page should be redesigned."],
          figma: {
            component: "Page Dots",
            node: "46:200",
            variants: [
              ["Count=2", "count={2}"],
              ["Count=3", "count={3}"],
              ["Count=4", "count={4}"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof PageDots>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Three: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByLabelText("Screen 1 of 3")).toBeVisible();
  },
};
export const Counts: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <PageDots count={2} active={0} />
      <PageDots count={3} active={1} />
      <PageDots count={4} active={3} />
    </View>
  ),
};
