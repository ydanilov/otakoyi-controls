import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { MasterBar } from "./MasterBar";

function Demo({ initialMuted = false, disabled }: { initialMuted?: boolean; disabled?: boolean }) {
  const [v, setV] = React.useState(0.8);
  const [muted, setMuted] = React.useState(initialMuted);
  return (
    <View style={{ width: 370 }}>
      <MasterBar
        value={v}
        onChange={setV}
        muted={muted}
        onMutedChange={setMuted}
        disabled={disabled}
      />
    </View>
  );
}

const meta = {
  title: "Media & actions/Master Bar",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "Master output level with mute, kept visible above live pults.",
          use: ["Live (VJ) pults where one master fader governs everything."],
          avoid: [
            "Lobby pults — clients should not have a global mute in reach.",
            "Individual channels — use Fader.",
          ],
          do: ["Map it to one master OSC address in the screen that hosts it."],
          dont: ["Don't place two master bars on one screen."],
          anatomy: [
            "Raised SM bar",
            "Power Icon Button (signal when live, critical when muted)",
            "Caption + mono value (OFF when muted)",
            "Inset track + lit fill + raised thumb",
          ],
          behaviour: [
            "Drag on the track sets the level absolutely (`trackPosition`, unit-tested).",
            "Muted: track dims, drag disabled, value shows OFF.",
            "The host screen decides what to send (this component sends nothing).",
          ],
          a11y: [
            "Track is `adjustable` with percent value; swipe up/down steps 5 %.",
            "Mute button: “Mute Master” / “Unmute Master”.",
          ],
          content: ["Caption ≤ 10 characters."],
          figma: {
            component: "Master Bar",
            node: "85:396",
            variants: [
              ["State=Default", "muted={false}"],
              ["State=Muted", "muted"],
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
    await userEvent.click(await canvas.findByRole("button", { name: "Mute Master" }));
    await expect(await canvas.findByText("OFF")).toBeVisible();
  },
};
export const Muted: Story = { args: { initialMuted: true } };
export const Disabled: Story = { args: { disabled: true } };
