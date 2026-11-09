import { isValidAddress } from "@osc/core";
import { checkBrand } from "@osc/tokens";
import { z } from "zod";
import { migrateConfig } from "./migrate";
import { resolvePresets } from "./presets";

export * from "./presets";
export * from "./layout";
export { migrateConfig } from "./migrate";

/**
 * Installation config — the "build" a client receives after login.
 * Published by the studio from the builder as a numbered revision; rendered by the app,
 * the local web pult (served by the bridge) and the cloud web pult. Platform-agnostic.
 */
export const SCHEMA_VERSION = 2;
/** Oldest schema this app still reads; older-but-supported configs are migrated on parse. */
export const MIN_SCHEMA_VERSION = 1;

const id = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/i, "ids: letters, digits, - and _, max 64");
const hex = z.string().regex(/^#([0-9a-f]{6}|[0-9a-f]{8})$/i, "hex colour like #C6FF3D");
const address = z
  .string()
  .refine(isValidAddress, "OSC address must start with / and contain no spaces or # * , ? [ ] { }");
/** `/scene/{index}` style templates are allowed; `{…}` is filled at send time. */
const addressTemplate = z
  .string()
  .refine((a) => isValidAddress(a.replace(/\{[a-z]+\}/gi, "x")), "OSC address template is invalid");
const oscValue = z.union([z.number(), z.string(), z.boolean(), z.null()]);

/**
 * How Otakoyi Runtime starts and watches the software behind a target (ADR 011). Optional: a target
 * without it is just an OSC address the bridge talks to.
 */
export const TargetRuntime = z.object({
  app: z.enum(["touchdesigner", "touchplayer", "command"]),
  /**
   * Path to the TouchDesigner / TouchPlayer executable. Default: the standard install location on
   * Windows / macOS (see apps/bridge/src/process-supervisor.ts).
   */
  executable: z.string().min(1).optional(),
  /** Project file (.toe), absolute or relative to the runtime folder, e.g. "installation.toe". */
  project: z.string().min(1).optional(),
  /** Exact TouchDesigner build the project was made with, e.g. "2025.33070". */
  version: z.string().optional(),
  /** For app "command": executable and arguments. */
  command: z.array(z.string()).optional(),
  /**
   * Start in perform mode (no editor). TouchPlayer always is; for TouchDesigner the supervisor sets
   * OTAKOYI_PERFORM=1 and the project switches itself (or uses "Start in Perform Mode").
   */
  perform: z.boolean().default(true),
  /** @deprecated Any feedback from the target now counts as alive (ADR-016); still accepted. */
  heartbeat: z.string().startsWith("/").optional(),
  restartOnCrash: z.boolean().default(true),
  /** No feedback for this long while running = hung → restart. 0 = never. */
  hangTimeoutS: z.number().min(0).max(600).default(15),
  /** Time a freshly started project gets before hang detection starts (TD loads slowly). */
  startupGraceS: z.number().min(0).max(600).default(60),
});

/** Installation actions a pult may trigger (ADR-013, ADR-016). */
export const INSTALLATION_ACTIONS = ["flash", "restart", "blackout", "idle", "pause"] as const;
export type InstallationAction = (typeof INSTALLATION_ACTIONS)[number];
/** Without `installation.actions`: everything except the optional Pause. */
export const DEFAULT_ACTIONS: InstallationAction[] = ["flash", "restart", "blackout", "idle"];

export const Target = z.object({
  id,
  name: z.string().min(1),
  protocol: z.enum(["udp", "tcp"]).default("udp"),
  /** "auto" = discover via the bridge / mDNS. */
  host: z.union([z.literal("auto"), z.string().min(1)]).default("auto"),
  port: z.number().int().min(1).max(65535),
  /** Tried in order when `host: "auto"` finds nothing (or the found host goes offline). */
  fallbackHosts: z.array(z.string()).default([]),
  /** For `host: "auto"`: the mDNS `_osc._udp` service name to pick (default: the first found). */
  discovery: z.object({ name: z.string().min(1).optional() }).optional(),
  /** UDP feedback port. TCP targets send feedback on the same connection. */
  feedbackPort: z.number().int().min(1).max(65535).optional(),
  /**
   * Address the bridge sends once a second so the installation can answer (any feedback counts
   * as alive). `false` = no ping.
   */
  heartbeat: z.union([address, z.literal(false)]).default("/sys/ping"),
  runtime: TargetRuntime.optional(),
});

export const Theme = z
  .object({
    mode: z.enum(["dark", "light"]).default("dark"),
    primary: hex.optional(),
    onPrimary: hex.optional(),
    accent: hex.optional(),
    background: hex.optional(),
    surface: hex.optional(),
    /** Figma Brand mode colours (exporter `--brand`, ADR-014); derived from primary when missing. */
    primaryPressed: hex.optional(),
    primarySubtle: hex.optional(),
    onAccent: hex.optional(),
    /** Primary darkened to ≥ 3:1 on the light background, for lines and LEDs in light mode. */
    primarySignalLight: hex.optional(),
    font: z.string().optional(),
    /** Asset paths relative to the config's asset bundle. */
    logo: z.string().optional(),
    icon: z.string().optional(),
    /**
     * Full-screen image of the client-branded loading screen (ADR-012, ADR-013): an asset path
     * relative to the config's asset bundle, or an http(s) URL. Without it the loading screen uses
     * the plain background. Set by the studio only (ADR-004).
     */
    splash: z
      .string()
      .min(1)
      .max(2048)
      .refine((s) => !/^(javascript|data|file):/i.test(s.trim()), "splash: an asset path or URL")
      .optional(),
  })
  .superRefine((t, ctx) => {
    for (const issue of checkBrand(t)) {
      if (issue.level === "error")
        ctx.addIssue({ code: "custom", path: [issue.token], message: issue.message });
    }
  });

export const Grid = z.object({
  x: z.number().int().min(0).max(11),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1),
});

