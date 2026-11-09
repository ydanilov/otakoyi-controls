import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent, waitFor } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { MenuSwitch } from "./MenuSwitch";

function Demo({ initial = false, disabled }: { initial?: boolean; disabled?: boolean }) {
  const [v, setV] = React.useState(initial);
  return (
    <View style={{ padding: 16 }}>
      <MenuSwitch value={v} onValueChange={setV} label="Idle mode" disabled={disabled} />
    </View>
  );
}

const meta = {
  title: "Forms/Menu Switch",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            'On/off in menus and lists — Settings, Installation › Modes — at the iOS switch size (64×28), in the Otakoyi style. `MenuSwitch`; List Row `trailing="switch"` draws it.',
          use: [
            "Settings preferences (Haptics, Keep screen awake).",
            "Installation modes (Idle, Pause).",
          ],
          avoid: [
            'On-stage pult controls — the big pult Switch with grips (`LedSwitch`, Toggle `style: "switch"`).',
          ],
          do: ["Put it in a List Row so the whole row is the hit target."],
          dont: ["Don't tint the track when on — only the LED lights."],
          anatomy: [
            "Recessed track 64×28 (`control/track`, inner shadow), the same in both states",
            "Raised dark thumb 38×24 (pult Switch material)",
            "LED 3×12 in the thumb's middle: signal + glow when on, dim tick when off",
          ],
          behaviour: ["Tap toggles; the thumb slides with a spring. Reduce Motion: it jumps."],
          a11y: ["Role `switch` with `checked`; inside a List Row the row carries the role."],
          content: ["—"],
          figma: {
            component: "Menu Switch",
            node: "156:14369",
            variants: [
              ["State=Off", "value={false}"],
              ["State=On", "value"],
              ["State=Disabled", "disabled"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  play: async ({ canvas }) => {
    const sw = await canvas.findByRole("switch", { name: "Idle mode" });
    await expect(canvas.getByTestId("menu-switch-led-off")).toBeTruthy();
    await userEvent.click(sw);
    await waitFor(() => expect(canvas.getByTestId("menu-switch-led-on")).toBeTruthy());
    await userEvent.click(sw);
    await waitFor(() => expect(canvas.getByTestId("menu-switch-led-off")).toBeTruthy());
  },
};
export const On: Story = { args: { initial: true } };
export const Disabled: Story = { args: { disabled: true } };
