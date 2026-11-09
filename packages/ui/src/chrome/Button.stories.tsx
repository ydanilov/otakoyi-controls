import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { LightningIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { Button } from "./Button";

const meta = {
  title: "Chrome/Button",
  component: Button,
  args: { label: "Take control", variant: "primary", size: "md", onPress: fn() },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost", "destructive"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    icon: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "App-chrome action: dialogs, banners, sheets, settings. Not a pult control — pult buttons are `ButtonControl` (Pad).",
          use: [
            "Primary: the one main action of a screen or dialog (Done, Take control, Send to screen).",
            "Secondary: the other actions next to it (Hide QR, Choose another).",
            "Ghost: low-emphasis actions (Cancel, Remove from screen).",
            "Destructive: removes or stops something and cannot be undone silently.",
          ],
          avoid: [
            "Sending OSC from the pult — use the Button / Pad control so it follows the lease and the config.",
            "Critical installation actions (Blackout, Restart) — use Quick Action with hold.",
          ],
          do: [
            "One Primary per view; put it last (right) in a button row.",
            "Use verbs: “Send to screen”, not “OK”.",
          ],
          dont: [
            "Don't add glow at rest — glow appears only while pressed.",
            "Don't stack two Destructive buttons.",
          ],
          anatomy: [
            "Body: raised (Neu/Raised SM) at rest, pressed (inset) under the finger, flat when disabled",
            "Optional leading icon (Phosphor, 16)",
            "Label (Label/SM, semibold)",
          ],
          behaviour: [
            "Glow (Glow/Primary, Glow/Critical) only while pressed, on Primary and Destructive.",
            "Disabled: flat, 38 % opacity, no touch.",
            "`pressed` forces the pressed look for reviews.",
          ],
          a11y: [
            "Role `button`, label = visible label.",
            "Height 40 (md), 48 (lg); sm (32) gets a 6 pt hit slop to reach 44.",
            "No motion besides the press state.",
          ],
          content: [
            "Label: 1–3 words, ≤ 20 characters; one line, truncated with an ellipsis on overflow.",
            "Sentence case.",
          ],
          figma: {
            component: "Button",
            node: "10:19",
            variants: [
              ["Variant=Primary", 'variant="primary"'],
              ["Variant=Secondary", 'variant="secondary"'],
              ["Variant=Ghost", 'variant="ghost"'],
              ["Variant=Destructive", 'variant="destructive"'],
              ["State=Default", "—"],
              ["State=Pressed", "pressed (runtime / forced)"],
              ["State=Disabled", "disabled"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Take control" }));
    await expect(args.onPress).toHaveBeenCalledTimes(1);
  },
};
export const PrimaryPressed: Story = { args: { pressed: true } };
export const Secondary: Story = { args: { variant: "secondary", label: "Hide QR" } };
export const Ghost: Story = { args: { variant: "ghost", label: "Cancel" } };
export const Destructive: Story = {
  args: { variant: "destructive", label: "Forget this installation" },
};
export const WithIcon: Story = { args: { icon: LightningIcon, label: "Flash" } };
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas, args }) => {
    const button = await canvas.findByRole("button", { name: "Take control" });
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onPress).not.toHaveBeenCalled();
  },
};

/** Every Figma variant × state, as in the library frame. */
export const Matrix: Story = {
  render: (args) => (
    <View style={{ gap: 16 }}>
      {(["primary", "secondary", "ghost", "destructive"] as const).map((v) => (
        <View key={v} style={{ flexDirection: "row", gap: 16 }}>
          <Button {...args} variant={v} />
          <Button {...args} variant={v} pressed />
          <Button {...args} variant={v} disabled />
        </View>
      ))}
      <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <Button {...args} size="sm" />
        <Button {...args} size="md" />
        <Button {...args} size="lg" />
      </View>
    </View>
  ),
};
