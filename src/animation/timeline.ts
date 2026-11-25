import type { ActDefinition, ActId, Point2D } from './types';

export const TOTAL_DURATION = 7.5;

export const ANIMATION_ACTS: ActDefinition[] = [
  {
    id: 'trace',
    index: '01',
    label: 'Playground Trace',
    shortLabel: 'Trace',
    start: 0.0,
    end: 1.75,
    description: 'Chalk court geometry and the triad symbols trace onto the dark stage.',
  },
  {
    id: 'morph',
    index: '02',
    label: 'Triad Morph',
    shortLabel: 'Morph',
    start: 1.75,
    end: 2.95,
    description: 'Circle, triangle, and square detach from the court and glide into letter slots.',
  },
  {
    id: 'letters',
    index: '03',
    label: 'Trim-Path Assembly',
    shortLabel: 'Letters',
    start: 2.55,
    end: 4.35,
    description: 'Staggered geometric strokes draw each custom letterform with chalk tips.',
  },
  {
    id: 'reveal',
    index: '04',
    label: 'Pink Ignition',
    shortLabel: 'Reveal',
    start: 4.35,
    end: 5.35,
    description: 'Guard pink illuminates the triad motifs with a split-frame chromatic hit.',
  },
  {
    id: 'hold',
    index: '05',
    label: 'Cinema Hold',
    shortLabel: 'Hold',
    start: 5.35,
    end: TOTAL_DURATION,
    description: 'Slow optical push-in and 35mm grain drift hold the locked title card.',
  },
];

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function segmentProgress(time: number, start: number, end: number): number {
  if (end <= start) return time >= end ? 1 : 0;
  return clamp01((time - start) / (end - start));
}

export function easeOutCubic(t: number): number {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

export function easeInOutCubic(t: number): number {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

export function easeOutExpo(t: number): number {
  const c = clamp01(t);
  return c === 1 ? 1 : 1 - Math.pow(2, -10 * c);
}

export function easeInOutQuart(t: number): number {
  const c = clamp01(t);
  return c < 0.5 ? 8 * c * c * c * c : 1 - Math.pow(-2 * c + 2, 4) / 2;
}

export function easeOutBack(t: number, overshoot = 1.35): number {
  const c = clamp01(t);
  const c3 = overshoot + 1;
  return 1 + c3 * Math.pow(c - 1, 3) + overshoot * Math.pow(c - 1, 2);
}

export function getActAtTime(time: number): ActDefinition {
  const clamped = Math.max(0, Math.min(TOTAL_DURATION, time));
  if (clamped < 1.75) return ANIMATION_ACTS[0];
  if (clamped < 2.75) return ANIMATION_ACTS[1];
  if (clamped < 4.35) return ANIMATION_ACTS[2];
  if (clamped < 5.35) return ANIMATION_ACTS[3];
  return ANIMATION_ACTS[4];
}

export function getActMidpoint(actId: ActId): number {
  switch (actId) {
    case 'trace':
      return 1.25;
    case 'morph':
      return 2.35;
    case 'letters':
      return 3.75;
    case 'reveal':
      return 4.65;
    case 'hold':
      return 6.2;
  }
}

export function formatTimecode(seconds: number): string {
  const clamped = Math.max(0, Math.min(TOTAL_DURATION, seconds));
  const totalTenths = Math.floor(clamped * 10 + 1e-6);
  const mins = Math.floor(totalTenths / 600);
  const secs = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export function polylineLength(points: Point2D[], closed = false): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  if (closed) {
    const first = points[0];
    const last = points[points.length - 1];
    total += Math.hypot(first.x - last.x, first.y - last.y);
  }
  return total;
}

/**
 * Samples a polyline from normalized arc-length `startRatio` to `endRatio` (0..1),
 * enabling After Effects-style trim-path drawing at constant visual velocity.
 */
export function samplePolyline(
  points: Point2D[],
  startRatio: number,
  endRatio: number,
  closed = false,
): Point2D[] {
  if (points.length < 2) return [];
  const s = clamp01(startRatio);
  const e = clamp01(endRatio);
  if (e <= s) return [];

  const pathPts = closed ? [...points, points[0]] : points;
  const totalLen = polylineLength(points, closed);
  if (totalLen <= 1e-6) return [];

  const targetStart = s * totalLen;
  const targetEnd = e * totalLen;
  const result: Point2D[] = [];
  let accum = 0;

  for (let i = 1; i < pathPts.length; i++) {
    const p0 = pathPts[i - 1];
    const p1 = pathPts[i];
    const segLen = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    if (segLen <= 1e-6) continue;

    const segStart = accum;
    const segEnd = accum + segLen;

    if (segEnd >= targetStart && segStart <= targetEnd) {
      const localStart = Math.max(0, (targetStart - segStart) / segLen);
      const localEnd = Math.min(1, (targetEnd - segStart) / segLen);

      const startPt: Point2D = {
        x: lerp(p0.x, p1.x, localStart),
        y: lerp(p0.y, p1.y, localStart),
      };
      const endPt: Point2D = {
        x: lerp(p0.x, p1.x, localEnd),
        y: lerp(p0.y, p1.y, localEnd),
      };

      if (result.length === 0) {
        result.push(startPt);
      } else {
        const prev = result[result.length - 1];
        if (Math.hypot(prev.x - startPt.x, prev.y - startPt.y) > 0.01) {
          result.push(startPt);
        }
      }
      result.push(endPt);
    }

    accum = segEnd;
    if (accum >= targetEnd) break;
  }

  return result;
}

/**
 * Deterministic hash returning 0..1 for procedural chalk roughness and particles.
 */
export function deterministicHash(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}
