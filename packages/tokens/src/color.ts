/** Small, dependency-free colour helpers: hex parsing, OKLab mixing, WCAG contrast. */

export interface Rgba {
  r: number; // 0..1
  g: number;
  b: number;
  a: number;
}

export function parseHex(hex: string): Rgba {
  const h = hex.replace("#", "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(h))
    throw new Error(`Invalid hex colour: ${hex}`);
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  const n = (i: number) => parseInt(full.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? n(6) : 1 };
}

export function toHex({ r, g, b, a }: Rgba): string {
  const c = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${c(r)}${c(g)}${c(b)}${a < 1 ? c(a) : ""}`;
}

export function isHex(v: string): boolean {
  try {
    parseHex(v);
    return true;
  } catch {
    return false;
  }
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function toOklab({ r, g, b }: Rgba): [number, number, number] {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, A, B]: [number, number, number], a: number): Rgba {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a,
  };
}

/** Perceptual mix: `amount` 0 → a, 1 → b. */
export function mix(a: string, b: string, amount: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  const la = toOklab(ca);
  const lb = toOklab(cb);
  const t = Math.min(1, Math.max(0, amount));
  const lab: [number, number, number] = [0, 1, 2].map((i) => la[i]! + (lb[i]! - la[i]!) * t) as [
    number,
    number,
    number,
  ];
  return toHex(fromOklab(lab, ca.a + (cb.a - ca.a) * t));
}

export function withAlpha(hex: string, alpha: number): string {
  return toHex({ ...parseHex(hex), a: alpha });
}

export function luminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG 2.x contrast ratio, 1..21. Alpha is ignored. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pick whichever of the candidates reads best on `bg`. */
export function bestOn(bg: string, candidates: string[]): string {
  return candidates.reduce((best, c) => (contrast(bg, c) > contrast(bg, best) ? c : best));
}

/** Euclidean distance in OKLab — about 0.02 is a just-noticeable difference. */
export function distance(a: string, b: string): number {
  const la = toOklab(parseHex(a));
  const lb = toOklab(parseHex(b));
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}
