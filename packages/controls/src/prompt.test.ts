import { describe, expect, it } from "vitest";
import {
  movePreset,
  presetCardState,
  presetsPatternState,
  promptConfirms,
  promptValue,
  reapplyAfterChange,
  tapPreset,
  useInMix,
  type PromptValue,
} from "./prompt";

const presets = [
  { id: "forest", text: "misty forest", on: true },
  { id: "city", text: "neon city", on: true },
  { id: "sea", text: "calm sea", on: true },
];
const none: PromptValue = { a: null, b: null, mix: 0, aId: null, bId: null };
const single = promptValue(presets, { a: "forest", mix: 0 }, 500);
const blend = promptValue(presets, { a: "forest", b: "city", mix: 0.5 }, 500);

describe("prompt preset card states", () => {
  it("off / on / in blend", () => {
    expect(presetCardState({ id: "forest", value: none })).toBe("off");
    expect(presetCardState({ id: "forest", value: single })).toBe("on");
    expect(presetCardState({ id: "sea", value: single })).toBe("off");
    expect(presetCardState({ id: "city", value: blend })).toBe("inBlend");
  });

  it("applying (amber) until confirmed, error after the timeout; only live cards", () => {
    const applying = { state: "applying" as const, seq: 3 };
    expect(presetCardState({ id: "forest", value: single, ack: applying })).toBe("applying");
    expect(presetCardState({ id: "sea", value: single, ack: applying })).toBe("off");
    expect(presetCardState({ id: "forest", value: single, ack: { state: "error", seq: 3 } })).toBe(
      "error",
    );
    expect(
      presetCardState({ id: "forest", value: single, ack: { state: "applied", seq: 3 } }),
    ).toBe("on");
  });

  it("disabled and editing win", () => {
    expect(presetCardState({ id: "forest", value: single, disabled: true })).toBe("disabled");
    expect(presetCardState({ id: "forest", value: single, editing: true })).toBe("editing");
  });
});

describe("prompt presets pattern states", () => {
  it("empty, all off (base look), active, applying, error, editing", () => {
    expect(presetsPatternState({ count: 0, value: none })).toBe("empty");
    expect(presetsPatternState({ count: 3, value: none })).toBe("allOff");
    expect(presetsPatternState({ count: 3, value: single })).toBe("active");
    expect(
      presetsPatternState({ count: 3, value: single, ack: { state: "applying", seq: 1 } }),
    ).toBe("applying");
    expect(presetsPatternState({ count: 3, value: single, ack: { state: "error", seq: 1 } })).toBe(
      "error",
    );
    expect(presetsPatternState({ count: 3, value: single, editing: true })).toBe("editing");
  });
});

describe("prompt interactions", () => {
  it("tap toggles live; an error card retries the same value", () => {
    expect(tapPreset("sea", single, "off")).toMatchObject({ a: "sea", retry: false });
    expect(tapPreset("forest", single, "on")).toMatchObject({ a: null, retry: false });
    expect(tapPreset("city", blend, "inBlend")).toMatchObject({ a: "forest", b: null });
    expect(tapPreset("forest", single, "error")).toMatchObject({ a: "forest", retry: true });
  });

  it("use in mix puts a preset in slot B", () => {
    expect(useInMix("sea", single)).toEqual({ a: "forest", b: "sea", mix: 0 });
    expect(useInMix("forest", single)).toEqual({ a: null, b: "forest", mix: 0 });
  });

  it("deleting or changing a live preset re-resolves its slot (deleted → base look)", () => {
    const after = presets.filter((p) => p.id !== "forest");
    expect(reapplyAfterChange(single, after, "forest", 500)).toEqual({
      a: null,
      b: null,
      mix: 0,
      aId: null,
      bId: null,
    });
    expect(reapplyAfterChange(single, after, "sea", 500)).toBeNull(); // not live: nothing to send
    const edited = presets.map((p) => (p.id === "city" ? { ...p, text: "rainy city" } : p));
    expect(reapplyAfterChange(blend, edited, "city", 500)?.b).toBe("rainy city");
  });

  it("reorders", () => {
    expect(movePreset(["a", "b", "c"], "c", 0)).toEqual(["c", "a", "b"]);
    expect(movePreset(["a", "b", "c"], "a", 9)).toEqual(["b", "c", "a"]);
    expect(movePreset(["a", "b"], "x", 0)).toEqual(["a", "b"]);
  });

  it("the installation confirms with <address>/applied or an echo of the text", () => {
    expect(promptConfirms("/p", blend, true, { address: "/p/applied", text: undefined })).toBe(
      true,
    );
    expect(promptConfirms("/p", blend, true, { address: "/p/a", text: "misty forest" })).toBe(true);
    expect(promptConfirms("/p", blend, true, { address: "/p/a", text: "old" })).toBe(false);
    expect(promptConfirms("/p", blend, true, { address: "/p/mix", text: 0.5 })).toBe(false);
    expect(promptConfirms("/p", single, false, { address: "/p", text: "misty forest" })).toBe(true);
  });
});
