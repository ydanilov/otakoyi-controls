import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { expect, userEvent } from "storybook/test";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function SegmentedStory({
  selected,
  disabled,
  icons = false,
}: {
  selected: number;
  disabled: boolean;
  icons?: boolean;
}) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "segmented",
        id: "mode",
        address: "/mode",
        label: icons ? "Scene" : "Mode",
        options: icons
          ? [
              { label: "Show", value: 0, icon: "lightning" },
              { label: "Day", value: 1, icon: "sun" },
              { label: "Night", value: 2, icon: "moon" },
              { label: "Mono", value: 3, icon: "circle-half" },
            ]
          : [
              { label: "Calm", value: 0 },
              { label: "Pulse", value: 1 },
              { label: "Storm", value: 2 },
            ],
      }),
    [icons],
  );
  return (
    <ControlHarness
      control={control}
      value={selected}
      disabled={disabled}
      width={icons ? 370 : 320}
      height={icons ? 78 : 88}
    />
  );
}

const meta = {
  title: "Controls/Segmented",
  component: SegmentedStory,
  args: { selected: 0, disabled: false },
  argTypes: { selected: { control: { type: "range", min: 0, max: 2, step: 1 } } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Single choice among 2–8 named options, all visible: modes, palettes, presets. Schema type `segmented`.",
          use: ["Mutually exclusive states that change often."],
          avoid: [
            "Many options or thumbnails — Scene List.",
            "Multi-select — Button Group (feat/new-controls).",
          ],
          do: ["Keep labels the same length class."],
          dont: ["Don't exceed 4 options on phones (labels get too small)."],
          anatomy: ["Label", "Inset bed", "Options; the selected one is lit"],
          behaviour: [
            `Sends \`address\` with the selected option's \`value\` — ${OSC_SOURCE}.`,
            "Feedback selects the matching option.",
          ],
          a11y: ["Role `radiogroup`; options are `radio` with `selected`."],
          content: ["Option labels ≤ 8 characters on phones; one line."],
          figma: {
            component: "Segmented",
            node: "12:82",
            variants: [
              ["Content=Text", "options with labels"],
              ["Content=Icon", "icon options (planned)"],
              ["State=Default | Disabled", "disabled"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof SegmentedStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("radio", { name: "Storm" }));
    await expect(await canvas.findByText("OSC → /mode 2")).toBeVisible();
  },
};
export const Disabled: Story = { args: { disabled: true } };

/** Figma Segmented Content=Icon (Scene Bar): icons instead of text; the label is the VoiceOver name. */
export const Icons: Story = {
  args: { icons: true },
  play: async ({ canvas }) => {
    const night = await canvas.findByRole("radio", { name: "Night" });
    await userEvent.click(night);
    await expect(canvas.getByLabelText("Last OSC message").textContent).toContain("/mode 2");
  },
};
