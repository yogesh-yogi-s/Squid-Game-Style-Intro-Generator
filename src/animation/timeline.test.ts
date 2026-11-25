import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOTAL_DURATION,
  clamp01,
  easeInOutQuart,
  easeOutExpo,
  formatTimecode,
  getActAtTime,
  polylineLength,
  samplePolyline,
  segmentProgress,
} from './timeline';

test('clamp01 bounds values safely including NaN', () => {
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(0.42), 0.42);
  assert.equal(clamp01(2.5), 1);
  assert.equal(clamp01(Number.NaN), 0);
});

test('segmentProgress maps time window into [0, 1]', () => {
  assert.equal(segmentProgress(1.0, 2.0, 4.0), 0);
  assert.equal(segmentProgress(3.0, 2.0, 4.0), 0.5);
  assert.equal(segmentProgress(5.0, 2.0, 4.0), 1);
});

test('easing functions start at 0 and finish cleanly at 1', () => {
  assert.equal(easeOutExpo(0), 0);
  assert.equal(easeOutExpo(1), 1);
  assert.equal(easeInOutQuart(0), 0);
  assert.equal(easeInOutQuart(0.5), 0.5);
  assert.equal(easeInOutQuart(1), 1);
});

test('getActAtTime resolves all 5 choreography acts accurately', () => {
  assert.equal(getActAtTime(0.0).id, 'trace');
  assert.equal(getActAtTime(2.1).id, 'morph');
  assert.equal(getActAtTime(3.4).id, 'letters');
  assert.equal(getActAtTime(4.7).id, 'reveal');
  assert.equal(getActAtTime(6.5).id, 'hold');
  assert.equal(getActAtTime(TOTAL_DURATION).id, 'hold');
});

test('formatTimecode formats tenths of a second cleanly', () => {
  assert.equal(formatTimecode(0), '00:00.0');
  assert.equal(formatTimecode(4.35), '00:04.3');
  assert.equal(formatTimecode(5.8), '00:05.8');
  assert.equal(formatTimecode(7.5), '00:07.5');
});

test('samplePolyline trims polyline by exact arc length', () => {
  const line = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ];
  assert.equal(polylineLength(line), 200);

  const firstHalf = samplePolyline(line, 0, 0.5);
  assert.equal(firstHalf.length, 2);
  assert.deepEqual(firstHalf[0], { x: 0, y: 0 });
  assert.deepEqual(firstHalf[1], { x: 100, y: 0 });

  const threeQuarters = samplePolyline(line, 0, 0.75);
  assert.equal(threeQuarters[threeQuarters.length - 1].x, 100);
  assert.equal(threeQuarters[threeQuarters.length - 1].y, 50);

  assert.deepEqual(samplePolyline(line, 0.6, 0.4), []);
});
