import { ACCENT_THEMES } from './presets';
import {
  clamp01,
  deterministicHash,
  easeInOutCubic,
  easeInOutQuart,
  easeOutCubic,
  easeOutExpo,
  lerp,
  samplePolyline,
  segmentProgress,
  TOTAL_DURATION,
} from './timeline';
import type {
  PlacedStroke,
  Point2D,
  TextureMode,
  TitleCardConfig,
  TitleCardLayout,
  TriadShapeType,
} from './types';

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

let cachedBackdrop: HTMLCanvasElement | null = null;
let cachedGrainOverlay: HTMLCanvasElement | null = null;

function getBackdropCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedBackdrop) return cachedBackdrop;

  const w = 960;
  const h = 540;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const bctx = off.getContext('2d');
  if (!bctx) return null;

  bctx.fillStyle = '#060608';
  bctx.fillRect(0, 0, w, h);

  const bgGrad = bctx.createRadialGradient(w * 0.5, h * 0.46, 40, w * 0.5, h * 0.5, w * 0.65);
  bgGrad.addColorStop(0, '#14131A');
  bgGrad.addColorStop(0.58, '#09090D');
  bgGrad.addColorStop(1, '#040406');
  bctx.fillStyle = bgGrad;
  bctx.fillRect(0, 0, w, h);

  const vig = bctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.34, w * 0.5, h * 0.5, w * 0.62);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  bctx.fillStyle = vig;
  bctx.fillRect(0, 0, w, h);

  cachedBackdrop = off;
  return off;
}

function getGrainOverlayCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedGrainOverlay) return cachedGrainOverlay;

  const w = 320;
  const h = 180;
  const tile = document.createElement('canvas');
  tile.width = w;
  tile.height = h;
  const gctx = tile.getContext('2d');
  if (!gctx) return null;

  const img = gctx.createImageData(w, h);
  const data = img.data;
  for (let i = 0; i < w * h; i++) {
    const n = deterministicHash(i * 1.13 + 7.91);
    const val = n > 0.5 ? 255 : 0;
    const alpha = Math.floor(Math.abs(n - 0.5) * 2 * 255);
    const idx = i * 4;
    data[idx] = val;
    data[idx + 1] = val;
    data[idx + 2] = val;
    data[idx + 3] = alpha;
  }
  gctx.putImageData(img, 0, 0);
  cachedGrainOverlay = tile;
  return tile;
}

function makeTriadPoints(
  shape: TriadShapeType,
  cx: number,
  cy: number,
  radius: number,
  rotationRad = 0,
): Point2D[] {
  const rotate = (pt: Point2D): Point2D => {
    if (Math.abs(rotationRad) < 1e-4) return pt;
    const dx = pt.x - cx;
    const dy = pt.y - cy;
    const cos = Math.cos(rotationRad);
    const sin = Math.sin(rotationRad);
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    };
  };

  if (shape === 'circle') {
    const pts: Point2D[] = [];
    const segs = 40;
    for (let i = 0; i <= segs; i++) {
      const a = -Math.PI / 2 + (i / segs) * Math.PI * 2;
      pts.push(rotate({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius }));
    }
    return pts;
  }

  if (shape === 'triangle') {
    const topY = cy - radius * 1.12;
    const baseY = cy + radius * 0.85;
    const halfW = radius * 1.02;
    return [
      rotate({ x: cx, y: topY }),
      rotate({ x: cx + halfW, y: baseY }),
      rotate({ x: cx - halfW, y: baseY }),
    ];
  }

  const half = radius * 0.88;
  return [
    rotate({ x: cx - half, y: cy - half }),
    rotate({ x: cx + half, y: cy - half }),
    rotate({ x: cx + half, y: cy + half }),
    rotate({ x: cx - half, y: cy + half }),
  ];
}

function drawPolylineRaw(
  ctx: CanvasRenderingContext2D,
  pts: Point2D[],
  closed = false,
): void {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  if (closed) {
    ctx.closePath();
  }
  ctx.stroke();
}

/**
 * Draws a polyline with fast layered halation (avoiding slow software shadowBlur)
 * and optional tactile chalk dry-brush passes in Chalk Grunge mode.
 */
