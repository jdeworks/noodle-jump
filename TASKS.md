# Iron-out Tasks

## P1: Wire up dead custom run settings

- [ ] **P1.1** gameSpeed — scale tick logic by gameSpeed multiplier
- [ ] **P1.2** difficultyMultiplier — pass into getDifficulty() and scale ramp
- [ ] **P1.3** startingZone — initialize game at selected zone
- [ ] **P1.4** startingPlatforms — initialize platformsPassed from config
- [ ] **P1.5** enemySpawnMultiplier — apply to spawn interval in EnemySpawner
- [ ] **P1.6** bossAttackMultiplier — apply to boss tick/attack intervals
- [ ] **P1.7** forceBossType — override boss selection at zone transition
- [ ] **P1.8** forceBossAtPlatforms — trigger boss at specific platform count
- [ ] **P1.9** forcePlatformType — override platform type in generation
- [ ] **P1.10** disableWeather — skip weather rendering when set
- [ ] **P1.11** disableParallax — skip parallax rendering when set
- [ ] **P1.12** disableEffectParticles — skip effect particles when set

## P2: Trail improvements (non-rainbow flair)

- [ ] **P2.1** Fire trail — upward drift, flicker, longer lifetime
- [ ] **P2.2** Neon trail — alpha pulse, jitter, electric feel
- [ ] **P2.3** Sparkle trail — twinkle oscillation, size alternation
- [ ] **P2.4** Hearts trail — dissolving sub-particles, float upward
- [ ] **P2.5** Stars trail — spawn flare, brighter, longer lifetime
- [ ] **P2.6** Snow trail — size variation, linger, gentle fall
- [ ] **P2.7** Increase particle count/lifetime for all non-rainbow trails

## P3: Multiplayer custom run settings + theme sharing

- [ ] **P3.1** Share RunConfig + DebugConfig from host to guest in lobby
- [ ] **P3.2** Share theme selection — host sets theme for both players
- [ ] **P3.3** Apply shared settings to both game instances in MultiplayerSession
- [ ] **P3.4** Show shared settings in lobby UI (guest sees host config)
