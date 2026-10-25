// 100% Browser-Native Pleasant Instrumental WAV Audio Generator
// Generates real playable WAV audio URLs in-memory so default tracks & fallbacks
// NEVER fail due to dead external links, CORS blocks, or slow mobile networks.

const cachedBlobUrls: Record<string, string> = {};

export type BuiltinTrackPreset =
  | 'warm-bossa-lounge'
  | 'upbeat-bistro-groove'
  | 'evening-acoustic-vibe';

/**
 * Checks if a URL is one of our legacy Mixkit preview URLs (which frequently 403/block hotlinking)
 * or a builtin preset identifier.
 */
export function resolvePlayableAudioUrl(rawUrl?: string): string {
  if (!rawUrl || !rawUrl.trim()) {
    return getBuiltinTrackWavUrl('warm-bossa-lounge');
  }
  const trimmed = rawUrl.trim();

  if (trimmed.startsWith('builtin:')) {
    const preset = trimmed.replace('builtin:', '') as BuiltinTrackPreset;
    return getBuiltinTrackWavUrl(preset);
  }

  // Replace known unreliable hotlink-blocked mixkit URLs with our 100% reliable built-in studio tracks
  if (trimmed.includes('assets.mixkit.co')) {
    if (trimmed.includes('164')) {
      return getBuiltinTrackWavUrl('upbeat-bistro-groove');
    }
    if (trimmed.includes('443')) {
      return getBuiltinTrackWavUrl('evening-acoustic-vibe');
    }
    return getBuiltinTrackWavUrl('warm-bossa-lounge');
  }

  return trimmed;
}

/**
 * Generates a warm, pleasant multi-chord stereo/mono 16-bit PCM WAV Blob URL
 * that plays in any standard HTML5 <audio> element on Android, iOS, and Desktop.
 */
export function getBuiltinTrackWavUrl(preset: BuiltinTrackPreset = 'warm-bossa-lounge'): string {
  if (cachedBlobUrls[preset]) {
    return cachedBlobUrls[preset];
  }

  const sampleRate = 22050;
  const durationSeconds = 12;
  const numSamples = sampleRate * durationSeconds;
  const samples = new Float32Array(numSamples);

  // Musical chord progressions (frequencies in Hz)
  const chordSets: Record<BuiltinTrackPreset, number[][]> = {
    'warm-bossa-lounge': [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [349.23, 440.0, 523.25, 659.25], // Fmaj7
      [392.0, 493.88, 587.33, 698.46], // G7
    ],
    'upbeat-bistro-groove': [
      [293.66, 369.99, 440.0, 554.37], // Dmaj7
      [246.94, 293.66, 369.99, 440.0], // Bm7
      [329.63, 392.0, 493.88, 587.33], // Em7
      [220.0, 277.18, 329.63, 392.0], // A7
    ],
    'evening-acoustic-vibe': [
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [196.0, 246.94, 293.66, 392.0], // Gadd9
    ],
  };

  const chords = chordSets[preset] || chordSets['warm-bossa-lounge'];
  const chordDuration = durationSeconds / chords.length; // 3 seconds per chord

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.min(chords.length - 1, Math.floor(t / chordDuration));
    const localT = t - chordIdx * chordDuration;
    const chord = chords[chordIdx];

    // Smooth pad envelope for each chord
    const padAttack = Math.min(1, localT / 0.35);
    const padRelease = Math.min(1, (chordDuration - localT) / 0.45);
    const padEnv = padAttack * padRelease * 0.16;

    let signal = 0;

    // Warm electric piano / lounge pad harmonics
    for (let n = 0; n < chord.length; n++) {
      const freq = chord[n];
      signal += Math.sin(2 * Math.PI * freq * t) * padEnv;
      signal += Math.sin(2 * Math.PI * freq * 2 * t) * (padEnv * 0.25);
    }

    // Gentle arpeggiated bell/marimba pluck every 0.375s
    const stepDuration = 0.375;
    const stepIdx = Math.floor(localT / stepDuration);
    const stepLocalT = localT - stepIdx * stepDuration;
    const noteFreq = chord[stepIdx % chord.length] * (preset === 'upbeat-bistro-groove' ? 2 : 1.5);
    const pluckEnv = Math.exp(-stepLocalT * 7.5) * Math.min(1, stepLocalT / 0.015) * 0.14;
    signal += Math.sin(2 * Math.PI * noteFreq * t) * pluckEnv;

    // Soft clamp
    samples[i] = Math.max(-0.95, Math.min(0.95, signal));
  }

  const wavBuffer = encodeWAV(samples, sampleRate);
  try {
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    cachedBlobUrls[preset] = url;
    return url;
  } catch {
    return '';
  }
}

function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // 16-bit
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
