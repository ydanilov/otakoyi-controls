import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { Text } from "../components/ui/text";
import { componentDocs } from "../stories/docs";
import { Glyph } from "./Glyph";
import * as Icons from "./icons";

const ALL = Object.entries(Icons).filter(([k]) => k.endsWith("Icon")) as Array<
  [string, Icons.PhosphorIcon]
>;

const meta = {
  title: "Foundations/Icons (Glyph)",
  component: Glyph,
  args: { icon: Icons.GearSixIcon, tone: "foreground", size: 24 },
  argTypes: {
    icon: { control: false },
    tone: {
      control: "select",
      options: [
        "foreground",
        "muted",
        "signal",
        "accent",
        "onPrimary",
        "critical",
        "warning",
        "online",
        "offline",
        "studio",
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Phosphor Regular icons (Figma `Icon/<name>`) coloured by a theme tone. The set lives in `ds/icons.ts`, one import per icon.",
          use: ["Every glyph in chrome and DS components."],
          avoid: ["Lucide icons in new code (the Reusables primitives still use them internally)."],
          do: ["Add the icon to `ds/icons.ts` and to Figma before using it."],
          dont: ["Don't pass hex colours — use a tone (or a theme colour)."],
          anatomy: ["24 × 24 Phosphor glyph, weight regular"],
          behaviour: ["Colour from `toneColor(theme, tone)`; follows brand and mode."],
          a11y: ["Decorative by default; pass `label` when the icon stands alone."],
          content: [
            "Icon names = Figma names in PascalCase + Icon (`Icon/gear-six` → `GearSixIcon`).",
          ],
          figma: { component: "Icon/<name>", node: "23:18" },
        }),
      },
    },
  },
} satisfies Meta<typeof Glyph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Library: Story = {
  render: (args) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, maxWidth: 720 }}>
      {ALL.map(([name, icon]) => (
        <View key={name} style={{ width: 120, alignItems: "center", gap: 6, paddingVertical: 8 }}>
          <Glyph icon={icon} tone={args.tone} size={24} />
          <Text className="text-muted-foreground font-mono text-[10px]">
            {name.replace(/Icon$/, "")}
          </Text>
        </View>
      ))}
    </View>
  ),
};
