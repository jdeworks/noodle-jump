/** Game-wide constants — tweak here, not in logic files. */

// ── Canvas ──────────────────────────────────────────────────────────────────
export const GAME_WIDTH = 400
export const GAME_HEIGHT = 700

// ── Player ──────────────────────────────────────────────────────────────────
export const PLAYER_WIDTH = 32
export const PLAYER_HEIGHT = 40
export const PLAYER_JUMP_VELOCITY = -15
export const PLAYER_MOVE_SPEED = 6
export const PLAYER_MAX_HORIZONTAL_SPEED = 8

// ── Physics ─────────────────────────────────────────────────────────────────
export const GRAVITY = 0.45
export const FIXED_TIMESTEP = 1000 / 60

// ── Platforms ───────────────────────────────────────────────────────────────
export const PLATFORM_WIDTH_MIN = 90
export const PLATFORM_WIDTH_MAX = 150
export const PLATFORM_HEIGHT = 15
export const PLATFORM_GAP_MIN = 60
export const PLATFORM_GAP_MAX = 110
export const PLATFORM_COUNT_BUFFER = 20 // platforms generated ahead of camera
export const PLATFORM_HORIZONTAL_MARGIN = 20
export const PLATFORM_BREAK_CHANCE = 0.10 // 10% chance a platform is breakable (bounces once)
export const PLATFORM_BRITTLE_CHANCE = 0.08 // 8% chance a platform is brittle (instant fall-through)
export const PLATFORM_MOVING_CHANCE = 0.12 // 12% chance a platform moves
export const PLATFORM_MOVING_SPEED = 1.5
export const PLATFORM_MOVING_RANGE = 60 // pixels each direction from start

// ── Collectibles ────────────────────────────────────────────────────────────
export const MEATBALL_SIZE = 22
export const MEATBALL_SPAWN_CHANCE = 0.25 // 25% of platforms have a meatball
export const MEATBALL_POINTS = 1000
export const MEATBALL_FLOAT_HEIGHT = 40 // pixels above the platform

// ── Power-ups ───────────────────────────────────────────────────────────────
export const POWERUP_SIZE = 20
export const POWERUP_FLOAT_HEIGHT = 35
export const POWERUP_SPAWN_CHANCE = 0.08 // 8% per platform
export const POWERUP_COOLDOWN = 5 // skip N platforms after a spawn before allowing another
export const POWERUP_POINTS = 100

// Power-up effect values
// Spaghetti Spring: instant mega-jump — biggest single launch
export const SPAGHETTI_SPRING_VELOCITY = -30

// Fusilli Tornado: fast sustained climb for 5 seconds — covers a LOT of height
export const FUSILLI_TORNADO_VELOCITY = -10
export const FUSILLI_TORNADO_DURATION = 300

// Ravioli Rocket: very fast sustained blast for 3 seconds — fastest power-up
export const RAVIOLI_ROCKET_VELOCITY = -14
export const RAVIOLI_ROCKET_DURATION = 180

// Lasagna Layers: 6 seconds of near-zero gravity — float like a feather
export const LASAGNA_LAYERS_DURATION = 360
export const LASAGNA_GRAVITY_MULTIPLIER = 0.08 // 8% gravity — barely falls

// Pepper Sneeze: violent burst upward — longer duration, shakes screen
export const PEPPER_SNEEZE_VELOCITY = -25
export const PEPPER_SNEEZE_DURATION = 30 // ~0.5 seconds of upward force

// ── Camera ──────────────────────────────────────────────────────────────────
export const CAMERA_LERP_SPEED = 0.1
export const CAMERA_GRACE_PLATFORMS = 3 // how many platform-heights below camera before death
export const CAMERA_DEAD_ZONE_TOP = 0.35 // player position threshold to start scrolling up

// ── Debug ───────────────────────────────────────────────────────────────────
export const DEBUG_MODE = true // set to false for production

// ── Zones ───────────────────────────────────────────────────────────────────
export const ZONE_THRESHOLDS = DEBUG_MODE ? [0, 10, 25] : [0, 80, 280]

// ── Colors (placeholder until pixel art) ────────────────────────────────────
export const COLORS = {
  background: [0xfff8e7, 0xd4e6f1, 0x1a1a2e] as const, // per zone
  platform: [0xd4a574, 0x7fb3d8, 0x6c3483] as const,
  platformBreaking: 0x8b6914, // wet pasta brown
  platformBrittle: 0xc4a882, // pale/crumbly pasta
  platformLasagna: 0xff8c00, // orange cheese — matches lasagna power-up
  player: 0xe94560,
  powerups: {
    spaghetti_spring: 0xf5deb3, // wheat/spaghetti
    fusilli_tornado: 0xd4a017, // golden spiral
    ravioli_rocket: 0xc0392b, // tomato red
    lasagna_layers: 0xff8c00, // orange cheese
    pepper_sneeze: 0x8b0000, // dark red pepper
  } as Record<string, number>,
}
