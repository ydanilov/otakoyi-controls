import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { ConnectionStatus, StatTile } from "../chrome/Status";
import { Text } from "../components/ui/text";
import {
  ClockCounterClockwiseIcon,
  DeviceMobileIcon,
  GearSixIcon,
  InfoIcon,
  LifebuoyIcon,
  MonitorIcon,
  QrCodeIcon,
  ScanIcon,
  VibrateIcon,
} from "../ds/icons";
import { SHEET } from "../ds/logic";
import { ListRow } from "../forms/ListRow";
import { InstallationActions } from "../patterns/Installation";
import { componentDocs } from "../stories/docs";
import { expectSheetLayout } from "../stories/layout";
import { ListCard, Section } from "./Cards";
import { SheetScaffold, SheetSurface, SheetToolbar } from "./Sheet";

/** The iPhone sheet's frame in Figma (Sheet - iPhone › Frame, 402 × 812 below the status bar). */
function PhoneSheet({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ width: 402, height: 812, overflow: "hidden" }}>
      <SheetSurface>{children}</SheetSurface>
    </View>
  );
}

function SettingsBody() {
  const [prefs, setPrefs] = React.useState({ haptics: true, awake: true, notes: false });
  return (
    <>
      <Section title="Pairing">
        <ListCard>
          <ListRow icon={QrCodeIcon} title="Show pairing QR on installation" onPress={() => {}} />
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
            icon={InfoIcon}
            title="Status notifications"
            trailing="switch"
            checked={prefs.notes}
            onCheckedChange={(v) => setPrefs((p) => ({ ...p, notes: v }))}
          />
        </ListCard>
      </Section>
      <Section title="Developer">
        <ListCard>
          <ListRow icon={InfoIcon} title="Debug" value="Bridge, OSC log" onPress={() => {}} />
        </ListCard>
      </Section>
      <Section title="About">
        <ListCard>
          <ListRow
            icon={ClockCounterClockwiseIcon}
            title="What's new"
            value="v0.1.0"
            onPress={() => {}}
          />
          <ListRow icon={LifebuoyIcon} title="Help & support" onPress={() => {}} />
          <ListRow icon={InfoIcon} title="App version" trailing="value" value="0.1.0 (1)" />
        </ListCard>
      </Section>
      <Section title="Account">
        <ListCard>
          <ListRow
            icon={GearSixIcon}
            title="Forget this installation"
            trailing="destructive"
            onPress={() => {}}
          />
        </ListCard>
      </Section>
    </>
  );
}

function InstallationBody() {
  const [modes, setModes] = React.useState<Record<string, boolean>>({ idle: false, pause: false });
  return (
    <View className="gap-6">
      <View className="gap-3 pr-14">
        <Text className="text-muted-foreground tracking-overline text-xs font-medium uppercase">
          Installation
        </Text>
        <Text className="text-foreground text-xl font-semibold" numberOfLines={1}>
          Demo installation
        </Text>
        <ConnectionStatus state="online" />
      </View>
      <View className="flex-row gap-3">
        {[
          ["State", "Online"],
          ["FPS", "60.0"],
          ["Devices", "2"],
          ["Uptime", "3 h"],
        ].map(([label, value]) => (
          <View key={label} className="flex-1">
            <StatTile label={label!} value={value!} block />
          </View>
        ))}
      </View>
      <Section title="Pults">
        <ListCard>
          <ListRow icon={MonitorIcon} title="Lobby wall" value="current" onPress={() => {}} />
          <ListRow icon={MonitorIcon} title="VJ console" value="4 screens" onPress={() => {}} />
          <ListRow icon={MonitorIcon} title="Lighting cues" value="2 screens" onPress={() => {}} />
        </ListCard>
      </Section>
      <InstallationActions
        modeState={modes}
        onModeChange={(id, on) => setModes((m) => ({ ...m, [id]: on }))}
      />
    </View>
  );
}

