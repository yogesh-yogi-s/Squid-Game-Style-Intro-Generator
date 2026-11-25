import type {
  GlyphDefinition,
  PlacedStroke,
  Point2D,
  TitleCardLayout,
  TriadShapeType,
  TriadTargetSlot,
  VectorStroke,
} from './types';

function makeCirclePoints(cx: number, cy: number, rx: number, ry: number, segments = 40): Point2D[] {
  const pts: Point2D[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = -Math.PI / 2 + (i / segments) * Math.PI * 2;
    pts.push({
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    });
  }
  return pts;
}

function makeArcPoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startRad: number,
  endRad: number,
  segments = 24,
): Point2D[] {
  const pts: Point2D[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = startRad + (endRad - startRad) * t;
    pts.push({
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    });
  }
  return pts;
}

/**
 * Custom geometric vector typeface modeled on the Squid Game title card.
 * Coordinates are normalized within [0..width] x [0..1].
 */
const GLYPH_MAP: Record<string, GlyphDefinition> = {
  A: {
    char: 'A',
    width: 0.92,
    preferredTriad: 'triangle',
    strokes: [
      // Pure geometric Squid Game triangle A (closed △, no middle crossbar — iconic logo form)
      {
        points: [
          { x: 0.46, y: 0.04 },
          { x: 0.90, y: 0.95 },
          { x: 0.02, y: 0.95 },
        ],
        closed: true,
        accentRole: 'triangle',
        weight: 1.04,
      },
    ],
  },
  B: {
    char: 'B',
    width: 0.78,
    preferredTriad: 'square',
    strokes: [
      {
        points: [
          { x: 0.10, y: 0.96 },
          { x: 0.10, y: 0.04 },
          { x: 0.54, y: 0.04 },
          ...makeArcPoints(0.50, 0.26, 0.22, 0.22, -Math.PI / 2, Math.PI / 2, 16),
          { x: 0.10, y: 0.48 },
        ],
      },
      {
        points: [
          { x: 0.52, y: 0.48 },
          ...makeArcPoints(0.52, 0.72, 0.24, 0.24, -Math.PI / 2, Math.PI / 2, 16),
          { x: 0.10, y: 0.96 },
        ],
      },
    ],
  },
  C: {
    char: 'C',
    width: 0.78,
    strokes: [
      {
        points: [
          { x: 0.74, y: 0.14 },
          { x: 0.64, y: 0.04 },
          { x: 0.16, y: 0.04 },
          { x: 0.06, y: 0.16 },
          { x: 0.06, y: 0.84 },
          { x: 0.16, y: 0.96 },
          { x: 0.64, y: 0.96 },
          { x: 0.74, y: 0.86 },
        ],
      },
    ],
  },
  D: {
    char: 'D',
    width: 0.82,
    preferredTriad: 'square',
    strokes: [
      {
        points: [
          { x: 0.08, y: 0.96 },
          { x: 0.08, y: 0.04 },
          { x: 0.42, y: 0.04 },
          ...makeArcPoints(0.38, 0.50, 0.38, 0.46, -Math.PI / 2, Math.PI / 2, 24),
          { x: 0.08, y: 0.96 },
        ],
      },
    ],
  },
  E: {
    char: 'E',
    width: 0.74,
    preferredTriad: 'square',
    strokes: [
      {
        points: [
          { x: 0.70, y: 0.04 },
          { x: 0.08, y: 0.04 },
          { x: 0.08, y: 0.96 },
          { x: 0.70, y: 0.96 },
        ],
      },
      {
        points: [
          { x: 0.08, y: 0.49 },
          { x: 0.58, y: 0.49 },
        ],
      },
    ],
  },
  F: {
    char: 'F',
    width: 0.70,
    strokes: [
      {
        points: [
          { x: 0.66, y: 0.04 },
          { x: 0.08, y: 0.04 },
          { x: 0.08, y: 0.96 },
        ],
      },
      {
        points: [
          { x: 0.08, y: 0.50 },
          { x: 0.54, y: 0.50 },
        ],
      },
    ],
  },
  G: {
    char: 'G',
    width: 0.84,
    preferredTriad: 'square',
    strokes: [
      // Architectural blocky Squid-Game G with squared outer frame and bold inner horizontal hook
      {
        points: [
          { x: 0.78, y: 0.04 },
          { x: 0.08, y: 0.04 },
          { x: 0.08, y: 0.96 },
          { x: 0.78, y: 0.96 },
          { x: 0.78, y: 0.50 },
          { x: 0.42, y: 0.50 },
        ],
      },
    ],
  },
  H: {
    char: 'H',
    width: 0.78,
    preferredTriad: 'square',
    strokes: [
      {
        points: [
          { x: 0.08, y: 0.04 },
          { x: 0.08, y: 0.96 },
        ],
      },
      {
        points: [
          { x: 0.70, y: 0.04 },
          { x: 0.70, y: 0.96 },
        ],
      },
      {
        points: [
          { x: 0.08, y: 0.50 },
          { x: 0.70, y: 0.50 },
        ],
      },
    ],
  },
  I: {
    char: 'I',
    width: 0.34,
    strokes: [
      {
        points: [
          { x: 0.17, y: 0.04 },
          { x: 0.17, y: 0.96 },
        ],
      },
    ],
  },
  J: {
    char: 'J',
    width: 0.68,
    strokes: [
      {
        points: [
          { x: 0.58, y: 0.04 },
          { x: 0.58, y: 0.76 },
          { x: 0.46, y: 0.96 },
          { x: 0.16, y: 0.96 },
          { x: 0.06, y: 0.82 },
        ],
      },
    ],
  },
  K: {
    char: 'K',
    width: 0.78,
    strokes: [
      {
        points: [
          { x: 0.10, y: 0.04 },
          { x: 0.10, y: 0.96 },
        ],
      },
      {
        points: [
          { x: 0.72, y: 0.04 },
          { x: 0.12, y: 0.54 },
        ],
      },
      {
        points: [
          { x: 0.30, y: 0.40 },
          { x: 0.74, y: 0.96 },
        ],
      },
    ],
  },
  L: {
    char: 'L',
    width: 0.68,
    strokes: [
      {
        points: [
          { x: 0.10, y: 0.04 },
          { x: 0.10, y: 0.96 },
          { x: 0.66, y: 0.96 },
        ],
      },
    ],
  },
  M: {
    char: 'M',
    width: 0.94,
    preferredTriad: 'square',
    strokes: [
      {
        points: [
          { x: 0.08, y: 0.96 },
          { x: 0.08, y: 0.04 },
          { x: 0.47, y: 0.58 },
          { x: 0.86, y: 0.04 },
          { x: 0.86, y: 0.96 },
        ],
      },
    ],
  },
  N: {
    char: 'N',
    width: 0.80,
    strokes: [
      {
        points: [
          { x: 0.10, y: 0.96 },
          { x: 0.10, y: 0.04 },
          { x: 0.70, y: 0.96 },
          { x: 0.70, y: 0.04 },
        ],
      },
    ],
  },
  O: {
    char: 'O',
    width: 0.92,
    preferredTriad: 'circle',
    strokes: [
      {
        points: makeCirclePoints(0.46, 0.50, 0.42, 0.45, 44),
        accentRole: 'circle',
        weight: 1.04,
      },
    ],
  },
  P: {
    char: 'P',
    width: 0.76,
    strokes: [
      {
        points: [
          { x: 0.10, y: 0.96 },
          { x: 0.10, y: 0.04 },
          { x: 0.50, y: 0.04 },
          ...makeArcPoints(0.48, 0.28, 0.24, 0.24, -Math.PI / 2, Math.PI / 2, 18),
          { x: 0.10, y: 0.52 },
        ],
      },
    ],
  },
  Q: {
    char: 'Q',
    width: 0.94,
    preferredTriad: 'circle',
    strokes: [
      // Iconic Squid Game Q: pure geometric Circle ○ with crisp diagonal cut tail
      {
        points: makeCirclePoints(0.46, 0.48, 0.41, 0.43, 44),
        accentRole: 'circle',
        weight: 1.04,
      },
      {
        points: [
          { x: 0.58, y: 0.62 },
          { x: 0.90, y: 0.97 },
        ],
        weight: 1.0,
      },
    ],
  },
  R: {
    char: 'R',
    width: 0.78,
    strokes: [
      {
        points: [
          { x: 0.10, y: 0.96 },
          { x: 0.10, y: 0.04 },
          { x: 0.48, y: 0.04 },
          ...makeArcPoints(0.46, 0.27, 0.23, 0.23, -Math.PI / 2, Math.PI / 2, 18),
          { x: 0.10, y: 0.50 },
        ],
      },
      {
        points: [
          { x: 0.44, y: 0.50 },
          { x: 0.74, y: 0.96 },
        ],
      },
    ],
  },
  S: {
    char: 'S',
    width: 0.78,
    strokes: [
      // Sharp geometric stepped Squid-Game S
      {
        points: [
          { x: 0.72, y: 0.04 },
          { x: 0.08, y: 0.04 },
          { x: 0.08, y: 0.48 },
          { x: 0.72, y: 0.48 },
          { x: 0.72, y: 0.96 },
          { x: 0.06, y: 0.96 },
        ],
      },
    ],
  },
  T: {
    char: 'T',
    width: 0.76,
    strokes: [
      {
        points: [
          { x: 0.04, y: 0.04 },
          { x: 0.72, y: 0.04 },
        ],
      },
      {
        points: [
          { x: 0.38, y: 0.04 },
          { x: 0.38, y: 0.96 },
        ],
      },
    ],
  },
  U: {
    char: 'U',
    width: 0.80,
    strokes: [
      // Blocky architectural Squid-Game U
      {
        points: [
          { x: 0.08, y: 0.04 },
          { x: 0.08, y: 0.84 },
          { x: 0.20, y: 0.96 },
          { x: 0.60, y: 0.96 },
          { x: 0.72, y: 0.84 },
          { x: 0.72, y: 0.04 },
        ],
      },
    ],
  },
  V: {
    char: 'V',
    width: 0.86,
    preferredTriad: 'triangle',
    strokes: [
      {
        points: [
          { x: 0.04, y: 0.04 },
          { x: 0.43, y: 0.96 },
          { x: 0.82, y: 0.04 },
        ],
        accentRole: 'triangle',
      },
    ],
  },
  W: {
    char: 'W',
    width: 1.02,
    strokes: [
      {
        points: [
          { x: 0.04, y: 0.04 },
          { x: 0.24, y: 0.96 },
          { x: 0.51, y: 0.38 },
          { x: 0.78, y: 0.96 },
          { x: 0.98, y: 0.04 },
        ],
      },
    ],
  },
  X: {
    char: 'X',
    width: 0.80,
    strokes: [
      {
        points: [
          { x: 0.06, y: 0.04 },
          { x: 0.74, y: 0.96 },
        ],
      },
      {
        points: [
          { x: 0.74, y: 0.04 },
          { x: 0.06, y: 0.96 },
        ],
      },
    ],
  },
  Y: {
    char: 'Y',
    width: 0.80,
    strokes: [
      {
        points: [
          { x: 0.06, y: 0.04 },
          { x: 0.40, y: 0.50 },
          { x: 0.74, y: 0.04 },
        ],
      },
      {
        points: [
          { x: 0.40, y: 0.50 },
          { x: 0.40, y: 0.96 },
        ],
      },
    ],
  },
  Z: {
    char: 'Z',
    width: 0.76,
    strokes: [
      {
        points: [
          { x: 0.06, y: 0.04 },
          { x: 0.70, y: 0.04 },
          { x: 0.06, y: 0.96 },
          { x: 0.70, y: 0.96 },
        ],
      },
    ],
  },
  '0': {
    char: '0',
    width: 0.82,
    preferredTriad: 'circle',
    strokes: [
      {
        points: makeCirclePoints(0.41, 0.50, 0.35, 0.45, 40),
        accentRole: 'circle',
      },
    ],
  },
  '1': {
    char: '1',
    width: 0.50,
    strokes: [
      {
        points: [
          { x: 0.10, y: 0.22 },
          { x: 0.30, y: 0.04 },
          { x: 0.30, y: 0.96 },
        ],
      },
      {
        points: [
          { x: 0.08, y: 0.96 },
          { x: 0.46, y: 0.96 },
        ],
      },
    ],
  },
  '2': {
    char: '2',
    width: 0.74,
    strokes: [
      {
        points: [
          { x: 0.08, y: 0.22 },
          { x: 0.20, y: 0.04 },
          { x: 0.58, y: 0.04 },
          { x: 0.68, y: 0.20 },
          { x: 0.68, y: 0.42 },
          { x: 0.08, y: 0.96 },
          { x: 0.70, y: 0.96 },
        ],
      },
    ],
  },
  '3': {
    char: '3',
    width: 0.74,
    strokes: [
      {
        points: [
          { x: 0.08, y: 0.04 },
          { x: 0.68, y: 0.04 },
          { x: 0.68, y: 0.96 },
          { x: 0.08, y: 0.96 },
        ],
      },
      {
        points: [
          { x: 0.24, y: 0.49 },
          { x: 0.68, y: 0.49 },
        ],
      },
    ],
  },
  '4': {
    char: '4',
    width: 0.78,
    preferredTriad: 'triangle',
    strokes: [
      {
        points: [
          { x: 0.58, y: 0.96 },
          { x: 0.58, y: 0.04 },
          { x: 0.06, y: 0.66 },
          { x: 0.74, y: 0.66 },
        ],
      },
    ],
  },
  '5': {
    char: '5',
    width: 0.74,
    preferredTriad: 'square',
    strokes: [
      {
        points: [
          { x: 0.68, y: 0.04 },
          { x: 0.08, y: 0.04 },
          { x: 0.08, y: 0.47 },
          { x: 0.68, y: 0.47 },
          { x: 0.68, y: 0.96 },
          { x: 0.08, y: 0.96 },
        ],
      },
    ],
  },
  '6': {
    char: '6',
    width: 0.76,
    preferredTriad: 'circle',
    strokes: [
      {
        points: [
          { x: 0.68, y: 0.04 },
          { x: 0.08, y: 0.04 },
          { x: 0.08, y: 0.96 },
          { x: 0.68, y: 0.96 },
          { x: 0.68, y: 0.50 },
          { x: 0.08, y: 0.50 },
        ],
      },
    ],
  },
  '7': {
    char: '7',
    width: 0.72,
    strokes: [
      {
        points: [
          { x: 0.06, y: 0.04 },
          { x: 0.68, y: 0.04 },
          { x: 0.26, y: 0.96 },
        ],
      },
    ],
  },
  '8': {
    char: '8',
    width: 0.76,
    preferredTriad: 'square',
    strokes: [
      {
        points: [
          { x: 0.08, y: 0.04 },
          { x: 0.68, y: 0.04 },
          { x: 0.68, y: 0.96 },
          { x: 0.08, y: 0.96 },
        ],
        closed: true,
      },
      {
        points: [
          { x: 0.08, y: 0.50 },
          { x: 0.68, y: 0.50 },
        ],
      },
    ],
  },
  '9': {
    char: '9',
    width: 0.76,
    strokes: [
      {
        points: [
          { x: 0.68, y: 0.50 },
          { x: 0.08, y: 0.50 },
          { x: 0.08, y: 0.04 },
          { x: 0.68, y: 0.04 },
          { x: 0.68, y: 0.96 },
          { x: 0.08, y: 0.96 },
        ],
      },
    ],
  },
  '-': {
    char: '-',
    width: 0.52,
    strokes: [
      {
        points: [
          { x: 0.06, y: 0.50 },
          { x: 0.46, y: 0.50 },
        ],
      },
    ],
  },
  ':': {
    char: ':',
    width: 0.30,
    strokes: [
      {
        points: makeCirclePoints(0.15, 0.30, 0.06, 0.06, 16),
      },
      {
        points: makeCirclePoints(0.15, 0.74, 0.06, 0.06, 16),
      },
    ],
  },
  '.': {
    char: '.',
    width: 0.28,
    strokes: [
      {
        points: makeCirclePoints(0.14, 0.90, 0.06, 0.06, 16),
      },
    ],
  },
  '!': {
    char: '!',
    width: 0.32,
    strokes: [
      {
        points: [
          { x: 0.16, y: 0.04 },
          { x: 0.16, y: 0.72 },
        ],
      },
      {
        points: makeCirclePoints(0.16, 0.90, 0.06, 0.06, 16),
      },
    ],
  },
  '&': {
    char: '&',
    width: 0.84,
    strokes: [
      {
        points: [
          { x: 0.76, y: 0.96 },
          { x: 0.14, y: 0.28 },
          { x: 0.26, y: 0.04 },
          { x: 0.54, y: 0.04 },
          { x: 0.60, y: 0.24 },
          { x: 0.10, y: 0.70 },
          { x: 0.20, y: 0.96 },
          { x: 0.54, y: 0.96 },
          { x: 0.78, y: 0.56 },
        ],
      },
    ],
  },
  ' ': {
    char: ' ',
    width: 0.46,
    strokes: [],
  },
};

