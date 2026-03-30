# Game architecture

Structuring game code for maintainability.

## Scene-based organization

Every distinct game screen is its own scene:

```
src/
  scenes/
    Boot.ts           # Load minimal assets, show loading screen
    Preloader.ts      # Load all game assets
    MainMenu.ts       # Title screen, settings
    GamePlay.ts       # Main game loop
    GameOver.ts       # Score display, retry
  entities/
    Player.ts         # Player logic and state
    Enemy.ts          # Enemy behavior
    Projectile.ts     # Bullets, arrows, etc.
  systems/
    Physics.ts        # Collision detection, movement
    Scoring.ts        # Score tracking, combos
    Audio.ts          # Sound effect management
  config/
    constants.ts      # Game constants (speed, sizes, tuning)
    assets.ts         # Asset keys and paths
  main.ts             # Game initialization
```

## Separate logic from rendering

Game logic (state, rules, physics) should be testable without a canvas:

```typescript
// GOOD — pure logic, testable
class Player {
  health = 100
  takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount)
    return this.health <= 0  // returns true if dead
  }
}

// Rendering is separate
class PlayerSprite {
  constructor(scene: Phaser.Scene, private player: Player) {
    // Create sprite, animations, etc.
  }
  update() {
    // Sync sprite position/state with player logic
  }
}
```

## Entity-Component-System (ECS)

For complex games, consider ECS:
- **Entity** — a unique ID (the "thing")
- **Component** — data attached to an entity (Position, Health, Renderable)
- **System** — logic that operates on entities with specific components

ECS scales better than deep inheritance hierarchies. Libraries: bitECS, miniplex.

## State management

- Keep game state in a central store or on entities — not scattered in UI code
- Save/load game state by serializing the state object
- Use events/signals for communication between systems, not direct references
