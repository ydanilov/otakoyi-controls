import * as React from "react";
import { View } from "react-native";
import { Text } from "../components/ui/text";
import { Surface } from "../ds/depth";
import { useTheme } from "../theme/ThemeProvider";

export interface OscLogLine {
  key: string | number;
  /** `10:21:04.218` */
  time: string;
  dir: "out" | "in";
  address: string;
  /** Arguments as text, e.g. `0.600`, `1 2.0`. */
  value: string;
}

const MONO = "font-mono text-[11px] leading-[15px]";

/**
 * Figma `OSC Log` (128:486): the Debug page's live log, a raised card of mono 11 pt lines —
 * timestamp, arrow, address, value. → sent (signal colour), ← received (studio colour). Lines are
 * drawn in the order given: pass them newest first.
 */
export function OscLog({ lines, max = 50 }: { lines: OscLogLine[]; max?: number }) {
  const t = useTheme();
  const shown = lines.slice(0, max);
  return (
    <Surface
      depth="raised"
      className="gap-1.5 px-4 py-3.5"
      accessibilityRole="list"
      accessibilityLabel="OSC log"
      testID="osc-log"
    >
      {shown.length === 0 ? (
        <Text className={`${MONO} text-muted-foreground`}>No OSC yet</Text>
      ) : (
        shown.map((l) => (
          <View
            key={l.key}
            className="flex-row gap-2"
            accessible
            accessibilityLabel={`${l.time} ${l.dir === "out" ? "sent" : "received"} ${l.address} ${l.value}`}
          >
            <Text className={`${MONO} text-muted-foreground`}>{l.time}</Text>
            <Text
              className={MONO}
              style={{ color: l.dir === "out" ? t.control.fill : t.status.studio }}
            >
              {l.dir === "out" ? "→" : "←"}
            </Text>
            <Text className={`${MONO} text-foreground flex-1`} numberOfLines={1}>
              {l.address}
            </Text>
            <Text className={`${MONO} text-foreground`} numberOfLines={1}>
              {l.value}
            </Text>
          </View>
        ))
      )}
    </Surface>
  );
}