export function sanitizeTitleLine(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9 &:.\-!]/g, '')
    .trim()
    .slice(0, 14);
  return cleaned;
}

export function getGlyph(char: string): GlyphDefinition {
  const upper = char.toUpperCase();
  return GLYPH_MAP[upper] ?? GLYPH_MAP[' '];
}

export function getSupportedGlyphKeys(): string[] {
  return Object.keys(GLYPH_MAP);
}

interface PlacedGlyphMeta {
  char: string;
  glyph: GlyphDefinition;
  lineIndex: 0 | 1;
  glyphIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

function measureLineUnits(text: string, tracking: number): number {
  if (!text.length) return 0;
  let units = 0;
  for (let i = 0; i < text.length; i++) {
    units += getGlyph(text[i]).width;
    if (i < text.length - 1) {
      units += tracking;
    }
  }
  return units;
}

/**
 * Computes deterministic 1920x1080 placement for a 1- or 2-line Squid Game title card,
 * including morph destination slots for the Circle, Triangle, and Square triad.
 */
export function layoutTitleCard(
  rawLine1: string,
  rawLine2: string,
  stageWidth = 1920,
  stageHeight = 1080,
): TitleCardLayout {
  const line1Text = sanitizeTitleLine(rawLine1) || 'SQUID';
  const line2Text = sanitizeTitleLine(rawLine2);
  const hasTwoLines = line2Text.length > 0;

  const tracking = 0.22;
  const line1Units = measureLineUnits(line1Text, tracking);
  const line2Units = hasTwoLines ? measureLineUnits(line2Text, tracking) : 0;
  const maxUnits = Math.max(line1Units, line2Units, 3.2);

  const safeWidth = stageWidth * 0.72;
  const baseLineHeight = hasTwoLines ? stageHeight * 0.215 : stageHeight * 0.28;
  const lineHeight = Math.min(baseLineHeight, safeWidth / maxUnits);
  const lineGap = hasTwoLines ? lineHeight * 0.34 : 0;
  const totalBlockHeight = hasTwoLines ? lineHeight * 2 + lineGap : lineHeight;

  const centerY = stageHeight * 0.455;
  const blockTop = centerY - totalBlockHeight / 2;

  const placedGlyphs: PlacedGlyphMeta[] = [];
  let runningGlyphIdx = 0;

  const placeLine = (text: string, lineIndex: 0 | 1, yTop: number) => {
    const units = measureLineUnits(text, tracking);
    const totalPx = units * lineHeight;
    let cursorX = (stageWidth - totalPx) / 2;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const glyph = getGlyph(ch);
      const w = glyph.width * lineHeight;
      placedGlyphs.push({
        char: ch,
        glyph,
        lineIndex,
        glyphIndex: runningGlyphIdx++,
        x: cursorX,
        y: yTop,
        w,
        h: lineHeight,
      });
      cursorX += w + tracking * lineHeight;
    }
  };

