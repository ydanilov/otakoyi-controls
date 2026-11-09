import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { InstallationActions } from "./Installation";

function Demo() {
  const [modes, setModes] = React.useState<Record<string, boolean>>({ idle: true, pause: false });
  return (
    <View style={{ width: 358 }}>
      <InstallationActions
        modeState={modes}
        onModeChange={(id, on) => setModes((m) => ({ ...m, [id]: on }))}
      />
    </View>
  );
}

const meta = {
  title: "Patterns/Installation Actions",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Body of the Installation surface (iPhone sheet, iPad inspector): quick actions (Flash, Restart, Blackout with hold) and modes (Idle, Pause).",
          use: ["Installation sheet / inspector, under the installation name and status."],
          avoid: ["The pult screen itself."],
          do: ["Hide Pause for installations that cannot pause (pass `modes`)."],
          dont: ["Don't add free settings here — Settings sheet."],
          anatomy: ["Quick Actions Row", "Section “Modes” → List Card → switch List Rows"],
          behaviour: [
            "Actions → `onAction(id)`; modes → `onModeChange(id, on)`. Sending is the screen's job (bridge).",
          ],
          a11y: ["Mode rows are switches with the mode name."],
          content: ["Mode labels describe the effect (“Idle mode — ignore players”)."],
          figma: { component: "Installation Actions (Patterns)", node: "62:846" },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const pause = await canvas.findByRole("switch", { name: "Pause playback" });
    await userEvent.click(pause);
    await expect(pause).toHaveAttribute("aria-checked", "true");
  },
};