function drawStylizedStroke(
  ctx: CanvasRenderingContext2D,
  pts: Point2D[],
  options: {
    color: string;
    lineWidth: number;
    alpha: number;
    closed?: boolean;
    textureMode: TextureMode;
    glowColor?: string;
    glowIntensity?: number;
    seed: number;
    frameTick: number;
  },
): void {
  if (pts.length < 2 || options.alpha <= 0.004) return;
  const {
    color,
    lineWidth,
    alpha,
    closed = false,
    textureMode,
    glowColor,
    glowIntensity = 0,
    seed,
    frameTick,
  } = options;

  ctx.save();
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 6;

  // Fast 2-pass optical halation (orders of magnitude faster than CPU shadowBlur)
  if (glowColor && glowIntensity > 0.05) {
    ctx.strokeStyle = glowColor;
    ctx.globalAlpha = alpha * 0.16 * glowIntensity;
    ctx.lineWidth = lineWidth * 2.35;
    drawPolylineRaw(ctx, pts, closed);

    ctx.globalAlpha = alpha * 0.28 * glowIntensity;
    ctx.lineWidth = lineWidth * 1.48;
    drawPolylineRaw(ctx, pts, closed);
  }

  // Primary structural stroke
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  drawPolylineRaw(ctx, pts, closed);

  // Tactile chalk / grunge dry-brush edge passes
  if (textureMode === 'chalk-grunge') {
    const jitterAmp = Math.max(0.9, lineWidth * 0.095);
    const jittered: Point2D[] = pts.map((p, idx) => {
      const s = seed * 31.7 + idx * 7.1 + frameTick * 0.37;
      const jx = (deterministicHash(s) - 0.5) * 2 * jitterAmp;
      const jy = (deterministicHash(s + 13.7) - 0.5) * 2 * jitterAmp;
      return { x: p.x + jx, y: p.y + jy };
    });
    ctx.globalAlpha = alpha * 0.28;
    ctx.lineWidth = lineWidth * 1.18;
    ctx.strokeStyle = color;
    drawPolylineRaw(ctx, jittered, closed);
  }

  ctx.restore();
}

function drawTipSpark(
  ctx: CanvasRenderingContext2D,
  pt: Point2D,
  color: string,
  radius: number,
  alpha: number,
): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha * 0.32;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, radius * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, radius * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function mixHex(a: string, b: string, t: number): string {
  const c = clamp01(t);
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(lerp(ar, br, c));
  const g = Math.round(lerp(ag, bg, c));
  const bl = Math.round(lerp(ab, bb, c));
  return `rgb(${r}, ${g}, ${bl})`;
}

function renderPlaygroundCourt(
  ctx: CanvasRenderingContext2D,
  time: number,
  accentPrimary: string,
  textureMode: TextureMode,
  frameTick: number,
): void {
  const drawIn = easeOutCubic(segmentProgress(time, 0.0, 1.35));
  const fadeOut = 1 - easeInOutCubic(segmentProgress(time, 2.05, 3.15));
  if (drawIn <= 0.001 || fadeOut <= 0.001) return;

  const cx = STAGE_WIDTH / 2;
  const cy = STAGE_HEIGHT / 2;
  const courtLines: Array<{ pts: Point2D[]; closed?: boolean; delay: number }> = [
    {
      pts: [
        { x: cx, y: cy - 390 },
        { x: cx, y: cy + 390 },
      ],
      delay: 0.0,
    },
    {
      pts: [
        { x: cx - 440, y: cy },
        { x: cx + 440, y: cy },
      ],
      delay: 0.08,
    },
    {
      pts: makeTriadPoints('circle', cx, cy - 225, 118),
      delay: 0.12,
    },
    {
      pts: [
        { x: cx - 44, y: cy - 115 },
        { x: cx - 44, y: cy - 68 },
      ],
      delay: 0.22,
    },
    {
      pts: [
        { x: cx + 44, y: cy - 115 },
        { x: cx + 44, y: cy - 68 },
      ],
      delay: 0.22,
    },
    {
      pts: [
        { x: cx, y: cy - 118 },
        { x: cx + 235, y: cy + 165 },
        { x: cx - 235, y: cy + 165 },
      ],
      closed: true,
      delay: 0.28,
    },
    {
      pts: [
        { x: cx - 235, y: cy + 165 },
        { x: cx + 235, y: cy + 165 },
        { x: cx + 235, y: cy + 355 },
        { x: cx - 235, y: cy + 355 },
      ],
      closed: true,
      delay: 0.38,
    },
  ];

  const pulse = Math.sin(segmentProgress(time, 1.52, 1.92) * Math.PI) * 0.45;
  const lineColor = mixHex('#E7E4DC', accentPrimary, pulse);

  courtLines.forEach((line, idx) => {
    const localP = easeOutCubic(clamp01((drawIn - line.delay) / (1 - line.delay)));
    const trimmed = samplePolyline(line.pts, 0, localP, line.closed);
    drawStylizedStroke(ctx, trimmed, {
      color: lineColor,
      lineWidth: 2.5,
      alpha: 0.2 * fadeOut,
      closed: false,
      textureMode,
      seed: 100 + idx,
      frameTick,
    });
  });
}

