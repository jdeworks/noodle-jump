/** Ambient zone audio — procedural background loops via Web Audio API. */

let ctx: AudioContext | null = null;
let currentZone = -1;
let ambientGain: GainNode | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientNoise: AudioBufferSourceNode | null = null;
let enabled = true;

/** Zone ambient configs: [type, freq, volume] */
const ZONE_AMBIENTS: { type: OscillatorType | "noise"; freq: number; vol: number }[] = [
  { type: "sine", freq: 80, vol: 0.02 },       // Kitchen: low hum
  { type: "sine", freq: 60, vol: 0.025 },       // Ocean: deep rumble
  { type: "sine", freq: 200, vol: 0.015 },      // Space: high hum
  { type: "noise", freq: 0, vol: 0.02 },        // Freezer: wind noise
  { type: "sawtooth", freq: 50, vol: 0.02 },    // Volcano: rumble
  { type: "sine", freq: 400, vol: 0.01 },       // Candy: light chime
  { type: "triangle", freq: 100, vol: 0.018 },  // Final Kitchen: warm tone
];

/** Initialize with shared audio context. */
export function initAmbient(audioCtx: AudioContext): void {
  ctx = audioCtx;
}

/** Set ambient zone. Call when zone changes. */
export function setAmbientZone(zone: number): void {
  if (zone === currentZone || !ctx || !enabled) return;
  stopAmbient();
  currentZone = zone;

  const config = ZONE_AMBIENTS[Math.min(zone, ZONE_AMBIENTS.length - 1)];
  ambientGain = ctx.createGain();
  ambientGain.gain.setValueAtTime(0, ctx.currentTime);
  ambientGain.gain.linearRampToValueAtTime(config.vol, ctx.currentTime + 1);
  ambientGain.connect(ctx.destination);

  if (config.type === "noise") {
    // White noise filtered for wind
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    ambientNoise = ctx.createBufferSource();
    ambientNoise.buffer = buffer;
    ambientNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    ambientNoise.connect(filter);
    filter.connect(ambientGain);
    ambientNoise.start();
  } else {
    ambientOsc = ctx.createOscillator();
    ambientOsc.type = config.type;
    ambientOsc.frequency.setValueAtTime(config.freq, ctx.currentTime);
    ambientOsc.connect(ambientGain);
    ambientOsc.start();
  }
}

/** Stop ambient audio. */
export function stopAmbient(): void {
  if (ambientGain && ctx) {
    ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
  }
  setTimeout(() => {
    ambientOsc?.stop();
    ambientOsc?.disconnect();
    ambientOsc = null;
    ambientNoise?.stop();
    ambientNoise?.disconnect();
    ambientNoise = null;
    ambientGain?.disconnect();
    ambientGain = null;
  }, 600);
  currentZone = -1;
}

/** Enable/disable ambient audio. */
export function setAmbientEnabled(v: boolean): void {
  enabled = v;
  if (!v) stopAmbient();
}

/** Get the zone ambient config for testing. */
export function getAmbientConfig(zone: number): { type: string; freq: number; vol: number } {
  return ZONE_AMBIENTS[Math.min(zone, ZONE_AMBIENTS.length - 1)];
}

// Suspend/resume ambient on tab visibility
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!ctx || !ambientGain) return;
    if (document.visibilityState === "hidden") {
      ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    } else if (enabled && currentZone >= 0) {
      const config = ZONE_AMBIENTS[Math.min(currentZone, ZONE_AMBIENTS.length - 1)];
      ambientGain.gain.linearRampToValueAtTime(config.vol, ctx.currentTime + 0.5);
    }
  });
}
