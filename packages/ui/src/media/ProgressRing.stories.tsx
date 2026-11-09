import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { componentDocs } from "../stories/docs";
import { ProgressRing } from "./ProgressRing";

const meta = {
  title: "Media & actions/Progress Ring",
  component: ProgressRing,
  args: { progress: 0.64, size: 44, stroke: 4 },
  argTypes: { progress: { control: { type: "range", min: 0, max: 1, step: 0.01 } } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "Circular determinate progress, used by Image Tile while uploading.",
          use: ["Known progress in a small square space."],
          avoid: ["Unknown duration — Loader.", "Wide areas — a bar (Image Upload)."],
          do: ["Pair with a percentage label."],
          dont: ["Don't animate it without real progress."],
          anatomy: ["Recessed track circle", "Signal arc from 12 o'clock, clockwise"],
          behaviour: ["`progress` 0…1, clamped."],
          a11y: ["Decorative; the parent announces the percentage."],
          content: ["No text."],
          figma: { component: "Image Tile (State=Uploading) ring", node: "77:225" },
        }),
      },
    },
  },
} satisfies Meta<typeof ProgressRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Done: Story = { args: { progress: 1 } };