const curve = z.enum(["linear", "log", "exp"]);

const base = {
  id,
  /** Preset the control was built from (built-in or custom); its fields are merged before validation. */
  preset: z.string().optional(),
  label: z.string().optional(),
  target: id.optional(),
  /** Prevents accidental touches: control unlocks on long-press. */
  lock: z.boolean().default(false),
  /** Service controls visible only in studio sessions. */
  studioOnly: z.boolean().default(false),
  /** Address the installation sends state back on; defaults to the control's own address. */
  feedback: address.optional(),
  /**
   * Icon (Figma `Icon/<name>`, a Phosphor name in kebab case, e.g. "device-mobile"): shown where the
   * control is drawn as a list row (panel pattern `list`). Unknown names draw no icon.
   */
  icon: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/, "icon: a Phosphor icon name like device-mobile")
    .optional(),
  /**
   * Enable conditions from the Figma "Depends on" annotation (`when <control> = <value>`, ADR-014):
   * the control is usable only while every listed control holds that value; otherwise the pult
   * draws it in its Disabled state (`isEnabled` in `@osc/controls`).
   */
  enabledWhen: z.array(z.object({ control: id, equals: oscValue })).optional(),
};

const ranged = {
  address,
  min: z.number().default(0),
  max: z.number().default(1),
  step: z.number().positive().optional(),
  curve: curve.default("linear"),
  invert: z.boolean().default(false),
  throttleHz: z.number().min(1).max(240).default(60),
  sendOn: z.enum(["change", "release"]).default("change"),
  default: z.number().optional(),
  /** Integer instead of float on the wire. */
  int: z.boolean().default(false),
  /** Double-tap returns the control to `default` (or its initial value). */
  doubleTapReset: z.boolean().default(true),
  /** Two-finger drag moves this many times slower for precise adjustment. */
  fineFactor: z.number().min(0.01).max(1).default(0.2),
};

/**
 * Pad size (Figma `Size`): regular 150×88 pt, compact 104×64 pt; a picture pad is a square
 * 168 / 120 pt. Omitted: the pad fills its grid cell (configs from before sizes).
 */
export const PadSize = z.enum(["regular", "compact"]);
export type PadSize = z.infer<typeof PadSize>;

/** An image of the config's asset bundle (served by the bridge at `/brand/<path>`) or an http(s) URL. */
const assetRef = z
  .string()
  .min(1)
  .max(2048)
  .refine((s) => !/^(javascript|data|file):/i.test(s.trim()), "an asset path or URL");

export const Button = z.object({
  ...base,
  type: z.literal("button"),
  address,
  size: PadSize.optional(),
  /** Values sent on press / release. `release: undefined` sends nothing on release. */
  press: z.array(oscValue).default([1]),
  release: z.array(oscValue).optional().default([0]),
  icon: z.string().optional(),
});

export const Toggle = z.object({
  ...base,
  type: z.literal("toggle"),
  address,
  on: z.array(oscValue).default([1]),
  off: z.array(oscValue).default([0]),
  default: z.boolean().default(false),
  /**
   * button: a latching pad. switch: a hardware-style latching switch with two LEDs (ON / OFF).
   * led: a Group Button key — the label (or ON / OFF without one) over an LED strip; the channel
   * strip's ON button in a Fader Bank. Same messages in every style.
   */
  style: z.enum(["button", "switch", "led"]).default("button"),
  /** Pad size (style `button`). See `PadSize`. */
  size: PadSize.optional(),
  /**
   * Picture pad (style `button`): an image from the config's asset bundle or a URL. Drawn as a
   * square (168 / 120 pt) with the label on a legibility gradient; off dims the picture, on adds
   * the lit ring and LED. Ignored by `style: "switch"`.
   */
  image: assetRef.optional(),
});

