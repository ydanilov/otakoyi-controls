import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { Text } from "../components/ui/text";
import { componentDocs } from "../stories/docs";
import { Surface } from "./depth";

const meta = {
  title: "Foundations/Surface (depth)",
  component: Surface,
  args: { depth: "raised", radius: "lg", glow: false },
  argTypes: {
    depth: { control: "inline-radio", options: ["raised", "raisedSm", "inset", "pressed", "flat"] },
    glow: {
      control: "select",
      options: [false, "signal", "accent", "critical", "warning", "online", "studio"],
    },
    radius: { control: "inline-radio", options: ["sm", "md", "lg", "xl", "full"] },
  },
  render: (args) => (
    <Surface {...args} style={{ width: 160, height: 100 }} className="items-center justify-center">
      <Text className="text-muted-foreground font-mono text-xs">{String(args.depth)}</Text>
    </Surface>
  ),
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "The depth primitive every DS component is built on. Draws Figma's Neu/* and Glow/* effects from the `elevation` tokens as a CSS box-shadow (web and RN ≥ 0.76).",
          use: [
            "Raised: interactive elements, top-level cards and panels.",
            "Inset: active / pressed states and beds under controls (tracks, inputs, tab bars).",
            "Flat: information nested in a card (chips, stat tiles, icon wells).",
            "Pressed: a raised element under the finger.",
          ],
          avoid: ["Raising nested info.", "Glow on resting elements."],
          do: [
            "Use `glow` only for lit values (LEDs, active page dot, live tiles) and pressed buttons.",
          ],
          dont: [
            "Don't write shadows by hand — `boxShadow(theme, depth, glow)` is the only source.",
          ],
          anatomy: [
            "Default fill per depth (card / control track / muted)",
            "Shadow stack from tokens.json `elevation.effects`",
          ],
          behaviour: [
            "Colours switch with the theme mode (`elevation.dark` / `elevation.light`); glow follows the brand signal.",
          ],
          a11y: ["Depth is never the only signal of state — pair with colour, icon or text."],
          content: ["—"],
          figma: {
            component: "Effect styles Neu/Raised, Neu/Raised SM, Neu/Inset, Neu/Pressed, Glow/*",
            variants: [
              ["Neu/Raised", 'depth="raised"'],
              ["Neu/Raised SM", 'depth="raisedSm"'],
              ["Neu/Inset", 'depth="inset"'],
              ["Neu/Pressed", 'depth="pressed"'],
              ["(no effect)", 'depth="flat"'],
              [
                "Glow/Primary · Accent · Critical · Warning",
                'glow="signal" | "accent" | "critical" | "warning"',
              ],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Raised: Story = {};
export const Inset: Story = { args: { depth: "inset" } };
export const AllDepths: Story = {
  render: () => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 32, padding: 16 }}>
      {(["raised", "raisedSm", "inset", "pressed", "flat"] as const).map((d) => (
        <Surface
          key={d}
          depth={d}
          style={{ width: 140, height: 90 }}
          className="items-center justify-center"
        >
          <Text className="text-muted-foreground font-mono text-xs">{d}</Text>
        </Surface>
      ))}
      <Surface
        depth="pressed"
        glow="signal"
        style={{ width: 140, height: 90 }}
        className="items-center justify-center"
      >
        <Text className="text-muted-foreground font-mono text-xs">pressed + glow</Text>
      </Surface>
    </View>
  ),
};
