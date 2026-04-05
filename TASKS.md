# Open Tasks

## 1. Daily Challenge

- [ ] Random custom run config generated from date seed (same for all players that day)
- [ ] Point threshold to "succeed" (e.g. reach X score = gold, Y = silver, Z = bronze)
- [ ] Daily challenge UI on title screen (shows today's challenge, best result, streak)
- [ ] Leaderboard for daily challenge (local — track personal bests per day)
- [ ] Achievements for daily challenges:
  - [ ] First daily completed
  - [ ] 7-day streak
  - [ ] 30-day streak
  - [ ] Gold on a daily
  - [ ] All three medals collected in one week

## 2. Shadow Replay on Normal Runs

- [ ] Record player position each tick during a run (compact format)
- [ ] On next run, replay the recording as a ghost/shadow
- [ ] Shadow rendered like multiplayer remote player (semi-transparent, tinted)
- [ ] Option to race against personal best or last run
- [ ] Store best-run shadow in localStorage

## 3. Large Multiplayer (up to 24 players)

### Connection & Architecture
- [ ] Investigate Trystero/Nostr room capacity (can one room handle 24 peers?)
- [ ] If peer-to-peer doesn't scale, consider relay-based position broadcast
- [ ] Each player runs own game (shared seed), syncs position only (current model)
- [ ] Binary position packets stay at 20Hz per player

### Lobby Redesign
- [ ] Scrollable player list (show character sprite, name/ID, ready status)
- [ ] Host controls: mode, theme, custom run (as now)
- [ ] Ready-up timer: host clicks Ready → 15 sec countdown starts
  - If all players ready before timer: instant 3-sec countdown → start
  - If timer expires: start anyway (unready players still join)
  - Players who join mid-countdown get synced in
- [ ] Lobby size selector (2, 4, 8, 12, 24)
- [ ] Room code displayed prominently for sharing
- [ ] Player count indicator (e.g. "Players: 5/12")

### In-Game
- [ ] All players visible as shadows (semi-transparent, color-coded)
- [ ] Position leaderboard (top-left, compact, scrollable if >8 players)
  - Shows rank, player color dot, height
  - Updates in real-time
  - Highlight local player
- [ ] Ghost mode after death (watch others, frozen score)
- [ ] Game ends when all players dead OR timer expires (timed mode)
- [ ] Custom characters visible for all players (synced in lobby)

### Results Screen
- [ ] Full ranking with all players
- [ ] Stats: height, score, platforms passed, meatballs
- [ ] Rematch option (returns to lobby, preserves player list)

### Performance
- [ ] Profile with 24 shadow renderers active
- [ ] Reduce shadow render detail if FPS drops (skip trail, simplify sprite)
- [ ] Cap position sync rate per player if bandwidth is an issue
