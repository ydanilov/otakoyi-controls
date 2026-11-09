import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { expect } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { Loader } from "./Loader";

const meta = {
  title: "Chrome/Loader",
  component: Loader,
  args: { label: "Loading…", tone: "primary" },
  argTypes: { tone: { control: "inline-radio", options: ["primary", "warning"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Something is in progress without a known duration: loading a config, reconnecting.",
          use: ["Short waits (< 10 s) inline in a card or under a button."],
          avoid: [
            "Known progress — use a progress bar or ring.",
            "Over the pult — the pult stays usable while reconnecting.",
          ],
          do: ["Say what is happening (“Reconnecting…”)."],
          dont: ["Don't block the whole screen with a loader."],
          anatomy: ["Three LEDs chasing (signal or warning)", "Label (Body/XS, muted)"],
          behaviour: [
            "Warning tone while reconnecting.",
            "Reduce Motion: the dots stop (first one lit).",
          ],
          a11y: ["Role `progressbar`, label = text."],
          content: ["≤ 24 characters, ends with an ellipsis."],
          figma: {
            component: "Loader",
            node: "46:179",
            variants: [
              ["Tone=Primary", 'tone="primary"'],
              ["Tone=Warning", 'tone="warning"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("progressbar", { name: "Loading…" })).toBeVisible();
  },
};
export const Warning: Story = { args: { tone: "warning", label: "Reconnecting…" } };
