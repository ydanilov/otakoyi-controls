import {
  createMemoryServices,
  memoryViewPrefs,
  urlAsset,
  type ControlServices,
} from "../platform/services";
import { SAMPLE_PAD, SAMPLE_WALL } from "./images";

/**
 * Control services for stories: in-memory media and prompt presets (like the demo installation),
 * an image picker that returns the sample wall image, a synthetic microphone (a pulsing tone) and
 * a synthetic tilt (a slow circle), so image, prompt, mic and gyroscope controls are fully
 * interactive in Storybook without a device.
 */
export function storyServices(): ControlServices {
  const { media, prompts } = createMemoryServices("stories");
  return {
    pult: "stories",
    viewPrefs: memoryViewPrefs(),
    // The demo config's picture pad image; anything else only as an http(s) URL.
    asset: (path) => (path === "demo-pad.jpg" ? SAMPLE_PAD : urlAsset(path)),
    media,
    prompts,
    imagePicker: {
      available: true,
      pick: async () => {
        const res = await fetch(SAMPLE_WALL.uri);
        return { name: "sample-wall.png", body: await res.blob(), uri: SAMPLE_WALL.uri };
      },
    },
    // A hand slowly circling the phone: ±18° roll and pitch around a 40° holding angle.
    motion: {
      available: true,
      permission: async () => "granted",
      requestPermission: async () => true,
      start: async ({ rateHz }, onSample) => {
        let t = 0;
        const id = setInterval(() => {
          t += 1;
          onSample({ pitch: 40 - 18 * Math.sin(t / 20), roll: 18 * Math.sin(t / 14) });
        }, 1000 / rateHz);
        return () => clearInterval(id);
      },
    },
    audio: {
      available: true,
      requestPermission: async () => true,
      start: async ({ rateHz, bands }, onBlock) => {
        let t = 0;
        const id = setInterval(() => {
          t += 1;
          const amp = 0.25 + 0.5 * Math.abs(Math.sin(t / 6));
          const samples = Array.from({ length: 256 }, (_, i) => amp * Math.sin((i + t * 7) / 4));
          const spectrum = Array.from({ length: bands * 4 }, (_, i) =>
            Math.max(0, amp * (1 - i / (bands * 4)) + 0.15 * Math.sin(t / 3 + i)),
          );
          onBlock({ samples, spectrum, at: Date.now() });
        }, 1000 / rateHz);
        return () => clearInterval(id);
      },
    },
  };
}
