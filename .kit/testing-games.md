# Testing games

Testing game logic without needing a canvas.

> **PixiJS in tests:** PixiJS requires a browser canvas. In Node/CI, import the mock helper:
> `import "./helpers/mock-pixi"` at the top of any test that touches pixi types. See
> `tests/helpers/mock-pixi.ts` in the PixiJS starter.

## What to test

- **Game logic** — scoring, health, inventory, level progression, win/lose conditions
- **State transitions** — menu → gameplay → game-over
- **Data processing** — level parsing, save/load serialization
- **Utility functions** — collision math, random generation, coordinate conversion

## What NOT to test

- **Rendering** — visual output (test manually or with screenshot comparison)
- **Input handling** — platform-specific (test via integration/manual)
- **Audio playback** — test that the right sound is triggered, not that it plays
- **Engine internals** — trust the framework

## Example tests

```typescript
import { Player } from '../src/entities/Player'
import { Scoring } from '../src/systems/Scoring'

describe('Player', () => {
  test('takes damage correctly', () => {
    const player = new Player()
    player.takeDamage(30)
    expect(player.health).toBe(70)
  })

  test('cannot go below 0 health', () => {
    const player = new Player()
    player.takeDamage(999)
    expect(player.health).toBe(0)
  })

  test('reports death when health reaches 0', () => {
    const player = new Player()
    const isDead = player.takeDamage(100)
    expect(isDead).toBe(true)
  })
})

describe('Scoring', () => {
  test('awards combo bonus', () => {
    const scoring = new Scoring()
    scoring.addKill()
    scoring.addKill()  // within combo window
    expect(scoring.score).toBeGreaterThan(200)  // base 100 * 2 + combo
  })
})
```

## Separation pattern

The key to testable games is separating logic from the engine:

```typescript
// Testable (no engine dependency)
export function calculateDamage(base: number, armor: number): number {
  return Math.max(1, base - armor)
}

// Engine-dependent (not unit-tested)
scene.events.on('hit', (target, projectile) => {
  const damage = calculateDamage(projectile.power, target.armor)
  target.entity.takeDamage(damage)
})
```

Test `calculateDamage` directly. The event wiring is tested via play testing.

## Multiplayer and state machine testing

Multiplayer games introduce distributed state, timing-sensitive logic, and message routing
that are hard to test manually but straightforward to unit test.

### Deterministic election / consensus

All peers must compute the same result regardless of message arrival order. Test this by
shuffling inputs and asserting identical output:

```typescript
import { electHost } from '../src/multiplayer/Election'

describe('host election', () => {
  const peers = ['peer-abc', 'peer-def', 'peer-ghi']

  test('same result regardless of input order', () => {
    const orders = [
      ['peer-abc', 'peer-def', 'peer-ghi'],
      ['peer-ghi', 'peer-abc', 'peer-def'],
      ['peer-def', 'peer-ghi', 'peer-abc'],
    ]
    const results = orders.map((o) => electHost(o))
    expect(new Set(results).size).toBe(1) // all identical
  })

  test('deterministic with duplicate peer lists', () => {
    const a = electHost([...peers, ...peers])
    const b = electHost(peers)
    expect(a).toBe(b)
  })
})
```

### State machine transitions

Model lobby/countdown/game states as explicit transitions. Test each transition
independently — no timers, no rendering:

```typescript
import { LobbyState, lobbyTransition } from '../src/multiplayer/LobbyState'

describe('lobby state machine', () => {
  test('evaluate: all ready starts countdown', () => {
    const state: LobbyState = { phase: 'waiting', peers: ['a', 'b'], ready: ['a', 'b'] }
    const next = lobbyTransition(state, { type: 'evaluate' })
    expect(next.phase).toBe('countdown')
    expect(next.countdownMs).toBe(3000)
  })

  test('tick: countdown decreases remaining time', () => {
    const state: LobbyState = { phase: 'countdown', countdownMs: 3000 }
    const next = lobbyTransition(state, { type: 'tick', deltaMs: 1000 })
    expect(next.countdownMs).toBe(2000)
  })

  test('cancel: peer leaving during countdown resets to waiting', () => {
    const state: LobbyState = { phase: 'countdown', countdownMs: 1500, peers: ['a', 'b'] }
    const next = lobbyTransition(state, { type: 'peer-left', peerId: 'b' })
    expect(next.phase).toBe('waiting')
    expect(next.peers).not.toContain('b')
  })

  test('countdown reaching 0 transitions to playing', () => {
    const state: LobbyState = { phase: 'countdown', countdownMs: 100 }
    const next = lobbyTransition(state, { type: 'tick', deltaMs: 200 })
    expect(next.phase).toBe('playing')
  })
})
```

### Framerate regression tests

Game logic using `deltaTime` can drift at high framerates. Test with realistic
`speedScale` values to catch issues like cooldowns that never reach zero due to
floating-point accumulation:

```typescript
describe('framerate independence', () => {
  test('cooldown expires at 144 FPS', () => {
    const speedScale = 60 / 144 // simulate 144 FPS
    let cooldown = 60 // 60 logical frames = 1 second at 60 FPS

    // Simulate 144 ticks (1 second of real time)
    for (let i = 0; i < 144; i++) {
      cooldown = Math.max(0, cooldown - speedScale)
    }
    expect(cooldown).toBe(0)
  })

  test('ability fires exactly once per cooldown period', () => {
    const speedScale = 60 / 144
    let cooldown = 0
    let fireCount = 0
    const cooldownDuration = 30 // half-second cooldown

    // Simulate 3 seconds at 144 FPS
    for (let i = 0; i < 144 * 3; i++) {
      cooldown = Math.max(0, cooldown - speedScale)
      if (cooldown <= 0) {
        fireCount++
        cooldown = cooldownDuration
      }
    }
    // Should fire ~6 times in 3 seconds with 0.5s cooldown
    expect(fireCount).toBeGreaterThanOrEqual(5)
    expect(fireCount).toBeLessThanOrEqual(7)
  })
})
```

### Integration routing

Verify that messages from a specific peer are routed to the correct buffer and
don't leak to other peers:

```typescript
import { InterpolationBuffer } from '../src/multiplayer/InterpolationBuffer'

describe('message routing', () => {
  test('peer A messages reach buffer A, not buffer B', () => {
    const bufferA = new InterpolationBuffer()
    const bufferB = new InterpolationBuffer()
    const buffers = new Map([['peer-a', bufferA], ['peer-b', bufferB]])

    const message = { from: 'peer-a', x: 100, y: 200, t: Date.now() }
    const target = buffers.get(message.from)
    target?.push(message)

    expect(bufferA.length).toBe(1)
    expect(bufferB.length).toBe(0)
  })

  test('unknown peer messages are dropped', () => {
    const buffers = new Map<string, InterpolationBuffer>()
    const message = { from: 'peer-unknown', x: 0, y: 0, t: Date.now() }
    const target = buffers.get(message.from)
    target?.push(message) // should be undefined, no-op

    expect(buffers.size).toBe(0)
  })
})
```
