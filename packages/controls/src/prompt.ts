/**
 * Prompt control (ADR-015, states in ADR-016): text prompts for generative installations. Presets
 * are created by the client and stored by the bridge; the control's value is what is live now.
 */

/** What a prompt control holds and syncs: the live texts (already resolved) and the blend amount. */
export interface PromptValue {
  /** Text in slot A, or null (no preset, or the preset is switched off). */
  a: string | null;
  /** Text in slot B (blend only). */
  b: string | null;
  /** 0 = all A, 1 = all B. */
  mix: number;
  /** Preset in slot A (so every pult knows which card is live, and a delete can clear it). */
  aId?: string | null | undefined;
  /** Preset in slot B. */
  bId?: string | null | undefined;
}

export interface PromptSelection {
  a?: string | null | undefined;
  b?: string | null | undefined;
  mix: number;
}

type Preset = { id: string; text: string; on: boolean };

/**
 * Resolve the selected preset ids into the live value: a missing or switched-off preset leaves its
 * slot empty; texts are cut to `maxLength`.
 */
export function promptValue(
  presets: readonly Preset[],
  sel: PromptSelection,
  maxLength: number,
): PromptValue {
  const find = (id: string | null | undefined) => {
    const p = id ? presets.find((x) => x.id === id) : undefined;
    return p && p.on ? p : undefined;
  };
  const a = find(sel.a);
  const b = find(sel.b);
  return {
    a: a ? a.text.slice(0, maxLength) : null,
    b: b ? b.text.slice(0, maxLength) : null,
    mix: Math.min(1, Math.max(0, sel.mix)),
    aId: a?.id ?? null,
    bId: b?.id ?? null,
  };
}

/** Switch one preset on or off (returns a new list). */
export function togglePreset<T extends Preset>(presets: readonly T[], id: string): T[] {
  return presets.map((p) => (p.id === id ? { ...p, on: !p.on } : p));
}

export const isPromptValue = (v: unknown): v is PromptValue =>
  typeof v === "object" &&
  v !== null &&
  "mix" in v &&
  "a" in v &&
  "b" in v &&
  typeof (v as PromptValue).mix === "number";

/** The presets that are live in a value. */
export const liveIds = (v: PromptValue | null | undefined): string[] =>
  v ? [v.aId, v.bId].filter((x): x is string => typeof x === "string") : [];

/**
 * Value after a preset was deleted or changed: if it is live, its slot is re-resolved (a deleted
 * preset leaves the slot empty — the installation returns to its base look). Returns null when the
 * preset is not live (nothing to send).
 */
export function reapplyAfterChange(
  current: PromptValue,
  presets: readonly Preset[],
  changedId: string,
  maxLength: number,
): PromptValue | null {
  if (!liveIds(current).includes(changedId)) return null;
  return promptValue(presets, { a: current.aId, b: current.bId, mix: current.mix }, maxLength);
}

/** Move one preset to a new index (drag to reorder). Returns the new id order. */
export function movePreset(ids: readonly string[], id: string, to: number): string[] {
  const from = ids.indexOf(id);
  if (from < 0) return [...ids];
  const out = ids.filter((x) => x !== id);
  out.splice(Math.max(0, Math.min(out.length, to)), 0, id);
  return out;
}

/**
 * Drag to reorder (edit mode): where a card dragged by `offset` px lands, with cards `slot` px
 * apart (card width + gap). It moves one place once dragged past half a slot. Runs as a worklet.
 */
export function dragTargetIndex(from: number, offset: number, slot: number, count: number): number {
  "worklet";
  if (count <= 0 || slot <= 0) return Math.max(0, from);
  return Math.max(0, Math.min(count - 1, from + Math.round(offset / slot)));
}

/**
 * While a card is dragged from `from` towards `to`, how far (in slots) the card at `index` shifts
 * to make room: −1, 0 or +1. The dragged card itself follows the finger (0 here).
 */
export function dragShift(index: number, from: number, to: number): number {
  "worklet";
  if (index === from) return 0;
  if (from < to && index > from && index <= to) return -1;
  if (from > to && index < from && index >= to) return 1;
  return 0;
}

// ---------- states (Figma: Prompt Preset card, Prompt Presets pattern) ----------

/** Confirmation of the last prompt sent, from the bridge (`prompt` message). */
export interface PromptAck {
  state: "applying" | "applied" | "error";
  /** Increases with every prompt sent for this control; an older ack never overrides a newer one. */
  seq: number;
}

export type PresetCardState =
  "off" | "on" | "inBlend" | "disabled" | "applying" | "error" | "editing";

/**
 * Card state. Live = in slot A or B. While the installation has not confirmed, live cards are
 * Applying (amber); after the timeout they are Error (tap retries). In blend = live while both
 * slots are filled.
 */
export function presetCardState(o: {
  id: string;
  value: PromptValue | null;
  ack?: PromptAck | null | undefined;
  editing?: boolean | undefined;
  disabled?: boolean | undefined;
}): PresetCardState {
  if (o.disabled) return "disabled";
  if (o.editing) return "editing";
  const live = liveIds(o.value);
  if (!live.includes(o.id)) return "off";
  if (o.ack?.state === "applying") return "applying";
  if (o.ack?.state === "error") return "error";
  return live.length === 2 ? "inBlend" : "on";
}

export type PresetsPatternState = "active" | "applying" | "allOff" | "editing" | "empty" | "error";

/** State of the whole presets list (All off = the installation's base look). */
export function presetsPatternState(o: {
  count: number;
  value: PromptValue | null;
  ack?: PromptAck | null | undefined;
  editing?: boolean | undefined;
}): PresetsPatternState {
  if (o.editing) return "editing";
  if (o.count === 0) return "empty";
  if (o.ack?.state === "error") return "error";
  if (o.ack?.state === "applying") return "applying";
  return liveIds(o.value).length ? "active" : "allOff";
}

/**
 * What a tap on a card does: an Error card retries the same value; otherwise the card toggles live
 * (single slot: replace A; blend: A, or clear the slot it is in).
 */
export function tapPreset(
  id: string,
  current: PromptValue,
  state: PresetCardState,
): { a: string | null; b: string | null; mix: number; retry: boolean } {
  const sel = { a: current.aId ?? null, b: current.bId ?? null, mix: current.mix };
  if (state === "error") return { ...sel, retry: true };
  if (sel.a === id) return { ...sel, a: null, retry: false };
  if (sel.b === id) return { ...sel, b: null, retry: false };
  return { ...sel, a: id, retry: false };
}

/** "Use in mix": put a preset in slot B (it leaves A if it was there). */
export function useInMix(id: string, current: PromptValue) {
  return {
    a: current.aId === id ? null : (current.aId ?? null),
    b: id,
    mix: current.mix,
  };
}

/** Which sent messages count as the installation confirming (`<address>/applied` or an echo). */
export function promptConfirms(
  address: string,
  sent: PromptValue,
  blend: boolean,
  msg: { address: string; text: unknown },
): boolean {
  if (msg.address === `${address}/applied`) return true;
  if (!blend) return msg.address === address && msg.text === (sent.a ?? "");
  if (msg.address === `${address}/a`) return msg.text === (sent.a ?? "");
  if (msg.address === `${address}/b`) return msg.text === (sent.b ?? "");
  return false;
}
