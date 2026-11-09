import type { Pult } from "@osc/schema";
import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { PultSelect } from "./PultSelect";

const PULTS = [
  { id: "lobby", name: "Lobby controller", pages: [] },
  { id: "vj", name: "VJ console", pages: [] },
] as unknown as Pult[];

function Demo() {
  const [v, setV] = React.useState("lobby");
  return (
    <View style={{ width: 260, minHeight: 200 }}>
      <PultSelect pults={PULTS} value={v} onChange={setV} />
    </View>
  );
}

const meta = {
  title: "Pult/Pult Select",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Switches between the pults of one installation (lobby, conference hall, VJ console) from the header.",
          use: ["Pult Header `switcher` slot when the installation has 2+ pults."],
          avoid: ["Single-pult installations — it renders nothing."],
          do: ["Name pults by place or role."],
          dont: ["Don't use it for screens inside a pult — Tab Bar."],
          anatomy: ["Reusables Select trigger (min 192 pt)", "Popover list"],
          behaviour: [
            "`onChange(id)`; hidden with fewer than two pults.",
            "Still the Reusables select; the DS `Select` row with the native iOS menu is the settings-style alternative.",
          ],
          a11y: ["Trigger labelled “Choose pult”."],
          content: ["Pult names ≤ 20 characters."],
          figma: { component: "Pult Select", node: "10:32" },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
