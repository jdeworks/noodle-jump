/**
 * Deterministic host election — all peers compute the same result independently.
 * Uses lexicographic sort of peer IDs; lowest wins. No coordination needed.
 */

export function electHost(peerIds: string[]): string {
  if (peerIds.length === 0) throw new Error("electHost: no candidates");
  let lowest = peerIds[0];
  for (let i = 1; i < peerIds.length; i++) {
    if (peerIds[i] < lowest) lowest = peerIds[i];
  }
  return lowest;
}

export function computeRoleAfterMigration(
  remainingPeerIds: string[],
  localSelfId: string,
): { newHostId: string; localRole: "host" | "guest" } {
  const newHostId = electHost(remainingPeerIds);
  return { newHostId, localRole: newHostId === localSelfId ? "host" : "guest" };
}
