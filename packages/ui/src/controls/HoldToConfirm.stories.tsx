import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function HoldStory({
  tone,
  holdMs,
  disabled,
  label,
}: {
  tone: "default" | "critical";
  holdMs: number;
  disabled: boolean;
  label: string;
}) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "holdToConfirm",
        id: "blackout",
        address: "/blackout",
        label,
        tone,
        holdMs,
      }),
    [tone, holdMs, label],
  );
  return (
    <ControlHarness control={control} value={null} disabled={disabled} width={150} height={88} />
  );
}

const meta = {
  title: "Controls/Hold to Confirm",
  component: HoldStory,
  args: { tone: "critical", holdMs: 1500, disabled: false, label: "Blackout" },
  argTypes: { tone: { control: "inline-radio", options: ["default", "critical"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "A pult command that must not fire by accident: blackout, shutdown, reset. Schema type `holdToConfirm`.",
          use: ["Destructive or show-stopping commands on the pult."],
          avoid: [
            "Installation-level actions on the Installation surface — Quick Action with hold.",
          ],
          do: ["Keep `holdMs` 1–2 s; longer feels broken."],
          dont: ["Don't use it for routine actions; it slows the operator."],
          anatomy: [
            "Pad (raised)",
            "Progress ring along the edge (critical or signal)",
            "Label → “Hold…” → “Sent”",
          ],
          behaviour: [
            `Sends \`address\` with \`args\` once the hold completes — ${OSC_SOURCE}. Releasing early cancels and sends nothing.`,
            "Ring animates linearly over `holdMs`.",
          ],
          a11y: ["Role `button`; hint “Press and hold for 1.5 seconds to confirm”."],
          content: ["Label: one or two words, uppercase on the pad."],
          figma: {
            component: "Hold to Confirm",
            node: "12:59",
            variants: [
              ["Tone=Critical | Default", 'tone: "critical" | "default"'],
              ["State=Idle", "—"],
              ["State=Holding", "finger down (runtime)"],
              ["State=Done", "after send (runtime, 1.2 s)"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof HoldStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Critical: Story = {};
export const Default: Story = { args: { tone: "default", label: "Go" } };
export const Disabled: Story = { args: { disabled: true } };
