# Iron-out Session — Status

All P1/P2/P3 items implemented. Field testing complete.

## Remaining Known Issues

- Trystero "User-Initiated Abort" console error on peer disconnect — library internal, can't suppress
- At very low game speeds (0.25x), tick-based animations (platform wobble, teleport pulse) step visibly since animTick only increments on game ticks
- isDailyChallenge field in RunConfig is defined but unused in game logic
