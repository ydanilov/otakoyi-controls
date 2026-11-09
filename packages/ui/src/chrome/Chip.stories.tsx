import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { Chip } from "./Status";

const meta = {
  title: "Chrome/Chip",
  component: Chip,
  args: { label: "1:42 left", tone: "primary" },
  argTypes: {
    tone: { control: "inline-radio", options: ["primary", "warning", "critical", "muted"] },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Flat status capsule — an LED and a short mono value — nested inside a card or dialog (pairing countdown, upload status).",
          use: ["A live, glanceable value with a status colour inside another surface."],
          avoid: [
            "Top-level or interactive elements — chips are flat and never pressable.",
            "A plain tag next to text — use Badge.",
          ],
          do: ["Use mono digits so countdowns don't jitter."],
          dont: ["Don't raise a chip: nested information is flat (ADR-013 addendum)."],
          anatomy: ["Flat capsule (bg muted)", "LED in the tone (lit, glows)", "Mono label"],
          behaviour: ["Static; the parent updates the label."],
          a11y: ["One element; the label is read. Tone is reinforced by the words."],
          content: ["≤ 16 characters, one line."],
          figma: {
            component: "Chip",
            node: "46:168",
            variants: [
              ["Tone=Primary", 'tone="primary"'],
              ["Tone=Warning", 'tone="warning"'],
              ["Tone=Critical", 'tone="critical"'],
              ["Tone=Muted", 'tone="muted"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Warning: Story = { args: { tone: "warning", label: "0:20 left" } };
export const Critical: Story = { args: { tone: "critical", label: "Expired" } };
export const Muted: Story = { args: { tone: "muted" } };
export const Tones: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {(["primary", "warning", "critical", "muted"] as const).map((t) => (
        <Chip key={t} tone={t} label="1:42 left" />
      ))}
    </View>
  ),
};
