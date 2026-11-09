import { describe, expect, it } from "vitest";
import { baseTokens } from "@osc/tokens";
import type { AnyControl } from "@osc/schema";
import { parseConfig, type Page } from "@osc/schema";
import demo from "../../../schema/examples/try-the-demo.json";
import {
  itemsFor,
  layoutPage,
  naturalHeightFor,
  panelMaxWidth,
  panelMinHeight,
  pultMetrics,
  reflowForPhone,
  type Cell,
  type Item,
} from "./layout";

const overlaps = (a: Cell, b: Cell) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe("reflowForPhone", () => {
  const controls = [
    { id: "intensity", grid: { x: 0, y: 0, w: 2, h: 6 } },
    { id: "speed", grid: { x: 2, y: 0, w: 2, h: 6 } },
    { id: "xy", grid: { x: 4, y: 0, w: 5, h: 6 } },
    { id: "knob", grid: { x: 9, y: 0, w: 3, h: 3 } },
    { id: "mode", grid: { x: 0, y: 6, w: 6, h: 2 } },
    { id: "flash", grid: { x: 8, y: 6, w: 2, h: 2 } },
  ];
  const out = reflowForPhone(controls.map((c) => [c.id, c.grid] as [string, Cell]));

  it("uses half or full rows and stays inside 12 columns", () => {
    expect(out.get("intensity")!.w).toBe(6);
    expect(out.get("knob")!.w).toBe(6);
    expect(out.get("xy")!.w).toBe(12);
    expect(out.get("mode")!.w).toBe(12);
    expect([out.get("intensity")!.x, out.get("speed")!.x]).toEqual([0, 6]);
    for (const c of out.values()) expect(c.x + c.w).toBeLessThanOrEqual(12);
  });

  it("never overlaps controls", () => {
    const cells = [...out.values()];
    for (let i = 0; i < cells.length; i++)
      for (let j = i + 1; j < cells.length; j++) expect(overlaps(cells[i]!, cells[j]!)).toBe(false);
  });

  it("keeps reading order", () => {
    const y = (id: string) => out.get(id)!.y;
    expect(y("intensity")).toBeLessThanOrEqual(y("xy"));
    expect(y("xy")).toBeLessThanOrEqual(y("mode"));
  });
});

const sizes = baseTokens.control;
const phone = pultMetrics("phone", sizes);
const tablet = pultMetrics("tablet", sizes);
const parsed = parseConfig(demo);
if (!parsed.ok) throw new Error("demo config does not parse");
const config = parsed.config;
const page = (pult: string, id: string): Page =>
  config.pults.find((p) => p.id === pult)!.pages.find((g) => g.id === id)!;
const round = (r: { x: number; y: number; w: number; h: number }) =>
  [r.x, r.y, r.w, r.h].map((v) => Math.round(v * 100) / 100);

describe("layoutPage = Figma Demo · Try the demo (ADR-006)", () => {
  it("phone Lobby › Live: packed from the top, 12 pt in, 18 pt gaps, free space below", () => {
    const g = page("lobby", "live");
    // Figma Phone / 03 Demo pult: the Pult frame is 402 × 596.
    const screens = layoutPage(
      new Map(Object.entries(g.layout.phone)),
      itemsFor(g.controls, g.panels, sizes),
      402,
      596,
      phone,
    );
    expect(screens).toHaveLength(2);
    const r = screens[0]!.rects;
    expect(screens[0]!.ids).toEqual([
      "wall-scene",
      "wall-switches",
      "wall-brightness",
      "hue-drift",
    ]);
    expect(round(r.get("wall-scene")!)).toEqual([16, 12, 370, 78]);
    expect(round(r.get("wall-switches")!)).toEqual([16, 108, 370, 170]);
    expect(round(r.get("wall-brightness")!)).toEqual([16, 296, 370, 82]);
    expect(round(r.get("hue-drift")!)).toEqual([16, 396, 370, 82]);
  });

  it("tablet VJ › Mix: Console columns, 20 / 10 pt in, 16 pt gaps, last item to the bottom", () => {
    const g = page("vj", "mix");
    // Figma Tablet / 03 Demo pult: the Console frame is 1210 × 603.
    const screens = layoutPage(
      new Map(Object.entries(g.layout.tablet)),
      itemsFor(g.controls, g.panels, sizes),
      1210,
      603,
      tablet,
    );
    expect(screens).toHaveLength(1);
    const r = screens[0]!.rects;
    expect(round(r.get("mix")!)).toEqual([20, 10, 379.33, 583]);
    expect(round(r.get("shape")!)).toEqual([415.33, 10, 379.33, 442]);
    expect(round(r.get("layers-panel")!)).toEqual([415.33, 468, 379.33, 136]);
    expect(round(r.get("camera")!)).toEqual([810.67, 10, 379.33, 366]);
    expect(round(r.get("scene-bar")!)).toEqual([810.67, 392, 379.33, 201]);
  });
});

