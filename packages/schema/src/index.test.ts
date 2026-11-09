import { describe, expect, it } from "vitest";
import demo from "../examples/demo-installation.json";
import tryDemo from "../examples/try-the-demo.json";
import legacy from "../examples/legacy-v1-installation.json";
import {
  CONTROL_TYPES,
  Control,
  PromptPreset,
  SCHEMA_VERSION,
  actionsOf,
  migrateConfig,
  parseConfig,
  targetOf,
  type ControlOf,
  type InstallationConfig,
} from "./index";

const clone = <T>(v: T): T => structuredClone(v);
const ok = (input: unknown): InstallationConfig => {
  const r = parseConfig(input);
  if (!r.ok) throw new Error(JSON.stringify(r, null, 2));
  return r.config;
};
const controls = (cfg: InstallationConfig) =>
  cfg.pults.flatMap((p) => p.pages.flatMap((g) => g.controls));
const find = <T extends ControlOf<any>["type"]>(cfg: InstallationConfig, id: string) =>
  controls(cfg).find((c) => c.id === id) as ControlOf<T>;
const grid = { x: 0, y: 0, w: 2, h: 2 };

describe("parseConfig", () => {
  it("accepts the demo installation and covers every control type", () => {
    const cfg = ok(demo);
    expect(cfg.schemaVersion).toBe(2);
    const used = new Set(controls(cfg).map((c) => c.type));
    expect([...used].sort()).toEqual([...CONTROL_TYPES].sort());
    expect(CONTROL_TYPES).toHaveLength(18);
  });

  it("fills defaults", () => {
    const fader = find<"fader">(ok(demo), "speed");
    expect(fader).toMatchObject({
      type: "fader",
      mode: "absolute",
      throttleHz: 60,
      sendOn: "change",
      orientation: "vertical",
      lock: false,
    });
  });

  it("reports a newer schema separately so the app keeps its cached revision", () => {
    expect(parseConfig({ ...clone(demo), schemaVersion: SCHEMA_VERSION + 1 })).toEqual({
      ok: false,
      reason: "newer-schema",
      schemaVersion: SCHEMA_VERSION + 1,
    });
  });

  it("turns an unknown control type into a placeholder instead of failing the pult", () => {
    const cfg = clone(demo) as any;
    const page = cfg.pults[0].pages[0];
    page.controls.push({ id: "future", type: "spectrogram", bins: 64 });
    page.layout.tablet.future = { x: 0, y: 9, w: 4, h: 2 };
    page.layout.phone.future = { x: 0, y: 20, w: 12, h: 2 };
    expect(ok(cfg).pults[0]!.pages[0]!.controls.at(-1)).toEqual({
      id: "future",
      type: "unsupported",
      originalType: "spectrogram",
    });
  });

  it("rejects invalid addresses, unknown targets, duplicates and grid overflow", () => {
    const cfg = clone(demo) as any;
    const page = cfg.pults[0].pages[0];
    page.controls[0].address = "wall intensity";
    page.controls[1].target = "nope";
    page.controls[2].id = "intensity";
    page.layout.tablet.hue = { x: 10, y: 0, w: 4, h: 2 };
    const r = parseConfig(cfg);
    expect(r.ok).toBe(false);
    if (r.ok || r.reason !== "invalid") return;
    const msgs = r.issues.map((i) => i.message).join("\n");
    expect(msgs).toMatch(/OSC address/);
    expect(msgs).toMatch(/Unknown target "nope"/);
    expect(msgs).toMatch(/Duplicate control id "intensity"/);
    expect(msgs).toMatch(/"hue" overflows the 12-column tablet grid/);
  });

  it("blocks a brand that fails contrast", () => {
    const cfg = clone(demo) as any;
    cfg.theme.primary = "#121214";
    const r = parseConfig(cfg);
    expect(r.ok).toBe(false);
    if (!r.ok && r.reason === "invalid")
      expect(r.issues.some((i) => i.path === "theme.primary")).toBe(true);
  });

  it("theme.splash: optional loading-screen image, an asset path or URL", () => {
    expect(ok(demo).theme.splash).toBe("demo-splash.jpg");
    const none = clone(demo) as any;
    delete none.theme.splash;
    expect(ok(none).theme.splash).toBeUndefined();
    const url = clone(demo) as any;
    url.theme.splash = "https://cdn.example.com/lobby.jpg";
    expect(ok(url).theme.splash).toBe("https://cdn.example.com/lobby.jpg");
    for (const bad of ["", "javascript:alert(1)", "data:image/png;base64,AAAA"]) {
      const cfg = clone(demo) as any;
      cfg.theme.splash = bad;
      expect(parseConfig(cfg).ok, bad).toBe(false);
    }
  });

  it("resolves targets", () => {
    const cfg = ok(demo);
    const pult = cfg.pults[0]!;
    expect(targetOf(cfg, pult, pult.pages[0]!.controls[0]!)?.port).toBe(7000);
  });
});