export const Fader = z.object({
  ...base,
  ...ranged,
  type: z.literal("fader"),
  /**
   * What the fader sends (ADR-015):
   * - absolute (default): a value in min..max.
   * - relative: an endless jog wheel; sends the change since the last message (a full track of
   *   travel = max − min). There is no position, so `response`, `default` and reset do not apply.
   * - crossfade: bipolar A/B mix in min..max (0..1 by default) with a centre detent; `labels`
   *   names the two ends.
   */
  mode: z.enum(["absolute", "relative", "crossfade"]).default("absolute"),
  /**
   * How a touch maps to the value (ADR-007), for absolute and crossfade modes.
   * relative (default, safe): a touch never changes the value, only dragging moves it by the
   * distance dragged. absolute: the value jumps to the finger — opt in for non-critical parameters.
   */
  response: z.enum(["relative", "absolute"]).default("relative"),
  orientation: z.enum(["vertical", "horizontal"]).default("vertical"),
  /** Crossfade: names of the two ends, e.g. { a: "Day", b: "Night" }. */
  labels: z.object({ a: z.string().min(1), b: z.string().min(1) }).optional(),
  /** Crossfade: half-width of the centre detent as a share of the track (0 = no detent). */
  detent: z.number().min(0).max(0.25).default(0.04),
  /** Draw fill from the centre (bipolar values like pan). */
  centered: z.boolean().default(false),
  showValue: z.boolean().default(true),
  unit: z.string().optional(),
});

export const Knob = z.object({
  ...base,
  ...ranged,
  type: z.literal("knob"),
  /**
   * What the knob sends (ADR-015):
   * - absolute (default): a value in min..max over `travel` degrees.
   * - relative: endless encoder; sends the change since the last message (one `travel` = max − min).
   * - hue: colour wheel; sends the hue in degrees 0..360 and wraps past 360 (min/max are ignored).
   */
  mode: z.enum(["absolute", "relative", "hue"]).default("absolute"),
  /** Degrees of rotation from min to max, gap centred at the bottom. Figma library: 240°. */
  travel: z.number().min(30).max(360).default(240),
  /** Figma `Size`: compact draws the dial at ~0.7× (labels stay the same size). */
  size: z.enum(["regular", "compact"]).default("regular"),
  /** @deprecated v1 name for `mode: "relative"`; still read (see `knobMode`). */
  endless: z.boolean().default(false),
  centered: z.boolean().default(false),
  showValue: z.boolean().default(true),
  unit: z.string().optional(),
});

export const XYPad = z.object({
  ...base,
  type: z.literal("xy"),
  address,
  x: z
    .object({ min: z.number().default(0), max: z.number().default(1) })
    .default({ min: 0, max: 1 }),
  y: z
    .object({ min: z.number().default(0), max: z.number().default(1) })
    .default({ min: 0, max: 1 }),
  /** Spring back to centre on release. */
  springBack: z.boolean().default(false),
  throttleHz: z.number().min(1).max(240).default(60),
});

const option = z.object({
  label: z.string().min(1),
  value: oscValue,
  /** Figma Segmented Content=Icon: the option shows this icon (the label is its VoiceOver name). */
  icon: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/)
    .optional(),
});

export const Segmented = z.object({
  ...base,
  type: z.literal("segmented"),
  address,
  options: z.array(option).min(2).max(8),
  default: z.number().int().min(0).default(0),
});

export const ButtonGrid = z.object({
  ...base,
  type: z.literal("buttonGrid"),
  /** Template; `{row}`, `{col}` and `{index}` are filled per cell. */
  address: addressTemplate,
  rows: z.number().int().min(1).max(16),
  cols: z.number().int().min(1).max(16),
  mode: z.enum(["momentary", "toggle", "radio"]).default("momentary"),
  labels: z.array(z.string()).optional(),
});

export const SceneList = z.object({
  ...base,
  type: z.literal("sceneList"),
  address,
  scenes: z
    .array(
      z.object({ id, label: z.string().min(1), value: oscValue, thumbnail: z.string().optional() }),
    )
    .min(1),
  /** Optional crossfade time sent as a second argument, in seconds. */
  crossfade: z.number().min(0).optional(),
});

export const Label = z.object({
  ...base,
  type: z.literal("label"),
  text: z.string().default(""),
  /** If set, the text is replaced by values received on this address. */
  feedback: address.optional(),
  format: z.string().optional(),
  size: z.enum(["sm", "md", "lg", "xl"]).default("md"),
});

export const Meter = z.object({
  ...base,
  type: z.literal("meter"),
  feedback: address,
  min: z.number().default(0),
  max: z.number().default(1),
  orientation: z.enum(["vertical", "horizontal"]).default("vertical"),
  /** Thresholds switch colour to warning / critical status tokens. */
  warnAt: z.number().optional(),
  criticalAt: z.number().optional(),
});

