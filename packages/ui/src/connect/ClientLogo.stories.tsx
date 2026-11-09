import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { ClientLogo } from "./Brand";

const meta = {
  title: "Connect/Client Logo",
  component: ClientLogo,
  args: { name: "Aurora", subtitle: "Hall · Live", size: "lg" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "lg"] },
    source: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "The installation's logo (config `theme.logo`) or, without one, its name set as a wordmark. Studio branding (ADR-004): clients never change it.",
          use: ["Client loading screen; Installation sheet header."],
          avoid: ["The Otakoyi app identity — Brand Mark / Wordmark."],
          do: ["Ship a logo asset with the config when the client has one."],
          dont: ["Don't let users edit it — there is no brand editor in the app."],
          anatomy: ["Logo image (contain) — or name (bold, uppercase, tracked) + subtitle (muted)"],
          behaviour: ["Name shrinks to fit one line."],
          a11y: ["Role `header` (text) or `image` (logo), labelled with the name and subtitle."],
          content: ["Name ≤ 12 characters at LG; subtitle ≤ 24 characters."],
          figma: {
            component: "Client Logo",
            node: "101:446",
            variants: [["(size)", 'size="sm" | "lg"']],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ClientLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Large: Story = {};
export const Small: Story = { args: { size: "sm" } };
export const NameOnly: Story = { args: { subtitle: undefined, name: "Aurora Hall" } };
export const Both: Story = {
  render: () => (
    <View style={{ gap: 24, alignItems: "center" }}>
      <ClientLogo name="Aurora" subtitle="Hall · Live" size="lg" />
      <ClientLogo name="Aurora" subtitle="Hall · Live" size="sm" />
    </View>
  ),
};
