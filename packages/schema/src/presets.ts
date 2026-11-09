/**
 * Control presets: ready-made settings for a control type, so the studio picks "Brightness" instead
 * of configuring curve, range and behaviour by hand.
 *
 * - Built-in presets ship with the app (below). Their ids are namespaced by type: `fader/brightness`.
 * - Custom presets are saved by the studio in the builder and published inside the installation
 *   config (`presets`), so the app stays self-contained offline.
 * - A control references one with `preset`; any field set on the control wins over the preset.
 */

export interface ControlPreset {
  id: string;
  /** Control type the preset applies to. */
  type: string;
  label: string;
  description?: string | undefined;
  /** Default field values merged under the control's own fields. */
  props: Record<string, unknown>;
}

export const BUILTIN_PRESETS: readonly ControlPreset[] = [
  // Faders — relative response by default (schema default), so none of these jump on touch.
  {
    id: "fader/brightness",
    type: "fader",
    label: "Brightness",
    description: "0–1, log curve: fine control in the dark end.",
    props: { min: 0, max: 1, curve: "log", default: 0.8 },
  },
  {
    id: "fader/volume",
    type: "fader",
    label: "Volume",
    description: "0–1, log curve like an audio taper.",
    props: { min: 0, max: 1, curve: "log", default: 0.7 },
  },
  {
    id: "fader/opacity",
    type: "fader",
    label: "Opacity",
    description: "0–1, linear.",
    props: { min: 0, max: 1, curve: "linear", default: 1 },
  },
  {
    id: "fader/speed",
    type: "fader",
    label: "Speed",
    description: "0–4×, 0.05 steps, double-tap back to 1×.",
    props: { min: 0, max: 4, step: 0.05, default: 1, unit: "×" },
  },
  {
    id: "fader/pan",
    type: "fader",
    label: "Pan / balance",
    description: "−1…1 from the centre, horizontal.",
    props: { min: -1, max: 1, centered: true, default: 0, orientation: "horizontal" },
  },
  {
    id: "fader/crossfade",
    type: "fader",
    label: "Crossfade",
    description: "A↔B mix 0–1 with a centre detent, horizontal, sent on every move.",
    props: {
      mode: "crossfade",
      min: 0,
      max: 1,
      default: 0.5,
      orientation: "horizontal",
      throttleHz: 60,
      labels: { a: "A", b: "B" },
    },
  },
  {
    id: "fader/jog",
    type: "fader",
    label: "Jog wheel",
    description: "Endless, sends ± change; a full track = 1.",
    props: { mode: "relative", min: 0, max: 1, orientation: "horizontal", showValue: false },
  },
  {
    id: "fader/count",
    type: "fader",
    label: "Count",
    description: "Whole numbers 0–100, sent as int.",
    props: { min: 0, max: 100, step: 1, int: true, default: 0 },
  },

  // Knobs
  {
    id: "knob/hue",
    type: "knob",
    label: "Hue shift",
    description: "−180…180°, centred.",
    props: { min: -180, max: 180, centered: true, default: 0, unit: "°" },
  },
  {
    id: "knob/rotation",
    type: "knob",
    label: "Rotation",
    description: "0–360°.",
    props: { min: 0, max: 360, default: 0, unit: "°" },
  },
  {
    id: "knob/amount",
    type: "knob",
    label: "Amount",
    description: "0–1, default in the middle.",
    props: { min: 0, max: 1, default: 0.5 },
  },
  {
    id: "knob/encoder",
    type: "knob",
    label: "Endless encoder",
    description: "Sends ± change; one turn of travel = 1.",
    props: { mode: "relative", min: 0, max: 1, showValue: false },
  },
  {
    id: "knob/color-hue",
    type: "knob",
    label: "Colour hue",
    description: "Colour wheel, 0–360°, wraps around.",
    props: { mode: "hue", travel: 360, default: 0, unit: "°" },
  },
  {
    id: "knob/temperature",
    type: "knob",
    label: "Colour temperature",
    description: "2700–6500 K in 100 K steps, sent as int.",
    props: { min: 2700, max: 6500, step: 100, int: true, default: 4000, unit: "K" },
  },

  // XY
  {
    id: "xy/position",
    type: "xy",
    label: "Position",
    description: "0–1 on both axes.",
    props: { x: { min: 0, max: 1 }, y: { min: 0, max: 1 } },
  },
  {
    id: "xy/centered",
    type: "xy",
    label: "Centred position",
    description: "−1…1 on both axes, stays where released.",
    props: { x: { min: -1, max: 1 }, y: { min: -1, max: 1 } },
  },
  {
    id: "xy/joystick",
    type: "xy",
    label: "Joystick",
    description: "−1…1, springs back to the centre.",
    props: { x: { min: -1, max: 1 }, y: { min: -1, max: 1 }, springBack: true },
  },

  // Buttons and toggles
  {
    id: "button/momentary",
    type: "button",
    label: "Momentary",
    description: "1 while pressed, 0 on release.",
    props: { press: [1], release: [0] },
  },
  {
    id: "button/trigger",
    type: "button",
    label: "Trigger",
    description: "Sends 1 on press, nothing on release.",
    props: { press: [1], release: [] },
  },
  {
    id: "toggle/on-off",
    type: "toggle",
    label: "On / off",
    description: "1 / 0.",
    props: { on: [1], off: [0] },
  },
  {
    id: "toggle/boolean",
    type: "toggle",
    label: "True / false",
    description: "OSC T / F.",
    props: { on: [true], off: [false] },
  },
  {
    id: "toggle/switch",
    type: "toggle",
    label: "Switch",
    description: "Hardware-style switch with ON / OFF LEDs, 1 / 0.",
    props: { style: "switch", on: [1], off: [0] },
  },

  // Joystick, media, generative
  {
    id: "thumbstick/camera",
    type: "thumbstick",
    label: "Camera move",
    description: "60 Hz while held, small dead zone.",
    props: { rateHz: 60, deadzone: 0.08 },
  },
  {
    id: "gyroscope/steer",
    type: "gyroscope",
    label: "Steer",
    description: "±20° reaches the edge: small wrist moves, 30 Hz.",
    props: { range: 20, rateHz: 30 },
  },
  {
    id: "gyroscope/sway",
    type: "gyroscope",
    label: "Sway",
    description: "±45° for big, relaxed gestures, 30 Hz.",
    props: { range: 45, rateHz: 30 },
  },
  {
    id: "image/screen",
    type: "image",
    label: "Screen image",
    description: "16:9, cover, kept in the library.",
    props: { aspect: "16:9", fit: "cover", library: true },
  },
  {
    id: "image/poster",
    type: "image",
    label: "Poster",
    description: "9:16, contain.",
    props: { aspect: "9:16", fit: "contain" },
  },
  {
    id: "mic/level",
    type: "mic",
    label: "Mic level",
    description: "Loudness only, 30 Hz.",
    props: { outputs: ["level"], rateHz: 30 },
  },
  {
    id: "mic/full",
    type: "mic",
    label: "Mic analysis",
    description: "Level, 8 bands and beats, 30 Hz.",
    props: { outputs: ["level", "bands", "beat"], bands: 8, rateHz: 30 },
  },
  {
    id: "prompt/blend",
    type: "prompt",
    label: "Prompt blend",
    description: "Two prompts mixed A↔B.",
    props: { blend: true },
  },
  {
    id: "prompt/single",
    type: "prompt",
    label: "Single prompt",
    description: "One prompt at a time.",
    props: { blend: false },
  },

  // Safety
  {
    id: "holdToConfirm/blackout",
    type: "holdToConfirm",
    label: "Blackout",
    description: "Hold 1.5 s, critical styling.",
    props: { holdMs: 1500, tone: "critical", args: [1] },
  },
  {
    id: "holdToConfirm/restart",
    type: "holdToConfirm",
    label: "Restart",
    description: "Hold 3 s, critical styling.",
    props: { holdMs: 3000, tone: "critical", args: [1] },
  },
  {
    id: "holdToConfirm/next",
    type: "holdToConfirm",
    label: "Next / GO",
    description: "Hold 0.8 s, normal styling.",
    props: { holdMs: 800, tone: "default", args: [1] },
  },

  // Display
  {
    id: "meter/audio",
    type: "meter",
    label: "Audio level",
    description: "0–1, warning at 0.75, critical at 0.95.",
    props: { min: 0, max: 1, warnAt: 0.75, criticalAt: 0.95 },
  },
  {
    id: "meter/load",
    type: "meter",
    label: "Load",
    description: "0–100 %, warning at 80, critical at 95.",
    props: { min: 0, max: 100, warnAt: 80, criticalAt: 95 },
  },
  {
    id: "label/fps",
    type: "label",
    label: "FPS",
    description: "Shows “59.9 fps”.",
    props: { format: "{value} fps", size: "lg" },
  },
  {
    id: "label/status",
    type: "label",
    label: "Status text",
    description: "Large status line.",
    props: { size: "md" },
  },

  // Grids, scenes, colour
  {
    id: "buttonGrid/cues",
    type: "buttonGrid",
    label: "Cue pads",
    description: "One lit pad at a time.",
    props: { mode: "radio" },
  },
  {
    id: "buttonGrid/pads",
    type: "buttonGrid",
    label: "Momentary pads",
    description: "Lit while held.",
    props: { mode: "momentary" },
  },
  {
    id: "sceneList/crossfade",
    type: "sceneList",
    label: "Scenes with crossfade",
    description: "Sends scene + 2 s crossfade.",
    props: { crossfade: 2 },
  },
  {
    id: "colorPicker/hsb-unit",
    type: "colorPicker",
    label: "H S B 0–1",
    description: "Three addresses, hue 0–1.",
    props: { format: "hsb", hueRange: "unit" },
  },
  {
    id: "colorPicker/hsv",
    type: "colorPicker",
    label: "HSV, one message",
    description: "h s v floats 0–1.",
    props: { format: "hsvFloat" },
  },
  {
    id: "colorPicker/rgb",
    type: "colorPicker",
    label: "RGB 0–1",
    description: "Three floats.",
    props: { format: "rgbFloat" },
  },
  {
    id: "colorPicker/rgb255",
    type: "colorPicker",
    label: "RGB 0–255",
    description: "Three ints.",
    props: { format: "rgbInt" },
  },
  {
    id: "colorPicker/hex",
    type: "colorPicker",
    label: "Hex string",
    description: "“#RRGGBB”.",
    props: { format: "hex" },
  },
];

