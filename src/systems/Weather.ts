/** Weather system — per-zone ambient particles. Pure logic, no PixiJS. */

import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";

export type WeatherType =
  | "steam"
  | "bubbles"
  | "stars"
  | "snow"
  | "embers"
  | "sugar_crystals"
  | "sparkles"
  | "none";

/** Zone-to-weather mapping. */
const ZONE_WEATHER: WeatherType[] = [
  "steam", // Zone 1: Kitchen
  "bubbles", // Zone 2: Ocean
  "stars", // Zone 3: Space
  "snow", // Zone 4: Freezer
  "embers", // Zone 5: Volcano
  "sugar_crystals", // Zone 6: Candy
  "sparkles", // Zone 7: Final Kitchen
];

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
}

export interface WeatherState {
  type: WeatherType;
  particles: WeatherParticle[];
  zone: number;
}

/** Create weather for a given zone. */
export function createWeather(zone: number): WeatherState {
  return {
    type: ZONE_WEATHER[Math.min(zone, ZONE_WEATHER.length - 1)],
    particles: [],
    zone,
  };
}

/** Get the weather type for a zone. */
export function getWeatherType(zone: number): WeatherType {
  return ZONE_WEATHER[Math.min(zone, ZONE_WEATHER.length - 1)];
}

/** Tick the weather — spawn new particles and update existing. */
export function tickWeather(state: WeatherState, speedScale = 1): WeatherState {
  const config = WEATHER_CONFIGS[state.type];
  if (!config) return state;

  const particles = [...state.particles];

  // Spawn
  if (
    particles.length < config.maxParticles &&
    Math.random() < config.spawnRate
  ) {
    particles.push(spawnWeatherParticle(config));
  }

  // Update
  const alive: WeatherParticle[] = [];
  for (const p of particles) {
    const updated: WeatherParticle = {
      ...p,
      x: p.x + p.vx * speedScale,
      y: p.y + p.vy * speedScale,
      alpha: p.alpha - config.fadeRate * speedScale,
      life: p.life - speedScale,
    };
    if (updated.life > 0 && updated.alpha > 0) {
      // Wrap horizontally
      if (updated.x < -10) updated.x = GAME_WIDTH + 10;
      else if (updated.x > GAME_WIDTH + 10) updated.x = -10;
      alive.push(updated);
    }
  }

  return { ...state, particles: alive };
}

/** Change weather when zone changes. */
export function changeWeatherZone(
  state: WeatherState,
  newZone: number,
): WeatherState {
  if (state.zone === newZone) return state;
  return createWeather(newZone);
}

// ── Weather configs ────────────────────────────────────────────────────

interface WeatherConfig {
  maxParticles: number;
  spawnRate: number; // probability per tick
  fadeRate: number;
  minSpeed: number;
  maxSpeed: number;
  direction: number; // angle in radians (PI/2 = down)
  dirSpread: number;
  sizeRange: [number, number];
  lifetime: number;
  color: number;
}

const DOWN = Math.PI / 2;
const UP = -Math.PI / 2;

const WEATHER_CONFIGS: Partial<Record<WeatherType, WeatherConfig>> = {
  steam: {
    maxParticles: 20,
    spawnRate: 0.15,
    fadeRate: 0.008,
    minSpeed: 0.3,
    maxSpeed: 0.8,
    direction: UP,
    dirSpread: 0.5,
    sizeRange: [3, 8],
    lifetime: 80,
    color: 0xffffff,
  },
  bubbles: {
    maxParticles: 15,
    spawnRate: 0.1,
    fadeRate: 0.01,
    minSpeed: 0.5,
    maxSpeed: 1.2,
    direction: UP,
    dirSpread: 0.3,
    sizeRange: [2, 5],
    lifetime: 60,
    color: 0x88ccff,
  },
  stars: {
    maxParticles: 25,
    spawnRate: 0.08,
    fadeRate: 0.005,
    minSpeed: 0,
    maxSpeed: 0.1,
    direction: 0,
    dirSpread: Math.PI,
    sizeRange: [1, 2],
    lifetime: 120,
    color: 0xffffff,
  },
  snow: {
    maxParticles: 30,
    spawnRate: 0.2,
    fadeRate: 0.006,
    minSpeed: 0.5,
    maxSpeed: 1.5,
    direction: DOWN,
    dirSpread: 0.4,
    sizeRange: [2, 4],
    lifetime: 100,
    color: 0xffffff,
  },
  embers: {
    maxParticles: 20,
    spawnRate: 0.15,
    fadeRate: 0.01,
    minSpeed: 0.8,
    maxSpeed: 2,
    direction: UP,
    dirSpread: 0.6,
    sizeRange: [1, 3],
    lifetime: 60,
    color: 0xff6622,
  },
  sugar_crystals: {
    maxParticles: 20,
    spawnRate: 0.12,
    fadeRate: 0.007,
    minSpeed: 0.3,
    maxSpeed: 1,
    direction: DOWN,
    dirSpread: 0.5,
    sizeRange: [2, 4],
    lifetime: 80,
    color: 0xffaadd,
  },
  sparkles: {
    maxParticles: 25,
    spawnRate: 0.15,
    fadeRate: 0.012,
    minSpeed: 0.1,
    maxSpeed: 0.5,
    direction: UP,
    dirSpread: Math.PI,
    sizeRange: [1, 3],
    lifetime: 50,
    color: 0xffee44,
  },
};

function spawnWeatherParticle(config: WeatherConfig): WeatherParticle {
  const angle = config.direction + (Math.random() - 0.5) * 2 * config.dirSpread;
  const speed =
    config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
  return {
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size:
      config.sizeRange[0] +
      Math.random() * (config.sizeRange[1] - config.sizeRange[0]),
    alpha: 0.3 + Math.random() * 0.3,
    life: config.lifetime + Math.floor(Math.random() * 20),
  };
}
