/** Max duration lookup for power-up effects. */

export function getMaxDuration(type: string): number {
  switch (type) {
    case "fusilli_tornado":
      return 300;
    case "ravioli_rocket":
      return 180;
    case "lasagna_layers":
      return 360;
    case "pepper_sneeze":
      return 30;
    case "meatball_magnet":
      return 300;
    case "pasta_shield":
      return 600;
    case "gnocchi_bounce":
      return 360;
    case "minestrone_soup":
      return 480;
    case "chili_pepper":
    case "soggy_noodle":
    case "garlic_breath":
    case "burnt_toast":
      return 300;
    default:
      return 1;
  }
}