describe("schema v2 layouts (ADR-014)", () => {
  it("every page has a phone and a tablet layout", () => {
    for (const p of ok(demo).pults)
      for (const page of p.pages)
        for (const c of page.controls) {
          expect(page.layout.phone[c.id], `${page.id}/${c.id} phone`).toBeDefined();
          expect(page.layout.tablet[c.id], `${page.id}/${c.id} tablet`).toBeDefined();
        }
  });

  it("requires a placement for every control and rejects placements of unknown controls", () => {
    const cfg = clone(demo) as any;
    const page = cfg.pults[0].pages[0];
    delete page.layout.phone.intensity;
    page.layout.tablet.ghost = { x: 0, y: 0, w: 1, h: 1 };
    const r = parseConfig(cfg);
    if (r.ok || r.reason !== "invalid") throw new Error("expected invalid");
    const msgs = r.issues.map((i) => i.message).join("\n");
    expect(msgs).toMatch(/"intensity" has no phone placement/);
    expect(msgs).toMatch(/tablet layout places unknown control or panel "ghost"/);
  });

  it("places Console Panels (Figma patterns) instead of their controls", () => {
    const cfg = ok(tryDemo);
    const mix = cfg.pults[0]!.pages[0]!;
    expect(mix.panels.map((p) => p.pattern)).toEqual([
      "faderBank",
      "knobGroup",
      "layerToggles",
      "cameraControl",
      "sceneBar",
    ]);
    expect(mix.layout.tablet.mix).toEqual({ x: 0, y: 0, w: 4, h: 8 });
    expect(mix.layout.tablet.layer1).toBeUndefined();
    expect(cfg.pults.map((p) => p.formFactor)).toEqual(["tablet", undefined, "phone"]);
  });

  it("rejects a control placed twice, or not at all, through panels", () => {
    const twice = clone(tryDemo) as any;
    twice.pults[0].pages[0].layout.tablet.layer1 = { x: 0, y: 8, w: 1, h: 1 };
    const none = clone(tryDemo) as any;
    delete none.pults[0].pages[0].layout.phone.camera;
    const unknown = clone(tryDemo) as any;
    unknown.pults[0].pages[0].panels[0].controls.push("ghost");
    const clash = clone(tryDemo) as any;
    clash.pults[0].pages[0].panels[0].id = "layer1";
    const msgs = (c: unknown) => {
      const r = parseConfig(c);
      if (r.ok || r.reason !== "invalid") throw new Error("expected invalid");
      return r.issues.map((i) => i.message).join("\n");
    };
    expect(msgs(twice)).toMatch(/"layer1" is placed 2 times in the tablet layout/);
    expect(msgs(none)).toMatch(/"cam" has no phone placement/);
    expect(msgs(unknown)).toMatch(/Panel "mix" has unknown control "ghost"/);
    expect(msgs(clash)).toMatch(/Panel id "layer1" is also a control id/);
  });

  it("reads icons on segmented options and toggles, the LED toggle and the picker style", () => {
    const page = ok(tryDemo).pults[0]!.pages[0]!;
    const scene = page.controls.find((c) => c.id === "scene");
    expect(scene?.type === "segmented" && scene.options.map((o) => o.icon)).toEqual([
      "lightning",
      "sun",
      "moon",
      "circle-half",
    ]);
    const on = page.controls.find((c) => c.id === "layer3-on");
    expect(on?.type === "toggle" && on.style).toBe("led");
    const fx = ok(tryDemo).pults[0]!.pages[1]!.controls.find((c) => c.id === "colour");
    expect(fx?.type === "colorPicker" && fx.pickerStyle).toBe("knobs");
    const bad = clone(tryDemo) as any;
    bad.pults[0].pages[1].controls[0].pickerStyle = "spiral";
    expect(parseConfig(bad).ok).toBe(false);
  });

  it("reads the removed wheel picker as the square one and keeps its sliders", () => {
    const c = Control.parse({
      id: "tint",
      type: "colorPicker",
      address: "/tint",
      pickerStyle: "wheel",
      sliders: ["brightness"],
    });
    expect(c.type === "colorPicker" && [c.pickerStyle, c.sliders]).toEqual([
      "square",
      ["brightness"],
    ]);
    expect(
      Control.safeParse({ id: "t", type: "colorPicker", address: "/t", sliders: ["alpha"] })
        .success,
    ).toBe(false);
  });

  it("still reads v1: grid becomes the tablet layout and is re-flowed for phones", () => {
    const cfg = ok(legacy);
    expect(cfg.schemaVersion).toBe(2);
    const page = cfg.pults[0]!.pages[0]!;
    expect(page.layout.tablet.intensity).toEqual({ x: 0, y: 0, w: 2, h: 6 });
    expect(page.layout.tablet.position).toEqual({ x: 4, y: 0, w: 5, h: 6 });
    // Narrow controls take half a row on phones, wide ones a full row.
    expect(page.layout.phone.intensity).toEqual({ x: 0, y: 0, w: 6, h: 6 });
    expect(page.layout.phone.speed).toEqual({ x: 6, y: 0, w: 6, h: 6 });
    expect(page.layout.phone.position!.w).toBe(12);
    expect("grid" in page.controls[0]!).toBe(false);
  });

  it("colour pickers default to three addresses; v1 ones keep their single rgb message", () => {
    expect(find<"colorPicker">(ok(demo), "tint")).toMatchObject({
      format: "hsb",
      hueRange: "degrees",
    });
    expect(find<"colorPicker">(ok(legacy), "tint").format).toBe("rgbFloat");
    const explicit = clone(legacy) as any;
    for (const pg of explicit.pults[0].pages)
      for (const c of pg.controls) if (c.id === "tint") c.format = "hex";
    expect(find<"colorPicker">(ok(explicit), "tint").format).toBe("hex");
  });

  it("migration leaves v2 and unrecognisable input untouched", () => {
    expect(migrateConfig(demo)).toBe(demo);
    expect(migrateConfig(null)).toBe(null);
    expect(migrateConfig({ schemaVersion: 1 })).toEqual({ schemaVersion: 1 });
  });

  it("a v1 control without a grid is reported, not dropped", () => {
    const cfg = clone(legacy) as any;
    delete cfg.pults[0].pages[0].controls[0].grid;
    const r = parseConfig(cfg);
    if (r.ok || r.reason !== "invalid") throw new Error("expected invalid");
    expect(r.issues.map((i) => i.message)).toContain(`Control "intensity" has no phone placement`);
  });
});

