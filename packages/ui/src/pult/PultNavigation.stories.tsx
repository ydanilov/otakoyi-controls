import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { NavItem, TopBar } from "../chrome/Navigation";
import { ConnectionStatus } from "../chrome/Status";
import { Text } from "../components/ui/text";
import { ListCard, Section } from "../containers/Cards";
import { EdgeSwipe } from "../containers/EdgeSwipe";
import { Inspector } from "../containers/Inspector";
import {
  ClockCounterClockwiseIcon,
  LifebuoyIcon,
  QrCodeIcon,
  SignOutIcon,
  SlidersHorizontalIcon,
} from "../ds/icons";
import { presentationFor } from "../ds/logic";
import { ListRow } from "../forms/ListRow";
import { InstallationActions } from "../patterns/Installation";
import { componentDocs } from "../stories/docs";
import { SystemSheet } from "../stories/SystemSheet";
import { PultHeader } from "./PultHeader";

function Console({
  onSettings,
  onInstallation,
}: {
  onSettings: () => void;
  onInstallation: () => void;
}) {
  return (
    <View className="flex-1">
      <PultHeader
        connection="online"
        mode="control"
        onOpenSettings={onSettings}
        onOpenInstallation={onInstallation}
      />
      <View className="border-border m-4 flex-1 items-center justify-center rounded-lg border border-dashed">
        <Text className="text-muted-foreground text-sm">Pult (never scrolls)</Text>
      </View>
      <EdgeSwipe side="left" onOpen={onSettings} />
      <EdgeSwipe side="right" onOpen={onInstallation} />
    </View>
  );
}

function SettingsContent() {
  return (
    <View className="gap-4 pb-6">
      <TopBar title="Settings" />
      <View className="gap-1 px-4">
        <NavItem icon={SlidersHorizontalIcon} label="Control preferences" />
        <NavItem icon={QrCodeIcon} label="Pair another device" />
        <NavItem icon={ClockCounterClockwiseIcon} label="What's new" />
        <NavItem icon={LifebuoyIcon} label="Help" />
      </View>
      <View className="px-4">
        <ListCard>
          <ListRow
            title="Forget this installation"
            icon={SignOutIcon}
            trailing="destructive"
            onPress={() => {}}
          />
        </ListCard>
      </View>
    </View>
  );
}

function Demo({
  device,
  open,
}: {
  device: "phone" | "tablet";
  open: "none" | "settings" | "installation";
}) {
  const [surface, setSurface] = React.useState(open);
  const [modes, setModes] = React.useState<Record<string, boolean>>({ idle: false });
  React.useEffect(() => setSurface(open), [open]);
  const width = device === "phone" ? 390 : 1180;
  const p = surface === "none" ? null : presentationFor(surface, width);
  const console_ = (
    <Console
      onSettings={() => setSurface("settings")}
      onInstallation={() => setSurface("installation")}
    />
  );
  const installation = (
    <View className="gap-6 px-4">
      <ConnectionStatus state="online" />
      <InstallationActions
        modeState={modes}
        onModeChange={(id, on) => setModes((m) => ({ ...m, [id]: on }))}
      />
      <Section title="Pult">
        <ListCard>
          <ListRow title="Lobby controller" value="current" trailing="value" />
        </ListCard>
      </Section>
    </View>
  );
  if (p?.kind === "sheet")
    return (
      <SystemSheet kind={device === "phone" ? "phone-large" : "ipad-form-sheet"} behind={console_}>
        {surface === "settings" ? (
          <SettingsContent />
        ) : (
          <View className="pt-4">{installation}</View>
        )}
      </SystemSheet>
    );
  return (
    <View
      style={{
        width: device === "phone" ? 390 : 1024,
        height: device === "phone" ? 760 : 700,
        borderRadius: 24,
        overflow: "hidden",
      }}
      className="bg-background"
    >
      {console_}
      <Inspector
        open={p?.kind === "inspector"}
        onClose={() => setSurface("none")}
        title="Aurora Hall"
      >
        {installation}
      </Inspector>
    </View>
  );
}

const meta = {
  title: "Pult/Pult Navigation",
  component: Demo,
  args: { device: "phone", open: "none" },
  argTypes: {
    device: { control: "inline-radio", options: ["phone", "tablet"] },
    open: { control: "inline-radio", options: ["none", "settings", "installation"] },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "780px" },
      description: {
        component: componentDocs({
          purpose:
            "How the pult screen reaches Settings and Installation (ADR-013, Apple HIG). Composition of Pult Header, Edge Swipe, system sheets (stand-in) and the iPad Inspector.",
          use: ["Every pult screen."],
          avoid: ["Custom swipe drawers — removed in favour of system presentations."],
          do: [
            'Use `presentationFor(surface, width)` to pick the presentation and expo-router `presentation: "formSheet"` options for sheets.',
          ],
          dont: [
            "Don't put Take control in a sheet; it stays in the header banner.",
            "No appearance or brand switch in Settings — branding and theme mode are the studio's delivery (config `theme.mode`).",
          ],
          anatomy: [
            "Pult Header (Settings · Connection · Installation)",
            "Pult",
            "Settings: iPhone system sheet (large detent) / iPad form sheet over dimmed console",
            "Installation: iPhone system sheet / iPad 390 pt inspector, no dimming",
          ],
          behaviour: [
            "Right-edge swipe → Installation (phone and tablet); left-edge swipe → Settings (phone only).",
            "Sheets and the inspector may scroll; the pult never does.",
          ],
          a11y: ["Header buttons are the accessible path; edge swipes are hidden shortcuts."],
          content: [
            "Settings: control preferences, pairing QR, what's new, help, Forget this installation.",
          ],
          figma: { component: "Screens: Pult · phone / tablet (Settings, Installation)" },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PhonePult: Story = {};
export const PhoneSettings: Story = { args: { open: "settings" } };
export const PhoneInstallation: Story = { args: { open: "installation" } };
export const TabletSettings: Story = { args: { device: "tablet", open: "settings" } };
export const TabletInstallationInspector: Story = {
  args: { device: "tablet", open: "installation" },
};
