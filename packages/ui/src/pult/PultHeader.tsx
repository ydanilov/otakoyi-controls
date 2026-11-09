import * as React from "react";
import { View } from "react-native";
import { IconButton } from "../chrome/Button";
import { ConnectionStatus, StatusBanner, type Connection } from "../chrome/Status";
import { GearSixIcon, SlidersHorizontalIcon } from "../ds/icons";
import { Text } from "@osc/ui/components/ui/text";
import { cn } from "@osc/ui/lib/utils";
import type { ControlMode } from "./store";

export type { Connection };

/**
 * Header above every pult (Figma `Pult Header`, Mode=Control | View | Studio; ADR-013, Apple HIG):
 * leading **Settings** button, connection status and trailing **Installation** button; while this
 * device is not in control, the view-only (Take control) or studio banner. Edge swipes are only
 * shortcuts to the same two surfaces. Status colours come from the status tokens (never the brand).
 */
export function PultHeader({
  name,
  connection,
  mode,
  onRequestControl,
  onOpenSettings,
  onOpenInstallation,
  logo,
  switcher,
}: {
  /** Installation name; shown on tablets between the buttons (optional). */
  name?: string;
  /** Pult dropdown (PultSelect), when the screen shows it in the header. */
  switcher?: React.ReactNode;
  connection: Connection;
  mode: ControlMode;
  onRequestControl?: () => void;
  onOpenSettings?: () => void;
  onOpenInstallation?: () => void;
  logo?: React.ReactNode;
}) {
  return (
    <View className="gap-2 px-4 pb-3 pt-2">
      <View className="min-h-touch flex-row items-center gap-3">
        {onOpenSettings && (
          <IconButton icon={GearSixIcon} label="Settings" onPress={() => onOpenSettings()} />
        )}
        {logo}
        {name ? (
          <Text
            className={cn("text-foreground shrink text-lg font-semibold", "hidden sm:flex")}
            numberOfLines={1}
          >
            {name}
          </Text>
        ) : null}
        {switcher}
        <View className="flex-1" />
        <ConnectionStatus state={connection} />
        {onOpenInstallation && (
          <IconButton
            icon={SlidersHorizontalIcon}
            label="Installation"
            onPress={() => onOpenInstallation()}
          />
        )}
      </View>
      {mode === "view" && <StatusBanner mode="view" onTakeControl={onRequestControl} />}
      {mode === "studio-has-control" && <StatusBanner mode="studio" />}
    </View>
  );
}
