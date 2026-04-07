import { describe, it, expect } from "vitest";
import {
  toBase62,
  fromBase62,
  compressSDP,
  decompressSDP,
  compressDescription,
  decompressDescription,
} from "../../src/multiplayer/SDPCompressor";

describe("base62 encoding", () => {
  it("round-trips a simple byte array", () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = toBase62(original);
    const decoded = fromBase62(encoded);
    expect(decoded).toEqual(original);
  });

  it("round-trips an empty-ish byte array", () => {
    const original = new Uint8Array([0]);
    const encoded = toBase62(original);
    expect(encoded).toBeTruthy();
    // fromBase62 of a zero should return [0]
    const decoded = fromBase62(encoded);
    expect(decoded).toEqual(new Uint8Array([0]));
  });

  it("round-trips a large byte array", () => {
    const original = new Uint8Array(256);
    for (let i = 0; i < 256; i++) original[i] = i;
    const encoded = toBase62(original);
    const decoded = fromBase62(encoded);
    expect(decoded).toEqual(original);
  });

  it("rejects invalid base62 characters", () => {
    expect(() => fromBase62("00!@#")).toThrow("Invalid base62 character");
  });

  it("rejects too-short strings", () => {
    expect(() => fromBase62("0")).toThrow("too short");
  });

  it("only uses base62 characters", () => {
    const bytes = new Uint8Array([255, 128, 64, 32, 16, 8, 4, 2, 1]);
    const encoded = toBase62(bytes);
    expect(encoded).toMatch(/^[0-9A-Za-z]+$/);
  });
});

describe("SDP compression", () => {
  const sampleSDP = [
    "v=0",
    "o=- 123456789 2 IN IP4 127.0.0.1",
    "s=-",
    "t=0 0",
    "a=group:BUNDLE 0",
    "a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level",
    "a=mid:0",
    "m=application 9 UDP/DTLS/SCTP webrtc-datachannel",
    "c=IN IP4 0.0.0.0",
    "a=ice-ufrag:test",
    "a=ice-pwd:testpassword123456789012",
    "a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99",
    "a=setup:actpass",
    "a=sctp-port:5000",
    "a=rtcp-rsize",
    "a=msid-semantic: WMS",
  ].join("\r\n");

  it("compresses and decompresses SDP", () => {
    const compressed = compressSDP(sampleSDP);
    const decompressed = decompressSDP(compressed);

    // Stripped fields should be removed
    expect(decompressed).not.toContain("a=extmap:");
    expect(decompressed).not.toContain("a=rtcp-rsize");
    expect(decompressed).not.toContain("a=msid-semantic:");
    expect(decompressed).not.toContain("a=group:BUNDLE");
    expect(decompressed).not.toContain("a=mid:");

    // Essential fields should survive
    expect(decompressed).toContain("a=ice-ufrag:test");
    expect(decompressed).toContain("a=ice-pwd:");
    expect(decompressed).toContain("a=fingerprint:");
    expect(decompressed).toContain("a=setup:actpass");
  });

  it("produces shorter output than the input", () => {
    const compressed = compressSDP(sampleSDP);
    // base62 encoding of deflated data should be shorter than raw SDP
    expect(compressed.length).toBeLessThan(sampleSDP.length);
  });

  it("produces only base62 characters", () => {
    const compressed = compressSDP(sampleSDP);
    expect(compressed).toMatch(/^[0-9A-Za-z]+$/);
  });
});

describe("description compression", () => {
  it("round-trips an offer description", () => {
    const sdp = "v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";
    const desc = { type: "offer" as RTCSdpType, sdp };
    const compressed = compressDescription(desc as RTCSessionDescription);

    expect(compressed.startsWith("O")).toBe(true);

    const decompressed = decompressDescription(compressed);
    expect(decompressed.type).toBe("offer");
    expect(decompressed.sdp).toBe(sdp);
  });

  it("round-trips an answer description", () => {
    const sdp = "v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";
    const desc = { type: "answer" as RTCSdpType, sdp };
    const compressed = compressDescription(desc as RTCSessionDescription);

    expect(compressed.startsWith("A")).toBe(true);

    const decompressed = decompressDescription(compressed);
    expect(decompressed.type).toBe("answer");
    expect(decompressed.sdp).toBe(sdp);
  });
});
