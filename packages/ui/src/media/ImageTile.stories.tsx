import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { fn } from "storybook/test";
import { SAMPLE_TEAL, SAMPLE_WALL } from "../stories/images";
import { componentDocs } from "../stories/docs";
import { ImageTile } from "./Image";

const meta = {
  title: "Media & actions/Image Tile",
  component: ImageTile,
  args: {
    state: "default",
    source: SAMPLE_WALL,
    progress: 0.64,
    label: "sunset.jpg",
    onPress: fn(),
  },
  argTypes: {
    state: {
      control: "inline-radio",
      options: ["default", "selected", "live", "uploading", "failed", "add"],
    },
    source: { control: false },
    progress: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "One image in the uploads library grid. UI only — choosing and uploading belongs to the image control (feat/new-controls).",
          use: ["Uploads Library pattern; recent images in the Image Upload flow."],
          avoid: ["A single large preview — Image Upload."],
          do: ["Show Live on exactly one tile per screen target."],
          dont: ["Don't crop meaningfully here; tiles are cover-fit previews."],
          anatomy: [
            "Square (104 pt), radius lg, raised SM",
            "Image (cover)",
            "Selected: signal border; Live: border + glow + LIVE chip",
            "Uploading: dimmed + Progress Ring + %",
            "Failed: critical border + Retry",
            "Add: dashed bed + plus + UPLOAD",
          ],
          behaviour: [
            "`onPress` selects, retries or adds depending on the state (the parent decides).",
          ],
          a11y: [
            "Role `button`, label = file name + state (“sunset.jpg, live on screen”); selected/live set `selected`.",
          ],
          content: ["No visible text except state words."],
          figma: {
            component: "Image Tile",
            node: "77:225",
            variants: [
              ["State=Default", 'state="default"'],
              ["State=Selected", 'state="selected"'],
              ["State=Live", 'state="live"'],
              ["State=Uploading", 'state="uploading" + progress'],
              ["State=Failed", 'state="failed"'],
              ["State=Add", 'state="add"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ImageTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { state: "selected", source: SAMPLE_TEAL } };
export const Live: Story = { args: { state: "live" } };
export const Uploading: Story = { args: { state: "uploading" } };
export const Failed: Story = { args: { state: "failed" } };
export const Add: Story = { args: { state: "add" } };
export const Grid: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
      <ImageTile source={SAMPLE_WALL} />
      <ImageTile state="selected" source={SAMPLE_TEAL} />
      <ImageTile state="live" source={SAMPLE_WALL} />
      <ImageTile state="uploading" source={SAMPLE_TEAL} progress={0.64} />
      <ImageTile state="failed" source={SAMPLE_WALL} />
      <ImageTile state="add" />
    </View>
  ),
};
