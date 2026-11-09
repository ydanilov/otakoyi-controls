import * as React from "react";
import { View } from "react-native";
import { Text } from "@osc/ui/components/ui/text";
import { BellIcon } from "../ds/icons";
import { ListRow } from "../forms/ListRow";

/** What the Status notifications row shows (the decision is the app's: apps/mobile notifications.ts). */
export type StatusNotificationsState = "off" | "on" | "asking" | "denied" | "unavailable";

const TITLE_INSET = 50;

const CAPTION: Partial<Record<StatusNotificationsState, string>> = {
  denied:
    "Notifications are turned off for this app. Allow them in the system Settings, then try again.",
  unavailable: "Not available in the browser. Use the app for status notifications.",
};

/**
 * Settings › Control preferences › **Status notifications** (Figma List Row `Trailing=Switch`): a
 * switch row plus, when the switch cannot be on, a short caption under it. `asking` keeps the switch
 * on and disabled while the system permission prompt is up; `denied` flips it back off and explains;
 * `unavailable` (web pult) is disabled with a caption. Lives inside a List Card.
 */
export function StatusNotificationsRow({
  state,
  onChange,
}: {
  state: StatusNotificationsState;
  onChange: (on: boolean) => void;
}) {
  const caption = CAPTION[state];
  return (
    <>
      <ListRow
        icon={BellIcon}
        title="Status notifications"
        subtitle={state === "asking" ? "Asking for permission…" : undefined}
        trailing="switch"
        checked={state === "on" || state === "asking"}
        onCheckedChange={onChange}
        disabled={state === "asking" || state === "unavailable"}
      />
      {caption ? (
        // Aligned with the title: row padding 16 + icon 20 + gap 14 (the List Card separator inset).
        <View
          className="pb-3 pr-4"
          style={{ paddingLeft: TITLE_INSET }}
          testID="status-notifications-caption"
        >
          <Text className="text-muted-foreground text-xs leading-4" accessibilityRole="text">
            {caption}
          </Text>
        </View>
      ) : null}
    </>
  );
}
