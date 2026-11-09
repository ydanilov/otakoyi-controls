import {
  SYSTEM_SEED_MAX,
  SYSTEM_SIZE_PRESETS,
  SYSTEM_SIZE_RANGE,
  systemPresetOf,
} from "@osc/schema";
import * as React from "react";
import { View } from "react-native";
import { Button } from "../chrome/Button";
import { Note } from "../chrome/Status";
import { ConsolePanel, ListCard } from "../containers/Cards";
import { ValueInput } from "../forms/Field";
import { ListRow } from "../forms/ListRow";
import { Stepper } from "../forms/Stepper";

/** What the installation reported for the System group; undefined = not reported yet. */
export interface SystemValues {
  resw?: number | undefined;
  resh?: number | undefined;
  debug?: boolean | undefined;
  seed?: number | undefined;
}

export type SystemChange =
  { key: "resw" | "resh" | "seed"; value: number } | { key: "debug"; value: boolean };

/** Fallback shown until the installation reports its size. */
const FALLBACK = { resw: 1920, resh: 1080 };

/**
 * Pattern `System Screen` (ADR-018): the standard System group of every installation — output
 * width and height (presets, steppers, typed custom value), the debug overlay and the seed. Lives
 * in the Installation panel next to the system actions, identical for every installation; never on
 * a client pult and not part of the app's Settings. Every change applies at once (the installation
 * resizes live); values shown are the installation's own (feedback).
 */
export function SystemScreen({
  values,
  onChange,
  disabled,
}: {
  values: SystemValues;
  onChange: (change: SystemChange) => void;
  /** No control (another device holds the lease): values stay visible, nothing is editable. */
  disabled?: boolean;
}) {
  const w = values.resw ?? FALLBACK.resw;
  const h = values.resh ?? FALLBACK.resh;
  const known = values.resw !== undefined && values.resh !== undefined;
  const active = systemPresetOf(values.resw, values.resh);
  const setSize = (key: "resw" | "resh", value: number) => onChange({ key, value });
  return (
    <View className="gap-4 self-stretch" testID="system-screen">
      <ConsolePanel title="Output size">
        <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
          {SYSTEM_SIZE_PRESETS.map((p) => (
            <Button
              key={p.label}
              label={p.label}
              size="sm"
              variant={active === p.label ? "primary" : "secondary"}
              disabled={disabled}
              onPress={() => {
                if (p.w !== values.resw) setSize("resw", p.w);
                if (p.h !== values.resh) setSize("resh", p.h);
              }}
            />
          ))}
        </View>
        <Stepper
          label="Width"
          unit="px"
          {...SYSTEM_SIZE_RANGE}
          step={1}
          value={w}
          onChange={(v) => setSize("resw", v)}
          disabled={disabled}
        />
        <Stepper
          label="Height"
          unit="px"
          {...SYSTEM_SIZE_RANGE}
          step={1}
          value={h}
          onChange={(v) => setSize("resh", v)}
          disabled={disabled}
        />
        <View className="gap-1">
          <ValueInput
            label="Custom width"
            unit="px"
            {...SYSTEM_SIZE_RANGE}
            step={1}
            value={w}
            onChange={(v) => setSize("resw", v)}
            disabled={disabled}
          />
          <ValueInput
            label="Custom height"
            unit="px"
            {...SYSTEM_SIZE_RANGE}
            step={1}
            value={h}
            onChange={(v) => setSize("resh", v)}
            disabled={disabled}
          />
        </View>
        {!known && <Note>Waiting for the installation to report its size.</Note>}
      </ConsolePanel>
      <ListCard>
        <ListRow
          title="Debug overlay"
          subtitle="Rehearsal info on the output"
          trailing="switch"
          checked={values.debug ?? false}
          onCheckedChange={(v) => onChange({ key: "debug", value: v })}
          disabled={disabled}
        />
      </ListCard>
      <ConsolePanel title="Seed">
        <ValueInput
          label="Seed (0 = random)"
          min={0}
          max={SYSTEM_SEED_MAX}
          step={1}
          value={values.seed ?? 0}
          onChange={(v) => onChange({ key: "seed", value: v })}
          disabled={disabled}
        />
      </ConsolePanel>
    </View>
  );
}
