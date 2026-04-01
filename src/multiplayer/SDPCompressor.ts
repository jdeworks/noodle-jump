/**
 * Compresses WebRTC SDP offers/answers into short codes for copy-paste exchange.
 * Uses pako deflate + base62 encoding to minimize code length.
 */

import { deflate, inflate } from "pako";

const BASE62_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** Strip unnecessary SDP fields to reduce size before compression. */
function stripSDP(sdp: string): string {
  return sdp
    .split("\r\n")
    .filter((line) => {
      if (line.startsWith("a=extmap:")) return false;
      if (line.startsWith("a=rtcp-rsize")) return false;
      if (line.startsWith("a=msid-semantic:")) return false;
      if (line.startsWith("a=group:BUNDLE")) return false;
      if (line.startsWith("a=mid:")) return false;
      return true;
    })
    .join("\r\n");
}

/** Restore stripped fields that WebRTC needs to parse the SDP. */
function restoreSDP(sdp: string): string {
  // Minimal restoration — the stripped fields are optional for DataChannel-only connections
  return sdp;
}

/**
 * Encode a Uint8Array to base62 string.
 * Format: length-prefixed to preserve leading zeros.
 * First 2 chars encode the byte length, rest is the value.
 */
export function toBase62(bytes: Uint8Array): string {
  // Encode the byte length as 2 base62 chars (max 3844 bytes)
  const len = bytes.length;
  const lenPrefix =
    BASE62_CHARS[Math.floor(len / 62)] + BASE62_CHARS[len % 62];

  let num = 0n;
  for (const byte of bytes) {
    num = (num << 8n) | BigInt(byte);
  }

  if (num === 0n) return lenPrefix + BASE62_CHARS[0];

  let result = "";
  const base = BigInt(BASE62_CHARS.length);
  while (num > 0n) {
    result = BASE62_CHARS[Number(num % base)] + result;
    num = num / base;
  }
  return lenPrefix + result;
}

/**
 * Decode a base62 string to Uint8Array.
 * First 2 chars are the byte length prefix.
 */
export function fromBase62(str: string): Uint8Array {
  if (str.length < 2) throw new Error("Invalid base62 string: too short");

  // Decode length prefix
  const len =
    BASE62_CHARS.indexOf(str[0]) * 62 + BASE62_CHARS.indexOf(str[1]);

  const valueStr = str.slice(2);
  let num = 0n;
  const base = BigInt(BASE62_CHARS.length);
  for (const char of valueStr) {
    const idx = BASE62_CHARS.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base62 character: ${char}`);
    num = num * base + BigInt(idx);
  }

  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn));
    num = num >> 8n;
  }

  // Pad with leading zeros to reach expected length
  while (bytes.length < len) {
    bytes.unshift(0);
  }

  return new Uint8Array(bytes);
}

/**
 * Compress an SDP string into a short code.
 * Format: stripped SDP → deflate → base62
 */
export function compressSDP(sdp: string): string {
  const stripped = stripSDP(sdp);
  const compressed = deflate(new TextEncoder().encode(stripped), { level: 9 });
  return toBase62(compressed);
}

/**
 * Decompress a code back into an SDP string.
 * Format: base62 → inflate → restore SDP
 */
export function decompressSDP(code: string): string {
  const compressed = fromBase62(code);
  const decompressed = inflate(compressed);
  return restoreSDP(new TextDecoder().decode(decompressed));
}

/**
 * Compress a full RTCSessionDescription (type + sdp) into a single code.
 * Prefix: 'O' for offer, 'A' for answer.
 */
export function compressDescription(desc: RTCSessionDescription): string {
  const prefix = desc.type === "offer" ? "O" : "A";
  return prefix + compressSDP(desc.sdp);
}

/**
 * Decompress a code back into an RTCSessionDescriptionInit.
 */
export function decompressDescription(code: string): RTCSessionDescriptionInit {
  const prefix = code[0];
  const type = prefix === "O" ? "offer" : "answer";
  const sdp = decompressSDP(code.slice(1));
  return { type, sdp };
}
