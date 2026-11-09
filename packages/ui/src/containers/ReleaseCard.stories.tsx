import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { ReleaseCard, ReleaseNote } from "./Cards";

const meta = {
  title: "Containers/Release Card",
  component: ReleaseCard,
  args: { version: "v0.3.0", date: "21 Oct 2026", latest: true, children: null },
  decorators: [
    (Story) => (
      <View style={{ width: 358 }}>
        <Story />
      </View>
    ),
  ],
  render: (args) => (
    <ReleaseCard {...args}>
      <ReleaseNote latest={args.latest}>Thumbstick control for live pults</ReleaseNote>
      <ReleaseNote latest={args.latest}>Hue knobs follow the colour you pick</ReleaseNote>
    </ReleaseCard>
  ),
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Slot container: one app release in What's new — version, NEW badge for the latest, date, and its notes.",
          use: ["Settings → What's new, newest first."],
          avoid: ["Config (pult) revisions — those are not app releases."],
          do: ["Mark only the newest card `latest`."],
          dont: ["Don't list more than ~5 notes per card."],
          anatomy: [
            "Raised SM card",
            "Version (Heading/MD) + NEW badge + date",
            "Notes slot (Release Notes)",
          ],
          behaviour: ["Static."],
          a11y: ["Read in order: version, NEW, date, notes."],
          content: ["Version as `vX.Y.Z`; date as `21 Oct 2026`."],
          figma: {
            component: "Release Card",
            node: "47:216",
            variants: [["slot", "children (Release Notes)"]],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ReleaseCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Latest: Story = {};
export const Older: Story = { args: { version: "v0.2.0", date: "2 Oct 2026", latest: false } };