  placeLine(line1Text, 0, blockTop);
  if (hasTwoLines) {
    placeLine(line2Text, 1, blockTop + lineHeight + lineGap);
  }

  // Compute tight title bounds
  const nonSpace = placedGlyphs.filter((g) => g.char !== ' ');
  const left = nonSpace.length ? Math.min(...nonSpace.map((g) => g.x)) : stageWidth * 0.25;
  const right = nonSpace.length ? Math.max(...nonSpace.map((g) => g.x + g.w)) : stageWidth * 0.75;
  const top = blockTop;
  const bottom = blockTop + totalBlockHeight;

  // Choose triad target slots (Circle, Triangle, Square)
  // Priority: embed directly in matching glyphs (Q/O/0 -> circle, A/V -> triangle, G/E/M/D/B/H/8 -> square)
  const circleGlyph =
    nonSpace.find((g) => g.char === 'Q' || g.char === 'O') ??
    nonSpace.find((g) => g.glyph.preferredTriad === 'circle') ??
    null;

  const triangleGlyph =
    nonSpace.find((g) => g.char === 'A') ??
    nonSpace.find((g) => g.glyph.preferredTriad === 'triangle') ??
    null;

  const squareGlyph =
    nonSpace.find((g) => g.char === 'G' || g.char === 'M' || g.char === 'E') ??
    nonSpace.find(
      (g) => g.glyph.preferredTriad === 'square' && g !== circleGlyph && g !== triangleGlyph,
    ) ??
    null;

