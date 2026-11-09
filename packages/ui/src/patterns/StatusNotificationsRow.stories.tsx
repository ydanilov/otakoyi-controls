import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { ListCard } from "../containers/Cards";
import { componentDocs } from "../stories/docs";
import { StatusNotificationsRow } from "./StatusNotificationsRow";

const meta = {
  title: "Patterns/Status Notifications Row",
  component: StatusNotificationsRow,
  args: { state: "off", onChange: fn() },
  argTypes: {
    state: {
      control: "inline-radio",
      options: ["off", "on", "asking", "denied", "unavailable"],
    },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 358 }}>
        <ListCard>
          <Story />
        </ListCard>
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Settings › Control preferences › Status notifications: whether the app tells the user, while it is in the background, that the connection dropped or came back, that another device or the studio took control, that the installation restarted, or that a quick action failed.",
          use: ["Settings (iPhone sheet, iPad drawer), in the Control preferences List Card."],
          avoid: ["Telling the user something on screen — the header banners and dialogs do that."],
          do: [
            "Ask for the system permission only when the user turns the switch on.",
            "Turn the switch back off when the permission is denied, and say why.",
          ],
          dont: ["Don't hide the row on the web — show it disabled with the caption."],
          anatomy: [
            "List Row: bell icon, title, Menu Switch",
            "Subtitle while asking (“Asking for permission…”)",
            "Caption under the row when denied or unavailable",
          ],
          behaviour: [
            "States: Off · On · Asking (switch on and disabled while the system prompt is up) · Denied (switch off, caption: allow in system Settings) · Unavailable (web pult: disabled, caption).",
            "Tap anywhere on the row toggles. The app decides the next state (`toggleNotifications` in apps/mobile/src/lib/notifications.ts); notifications are only posted while the app is in the background.",
          ],
          a11y: [
            "The row is the switch (role `switch`, `aria-checked`, `aria-disabled`); the caption is plain text read after it.",
          ],
          content: ["Caption ≤ 2 lines on a phone."],
          figma: {
            component: "List Row",
            node: "32:123",
            variants: [["Trailing=Switch", "state"]],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof StatusNotificationsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tapping the row asks the app to turn notifications on. */
export const Off: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("switch", { name: "Status notifications" }));
    await expect(args.onChange).toHaveBeenCalledWith(true);
  },
};
export const On: Story = { args: { state: "on" } };
export const Asking: Story = {
  args: { state: "asking" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Asking for permission…")).toBeTruthy();
  },
};
export const Denied: Story = {
  args: { state: "denied" },
  play: async ({ canvas }) => {
    const row = await canvas.findByRole("switch", { name: "Status notifications" });
    await expect(row.getAttribute("aria-checked")).toBe("false");
    await expect(canvas.getByTestId("status-notifications-caption")).toBeTruthy();
  },
};
export const Unavailable: Story = {
  args: { state: "unavailable" },
  play: async ({ canvas }) => {
    const row = await canvas.findByRole("switch", { name: "Status notifications" });
    await expect(row.getAttribute("aria-disabled")).toBe("true");
    await expect(await canvas.findByText(/Not available in the browser/)).toBeTruthy();
  },
};
