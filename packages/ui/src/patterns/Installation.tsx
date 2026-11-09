import * as React from "react";
import { View } from "react-native";
import { Button } from "../chrome/Button";
import { TabBar } from "../chrome/Navigation";
import { ConsolePanel, ListCard, Section } from "../containers/Cards";
import { ListRow } from "../forms/ListRow";
import { Stepper } from "../forms/Stepper";
import {
  ArrowClockwiseIcon,
  FlashlightIcon,
  HandPalmIcon,
  MonitorIcon,
  PauseIcon,
  PowerIcon,
  ScanIcon,
  type PhosphorIcon,
} from "../ds/icons";
import { ActivityRow, type ActivityKind } from "../media/ActivityRow";
import { QuickAction } from "../media/QuickAction";

export interface QuickActionItem {
  id: string;
  label: string;
  icon: PhosphorIcon;
  tone?: "default" | "critical";
  holdMs?: number;
  disabled?: boolean;
}

/** Default installation quick actions (ADR-013 addendum): Flash, Restart and Blackout (held). */
export const DEFAULT_QUICK_ACTIONS: QuickActionItem[] = [
  { id: "flash", label: "Flash", icon: FlashlightIcon },
  { id: "restart", label: "Restart", icon: ArrowClockwiseIcon, tone: "critical", holdMs: 1500 },
  { id: "blackout", label: "Blackout", icon: PowerIcon, tone: "critical", holdMs: 1500 },
];

/** Pattern `Quick Actions Row`: a Console Panel of Quick Actions spread evenly. */
export function QuickActionsRow({
  actions = DEFAULT_QUICK_ACTIONS,
  onAction,
  title = "Quick actions",
}: {
  actions?: QuickActionItem[];
  onAction?: (id: string) => void;
  title?: string;
}) {
  return (
    <ConsolePanel title={title}>
      <View className="flex-row justify-around">
        {actions.map((a) => (
          <QuickAction
            key={a.id}
            icon={a.icon}
            label={a.label}
            tone={a.tone}
            holdMs={a.holdMs}
            disabled={a.disabled}
            onAction={() => onAction?.(a.id)}
          />
        ))}
      </View>
    </ConsolePanel>
  );
}

export interface ModeItem {
  id: string;
  label: string;
  icon: PhosphorIcon;
}

/** Installation modes: Idle (stop reacting to people) and the optional Pause. */
export const DEFAULT_MODES: ModeItem[] = [
  { id: "idle", label: "Idle mode — ignore players", icon: HandPalmIcon },
  { id: "pause", label: "Pause playback", icon: PauseIcon },
];

/**
 * Pattern `Installation Actions` (Figma 62:846): the body of the Installation surface (iPhone sheet,
 * iPad inspector) — the quick actions spread across under a "Quick actions" caption (no panel), the
 * mode switches (Menu Switches) in a List Card under "Modes".
 */
export function InstallationActions({
  actions,
  onAction,
  modes = DEFAULT_MODES,
  modeState,
  onModeChange,
  modesDisabled,
}: {
  actions?: QuickActionItem[];
  onAction?: (id: string) => void;
  modes?: ModeItem[];
  modeState: Record<string, boolean>;
  onModeChange: (id: string, on: boolean) => void;
  modesDisabled?: boolean;
}) {
  return (
    <View className="gap-6 self-stretch">
      <Section title="Quick actions">
        <View className="flex-row justify-between">
          {(actions ?? DEFAULT_QUICK_ACTIONS).map((a) => (
            <QuickAction
              key={a.id}
              icon={a.icon}
              label={a.label}
              tone={a.tone}
              holdMs={a.holdMs}
              disabled={a.disabled}
              onAction={() => onAction?.(a.id)}
            />
          ))}
        </View>
      </Section>
      {modes.length > 0 && (
        <Section title="Modes">
          <ListCard>
            {modes.map((m) => (
              <ListRow
                key={m.id}
                icon={m.icon}
                title={m.label}
                trailing="switch"
                checked={!!modeState[m.id]}
                disabled={modesDisabled}
                onCheckedChange={(on) => onModeChange(m.id, on)}
              />
            ))}
          </ListCard>
        </Section>
      )}
    </View>
  );
}

export interface InstallationItem {
  id: string;
  name: string;
  /** "current", "online", "offline"… shown on the right. */
  status: string;
}

/** Pattern `Installation Switcher`: installations this device is paired with, plus "Add an installation". */
export function InstallationSwitcher({
  installations,
  onSelect,
  onAdd,
}: {
  installations: InstallationItem[];
  onSelect?: (id: string) => void;
  onAdd?: () => void;
}) {
  return (
    <ConsolePanel title="Installations">
      <ListCard>
        {installations.map((i) => (
          <ListRow
            key={i.id}
            icon={MonitorIcon}
            title={i.name}
            trailing="value"
            value={i.status}
            onPress={() => onSelect?.(i.id)}
          />
        ))}
        {onAdd ? <ListRow icon={ScanIcon} title="Add an installation" onPress={onAdd} /> : null}
      </ListCard>
    </ConsolePanel>
  );
}

export type ActivityRange = "today" | "week" | "all";
export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  text: string;
  time: string;
}

const RANGES = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "all", label: "All" },
] as const;

/** Pattern `Activity Log`: range tabs + Activity Rows in a List Card. */
export function ActivityLog({
  items,
  range,
  onRangeChange,
}: {
  items: ActivityItem[];
  range: ActivityRange;
  onRangeChange: (range: ActivityRange) => void;
}) {
  return (
    <ConsolePanel title="Activity">
      <TabBar tabs={RANGES} value={range} onChange={onRangeChange} />
      <ListCard>
        {items.map((i) => (
          <ActivityRow key={i.id} kind={i.kind} text={i.text} time={i.time} />
        ))}
      </ListCard>
    </ConsolePanel>
  );
}

export interface StepperItem {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  defaultValue: number;
}

/** Pattern `Stepper Group`: precise values that belong together, with one Reset all. */
export function StepperGroup({
  title = "Precise",
  items,
  values,
  onChange,
  disabled,
}: {
  title?: string;
  items: StepperItem[];
  values: Record<string, number>;
  onChange: (id: string, value: number) => void;
  disabled?: boolean;
}) {
  const changed = items.some((i) => (values[i.id] ?? i.defaultValue) !== i.defaultValue);
  return (
    <ConsolePanel title={title}>
      {items.map((i) => (
        <Stepper
          key={i.id}
          label={i.label}
          min={i.min}
          max={i.max}
          step={i.step}
          unit={i.unit}
          defaultValue={i.defaultValue}
          value={values[i.id] ?? i.defaultValue}
          onChange={(v) => onChange(i.id, v)}
          disabled={disabled}
        />
      ))}
      <Button
        label="Reset all"
        variant="secondary"
        disabled={disabled || !changed}
        onPress={() => items.forEach((i) => onChange(i.id, i.defaultValue))}
        block
      />
    </ConsolePanel>
  );
}
