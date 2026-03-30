/** Procedural audio — Web Audio API, no external files. */

const SETTINGS_KEY = "noodle-jump-audio-settings";

interface AudioSettings {
  sfxEnabled: boolean;
  musicEnabled: boolean;
}

let ctx: AudioContext | null = null;
let settings: AudioSettings = { sfxEnabled: true, musicEnabled: true };
let currentMusicZone = -1;

function loadSettings(): void {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) settings = JSON.parse(stored);
  } catch {
    // use defaults
  }
}

function saveSettings(): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be unavailable
  }
}

loadSettings();

/** Initialize audio context. Must be called from a user gesture. */
export function initAudio(): void {
  if (ctx) return;
  ctx = new AudioContext();
}

function ensureContext(): AudioContext | null {
  if (!ctx) return null;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function isSfxEnabled(): boolean {
  return settings.sfxEnabled;
}
export function isMusicEnabled(): boolean {
  return settings.musicEnabled;
}

export function setSfxEnabled(v: boolean): void {
  settings.sfxEnabled = v;
  saveSettings();
}

export function setMusicEnabled(v: boolean): void {
  settings.musicEnabled = v;
  if (!v) stopMusic();
  saveSettings();
}

// ── SFX helpers ─────────────────────────────────────────────────────────────

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "square",
  volume = 0.1,
  freqEnd?: number,
): void {
  const c = ensureContext();
  if (!c || !settings.sfxEnabled) return;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (freqEnd != null) {
    osc.frequency.linearRampToValueAtTime(freqEnd, c.currentTime + duration);
  }
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08): void {
  const c = ensureContext();
  if (!c || !settings.sfxEnabled) return;

  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = c.createBufferSource();
  source.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2000, c.currentTime);
  filter.frequency.linearRampToValueAtTime(200, c.currentTime + duration);

  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  source.start(c.currentTime);
}

// ── SFX functions ───────────────────────────────────────────────────────────

export function playSfxJump(): void {
  playTone(200, 0.08, "square", 0.06, 400);
}

export function playSfxMeatball(): void {
  playTone(880, 0.1, "sine", 0.08);
}

export function playSfxCombo(multiplier: number): void {
  const baseFreq = 600 + multiplier * 200;
  playTone(baseFreq, 0.12, "sine", 0.1, baseFreq + 200);
}

export function playSfxPositivePowerUp(): void {
  const c = ensureContext();
  if (!c || !settings.sfxEnabled) return;
  // Ascending arpeggio: C-E-G
  const notes = [523, 659, 784];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.1, "triangle", 0.1), i * 60);
  });
}

export function playSfxNegativePowerUp(): void {
  const c = ensureContext();
  if (!c || !settings.sfxEnabled) return;
  // Descending minor "uh oh"
  playTone(311, 0.15, "sawtooth", 0.1);
  setTimeout(() => playTone(233, 0.2, "sawtooth", 0.1), 150);
}

export function playSfxDeath(): void {
  playTone(300, 0.5, "triangle", 0.12, 50);
}

export function playSfxHighScore(): void {
  const c = ensureContext();
  if (!c || !settings.sfxEnabled) return;
  // Rapid ascending fanfare
  const notes = [523, 587, 659, 698, 784, 880];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.12, "triangle", 0.08), i * 80);
  });
}

export function playSfxPlatformCrumble(): void {
  playNoise(0.12, 0.06);
}

export function playSfxCloseCall(): void {
  playTone(1200, 0.06, "sine", 0.06, 1600);
}

export function playSfxLandingStreak(): void {
  const c = ensureContext();
  if (!c || !settings.sfxEnabled) return;
  playTone(700, 0.08, "square", 0.08, 1000);
  setTimeout(() => playTone(900, 0.1, "square", 0.08, 1200), 80);
}

// ── Music (MP3 playback) ────────────────────────────────────────────────────

// Music tracks — place MP3 files in public/audio/
const MUSIC_TRACKS = [
  "audio/september.mp3", // Zone 1 & general
  "audio/background-music.mp3", // Zone 2+
];

let musicElement: HTMLAudioElement | null = null;
let musicPlaying = false;

export function playMusic(_zone?: number): void {
  if (!settings.musicEnabled) return;
  if (musicPlaying) return;

  // Pick a track — use first available
  const trackIndex = Math.min(_zone ?? 0, MUSIC_TRACKS.length - 1);
  const src = MUSIC_TRACKS[trackIndex];

  if (!musicElement) {
    musicElement = new Audio(src);
    musicElement.loop = true;
    musicElement.volume = 0.3;
  } else {
    musicElement.src = src;
  }

  musicElement.play().catch(() => {
    // Autoplay blocked — will retry on next user gesture
  });
  musicPlaying = true;
  currentMusicZone = _zone ?? 0;
}

export function stopMusic(): void {
  if (musicElement) {
    musicElement.pause();
    musicElement.currentTime = 0;
  }
  musicPlaying = false;
  currentMusicZone = -1;
}

export function crossfadeToZone(zone: number): void {
  if (zone === currentMusicZone) return;
  if (!settings.musicEnabled || !musicElement) return;

  // If we have a different track for this zone, switch
  const trackIndex = Math.min(zone, MUSIC_TRACKS.length - 1);
  const currentIndex = Math.min(currentMusicZone, MUSIC_TRACKS.length - 1);
  if (trackIndex === currentIndex) {
    currentMusicZone = zone;
    return;
  }

  // Fade out then switch
  const fadeOut = setInterval(() => {
    if (!musicElement) {
      clearInterval(fadeOut);
      return;
    }
    musicElement.volume = Math.max(0, musicElement.volume - 0.03);
    if (musicElement.volume <= 0.01) {
      clearInterval(fadeOut);
      musicElement.src = MUSIC_TRACKS[trackIndex];
      musicElement.volume = 0;
      musicElement.play().catch(() => {});
      // Fade in
      const fadeIn = setInterval(() => {
        if (!musicElement) {
          clearInterval(fadeIn);
          return;
        }
        musicElement.volume = Math.min(0.3, musicElement.volume + 0.03);
        if (musicElement.volume >= 0.29) clearInterval(fadeIn);
      }, 50);
      currentMusicZone = zone;
    }
  }, 50);
}