  // Crest fallback positions right beneath the title block
  const crestY = bottom + Math.max(58, lineHeight * 0.34);
  const crestRadius = Math.max(16, Math.min(26, lineHeight * 0.11));
  const crestSpacing = crestRadius * 3.15;

  const triadTargets: Record<TriadShapeType, TriadTargetSlot> = {
    circle: circleGlyph
      ? {
          shape: 'circle',
          centerX: circleGlyph.x + circleGlyph.w * 0.49,
          centerY: circleGlyph.y + circleGlyph.h * (circleGlyph.char === 'Q' ? 0.48 : 0.50),
          radius: circleGlyph.h * 0.43,
          embeddedInGlyph: true,
          glyphIndex: circleGlyph.glyphIndex,
        }
      : {
          shape: 'circle',
          centerX: stageWidth / 2 - crestSpacing,
          centerY: crestY,
          radius: crestRadius,
          embeddedInGlyph: false,
          glyphIndex: null,
        },
    triangle: triangleGlyph
      ? {
          shape: 'triangle',
          centerX: triangleGlyph.x + triangleGlyph.w * 0.50,
          centerY: triangleGlyph.y + triangleGlyph.h * 0.56,
          radius: triangleGlyph.h * 0.46,
          embeddedInGlyph: true,
          glyphIndex: triangleGlyph.glyphIndex,
        }
      : {
          shape: 'triangle',
          centerX: stageWidth / 2,
          centerY: crestY,
          radius: crestRadius,
          embeddedInGlyph: false,
          glyphIndex: null,
        },
    square: squareGlyph
      ? {
          shape: 'square',
          centerX: squareGlyph.x + squareGlyph.w * 0.50,
          centerY: squareGlyph.y + squareGlyph.h * 0.50,
          radius: squareGlyph.h * 0.44,
          embeddedInGlyph: true,
          glyphIndex: squareGlyph.glyphIndex,
        }
      : {
          shape: 'square',
          centerX: stageWidth / 2 + crestSpacing,
          centerY: crestY,
          radius: crestRadius,
          embeddedInGlyph: false,
          glyphIndex: null,
        },
  };