export const HoldToConfirm = z.object({
  ...base,
  type: z.literal("holdToConfirm"),
  address,
  args: z.array(oscValue).default([1]),
  holdMs: z.number().int().min(500).max(5000).default(1500),
  tone: z.enum(["default", "critical"]).default("critical"),
});

export const ColorPicker = z.object({
  ...base,
  type: z.literal("colorPicker"),
  address,
  /**
   * Wire format. `hsb` (default): three addresses, `<address>/h`, `<address>/s`, `<address>/b`,
   * each sent only when its channel changes, with feedback accepted per channel. The single-message
   * formats are an explicit opt-in: `hsvFloat` (`<address> h s v`, floats 0–1), `rgbFloat`
   * (`r g b` 0–1), `rgbInt` (0–255) and `hex` (`"#RRGGBB"`).
   */
  format: z.enum(["hsb", "rgbFloat", "rgbInt", "hsvFloat", "hex"]).default("hsb"),
  /** `hsb` format: hue on `<address>/h` in degrees 0–360 (default) or normalised 0–1 (`unit`). */
  hueRange: z.enum(["degrees", "unit"]).default("degrees"),
  default: hex.optional(),
  /** Restrict to a palette (e.g. the client's brand colours): swatches instead of the pickers. */
  swatches: z.array(hex).optional(),
  /**
   * Figma Color Picker `Style`: which picker shows first — hue ring + saturation / brightness knobs,
   * a saturation × brightness square with a hue strip, or a hue × saturation wheel with a
   * brightness slider. The user can switch; their choice is kept on the device. Same value in all.
   */
  pickerStyle: z.enum(["knobs", "square", "wheel"]).optional(),
});

/** Multi-select latching buttons: each button toggles on its own and has its own address. */
export const ButtonGroup = z
  .object({
    ...base,
    type: z.literal("buttonGroup"),
    buttons: z
      .array(
        z.object({
          id,
          label: z.string().min(1),
          caption: z.string().optional(),
          address,
          /** Sent when the button turns on (default 1); 0 is sent when it turns off. */
          value: oscValue.optional(),
        }),
      )
      .min(1)
      .max(16),
    /** Buttons that start lit. */
    default: z.array(id).default([]),
  })
  .superRefine((c, ctx) => {
    const ids = new Set<string>();
    c.buttons.forEach((b, i) => {
      if (ids.has(b.id))
        ctx.addIssue({
          code: "custom",
          path: ["buttons", i, "id"],
          message: `Duplicate button "${b.id}"`,
        });
      ids.add(b.id);
    });
    c.default.forEach((d, i) => {
      if (!ids.has(d))
        ctx.addIssue({ code: "custom", path: ["default", i], message: `Unknown button "${d}"` });
    });
  });

/**
 * Relative 2-D joystick: springs back to the centre; while held it sends the x / y deflection
 * (−1..1, y up) at `rateHz`, and 0 0 once on release.
 */
export const Thumbstick = z.object({
  ...base,
  type: z.literal("thumbstick"),
  address,
  rateHz: z.number().min(1).max(120).default(30),
  /** Radial dead zone around the centre (share of the radius); outside it the travel is rescaled. */
  deadzone: z.number().min(0).max(0.5).default(0.1),
  /** Optional click (press the stick): sends 1 on press, 0 on release. */
  press: address.optional(),
});

/**
 * Gyroscope (device tilt): the phone becomes the controller. Switched on, it captures the current
 * pose as the centre and sends the tilt from it as x / y (−1..1, y up) at `rateHz`; `range` degrees
 * of tilt reach ±1, beyond that the value is clamped. Only the device holding control sends.
 */
export const Gyroscope = z.object({
  ...base,
  type: z.literal("gyroscope"),
  address,
  rateHz: z.number().min(1).max(60).default(30),
  /** Tilt (degrees from the captured centre) that reaches ±1 on each axis. */
  range: z.number().min(5).max(90).default(30),
});

export const IMAGE_FORMATS = ["jpeg", "png", "webp", "heic", "gif"] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];

/**
 * Image upload: the client picks a photo (or one from the installation's library); the bridge
 * validates and stores it, then sends `<address> <absolute path>` to the installation.
 */
export const ImageUpload = z.object({
  ...base,
  type: z.literal("image"),
  address,
  aspect: z.enum(["16:9", "4:3", "1:1", "9:16", "free"]).default("free"),
  formats: z.array(z.enum(IMAGE_FORMATS)).min(1).default(["jpeg", "png", "webp", "heic"]),
  maxMB: z.number().positive().max(100).default(10),
  fit: z.enum(["cover", "contain"]).default("cover"),
  /** Keep uploads in the installation's library so they can be picked again. */
  library: z.boolean().default(true),
});

