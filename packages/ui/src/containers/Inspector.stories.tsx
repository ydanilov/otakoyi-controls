import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, userEvent, waitFor } from "storybook/test";
import { Button } from "../chrome/Button";
import { ConnectionStatus } from "../chrome/Status";
import { Text } from "../components/ui/text";
import { ListRow } from "../forms/ListRow";
import { InstallationActions } from "../patterns/Installation";
import { SHEET } from "../ds/logic";
import { componentDocs } from "../stories/docs";
import { expectSheetLayout } from "../stories/layout";
import { ListCard, Section } from "./Cards";
import { Inspector } from "./Inspector";

function Demo({ startOpen = true }: { startOpen?: boolean }) {
  const [open, setOpen] = React.useState(startOpen);
  const [modes, setModes] = React.useState<Record<string, boolean>>({ idle: false, pause: false });
  return (
    <View style={{ height: 720, overflow: "hidden" }} className="bg-background">
      <View className="flex-1 items-center justify-center gap-3 pr-[390px]">
        <Text className="text-muted-foreground text-sm">Console stays live (no dimming)</Text>
        <Button label="Open Installation" variant="secondary" onPress={() => setOpen(true)} />
      </View>
      <Inspector open={open} onClose={() => setOpen(false)} title="Aurora Hall">
        <ConnectionStatus state="online" />
        <InstallationActions
          modeState={modes}
          onModeChange={(id, on) => setModes((m) => ({ ...m, [id]: on }))}
        />
        <Section title="Pult">
          <ListCard>
            <ListRow title="Lobby controller" value="current" trailing="value" />
            <ListRow title="VJ console" onPress={() => {}} />
          </ListCard>
        </Section>
      </Inspector>
    </View>
  );
}

const meta = {
  title: "Containers/Inspector",
  component: Demo,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "740px" },
      description: {
        component: componentDocs({
          purpose:
            "iPad Installation surface (ADR-013, HIG): a 390 pt inspector panel on the trailing side with a Close ×. It never dims the console, so the operator keeps playing.",
          use: [
            "Installation on iPad: name and status, pult switcher, quick actions, modes, activity.",
          ],
          avoid: [
            'iPhone — the same content goes into a system sheet (`presentationFor("installation", width)`).',
            "Settings — form sheet.",
          ],
          do: [
            "Open from the header's Installation button; the right-edge swipe is only a shortcut.",
          ],
          dont: ["Don't dim or block the pult behind it."],
          anatomy: [
            "Panel: raised, full height, 390 pt, background colour",
            "Title + Close × (Icon Button)",
            "Scrolling body (slot)",
          ],
          behaviour: [
            "Slides in from the trailing edge in `motion.duration.base`; Reduce Motion jumps.",
            "The body may scroll; the pult never does.",
          ],
          a11y: ["Close button labelled “Close <title>”; title has role `header`."],
          content: ["Title = installation name, ≤ 24 characters."],
          figma: {
            component: "Installation inspector (iPad screens)",
            variants: [
              ["iPad · Installation", "Inspector"],
              ["Client · Template › Tablet / 10 Installation (inspector) 99:7287", "Inspector"],
              ["iPhone · Installation", "system sheet"],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma Tablet / 10 Installation (inspector) 99:7287: content 24 pt down, Close × clear of it. */
export const Open: Story = {
  globals: { viewport: { value: "tablet" } },
  play: async ({ canvasElement }) =>
    expectSheetLayout(canvasElement, { gap: SHEET.inspector.content, floating: true }),
};
export const Closed: Story = {
  args: { startOpen: false },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Open Installation" }));
    await waitFor(async () =>
      expect(await canvas.findByRole("button", { name: "Close Aurora Hall" })).toBeTruthy(),
    );
  },
};
