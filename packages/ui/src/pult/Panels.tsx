import type { AnyControl, Panel } from "@osc/schema";
import * as React from "react";
import { View } from "react-native";
import { ConsolePanel, ListCard } from "../containers/Cards";
import { iconByName } from "../ds/iconByName";
import { ListRow } from "../forms/ListRow";
import { ConnectedControl } from "./ConnectedControl";
import { useControlEnabled, useControlMode, useControlValue, usePultStore } from "./context";
import { panelMaxWidth } from "./layout";

/** Figma Channel Strip: the ON button (a 76 × 56 Group Button) under each fader. */
const STRIP_BUTTON = 56;
const STRIP_BUTTON_W = 76;
/** Figma Camera Control: the zoom-nudge jog under the stick. */
const NUDGE = 82;
/** Figma Layer Toggles / Scene Bar bodies. */
const LAYERS = 78;
const SCENES = 78;
const ACTIONS = 88;

/**
 * A Console-Panel pattern (Figma Patterns, ADR-014) in a pult cell: the panel fills its column's
 * width up to the pattern's maximum (`panelMaxWidth`, centred when capped) and the cell's height
 * (the pager keeps the cell at least `panelMinHeight` tall). Inside, the pattern arranges its
 * controls:
 * - Fader Bank: channel strips sharing the width edge to edge — each vertical fader with the
 *   toggle after it as its 76 pt ON button (an off strip mutes its fader);
 * - Knob Group / Knob Row: knobs evenly spaced in rows of two / one row;
 * - Layer Toggles, Scene Bar, Show Actions: the content centred vertically;
 * - Camera Control: the thumbstick over the zoom-nudge jog;
 * - List: toggles as List Rows with Menu Switches in one List Card (no Console Panel).
 */
export function PanelView({
  panel,
  controls,
  studio,
}: {
  panel: Panel;
  controls: ReadonlyMap<string, AnyControl>;
  studio: boolean;
}) {
  const items = panel.controls.map((id) => controls.get(id)).filter((c): c is AnyControl => !!c);
  const box = {
    width: "100%" as const,
    maxWidth: panelMaxWidth(panel.pattern),
    alignSelf: "center" as const,
  };
  if (panel.pattern === "list")
    return (
      <View className="flex-1 justify-center" style={box} testID={`panel-${panel.id}`}>
        <ListCard>
          {items.map((c) => (
            <ListToggleRow key={c.id} control={c} />
          ))}
        </ListCard>
      </View>
    );
  return (
    <View className="flex-1" style={box} testID={`panel-${panel.id}`}>
      <ConsolePanel title={panel.title} className="flex-1">
        <View className="flex-1">{body(panel, items, studio)}</View>
      </ConsolePanel>
    </View>
  );
}

function body(panel: Panel, items: AnyControl[], studio: boolean) {
  const one = (c: AnyControl, extra?: Record<string, unknown>) => (
    <ConnectedControl key={c.id} control={c} studio={studio} extra={extra} />
  );
  switch (panel.pattern) {
    case "faderBank":
      return (
        <View className="flex-1 flex-row">
          {strips(items).map((s) => (
            <Strip key={s.fader.id} fader={s.fader} button={s.button} studio={studio} />
          ))}
        </View>
      );
    case "knobGroup":
    case "knobRow": {
      const perRow = panel.pattern === "knobRow" ? items.length : 2;
      const rows: AnyControl[][] = [];
      for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));
      return (
        <View className="flex-1 justify-between gap-3">
          {rows.map((r, i) => (
            <View key={i} className="flex-1 flex-row justify-evenly gap-4">
              {r.map((c) => (
                <View key={c.id} className="flex-1">
                  {one(c)}
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }
    case "cameraControl": {
      const [stick, ...rest] = items;
      return (
        <View className="flex-1 justify-between gap-5">
          {stick && <View className="flex-1">{one(stick)}</View>}
          {rest.map((c) => (
            <View key={c.id} style={{ height: NUDGE }}>
              {one(c)}
            </View>
          ))}
        </View>
      );
    }
    case "layerToggles":
    case "sceneBar":
    case "showActions": {
      const h =
        panel.pattern === "layerToggles" ? LAYERS : panel.pattern === "sceneBar" ? SCENES : ACTIONS;
      return (
        <View className="flex-1 flex-row items-center gap-3">
          {items.map((c) => (
            <View key={c.id} className="flex-1" style={{ height: h }}>
              {one(c)}
            </View>
          ))}
        </View>
      );
    }
    case "list":
    case "stack":
      return (
        <View className="flex-1 gap-3">
          {items.map((c) => (
            <View key={c.id} className="flex-1">
              {one(c)}
            </View>
          ))}
        </View>
      );
  }
}

/** Fader Bank strips: each fader with the toggle that follows it (its ON button). */
export function strips(items: AnyControl[]): Array<{ fader: AnyControl; button?: AnyControl }> {
  const out: Array<{ fader: AnyControl; button?: AnyControl }> = [];
  for (const c of items) {
    const last = out.at(-1);
    if (c.type === "toggle" && last && !last.button) last.button = c;
    else out.push({ fader: c });
  }
  return out;
}

/** Figma Channel Strip: the fader (header centred) over its ON button; off mutes the fader. */
function Strip({
  fader,
  button,
  studio,
}: {
  fader: AnyControl;
  button?: AnyControl | undefined;
  studio: boolean;
}) {
  const on = useControlValue(button?.id ?? "");
  const muted = !!button && on !== true;
  return (
    <View className="flex-1 items-stretch gap-3">
      <View className="flex-1">
        <ConnectedControl control={fader} studio={studio} extra={{ muted }} />
      </View>
      {button && (
        <View
          style={{
            height: STRIP_BUTTON,
            width: "100%",
            maxWidth: STRIP_BUTTON_W,
            alignSelf: "center",
          }}
        >
          <ConnectedControl control={button} studio={studio} />
        </View>
      )}
    </View>
  );
}

/** A toggle as a List Row with a Menu Switch (panel pattern `list`). */
function ListToggleRow({ control: c }: { control: AnyControl }) {
  const store = usePultStore();
  const value = useControlValue(c.id);
  const mode = useControlMode();
  const enabled = useControlEnabled(c);
  if (c.type !== "toggle") return null;
  return (
    <ListRow
      icon={iconByName(c.icon) ?? undefined}
      title={c.label ?? c.id}
      trailing="switch"
      checked={value === true}
      onCheckedChange={(v) => store.interact(c, v)}
      disabled={mode !== "control" || !enabled}
    />
  );
}