export const MIC_OUTPUTS = ["level", "bands", "beat"] as const;
export type MicOutput = (typeof MIC_OUTPUTS)[number];

/**
 * On-device audio analysis. Audio never leaves the device: only the analysis is sent, under the
 * `address` prefix — `<address>/level f`, `<address>/bands f…`, `<address>/beat 1`.
 */
export const Mic = z
  .object({
    ...base,
    type: z.literal("mic"),
    address,
    rateHz: z.number().min(1).max(60).default(30),
    outputs: z.array(z.enum(MIC_OUTPUTS)).min(1).default(["level"]),
    /** Number of frequency bands when `bands` is an output. */
    bands: z.number().int().min(1).max(32).default(8),
    /** Input gain applied before analysis. */
    gain: z.number().min(0).max(16).default(1),
  })
  .superRefine((c, ctx) => {
    if (new Set(c.outputs).size !== c.outputs.length)
      ctx.addIssue({ code: "custom", path: ["outputs"], message: "Outputs must be unique" });
  });

/**
 * Text prompts for generative installations. Prompt presets are created by the client at runtime
 * and stored on the bridge (like value snapshots, ADR-009), never in the config.
 * blend: two presets A and B mixed by an amount → `<address>/a s`, `<address>/b s`, `<address>/mix f`.
 * Without blend: `<address> s`. A preset switched off sends "" in its slot.
 */
export const Prompt = z.object({
  ...base,
  type: z.literal("prompt"),
  address,
  blend: z.boolean().default(true),
  maxLength: z.number().int().min(1).max(2000).default(500),
  maxPresets: z.number().int().min(1).max(200).default(32),
  /** Initial blend amount (0 = all A, 1 = all B). */
  default: z.number().min(0).max(1).default(0),
  /**
   * How long the installation has to confirm a new prompt (echo of the text, or
   * `<address>/applied`) before the pult shows Error. 0 = no confirmation, applied at once.
   */
  confirmMs: z.number().int().min(0).max(60000).default(4000),
});

export const Control = z.discriminatedUnion("type", [
  Button,
  Toggle,
  Fader,
  Knob,
  XYPad,
  Segmented,
  ButtonGrid,
  SceneList,
  Label,
  Meter,
  HoldToConfirm,
  ColorPicker,
  ButtonGroup,
  Thumbstick,
  Gyroscope,
  ImageUpload,
  Mic,
  Prompt,
]);

export const CONTROL_TYPES = Control.options.map((o) => o.shape.type.value);

/**
 * A control type this app version does not know (added in a newer release).
 * The renderer shows an "Update the app" placeholder in its grid cell; the rest of the pult keeps working.
 */
export const UnsupportedControl = z
  .looseObject({
    id,
    type: z.string().refine((t) => !(CONTROL_TYPES as string[]).includes(t)),
  })
  .transform((c) => ({
    id: c.id,
    type: "unsupported" as const,
    originalType: c.type,
  }));

export const AnyControl = z.union([Control, UnsupportedControl]);

export const FORM_FACTORS = ["phone", "tablet"] as const;
export type FormFactor = (typeof FORM_FACTORS)[number];

/** Control id → grid placement, for one form factor. */
export const Placements = z.record(id, Grid);

/** Every page ships a phone and a tablet layout (ADR-013, ADR-014). */
export const PageLayout = z.object({ phone: Placements, tablet: Placements });

/**
 * Figma Patterns built from Console Panels (ADR-014): a titled group of controls placed as one
 * cell. The pattern decides how the controls inside are arranged.
 */
export const PANEL_PATTERNS = [
  /** Channel strips side by side: each vertical fader, with the toggle that follows it (ON). */
  "faderBank",
  /** Knobs in rows of two, evenly spaced. */
  "knobGroup",
  /** Knobs in one row. */
  "knobRow",
  /** A Button Group (layers), centred vertically. */
  "layerToggles",
  /** Thumbstick over a relative fader (pan / tilt + zoom nudge). */
  "cameraControl",
  /** A Segmented control (scenes), centred vertically. */
  "sceneBar",
  /** Buttons / hold-to-confirm in one row, centred vertically. */
  "showActions",
  /** Toggles as List Rows with Menu Switches in one List Card (no title by default). */
  "list",
  /** Anything else: the controls stacked, sharing the height. */
  "stack",
] as const;
export type PanelPattern = (typeof PANEL_PATTERNS)[number];

export const Panel = z.object({
  id,
  /** Console Panel title (e.g. "Mix", "Shape"). */
  title: z.string().optional(),
  pattern: z.enum(PANEL_PATTERNS).default("stack"),
  /** Ids of this page's controls, in order. */
  controls: z.array(id).min(1),
});
export type Panel = z.infer<typeof Panel>;

