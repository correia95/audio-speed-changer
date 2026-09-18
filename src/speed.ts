// Changes playback speed by resampling (linear interpolation) — the same
// principle as speeding up a tape or turntable, so pitch rises with speed
// and falls when slowed down. A true pitch-preserving time-stretch needs a
// phase vocoder, which this tool deliberately doesn't attempt.

export function resample(input: Float32Array, speed: number): Float32Array {
  if (speed <= 0) throw new Error('speed must be positive');
  const outLength = Math.max(1, Math.round(input.length / speed));
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcPos = i * speed;
    const i0 = Math.floor(srcPos);
    const i1 = Math.min(input.length - 1, i0 + 1);
    const frac = srcPos - i0;
    const s0 = input[Math.min(i0, input.length - 1)];
    const s1 = input[i1];
    output[i] = s0 + (s1 - s0) * frac;
  }
  return output;
}

export function resampleChannels(channels: Float32Array[], speed: number): Float32Array[] {
  return channels.map((c) => resample(c, speed));
}

export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const s = Math.round(totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
