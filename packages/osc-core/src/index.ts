/**
 * OSC 1.0 / 1.1 codec — pure TypeScript, no Node or platform APIs.
 * Shared by the mobile app, the bridge, the web pult and tests.
 */

export type OscArg =
  | { type: "i"; value: number }
  | { type: "f"; value: number }
  | { type: "d"; value: number }
  | { type: "s"; value: string }
  | { type: "b"; value: Uint8Array }
  | { type: "h"; value: bigint }
  | { type: "T" }
  | { type: "F" }
  | { type: "N" }
  | { type: "I" };

export interface OscMessage {
  address: string;
  args: OscArg[];
}

export interface OscBundle {
  timetag: Timetag;
  elements: OscPacket[];
}

export type OscPacket = OscMessage | OscBundle;

/** NTP timetag: seconds since 1900-01-01 and 1/2^32 fractions. `{0,1}` means "immediately". */
export interface Timetag {
  seconds: number;
  fraction: number;
}

export const IMMEDIATE: Timetag = { seconds: 0, fraction: 1 };

const NTP_EPOCH_OFFSET = 2208988800;

export function timetagFromDate(date: Date): Timetag {
  const ms = date.getTime();
  const seconds = Math.floor(ms / 1000) + NTP_EPOCH_OFFSET;
  const fraction = Math.round(((ms % 1000) / 1000) * 2 ** 32) >>> 0;
  return { seconds, fraction };
}

export function dateFromTimetag(t: Timetag): Date {
  return new Date((t.seconds - NTP_EPOCH_OFFSET) * 1000 + (t.fraction / 2 ** 32) * 1000);
}

export function isBundle(p: OscPacket): p is OscBundle {
  return "elements" in p;
}

// ---------- convenience constructors ----------

/** Build a message from plain JS values: integers → i, other numbers → f, strings → s, booleans → T/F, null → N. */
export function message(
  address: string,
  ...values: Array<number | string | boolean | null | Uint8Array>
): OscMessage {
  return { address, args: values.map(toArg) };
}

export function toArg(v: number | string | boolean | null | Uint8Array): OscArg {
  if (v === null) return { type: "N" };
  if (typeof v === "boolean") return v ? { type: "T" } : { type: "F" };
  if (typeof v === "string") return { type: "s", value: v };
  if (v instanceof Uint8Array) return { type: "b", value: v };
  return Number.isInteger(v) ? { type: "i", value: v } : { type: "f", value: v };
}

/** Plain JS value of an argument (bigint stays bigint). */
export function argValue(a: OscArg): number | string | boolean | null | Uint8Array | bigint {
  switch (a.type) {
    case "T":
      return true;
    case "F":
      return false;
    case "N":
      return null;
    case "I":
      return Infinity;
    default:
      return a.value;
  }
}

// ---------- address validation & matching ----------

