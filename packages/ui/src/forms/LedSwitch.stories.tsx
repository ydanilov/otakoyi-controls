import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { expect, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { LedSwitch } from "./LedSwitch";

function Demo({
  initial = false,
  disabled,
  label = "Logo",
}: {
  initial?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  const [v, setV] = React.useState(initial);
  return <LedSwitch value={v} onValueChange={setV} label={label} disabled={disabled} />;
}

const meta = {
  title: "Forms/Switch",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            'The big on-stage switch (hardware look, grips, LED): pult switch rows (Toggle `style: "switch"`). Exported as `LedSwitch`. Menus and lists use the Menu Switch.',
          use: ["On-stage pult controls (Logo / Live data / Audio react)."],
          avoid: [
            "Sending OSC on the pult — use the Toggle control (it follows the lease and the config).",
          ],
          do: ["Name the thing that is switched, not the action (“Idle mode”, not “Enable idle”)."],
          dont: ["Don't use the red LED to mean danger — it only marks Off."],
          anatomy: [
            "Label (optional)",
            "Off LED (critical, lit when off)",
            "Inset bed",
            "Raised thumb with grip lines",
            "On LED (signal, lit when on)",
          ],
          behaviour: [
            "Tap toggles; the thumb slides in `motion.duration.fast`.",
            "Reduce Motion: the thumb jumps.",
          ],
          a11y: [
            "Role `switch` with `checked`; label required even when hidden.",
            "Whole row is the hit target (≥ 44 pt).",
          ],
          content: ["Label ≤ 20 characters, one line."],
          figma: {
            component: "Switch",
            node: "26:224",
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
    const sw = await canvas.findByRole("switch", { name: "Logo" });
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute("aria-checked", "true");
  },
};
export const On: Story = { args: { initial: true } };
export const Disabled: Story = { args: { disabled: true } };
