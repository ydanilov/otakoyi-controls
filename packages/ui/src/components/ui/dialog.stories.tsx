import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Text } from "./text";

const meta = {
  title: "Primitives (Reusables)/Dialog",
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "Dialog",
          purpose: "shadcn dialog on `@rn-primitives/dialog` (portal to PortalHost).",
          prefer: "the DS `Dialog` content inside the native sheet / form sheet",
          a11y: ["Focus-trapped modal; close button labelled Close."],
        }),
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Text>Open dialog</Text>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Primitive dialog</DialogTitle>
          <DialogDescription>Use the DS Dialog in product UI.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button>
            <Text>OK</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
