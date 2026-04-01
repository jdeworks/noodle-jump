/** Music playback — MP3 tracks, crossfade, boss music, volume control. */

import { isMusicEnabled, musicVol, BASE_MUSIC_VOLUME } from "./Audio";

const MUSIC_TRACKS = [
  "audio/september.mp3",       // Zone 1: Kitchen — warm, upbeat
  "audio/zone2-ocean.mp3",     // Zone 2: Ocean — cinematic adventure
  "audio/zone3-space.mp3",     // Zone 3: Space — cosmic, atmospheric
  "audio/zone4-freezer.mp3",   // Zone 4: Freezer — ethereal pan flute
  "audio/zone5-volcano.mp3",   // Zone 5: Volcano — energetic dubstep
  "audio/zone6-candy.mp3",     // Zone 6: Candy — gentle modern classical
  "audio/zone7-final.mp3",     // Zone 7: Final Kitchen — dark, epic
];

export const TITLE_TRACK = "audio/title-screen.mp3";

let musicElement: HTMLAudioElement | null = null;
let musicPlaying = false;
let currentMusicZone = -1;

// Track active fade intervals so we can cancel them
let activeFadeIntervals: ReturnType<typeof setInterval>[] = [];

function targetVol(): number { return musicVol() * BASE_MUSIC_VOLUME; }

/** Cancel all active fade intervals to prevent music overlap. */
function cancelAllFades(): void {
  for (const id of activeFadeIntervals) clearInterval(id);
  activeFadeIntervals = [];
}

function trackInterval(id: ReturnType<typeof setInterval>): ReturnType<typeof setInterval> {
  activeFadeIntervals.push(id);
  return id;
}

function removeInterval(id: ReturnType<typeof setInterval>): void {
  clearInterval(id);
  activeFadeIntervals = activeFadeIntervals.filter((i) => i !== id);
}

export function applyMusicVolume(): void {
  if (musicElement) musicElement.volume = targetVol();
  if (bossMusicElement) bossMusicElement.volume = targetVol();
}

export function playMusic(_zone?: number): void {
  if (!isMusicEnabled() || musicPlaying) return;
  const idx = Math.min(_zone ?? 0, MUSIC_TRACKS.length - 1);
  if (!musicElement) {
    musicElement = new Audio(MUSIC_TRACKS[idx]);
    musicElement.loop = true;
  } else {
    musicElement.src = MUSIC_TRACKS[idx];
  }
  musicElement.volume = targetVol();
  musicElement.play().catch(() => {});
  musicPlaying = true;
  currentMusicZone = _zone ?? 0;
}

export function playTitleMusic(): void {
  if (!isMusicEnabled()) return;
  if (!musicElement) {
    musicElement = new Audio(TITLE_TRACK);
    musicElement.loop = true;
  } else {
    musicElement.src = TITLE_TRACK;
  }
  musicElement.volume = targetVol();
  musicElement.play().catch(() => {});
  musicPlaying = true;
  currentMusicZone = -1;
}

export function stopMusic(): void {
  cancelAllFades();
  if (musicElement) { musicElement.pause(); musicElement.currentTime = 0; }
  musicPlaying = false;
  currentMusicZone = -1;
}

export function crossfadeToZone(zone: number): void {
  if (zone === currentMusicZone || !isMusicEnabled() || !musicElement) return;
  const trackIdx = Math.min(zone, MUSIC_TRACKS.length - 1);
  const curIdx = Math.min(currentMusicZone, MUSIC_TRACKS.length - 1);
  if (trackIdx === curIdx) { currentMusicZone = zone; return; }

  const fadeOut = trackInterval(setInterval(() => {
    if (!musicElement || !musicPlaying) { removeInterval(fadeOut); return; }
    musicElement.volume = Math.max(0, musicElement.volume - 0.03);
    if (musicElement.volume <= 0.01) {
      removeInterval(fadeOut);
      musicElement.src = MUSIC_TRACKS[trackIdx];
      musicElement.volume = 0;
      musicElement.play().catch(() => {});
      const fadeIn = trackInterval(setInterval(() => {
        if (!musicElement || !musicPlaying) { removeInterval(fadeIn); return; }
        const tv = targetVol();
        musicElement.volume = Math.min(tv, musicElement.volume + 0.03);
        if (musicElement.volume >= tv - 0.01) removeInterval(fadeIn);
      }, 50));
      currentMusicZone = zone;
    }
  }, 50));
}

// ── Boss music ────────────────────────────────────────────────────────────

const BOSS_TRACK = "audio/boss-battle.mp3";
let bossMusicElement: HTMLAudioElement | null = null;
let bossMusicPlaying = false;

export function playBossMusic(): void {
  if (!isMusicEnabled() || bossMusicPlaying) return;
  // Immediately stop zone music (cancel any ongoing crossfades)
  cancelAllFades();
  if (musicElement) { musicElement.pause(); }
  musicPlaying = false;

  if (!bossMusicElement) { bossMusicElement = new Audio(BOSS_TRACK); bossMusicElement.loop = true; }
  bossMusicElement.volume = 0;
  bossMusicElement.play().catch(() => {});
  bossMusicPlaying = true;
  const fi = trackInterval(setInterval(() => {
    if (!bossMusicElement) { removeInterval(fi); return; }
    const tv = targetVol();
    bossMusicElement.volume = Math.min(tv, bossMusicElement.volume + 0.02);
    if (bossMusicElement.volume >= tv - 0.01) removeInterval(fi);
  }, 30));
}

export function stopBossMusic(resumeZoneMusic = true): void {
  if (!bossMusicPlaying && !bossMusicElement) return;
  if (bossMusicElement) {
    const fo = trackInterval(setInterval(() => {
      if (!bossMusicElement) { removeInterval(fo); return; }
      bossMusicElement.volume = Math.max(0, bossMusicElement.volume - 0.03);
      if (bossMusicElement.volume <= 0.01) {
        removeInterval(fo);
        bossMusicElement.pause();
        bossMusicElement.currentTime = 0;
        bossMusicPlaying = false;
        // Resume zone music only AFTER boss music fade-out completes
        if (resumeZoneMusic && musicElement && isMusicEnabled()) {
          musicElement.volume = 0;
          musicElement.play().catch(() => {});
          musicPlaying = true;
          const fi = trackInterval(setInterval(() => {
            if (!musicElement) { removeInterval(fi); return; }
            const tv = targetVol();
            musicElement.volume = Math.min(tv, musicElement.volume + 0.02);
            if (musicElement.volume >= tv - 0.01) removeInterval(fi);
          }, 30));
        }
      }
    }, 30));
  }
}

/** Immediately stop boss music without fade — used during game over/restart. */
export function killBossMusic(): void {
  cancelAllFades();
  if (bossMusicElement) {
    bossMusicElement.pause();
    bossMusicElement.currentTime = 0;
  }
  bossMusicPlaying = false;
}

// ── Pause/resume on visibility change ────────────────────────────────────

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (musicElement && musicPlaying) musicElement.pause();
      if (bossMusicElement && bossMusicPlaying) bossMusicElement.pause();
    } else {
      if (musicElement && musicPlaying && isMusicEnabled()) {
        musicElement.play().catch(() => {});
      }
      if (bossMusicElement && bossMusicPlaying && isMusicEnabled()) {
        bossMusicElement.play().catch(() => {});
      }
    }
  });
}
