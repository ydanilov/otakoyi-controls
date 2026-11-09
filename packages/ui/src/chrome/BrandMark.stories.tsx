import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { componentDocs } from "../stories/docs";
import { BrandMark } from "./Brand";

const meta = {
  title: "Chrome/Brand Mark",
  component: BrandMark,
  args: { size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "The Otakoyi knob mark: Connect screen and About. A raised dial with a lit arc over the 240° knob travel.",
          use: ["App-level branding before an installation is loaded."],
          avoid: ["Client pults — the client's logo comes from the config theme."],
          do: ["Use MD on Connect, LG in About, SM in headers."],
          dont: ["Don't recolour by hand; it follows the brand signal like the knobs do."],
          anatomy: [
            "Track arc (control track)",
            "Lit arc (control/signal)",
            "Raised knob (MD, LG)",
            "Indicator dot",
          ],
          behaviour: ["Static. Uses react-native-svg, so it renders before Skia is ready."],
          a11y: ["Role `image`, label “Otakoyi”."],
          content: ["No text."],
          figma: {
            component: "Brand Mark",
            node: "46:133",
            variants: [
              ["Size=SM", 'size="sm"'],
              ["Size=MD", 'size="md"'],
              ["Size=LG", 'size="lg"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {};
export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 32, alignItems: "center" }}>
      <BrandMark size="sm" />
      <BrandMark size="md" />
      <BrandMark size="lg" />
    </View>
  ),
};
