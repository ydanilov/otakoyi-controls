import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, fn, screen, userEvent } from "storybook/test";
import { Button } from "../chrome/Button";
import { Text } from "../components/ui/text";
import { CameraIcon, FolderSimpleIcon, ImagesIcon, PlusIcon, UploadSimpleIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { PullDownMenu, type MenuItem } from "./PullDownMenu";

function Demo({ defaultOpen, onPick }: { defaultOpen?: boolean; onPick: (key: string) => void }) {
  const [picked, setPicked] = React.useState("—");
  const pick = (k: string) => () => {
    setPicked(k);
    onPick(k);
  };
  const items: MenuItem[] = [
    {
      key: "camera",
      label: "Take Photo",
      icon: CameraIcon,
      systemImage: "camera",
      onSelect: pick("camera"),
    },
    {
      key: "library",
      label: "Photo Library",
      icon: ImagesIcon,
      systemImage: "photo.on.rectangle",
      onSelect: pick("library"),
    },
    {
      key: "file",
      label: "Choose File",
      icon: FolderSimpleIcon,
      systemImage: "folder",
      onSelect: pick("file"),
    },
    {
      key: "uploads",
      label: "Uploads",
      icon: UploadSimpleIcon,
      systemImage: "square.grid.2x2",
      onSelect: pick("uploads"),
    },
  ];
  return (
    <View style={{ minHeight: 300, gap: 12 }}>
      <PullDownMenu label="Add image" items={items} defaultOpen={defaultOpen}>
        <Button label="Add image" icon={PlusIcon} variant="secondary" />
      </PullDownMenu>
      <Text className="text-muted-foreground font-mono text-xs">picked: {picked}</Text>
    </View>
  );
}

const meta = {
  title: "Menus/Pull-down Menu",
  component: Demo,
  args: { onPick: fn() },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Commands from a button (HIG pull-down menu, 3+ items) — e.g. the image source picker: Take Photo / Photo Library / Choose File / Uploads. Replaces the image source sheet (ADR-013).",
          use: ["A button that offers several ways to do one thing."],
          avoid: [
            "Choosing one value of many that stays visible — Select (pop-up button).",
            "Long-press actions on an element — Context Menu.",
          ],
          do: ["Order by frequency; destructive items last (enforced by `orderMenuItems`)."],
          dont: ["Don't put fewer than 3 items in a pull-down; use buttons."],
          anatomy: [
            "Trigger (any button, passed as children)",
            "Menu: rows with label + icon; destructive rows red after a separator",
          ],
          behaviour: [
            "iOS: system SwiftUI `Menu` via `@expo/ui` (`PullDownMenu.ios.tsx`), items with SF Symbols (`systemImage`).",
            "Web / Android: RN popover under the trigger; tap outside closes.",
          ],
          a11y: [
            "Trigger: button with `label`, hint “Opens a menu”, `expanded`.",
            "Items: `menuitem`.",
          ],
          content: [
            "Item labels are commands in title case per HIG (“Take Photo”), ≤ 24 characters.",
          ],
          figma: {
            component: "Image source menu (Patterns: image flow)",
            variants: [["Menu item", "MenuItem { label, icon, systemImage, destructive }"]],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ImageSource: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Add image" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Photo Library" }));
    await expect(args.onPick).toHaveBeenCalledWith("library");
  },
};
export const Open: Story = { args: { defaultOpen: true } };