export const Page = z.object({
  id,
  title: z.string().min(1),
  columns: z.literal(12).default(12),
  /** Controls, once. Their placement per form factor is in `layout`. */
  controls: z.array(AnyControl),
  /**
   * Console Panels (Figma Patterns). A layout may place a panel (by its id) instead of the
   * controls in it; every control is placed exactly once per form factor, directly or in a panel.
   */
  panels: z.array(Panel).default([]),
  layout: PageLayout,
});

/** A pult is one control surface inside an installation (e.g. "Lobby", "Conference hall"). */
export const Pult = z.object({
  id,
  name: z.string().min(1),
  defaultTarget: id.optional(),
  /**
   * Primary form factor (ADR-013): the app opens this pult first on that form factor (lobby →
   * phone, live → tablet). Both layouts still ship.
   */
  formFactor: z.enum(["phone", "tablet"]).optional(),
  /** Icon in the Installation › Pults list (Figma `Icon/<name>`, Phosphor kebab case). */
  icon: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/)
    .optional(),
  pages: z.array(Page).min(1),
});

/** A custom preset saved by the studio in the builder and published with the config. */
export const CustomPreset = z.object({
  id,
  type: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  props: z.record(z.string(), z.unknown()),
});

/**
 * The standard System screen (ADR-018): output width / height, debug overlay and seed of every
 * installation, shown in the Installation panel (never on a client pult). The addresses default to
 * what the TouchDesigner contract component generates from the TD page `System`.
 */
export const SYSTEM_PULT_ID = "system";
export const SYSTEM_ADDRESSES = {
  resw: "/system/resw",
  resh: "/system/resh",
  debug: "/system/debug",
  seed: "/system/seed",
} as const;
export type SystemParam = keyof typeof SYSTEM_ADDRESSES;
/** Output sizes offered as presets on the System screen (px). */
export const SYSTEM_SIZE_PRESETS: ReadonlyArray<{ w: number; h: number; label: string }> = [
  { w: 1920, h: 1080, label: "1920 × 1080" },
  { w: 1080, h: 1920, label: "1080 × 1920" },
  { w: 1280, h: 1280, label: "1280 × 1280" },
  { w: 3840, h: 2160, label: "3840 × 2160" },
];
/** The preset matching an output size, if any (its label). */
export function systemPresetOf(w: number | undefined, h: number | undefined): string | undefined {
  return SYSTEM_SIZE_PRESETS.find((p) => p.w === w && p.h === h)?.label;
}

/** Output size range the System screen accepts (px). */
export const SYSTEM_SIZE_RANGE = { min: 16, max: 16384 } as const;
/** Seed range (TouchDesigner Int parameter); 0 = random. */
export const SYSTEM_SEED_MAX = 2147483647;

export const SystemScreen = z.object({
  /** Target the System controls send to (required when there are several targets). */
  target: id.optional(),
  resw: address.default(SYSTEM_ADDRESSES.resw),
  resh: address.default(SYSTEM_ADDRESSES.resh),
  debug: address.default(SYSTEM_ADDRESSES.debug),
  seed: address.default(SYSTEM_ADDRESSES.seed),
});
export type SystemScreen = z.infer<typeof SystemScreen>;

