/** Audio system — settings, init, SFX primitives. Barrel re-exports. */

const SETTINGS_KEY = "noodle-jump-audio-settings";

interface AudioSettings {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
}

let ctx: AudioContext | null = null;
let settings: AudioSettings = {
  sfxEnabled: true, musicEnabled: true, sfxVolume: 70, musicVolume: 50,
};

function loadSettings(): void {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) settings = { ...settings, ...JSON.parse(stored) };
  } catch { /* defaults */ }
}

function saveSettings(): void {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

export function sfxVol(): number { return settings.sfxVolume / 100; }
export function musicVol(): number { return settings.musicVolume / 100; }

loadSettings();

export function initAudio(): void {
  if (ctx) return;
  ctx = new AudioContext();
}

export function ensureContext(): AudioContext | null {
  if (!ctx) return null;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function isSfxEnabled(): boolean { return settings.sfxEnabled; }
export function isMusicEnabled(): boolean { return settings.musicEnabled; }
export function setSfxEnabled(v: boolean): void { settings.sfxEnabled = v; saveSettings(); }
export function setMusicEnabled(v: boolean): void {
  settings.musicEnabled = v;
  if (!v) import("./MusicPlayer").then((m) => m.stopMusic());
  saveSettings();
}
export function getSfxVolume(): number { return settings.sfxVolume; }
export function setSfxVolume(v: number): void { settings.sfxVolume = Math.max(0, Math.min(100, v)); saveSettings(); }
export function getMusicVolume(): number { return settings.musicVolume; }
export function setMusicVolume(v: number): void {
  settings.musicVolume = Math.max(0, Math.min(100, v));
  import("./MusicPlayer").then((m) => m.applyMusicVolume());
  saveSettings();
}

export const BASE_MUSIC_VOLUME = 0.3;

export function playTone(
  freq: number, duration: number, type: OscillatorType = "square",
  volume = 0.1, freqEnd?: number,
): void {
  const c = ensureContext();
  if (!c || !settings.sfxEnabled) return;
  const vol = volume * sfxVol();
  if (vol <= 0) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (freqEnd != null) osc.frequency.linearRampToValueAtTime(freqEnd, c.currentTime + duration);
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain); gain.connect(c.destination);
  osc.start(c.currentTime); osc.stop(c.currentTime + duration);
}

export function playNoise(duration: number, volume = 0.08): void {
  const c = ensureContext();
  if (!c || !settings.sfxEnabled) return;
  const vol = volume * sfxVol();
  if (vol <= 0) return;
  const sz = c.sampleRate * duration;
  const buf = c.createBuffer(1, sz, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const flt = c.createBiquadFilter(); flt.type = "lowpass";
  flt.frequency.setValueAtTime(2000, c.currentTime);
  flt.frequency.linearRampToValueAtTime(200, c.currentTime + duration);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.connect(flt); flt.connect(g); g.connect(c.destination); src.start(c.currentTime);
}

// Re-exports so all consumers can import from "../systems/Audio"
export {
  playSfxJump, playSfxMeatball, playSfxDeath, playSfxPlatformCrumble,
  playSfxCloseCall, playSfxLandingStreak, playSfxHighScore,
  playSfxPositivePowerUp, playSfxNegativePowerUp, playSfxCombo,
  playSfxPowerUp, playSfxLanding, playSfxComboEscalation,
  playSfxEnemyKill, playSfxShieldAbsorb, playSfxThrow,
  playSfxWindGust, playSfxWhoosh, playSfxCrumbleWarning,
} from "./AudioSfx";

export {
  playMusic, stopMusic, crossfadeToZone,
  playBossMusic, stopBossMusic,
} from "./MusicPlayer";