function Demo({ screen }: { screen: "settings" | "installation" | "pushed" }) {
  const title =
    screen === "settings" ? "Settings" : screen === "installation" ? "Installation" : "Debug";
  return (
    <PhoneSheet>
      <SheetScaffold
        header={
          <SheetToolbar
            title={title}
            onClose={() => {}}
            onBack={screen === "pushed" ? () => {} : undefined}
          />
        }
        contentContainerClassName={
          screen === "settings"
            ? "gap-6 px-4 pb-10 pt-3"
            : screen === "installation"
              ? "px-4 pb-10 pt-4"
              : "gap-3 px-5 pb-10 pt-3"
        }
      >
        {screen === "settings" ? (
          <SettingsBody />
        ) : screen === "installation" ? (
          <InstallationBody />
        ) : (
          <Text className="text-foreground text-md leading-6">
            A pushed page: Back leading, Close trailing, the body below the toolbar.
          </Text>
        )}
      </SheetScaffold>
    </PhoneSheet>
  );
}

const meta = {
  title: "Containers/Sheet",
  component: Demo,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "830px" },
      description: {
        component: componentDocs({
          purpose:
            "The layout every sheet, drawer and inspector uses: a header, then a scrolling body that starts below it — the header never floats over the content (ADR-013).",
          use: [
            "iPhone Settings and Installation sheets (`SheetSurface` + `SheetScaffold` + `SheetToolbar`).",
            "iPad Settings drawer (`DrawerHeader` as the header) and Installation inspector (floating Close ×).",
          ],
          avoid: ["The pult — it never scrolls vertically (ADR-006)."],
          do: [
            "Take the content's top padding from the Figma frame: 12 pt (Settings), 16 pt (Installation), 8 pt (drawer).",
            "Every new sheet screen exists as a Figma frame first; its story calls `expectSheetLayout()`.",
          ],
          dont: [
            "Don't position a header absolutely over a ScrollView, and don't add top insets to the body.",
            "Don't put a bare ScrollView next to a layout-only header in a sheet route — use the scaffold.",
          ],
          anatomy: [
            `Toolbar (iPhone): ${SHEET.toolbar.top} pt top, ${SHEET.toolbar.row} pt row (Close × leading, centred title; pushed: Back leading, Close trailing), ${SHEET.toolbar.bottom} pt bottom = ${SHEET.toolbar.height} pt`,
            "Body: clips, scrolls, no system content insets",
          ],
          behaviour: [
            "Header and body are real native views (`collapsable={false}`); the ScrollView is inside the body, so a native re-frame of the ScrollView (iOS formSheet) can never move it under the header.",
            "Layout sensor: `pnpm test-storybook` fails if the header overlaps the body's content or content is cut off at the side (every story, dark and light).",
          ],
          a11y: [
            "Close × labelled “Close <title>”; Back labelled “Back”; the title has role `header`.",
          ],
          content: ["Title one or two words; it truncates on one line."],
          figma: {
            component: "Sheet - iPhone › Toolbar - Top - iPhone (Client · Template)",
            node: "104:7979",
            variants: [
              ["Phone / 07 Settings (sheet) 104:7979", 'screen="settings"'],
              ["Phone / 10 Installation (sheet) 104:8937", 'screen="installation"'],
              ["Toolbar with Back (pushed page)", 'screen="pushed"'],
            ],
          },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma Phone / 07 Settings (sheet) 104:7979: toolbar 70 pt, first section 12 pt below. */
export const PhoneSettings: Story = {
  args: { screen: "settings" },
  globals: { viewport: { value: "phone" } },
  play: async ({ canvasElement }) =>
    expectSheetLayout(canvasElement, {
      headerHeight: SHEET.toolbar.height,
      gap: SHEET.content.settings,
    }),
};

/** Figma Phone / 10 Installation (sheet) 104:8937: toolbar 70 pt, "INSTALLATION" 16 pt below. */
export const PhoneInstallation: Story = {
  args: { screen: "installation" },
  globals: { viewport: { value: "phone" } },
  play: async ({ canvasElement }) =>
    expectSheetLayout(canvasElement, {
      headerHeight: SHEET.toolbar.height,
      gap: SHEET.content.installation,
    }),
};

export const PushedPage: Story = {
  args: { screen: "pushed" },
  globals: { viewport: { value: "phone" } },
  play: async ({ canvasElement }) =>
    expectSheetLayout(canvasElement, { headerHeight: SHEET.toolbar.height }),
};
