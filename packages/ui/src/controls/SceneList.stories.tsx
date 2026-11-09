import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function SceneStory({ live, disabled }: { live: string | null; disabled: boolean }) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "sceneList",
        id: "scenes",
        address: "/scene",
        label: "Scenes",
        crossfade: 2,
        scenes: [
          { id: "dawn", label: "Dawn", value: 1 },
          { id: "noon", label: "Noon", value: 2 },
          { id: "dusk", label: "Dusk", value: 3 },
        ],
      }),
    [],
  );
  return (
    <ControlHarness control={control} value={live} disabled={disabled} width={280} height={240} />
  );
}

const meta = {
  title: "Controls/Scene List",
  component: SceneStory,
  args: { live: "noon", disabled: false },
  argTypes: { live: { control: "inline-radio", options: [null, "dawn", "noon", "dusk"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Named scenes the installation can switch to, with the live one marked. Schema type `sceneList`.",
          use: ["Lobby pults: the main way to change the look."],
          avoid: ["2–4 short modes — Segmented."],
          do: ["Name scenes as the client knows them."],
          dont: [
            "Don't list more than fits; the list may scroll inside its cell, the pult never does.",
          ],
          anatomy: ["Label", "Rows (pads), the live one lit with LIVE"],
          behaviour: [
            `Sends \`address\` with the scene \`value\` (+ \`crossfade\` seconds when set) — ${OSC_SOURCE}.`,
          ],
          a11y: ["Rows are `radio` with `selected`."],
          content: ["Scene names ≤ 20 characters."],
          figma: { component: "Scene List", node: "12:114" },
        }),
      },
    },
  },
} satisfies Meta<typeof SceneStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {};
export const NoneLive: Story = { args: { live: null } };
export const Disabled: Story = { args: { disabled: true } };
