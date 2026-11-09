import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { SystemScreen, type SystemValues } from "./System";

function Demo({ initial, disabled }: { initial: SystemValues; disabled?: boolean }) {
  const [values, setValues] = React.useState<SystemValues>(initial);
  return (
    <View style={{ width: 358 }}>
      <SystemScreen
        values={values}
        onChange={(c) => setValues((s) => ({ ...s, [c.key]: c.value }))}
        disabled={disabled}
      />
    </View>
  );
}

const meta = {
  title: "Patterns/System Screen",
  component: Demo,
  args: { initial: { resw: 1280, resh: 1280, debug: false, seed: 0 } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "The standard System screen of every installation (ADR-018): output width and height, debug overlay and seed. Identical everywhere, so no client page redraws it.",
          use: [
            "Installation panel › System, next to the system actions (Flash, Restart, Blackout, Idle, Pause).",
          ],
          avoid: [
            "Client pults — the System group never appears on a project screen.",
            "The app's Settings sheet (pairing, haptics, developer) — that is the app, not the installation.",
          ],
          do: [
            "Show the installation's own values (feedback); changes apply live.",
            "Keep the presets in `SYSTEM_SIZE_PRESETS` (`@osc/schema`) so every installation offers the same.",
          ],
          dont: ["Don't add project parameters here; they belong on the client pult."],
          anatomy: [
            "Console Panel “Output size”: preset buttons (the matching one lit), Width and Height steppers, Custom width / height value inputs",
            "List Card: Debug overlay switch row",
            "Console Panel “Seed”: value input (0 = random)",
          ],
          behaviour: [
            "Every change sends at once through the hidden `system` pult (bridge state, lease, echo and activity as for any control).",
            "A preset sends only the dimensions that change.",
            "Until the installation reports its size, 1920 × 1080 is shown with a note.",
            "Without control (another device holds the lease) everything is disabled but visible.",
          ],
          a11y: ["See Stepper, Value Input and List Row; presets are buttons named by their size."],
          content: ["Fixed copy; the same in every installation."],
          figma: {
            component: "System Screen (Patterns)",
            node: "285:1953",
            variants: [
              ["Breakpoint=Phone", "(sheet width)"],
              ["Breakpoint=Tablet", "(inspector width)"],
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
    await userEvent.click(await canvas.findByRole("button", { name: "1920 × 1080" }));
    await expect(await canvas.findByText("1920")).toBeVisible();
    await expect(await canvas.findByText("1080")).toBeVisible();
  },
};
export const NotReported: Story = { args: { initial: {} } };
export const Disabled: Story = { args: { disabled: true } };