export function isValidAddress(address: string): boolean {
  return /^\/[^\s#*,?[\]{}]*$/.test(address) && !address.includes("//");
}

/** OSC 1.0 address pattern matching (`*`, `?`, `[abc]`, `[!a-z]`, `{foo,bar}`). */
export function matchAddress(pattern: string, address: string): boolean {
  const pParts = pattern.split("/");
  const aParts = address.split("/");
  if (pParts.length !== aParts.length) return false;
  return pParts.every((p, i) => partRegex(p).test(aParts[i] ?? ""));
}

function partRegex(part: string): RegExp {
  let re = "";
  for (let i = 0; i < part.length; i++) {
    const c = part[i]!;
    if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else if (c === "[") {
      const end = part.indexOf("]", i);
      let body = part.slice(i + 1, end);
      if (body.startsWith("!")) body = "^" + body.slice(1);
      re += `[${body}]`;
      i = end;
    } else if (c === "{") {
      const end = part.indexOf("}", i);
      re += `(?:${part
        .slice(i + 1, end)
        .split(",")
        .map(escapeRe)
        .join("|")})`;
      i = end;
    } else re += escapeRe(c);
  }
  return new RegExp(`^${re}$`);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- encoding ----------

const enc = new TextEncoder();
const dec = new TextDecoder();

class Writer {
  private chunks: Uint8Array[] = [];
  length = 0;
  push(b: Uint8Array) {
    this.chunks.push(b);
    this.length += b.length;
  }
  bytes(): Uint8Array {
    const out = new Uint8Array(this.length);
    let o = 0;
    for (const c of this.chunks) {
      out.set(c, o);
      o += c.length;
    }
    return out;
  }
}

function pad4(n: number): number {
  return (4 - (n % 4)) % 4;
}

function oscString(s: string): Uint8Array {
  const raw = enc.encode(s);
  const out = new Uint8Array(raw.length + 1 + pad4(raw.length + 1));
  out.set(raw);
  return out;
}

function int32(v: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setInt32(0, v);
  return b;
}

function encodeArg(a: OscArg, w: Writer) {
  const b = (n: number) => new Uint8Array(n);
  switch (a.type) {
    case "i":
      w.push(int32(a.value | 0));
      break;
    case "f": {
      const x = b(4);
      new DataView(x.buffer).setFloat32(0, a.value);
      w.push(x);
      break;
    }
    case "d": {
      const x = b(8);
      new DataView(x.buffer).setFloat64(0, a.value);
      w.push(x);
      break;
    }
    case "h": {
      const x = b(8);
      new DataView(x.buffer).setBigInt64(0, a.value);
      w.push(x);
      break;
    }
    case "s":
      w.push(oscString(a.value));
      break;
    case "b": {
      w.push(int32(a.value.length));
      const x = b(a.value.length + pad4(a.value.length));
      x.set(a.value);
      w.push(x);
      break;
    }
    default:
      break; // T F N I carry no data
  }
}

export function encodeMessage(m: OscMessage): Uint8Array {
  if (!isValidAddress(m.address)) throw new OscError(`Invalid OSC address: ${m.address}`);
  const w = new Writer();
  w.push(oscString(m.address));
  w.push(oscString("," + m.args.map((a) => a.type).join("")));
  for (const a of m.args) encodeArg(a, w);
  return w.bytes();
}

export function encodeBundle(bundle: OscBundle): Uint8Array {
  const w = new Writer();
  w.push(oscString("#bundle"));
  const t = new Uint8Array(8);
  const dv = new DataView(t.buffer);
  dv.setUint32(0, bundle.timetag.seconds >>> 0);
  dv.setUint32(4, bundle.timetag.fraction >>> 0);
  w.push(t);
  for (const el of bundle.elements) {
    const bytes = encodePacket(el);
    w.push(int32(bytes.length));
    w.push(bytes);
  }
  return w.bytes();
}

export function encodePacket(p: OscPacket): Uint8Array {
  return isBundle(p) ? encodeBundle(p) : encodeMessage(p);
}

// ---------- decoding ----------

export class OscError extends Error {
  override name = "OscError";
}

class Reader {
  private dv: DataView;
  o = 0;
  constructor(private buf: Uint8Array) {
    this.dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  get remaining() {
    return this.buf.length - this.o;
  }
  need(n: number) {
    if (this.remaining < n) throw new OscError("Truncated OSC packet");
  }
  string(): string {
    const end = this.buf.indexOf(0, this.o);
    if (end < 0) throw new OscError("Unterminated OSC string");
    const s = dec.decode(this.buf.subarray(this.o, end));
    this.o = end + 1 + pad4(end + 1 - this.o);
    return s;
  }
  int32() {
    this.need(4);
    const v = this.dv.getInt32(this.o);
    this.o += 4;
    return v;
  }
  uint32() {
    this.need(4);
    const v = this.dv.getUint32(this.o);
    this.o += 4;
    return v;
  }
  float32() {
    this.need(4);
    const v = this.dv.getFloat32(this.o);
    this.o += 4;
    return v;
  }
  float64() {
    this.need(8);
    const v = this.dv.getFloat64(this.o);
    this.o += 8;
    return v;
  }
  int64() {
    this.need(8);
    const v = this.dv.getBigInt64(this.o);
    this.o += 8;
    return v;
  }
  blob(): Uint8Array {
    const n = this.int32();
    this.need(n);
    const v = this.buf.slice(this.o, this.o + n);
    this.o += n + pad4(n);
    return v;
  }
  bytes(n: number) {
    this.need(n);
    const v = this.buf.subarray(this.o, this.o + n);
    this.o += n;
    return v;
  }
}

export function decodePacket(bytes: Uint8Array): OscPacket {
  if (bytes.length === 0 || bytes.length % 4 !== 0)
    throw new OscError("OSC packet size must be a non-zero multiple of 4");
  return bytes[0] === 0x23 /* # */ ? decodeBundle(bytes) : decodeMessage(bytes);
}

export function decodeMessage(bytes: Uint8Array): OscMessage {
  const r = new Reader(bytes);
  const address = r.string();
  if (!address.startsWith("/")) throw new OscError(`Invalid OSC address: ${address}`);
  if (r.remaining === 0) return { address, args: [] }; // tolerate missing type tag (old senders)
  const tags = r.string();
  if (!tags.startsWith(",")) throw new OscError("Missing OSC type tag string");
  const args: OscArg[] = [];
  for (const t of tags.slice(1)) {
    switch (t) {
      case "i":
        args.push({ type: "i", value: r.int32() });
        break;
      case "f":
        args.push({ type: "f", value: r.float32() });
        break;
      case "d":
        args.push({ type: "d", value: r.float64() });
        break;
      case "h":
        args.push({ type: "h", value: r.int64() });
        break;
      case "s":
      case "S":
        args.push({ type: "s", value: r.string() });
        break;
      case "b":
        args.push({ type: "b", value: r.blob() });
        break;
      case "T":
      case "F":
      case "N":
      case "I":
        args.push({ type: t });
        break;
      default:
        throw new OscError(`Unsupported OSC type tag: ${t}`);
    }
  }
  return { address, args };
}

export function decodeBundle(bytes: Uint8Array): OscBundle {
  const r = new Reader(bytes);
  if (r.string() !== "#bundle") throw new OscError("Not an OSC bundle");
  const timetag = { seconds: r.uint32(), fraction: r.uint32() };
  const elements: OscPacket[] = [];
  while (r.remaining > 0) {
    const size = r.int32();
    elements.push(decodePacket(r.bytes(size)));
  }
  return { timetag, elements };
}

/** Flatten bundles into the messages they contain, in order. */
export function messagesOf(p: OscPacket): OscMessage[] {
  return isBundle(p) ? p.elements.flatMap(messagesOf) : [p];
}

// ---------- SLIP framing (OSC 1.1 over TCP) ----------

const END = 0xc0;
const ESC = 0xdb;
const ESC_END = 0xdc;
const ESC_ESC = 0xdd;

export function slipEncode(packet: Uint8Array): Uint8Array {
  const out: number[] = [END];
  for (const b of packet) {
    if (b === END) out.push(ESC, ESC_END);
    else if (b === ESC) out.push(ESC, ESC_ESC);
    else out.push(b);
  }
  out.push(END);
  return Uint8Array.from(out);
}

/** Streaming SLIP decoder: feed TCP chunks, receive complete packets. */
export class SlipDecoder {
  private buf: number[] = [];
  private escaping = false;

  push(chunk: Uint8Array): Uint8Array[] {
    const packets: Uint8Array[] = [];
    for (const b of chunk) {
      if (this.escaping) {
        this.buf.push(b === ESC_END ? END : b === ESC_ESC ? ESC : b);
        this.escaping = false;
      } else if (b === ESC) this.escaping = true;
      else if (b === END) {
        if (this.buf.length) packets.push(Uint8Array.from(this.buf));
        this.buf = [];
      } else this.buf.push(b);
    }
    return packets;
  }
}
