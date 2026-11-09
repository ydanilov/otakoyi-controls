import { describe, expect, it } from "vitest";
import {
  IMMEDIATE,
  SlipDecoder,
  dateFromTimetag,
  decodePacket,
  encodeBundle,
  encodeMessage,
  encodePacket,
  isValidAddress,
  matchAddress,
  message,
  messagesOf,
  slipEncode,
  timetagFromDate,
  type OscMessage,
} from "./index";

const hex = (b: Uint8Array) => Buffer.from(b).toString("hex");

describe("encodeMessage", () => {
  it("matches the OSC 1.0 spec example byte for byte", () => {
    // "/oscillator/4/frequency" ,f 440.0 — from opensoundcontrol.org spec examples
    const exact = encodeMessage({
      address: "/oscillator/4/frequency",
      args: [{ type: "f", value: 440 }],
    });
    expect(hex(exact)).toBe(
      "2f6f7363696c6c61746f722f342f6672657175656e637900" + "2c660000" + "43dc0000",
    );
  });

  it("pads strings to 4 bytes", () => {
    const b = encodeMessage(message("/a", "hi"));
    expect(b.length % 4).toBe(0);
    expect(hex(b)).toBe("2f610000" + "2c730000" + "68690000");
  });

  it("encodes T/F/N without payload", () => {
    const b = encodeMessage(message("/x", true, false, null));
    expect(hex(b)).toBe("2f780000" + "2c54464e" + "00000000");
  });

  it("rejects invalid addresses", () => {
    expect(() => encodeMessage(message("no-slash"))).toThrow();
    expect(() => encodeMessage(message("/has space"))).toThrow();
  });
});

describe("round trip", () => {
  it("decodes what it encodes", () => {
    const m: OscMessage = {
      address: "/wall/intensity",
      args: [
        { type: "i", value: -7 },
        { type: "f", value: 0.25 },
        { type: "d", value: Math.PI },
        { type: "s", value: "Лобі" },
        { type: "b", value: new Uint8Array([1, 2, 3, 4, 5]) },
        { type: "h", value: 9007199254740993n },
        { type: "T" },
        { type: "N" },
      ],
    };
    expect(decodePacket(encodeMessage(m))).toEqual(m);
  });

  it("round-trips nested bundles", () => {
    const b = {
      timetag: IMMEDIATE,
      elements: [
        message("/a", 1),
        { timetag: IMMEDIATE, elements: [message("/b", "x"), message("/c", 0.5)] },
      ],
    };
    const decoded = decodePacket(encodeBundle(b));
    expect(decoded).toEqual(b);
    expect(messagesOf(decoded).map((m) => m.address)).toEqual(["/a", "/b", "/c"]);
  });

  it("rejects truncated packets", () => {
    const b = encodePacket(message("/a", 1));
    expect(() => decodePacket(b.subarray(0, 8))).toThrow();
  });
});

describe("timetags", () => {
  it("converts dates both ways within a millisecond", () => {
    const d = new Date("2026-10-21T10:00:00.250Z");
    expect(
      Math.abs(dateFromTimetag(timetagFromDate(d)).getTime() - d.getTime()),
    ).toBeLessThanOrEqual(1);
  });
});

describe("addresses", () => {
  it("validates", () => {
    expect(isValidAddress("/scene/1")).toBe(true);
    expect(isValidAddress("/scene//1")).toBe(false);
  });
  it("matches OSC patterns", () => {
    expect(matchAddress("/scene/*", "/scene/3")).toBe(true);
    expect(matchAddress("/scene/[1-3]", "/scene/4")).toBe(false);
    expect(matchAddress("/{wall,floor}/intensity", "/floor/intensity")).toBe(true);
    expect(matchAddress("/x?", "/xy")).toBe(true);
    expect(matchAddress("/a/*", "/a/b/c")).toBe(false);
  });
});

describe("SLIP", () => {
  it("frames and unframes across arbitrary chunk boundaries", () => {
    const p1 = encodeMessage(message("/a", 0xc0));
    const p2 = Uint8Array.from([0xc0, 0xdb, 1, 2]);
    const stream = new Uint8Array([...slipEncode(p1), ...slipEncode(p2)]);
    const d = new SlipDecoder();
    const out: Uint8Array[] = [];
    for (let i = 0; i < stream.length; i += 3) out.push(...d.push(stream.subarray(i, i + 3)));
    expect(out.map(hex)).toEqual([hex(p1), hex(p2)]);
  });
});
