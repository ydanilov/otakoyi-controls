import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function ColorStory({
  value,
  disabled,
  format,
  pickerStyle,
  palette,
}: {
  value: string;
  disabled: boolean;
  format: "hsb" | "rgbFloat" | "rgbInt" | "hsvFloat" | "hex";
  pickerStyle: "knobs" | "square" | "wheel";
  palette: boolean;
}) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "colorPicker",
        id: `tint-${pickerStyle}`,
        address: "/tint",
        label: "Colour",
        format,
        pickerStyle,
        ...(palette ? { swatches: ["#FFFFFF", "#FF3B30", "#FFCC00", "#34C759", "#3A4CA6"] } : {}),
      }),
    [format, pickerStyle, palette],
  );
  return (
    <ControlHarness
      control={control}
      value={value}
      disabled={disabled}
      width={358}
      height={palette ? 120 : pickerStyle === "square" ? 385 : 448}
    />
  );
}

const meta = {
  title: "Controls/Color Picker",
  component: ColorStory,
  args: {
    value: "#3A4CA6",
    disabled: false,
    format: "hsb",
    pickerStyle: "knobs",
    palette: false,
  },
  argTypes: {
    format: {
      control: "inline-radio",
      options: ["hsb", "hsvFloat", "rgbFloat", "rgbInt", "hex"],
    },
    pickerStyle: { control: "inline-radio", options: ["knobs", "square", "wheel"] },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Pick any colour: hue, saturation and brightness in one of three switchable pickers (Knobs, Square, Wheel). Schema type `colorPicker`; replaces the old swatch-only Color Control.",
          use: ["Tinting lights or visuals; a brand colour wash; a background hue."],
          avoid: ["A fixed set of looks — Segmented or Scene List.", "Hue only — Knob Mode=Hue."],
          do: [
            "Set `pickerStyle` to the style that suits the venue (Knobs for live, Square / Wheel for quick picks).",
            "Pass `swatches` to restrict the choice to the client's palette.",
          ],
          dont: [
            "Don't add a second picker for the same colour — the styles are views of one value.",
          ],
          anatomy: [
            "Header: title, live swatch (18 pt, radius 6) and hex (mono)",
            "Capsule segmented control: Knobs | Square | Wheel",
            "Knobs: hue ring knob (segments and centre swatch tinted with the current S and B) + compact Saturation and Brightness knobs with gradient arcs (track = full gradient at ~22 %, white indicator)",
            "Square: S × B field (hue base, white → transparent left to right, transparent → black top to bottom), round cursor (3 pt white ring, current colour), hue strip with thumb, H / S / B readout",
            "Wheel: hue × saturation wheel (angular hue, white centre, darkened by 1 − B), cursor, brightness slider black → hsb(h, S, 1), readout",
          ],
          behaviour: [
            `Default \`format: "hsb"\`: three addresses, \`<address>/h\` (degrees 0–360, or 0–1 with \`hueRange: "unit"\`), \`<address>/s\` and \`<address>/b\` (0–1), each sent only when that channel changes; feedback is accepted per channel. Opt-in single messages: \`hsvFloat\` (h s v floats), \`rgbFloat\`, \`rgbInt\` or \`hex\` — ${OSC_SOURCE}. The same in every style. Throttled while dragging, the last value on release.`,
            "The style is a local view preference: switching never sends anything; the choice is kept per control on this device (`viewPrefs`). `pickerStyle` in the config is the default.",
            "Feedback moves the picker; a grey or black from the installation keeps the hue the user chose.",
          ],
          a11y: [
            "Styles are a radio group; the field, wheel, strips and knobs are adjustable with their values read as text.",
          ],
          content: ["Title ≤ 16 characters (default “Colour”)."],
          figma: {
            component: "Color Picker (Patterns)",
            node: "139:1797",
            variants: [
              ["Style=Knobs", 'pickerStyle: "knobs"'],
              ["Style=Square", 'pickerStyle: "square"'],
              ["Style=Wheel", 'pickerStyle: "wheel"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ColorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Knobs: Story = {};
/** Switching the style keeps the colour and sends nothing. */
export const SwitchStyle: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("#3A4CA6")).toBeTruthy();
    // Switch the style: same colour, a different picker, nothing sent.
    await userEvent.click(await canvas.findByRole("radio", { name: "Square" }));
    await waitFor(() => expect(canvas.getByTestId("hsb-readout")).toBeTruthy());
    await expect(canvas.getByText("230°")).toBeTruthy();
    await expect(canvas.getByLabelText("Last OSC message").textContent).toBe("OSC → —");
  },
};
export const Square: Story = { args: { pickerStyle: "square" } };
export const Wheel: Story = { args: { pickerStyle: "wheel" } };
/** Opt-in: one `h s v` message instead of three addresses. */
export const SingleMessage: Story = { args: { format: "hsvFloat" } };
export const Palette: Story = { args: { palette: true, value: "#FF3B30", format: "hex" } };
export const Disabled: Story = { args: { disabled: true } };
