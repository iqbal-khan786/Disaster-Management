// Web Audio API Disaster Siren and Beep Synthesizer (Zero External Asset Dependency)

let audioContext = null;
let isAudioMuted = false;

export function setAudioMuted(muted) {
  isAudioMuted = muted;
}

export function getAudioMuted() {
  return isAudioMuted;
}

function getAudioContext() {
  if (isAudioMuted) return null;
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Play high-urgency undulating disaster alarm siren
 */
export function playEmergencySiren(durationSec = 2.0, volume = 0.25) {
  if (isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    const now = ctx.currentTime;

    // Pitch sweep (Wail siren 700Hz -> 1800Hz -> 700Hz)
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.8);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 1.2);
    osc.frequency.exponentialRampToValueAtTime(750, now + 1.6);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 2.0);

    // Smooth envelope
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec);
  } catch (err) {
    console.warn("AudioContext siren error:", err);
  }
}

/**
 * Play single tactical feedback beep
 */
export function playTacticalBeep(freq = 1200, durationSec = 0.18, volume = 0.12) {
  if (isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec);
  } catch (err) {
    console.warn("AudioContext beep error:", err);
  }
}

/**
 * Play alert acknowledged chime
 */
export function playAckChime() {
  if (isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [660, 880, 1320].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.1, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  } catch (err) {
    console.warn("AudioContext chime error:", err);
  }
}
