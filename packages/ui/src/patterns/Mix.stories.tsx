import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent, waitFor } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { Mix, PromptMix } from "./Mix";

const SCENES = [
  { value: "morning", label: "Morning" },
  { value: "day", label: "Day" },
  { value: "night", label: "Night" },
];
const PROMPTS = [
  { value: "jungle", label: "Neon jungle" },
  { value: "ocean", label: "Deep ocean" },
  { value: "desert", label: "Desert dusk" },
];

function Demo({
  kind = "mix",
  initialMix = 0.6,
}: {
  kind?: "mix" | "prompt";
  initialMix?: number;
}) {
  const prompt = kind === "prompt";
  const [a, setA] = React.useState(prompt ? "jungle" : "morning");
  const [b, setB] = React.useState(prompt ? "ocean" : "night");
  const [mix, setMix] = React.useState(initialMix);
  const Pattern = prompt ? PromptMix : Mix;
  return (
    <View style={{ width: 358 }}>
      <Pattern
        options={prompt ? PROMPTS : SCENES}
        a={a}
        b={b}
        mix={mix}
        onA={setA}
        onB={setB}
        onMix={setMix}
      />
    </View>
  );
}

const meta = {
  title: "Patterns/Mix",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Blend two scenes (Mix) or two prompts (Prompt Mix): pick A and B, crossfade between them.",
          use: ["A live look that morphs between two scenes or prompts."],
          avoid: ["Switching scenes outright — Scene Bar / Segmented."],
          do: ["Keep A on the left and B on the right — the fader's ends match."],
          dont: [
            "Don't add cut / auto buttons or A / B letters on the fader: the selects name the ends.",
          ],
          anatomy: [
            "Console Panel title (Mix)",
            "Scene A pop-up button (left) · Scene B pop-up button (right-aligned) — iOS pop-up buttons with the up/down caret",
            "Crossfade fader without header (LED dots at the ends, lit centre detent)",
            "Prompt Mix: A / B captions over the selects, the fader header “Mix · A 30 · B 70”, two weight tiles",
          ],
          behaviour: [
            "Choosing in a pop-up button sends that side's scene; the fader sends the mix 0–1.",
            "Double-tap the fader to return to 50 / 50.",
          ],
          a11y: ["Pop-up buttons are named “Scene A: Morning”; the fader is adjustable."],
          content: ["Scene names ≤ 14 characters."],
          figma: {
            component: "Mix (Patterns) · Prompt Mix (Patterns)",
            node: "84:1027",
            variants: [
              ["Mix", "Mix"],
              ["Prompt Mix (84:934)", "PromptMix"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Scene A: Morning" })).toBeTruthy();
    await expect(canvas.queryByText("CUT A")).toBeNull();
    await expect(canvas.queryByText("AUTO")).toBeNull();
    // Pick another scene for B from the pop-up menu.
    await userEvent.click(canvas.getByRole("button", { name: "Scene B: Night" }));
    const body = canvas.getByRole("button", { name: "Scene B: Night" }).ownerDocument.body;
    const day = await waitFor(() => {
      const items = [...body.querySelectorAll('[role="menuitem"]')];
      const item = items.find((i) => i.textContent === "Day");
      if (!item) throw new Error("menu not open");
      return item as HTMLElement;
    });
    await userEvent.click(day);
    await waitFor(() => expect(canvas.getByRole("button", { name: "Scene B: Day" })).toBeTruthy());
  },
};
export const Centre: Story = { args: { initialMix: 0.5 } };
export const PromptMixPattern: Story = {
  name: "Prompt Mix",
  args: { kind: "prompt", initialMix: 0.7 },
};
