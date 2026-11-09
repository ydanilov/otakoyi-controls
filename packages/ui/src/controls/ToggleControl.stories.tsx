import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { expect, userEvent } from "storybook/test";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function ToggleStory({
  on,
  disabled,
  label,
  style = "button",
  size,
  image,
}: {
  on: boolean;
  disabled: boolean;
  label: string;
  style?: "button" | "switch" | "led";
  size?: "regular" | "compact" | undefined;
  /** Picture pad: an asset path (the story services serve the demo's `demo-pad.jpg`). */
  image?: string | undefined;
}) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "toggle",
        id: "strobe",
        address: "/fx/strobe",
        label,
        style,
        ...(size ? { size } : {}),
        ...(image ? { image } : {}),
      }),
    [label, style, size, image],
  );
  const box = image
    ? size === "compact"
      ? 120
      : 168
    : style === "switch"
      ? { w: 300, h: 56 }
      : style === "led"
        ? { w: 74, h: 56 }
        : size
          ? { w: 200, h: 120 }
          : { w: 150, h: 88 };
  const w = typeof box === "number" ? box : box.w;
  const h = typeof box === "number" ? box : box.h;
  return <ControlHarness control={control} value={on} disabled={disabled} width={w} height={h} />;
}

const meta = {
  title: "Controls/Toggle",
  component: ToggleStory,
  args: { on: false, disabled: false, label: "Strobe", style: "button" },
  argTypes: { style: { control: "inline-radio", options: ["button", "switch", "led"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "Latched on/off on the pult: a layer, an effect, a mode. Schema type `toggle`.",
          use: ["Binary state that stays until changed."],
          avoid: ["App settings — Switch (LedSwitch).", "Momentary triggers — Button (Pad)."],
          do: ["Label the thing, not the action (“Strobe”, not “Turn strobe on”)."],
          dont: ["Don't use two toggles for mutually exclusive options — Segmented."],
          anatomy: [
            "style button: raised pad; on = pressed-in key with a lit ring and soft glow (never a solid fill), label, ON (lit) / OFF caption",
            "picture pad (`image`): square image (168 / 120 pt), label bottom-left on a legibility gradient; off dims the image to ~45 %, on adds the lit ring + LED",
            "style switch: a raised row with the LED Switch (same messages)",
          ],
          behaviour: [
            `Sends \`on\` args when switched on and \`off\` args when switched off — ${OSC_SOURCE}.`,
            "Feedback updates the state.",
          ],
          a11y: ["Role `switch` with `checked`."],
          content: ["Label ≤ 12 characters."],
          figma: {
            component: "Toggle",
            node: "12:30",
            variants: [
              ["State=Off", "value false"],
              ["State=On", "value true"],
              ["State=Disabled", "disabled"],
              ["Size=Regular | Compact", 'size: "regular" (150×88) | "compact" (104×64)'],
              ["Content=Image", "image: <asset path or URL> (square 168 / 120 pt)"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ToggleStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("switch", { name: "Strobe" }));
    await expect(await canvas.findByText("OSC → /fx/strobe 1")).toBeVisible();
  },
};
export const On: Story = { args: { on: true } };
export const SwitchStyle: Story = { args: { style: "switch", on: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Compact: Story = { args: { size: "compact", on: true } };
export const PictureOff: Story = { args: { image: "demo-pad.jpg", label: "Logo" } };
export const PictureOn: Story = {
  args: { image: "demo-pad.jpg", label: "Logo", on: true },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("switch", { name: "Logo" }));
    await expect(await canvas.findByText("OSC → /fx/strobe 0")).toBeVisible();
  },
};
export const PictureCompact: Story = {
  args: { image: "demo-pad.jpg", label: "Logo", size: "compact", on: true },
};

/** Toggle `style: "led"` (Figma Group Button / Channel Strip ON): without a label it reads ON / OFF. */
export const LedStyle: Story = {
  args: { style: "led", label: "", on: true },
  play: async ({ canvas }) => {
    const sw = await canvas.findByRole("switch");
    await expect(canvas.getByText("ON")).toBeTruthy();
    await userEvent.click(sw);
    await expect(await canvas.findByText("OFF")).toBeTruthy();
  },
};
