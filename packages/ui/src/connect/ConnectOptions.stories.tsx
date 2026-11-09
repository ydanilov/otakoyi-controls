import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { ConnectOptions } from "./Connect";

const meta = {
  title: "Connect/Connect Options",
  component: ConnectOptions,
  args: { onScan: fn(), onEnterAddress: fn(), onDemo: fn() },
  decorators: [
    (Story, ctx) => (
      <View
        style={
          ctx.args.layout === "tablet" ? { width: 1210, height: 760 } : { width: 402, height: 778 }
        }
      >
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "The first screen (ADR-012, no client login): scan the pairing QR, enter address and PIN, or try the demo.",
          use: ["App start without a saved pairing; after “Forget this installation”."],
          avoid: ["Accounts, passwords or sign-in — clients never log in."],
          do: ["Scan is the primary action; demo is the low-emphasis one."],
          dont: ["Don't show the pult before pairing (except the demo)."],
          anatomy: [
            "Phone: Brand Mark + Wordmark centred at the top",
            "Phone hero (centred): 104 pt recessed tile (radius 30) with the scan icon and a soft signal glow; title “Connect to your installation”; subtitle",
            "Actions pinned at the bottom: Scan pairing QR (Primary LG), Enter address and PIN (Secondary LG) → sheet with Connect Form, Try the demo (Ghost), centred note — no “or” divider",
            "Tablet: brand story on the left (mark, “Your installation, in your hands.”), title + actions on the right",
          ],
          behaviour: [
            "Scan opens the camera with the Viewfinder; address/PIN opens a sheet; demo starts the in-app simulated installation.",
          ],
          a11y: ["Three buttons in reading order; ≥ 40 pt high; the title is a header."],
          content: ["Fixed copy."],
          figma: {
            component: "Connect screen (Screens)",
            node: "106:8",
            variants: [
              ["Phone / 01 Connect (106:8)", 'layout="phone"'],
              ["Tablet / 01 Connect (106:161)", 'layout="tablet"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ConnectOptions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Try the demo" }));
    await expect(args.onDemo).toHaveBeenCalled();
  },
};

export const Tablet: Story = { args: { layout: "tablet" } };
