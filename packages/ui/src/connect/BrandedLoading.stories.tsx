import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { fn } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { SAMPLE_TEAL } from "../stories/images";
import { BrandedLoading } from "./Connect";

const meta = {
  title: "Connect/Client Loading",
  component: BrandedLoading,
  args: {
    name: "Aurora",
    subtitle: "Hall · Live",
    backdrop: SAMPLE_TEAL,
    status: "connecting",
    onRetry: fn(),
    onForget: fn(),
  },
  argTypes: {
    status: { control: "inline-radio", options: ["connecting", "error"] },
    backdrop: { control: false },
    logo: { control: false },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 390, height: 760, borderRadius: 24, overflow: "hidden" }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Client-branded screen after launch while the app connects to the paired installation (ADR-013 launch).",
          use: ["Every launch with a saved pairing, and while reconnecting from the start."],
          avoid: ["The system launch screen (plain background, no logo)."],
          do: ["Show connection problems inline with Retry."],
          dont: ["Don't show an alert at startup."],
          anatomy: [
            "Backdrop (image + gradient)",
            "Client Logo",
            "Loader “Connecting to …” — or Info Card + Forget / Retry",
          ],
          behaviour: [
            '`status="error"` swaps the loader for the message and actions; Forget returns to Connect (“Forget this installation”).',
          ],
          a11y: [
            "Loader is a progressbar with the label; the error card is read before the buttons.",
          ],
          content: ["Error: what happened + what to check, ≤ 100 characters."],
          figma: {
            component: "Client loading (Screens: Client · Template)",
            variants: [
              ["Connecting", 'status="connecting"'],
              ["Can\'t connect", 'status="error"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof BrandedLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connecting: Story = {};
export const CantConnect: Story = {
  args: {
    status: "error",
    message: "Can't reach Aurora Hall. Check that this phone is on the hall's Wi-Fi.",
  },
};