  // Build world-space strokes with staggered animation order
  const rawStrokes: Array<{
    stroke: VectorStroke;
    meta: PlacedGlyphMeta;
    strokeIndex: number;
  }> = [];

  for (const meta of placedGlyphs) {
    meta.glyph.strokes.forEach((stroke, sIdx) => {
      rawStrokes.push({ stroke, meta, strokeIndex: sIdx });
    });
  }

  const totalStrokeCount = Math.max(1, rawStrokes.length);
  const strokes: PlacedStroke[] = rawStrokes.map(({ stroke, meta, strokeIndex }, idx) => {
    const transformed: Point2D[] = stroke.points.map((pt) => ({
      x: meta.x + pt.x * meta.h,
      y: meta.y + pt.y * meta.h,
    }));

    // Assign accent role strictly to the designated embedded circle & triangle glyphs (and square crest)
    let resolvedAccent: TriadShapeType | undefined;
    if (
      stroke.accentRole === 'circle' &&
      triadTargets.circle.embeddedInGlyph &&
      triadTargets.circle.glyphIndex === meta.glyphIndex
    ) {
      resolvedAccent = 'circle';
    } else if (
      stroke.accentRole === 'triangle' &&
      triadTargets.triangle.embeddedInGlyph &&
      triadTargets.triangle.glyphIndex === meta.glyphIndex
    ) {
      resolvedAccent = 'triangle';
    }

    return {
      points: transformed,
      closed: stroke.closed,
      accentRole: resolvedAccent,
      weight: stroke.weight ?? 1,
      glyphIndex: meta.glyphIndex,
      lineIndex: meta.lineIndex,
      strokeIndex,
      staggerOrder: idx / totalStrokeCount,
    };
  });

  const strokeWidth = Math.max(10, Math.min(24, lineHeight * 0.105));
  const subtitleY = bottom + Math.max(122, lineHeight * 0.64);
  const subtitleFontSize = Math.max(24, Math.min(40, lineHeight * 0.165));

  return {
    width: stageWidth,
    height: stageHeight,
    strokeWidth,
    line1Text,
    line2Text,
    strokes,
    triadTargets,
    subtitleY,
    subtitleFontSize,
    titleBounds: {
      left,
      right,
      top,
      bottom,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
    },
  };
}
