import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect } from "storybook/test";
import { ListCard, Section } from "../containers/Cards";
import { componentDocs } from "../stories/docs";
import { DebugRow } from "./DebugRow";

function DebugRowStory() {
  return (
    <View style={{ width: 370, gap: 24 }}>
      <Section title="Connection">
        <ListCard inset={16}>
          <DebugRow label="Bridge" value="192.168.1.40:8080" />
          <DebugRow label="Round trip" value="12 ms" />
          <DebugRow label="Target" value="td · 127.0.0.1:7000 UDP" />
        </ListCard>
      </Section>
      <Section title="Controls">
        <ListCard inset={16}>
          <DebugRow kind="control" label="Mode" address="/wall/mode" value="ambient" rate="—" />
          <DebugRow
            kind="control"
            label="Brightness"
            address="/wall/brightness"
            value="0.600"
            rate="12 msg/s"
          />
          <DebugRow
            kind="control"
            label="Layer opacity"
            address="/mix/layer/{1-4}/opacity"
            value="0.82 0.74 0.00 0.91"
            rate="24 msg/s"
          />
        </ListCard>
      </Section>
    </View>
  );
}

const meta = {
  title: "Patterns/Debug Row",
  component: DebugRowStory,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "One row of the Debug page (Installation › Debug, Settings › Developer › Debug): a metric (Connection, Traffic, Versions) or a control with its OSC address, last value and send rate.",
          use: ["Inside a List Card with `inset={16}`, under a Section, on the Debug page."],
          avoid: ["Settings or navigation rows — List Row.", "Anything on the pult."],
          do: ["Put numbers and addresses in the mono slots so they line up."],
          dont: ["Don't add icons or chevrons: the rows are read-only."],
          anatomy: [
            "Kind=Metric: label (body) left, value (mono) right — 48 pt",
            "Kind=Control: label with the OSC address (mono 11, muted) below; last value (mono) right with the rate (mono 11, muted) below — 57 pt",
          ],
          behaviour: [
            "Read-only. The Debug page re-reads `DebugStore` four times a second; rows just draw.",
          ],
          a11y: ["Each row is one element: label, address, value and rate in one sentence."],
          content: [
            "Label, address and value clip to one line; the value never takes more than half the row.",
          ],
          figma: {
            component: "Debug Row",
            node: "128:485",
            variants: [
              ["Kind=Metric", '`kind="metric"` (default): label, value'],
              ["Kind=Control", '`kind="control"`: label, address, value, rate'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof DebugRowStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("/wall/brightness")).toBeVisible();
    await expect(await canvas.findByText("12 ms")).toBeVisible();
  },
};
