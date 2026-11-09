import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { Toast } from "../chrome/Toast";
import { Text } from "../components/ui/text";
import { Surface } from "../ds/depth";
import { CopyIcon, PencilSimpleIcon, PowerIcon, TrashIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { ContextMenu, type MenuItem } from "./ContextMenu";

function Card({ label, on }: { label: string; on: boolean }) {
  return (
    <Surface
      depth={on ? "inset" : "raisedSm"}
      radius="lg"
      className="gap-1 p-3"
      style={{ width: 168 }}
    >
      <Text className="text-foreground text-sm font-semibold">{label}</Text>
      <Text className="text-muted-foreground text-xs" numberOfLines={2}>
        neon fog drifting over a quiet sea
      </Text>
    </Surface>
  );
}

function Demo({ defaultOpen }: { defaultOpen?: boolean }) {
  const [deleted, setDeleted] = React.useState(false);
  const [on, setOn] = React.useState(true);
  const items: MenuItem[] = [
    {
      key: "delete",
      label: "Delete",
      icon: TrashIcon,
      systemImage: "trash",
      destructive: true,
      onSelect: () => setDeleted(true),
    },
    {
      key: "toggle",
      label: on ? "Turn Off" : "Turn On",
      icon: PowerIcon,
      systemImage: "power",
      onSelect: () => setOn(!on),
    },
    {
      key: "edit",
      label: "Edit",
      icon: PencilSimpleIcon,
      systemImage: "pencil",
      onSelect: () => {},
    },
    {
      key: "duplicate",
      label: "Duplicate",
      icon: CopyIcon,
      systemImage: "plus.square.on.square",
      onSelect: () => {},
    },
  ];
  return (
    <View style={{ minHeight: 420, gap: 16, width: 358 }}>
      {!deleted && (
        <ContextMenu label="Prompt: Fog" items={items} defaultOpen={defaultOpen}>
          <Card label="Fog" on={on} />
        </ContextMenu>
      )}
      {deleted && (
        <Toast
          message="Prompt deleted"
          icon={TrashIcon}
          actionLabel="Undo"
          onAction={() => setDeleted(false)}
          onDismiss={() => {}}
        />
      )}
    </View>
  );
}

const meta = {
  title: "Menus/Context Menu",
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Long-press an element (a prompt card, an image tile) → the system context menu with a preview of the element (ADR-013, HIG).",
          use: ["Secondary actions on an element: On/Off, Edit, Duplicate, Delete."],
          avoid: [
            "The primary action — that is the tap.",
            "Commands from a button — Pull-down Menu.",
          ],
          do: ["Delete last, in red; delete at once and show an Undo Toast for 5 s."],
          dont: ["Don't ask for delete confirmation — there is no confirmation sheet any more."],
          anatomy: [
            "Trigger: the element (children)",
            "Preview: the element lifted (or `preview`)",
            "Menu: commands, destructive last in red",
          ],
          behaviour: [
            "iOS: system SwiftUI context menu with preview via `@expo/ui` (`ContextMenu.ios.tsx`); element and preview hosted with `RNHostView`.",
            "Web / Android: long-press (350 ms) → dimmed screen, lifted preview, RN menu.",
            "`orderMenuItems` moves destructive items last (unit-tested).",
          ],
          a11y: [
            "The items are also the element's accessibility actions (VoiceOver rotor), so no long-press is needed.",
          ],
          content: ["Commands, title case, ≤ 24 characters."],
          figma: {
            component: "Prompt Preset long-press menu (Patterns: Prompt Presets)",
            variants: [["State=Editing / menu", "ContextMenu items"]],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PromptCard: Story = {};
export const Open: Story = { args: { defaultOpen: true } };
