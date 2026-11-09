import * as I from "./icons";
import type { PhosphorIcon } from "./icons";

/**
 * Config icon names (Figma `Icon/<name>`, Phosphor kebab case) → the icon components the library
 * ships. Only icons that are in `icons.ts` can be named; unknown names give null (no icon).
 */
const BY_NAME: Readonly<Record<string, PhosphorIcon>> = {
  "arrow-clockwise": I.ArrowClockwiseIcon,
  "arrows-clockwise": I.ArrowsClockwiseIcon,
  bell: I.BellIcon,
  camera: I.CameraIcon,
  "circle-half": I.CircleHalfIcon,
  "device-mobile": I.DeviceMobileIcon,
  eye: I.EyeIcon,
  flashlight: I.FlashlightIcon,
  "hand-palm": I.HandPalmIcon,
  image: I.ImageIcon,
  images: I.ImagesIcon,
  key: I.KeyIcon,
  lightning: I.LightningIcon,
  "lock-simple": I.LockSimpleIcon,
  monitor: I.MonitorIcon,
  moon: I.MoonIcon,
  pause: I.PauseIcon,
  power: I.PowerIcon,
  "qr-code": I.QrCodeIcon,
  scan: I.ScanIcon,
  "sliders-horizontal": I.SlidersHorizontalIcon,
  sun: I.SunIcon,
  vibrate: I.VibrateIcon,
  waveform: I.WaveformIcon,
};

export function iconByName(name: string | undefined): PhosphorIcon | null {
  return (name && BY_NAME[name]) || null;
}

/** Icon names a config may use. */
export const ICON_NAMES = Object.keys(BY_NAME);
