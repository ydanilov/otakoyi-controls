import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent, waitFor } from "storybook/test";
import { Button } from "../chrome/Button";
import { Text } from "../components/ui/text";
import { BellIcon, DeviceMobileIcon, QrCodeIcon, ScanIcon, VibrateIcon } from "../ds/icons";
import { ListRow } from "../forms/ListRow";
import { SHEET } from "../ds/logic";
import { componentDocs } from "../stories/docs";
import { expectSheetLayout } from "../stories/layout";
import { ListCard, Section } from "./Cards";
import { Drawer, DrawerHeader } from "./Drawer";
import { SheetScaffold } from "./Sheet";

function Demo({ startOpen = true }: { startOpen?: boolean }) {
  const [open, setOpen] = React.useState(startOpen);
  const [prefs, setPrefs] = React.useState({ haptics: true, awake: true, notes: true });
  return (
    <View style={{ height: 760, overflow: "hidden" }} className="bg-background">
      <View className="flex-1 items-center justify-center gap-3">
        <Text className="text-muted-foreground text-sm">
          The pult (dimmed while Settings is open)
        </Text>
        <Button label="Open Settings" variant="secondary" onPress={() => setOpen(true)} />
      </View>
      <Drawer open={open} onClose={() => setOpen(false)} label="Settings">
        <SheetScaffold
          header={<DrawerHeader title="Settings" onClose={() => setOpen(false)} />}
          contentContainerClassName="gap-6 px-4 pb-10 pt-2"
        >
          <Section title="Pairing">
            <ListCard>
              <ListRow
                icon={QrCodeIcon}
                title="Show pairing QR on installation"
                onPress={() => {}}
              />
              <ListRow icon={ScanIcon} title="Pair another installation" onPress={() => {}} />
            </ListCard>
          </Section>
          <Section title="Control preferences">
            <ListCard>
              <ListRow
                icon={VibrateIcon}
                title="Haptics"
                trailing="switch"
                checked={prefs.haptics}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, haptics: v }))}
              />
              <ListRow
                icon={DeviceMobileIcon}
                title="Keep screen awake"
                trailing="switch"
                checked={prefs.awake}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, awake: v }))}
              />
              <ListRow
                icon={BellIcon}
                title="Status notifications"
                trailing="switch"
                checked={prefs.notes}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, notes: v }))}
              />
            </ListCard>
          </Section>
        </SheetScaffold>
      </Drawer>
    </View>
  );
}

const meta = {
  title: "Containers/Drawer",
  component: Demo,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "780px" },
      description: {
        component: componentDocs({
          purpose:
            "iPad Settings surface (ADR-013): a floating drawer from the leading edge over the dimmed pult.",
          use: ['Settings on iPad (`presentationFor("settings", width)` → `drawer`).'],
          avoid: [
            "iPhone — Settings is the system sheet there.",
            "Installation — the trailing inspector (no dimming).",
          ],
          do: ["Open it from the header's Settings button."],
          dont: ["Don't put pult controls in it.", "Don't make it full height or edge to edge."],
          anatomy: [
            "Dim over the pult (overlay colour, 55 %)",
            "Panel: 400 pt wide, 12 pt in from the left and the bottom, top under the status bar, radius 28, dark fill (control track)",
            "Drawer Header: large title (28 semibold) + round close button",
            "Scrolling body (`SheetScaffold`): inset-grouped Sections of List Cards, 8 pt below the header",
          ],
          behaviour: [
            "Slides in from the left in `motion.duration.base`; Reduce Motion jumps.",
            "Closes on the close button, a tap on the dim, or a swipe to the left (80 pt or fast — `drawerCloses`); it follows the finger while swiped.",
          ],
          a11y: [
            "Modal for VoiceOver; the dim is a button “Close Settings”; the title is a header.",
          ],
          content: ["Title one word (“Settings”)."],
          figma: {
            component:
              "Settings drawer (Demo › Tablet / 04 Settings, Client · Template › Tablet / 07)",
            node: "106:209",
            variants: [
              ["Tablet / 04 Settings (left drawer) 106:209", "Drawer + DrawerHeader"],
              [
                "Client · Template › Tablet / 07 Settings (left drawer) 99:7941",
                "Drawer + DrawerHeader",
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

export const Open: Story = {
  globals: { viewport: { value: "tablet" } },
  play: async ({ canvas, canvasElement }) => {
    await expect(await canvas.findByTestId("drawer")).toBeTruthy();
    // Figma Tablet / 07 Settings (left drawer) 99:7941: 72 pt header, first section 8 pt below.
    await expectSheetLayout(canvasElement, {
      headerHeight: SHEET.drawer.header,
      gap: SHEET.drawer.content,
    });
    // A tap on the dim closes it.
    await userEvent.click(canvas.getByTestId("drawer-dim"));
    await waitFor(() => expect(canvas.queryByTestId("drawer")).toBeNull(), { timeout: 2000 });
  },
};
export const Closed: Story = { args: { startOpen: false } };
