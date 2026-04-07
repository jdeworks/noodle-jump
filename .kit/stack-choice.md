# Stack choice — browser game engines

This variant uses Phaser 3 as its primary example.

## Choose Phaser when

- Building a 2D game with physics, tilemaps, animations
- You want a full-featured game framework (not just a renderer)
- You need built-in input handling, audio, and scene management
- Community size and tutorials matter

## Choose PixiJS when

- You need a lightweight 2D renderer without framework overhead
- Building custom game logic from scratch (you want control)
- Creating interactive visualizations or animations, not traditional games
- Performance is critical — PixiJS is the fastest 2D WebGL renderer

## Choose Three.js when

- Building a 3D game or experience
- You want a rendering library, not a full game engine
- You'll handle game logic, physics (via Cannon.js/Rapier), and input yourself
- Large ecosystem of examples and extensions

## Choose Babylon.js when

- Building a 3D game with a full engine (physics, GUI, animations built-in)
- You want an Inspector/debugger tool built into the engine
- WebXR (VR/AR) support is needed
- You prefer a more opinionated, batteries-included 3D engine

## Choose raw Canvas/WebGL when

- Learning purposes — understanding how rendering works
- Very simple games (puzzle, card games)
- You don't want any dependency

## Native engines (out of scope but noted)

For non-browser games, this variant's patterns still partially apply:

- **Godot** — open source, GDScript/C#, excellent for 2D and 3D
- **Unity** — C#, largest ecosystem, best for complex 3D games
- **Unreal** — C++/Blueprints, AAA quality, steep learning curve

PRs adding sub-docs for these engines are welcome.

## Mapping kit patterns to your engine

| Kit concept      | Phaser           | PixiJS            | Three.js            | Babylon.js             |
| ---------------- | ---------------- | ----------------- | ------------------- | ---------------------- |
| Scene management | Built-in Scenes  | Manual            | Manual              | Built-in Scenes        |
| Physics          | Arcade/Matter.js | Add Rapier/Cannon | Add Rapier/Cannon   | Built-in               |
| Asset loading    | Built-in Loader  | Built-in Assets   | Three.js Loader     | Built-in AssetsManager |
| Input            | Built-in Input   | Manual events     | Manual events       | Built-in ActionManager |
| Audio            | Built-in Sound   | Howler.js         | Howler.js/Web Audio | Built-in Sound         |
