import { describe, expect, it } from "vitest";
import {
  INSPECTOR_WIDTH,
  TOAST_MS,
  edgeSwipeEnabled,
  edgeSwipeOpens,
  formFactor,
  manualPairing,
  orderMenuItems,
  presentationFor,
  DRAWER,
  drawerCloses,
  formatStepped,
  holdFraction,
  parseValueInput,
  snapToStep,
  stepDecimals,
  stepValue,
  trackPosition,
  uploadLabel,
} from "./logic";
import { componentDocs } from "../stories/docs";

describe("stepper", () => {
  const r = { min: 15, max: 30, step: 0.5 };
  it("derives decimals from the step", () => {
    expect(stepDecimals(1)).toBe(0);
    expect(stepDecimals(0.5)).toBe(1);
    expect(stepDecimals(0.25)).toBe(2);
  });
  it("steps, snaps and clamps without float noise", () => {
    expect(stepValue(22, 1, r)).toBe(22.5);
    expect(stepValue(15, -1, r)).toBe(15);
    expect(stepValue(30, 1, r)).toBe(30);
    expect(stepValue(0.2, 1, { min: 0, max: 1, step: 0.1 })).toBe(0.3);
    expect(snapToStep(22.3, r)).toBe(22.5);
  });
  it("formats with the step's decimals", () => {
    expect(formatStepped(22, 0.5)).toBe("22.0");
    expect(formatStepped(1, 0.1)).toBe("1.0");
    expect(formatStepped(3, 1)).toBe("3");
  });
});

describe("value input", () => {
  it("accepts dot and comma decimals", () => {
    expect(parseValueInput("12.5", {})).toEqual({ ok: true, value: 12.5, clamped: false });
    expect(parseValueInput(" 0,5 ", {})).toEqual({ ok: true, value: 0.5, clamped: false });
  });
  it("clamps to min/max and reports it", () => {
    expect(parseValueInput("9999", { min: 0, max: 1000 })).toEqual({
      ok: true,
      value: 1000,
      clamped: true,
    });
    expect(parseValueInput("-4", { min: 0 })).toEqual({ ok: true, value: 0, clamped: true });
  });
  it("snaps to the step", () => {
    expect(parseValueInput("251", { min: 0, max: 1000, step: 10 })).toMatchObject({ value: 250 });
  });
  it("rejects empty and non-numeric text", () => {
    expect(parseValueInput("", {})).toEqual({ ok: false, reason: "empty" });
    expect(parseValueInput("abc", {})).toEqual({ ok: false, reason: "nan" });
    expect(parseValueInput("1.2.3", {})).toEqual({ ok: false, reason: "nan" });
  });
});

describe("navigation (ADR-013, HIG)", () => {
  it("splits phone and tablet at the pult breakpoint", () => {
    expect(formFactor(390)).toBe("phone");
    expect(formFactor(820)).toBe("tablet");
  });
  it("presents Settings as a large sheet on iPhone and a left drawer on iPad", () => {
    expect(presentationFor("settings", 390)).toEqual({
      kind: "sheet",
      options: {
        presentation: "formSheet",
        sheetAllowedDetents: [1],
        sheetGrabberVisible: true,
        sheetInitialDetentIndex: 0,
      },
    });
    expect(presentationFor("settings", 1180)).toEqual({ kind: "drawer", width: 400 });
    expect(DRAWER).toEqual({ width: 400, inset: 12, top: 12, radius: 28 });
  });
  it("closes the drawer on a swipe to the left (far or fast)", () => {
    expect(drawerCloses(-100, 0)).toBe(true);
    expect(drawerCloses(-30, -900)).toBe(true);
    expect(drawerCloses(-30, -100)).toBe(false);
    expect(drawerCloses(40, 0)).toBe(false);
  });
  it("presents Installation as a sheet on iPhone and a 390 pt inspector on iPad", () => {
    expect(presentationFor("installation", 390).kind).toBe("sheet");
    expect(presentationFor("installation", 1180)).toEqual({
      kind: "inspector",
      width: INSPECTOR_WIDTH,
    });
  });
  it("opens dialogs at the medium detent on iPhone", () => {
    expect(presentationFor("dialog", 390)).toMatchObject({
      options: { sheetAllowedDetents: [0.5, 1] },
    });
    expect(presentationFor("dialog", 1180)).toMatchObject({
      options: { sheetAllowedDetents: [1] },
    });
  });
  it("allows the left edge swipe only on phones", () => {
    expect(edgeSwipeEnabled("right", 390)).toBe(true);
    expect(edgeSwipeEnabled("right", 1180)).toBe(true);
    expect(edgeSwipeEnabled("left", 390)).toBe(true);
    expect(edgeSwipeEnabled("left", 1180)).toBe(false);
    expect(edgeSwipeOpens(40, 800, 390)).toBe(true);
    expect(edgeSwipeOpens(40, 0, 390)).toBe(false);
    expect(edgeSwipeOpens(120, 0, 390)).toBe(true);
  });
});

