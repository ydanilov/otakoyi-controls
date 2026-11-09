import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { TabBar } from "./Navigation";

const TABS = [
  { id: "live1", label: "Live 1" },
  { id: "live2", label: "Live 2" },
  { id: "scenes", label: "Scenes" },
] as const;

function Demo({ initial = "live1" }: { initial?: string }) {
  const [v, setV] = React.useState(initial);
  return (
    <View style={{ width: 360 }}>
      <TabBar tabs={TABS} value={v} onChange={setV} />
    </View>
  );
}

const meta = {
  title: "Chrome/Tab Bar",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Switches between pult screens (tablet) or between ranges (Activity Log). An inset bed with Screen Tabs.",
          use: ["2–5 sibling views of equal weight."],
          avoid: [
            "More than 5 options — use Select.",
            "Phones with many screens — Page Dots + swipe.",
          ],
          do: ["Keep the tab order the same as the swipe order of the screens."],
          dont: ["Don't scroll the tab bar horizontally."],
          anatomy: ["Bed: inset (Neu/Inset), radius lg, 4 pt padding", "Screen Tabs, equal width"],
          behaviour: [
            "Controlled: `value` + `onChange`. The pult pager scrolls to the tab's screen.",
          ],
          a11y: ["Role `tablist`; each tab `tab` with `selected`."],
          content: ["Tab labels ≤ 12 characters."],
          figma: { component: "Tab Bar", node: "47:268" },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const scenes = await canvas.findByRole("tab", { name: "Scenes" });
    await userEvent.click(scenes);
    await expect(scenes).toHaveAttribute("aria-selected", "true");
  },
};