const InstallationConfigBase = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    installation: z.object({
      id,
      name: z.string().min(1),
      revision: z.number().int().min(1),
      publishedAt: z.iso.datetime().optional(),
      /**
       * Actions the installation supports (drawer → Installation). Omitted: flash, restart,
       * blackout, idle (pause is opt-in).
       */
      actions: z
        .array(z.enum(INSTALLATION_ACTIONS))
        .refine((a) => new Set(a).size === a.length, "Actions must be unique")
        .optional(),
    }),
    targets: z.array(Target).min(1),
    theme: Theme.default({ mode: "dark" }),
    presets: z.array(CustomPreset).default([]),
    pults: z.array(Pult).min(1),
    system: SystemScreen.optional(),
  })
  .superRefine((cfg, ctx) => {
    const targets = new Set(cfg.targets.map((t) => t.id));
    const seen = new Set<string>();
    if (cfg.system) {
      if (cfg.system.target && !targets.has(cfg.system.target))
        ctx.addIssue({
          code: "custom",
          path: ["system", "target"],
          message: `Unknown target "${cfg.system.target}"`,
        });
      if (cfg.targets.length > 1 && !cfg.system.target)
        ctx.addIssue({
          code: "custom",
          path: ["system", "target"],
          message: "The System screen needs a target when there are several",
        });
      cfg.pults.forEach((pult, pi) => {
        if (pult.id === SYSTEM_PULT_ID)
          ctx.addIssue({
            code: "custom",
            path: ["pults", pi, "id"],
            message: `Pult id "${SYSTEM_PULT_ID}" is reserved for the System screen`,
          });
      });
    }
    cfg.pults.forEach((pult, pi) => {
      if (pult.defaultTarget && !targets.has(pult.defaultTarget))
        ctx.addIssue({
          code: "custom",
          path: ["pults", pi, "defaultTarget"],
          message: `Unknown target "${pult.defaultTarget}"`,
        });
      pult.pages.forEach((page, gi) => {
        const ids = new Set(page.controls.map((c) => c.id));
        const panels = new Map(page.panels.map((p) => [p.id, p]));
        page.panels.forEach((panel, ki) => {
          const ppath = ["pults", pi, "pages", gi, "panels", ki];
          if (ids.has(panel.id))
            ctx.addIssue({
              code: "custom",
              path: [...ppath, "id"],
              message: `Panel id "${panel.id}" is also a control id`,
            });
          panel.controls.forEach((cid, i) => {
            if (!ids.has(cid))
              ctx.addIssue({
                code: "custom",
                path: [...ppath, "controls", i],
                message: `Panel "${panel.id}" has unknown control "${cid}"`,
              });
          });
        });
        for (const ff of FORM_FACTORS) {
          const placements = page.layout[ff];
          const lpath = ["pults", pi, "pages", gi, "layout", ff];
          const placed = new Map<string, number>();
          for (const [cid, g] of Object.entries(placements)) {
            const panel = panels.get(cid);
            if (!ids.has(cid) && !panel)
              ctx.addIssue({
                code: "custom",
                path: [...lpath, cid],
                message: `${ff} layout places unknown control or panel "${cid}"`,
              });
            else if (g.x + g.w > page.columns)
              ctx.addIssue({
                code: "custom",
                path: [...lpath, cid],
                message: `"${cid}" overflows the 12-column ${ff} grid`,
              });
            for (const c of panel ? panel.controls : [cid]) placed.set(c, (placed.get(c) ?? 0) + 1);
          }
          for (const c of page.controls) {
            const n = placed.get(c.id) ?? 0;
            if (n === 0)
              ctx.addIssue({
                code: "custom",
                path: [...lpath, c.id],
                message: `Control "${c.id}" has no ${ff} placement`,
              });
            else if (n > 1)
              ctx.addIssue({
                code: "custom",
                path: [...lpath, c.id],
                message: `Control "${c.id}" is placed ${n} times in the ${ff} layout`,
              });
          }
        }
        page.controls.forEach((c, ci) => {
          const path = ["pults", pi, "pages", gi, "controls", ci];
          const key = `${pult.id}/${c.id}`;
          if (seen.has(key))
            ctx.addIssue({
              code: "custom",
              path: [...path, "id"],
              message: `Duplicate control id "${c.id}" in pult "${pult.id}"`,
            });
          seen.add(key);
          if (c.type === "unsupported") return;
          const t =
            c.target ??
            pult.defaultTarget ??
            (cfg.targets.length === 1 ? cfg.targets[0]!.id : undefined);
          if (c.type !== "label" && c.type !== "meter" && !t)
            ctx.addIssue({
              code: "custom",
              path: [...path, "target"],
              message: "Control needs a target (or set pult.defaultTarget)",
            });
          if (c.target && !targets.has(c.target))
            ctx.addIssue({
              code: "custom",
              path: [...path, "target"],
              message: `Unknown target "${c.target}"`,
            });
          if ("min" in c && "max" in c && typeof c.min === "number" && c.max <= c.min)
            ctx.addIssue({
              code: "custom",
              path: [...path, "max"],
              message: "max must be greater than min",
            });
        });
      });
    });
  });

/** Installation config: v1 is migrated to v2 (migrate.ts), then presets are resolved (presets.ts). */
export const InstallationConfig = z.preprocess((input, ctx) => {
  const { value, issues } = resolvePresets(migrateConfig(input));
  for (const issue of issues)
    ctx.issues.push({ code: "custom", message: issue.message, path: issue.path, input });
  return value;
}, InstallationConfigBase);

export type Target = z.infer<typeof Target>;
export type Theme = z.infer<typeof Theme>;
export type Control = z.infer<typeof Control>;
export type UnsupportedControl = z.infer<typeof UnsupportedControl>;
export type AnyControl = z.infer<typeof AnyControl>;
export type ControlType = Control["type"];
export type ControlOf<T extends ControlType> = Extract<Control, { type: T }>;
export type Page = z.infer<typeof Page>;
export type PageLayout = z.infer<typeof PageLayout>;
export type Grid = z.infer<typeof Grid>;
export type Pult = z.infer<typeof Pult>;
export type InstallationConfig = z.infer<typeof InstallationConfigBase>;
export type CustomPreset = z.infer<typeof CustomPreset>;
export type InstallationConfigInput = z.input<typeof InstallationConfigBase>;