function renderHeroTriad(
  ctx: CanvasRenderingContext2D,
  time: number,
  layout: TitleCardLayout,
  config: TitleCardConfig,
  accentPrimary: string,
  frameTick: number,
): void {
  const cx = STAGE_WIDTH / 2;
  const cy = STAGE_HEIGHT / 2;

  const startConfigs: Record<
    TriadShapeType,
    { x: number; y: number; r: number; traceStart: number; traceEnd: number; morphDelay: number }
  > = {
    circle: { x: cx, y: cy - 225, r: 74, traceStart: 0.12, traceEnd: 0.85, morphDelay: 0.0 },
    triangle: { x: cx, y: cy + 18, r: 78, traceStart: 0.48, traceEnd: 1.24, morphDelay: 0.1 },
    square: { x: cx, y: cy + 258, r: 74, traceStart: 0.84, traceEnd: 1.58, morphDelay: 0.2 },
  };

  const shapes: TriadShapeType[] = ['circle', 'triangle', 'square'];
  const pulse = Math.sin(segmentProgress(time, 1.52, 1.94) * Math.PI);
  const revealFactor = easeOutExpo(segmentProgress(time, 4.38, 4.82));

  for (const shape of shapes) {
    const start = startConfigs[shape];
    const target = layout.triadTargets[shape];

    const traceP = easeOutCubic(segmentProgress(time, start.traceStart, start.traceEnd));
    if (traceP <= 0.001) continue;

    const morphStart = 1.75 + start.morphDelay;
    const morphEnd = 2.85 + start.morphDelay * 0.5;
    const morphP = easeInOutQuart(segmentProgress(time, morphStart, morphEnd));

    let visibility = 1;
    if (target.embeddedInGlyph) {
      if (shape === 'circle' || shape === 'triangle') {
        visibility = 1 - segmentProgress(time, 2.86, 3.12);
      } else {
        visibility = 1 - easeInOutCubic(segmentProgress(time, 2.78, 3.25));
      }
    }

    if (visibility <= 0.005) continue;

    if (morphP > 0.04 && morphP < 0.94) {
      for (const lag of [0.07, 0.035]) {
        const lagP = easeInOutQuart(segmentProgress(time - lag, morphStart, morphEnd));
        const gx = lerp(start.x, target.centerX, lagP);
        const gy = lerp(start.y, target.centerY, lagP);
        const gr = lerp(start.r, target.radius, lagP);
        const gRot = Math.sin(lagP * Math.PI) * (shape === 'square' ? Math.PI * 0.25 : 0.24);
        const gPts = makeTriadPoints(shape, gx, gy, gr, gRot);
        drawStylizedStroke(ctx, gPts, {
          color: accentPrimary,
          lineWidth: Math.max(4, layout.strokeWidth * 0.55),
          alpha: 0.22 * visibility * Math.sin(morphP * Math.PI),
          closed: shape !== 'circle',
          textureMode: 'clean-vector',
          seed: 300,
          frameTick,
        });
      }
    }

    const curX = lerp(start.x, target.centerX, morphP);
    const curY = lerp(start.y, target.centerY, morphP);
    const curR = lerp(start.r, target.radius, morphP);
    const rot =
      Math.sin(morphP * Math.PI) * (shape === 'square' ? Math.PI * 0.25 : shape === 'triangle' ? 0.22 : 0);

    const closed = shape !== 'circle';
    const fullPts = makeTriadPoints(shape, curX, curY, curR, rot);
    const drawnPts = traceP < 0.999 ? samplePolyline(fullPts, 0, traceP, closed) : fullPts;

    const strokeW = target.embeddedInGlyph
      ? lerp(11.5, layout.strokeWidth * 1.04, morphP)
      : lerp(11.5, Math.max(4.5, layout.strokeWidth * 0.34), morphP);

    const colorMix = target.embeddedInGlyph
      ? clamp01(pulse * 0.85)
      : clamp01(pulse * 0.85 + revealFactor);
    const strokeColor = mixHex('#F5F3EE', accentPrimary, colorMix);

    drawStylizedStroke(ctx, drawnPts, {
      color: strokeColor,
      lineWidth: strokeW,
      alpha: visibility,
      closed: traceP >= 0.999 && closed,
      textureMode: config.textureMode,
      glowColor: colorMix > 0.2 ? accentPrimary : undefined,
      glowIntensity: colorMix,
      seed: shape === 'circle' ? 11 : shape === 'triangle' ? 23 : 37,
      frameTick,
    });

    if (traceP > 0.02 && traceP < 0.98 && drawnPts.length > 0) {
      drawTipSpark(ctx, drawnPts[drawnPts.length - 1], accentPrimary, 7.5, 0.95);
    }
  }
}

