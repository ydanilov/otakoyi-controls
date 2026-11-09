import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent } from "storybook/test";
import { KeyIcon, MonitorIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { TextField } from "./Field";

function Demo(
  props: Omit<React.ComponentProps<typeof TextField>, "value" | "onChangeText"> & {
    initial?: string;
  },
) {
  const [v, setV] = React.useState(props.initial ?? "192.168.1.20");
  return (
    <View style={{ width: 326 }}>
      <TextField {...props} value={v} onChangeText={setV} />
    </View>
  );
}

const meta = {
  title: "Forms/Input",
  component: Demo,
  args: { label: "Address", icon: MonitorIcon, autoCapitalize: "none" },
  argTypes: { icon: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Free-text field for pairing (bridge address and PIN, ADR-012 — there is no login). Exported as `TextField`.",
          use: ["Address and PIN in the Connect form."],
          avoid: [
            "Numbers with a unit — use Value Input.",
            "Anything on the pult — the pult has no free-text fields (no editor in the client app).",
          ],
          do: [
            "Show the error under the field in plain words (“Wrong PIN”).",
            "Use `secureTextEntry` for passwords and the right `textContentType`.",
          ],
          dont: ["Don't use placeholder text as the label."],
          anatomy: [
            "Caption (Control/Label, uppercase)",
            "Recessed field (Neu/Inset) with optional leading icon",
            "Ring: accent on focus, critical on error",
            "Error line (Body/XS, critical)",
          ],
          behaviour: [
            "Focus ring follows real focus (or `focused` for reviews).",
            "`error` switches to the error state and announces the message.",
          ],
          a11y: [
            "Label = caption; the error is the accessibility hint and a polite live region.",
            "Field height ≥ 44 pt.",
          ],
          content: ["Caption ≤ 16 characters. Error ≤ 60 characters, wraps."],
          figma: {
            component: "Input",
            node: "32:91",
            variants: [
              ["State=Default", "—"],
              ["State=Focus", "focused (runtime)"],
              ["State=Error", 'error="…"'],
              ["(code only) Disabled", "disabled"],
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
    const input = await canvas.findByLabelText("Address");
    await userEvent.clear(input);
    await userEvent.type(input, "studio.local:8080");
    await expect(input).toHaveValue("studio.local:8080");
  },
};
export const Focus: Story = { args: { focused: true } };
export const Error: Story = { args: { error: "That doesn't look like an address" } };
export const Disabled: Story = { args: { disabled: true } };
export const Password: Story = {
  args: { label: "PIN", icon: KeyIcon, secureTextEntry: true, initial: "2468" },
};
export const Empty: Story = { args: { initial: "", placeholder: "192.168.1.20" } };
