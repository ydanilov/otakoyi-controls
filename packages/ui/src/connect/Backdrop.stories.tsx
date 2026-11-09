import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { SAMPLE_TEAL } from "../stories/images";
import { Backdrop, ClientLogo } from "./Brand";

const meta = {
  title: "Connect/Backdrop",
  component: Backdrop,
  args: { source: SAMPLE_TEAL, label: "The installation in the hall" },
  argTypes: { source: { control: false } },
  render: (args) => (
    <View style={{ width: 390, height: 760, borderRadius: 24, overflow: "hidden" }}>
      <Backdrop {...args}>
        <View className="flex-1 items-center pt-24">
          <ClientLogo name="Aurora" subtitle="Hall · Live" />
        </View>
      </Backdrop>
    </View>
  ),
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Full-screen client image with a legibility gradient — the background of the client-branded loading screen.",
          use: ["Client loading screen after launch (ADR-013 launch)."],
          avoid: [
            "The system launch screen — that is a plain background with no logo or text.",
            "Behind the pult.",
          ],
          do: ["Use a photo of the installation, dark enough at the bottom for the loader."],
          dont: ["Don't put text on the image without the gradient."],
          anatomy: [
            "Image (cover)",
            "Gradient into `color.background` (top 55 %, middle 10–35 %, bottom 95 %)",
            "Content slot",
          ],
          behaviour: ["Without an image: plain background."],
          a11y: ["Decorative unless `label` is set."],
          content: ["—"],
          figma: { component: "Backdrop", node: "101:443" },
        }),
      },
    },
  },
} satisfies Meta<typeof Backdrop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {};
export const NoImage: Story = { args: { source: undefined } };