describe("installation actions and targets (ADR-016)", () => {
  it("defaults: flash, restart, blackout, idle; pause is opt-in; actions must be unique", () => {
    expect(actionsOf(ok(demo))).toEqual(["flash", "restart", "blackout", "idle"]);
    const withPause = clone(demo) as any;
    withPause.installation.actions = ["flash", "pause"];
    expect(actionsOf(ok(withPause))).toEqual(["flash", "pause"]);
    withPause.installation.actions = ["flash", "flash"];
    expect(parseConfig(withPause).ok).toBe(false);
  });

  it("targets ping /sys/ping by default, accept discovery and supervisor fields", () => {
    expect(ok(demo).targets[0]!.heartbeat).toBe("/sys/ping");
    const cfg = clone(demo) as any;
    cfg.targets[0] = {
      ...cfg.targets[0],
      protocol: "tcp",
      heartbeat: false,
      discovery: { name: "Lobby TD" },
      runtime: { app: "touchdesigner", project: "wall.toe" },
    };
    const t = ok(cfg).targets[0]!;
    expect(t).toMatchObject({ protocol: "tcp", heartbeat: false, discovery: { name: "Lobby TD" } });
    expect(t.runtime).toMatchObject({ perform: true, hangTimeoutS: 15, startupGraceS: 60 });
  });
});

