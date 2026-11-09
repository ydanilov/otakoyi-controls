import type { AudioBlock, TiltSample } from "@osc/controls";
import type { ImageAssetDto, PromptPresetDto } from "./dto";
import * as React from "react";
import type { ImageSourcePropType } from "react-native";

/**
 * Platform seams for controls that need more than touches (ADR-015, AGENTS rule 5). Components
 * only talk to these interfaces; the app decides the implementation (native module, browser API,
 * bridge HTTP, or a stub). There are no Platform.OS checks in the controls.
 */

/** A picked image, ready to upload. */
export interface PickedImage {
  name: string;
  /** Raw file bytes (the bridge validates the format by content). */
  body: Blob | ArrayBuffer | Uint8Array;
  /** Local preview URI, if the platform has one. */
  uri?: string | undefined;
}

/** Where a new image comes from (Take Photo / Photo Library / Choose File). */
export type ImageSource = "camera" | "library" | "files";

export interface ImagePicker {
  /** False when the platform part is not available yet (shown as a hint, the control stays drawn). */
  readonly available: boolean;
  /**
   * Ask for permission if needed and let the user pick one image. null = cancelled / denied.
   * `source` is the choice from the image control's pull-down menu (default: photo library).
   */
  pick(opts: {
    aspect: string;
    formats: readonly string[];
    source?: ImageSource;
  }): Promise<PickedImage | null>;
}

export interface AudioInput {
  readonly available: boolean;
  /** Ask for microphone permission. */
  requestPermission(): Promise<boolean>;
  /** Start capturing; `onBlock` gets about `rateHz` analysis blocks a second. Returns stop(). */
  start(
    opts: { rateHz: number; bands: number },
    onBlock: (b: AudioBlock) => void,
  ): Promise<() => void>;
}

/** Motion access as the platform reports it before asking. */
export type MotionPermission = "granted" | "denied" | "undetermined";

/**
 * Device orientation for the gyroscope control (expo-sensors DeviceMotion in the app, the
 * DeviceOrientation API in the web pult).
 */
export interface MotionInput {
  /** False when the device has no motion sensor or the page may not read it (web over HTTP). */
  readonly available: boolean;
  /** Current permission without asking (Permission denied shows before the first tap). */
  permission(): Promise<MotionPermission>;
  /** Ask for motion access (iOS Motion & Fitness; the web asks on this user gesture). */
  requestPermission(): Promise<boolean>;
  /** Start reading the orientation about `rateHz` times a second. Returns stop(). */
  start(opts: { rateHz: number }, onSample: (s: TiltSample) => void): Promise<() => void>;
  /** Open the app's system settings (Permission denied → Open Settings). Missing: no button. */
  openSettings?: (() => void) | undefined;
}

/** Image library on the bridge (or a demo stand-in). */
export interface MediaLibrary {
  /**
   * true: the bridge sends the OSC and syncs the value after upload / show (the control must not
   * send it again). false: a local stand-in, the control reports the value itself.
   */
  readonly remote: boolean;
  list(pult: string, control: string): Promise<ImageAssetDto[]>;
  upload(pult: string, control: string, image: PickedImage): Promise<ImageAssetDto>;
  show(id: string): Promise<ImageAssetDto>;
  remove(id: string): Promise<unknown>;
}

/** Prompt presets on the bridge (or a demo stand-in). */
export interface PromptPresets {
  /** true: the bridge re-sends a live preset that was edited or deleted (the control must not). */
  readonly remote?: boolean;
  list(pult: string, control: string): Promise<PromptPresetDto[]>;
  create(
    pult: string,
    control: string,
    p: { label: string; text: string; on?: boolean },
  ): Promise<PromptPresetDto>;
  update(
    id: string,
    patch: { label?: string; text?: string; on?: boolean },
  ): Promise<PromptPresetDto>;
  /** Soft delete; restorable with `restore` for a while (Undo toast). */
  remove(id: string): Promise<unknown>;
  restore(id: string): Promise<PromptPresetDto>;
  duplicate(id: string): Promise<PromptPresetDto>;
  /** Persist a new order (every preset of the control, once). */
  reorder(pult: string, control: string, ids: string[]): Promise<PromptPresetDto[]>;
}

/**
 * Per-device view preferences of controls (e.g. the Color Picker's style). Never sent, never part
 * of the config; the app stores them on the device.
 */
