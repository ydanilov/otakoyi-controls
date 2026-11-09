import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { primitiveDocs } from "../../stories/docs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";
import { Text } from "./text";

const meta = {
  title: "Primitives (Reusables)/Alert Dialog",
  component: AlertDialog,
  parameters: {
    docs: {
      description: {
        component: primitiveDocs({
          name: "AlertDialog",
          purpose: "shadcn alert dialog: a blocking confirmation with Cancel / Action.",
          prefer:
            "the DS `Dialog` with `dismissable={false}`, or Quick Action hold for critical actions",
          a11y: ["Role alertdialog; focus moves to the dialog."],
        }),
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Text>Forget</Text>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Forget this installation?</AlertDialogTitle>
          <AlertDialogDescription>
            You will need to scan its pairing QR again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>Cancel</Text>
          </AlertDialogCancel>
          <AlertDialogAction>
            <Text>Forget</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};
