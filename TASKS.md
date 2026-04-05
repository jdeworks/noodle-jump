# Iron-out Tasks

## P1: Wire up dead custom run settings

- [x] **P1.1** gameSpeed — scale tick logic by gameSpeed multiplier
- [x] **P1.2** difficultyMultiplier — pass into getDifficulty() and scale ramp
- [x] **P1.3** startingZone — initialize game at selected zone
- [x] **P1.4** startingPlatforms — initialize platformsPassed from config
- [x] **P1.5** enemySpawnMultiplier — apply to spawn interval in EnemySpawner
- [x] **P1.6** bossAttackMultiplier — apply to boss tick/attack intervals
- [x] **P1.7** forceBossType — override boss selection at zone transition
- [x] **P1.8** forceBossAtPlatforms — trigger boss at specific platform count
- [x] **P1.9** forcePlatformType — override platform type in generation
- [x] **P1.10** disableWeather — skip weather rendering when set
- [x] **P1.11** disableParallax — skip parallax rendering when set
- [x] **P1.12** disableEffectParticles — skip effect particles when set

## P2: Trail improvements (non-rainbow flair)

- [x] **P2.1** Fire trail — upward drift, flicker, longer lifetime
- [x] **P2.2** Neon trail — alpha pulse, jitter, electric feel
- [x] **P2.3** Sparkle trail — twinkle oscillation, size alternation
- [x] **P2.4** Hearts trail — dissolving sub-particles, float upward
- [x] **P2.5** Stars trail — spawn flare, brighter, longer lifetime
- [x] **P2.6** Snow trail — size variation, linger, gentle fall
- [x] **P2.7** Increase particle count/lifetime for all non-rainbow trails

## P3: Multiplayer custom run settings + theme sharing

- [x] **P3.1** Share theme selection — host sets theme for both players
- [x] **P3.2** Apply shared theme to game scene via setCosmeticTheme()
- [x] **P3.3** Theme synced in lobby ready/start events
- [x] **P3.4** Theme applied on rematch in OnlineSession
