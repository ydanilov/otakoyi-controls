import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function MicStory({ disabled }: { disabled: boolean }) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "mic",
        id: "mic",
        address: "/audio",
        label: "Room mic",
        outputs: ["level", "bands", "beat"],
      }),
    [],
  );
  return (
    <ControlHarness control={control} value={null} disabled={disabled} width={358} height={300} />
  );
}

const meta = {
  title: "Controls/Mic",
  component: MicStory,
  args: { disabled: false },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Lets the installation react to sound near the phone: level, frequency bands, beat. Schema type `mic` (ADR-015).",
          use: ["Interactive moments where the audience's sound drives the visuals."],
          avoid: ["Streaming audio — audio never leaves the device."],
          do: ["Explain why the microphone is needed before the permission prompt."],
          dont: ["Don't leave it listening when nobody uses it."],
          anatomy: [
            "Label",
            "Start / stop button",
            "Level meter and band bars",
            "Permission-denied and view-only states",
          ],
          behaviour: [
            `Analysis runs on the device (\`analyzeBlock\` in @osc/controls); at \`rateHz\` it sends \`address\` sub-messages for each output (level, bands, beat) — ${OSC_SOURCE}.`,
            "Capture is the platform `AudioInput` service; the story uses a synthetic tone.",
          ],
          a11y: ["Start/stop is a button with state; levels are not announced continuously."],
          content: ["Label ≤ 16 characters."],
          figma: {
            component: "Mic",
            node: "80:681",
            variants: [
              ["State=Off", "not listening"],
              ["State=Listening", "running (runtime)"],
              ["State=Peak", "loud input (runtime)"],
              ["State=Permission denied", "permission refused (runtime)"],
              ["State=View only", "disabled"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof MicStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ViewOnly: Story = { args: { disabled: true } };
