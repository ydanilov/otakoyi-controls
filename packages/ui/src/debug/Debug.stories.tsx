import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { DebugHud, DebugTag } from "./Debug";

const LOG = [
  { key: 1, time: "10:21:04.218", dir: "out" as const, text: "/wall/brightness 0.600" },
  { key: 2, time: "10:21:04.231", dir: "in" as const, text: "/wall/brightness 0.600" },
  { key: 3, time: "10:21:04.402", dir: "out" as const, text: "/wall/hue-drift 0.412" },
  { key: 4, time: "10:21:04.950", dir: "in" as const, text: "/sys/fps 59.9" },
  { key: 5, time: "10:21:05.004", dir: "in" as const, text: "/wall/audio/level 0.37" },
];
const METRICS = [
  { label: "bridge", value: "ws://192.168.1.40:8080" },
  { label: "rtt", value: "12 ms" },
  { label: "out", value: "48 msg/s" },
  { label: "in", value: "31 msg/s" },
  { label: "fps", value: "59.9" },
  { label: "lease", value: "iPhone · you" },
  { label: "target", value: "td 127.0.0.1:7000 udp" },
  { label: "feedback", value: "62 ms ago" },
];

function HudStory({ collapsed: initial = false }: { collapsed?: boolean }) {
  const [collapsed, setCollapsed] = React.useState(initial);
  return (
    <View style={{ width: 370, gap: 16 }}>
      <DebugTag address="/wall/brightness" value="0.600" rate="12/s" />
      <DebugTag address="/mix/layer/{1-4}/opacity" value="0.82 0.74 0.00 0.91" rate="24/s" />
      <DebugTag address="/wall/mode" />
      <DebugHud
        versions="proto v2 · rev 14 · schema 2"
        metrics={METRICS}
        log={LOG}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
    </View>
  );
}

const meta = {
  title: "Patterns/Debug Tag & HUD",
  component: HudStory,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Compact debug readouts kept in the library. Not used in the app at the moment: the Debug page (Installation › Debug, Settings › Developer › Debug) is built from Debug Row and OSC Log, and debug never overlays the pult.",
          use: ["Reserved; prefer Debug Row / OSC Log on the Debug page."],
          avoid: ["The pult — debug never overlays it.", "Client-facing UI."],
          do: ["Read the HUD log to see what left the pult (→) and what came back (←)."],
          dont: ["Don't pin tags over controls on the pult."],
          anatomy: [
            "Debug Tag: address / template (amber), last value sent, send rate — mono 10, 72 % black, amber hairline",
            "Debug HUD: head (DEBUG · proto · rev · schema), metrics (bridge, rtt, out, in, fps, lease, target, feedback), live OSC log",
          ],
          behaviour: [
            "Data from `DebugStore` (`@osc/controls`): per-control value and rate, 1 s rate windows, a 50-event ring buffer; unit-tested.",
            "RTT from the protocol ping, FPS from the bridge's telemetry (`/sys/fps`), polled every 2 s only while the Debug page is open.",
            "Tap the HUD head to collapse / expand.",
          ],
          a11y: [
            "Each tag reads as one element (address, value, rate); the HUD head is a button with expanded state.",
          ],
          content: ["Values are clipped to one line."],
          figma: { component: "Debug Tag · Debug HUD", node: "118:13440 · 118:13444" },
        }),
      },
    },
  },
} satisfies Meta<typeof HudStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("10:21:04.218 → /wall/brightness 0.600")).toBeVisible();
    await userEvent.click(await canvas.findByRole("button", { name: "Collapse debug HUD" }));
    await expect(canvas.queryByText("10:21:04.218 → /wall/brightness 0.600")).toBeNull();
  },
};
export const Collapsed: Story = { args: { collapsed: true } };
