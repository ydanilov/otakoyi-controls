import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ControlServices } from "../platform/services";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

type State = "off" | "denied" | "viewOnly";

/** Motion access refused earlier (iOS Motion & Fitness off): Permission denied before any tap. */
const deniedMotion: Partial<ControlServices> = {
  motion: {
    available: true,
    permission: async () => "denied",
    requestPermission: async () => false,
    start: () => Promise.reject(new Error("denied")),
    openSettings: () => {},
  },
};

function GyroscopeStory({ state, height }: { state: State; height: number }) {
  const control = React.useMemo(
    () => makeControl({ type: "gyroscope", id: "tilt", address: "/tilt", label: "Device tilt" }),
    [],
  );
  return (
    <ControlHarness
      control={control}
      // View only: the tilt another device sends (synced through the bridge).
      value={state === "viewOnly" ? { x: 0.42, y: 0.28 } : { x: 0, y: 0 }}
      disabled={state === "viewOnly"}
      services={state === "denied" ? deniedMotion : undefined}
      width={358}
      height={height}
    />
  );
}

const meta = {
  title: "Controls/Gyroscope",
  component: GyroscopeStory,
  args: { state: "off", height: 184 },
  argTypes: { state: { control: "inline-radio", options: ["off", "denied", "viewOnly"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Device tilt: the phone becomes the controller — tilt it to move a point (steer a camera, lean a particle field). Schema type `gyroscope`.",
          use: ["Lobby and event moments where moving the phone itself is the interaction."],
          avoid: [
            "Precise values — Fader / XY Pad.",
            "Speed control that springs back — Thumbstick.",
          ],
          do: [
            "Tell people to hold the phone comfortably before switching on: that pose is the centre.",
            "Pick `range` for the gesture: ±20° (preset `gyroscope/steer`) for wrist moves, ±45° (`gyroscope/sway`) for big ones.",
          ],
          dont: ["Don't leave it on when nobody holds the phone — switch it off."],
          anatomy: [
            "Header: label + x / y readout (mono)",
            "Raised card",
            "Inset tilt plane: crosshair, dashed half ring, full-range ring, dot (+ line and glow while live)",
            "Menu Switch (sending on / off)",
            "Message line; Open Settings button when motion access is denied",
          ],
          behaviour: [
            `Switching on captures the current pose as the centre; roll is x, pitch is y (top edge away = up), both −1..1, \`range\` degrees (default 30) reach the outer ring and clamp beyond. It sends \`address\` x y (floats) at \`rateHz\` (30), throttled — ${OSC_SOURCE}.`,
            "Switching off, the app going to the background or losing control stops reading; switching off or backgrounding sends 0 0 once.",
            "Only the device holding control sends; others are View only and show the tilt it sends (and the installation's feedback on the address).",
            "Motion comes from the platform `MotionInput` service (expo-sensors DeviceMotion in the app, DeviceOrientation in the web pult, which needs HTTPS and asks on the tap). The story uses a synthetic slow circle.",
            "Permission denied shows Open Settings under the card when the cell has room, otherwise an inline Open Settings link (a pult cell is 184 pt).",
          ],
          a11y: [
            "The switch is a `switch` named “<label>: send tilt”; the plane is an image whose name reads the current x / y.",
            "Disabled switch in Permission denied, unsupported and View only.",
          ],
          content: ["Label ≤ 20 characters; message lines are fixed copy."],
          figma: {
            component: "Gyroscope",
            node: "204:853",
            variants: [
              ["State=Off", "`state: off`"],
              ["State=Live", "switch on (runtime; story `Live`)"],
              [
                "State=Permission denied",
                "`MotionInput.permission()` denied (story `PermissionDenied`)",
              ],
              ["State=View only", "`disabled`"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof GyroscopeStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("Turn on and tilt the phone to move the point."),
    ).toBeVisible();
    await expect(canvas.getByText("—")).toBeVisible();
  },
};

/** Figma State=Live: the switch turned on, the synthetic tilt streams `/tilt x y`. */
export const Live: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("switch", { name: "Device tilt: send tilt" }));
    await expect(await canvas.findByText("Sending tilt to the installation.")).toBeVisible();
    await expect(await canvas.findByText(/^OSC → \/tilt -?[\d.]+ -?[\d.]+$/)).toBeVisible();
    await waitFor(() => expect(canvas.getByText(/^x [−\d.]+\s+y [−\d.]+$/)).toBeVisible());
  },
};

export const PermissionDenied: Story = {
  args: { state: "denied", height: 244 },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Motion access is off for Otakoyi.")).toBeVisible();
    await expect(await canvas.findByRole("button", { name: "Open Settings" })).toBeVisible();
    await expect(canvas.getByRole("switch")).toHaveAttribute("aria-disabled", "true");
  },
};

/** Permission denied in a 184 pt pult cell: Open Settings moves into the message line. */
export const PermissionDeniedInCell: Story = {
  args: { state: "denied", height: 184 },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Open Settings" })).toBeVisible();
  },
};

export const ViewOnly: Story = {
  args: { state: "viewOnly" },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("Only the controlling device sends its tilt."),
    ).toBeVisible();
    await expect(canvas.getByText(/^x 0\.42\s+y 0\.28$/)).toBeTruthy();
  },
};
