import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { expect, fn, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { SystemSheet } from "../stories/SystemSheet";
import { ConnectForm } from "./Connect";

const meta = {
  title: "Connect/Connect Form",
  component: ConnectForm,
  args: { onSubmit: fn(), onCancel: fn() },
  decorators: [
    (Story) => (
      <SystemSheet kind="phone-large">
        <Story />
      </SystemSheet>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "“Enter address and PIN” — the fallback when the camera cannot scan (ADR-012). Content of a sheet.",
          use: ["From Connect → Enter address and PIN."],
          avoid: ["Typing anything else — there are no accounts."],
          do: ["Accept what is printed under the QR: an IP, host[:port] or full ws:// URL."],
          dont: ["Don't clear the address on a wrong PIN."],
          anatomy: [
            "Title + hint",
            "Address field (URL keyboard)",
            "PIN field (number pad, secure)",
            "Cancel / Connect",
          ],
          behaviour: [
            "`manualPairing()` validates and builds the same pairing as the QR deep link (default port 8080; unit-tested).",
            "Field errors point at the wrong field; `error` shows the connection result under the PIN.",
          ],
          a11y: ["Fields have labels; errors are hints and live regions."],
          content: ["Errors in one short sentence."],
          figma: {
            component: "Connect · Enter address and PIN (sheet)",
            variants: [["Default / Error / Connecting", "error, busy"]],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ConnectForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.type(await canvas.findByLabelText("Address"), "192.168.1.20");
    await userEvent.type(await canvas.findByLabelText("PIN"), "2468");
    await userEvent.click(await canvas.findByRole("button", { name: "Connect" }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      bridge: "ws://192.168.1.20:8080/ws",
      pin: "2468",
    });
  },
};
export const WrongPin: Story = {
  args: { initialAddress: "192.168.1.20", error: "Wrong PIN — check the number under the QR" },
};
export const Connecting: Story = { args: { initialAddress: "192.168.1.20", busy: true } };
