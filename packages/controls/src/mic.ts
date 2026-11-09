/**
 * Mic control (ADR-015): on-device audio analysis. The audio itself never leaves the device —
 * only these numbers do. The platform part (permission, capture, FFT) sits behind an interface in
 * @osc/ui; everything that decides what is sent is here.
 */
import type { ControlOf } from "@osc/schema";

/** One analysis frame, as sent and synced. Only the control's `outputs` are filled. */
export interface MicFrame {
  /** Loudness 0..1 (RMS × gain, clamped). */
  level?: number;
  /** `bands` values 0..1, low → high frequency. */
  bands?: number[];
  /** A beat (onset) was detected in this frame. */
  beat?: boolean;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;

/** RMS loudness of a block of samples (−1..1) with gain, clamped to 0..1. */
export function rmsLevel(samples: ArrayLike<number>, gain = 1): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i]! * samples[i]!;
  return r4(clamp01(Math.sqrt(sum / samples.length) * gain));
}

/**
 * Group FFT magnitudes (0..1, low → high) into `count` log-spaced bands, averaged, with gain,
 * clamped to 0..1. Log spacing gives the bass its own bands instead of one bin.
 */
export function groupBands(magnitudes: ArrayLike<number>, count: number, gain = 1): number[] {
  const n = magnitudes.length;
  if (!n || count < 1) return Array(Math.max(0, count)).fill(0);
  const out: number[] = [];
  for (let b = 0; b < count; b++) {
    const lo = Math.floor(Math.pow(n, b / count)) - 1;
    const hi = Math.max(lo + 1, Math.floor(Math.pow(n, (b + 1) / count)));
    let sum = 0;
    for (let i = lo; i < hi; i++) sum += magnitudes[Math.max(0, i)]!;
    out.push(r4(clamp01((sum / (hi - lo)) * gain)));
  }
  return out;
}

/**
 * Energy-based beat detector: a frame is a beat when its energy exceeds `sensitivity` × the
 * average of the last `history` frames, and at least `cooldownMs` passed since the last beat.
 */
export function createBeatDetector(
  opts: { sensitivity?: number; history?: number; cooldownMs?: number; floor?: number } = {},
) {
  const sensitivity = opts.sensitivity ?? 1.5;
  const size = opts.history ?? 43; // ~1.4 s at 30 Hz
  const cooldown = opts.cooldownMs ?? 200;
  const floor = opts.floor ?? 0.02; // silence never beats
  const hist: number[] = [];
  let lastBeat = -Infinity;
  return (energy: number, at: number): boolean => {
    const avg = hist.length ? hist.reduce((a, b) => a + b, 0) / hist.length : 0;
    hist.push(energy);
    if (hist.length > size) hist.shift();
    const beat =
      hist.length > 1 && energy > floor && energy > avg * sensitivity && at - lastBeat >= cooldown;
    if (beat) lastBeat = at;
    return beat;
  };
}

/** Raw input from the platform capture for one frame. */
export interface AudioBlock {
  /** Time-domain samples −1..1. */
  samples: ArrayLike<number>;
  /** Optional FFT magnitudes 0..1 (low → high). Without it, bands are all 0. */
  spectrum?: ArrayLike<number> | undefined;
  /** ms timestamp. */
  at: number;
}

/** Turn captured audio into the frame a mic control sends, honouring its outputs and gain. */
export function analyzeBlock(
  c: Pick<ControlOf<"mic">, "outputs" | "bands" | "gain">,
  block: AudioBlock,
  beat: (energy: number, at: number) => boolean,
): MicFrame {
  const frame: MicFrame = {};
  const level = rmsLevel(block.samples, c.gain);
  if (c.outputs.includes("level")) frame.level = level;
  if (c.outputs.includes("bands"))
    frame.bands = block.spectrum
      ? groupBands(block.spectrum, c.bands, c.gain)
      : Array(c.bands).fill(0);
  if (c.outputs.includes("beat")) frame.beat = beat(level, block.at);
  return frame;
}
