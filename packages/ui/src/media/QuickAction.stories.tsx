import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { FlashlightIcon, PowerIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { QuickAction } from "./QuickAction";

const meta = {
  title: "Media & actions/Quick Action",
  component: QuickAction,
  args: { icon: FlashlightIcon, label: "Flash", tone: "default", onAction: fn() },
  argTypes: {
    icon: { control: false },
    tone: { control: "inline-radio", options: ["default", "critical"] },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Installation-level action on the Installation surface: Flash, Idle, Restart, Blackout.",
          use: ["One-shot installation commands that are not part of the pult config."],
          avoid: ["Pult controls (they are config-driven).", "Navigation."],
          do: ["Give every critical action `holdMs` (hold-to-confirm), e.g. 1500 ms."],
          dont: ["Don't use critical tone for safe actions."],
          anatomy: [
            "Round raised button (64 pt)",
            "Icon (critical tone for critical actions)",
            "Hold ring (SVG, signal or critical) while held",
            "Caption",
          ],
          behaviour: [
            "Tap mode: `onAction` on press.",
            "Hold mode (`holdMs`): the ring fills (`holdFraction`), `onAction` fires only when full; releasing early cancels.",
            "Pressed: inset + glow in the tone (glow only while pressed).",
          ],
          a11y: [
            "Role `button`; hold mode hint “Press and hold for 1.5 seconds”. VoiceOver users trigger it with the activate action (double-tap) — confirmation comes from the explicit gesture.",
            "64 pt target.",
          ],
          content: ["Caption: one word, ≤ 10 characters."],
          figma: {
            component: "Quick Action",
            node: "85:371",
            variants: [
              ["State=Default", "—"],
              ["State=Pressed", "pressed"],
              ["State=Hold", "holdMs"],
              ["State=Hold — holding", "holdMs + progress (runtime)"],
              ["State=Disabled", "disabled"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof QuickAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Flash" }));
    await expect(args.onAction).toHaveBeenCalled();
  },
};
export const Pressed: Story = { args: { pressed: true } };
export const Hold: Story = {
  args: { icon: PowerIcon, label: "Blackout", tone: "critical", holdMs: 1500 },
};
export const Holding: Story = {
  args: {
    icon: PowerIcon,
    label: "Blackout",
    tone: "critical",
    holdMs: 1500,
    pressed: true,
    progress: 0.6,
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const States: Story = {
  render: (args) => (
    <View style={{ flexDirection: "row", gap: 24 }}>
      <QuickAction {...args} />
      <QuickAction {...args} pressed />
      <QuickAction {...args} icon={PowerIcon} label="Blackout" tone="critical" holdMs={1500} />
      <QuickAction
        {...args}
        icon={PowerIcon}
        label="Blackout"
        tone="critical"
        holdMs={1500}
        pressed
        progress={0.6}
      />
      <QuickAction {...args} disabled />
    </View>
  ),
};
