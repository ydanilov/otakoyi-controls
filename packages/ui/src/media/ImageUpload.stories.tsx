import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { SAMPLE_WALL } from "../stories/images";
import { componentDocs } from "../stories/docs";
import { ImageUploadView } from "./Image";

const meta = {
  title: "Media & actions/Image Upload",
  component: ImageUploadView,
  args: {
    state: "selected",
    source: SAMPLE_WALL,
    progress: 0.64,
    totalBytes: 3_300_000,
    liveSince: "Shown on Lobby wall since 18:42.",
    onChoose: fn(),
    onCrop: fn(),
    onSend: fn(),
    onCancel: fn(),
    onReplace: fn(),
    onRemove: fn(),
    onRetry: fn(),
    onDiscard: fn(),
  },
  argTypes: {
    state: {
      control: "select",
      options: ["empty", "selected", "uploading", "processing", "live", "error", "disabled"],
    },
    source: { control: false },
    progress: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 358 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "The client's own image on an installation screen, through every state of sending it. UI only: the upload, crop and bridge storage belong to the image control (feat/new-controls).",
          use: ["Lobby pults where the client may change a wall image."],
          avoid: ["Choosing between pre-made scenes — Scene List."],
          do: ["Tell the user what happens next in the caption of every state."],
          dont: ["Don't hide the error — keep the image and offer Retry."],
          anatomy: [
            "Caption + accepted formats (mono)",
            "16:9 frame: dashed empty bed or image with overlay status chip",
            "Crop button (Selected)",
            "Progress bar (Uploading)",
            "Caption line",
            "Action buttons per state",
          ],
          behaviour: [
            "Empty → Selected (onChoose) → Uploading (onSend; onCancel) → Processing → Live (onReplace / onRemove).",
            "Error keeps the image: onRetry / onDiscard.",
            "Disabled while view-only (another device holds the lease).",
            "Upload label via `uploadLabel()` (“64% · 2.1 / 3.3 MB”).",
          ],
          a11y: [
            "Frame is an image with the status as label; caption is a polite live region so state changes are announced.",
            "Buttons ≥ 40 pt high, full-width halves.",
          ],
          content: ["Error ≤ 100 characters; captions one sentence."],
          figma: {
            component: "Image Upload",
            node: "78:307",
            variants: [
              ["State=Empty", 'state="empty"'],
              ["State=Selected", 'state="selected"'],
              ["State=Uploading", 'state="uploading"'],
              ["State=Processing", 'state="processing"'],
              ["State=Live", 'state="live"'],
              ["State=Error", 'state="error"'],
              ["State=Disabled", 'state="disabled"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ImageUploadView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { state: "empty" } };
export const Selected: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Send to screen" }));
    await expect(args.onSend).toHaveBeenCalled();
  },
};
export const Uploading: Story = { args: { state: "uploading" } };
export const Processing: Story = { args: { state: "processing" } };
export const Live: Story = { args: { state: "live" } };
export const Error: Story = { args: { state: "error" } };
export const Disabled: Story = { args: { state: "disabled" } };
