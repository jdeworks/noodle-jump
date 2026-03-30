# Noodle Jump

A pasta-themed endless jumper built with PixiJS and TypeScript.

**[Play now](https://jdeworks.github.io/noodle-jump/)**

## Features

- Tilt controls on mobile, keyboard (arrow keys / WASD) on desktop
- 10 power-ups — 5 positive (spring boots, tornado, rocket, lasagna layers, meatball magnet) and 4 negative (chili pepper, soggy noodle, garlic breath, burnt toast)
- 3 themed zones (Kitchen, Ocean, Space) with parallax backgrounds
- Progressive difficulty scaling
- Combo system, close-call bonuses, and landing streaks
- Procedural SFX via Web Audio API
- High score tracking with share button

## Development

```bash
npm install
npx vite --host 0.0.0.0
```

### Build

```bash
npx vite build   # outputs to docs/
```

### Tests

```bash
npx vitest run    # 92 tests
npx tsc --noEmit  # type check
```

## Credits

### Music

Background music used under the [Pixabay Content License](https://pixabay.com/service/license-summary/).

- **"September"** by Lexin_Music — [Pixabay](https://pixabay.com/music/beats-september-219737/)
- **"Background Music"** by DayFox — [Pixabay](https://pixabay.com/music/electronic-background-music-507928/)

### Built with

- [PixiJS](https://pixijs.com/) — 2D WebGL renderer
- [Vite](https://vitejs.dev/) — Build tool
- [TypeScript](https://www.typescriptlang.org/)