export interface ViewPrefs {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

/** View preferences kept in memory (stories, tests, and the default). */
export function memoryViewPrefs(): ViewPrefs {
  const m = new Map<string, string>();
  return {
    get: async (k) => m.get(k) ?? null,
    set: async (k, v) => {
      m.set(k, v);
    },
  };
}

/** Storage key of a control's view preference. */
export const viewPrefKey = (pult: string, control: string, name: string) =>
  `otakoyi.view.${pult || "-"}.${control}.${name}`;

export interface ControlServices {
  /** Pult id the controls belong to (the HTTP API addresses controls by pult + id). */
  pult: string;
  imagePicker: ImagePicker;
  audio: AudioInput;
  motion: MotionInput;
  media: MediaLibrary;
  prompts: PromptPresets;
  /**
   * Images of the config's asset bundle (picture pads): a relative path is served by the bridge
   * at `/brand/<path>` (or bundled with the app for the demo); an http(s) URL is used as is.
   * null = cannot be shown (the pad falls back to its plain look).
   */
  asset(path: string): ImageSourcePropType | null;
  /** Per-device view preferences (Color Picker style). */
  viewPrefs: ViewPrefs;
}

/** http(s) URLs only — what a pult without a bridge can show. */
export function urlAsset(path: string): ImageSourcePropType | null {
  return /^https?:\/\//i.test(path.trim()) ? { uri: path.trim() } : null;
}

const unavailable = () => Promise.reject(new Error("Not available on this device yet"));

/** Defaults: nothing wired. Controls render and explain that the feature is not available here. */
export const stubServices: ControlServices = {
  pult: "",
  viewPrefs: memoryViewPrefs(),
  asset: urlAsset,
  imagePicker: { available: false, pick: async () => null },
  audio: {
    available: false,
    requestPermission: async () => false,
    start: unavailable,
  },
  motion: {
    available: false,
    permission: async () => "undetermined",
    requestPermission: async () => false,
    start: unavailable,
  },
  media: {
    remote: false,
    list: async () => [],
    upload: unavailable,
    show: unavailable,
    remove: unavailable,
  },
  prompts: {
    list: async () => [],
    create: unavailable,
    update: unavailable,
    remove: unavailable,
    restore: unavailable,
    duplicate: unavailable,
    reorder: unavailable,
  },
};

const ServicesContext = React.createContext<ControlServices>(stubServices);

export function ControlServicesProvider({
  value,
  children,
}: {
  value: Partial<ControlServices>;
  children: React.ReactNode;
}) {
  const parent = React.useContext(ServicesContext);
  const merged = React.useMemo(() => ({ ...parent, ...value }), [parent, value]);
  return <ServicesContext.Provider value={merged}>{children}</ServicesContext.Provider>;
}

export function useControlServices(): ControlServices {
  return React.useContext(ServicesContext);
}

/**
 * In-memory media library and prompt presets: the demo installation and the gallery use these so
 * every control works without a bridge.
 */
export function createMemoryServices(
  pult = "demo",
): Pick<ControlServices, "media" | "prompts" | "pult"> {
  let n = 0;
  const now = () => new Date().toISOString();
  let images: ImageAssetDto[] = [];
  let presets: PromptPresetDto[] = [];
  return {
    pult,
    media: {
      remote: false,
      list: async (p, c) => images.filter((i) => i.pultId === p && i.controlId === c),
      upload: async (p, c, img) => {
        const id = `img${++n}`;
        const asset = {
          id,
          pultId: p,
          controlId: c,
          name: img.name,
          format: "jpeg",
          bytes: 0,
          path: `/demo/uploads/${id}.jpg`,
          createdAt: now(),
        };
        images = [...images, asset];
        return asset;
      },
      show: async (id) => {
        const a = images.find((i) => i.id === id);
        if (!a) throw new Error("No such image");
        return a;
      },
      remove: async (id) => {
        images = images.filter((i) => i.id !== id);
      },
    },
    prompts: {
      list: async (p, c) =>
        presets.filter((x) => x.pultId === p && x.controlId === c && !x.deletedAt),
      create: async (p, c, x) => {
        const preset = {
          id: `p${++n}`,
          pultId: p,
          controlId: c,
          label: x.label,
          text: x.text,
          on: x.on ?? true,
          createdAt: now(),
          updatedAt: now(),
        };
        presets = [...presets, preset];
        return preset;
      },
      update: async (id, patch) => {
        const cur = presets.find((x) => x.id === id);
        if (!cur) throw new Error("No such preset");
        const next = { ...cur, ...patch, updatedAt: now() };
        presets = presets.map((x) => (x.id === id ? next : x));
        return next;
      },
      remove: async (id) => {
        presets = presets.map((x) => (x.id === id ? { ...x, deletedAt: now() } : x));
      },
      restore: async (id) => {
        const cur = presets.find((x) => x.id === id);
        if (!cur) throw new Error("Too late to undo");
        const back = { ...cur };
        delete back.deletedAt;
        presets = presets.map((x) => (x.id === id ? back : x));
        return back;
      },
      duplicate: async (id) => {
        const cur = presets.find((x) => x.id === id);
        if (!cur) throw new Error("No such preset");
        const copy = { ...cur, id: `p${++n}`, label: `${cur.label} copy` };
        const i = presets.indexOf(cur);
        presets = [...presets.slice(0, i + 1), copy, ...presets.slice(i + 1)];
        return copy;
      },
      reorder: async (p, c, ids) => {
        const mine = presets.filter((x) => x.pultId === p && x.controlId === c);
        const queue = ids.flatMap((id) => mine.filter((x) => x.id === id));
        presets = presets.map((x) => (mine.includes(x) ? (queue.shift() ?? x) : x));
        return presets.filter((x) => x.pultId === p && x.controlId === c && !x.deletedAt);
      },
    },
  };
}
