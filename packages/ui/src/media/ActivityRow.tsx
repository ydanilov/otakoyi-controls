import { View } from "react-native";
import { Text } from "../components/ui/text";
import { Glyph } from "../ds/Glyph";
import { ArrowClockwiseIcon, BroadcastIcon, LockSimpleIcon, WifiSlashIcon } from "../ds/icons";
import { StatusLed } from "../ds/Led";

export type ActivityKind = "control" | "restart" | "error" | "studio";

const KIND = {
  control: { tone: "online", icon: LockSimpleIcon, name: "Control" },
  restart: { tone: "warning", icon: ArrowClockwiseIcon, name: "Restart" },
  error: { tone: "critical", icon: WifiSlashIcon, name: "Error" },
  studio: { tone: "studio", icon: BroadcastIcon, name: "Studio" },
} as const;

/**
 * Figma `Activity Row`: one event in the installation's activity log — who took control,
 * restarts, lost connections, studio sessions. LED colour = status token of the kind.
 */
export function ActivityRow({
  kind,
  text,
  time,
}: {
  kind: ActivityKind;
  text: string;
  /** Local time, e.g. "18:42". */
  time: string;
}) {
  const k = KIND[kind];
  return (
    <View
      className="min-h-touch flex-row items-center gap-3 px-4 py-2.5"
      accessible
      accessibilityLabel={`${k.name}: ${text}, ${time}`}
    >
      <StatusLed tone={k.tone} size={7} />
      <Glyph icon={k.icon} tone="muted" size={16} />
      <Text className="text-foreground flex-1 text-sm" numberOfLines={2}>
        {text}
      </Text>
      <Text className="text-muted-foreground font-mono text-xs">{time}</Text>
    </View>
  );
}