export type ParseResult =
  | { ok: true; config: InstallationConfig }
  | { ok: false; reason: "newer-schema"; schemaVersion: number }
  | { ok: false; reason: "invalid"; issues: { path: string; message: string }[] };

/**
 * Parse a config received from the backend or the bridge.
 * A newer schema is reported separately so the app can stay on its cached revision and ask for an update.
 */
export function parseConfig(input: unknown): ParseResult {
  const v = (input as { schemaVersion?: unknown } | null)?.schemaVersion;
  if (typeof v === "number" && v > SCHEMA_VERSION)
    return { ok: false, reason: "newer-schema", schemaVersion: v };
  const r = InstallationConfig.safeParse(input);
  if (r.success) return { ok: true, config: r.data };
  return {
    ok: false,
    reason: "invalid",
    issues: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  };
}

/** Actions this installation supports (config list or the default set). */
export function actionsOf(cfg: Pick<InstallationConfig, "installation">): InstallationAction[] {
  return cfg.installation.actions ?? DEFAULT_ACTIONS;
}

/** Resolve which target a control sends to. */
export function targetOf(
  cfg: InstallationConfig,
  pult: Pult,
  control: AnyControl,
): Target | undefined {
  if (control.type === "unsupported") return undefined;
  const tid =
    control.target ??
    pult.defaultTarget ??
    (cfg.targets.length === 1 ? cfg.targets[0]!.id : undefined);
  return cfg.targets.find((t) => t.id === tid);
}

/**
 * The System screen as a pult the bridge and the app run like any other (state, lease, echo,
 * activity), so system values need no protocol of their own (ADR-018). Not in `cfg.pults`: no
 * pult list or pager ever shows it; the Installation panel draws it with `SystemScreen`.
 */
export function systemPult(cfg: Pick<InstallationConfig, "system">): Pult | undefined {
  const s = cfg.system;
  if (!s) return undefined;
  const t = s.target ? { target: s.target } : {};
  const size = (id: "resw" | "resh", label: string, def: number) => ({
    id,
    type: "fader",
    label,
    address: s[id],
    ...SYSTEM_SIZE_RANGE,
    step: 1,
    int: true,
    default: def,
    unit: "px",
    orientation: "horizontal",
    ...t,
  });
  return Pult.parse({
    id: SYSTEM_PULT_ID,
    name: "System",
    pages: [
      {
        id: SYSTEM_PULT_ID,
        title: "System",
        controls: [
          size("resw", "Width", 1920),
          size("resh", "Height", 1080),
          { id: "debug", type: "toggle", label: "Debug", address: s.debug, style: "switch", ...t },
          {
            id: "seed",
            type: "fader",
            label: "Seed",
            address: s.seed,
            min: 0,
            max: SYSTEM_SEED_MAX,
            step: 1,
            int: true,
            default: 0,
            orientation: "horizontal",
            ...t,
          },
        ],
        layout: { phone: {}, tablet: {} },
      },
    ],
  });
}

/** Every pult the bridge serves: the config's pults plus the System screen when there is one. */
export function allPults(cfg: Pick<InstallationConfig, "pults" | "system">): Pult[] {
  const sys = systemPult(cfg);
  return sys ? [...cfg.pults, sys] : cfg.pults;
}

/**
 * Value snapshot: a saved look (values of many controls), recalled with one tap.
 * Reserved for a later release (ADR 009): stored by the bridge as installation state, never in the config.
 */
export const ValueSnapshot = z.object({
  id: z.string().min(1),
  pultId: z.string().min(1),
  label: z.string().min(1),
  values: z.record(z.string(), z.unknown()),
  createdBy: z.enum(["client", "studio"]),
  createdAt: z.string(),
  configRevision: z.number().int().nonnegative(),
});
export type ValueSnapshot = z.infer<typeof ValueSnapshot>;

/**
 * A prompt preset created by the client for a `prompt` control (ADR-015). Installation state,
 * stored by the bridge; never part of the config.
 */
export const PromptPreset = z.object({
  id,
  pultId: id,
  controlId: id,
  label: z.string().min(1).max(64),
  text: z.string().max(2000),
  /** Switched off: the preset stays in the list but sends "" in its slot. */
  on: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
  /** Soft delete: restorable (Undo) until the bridge purges it. */
  deletedAt: z.string().optional(),
});
export type PromptPreset = z.infer<typeof PromptPreset>;

/** An image in the installation's library (uploaded through an `image` control, ADR-015). */
export const ImageAsset = z.object({
  id,
  pultId: id,
  controlId: id,
  /** Original file name, for display. */
  name: z.string(),
  format: z.enum(IMAGE_FORMATS),
  bytes: z.number().int().nonnegative(),
  /** Absolute path on the installation machine — what the installation receives over OSC. */
  path: z.string().min(1),
  createdAt: z.string(),
});
export type ImageAsset = z.infer<typeof ImageAsset>;
