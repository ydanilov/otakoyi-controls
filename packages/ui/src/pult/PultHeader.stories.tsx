import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import { expect, fn, userEvent } from "storybook/test";
import { BrandMark } from "../chrome/Brand";
import { componentDocs } from "../stories/docs";
import { PultHeader } from "./PultHeader";

const meta = {
  title: "Pult/Pult Header",
  component: PultHeader,
  args: {
    connection: "online",
    mode: "control",
    onRequestControl: fn(),
    onOpenSettings: fn(),
    onOpenInstallation: fn(),
  },
  argTypes: {
    connection: { control: "inline-radio", options: ["online", "connecting", "offline"] },
    mode: {
      control: "inline-radio",
      options: ["control", "view", "studio-has-control", "offline"],
    },
    logo: { control: false },
    switcher: { control: false },
  },
  decorators: [
    (Story) => (
      <View style={{ maxWidth: 820 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "The minimal header above every pult (ADR-013, Apple HIG): leading Settings button, connection, trailing Installation button, and the view-only / studio banners.",
          use: ["Top of the pult screen, on phone and tablet."],
          avoid: [
            "Settings or installation actions — they live in the Settings / Installation surfaces.",
          ],
          do: ["Keep it to one line in Control mode so the pult gets the height."],
          dont: ["Don't add buttons beyond Settings, Installation and Take control."],
          anatomy: [
            "Settings Icon Button (gear, leading)",
            "Optional logo / installation name (tablet) / pult switcher slots",
            "Connection",
            "Installation Icon Button (sliders, trailing)",
            "Status Banner (View / Studio)",
          ],
          behaviour: [
            "Settings opens the Settings sheet (iPhone: system sheet, large detent; iPad: form sheet). Installation opens a sheet on iPhone and the 390 pt Inspector on iPad (`presentationFor`). Edge swipes are only shortcuts (`EdgeSwipe`).",
            "`mode` comes from the store (lease): control → no banner; view → View only + Take control; studio-has-control → studio banner.",
          ],
          a11y: [
            "Buttons labelled “Settings” and “Installation” (44 pt).",
            "Banners are polite live regions; Take control is a button.",
          ],
          content: ["Name ≤ 24 characters; truncates."],
          figma: {
            component: "Pult Header",
            node: "10:76",
            variants: [
              ["Mode=Control", 'mode="control"'],
              ["Mode=View", 'mode="view"'],
              ["Mode=Studio", 'mode="studio-has-control"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof PultHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Control: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Settings" }));
    await userEvent.click(await canvas.findByRole("button", { name: "Installation" }));
    await expect(args.onOpenSettings).toHaveBeenCalled();
    await expect(args.onOpenInstallation).toHaveBeenCalled();
  },
};
export const ViewOnly: Story = { args: { mode: "view" } };
export const Studio: Story = { args: { mode: "studio-has-control" } };
export const Offline: Story = { args: { connection: "offline", mode: "offline" } };
export const TabletWithName: Story = {
  args: { name: "Aurora Hall", logo: <BrandMark size="sm" /> },
};
