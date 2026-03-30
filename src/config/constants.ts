/** Game-wide constants — tweak here, not in logic files. */

// ── Debug ───────────────────────────────────────────────────────────────────
export const DEBUG_MODE = false; // set to false for production

// ── Canvas ──────────────────────────────────────────────────────────────────
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 700;

// ── Player ──────────────────────────────────────────────────────────────────
export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 40;
export const PLAYER_JUMP_VELOCITY = -15;
export const PLAYER_MOVE_SPEED = 6;
export const PLAYER_MAX_HORIZONTAL_SPEED = 8;

// ── Physics ─────────────────────────────────────────────────────────────────
export const GRAVITY = 0.45;
export const FIXED_TIMESTEP = 1000 / 60;

// ── Platforms ───────────────────────────────────────────────────────────────
export const PLATFORM_WIDTH_MIN = 90;
export const PLATFORM_WIDTH_MAX = 150;
export const PLATFORM_HEIGHT = 15;
export const PLATFORM_GAP_MIN = 60;
export const PLATFORM_GAP_MAX = 110;
export const PLATFORM_COUNT_BUFFER = 20; // platforms generated ahead of camera
export const PLATFORM_HORIZONTAL_MARGIN = 20;
export const PLATFORM_BREAK_CHANCE = 0.1; // 10% chance a platform is breakable (bounces once)
export const PLATFORM_BRITTLE_CHANCE = 0.08; // 8% chance a platform is brittle (instant fall-through)
export const PLATFORM_MOVING_CHANCE = 0.12; // 12% chance a platform moves
export const PLATFORM_MOVING_SPEED = 1.5;
export const PLATFORM_MOVING_RANGE = 60; // pixels each direction from start

// ── Collectibles ────────────────────────────────────────────────────────────
export const MEATBALL_SIZE = 22;
export const MEATBALL_SPAWN_CHANCE = 0.25; // 25% of platforms have a meatball
export const MEATBALL_POINTS = 1000;
export const MEATBALL_FLOAT_HEIGHT = 40; // pixels above the platform

// ── Power-ups ───────────────────────────────────────────────────────────────
export const POWERUP_SIZE = 20;
export const POWERUP_FLOAT_HEIGHT = 35;
export const POWERUP_SPAWN_CHANCE = DEBUG_MODE ? 0.4 : 0.15; // 40% in debug, 15% in prod
export const POWERUP_COOLDOWN = 3; // skip N platforms after a spawn before allowing another
export const POWERUP_POINTS = 100;

// Power-up effect values
// Spaghetti Spring: instant mega-jump — biggest single launch
export const SPAGHETTI_SPRING_VELOCITY = -30;

// Fusilli Tornado: fast sustained climb for 5 seconds — covers a LOT of height
export const FUSILLI_TORNADO_VELOCITY = -10;
export const FUSILLI_TORNADO_DURATION = 300;

// Ravioli Rocket: very fast sustained blast for 3 seconds — fastest power-up
export const RAVIOLI_ROCKET_VELOCITY = -14;
export const RAVIOLI_ROCKET_DURATION = 180;

// Lasagna Layers: 6 seconds of near-zero gravity — float like a feather
export const LASAGNA_LAYERS_DURATION = 360;
export const LASAGNA_GRAVITY_MULTIPLIER = 0.08; // 8% gravity — barely falls

// Pepper Sneeze: violent burst upward — longer duration, shakes screen
export const PEPPER_SNEEZE_VELOCITY = -25;
export const PEPPER_SNEEZE_DURATION = 30; // ~0.5 seconds of upward force

// Negative power-ups — 5 seconds each (~300 ticks at 60fps)
export const NEGATIVE_EFFECT_DURATION = 300;
// Burnt Toast: platform width multiplier during effect
export const BURNT_TOAST_SHRINK = 0.5;
// Garlic Breath: jump velocity multiplier (weaker bounces)
export const GARLIC_BREATH_JUMP_MULTIPLIER = 0.6;

// Meatball Magnet: attracts all visible meatballs on screen
export const MEATBALL_MAGNET_DURATION = 300;
export const MEATBALL_MAGNET_RADIUS = 800;

// ── Combo / Close Call ─────────────────────────────────────────────────────
export const COMBO_TIMEOUT_TICKS = 120; // 2 seconds at 60fps
export const COMBO_MAX_MULTIPLIER = 4;
export const CLOSE_CALL_THRESHOLD = 5; // pixels from platform edge
export const CLOSE_CALL_BONUS = 250;
export const LANDING_STREAK_INTERVAL = 5; // every N consecutive landings
export const LANDING_STREAK_BONUS = 500;

// ── Difficulty scaling ─────────────────────────────────────────────────────
export const DIFFICULTY_RAMP_PLATFORMS = 800; // platforms to reach max difficulty
export const DIFFICULTY_PLATFORM_WIDTH_MIN_HARD = 50;
export const DIFFICULTY_PLATFORM_WIDTH_MAX_HARD = 85;
export const DIFFICULTY_GAP_MAX_HARD = 170;
export const DIFFICULTY_NEGATIVE_CHANCE_HARD = 0.6;
export const DIFFICULTY_BREAK_CHANCE_HARD = 0.75; // late scene 3: nearly all one-time platforms
export const DIFFICULTY_BRITTLE_CHANCE_HARD = 0.12;

// ── Death animation ────────────────────────────────────────────────────────
export const DEATH_ANIMATION_TICKS = 60;

// ── Camera ──────────────────────────────────────────────────────────────────
export const CAMERA_LERP_SPEED = 0.1;
export const CAMERA_GRACE_PLATFORMS = 3; // how many platform-heights below camera before death
export const CAMERA_DEAD_ZONE_TOP = 0.35; // player position threshold to start scrolling up

// ── Zones ───────────────────────────────────────────────────────────────────
export const ZONE_THRESHOLDS = DEBUG_MODE ? [0, 10, 25] : [0, 80, 280];

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
    meatball_magnet: 0xcc6699, // pink magnet
    // Negative power-ups — distinct warning colors
    chili_pepper: 0xff2200, // angry red
    soggy_noodle: 0x5588cc, // wet blue
    garlic_breath: 0x88bb44, // green gas
    burnt_toast: 0x3d2b1f, // charred dark brown
  } as Record<string, number>,
};
