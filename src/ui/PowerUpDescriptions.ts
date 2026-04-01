/** Human-readable power-up descriptions for HUD and encyclopedia. */

export interface PowerUpInfo {
  name: string;
  description: string;
  shortDesc: string; // for HUD (fits in ~20 chars)
  positive: boolean;
}

export const POWER_UP_INFO: Record<string, PowerUpInfo> = {
  spaghetti_spring: {
    name: "Spaghetti Spring",
    description: "Mega jump! Launches you high into the air.",
    shortDesc: "MEGA JUMP!",
    positive: true,
  },
  fusilli_tornado: {
    name: "Fusilli Tornado",
    description: "Sustained upward flight for 5 seconds.",
    shortDesc: "TORNADO FLIGHT!",
    positive: true,
  },
  ravioli_rocket: {
    name: "Ravioli Rocket",
    description: "Blast off at high speed for 3 seconds!",
    shortDesc: "ROCKET BLAST!",
    positive: true,
  },
  lasagna_layers: {
    name: "Lasagna Layers",
    description: "Spawns stepping-stone platforms above you.",
    shortDesc: "STEP STONES!",
    positive: true,
  },
  pepper_sneeze: {
    name: "Pepper Sneeze",
    description: "Violent sneeze burst propels you upward!",
    shortDesc: "ACHOO!",
    positive: true,
  },
  meatball_magnet: {
    name: "Meatball Magnet",
    description: "Attracts all nearby meatballs to you.",
    shortDesc: "MAGNET!",
    positive: true,
  },
  pasta_shield: {
    name: "Pasta Shield",
    description: "Absorbs the next negative power-up or enemy hit.",
    shortDesc: "SHIELDED!",
    positive: true,
  },

  penne_cannon: {
    name: "Penne Cannon",
    description: "Shoots platforms upward for you to jump on.",
    shortDesc: "CANNON FIRE!",
    positive: true,
  },
  gnocchi_bounce: {
    name: "Gnocchi Bounce",
    description: "Super bouncy! All platforms give 2x jump height.",
    shortDesc: "SUPER BOUNCE!",
    positive: true,
  },
  minestrone_soup: {
    name: "Minestrone Soup",
    description: "Rising soup from below! Climb fast or get souped!",
    shortDesc: "SOUP RISING!",
    positive: true,
  },
  chili_pepper: {
    name: "Chili Pepper",
    description: "Controls are inverted! Left is right!",
    shortDesc: "INVERTED!",
    positive: false,
  },
  soggy_noodle: {
    name: "Soggy Noodle",
    description: "All platforms crumble on contact.",
    shortDesc: "SOGGY!",
    positive: false,
  },
  garlic_breath: {
    name: "Garlic Breath",
    description: "Jump strength reduced. Green fog obscures view.",
    shortDesc: "WEAK JUMPS!",
    positive: false,
  },
  burnt_toast: {
    name: "Burnt Toast",
    description: "Platforms shrink to half size!",
    shortDesc: "SHRUNK!",
    positive: false,
  },
};

/** Get all power-up types that have been collected (stored in localStorage). */
export function getCollectedPowerUps(): Set<string> {
  try {
    const stored = localStorage.getItem("noodle-jump-collected-powerups");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

/** Mark a power-up type as collected. */
export function markPowerUpCollected(type: string): void {
  const collected = getCollectedPowerUps();
  collected.add(type);
  try {
    localStorage.setItem(
      "noodle-jump-collected-powerups",
      JSON.stringify([...collected]),
    );
  } catch {
    // localStorage may be unavailable
  }
}
