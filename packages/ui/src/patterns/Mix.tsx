import { crossfadeShares } from "@osc/controls";
import { Control, type ControlOf } from "@osc/schema";
import * as React from "react";
import { View } from "react-native";
import { Text } from "../components/ui/text";
import { ConsolePanel } from "../containers/Cards";
import { Fader } from "../controls/Fader";
import { StatTile } from "../chrome/Status";
import { Select, type SelectOption } from "../forms/Select";

/** Height of the crossfade body without its header (Figma Mix: 82). */
const FADER_H = 82;

interface MixProps {
  /** Panel title (Figma: "Mix"). */
  title?: string;
  /** Scenes (or prompts) to pick for each side. */
  options: ReadonlyArray<SelectOption<string>>;
  a: string;
  b: string;
  /** Crossfade 0 (all A) … 1 (all B). */
  mix: number;
  onA: (id: string) => void;
  onB: (id: string) => void;
  onMix: (mix: number) => void;
  disabled?: boolean;
}

function useCrossfade(id: string, header: boolean) {
  return React.useMemo(
    () =>
      Control.parse({
        id: `${id}-xfade`,
        type: "fader",
        mode: "crossfade",
        orientation: "horizontal",
        address: "/-",
        ...(header ? { label: "Mix" } : { showValue: false }),
      }) as ControlOf<"fader">,
    [id, header],
  );
}

/**
 * Pattern `Mix` (Figma Patterns › Mix 84:1027): a Console Panel with two scene pop-up buttons —
 * A on the left, B right-aligned — and the crossfade between them. No labels above the selects,
 * no header on the fader (the panel title says what it is), no cut / auto buttons; the fader's
 * ends carry LEDs only.
 */
export function Mix({ title = "Mix", options, a, b, mix, onA, onB, onMix, disabled }: MixProps) {
  const fader = useCrossfade("mix", false);
  return (
    <ConsolePanel title={title}>
      <View className="gap-1">
        <View className="flex-row gap-3">
          <Select
            variant="button"
            label="Scene A"
            value={a}
            options={options}
            onChange={onA}
            disabled={disabled}
          />
          <Select
            variant="button"
            align="end"
            label="Scene B"
            value={b}
            options={options}
            onChange={onB}
            disabled={disabled}
          />
        </View>
        <View style={{ height: FADER_H }}>
          <Fader
            control={fader}
            value={mix}
            onChange={(v) => typeof v === "number" && onMix(v)}
            disabled={disabled}
          />
        </View>
      </View>
    </ConsolePanel>
  );
}

/**
 * Pattern `Prompt Mix` (Figma Patterns › Prompt Mix 84:934): like Mix, with "A" / "B" captions
 * over the two prompt pop-up buttons, the crossfade with its header ("Mix · A 30 · B 70") and the
 * two weights as large tiles.
 */
export function PromptMix({
  title = "Prompt mix",
  options,
  a,
  b,
  mix,
  onA,
  onB,
  onMix,
  disabled,
}: MixProps) {
  const fader = useCrossfade("prompt-mix", true);
  const share = crossfadeShares(mix);
  const name = (id: string) => options.find((o) => o.value === id)?.label ?? id;
  return (
    <ConsolePanel title={title}>
      <View className="gap-4">
        <View className="flex-row gap-3">
          {(
            [
              ["A", a, onA],
              ["B", b, onB],
            ] as const
          ).map(([side, value, on]) => (
            <View key={side} className="flex-1 gap-1.5">
              <Text className="text-muted-foreground text-xs font-medium uppercase tracking-overline">
                {side}
              </Text>
              <Select
                variant="button"
                caret="down"
                label={`Prompt ${side}`}
                value={value}
                options={options}
                onChange={on}
                disabled={disabled}
              />
            </View>
          ))}
        </View>
        <View style={{ height: FADER_H }}>
          <Fader
            control={fader}
            value={mix}
            onChange={(v) => typeof v === "number" && onMix(v)}
            disabled={disabled}
          />
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatTile size="lg" outlined block label={name(a)} value={`${share.a}%`} />
          </View>
          <View className="flex-1">
            <StatTile size="lg" outlined block label={name(b)} value={`${share.b}%`} />
          </View>
        </View>
      </View>
    </ConsolePanel>
  );
}
