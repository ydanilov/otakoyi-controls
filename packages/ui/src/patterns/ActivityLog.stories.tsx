import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { ActivityLog, type ActivityItem, type ActivityRange } from "./Installation";

const ITEMS: ActivityItem[] = [
  { id: "1", kind: "control", text: "iPhone · FOH took control", time: "18:42" },
  { id: "2", kind: "restart", text: "Installation restarted by iPad · Main stage", time: "18:30" },
  { id: "3", kind: "error", text: "Connection lost for 12 s", time: "17:58" },
  { id: "4", kind: "studio", text: "Studio connected remotely", time: "16:05" },
];

function Demo() {
  const [range, setRange] = React.useState<ActivityRange>("today");
  return (
    <View style={{ width: 358 }}>
      <ActivityLog
        items={
          range === "today" ? ITEMS : [...ITEMS, ...ITEMS.map((i) => ({ ...i, id: i.id + "b" }))]
        }
        range={range}
        onRangeChange={setRange}
      />
    </View>
  );
}

const meta = {
  title: "Patterns/Activity Log",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "What happened on the installation: control hand-overs, restarts, errors, studio sessions.",
          use: ["Installation surface → Activity."],
          avoid: ["Debug logs — the studio has the bridge log."],
          do: ["Newest first; filter by range."],
          dont: ["Don't page inside the pult; the Installation sheet / inspector scrolls."],
          anatomy: [
            "Console Panel “Activity”",
            "Tab Bar Today / Week / All",
            "List Card of Activity Rows",
          ],
          behaviour: [
            "Controlled range (`range`, `onRangeChange`); the screen loads items from the bridge.",
          ],
          a11y: ["Tabs are a tablist; each row is one element."],
          content: ["See Activity Row."],
          figma: { component: "Activity Log (Patterns)", node: "85:2248" },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