function renderTitleLetters(
  ctx: CanvasRenderingContext2D,
  time: number,
  layout: TitleCardLayout,
  config: TitleCardConfig,
  accentPrimary: string,
  frameTick: number,
): void {
  const assemblyStart = 2.55;
  const assemblyEnd = 4.32;
  if (time < assemblyStart - 0.05) return;

  const revealP = easeOutExpo(segmentProgress(time, 4.38, 4.92));
  const impactDecay = Math.exp(-Math.max(0, time - 4.38) * 7.2);
  const hasImpact = time >= 4.36 && time <= 5.2;

  const chromaticPx = hasImpact
    ? impactDecay * (config.textureMode === 'vhs-glitch' ? 24 : config.textureMode === 'chalk-grunge' ? 13 : 6)
    : 0;

  const guideIn = easeOutCubic(segmentProgress(time, 2.55, 2.95));
  const guideOut = 1 - easeInOutCubic(segmentProgress(time, 4.05, 4.38));
  const guideAlpha = guideIn * guideOut * 0.16;
  if (guideAlpha > 0.005) {
    ctx.save();
    ctx.strokeStyle = '#F4F3F0';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = guideAlpha;
    const pad = 70;
    const x1 = lerp(layout.titleBounds.centerX, layout.titleBounds.left - pad, guideIn);
    const x2 = lerp(layout.titleBounds.centerX, layout.titleBounds.right + pad, guideIn);
    for (const y of [layout.titleBounds.top - 18, layout.titleBounds.bottom + 18]) {
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  const drawPass = (
    offsetX: number,
    offsetY: number,
    overrideColor: string | null,
    alphaScale: number,
    passTexture: TextureMode,
  ) => {
    for (let i = 0; i < layout.strokes.length; i++) {
      const s: PlacedStroke = layout.strokes[i];
      const isEmbeddedTriad = s.accentRole === 'circle' || s.accentRole === 'triangle';

      let drawProgress: number;
      let strokeAlpha = 1;
      if (isEmbeddedTriad) {
        drawProgress = 1;
        strokeAlpha = segmentProgress(time, 2.86, 3.12);
      } else {
        const localStart = assemblyStart + s.staggerOrder * 0.92;
        const localEnd = Math.min(assemblyEnd, localStart + 0.72);
        drawProgress = easeOutCubic(segmentProgress(time, localStart, localEnd));
      }

      if (drawProgress <= 0.001 || strokeAlpha <= 0.004) continue;

      const pts =
        drawProgress < 0.999
          ? samplePolyline(s.points, 0, drawProgress, s.closed)
          : s.points;

      const shiftedPts =
        offsetX === 0 && offsetY === 0
          ? pts
          : pts.map((p) => ({ x: p.x + offsetX, y: p.y + offsetY }));

      const isAccent = Boolean(s.accentRole);
      const baseColor = overrideColor
        ? overrideColor
        : isAccent
          ? mixHex('#F5F3EE', accentPrimary, revealP)
          : '#F5F3EE';

      const flashColor =
        !overrideColor && !isAccent && hasImpact && impactDecay > 0.35
          ? mixHex(baseColor, '#FFFFFF', impactDecay * 0.5)
          : baseColor;

      drawStylizedStroke(ctx, shiftedPts, {
        color: flashColor,
        lineWidth: layout.strokeWidth * s.weight,
        alpha: strokeAlpha * alphaScale,
        closed: drawProgress >= 0.999 && Boolean(s.closed),
        textureMode: passTexture,
        glowColor: !overrideColor && isAccent && revealP > 0.08 ? accentPrimary : undefined,
        glowIntensity: !overrideColor && isAccent ? revealP : 0,
        seed: 400 + i * 3,
        frameTick,
      });

      if (!overrideColor && !isEmbeddedTriad && drawProgress > 0.03 && drawProgress < 0.97 && shiftedPts.length > 0) {
        drawTipSpark(ctx, shiftedPts[shiftedPts.length - 1], accentPrimary, 6.5, 0.88);
      }
    }
  };

  if (chromaticPx > 0.6) {
    drawPass(-chromaticPx, 0, '#22D3EE', 0.42 * impactDecay, 'clean-vector');
    drawPass(chromaticPx, 0, accentPrimary, 0.52 * impactDecay, 'clean-vector');
  }

  drawPass(0, 0, null, 1, config.textureMode);
}

function renderCrestAndSubtitle(
  ctx: CanvasRenderingContext2D,
  time: number,
  layout: TitleCardLayout,
  config: TitleCardConfig,
  accentPrimary: string,
  frameTick: number,
): void {
  const reveal = easeOutExpo(segmentProgress(time, 4.38, 5.15));
  if (reveal <= 0.005) return;

  const cx = STAGE_WIDTH / 2;
  const crestY =
    layout.titleBounds.bottom +
    Math.max(58, (layout.subtitleY - layout.titleBounds.bottom) * 0.46);
  const crestRadius = Math.max(13, Math.min(20, layout.strokeWidth * 0.95));
  const spacing = crestRadius * 3.15;

  const lineHalfSpan = Math.min(
    320,
    Math.max(150, (layout.titleBounds.right - layout.titleBounds.left) * 0.34),
  );
  const innerGap = spacing + crestRadius * 2.2;
  const currentSpan = lerp(innerGap, lineHalfSpan, reveal);

  ctx.save();
  ctx.strokeStyle = accentPrimary;
  ctx.globalAlpha = 0.55 * reveal;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - innerGap, crestY);
  ctx.lineTo(cx - currentSpan, crestY);
  ctx.moveTo(cx + innerGap, crestY);
  ctx.lineTo(cx + currentSpan, crestY);
  ctx.stroke();
  ctx.restore();

  const crestShapes: Array<{ shape: TriadShapeType; x: number }> = [
    { shape: 'circle', x: cx - spacing },
    { shape: 'triangle', x: cx },
    { shape: 'square', x: cx + spacing },
  ];

  crestShapes.forEach((item, idx) => {
    const slot = layout.triadTargets[item.shape];
    if (!slot.embeddedInGlyph) return;
    const itemP = easeOutCubic(segmentProgress(time, 4.38 + idx * 0.07, 4.9 + idx * 0.07));
    if (itemP <= 0.01) return;
    const pts = makeTriadPoints(item.shape, item.x, crestY, crestRadius * lerp(0.75, 1, itemP));
    drawStylizedStroke(ctx, pts, {
      color: accentPrimary,
      lineWidth: 3.4,
      alpha: 0.95 * itemP,
      closed: item.shape !== 'circle',
      textureMode: config.textureMode === 'chalk-grunge' ? 'chalk-grunge' : 'clean-vector',
      glowColor: accentPrimary,
      glowIntensity: itemP * 0.85,
      seed: 900 + idx * 17,
      frameTick,
    });
  });

  if (config.showSubtitle && config.subtitle.trim().length > 0) {
    const subP = easeOutExpo(segmentProgress(time, 4.52, 5.25));
    if (subP > 0.005) {
      const subY = layout.subtitleY + lerp(14, 0, subP);
      ctx.save();
      ctx.globalAlpha = 0.92 * subP;
      ctx.fillStyle = '#EAE7E0';
      ctx.font = `600 ${Math.round(layout.subtitleFontSize)}px "Noto Sans KR", "Outfit", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const text = config.subtitle.trim();
      const trackingPx = lerp(18, 9, subP);
      const chars = Array.from(text);
      const widths = chars.map((ch) => ctx.measureText(ch).width);
      const totalW =
        widths.reduce((acc, w) => acc + w, 0) + Math.max(0, chars.length - 1) * trackingPx;
      let cursor = cx - totalW / 2;
      for (let i = 0; i < chars.length; i++) {
        ctx.fillText(chars[i], cursor + widths[i] / 2, subY);
        cursor += widths[i] + trackingPx;
      }
      ctx.restore();
    }
  }
}

function renderImpactParticles(
  ctx: CanvasRenderingContext2D,
  time: number,
  layout: TitleCardLayout,
  accentPrimary: string,
): void {
  const dt = time - 4.38;
  if (dt < 0 || dt > 2.4) return;

  const origins = [
    layout.triadTargets.circle,
    layout.triadTargets.triangle,
    layout.triadTargets.square,
  ];

  ctx.save();
  for (let o = 0; o < origins.length; o++) {
    const origin = origins[o];
    for (let i = 0; i < 12; i++) {
      const seed = o * 100 + i * 7.3;
      const angle = deterministicHash(seed) * Math.PI * 2;
      const speed = 90 + deterministicHash(seed + 1.9) * 240;
      const life = 0.8 + deterministicHash(seed + 3.1) * 1.4;
      const progress = clamp01(dt / life);
      if (progress >= 1) continue;

      const dist = easeOutExpo(progress) * speed;
      const px = origin.centerX + Math.cos(angle) * (origin.radius * 0.75 + dist);
      const py = origin.centerY + Math.sin(angle) * (origin.radius * 0.75 + dist) + progress * 18;
      const size = (1.6 + deterministicHash(seed + 5.4) * 3.0) * (1 - progress * 0.65);

      ctx.globalAlpha = (1 - progress) * 0.72;
      ctx.fillStyle = i % 3 === 0 ? accentPrimary : '#F4F3F0';
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function renderVhsGlitchOverlay(
  ctx: CanvasRenderingContext2D,
  time: number,
  textureMode: TextureMode,
  accentPrimary: string,
  frameTick: number,
): void {
  const impactStrength =
    time >= 4.36 && time <= 4.95 ? Math.exp(-(time - 4.36) * 8) : 0;

  if (textureMode === 'vhs-glitch') {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let y = 0; y < STAGE_HEIGHT; y += 8) {
      ctx.fillRect(0, y, STAGE_WIDTH, 2);
    }
    ctx.restore();
  }

  const shouldSlice =
    (textureMode === 'vhs-glitch' &&
      (impactStrength > 0.08 || deterministicHash(frameTick * 3.7) > 0.86)) ||
    (textureMode === 'chalk-grunge' && impactStrength > 0.32);

  if (!shouldSlice) return;

  const sliceCount = textureMode === 'vhs-glitch' ? 5 : 2;
  ctx.save();
  for (let i = 0; i < sliceCount; i++) {
    const hSeed = frameTick * 17.3 + i * 9.1;
    const y = Math.floor(deterministicHash(hSeed) * STAGE_HEIGHT);
    const h = 4 + Math.floor(deterministicHash(hSeed + 2.2) * 18);
    const w = 180 + Math.floor(deterministicHash(hSeed + 4.4) * 900);
    const x = Math.floor(deterministicHash(hSeed + 6.6) * (STAGE_WIDTH - w));
    ctx.globalAlpha = 0.08 + impactStrength * 0.18;
    ctx.fillStyle = i % 2 === 0 ? accentPrimary : '#E2E8F0';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

/**
 * Pure deterministic frame renderer. Automatically scales virtual 1920x1080 coordinates
 * to whatever physical pixel dimensions the target canvas uses (1280x720 preview or 1920x1080 export).
 */
export function renderTitleCardFrame(
  ctx: CanvasRenderingContext2D,
  time: number,
  layout: TitleCardLayout,
  config: TitleCardConfig,
): void {
  const clampedTime = Math.max(0, Math.min(TOTAL_DURATION, time));
  const theme = ACCENT_THEMES[config.accentTheme];
  const frameTick = Math.floor(clampedTime * 14);

  const scaleX = ctx.canvas.width / STAGE_WIDTH;
  const scaleY = ctx.canvas.height / STAGE_HEIGHT;

  ctx.save();
  ctx.scale(scaleX, scaleY);

  // 1. Pre-baked matte darkroom backdrop + vignette (fast single blit)
  const backdrop = getBackdropCanvas();
  if (backdrop) {
    ctx.drawImage(backdrop, 0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  } else {
    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  }

  // Subtle ambient theme atmospheric wash on Act 4 ignition
  const revealBloom = easeOutExpo(segmentProgress(clampedTime, 4.38, 5.2));
  if (revealBloom > 0.01) {
    const glowGrad = ctx.createRadialGradient(
      STAGE_WIDTH * 0.5,
      layout.titleBounds.centerY,
      20,
      STAGE_WIDTH * 0.5,
      layout.titleBounds.centerY,
      620,
    );
    glowGrad.addColorStop(0, theme.tint);
    glowGrad.addColorStop(1, 'rgba(6, 6, 8, 0)');
    ctx.save();
    ctx.globalAlpha = 0.48 * revealBloom;
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
    ctx.restore();
  }

  // 2. Cinema camera slow optical push-in + impact micro-shake at t = 4.38s
  const pushIn = lerp(0.965, 1.03, easeOutCubic(clampedTime / TOTAL_DURATION));
  let shakeX = 0;
  let shakeY = 0;
  if (clampedTime >= 4.37 && clampedTime <= 4.78) {
    const dt = clampedTime - 4.37;
    const damp = Math.exp(-dt * 14);
    const amp = config.textureMode === 'clean-vector' ? 5 : 11;
    shakeX = Math.sin(dt * 95) * amp * damp;
    shakeY = Math.cos(dt * 120) * (amp * 0.65) * damp;
  }

  ctx.save();
  ctx.translate(STAGE_WIDTH / 2 + shakeX, STAGE_HEIGHT / 2 + shakeY);
  ctx.scale(pushIn, pushIn);
  ctx.translate(-STAGE_WIDTH / 2, -STAGE_HEIGHT / 2);

  // 3. Act 1 Playground Court chalk guides
  if (config.showCourtGuide) {
    renderPlaygroundCourt(ctx, clampedTime, theme.primary, config.textureMode, frameTick);
  }

  // 4. Act 1–2 Hero Triad shapes (trace & morph into letter slots)
  renderHeroTriad(ctx, clampedTime, layout, config, theme.primary, frameTick);

  // 5. Act 3–5 Title card letterforms + chromatic impact + pink ignition
  renderTitleLetters(ctx, clampedTime, layout, config, theme.primary, frameTick);

  // 6. Act 4 Shockwave ring right at Pink Ignition
  const shockP = segmentProgress(clampedTime, 4.38, 5.05);
  if (shockP > 0 && shockP < 1) {
    const shockEased = easeOutExpo(shockP);
    ctx.save();
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = lerp(4, 1, shockEased);
    ctx.globalAlpha = (1 - shockEased) * 0.42;
    ctx.beginPath();
    ctx.arc(STAGE_WIDTH / 2, layout.titleBounds.centerY, lerp(90, 560, shockEased), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 7. Act 4–5 Signature triad crest (○ △ □) & Korean / custom subtitle
  renderCrestAndSubtitle(ctx, clampedTime, layout, config, theme.primary, frameTick);

  // 8. Act 4 Chalk dust particles
  renderImpactParticles(ctx, clampedTime, layout, theme.primary);

  ctx.restore();

  // 9. VHS / Glitch slices
  renderVhsGlitchOverlay(ctx, clampedTime, config.textureMode, theme.primary, frameTick);

  // 10. Fast pre-baked 35mm film grain boil
  const grain = getGrainOverlayCanvas();
  if (grain) {
    const grainAlpha =
      config.textureMode === 'vhs-glitch'
        ? 0.08
        : config.textureMode === 'chalk-grunge'
          ? 0.045
          : 0.012;
    const flipX = deterministicHash(frameTick * 5.3) > 0.5 ? -1 : 1;
    const flipY = deterministicHash(frameTick * 9.7) > 0.5 ? -1 : 1;
    ctx.save();
    ctx.globalAlpha = grainAlpha;
    ctx.translate(flipX < 0 ? STAGE_WIDTH : 0, flipY < 0 ? STAGE_HEIGHT : 0);
    ctx.scale(flipX, flipY);
    ctx.drawImage(grain, 0, 0, STAGE_WIDTH, STAGE_HEIGHT);
    ctx.restore();
  }

  ctx.restore();
}
