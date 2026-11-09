import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, screen, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { Select } from "./Select";

const OUTPUTS = [
  { label: "Projector", value: "projector" },
  { label: "LED wall", value: "led" },
  { label: "Both screens", value: "both" },
  { label: "Preview only", value: "preview" },
];

function Demo({ disabled, defaultOpen }: { disabled?: boolean; defaultOpen?: boolean }) {
  const [v, setV] = React.useState("projector");
  return (
    <View style={{ width: 340 }}>
      <Select
        label="Output"
        value={v}
        options={OUTPUTS}
        onChange={setV}
        disabled={disabled}
        defaultOpen={defaultOpen}
      />
    </View>
  );
}

const meta = {
  title: "Forms/Select",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Pick one of a few named options in settings, the iOS way: the value opens a pull-down menu with a checkmark.",
          use: ["3–8 options where the current one should stay visible in the row."],
          avoid: [
            "2 options — use a Switch or Segmented.",
            "Live switching on the pult — use Segmented or Scene List (one tap, no menu).",
          ],
          do: ["Keep option labels short and parallel (“Projector”, “LED wall”)."],
          dont: ["Don't nest selects in dialogs on phones; open a sub-page instead."],
          anatomy: [
            "Row label (Body/SM)",
            "Value in the brand accent + up/down caret",
            "Menu: raised popover, checkmark column, 44 pt items",
          ],
          behaviour: [
            "iOS: `Select.ios.tsx` renders the native SwiftUI menu via `@expo/ui` `Picker` (appearance menu) inside a `Host` tinted with the accent — system menu, checkmark, haptics.",
            "Web and Android: an RN pull-down measured under the value; tapping outside closes it. Selecting the current option just closes.",
            "`defaultOpen` (web/Android only) renders the open state for reviews.",
          ],
          a11y: [
            "Trigger: button “Output: Projector”, hint “Opens a menu”, `expanded` state.",
            "Menu items: role `menuitem` with `checked`.",
          ],
          content: ["Option labels ≤ 20 characters; the value in the row truncates first."],
          figma: {
            component: "Select",
            node: "88:626",
            variants: [
              ["State=Default", "—"],
              ["State=Open", "open (runtime) / defaultOpen"],
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

export const Default: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Output: Projector" }));
    const item = await screen.findByRole("menuitem", { name: "LED wall" });
    await userEvent.click(item);
    await expect(await canvas.findByRole("button", { name: "Output: LED wall" })).toBeVisible();
  },
};
export const Open: Story = {
  args: { defaultOpen: true },
  parameters: { docs: { story: { height: "280px" } } },
};
export const Disabled: Story = { args: { disabled: true } };
