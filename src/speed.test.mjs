import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resample, resampleChannels, formatTime } from './speed.ts';

test('resample at 2x speed produces half the samples', () => {
  const input = new Float32Array(1000);
  const out = resample(input, 2);
  assert.equal(out.length, 500);
});

test('resample at 0.5x speed produces double the samples', () => {
  const input = new Float32Array(1000);
  const out = resample(input, 0.5);
  assert.equal(out.length, 2000);
});

test('resample at 1x speed returns approximately the same signal', () => {
  const input = new Float32Array([0, 0.25, 0.5, 0.75, 1]);
  const out = resample(input, 1);
  assert.equal(out.length, 5);
  for (let i = 0; i < input.length; i++) {
    assert.ok(Math.abs(out[i] - input[i]) < 1e-6);
  }
});

test('resample linearly interpolates a ramp signal correctly', () => {
  // A perfect ramp from 0 to 1 over 100 samples; halving the samples (2x
  // speed) should still trace the same ramp, just sampled more coarsely.
  const n = 100;
  const input = new Float32Array(n);
  for (let i = 0; i < n; i++) input[i] = i / (n - 1);
  const out = resample(input, 2);
  // out[10] should sample at source position 20 -> value ~20/99
  assert.ok(Math.abs(out[10] - 20 / (n - 1)) < 0.02);
});

test('resample throws for a non-positive speed', () => {
  assert.throws(() => resample(new Float32Array(10), 0));
  assert.throws(() => resample(new Float32Array(10), -1));
});

test('resampleChannels applies the same speed to every channel independently', () => {
  const left = new Float32Array(100);
  const right = new Float32Array(100);
  const [outL, outR] = resampleChannels([left, right], 4);
  assert.equal(outL.length, 25);
  assert.equal(outR.length, 25);
});

test('formatTime renders m:ss', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(90), '1:30');
  assert.equal(formatTime(NaN), '0:00');
});
