import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { componentDocs } from "../stories/docs";
import { Viewfinder } from "./Viewfinder";

const meta = {
  title: "Containers/Viewfinder",
  component: Viewfinder,
  args: { size: "phone" },
  argTypes: { size: { control: "inline-radio", options: ["phone", "tablet"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Frame over the camera preview while scanning the pairing QR on the installation screen (ADR-012).",
          use: ["The Connect screen's scanner."],
          avoid: ["Showing images — Image Tile / Image Upload."],
          do: ["Put the camera view in `children`; keep the frame on top."],
          dont: ["Don't add text inside the frame; put instructions under it."],
          anatomy: [
            "Recessed square (control track)",
            "Camera slot (children)",
            "Four lit corners (signal + glow)",
            "Scan line (lit)",
          ],
          behaviour: ["Static frame; scanning is the screen's job."],
          a11y: ["Role `image` with the instruction as label."],
          content: ["No text."],
          figma: {
            component: "Viewfinder",
            node: "47:267",
            variants: [
              ["Size=Phone", 'size="phone"'],
              ["Size=Tablet", 'size="tablet"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Viewfinder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Phone: Story = {};
export const Tablet: Story = { args: { size: "tablet" } };
