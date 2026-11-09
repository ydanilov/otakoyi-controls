import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { TrashIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { Toast } from "./Toast";

const meta = {
  title: "Chrome/Toast",
  component: Toast,
  args: {
    message: "Prompt deleted",
    icon: TrashIcon,
    actionLabel: "Undo",
    onAction: fn(),
    onDismiss: fn(),
    durationMs: 0,
  },
  argTypes: { icon: { control: false } },
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
            'A brief confirmation with an optional action — "Prompt deleted · Undo". Undoable actions happen at once and offer Undo here instead of asking first (ADR-013).',
          use: ["After delete, remove from screen, reset — anything that can be undone."],
          avoid: [
            "Errors that need a decision — inline errors or a Dialog.",
            "Status that lasts — the header banners.",
          ],
          do: ["Past tense, object first: “Prompt deleted”.", "One action at most (Undo)."],
          dont: ["Don't stack toasts; a new one replaces the old one."],
          anatomy: ["Raised SM bar", "Optional icon", "Message", "Action (text button)"],
          behaviour: [
            "Dismisses itself after `durationMs` (5 s, `TOAST_MS`); the action dismisses it too.",
            "Placed at the bottom above the home indicator by the screen.",
          ],
          a11y: [
            "Role `alert`, polite live region — announced once.",
            "Action ≥ 44 pt hit target. 5 s is enough to reach Undo with VoiceOver because the toast is announced and focusable.",
          ],
          content: ["Message ≤ 40 characters, 2 lines max; action one word."],
          figma: { component: "Toast", node: "96:372" },
        }),
      },
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithUndo: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Undo" }));
    await expect(args.onAction).toHaveBeenCalled();
    await expect(args.onDismiss).toHaveBeenCalled();
  },
};
export const MessageOnly: Story = {
  args: { message: "Image removed from screen", actionLabel: undefined, icon: undefined },
};
export const AutoDismiss: Story = { args: { durationMs: 5000 } };
