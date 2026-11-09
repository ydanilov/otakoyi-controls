import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { expect, fn, userEvent } from "storybook/test";
import { Button } from "../chrome/Button";
import { Chip } from "../chrome/Status";
import { QrCodeIcon } from "../ds/icons";
import { componentDocs } from "../stories/docs";
import { SystemSheet } from "../stories/SystemSheet";
import { Dialog } from "./Dialog";

function Demo({
  kind,
  onHide,
  onDone,
}: {
  kind: "phone-medium" | "ipad-form-sheet";
  onHide: () => void;
  onDone: () => void;
}) {
  return (
    <SystemSheet kind={kind}>
      <Dialog
        icon={QrCodeIcon}
        title="QR is on the installation screen"
        description="Scan it with the new phone or tablet. It hides by itself in 2 minutes."
        actions={
          <>
            <Button label="Hide QR" variant="secondary" onPress={onHide} className="flex-1" />
            <Button label="Done" onPress={onDone} className="flex-1" />
          </>
        }
      >
        <Chip label="1:42 left" />
      </Dialog>
    </SystemSheet>
  );
}

const meta = {
  title: "Containers/Dialog",
  component: Demo,
  args: { kind: "phone-medium", onHide: fn(), onDone: fn() },
  argTypes: { kind: { control: "inline-radio", options: ["phone-medium", "ipad-form-sheet"] } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "Content of a focused task or confirmation over the pult: pairing QR, what's new, confirming actions that cannot be undone. Content only — no background, grabber, scrim or home indicator: the system presentation provides those (ADR-013, HIG).",
          use: ["Short tasks that must finish before going back to the pult."],
          avoid: [
            "Confirming undoable actions — act at once and offer Undo in a Toast.",
            "Long settings — the Settings sheet.",
            "Critical installation actions — Quick Action with hold.",
          ],
          do: [
            "Cancel / secondary leading, one prominent action trailing.",
            'Present the route with `presentationFor("dialog", width).options` (expo-router `presentation: "formSheet"`).',
          ],
          dont: [
            "Don't draw your own sheet, grabber or blur — the system does.",
            "Don't open a dialog from a dialog.",
          ],
          anatomy: [
            "Icon well (raised SM, lit icon)",
            "Title (Heading/XL) + description",
            "Body slot (children)",
            "Actions slot",
          ],
          behaviour: [
            "iPhone: system sheet at the medium detent (can be dragged to large); the system draws the grabber.",
            "iPad: form sheet over the dimmed console.",
            "Body scrolls if taller than the detent.",
            "The frame in these stories is a stand-in (`stories/SystemSheet.tsx`); native sheets cannot render on the web.",
          ],
          a11y: ["`accessibilityViewIsModal`; title has role `header`; buttons ≥ 40 pt high."],
          content: ["Title ≤ 40 characters (2 lines). Description ≤ 120 characters."],
          figma: {
            component: "Dialog",
            node: "47:208",
            variants: [
              ["Container=Sheet", "content in the iPhone sheet (presentationFor dialog, phone)"],
              [
                "Container=Modal",
                "content in the iPad form sheet (presentationFor dialog, tablet)",
              ],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IPhoneSheet: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Done" }));
    await expect(args.onDone).toHaveBeenCalled();
  },
};
export const IPadFormSheet: Story = { args: { kind: "ipad-form-sheet" } };