export const BUILTIN_PRESET_IDS = new Set(BUILTIN_PRESETS.map((p) => p.id));

export interface PresetIssue {
  path: (string | number)[];
  message: string;
}

/**
 * Merge preset fields under each control that references one. Runs before validation, so a control
 * built from a preset is validated exactly like a hand-written one. Explicit control fields win.
 */
export function resolvePresets(input: unknown): { value: unknown; issues: PresetIssue[] } {
  const issues: PresetIssue[] = [];
  if (!isObj(input) || !Array.isArray(input.pults)) return { value: input, issues };

  const custom = Array.isArray(input.presets) ? (input.presets as unknown[]) : [];
  const byId = new Map<string, ControlPreset>(BUILTIN_PRESETS.map((p) => [p.id, p]));
  custom.forEach((p, i) => {
    if (!isObj(p) || typeof p.id !== "string") return; // shape errors are reported by the schema
    if (BUILTIN_PRESET_IDS.has(p.id))
      issues.push({
        path: ["presets", i, "id"],
        message: `"${p.id}" is a built-in preset id; pick another id`,
      });
    else byId.set(p.id, p as unknown as ControlPreset);
  });

  const pults = (input.pults as unknown[]).map((pult, pi) => {
    if (!isObj(pult) || !Array.isArray(pult.pages)) return pult;
    const pages = (pult.pages as unknown[]).map((page, gi) => {
      if (!isObj(page) || !Array.isArray(page.controls)) return page;
      const controls = (page.controls as unknown[]).map((c, ci) => {
        if (!isObj(c) || typeof c.preset !== "string") return c;
        const path = ["pults", pi, "pages", gi, "controls", ci, "preset"];
        const p = byId.get(c.preset);
        if (!p) {
          issues.push({ path, message: `Unknown preset "${c.preset}"` });
          return c;
        }
        if (typeof c.type === "string" && c.type !== p.type) {
          issues.push({ path, message: `Preset "${p.id}" is for ${p.type}, not ${c.type}` });
          return c;
        }
        return { ...p.props, type: p.type, ...c };
      });
      return { ...page, controls };
    });
    return { ...pult, pages };
  });
  return { value: { ...input, pults }, issues };
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
