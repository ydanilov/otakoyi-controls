import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { componentDocs } from "../stories/docs";
import { StatusBanner } from "./Status";

const meta = {
  title: "Chrome/Status Banner",
  component: StatusBanner,
  args: { mode: "view", onTakeControl: fn() },
  argTypes: { mode: { control: "inline-radio", options: ["view", "studio"] } },
  decorators: [
    (Story) => (
      <View style={{ maxWidth: 560 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Tells this device it is not in control (ADR-005 lease, ADR-013 addendum). Part of the Pult Header.",
          use: [
            "View: another device holds the lease — offers Take control.",
            "Studio: the studio is controlling remotely — no take-over.",
          ],
          avoid: ["Connection problems — the Connection pill covers those."],
          do: [
            "Show on every pult screen while the state lasts (Take control is never inside a sheet).",
          ],
          dont: ["Don't hide the banner behind a sheet or dialog."],
          anatomy: [
            "View: inset bed + text + Primary SM button",
            "Studio: solid studio-colour bar + text",
          ],
          behaviour: [
            "`onTakeControl` requests the lease from the bridge; the banner disappears when granted.",
            "The studio always wins the lease; no button in studio mode.",
          ],
          a11y: [
            "Role `alert`, polite live region — announced when it appears.",
            "Take control button ≥ 44 pt hit target via slop.",
          ],
          content: ["Fixed copy; translations must fit two lines on a 360 pt phone."],
          figma: {
            component: "Pult Header (banner part)",
            node: "10:76",
            variants: [
              ["Mode=View", 'mode="view"'],
              ["Mode=Studio", 'mode="studio"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof StatusBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ViewOnly: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Take control" }));
    await expect(args.onTakeControl).toHaveBeenCalled();
  },
};
export const Studio: Story = { args: { mode: "studio" } };
