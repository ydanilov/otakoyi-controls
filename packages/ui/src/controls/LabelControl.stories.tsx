import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function LabelStory({ value, size }: { value: string; size: "sm" | "md" | "lg" | "xl" }) {
  const control = React.useMemo(
    () => makeControl({ type: "label", id: "fps", label: "FPS", feedback: "/stats/fps", size }),
    [size],
  );
  return (
    <ControlHarness control={control} value={value} width={200} height={118} showOsc={false} />
  );
}

const meta = {
  title: "Controls/Label",
  component: LabelStory,
  args: { value: "59.9 fps", size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg", "xl"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "Text or a live value on the pult (FPS, a timer, a name). Schema type `label`.",
          use: ["Readouts from the installation via `feedback`.", "Static captions in the grid."],
          avoid: ["Numbers with thresholds — Meter."],
          do: ["Use `format` to add units."],
          dont: ["Don't use it for instructions — the pult is not a document."],
          anatomy: ["Caption", "Flat value box", "Mono value (size sm…xl)"],
          behaviour: [`Sends nothing (${OSC_SOURCE}); shows \`text\` until feedback arrives.`],
          a11y: ["Role `text`; value is read."],
          content: ["Value shrinks to 50 % then truncates."],
          figma: {
            component: "Label",
            node: "12:140",
            variants: [
              ["Size=MD", 'size: "md"'],
              ["Size=LG", 'size: "lg"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof LabelStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {};
export const Large: Story = { args: { size: "lg" } };