describe("layoutPage", () => {
  const fixed = (height: number): Item => ({ height });
  it("splits between bands, never through one", () => {
    const cells = new Map<string, Cell>([
      ["a", { x: 0, y: 0, w: 6, h: 2 }],
      ["b", { x: 6, y: 0, w: 6, h: 2 }],
      ["c", { x: 0, y: 2, w: 12, h: 2 }],
    ]);
    const items = new Map([
      ["a", fixed(200)],
      ["b", fixed(100)],
      ["c", fixed(200)],
    ]);
    // 12 + 200 + 18 + 200 = 430 > 400 − 24 → c moves to screen 2.
    const s = layoutPage(cells, items, 400, 400, phone);
    expect(s.map((x) => x.ids)).toEqual([["a", "b"], ["c"]]);
    expect(s[1]!.rects.get("c")!.y).toBe(12);
    expect(layoutPage(cells, items, 400, 600, phone)).toHaveLength(1);
  });

  it("shares the free height among stretchable items by grid rows", () => {
    const cells = new Map<string, Cell>([
      ["list", { x: 0, y: 0, w: 12, h: 6 }],
      ["fader", { x: 0, y: 6, w: 12, h: 2 }],
    ]);
    const s = layoutPage(cells, new Map([["fader", fixed(82)]]), 400, 524, phone);
    // inner 500: the list takes 500 − 18 − 82 = 400.
    expect(round(s[0]!.rects.get("list")!)).toEqual([16, 12, 368, 400]);
    expect(round(s[0]!.rects.get("fader")!)).toEqual([16, 430, 368, 82]);
  });

  it("stretches a column's last item on a tablet only", () => {
    const cells = new Map<string, Cell>([["k", { x: 0, y: 0, w: 4, h: 4 }]]);
    const items = new Map([["k", fixed(186)]]);
    expect(layoutPage(cells, items, 800, 500, tablet)[0]!.rects.get("k")!.h).toBe(480);
    expect(layoutPage(cells, items, 400, 500, phone)[0]!.rects.get("k")!.h).toBe(186);
  });

  it("scales a single band taller than the screen to fit", () => {
    const cells = new Map<string, Cell>([["k", { x: 0, y: 0, w: 4, h: 4 }]]);
    const s = layoutPage(cells, new Map([["k", fixed(900)]]), 400, 524, phone);
    expect(s[0]!.rects.get("k")!.h).toBe(500);
  });

  it("returns one empty screen for an empty page", () => {
    expect(layoutPage(new Map(), new Map(), 400, 400, phone)).toEqual([
      { ids: [], rects: new Map() },
    ]);
  });
});

describe("Figma heights", () => {
  const pad = (extra: Record<string, unknown>) =>
    ({
      id: "p",
      type: "toggle",
      style: "button",
      address: "/p",
      ...extra,
    }) as unknown as AnyControl;

  it("knows the pad, picture pad and control sizes", () => {
    expect(naturalHeightFor(pad({ image: "logo.jpg" }), sizes)).toBe(168);
    expect(naturalHeightFor(pad({ image: "logo.jpg", size: "compact" }), sizes)).toBe(120);
    expect(naturalHeightFor(pad({}), sizes)).toBe(88);
    expect(naturalHeightFor(pad({ size: "compact" }), sizes)).toBe(64);
    expect(naturalHeightFor(pad({ style: "switch", image: "x.jpg" }), sizes)).toBe(46);
    const c = (x: Record<string, unknown>) => x as unknown as AnyControl;
    expect(naturalHeightFor(c({ type: "fader", orientation: "horizontal" }), sizes)).toBe(82);
    expect(naturalHeightFor(c({ type: "fader", orientation: "vertical" }), sizes)).toBeUndefined();
    expect(naturalHeightFor(c({ type: "knob", size: "regular" }), sizes)).toBe(186);
    expect(naturalHeightFor(c({ type: "knob", size: "compact" }), sizes)).toBe(138);
    expect(naturalHeightFor(c({ type: "segmented", label: "Scene" }), sizes)).toBe(78);
    expect(naturalHeightFor(c({ type: "segmented" }), sizes)).toBe(56);
    expect(naturalHeightFor(c({ type: "xy" }), sizes)).toBeUndefined();
    expect(naturalHeightFor(c({ type: "gyroscope" }), sizes)).toBe(184);
  });
});

describe("Console Panel patterns (Figma Patterns, responsive)", () => {
  it("caps the width per pattern", () => {
    expect(panelMaxWidth("faderBank")).toBe(640);
    expect(panelMaxWidth("knobRow")).toBe(480);
    expect(panelMaxWidth("cameraControl")).toBe(480);
    for (const p of [
      "knobGroup",
      "layerToggles",
      "sceneBar",
      "showActions",
      "list",
      "stack",
    ] as const)
      expect(panelMaxWidth(p)).toBe(560);
  });
  it("has the Figma heights", () => {
    expect(panelMinHeight("faderBank", 8)).toBe(466);
    expect(panelMinHeight("knobGroup", 4)).toBe(442);
    expect(panelMinHeight("cameraControl", 2)).toBe(366);
    expect(panelMinHeight("layerToggles", 1)).toBe(136);
    expect(panelMinHeight("sceneBar", 1)).toBe(114);
    expect(panelMinHeight("list", 3)).toBe(170);
  });
});
