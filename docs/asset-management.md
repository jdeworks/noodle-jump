# Asset management

Loading, organizing, and optimizing game assets.

## Directory structure

```
public/
  assets/
    images/           # Sprites, backgrounds, UI elements
      player.png
      tileset.png
    audio/
      sfx/            # Sound effects
        jump.ogg
        hit.ogg
      music/          # Background music
        theme.ogg
    data/             # Level data, config
      levels.json
    fonts/            # Custom fonts
      game-font.woff2
```

## Loading assets

Load all assets in a preloader scene, not during gameplay:

```typescript
// Preloader scene
preload() {
  this.load.image('player', 'assets/images/player.png')
  this.load.audio('jump', 'assets/audio/sfx/jump.ogg')
  this.load.json('levels', 'assets/data/levels.json')
}
```

Show a loading bar during preload to give feedback.

## Asset keys

Define asset keys as constants to avoid typos:

```typescript
// config/assets.ts
export const ASSETS = {
  PLAYER: 'player',
  ENEMY: 'enemy',
  JUMP_SFX: 'jump',
  THEME_MUSIC: 'theme',
} as const
```

## Optimization

- **Sprite sheets / texture atlases** — combine many small images into one file. Reduces HTTP requests and GPU texture swaps.
- **Audio format** — use OGG Vorbis (good compression, wide support). Provide MP3 fallback for Safari.
- **Compress images** — use TinyPNG or similar. Target < 1 MB per sprite sheet.
- **Lazy load** — load assets for later levels on demand, not all upfront.
- **Tile maps** — use Tiled editor for level design. Export as JSON.

## Rules

- Never import binary assets into JS bundles — always load from `public/assets/`
- Every asset has a constant key — no string literals in game code
- Preload all assets needed for a scene before starting it
- Keep total asset size under 20 MB for reasonable load times