describe("menus and toasts", () => {
  it("puts destructive items last and keeps the rest in order", () => {
    const items = [{ id: "delete", destructive: true }, { id: "edit" }, { id: "dup" }];
    expect(orderMenuItems(items).map((i) => i.id)).toEqual(["edit", "dup", "delete"]);
  });
  it("keeps a toast for five seconds", () => {
    expect(TOAST_MS).toBe(5000);
  });
});

describe("media and actions", () => {
  it("computes hold progress", () => {
    expect(holdFraction(750, 1500)).toBe(0.5);
    expect(holdFraction(2000, 1500)).toBe(1);
    expect(holdFraction(10, 0)).toBe(1);
  });
  it("labels upload progress", () => {
    expect(uploadLabel(0.64)).toBe("64%");
    expect(uploadLabel(0.64, 3_300_000)).toBe("64% · 2.1 / 3.3 MB");
  });
  it("maps a touch to a track position", () => {
    expect(trackPosition(50, 200)).toBe(0.25);
    expect(trackPosition(-5, 200)).toBe(0);
    expect(trackPosition(10, 0)).toBe(0);
  });
});

describe("componentDocs", () => {
  it("renders every section and the Figma mapping table", () => {
    const md = componentDocs({
      purpose: "P.",
      use: ["u"],
      do: ["d"],
      dont: ["n"],
      a11y: ["a"],
      figma: {
        component: "Button",
        node: "10:19",
        variants: [["Variant=Primary", 'variant="primary"']],
      },
    });
    expect(md).toContain("### When to use");
    expect(md).toContain("**Don't:** n");
    expect(md).toContain("node-id=10-19");
    expect(md).toContain('| `Variant=Primary` | `variant="primary"` |');
    expect(md).not.toContain("### Anatomy");
  });
});

describe("manual pairing", () => {
  it("builds the bridge URL from an IP, host or full URL", () => {
    expect(manualPairing("192.168.1.20", "2468")).toEqual({
      ok: true,
      pairing: { bridge: "ws://192.168.1.20:8080/ws", pin: "2468" },
    });
    expect(manualPairing(" studio.local:9000 ", "2468")).toMatchObject({
      pairing: { bridge: "ws://studio.local:9000/ws" },
    });
    expect(manualPairing("wss://hall.example/ws", "123456")).toMatchObject({
      pairing: { bridge: "wss://hall.example/ws" },
    });
  });
  it("points at the field that is wrong", () => {
    expect(manualPairing("", "2468")).toMatchObject({ ok: false, field: "address" });
    expect(manualPairing("not an address!", "2468")).toMatchObject({ ok: false, field: "address" });
    expect(manualPairing("192.168.1.20", "12")).toMatchObject({ ok: false, field: "pin" });
    expect(manualPairing("192.168.1.20", "abcd")).toMatchObject({ ok: false, field: "pin" });
  });
});
