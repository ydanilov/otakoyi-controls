import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { ReleaseNote } from "./Cards";

const meta = {
  title: "Containers/Release Note",
  component: ReleaseNote,
  args: { children: "Thumbstick control for live pults", latest: true },
  decorators: [
    (Story) => (
      <View style={{ width: 326 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose: "One change in a release, inside a Release Card (Settings → What's new).",
          use: ["Bullets of a Release Card."],
          avoid: ["Anywhere else — it is a list item, not a status."],
          do: ["Write what the client can now do, in plain words."],
          dont: ["Don't use internal names (schema types, ADR numbers)."],
          anatomy: ["LED bullet (lit for the latest release, unlit otherwise)", "Text (Body/SM)"],
          behaviour: ["Static."],
          a11y: ["Read as text; the LED is decorative."],
          content: ["≤ 60 characters; wraps."],
          figma: {
            component: "Release Note",
            node: "47:215",
            variants: [
              ["Latest=true", "latest"],
              ["Latest=false", "latest={false}"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof ReleaseNote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Latest: Story = {};
export const Older: Story = { args: { latest: false } };
