import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function PromptStory({ disabled, blend }: { disabled: boolean; blend: boolean }) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "prompt",
        id: "prompt",
        address: "/gen/prompt",
        label: "Prompt",
        blend,
        confirmMs: 0,
      }),
    [blend],
  );
  return (
    <ControlHarness control={control} value={null} disabled={disabled} width={358} height={420} />
  );
}

const meta = {
  title: "Controls/Prompt",
  component: PromptStory,
  args: { disabled: false, blend: true },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Text prompts for generative installations: the client writes presets and turns them on, or blends two. Schema type `prompt` (ADR-015/016).",
          use: ["Generative pieces driven by text."],
          avoid: ["Fixed looks — Scene List."],
          do: ["Keep preset labels short; the text can be long (`maxLength`)."],
          dont: ["Don't ask to confirm a delete — delete at once and offer Undo (ADR-013)."],
          anatomy: [
            "Prompt Presets (cards: Off / On / In blend / Applying / Error)",
            "Mix (A ↔ B) when `blend`",
            "Prompt editor (sheet)",
          ],
          behaviour: [
            `Without blend: \`address\` with the text. With blend: \`address/a\`, \`address/b\` (texts) and \`address/mix\` (0–1) — ${OSC_SOURCE}.`,
            "Presets live on the bridge (`useControlServices().prompts`), not in the config; the story uses in-memory presets.",
            "Long-press a card → system context menu with a preview; Delete last, red, immediate, with an Undo toast (see Menus/Context Menu and Chrome/Toast).",
          ],
          a11y: [
            "Cards are buttons with their state; the editor is a form with a character count.",
          ],
          content: ["Labels ≤ 24 characters; text ≤ `maxLength` (500)."],
          figma: {
            component: "Prompt Preset / Prompt Field (+ Prompt Presets, Prompt Mix patterns)",
            node: "83:322",
          },
        }),
      },
    },
  },
} satisfies Meta<typeof PromptStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blend: Story = {};
export const Single: Story = { args: { blend: false } };
export const Disabled: Story = { args: { disabled: true } };
