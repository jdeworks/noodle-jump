/** Pure logic — no pixi imports. Safe to use in tests. */

export interface PlayerResult {
  peerId: string;
  label: string;
  height: number;
  score: number;
  isLocal: boolean;
  color: number;
  dead?: boolean;
}

const PEER_COLORS = [
  0xff8833, 0x33cc55, 0x3388ff, 0xff33aa, 0xffcc44, 0x33cccc, 0xcc33ff, 0xff5555,
];

export function getPeerColor(index: number): number {
  return PEER_COLORS[index % PEER_COLORS.length];
}