describe("new control types (ADR-015)", () => {
  const cfg = ok(demo);

  it("fader modes: crossfade with labels and detent, relative jog", () => {
    expect(find<"fader">(cfg, "xfade")).toMatchObject({
      mode: "crossfade",
      labels: { a: "Day", b: "Night" },
      detent: 0.04,
      default: 0.5,
      orientation: "horizontal",
    });
    expect(find<"fader">(cfg, "jog").mode).toBe("relative");
  });

  it("knob modes and travel (240° by default)", () => {
    expect(find<"knob">(cfg, "hue")).toMatchObject({ mode: "absolute", travel: 240 });
    expect(find<"knob">(cfg, "zoom").mode).toBe("relative");
    expect(find<"knob">(cfg, "color")).toMatchObject({ mode: "hue", travel: 360 });
    const bad = Control.safeParse({ id: "k", type: "knob", address: "/k", travel: 400 });
    expect(bad.success).toBe(false);
  });

  it("toggle style switch", () => {
    expect(find<"toggle">(cfg, "strobe").style).toBe("switch");
    expect(find<"toggle">(cfg, "logo").style).toBe("button");
  });

  it("pad sizes, picture pads and compact knobs (Figma Size / Content=Image)", () => {
    expect(find<"toggle">(cfg, "visual")).toMatchObject({ image: "demo-pad.jpg", style: "button" });
    expect(find<"toggle">(cfg, "visual").size).toBeUndefined();
    expect(find<"button">(cfg, "flash").size).toBe("regular");
    expect(find<"knob">(cfg, "zoom").size).toBe("compact");
    expect(find<"knob">(cfg, "hue").size).toBe("regular");
    const parse = (c: object) => Control.safeParse({ id: "p", address: "/p", ...c }).success;
    expect(parse({ type: "button", size: "compact" })).toBe(true);
    expect(parse({ type: "button", size: "huge" })).toBe(false);
    expect(parse({ type: "toggle", image: "https://cdn.example.com/a.jpg", size: "compact" })).toBe(
      true,
    );
    expect(parse({ type: "toggle", image: "javascript:alert(1)" })).toBe(false);
    expect(parse({ type: "knob", size: "compact" })).toBe(true);
  });

  it("buttonGroup: unique button ids, defaults must exist", () => {
    expect(find<"buttonGroup">(cfg, "layers").default).toEqual(["particles"]);
    const r = Control.safeParse({
      id: "g",
      type: "buttonGroup",
      buttons: [
        { id: "a", label: "A", address: "/a" },
        { id: "a", label: "A2", address: "/a2" },
      ],
      default: ["z"],
    });
    expect(r.success).toBe(false);
    const msgs = r.error!.issues.map((i) => i.message).join("\n");
    expect(msgs).toMatch(/Duplicate button "a"/);
    expect(msgs).toMatch(/Unknown button "z"/);
  });

  it("thumbstick defaults", () => {
    expect(
      Control.parse({ id: "t", type: "thumbstick", address: "/t" }) as ControlOf<"thumbstick">,
    ).toMatchObject({ rateHz: 30, deadzone: 0.1 });
    expect(find<"thumbstick">(cfg, "cam")).toMatchObject({ rateHz: 60, press: "/live/cam/reset" });
  });

  it("image defaults and limits", () => {
    expect(Control.parse({ id: "i", type: "image", address: "/i" })).toMatchObject({
      aspect: "free",
      formats: ["jpeg", "png", "webp", "heic"],
      maxMB: 10,
      fit: "cover",
      library: true,
    });
    expect(
      Control.safeParse({ id: "i", type: "image", address: "/i", formats: ["bmp"] }).success,
    ).toBe(false);
    expect(find<"image">(cfg, "photo").aspect).toBe("16:9");
  });

  it("mic defaults; outputs must be unique", () => {
    expect(Control.parse({ id: "m", type: "mic", address: "/m" })).toMatchObject({
      rateHz: 30,
      outputs: ["level"],
      gain: 1,
      bands: 8,
    });
    expect(
      Control.safeParse({ id: "m", type: "mic", address: "/m", outputs: ["level", "level"] })
        .success,
    ).toBe(false);
    expect(find<"mic">(cfg, "mic").outputs).toEqual(["level", "bands", "beat"]);
  });

  it("prompt defaults; presets are bridge state, not config", () => {
    expect(Control.parse({ id: "p", type: "prompt", address: "/p" })).toMatchObject({
      blend: true,
      maxLength: 500,
      default: 0,
    });
    expect(
      PromptPreset.parse({
        id: "p1",
        pultId: "live",
        controlId: "prompt",
        label: "Forest",
        text: "misty forest at dawn",
        createdAt: "2026-10-21T00:00:00Z",
        updatedAt: "2026-10-21T00:00:00Z",
      }).on,
    ).toBe(true);
  });
});

describe("enabledWhen (Figma “Depends on”, ADR-014)", () => {
  it("is optional and holds control = value conditions", () => {
    expect(Control.parse({ id: "f", type: "button", address: "/f" }).enabledWhen).toBeUndefined();
    expect(
      Control.parse({
        id: "f",
        type: "button",
        address: "/f",
        enabledWhen: [{ control: "blackout", equals: 0 }],
      }).enabledWhen,
    ).toEqual([{ control: "blackout", equals: 0 }]);
    expect(
      Control.safeParse({
        id: "f",
        type: "button",
        address: "/f",
        enabledWhen: [{ control: "bad id!" }],
      }).success,
    ).toBe(false);
  });
});
