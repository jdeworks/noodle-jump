# Open Tasks

## 1. Daily Challenge

- [x] Random custom run config generated from date seed (same for all players that day)
- [x] Point threshold to "succeed" (e.g. reach X score = gold, Y = silver, Z = bronze)
- [x] Daily challenge UI on title screen (shows today's challenge, best result, streak)
- [x] Leaderboard for daily challenge (local — track personal bests per day)
- [x] Achievements for daily challenges:
  - [x] First daily completed
  - [x] 7-day streak
  - [x] 30-day streak
  - [x] Gold on a daily
  - [x] All three medals collected in one week

## 2. Shadow Replay on Normal Runs

- [x] Record player position each tick during a run (compact format)
- [x] On next run, replay the recording as a ghost/shadow
- [x] Shadow rendered like multiplayer remote player (semi-transparent, tinted)
- [x] Option to race against personal best or last run
- [x] Store best-run shadow in localStorage

## 3. Large Multiplayer (up to 24 players)

### Research Findings (2026-04-06)

**Trystero/Nostr room capacity:** No documented hard limit. Trystero creates a full-mesh WebRTC
topology — every peer connects to every other peer. For 24 players = 23 RTCPeerConnection objects
per client. Since this is data-only (no video/audio), bandwidth is trivial:

- 19 bytes × 20Hz = 380 bytes/sec per peer
- 23 peers × 380 = 8.7 KB/s total = ~70 kbps (negligible)
- Memory: ~5-10 MB per data-only RTCPeerConnection × 23 = ~115-230 MB (acceptable on desktop,
  tight on mobile)

**Verdict:** Full mesh works for 24 data-only peers. No SFU needed. Trystero stays.
Test with 8-12 peers first, then push to 24. If mobile devices struggle at 24, cap at 12 for
mobile and 24 for desktop.

**Trystero API detail:** `makeAction` callbacks include peer ID as second arg:
`onPos((data, peerId) => {...})`. This is critical — current code ignores the peerId param.

### Current 2-Player Assumptions (must change)

| File | Assumption | Change needed |
|------|-----------|--------------|
| `OnlineSession.ts` | Single `remoteRenderer`, `interpolation`, `remoteDead`, `remoteDeathHeight` | `Map<peerId, RemotePeerState>` |
| `GameSync.ts` | `lastRemoteSeq` is single value, callbacks don't pass peerId | Per-peer seq tracking, route peerId through callbacks |
| `NostrSignaling.ts` | `this.peerId` tracks single peer, `onPeerLeave` checks single ID | Track `Set<string>` of peer IDs |
| `ConnectionManager.ts` | Single `pc` (RTCPeerConnection) | Trystero manages connections; just track connected peer count |
| `LobbyScreen.ts` | Hardcoded "P1 (Host)" / "P2 (Guest)", binary ready state | Dynamic player list with per-peer ready state |
| `ResultsScreen.ts` | Binary h1 vs h2 comparison | Sorted leaderboard of all players |
| `RemotePlayerRenderer.ts` | Single instance per session | One instance per remote peer (pooled) |
| `InterpolationBuffer.ts` | Single target state | One instance per remote peer |

### Implementation Plan (5 stages)

#### Stage 1: Multi-peer GameSync (~100 LOC changed)

**Goal:** GameSync routes data per-peer instead of treating all remotes as one.

1. **GameSync.ts** — Add peerId to callbacks:
   ```ts
   // Change callback signature
   onRemotePosition: (state: PlayerSyncState, peerId: string) => void;
   onRemoteEvent: (event: GameSyncEvent, peerId: string) => void;
   ```
   - `initWithRoom()`: Trystero's `onPos((data, peerId) => {...})` already provides peerId
   - Track `lastRemoteSeq: Map<string, number>` instead of single value
   - `sendPos`/`sendEventAction` broadcast to all peers (Trystero default) — no change needed

2. **OnlineSession.ts** — Multi-peer state container:
   ```ts
   interface RemotePeerState {
     renderer: RemotePlayerRenderer;
     interpolation: InterpolationBuffer;
     dead: boolean;
     deathHeight: number;
     character: string;
     cosmetics?: RemoteCosmetics;
   }
   private peers = new Map<string, RemotePeerState>();
   ```
   - `onRemotePosition(state, peerId)`: route to `peers.get(peerId).interpolation`
   - Game loop: iterate all peers for rendering
   - Death check: game ends when all peers are dead (not just `localDead && remoteDead`)

3. **NostrSignaling.ts** — Track multiple peers:
   - `private peerIds = new Set<string>()`
   - `onPeerJoin`: add to set, call `callbacks.onPeerJoin(id)` (new callback)
   - `onPeerLeave`: remove from set, call `callbacks.onPeerLeave(id)` (new callback)
   - Only trigger "failed" state when ALL peers leave

#### Stage 2: Lobby Redesign (~250 LOC, new file)

**Goal:** Dynamic player list with ready-up flow.

1. **LobbyScreen.ts** — Rewrite from 2-player to N-player:
   - `players: Map<string, { character: string, ready: boolean, cosmetics: {} }>`
   - Scrollable player list: each row = color dot + character sprite + name + ready badge
   - Max visible rows: 6, scroll for more
   - Host controls unchanged (mode, theme, custom run)
   - Room code displayed large at top (for sharing)
   - Player count: "Players: 5/12"

2. **Ready-up flow:**
   - Host sets lobby size (2/4/8/12/24) before creating room
   - Host clicks "Start" → 15-sec countdown begins (broadcast to all)
   - Any player can ready/unready during countdown
   - If all ready before timer: skip to 3-sec game countdown
   - Timer expiry: start regardless, unready players included
   - Late joiners during countdown: synced with current state

3. **Event protocol additions:**
   - `"join"` event: new player announces character + cosmetics
   - `"leave"` event: cleanup (Trystero also fires `onPeerLeave`)
   - `"lobby-countdown"` event: host broadcasts countdown state
   - `"lobby-size"` event: host broadcasts max player count

#### Stage 3: Multi-Shadow Rendering (~80 LOC changed)

**Goal:** Render up to 23 remote players simultaneously.

1. **RemotePlayerRenderer** — No structural changes needed. Already self-contained.
   - Create one instance per connected peer
   - Add to `OnlineSession.peers` map on `onPeerJoin`
   - Destroy on `onPeerLeave`
   - Each renderer gets a unique tint (cycle through 8 preset colors)

2. **Color assignment:**
   ```ts
   const PEER_COLORS = [0xff8833, 0x33cc55, 0x3388ff, 0xff33aa,
                         0xffcc44, 0x33cccc, 0xcc33ff, 0xff5555];
   // Assign by index: peers.size % PEER_COLORS.length
   ```

3. **Off-screen arrows:** Stack arrows vertically if multiple remotes are off-screen
   in the same direction. Show top-3 nearest, collapse rest into "+N more".

4. **Trails:** Disable trails for remotes when peer count > 8 (performance).

#### Stage 4: In-Game Leaderboard (~120 LOC, new component)

**Goal:** Live position ranking during gameplay.

1. **New file: `src/multiplayer/LiveLeaderboard.ts`**
   - Compact overlay, top-left corner
   - Shows: rank, color dot, height (meters), local player highlighted
   - Max 8 visible rows, scroll indicator if more
   - Update frequency: 500ms (not every frame)
   - Fade to 50% alpha after 3 seconds, full alpha on rank change

2. **Death/spectate mode:**
   - When local player dies: leaderboard stays visible
   - Show "Spectating..." label
   - Continue updating remote positions
   - Game ends when: all dead, OR timer expires, OR last player standing

#### Stage 5: Results & Rematch (~100 LOC changed)

**Goal:** Full leaderboard results, rematch flow.

1. **ResultsScreen.ts** — Replace binary comparison with sorted list:
   - Sort all players by height (or score in timed mode)
   - Show rank 1-N with character sprite, height, color dot
   - Highlight local player position
   - Stats row: platforms, meatballs, powerups used

2. **Rematch flow:**
   - "Rematch" button returns to lobby, preserves player list
   - Players who disconnected are removed
   - New players can join if lobby isn't full

### Performance Budget

| Peers | Connections | Bandwidth (out) | Memory (est) | Target FPS |
|-------|------------|-----------------|-------------|------------|
| 2     | 1          | 380 B/s         | ~20 MB      | 60         |
| 8     | 7          | 2.7 KB/s        | ~70 MB      | 60         |
| 12    | 11         | 4.2 KB/s        | ~110 MB     | 60         |
| 24    | 23         | 8.7 KB/s        | ~230 MB     | 45+        |

**Adaptive quality:** If FPS drops below 45 with many peers:
1. Disable remote player trails (biggest savings)
2. Reduce remote render to simple colored circles (skip character sprites)
3. Cap position sync to 10Hz for peers ranked far from local player

### Implementation Order

1. Stage 1 (multi-peer GameSync) — foundation, everything depends on this
2. Stage 3 (multi-shadow rendering) — visible progress, testable with 2 peers
3. Stage 2 (lobby redesign) — needed before real multi-peer testing
4. Stage 4 (live leaderboard) — polish
5. Stage 5 (results & rematch) — polish

Estimated total: ~650 LOC across 6-8 files. 3-4 sessions.
