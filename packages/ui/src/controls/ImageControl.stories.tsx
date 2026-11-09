import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { ControlHarness } from "../stories/ControlHarness";
import { makeControl } from "../stories/controls";
import { componentDocs, OSC_SOURCE } from "../stories/docs";

function ImageStory({ disabled, library }: { disabled: boolean; library: boolean }) {
  const control = React.useMemo(
    () =>
      makeControl({
        type: "image",
        id: "wall",
        address: "/wall/image",
        label: "Wall image",
        aspect: "16:9",
        library,
      }),
    [library],
  );
  return (
    <ControlHarness control={control} value={null} disabled={disabled} width={358} height={380} />
  );
}

const meta = {
  title: "Controls/Image",
  component: ImageStory,
  args: { disabled: false, library: true },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "The client's own image on the installation screen: pick, upload, show; earlier uploads can be shown again. Schema type `image` (ADR-015). Exported as `ImageUpload` (control); its visual states are the DS `ImageUploadView` and `ImageTile`.",
          use: ["Lobby pults where the client may put a picture on the wall."],
          avoid: ["Pre-made looks — Scene List."],
          do: ["Set `aspect` and `maxMB` to what the installation can show."],
          dont: [
            "Don't send images over OSC — the bridge stores the file and OSC carries the path.",
          ],
          anatomy: [
            "Label",
            "Preview / empty bed",
            "Library strip (Image Tiles) when `library`",
            "Status and actions",
          ],
          behaviour: [
            `Upload goes to the bridge (HTTP); then \`address\` is sent with the stored file's absolute path — ${OSC_SOURCE}. With a remote bridge the bridge sends it.`,
            "Picking and uploading go through `useControlServices()` (image picker, media library); the story uses in-memory services and a sample image.",
            "Source choice is a pull-down menu (Take Photo / Photo Library / Choose File / Uploads, ADR-013) — see Menus/Pull-down Menu.",
          ],
          a11y: ["Buttons are labelled; the preview is an image with its status."],
          content: ["Errors in one sentence; the image is kept on failure."],
          figma: { component: "Image Upload (control)", node: "78:307" },
        }),
      },
    },
  },
} satisfies Meta<typeof ImageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutLibrary: Story = { args: { library: false } };
export const Disabled: Story = { args: { disabled: true } };
