import { ACCENT_THEMES } from './presets';
import { STAGE_HEIGHT, STAGE_WIDTH } from './renderer';
import { layoutTitleCard, sanitizeTitleLine } from './squidFont';
import { TOTAL_DURATION } from './timeline';
import type { PlacedStroke, TitleCardConfig, TitleCardLayout } from './types';

export type ExportCodeFormat = 'html' | 'react';
export type ExportSizingMode = 'responsive' | 'fullscreen';

export interface ExportedCodeArtifact {
  format: ExportCodeFormat;
  sizing: ExportSizingMode;
  filename: string;
  componentName: string;
  mimeType: string;
  code: string;
  lineCount: number;
  byteSize: number;
}

interface CompactStroke {
  p: number[]; // flattened [x0, y0, x1, y1, ...] rounded to 1 decimal
  c?: 1; // closed
  a?: 'c' | 't'; // accentRole: circle | triangle
  w?: number; // stroke weight multiplier (omitted if 1)
  s: number; // staggerOrder rounded to 3 decimals
}

interface CompactTriadTarget {
  x: number;
  y: number;
  r: number;
  e: 0 | 1; // embeddedInGlyph
}

interface ExportPayload {
  line1: string;
  line2: string;
  subtitle: string;
  showSubtitle: boolean;
  showCourtGuide: boolean;
  textureMode: TitleCardConfig['textureMode'];
  speed: number;
  loop: boolean;
  accentPrimary: string;
  accentTint: string;
  strokeWidth: number;
  subtitleY: number;
  subtitleFontSize: number;
  bounds: {
    l: number;
    r: number;
    t: number;
    b: number;
    cx: number;
    cy: number;
  };
  triad: {
    circle: CompactTriadTarget;
    triangle: CompactTriadTarget;
    square: CompactTriadTarget;
  };
  strokes: CompactStroke[];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function buildComponentName(config: TitleCardConfig): string {
  const combined = `${sanitizeTitleLine(config.line1) || 'SQUID'} ${sanitizeTitleLine(config.line2)}`.trim();
  const words = combined
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  const base = words.join('') || 'SquidGame';
  const safeBase = /^[0-9]/.test(base) ? `TitleCard${base}` : `${base}TitleCard`;
  return safeBase.slice(0, 40);
}

export function buildExportFilename(
  config: TitleCardConfig,
  format: ExportCodeFormat,
): string {
  if (format === 'react') {
    return `${buildComponentName(config)}.tsx`;
  }
  const combined = `${sanitizeTitleLine(config.line1) || 'squid'} ${sanitizeTitleLine(config.line2)}`.trim();
  const slug = combined
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'squid-game';
  return `${slug}-title-card.html`;
}

function serializeLayoutPayload(
  config: TitleCardConfig,
  layout: TitleCardLayout,
): ExportPayload {
  const theme = ACCENT_THEMES[config.accentTheme];

  const compactStrokes: CompactStroke[] = layout.strokes.map((st: PlacedStroke) => {
    const flat: number[] = [];
    for (let i = 0; i < st.points.length; i++) {
      flat.push(round1(st.points[i].x), round1(st.points[i].y));
    }
    const item: CompactStroke = {
      p: flat,
      s: round3(st.staggerOrder),
    };
    if (st.closed) item.c = 1;
    if (st.accentRole === 'circle') item.a = 'c';
    if (st.accentRole === 'triangle') item.a = 't';
    if (Math.abs(st.weight - 1) > 0.005) item.w = round3(st.weight);
    return item;
  });

  const packTriad = (slot: TitleCardLayout['triadTargets']['circle']): CompactTriadTarget => ({
    x: round1(slot.centerX),
    y: round1(slot.centerY),
    r: round1(slot.radius),
    e: slot.embeddedInGlyph ? 1 : 0,
  });

  return {
    line1: layout.line1Text,
    line2: layout.line2Text,
    subtitle: config.subtitle.trim().slice(0, 32),
    showSubtitle: config.showSubtitle,
    showCourtGuide: config.showCourtGuide,
    textureMode: config.textureMode,
    speed: config.speed,
    loop: config.loop,
    accentPrimary: theme.primary,
    accentTint: theme.tint,
    strokeWidth: round1(layout.strokeWidth),
    subtitleY: round1(layout.subtitleY),
    subtitleFontSize: round1(layout.subtitleFontSize),
    bounds: {
      l: round1(layout.titleBounds.left),
      r: round1(layout.titleBounds.right),
      t: round1(layout.titleBounds.top),
      b: round1(layout.titleBounds.bottom),
      cx: round1(layout.titleBounds.centerX),
      cy: round1(layout.titleBounds.centerY),
    },
    triad: {
      circle: packTriad(layout.triadTargets.circle),
      triangle: packTriad(layout.triadTargets.triangle),
      square: packTriad(layout.triadTargets.square),
    },
    strokes: compactStrokes,
  };
}

/**
 * Generates the compact, zero-dependency Canvas 2D renderer function body shared
 * by both the Standalone HTML export and the React TypeScript component export.
 */
function buildRendererCoreJs(indent = '  '): string {
  const lines = [
    `const STAGE_W = ${STAGE_WIDTH};`,
    `const STAGE_H = ${STAGE_HEIGHT};`,
    `const DURATION = ${TOTAL_DURATION};`,
    `const clamp01 = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v);`,
    `const lerp = (a, b, t) => a + (b - a) * t;`,
    `const seg = (t, s, e) => (e <= s ? (t >= e ? 1 : 0) : clamp01((t - s) / (e - s)));`,
    `const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);`,
    `const easeInOutCubic = (t) => { const c = clamp01(t); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };`,
    `const easeOutExpo = (t) => { const c = clamp01(t); return c === 1 ? 1 : 1 - Math.pow(2, -10 * c); };`,
    `const easeInOutQuart = (t) => { const c = clamp01(t); return c < 0.5 ? 8 * c * c * c * c : 1 - Math.pow(-2 * c + 2, 4) / 2; };`,
    `const hash = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); };`,
    `const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };`,
    `const mixHex = (a, b, t) => { const c = clamp01(t), A = hexRgb(a), B = hexRgb(b); return "rgb(" + Math.round(lerp(A[0], B[0], c)) + "," + Math.round(lerp(A[1], B[1], c)) + "," + Math.round(lerp(A[2], B[2], c)) + ")"; };`,
    `const unpack = (flat) => { const out = []; for (let i = 0; i < flat.length; i += 2) out.push({ x: flat[i], y: flat[i + 1] }); return out; };`,
    `const samplePoly = (pts, endR, closed) => {`,
    `  if (pts.length < 2 || endR <= 0) return [];`,
    `  const arr = closed ? pts.concat([pts[0]]) : pts;`,
    `  let total = 0;`,
    `  for (let i = 1; i < arr.length; i++) total += Math.hypot(arr[i].x - arr[i - 1].x, arr[i].y - arr[i - 1].y);`,
    `  if (total <= 1e-6) return [];`,
    `  const target = clamp01(endR) * total;`,
    `  const res = [arr[0]];`,
    `  let acc = 0;`,
    `  for (let i = 1; i < arr.length; i++) {`,
    `    const p0 = arr[i - 1], p1 = arr[i];`,
    `    const d = Math.hypot(p1.x - p0.x, p1.y - p0.y);`,
    `    if (d <= 1e-6) continue;`,
    `    if (acc + d >= target) {`,
    `      const k = (target - acc) / d;`,
    `      res.push({ x: lerp(p0.x, p1.x, k), y: lerp(p0.y, p1.y, k) });`,
    `      break;`,
    `    }`,
    `    res.push(p1);`,
    `    acc += d;`,
    `  }`,
    `  return res;`,
    `};`,
    `const triadPts = (shape, cx, cy, r, rot) => {`,
    `  const cos = Math.cos(rot || 0), sin = Math.sin(rot || 0);`,
    `  const R = (x, y) => (!rot ? { x, y } : { x: cx + (x - cx) * cos - (y - cy) * sin, y: cy + (x - cx) * sin + (y - cy) * cos });`,
    `  if (shape === "circle") {`,
    `    const pts = [];`,
    `    for (let i = 0; i <= 40; i++) { const a = -Math.PI / 2 + (i / 40) * Math.PI * 2; pts.push(R(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); }`,
    `    return pts;`,
    `  }`,
    `  if (shape === "triangle") return [R(cx, cy - r * 1.12), R(cx + r * 1.02, cy + r * 0.85), R(cx - r * 1.02, cy + r * 0.85)];`,
    `  const h = r * 0.88;`,
    `  return [R(cx - h, cy - h), R(cx + h, cy - h), R(cx + h, cy + h), R(cx - h, cy + h)];`,
    `};`,
    `const drawRaw = (ctx, pts, closed) => {`,
    `  if (pts.length < 2) return;`,
    `  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);`,
    `  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);`,
    `  if (closed) ctx.closePath();`,
    `  ctx.stroke();`,
    `};`,
    `const drawStroke = (ctx, pts, color, lw, alpha, closed, mode, glowCol, glowAmt, seed, tick) => {`,
    `  if (pts.length < 2 || alpha <= 0.004) return;`,
    `  ctx.save(); ctx.lineCap = "square"; ctx.lineJoin = "miter"; ctx.miterLimit = 6;`,
    `  if (glowCol && glowAmt > 0.05) {`,
    `    ctx.strokeStyle = glowCol;`,
    `    ctx.globalAlpha = alpha * 0.16 * glowAmt; ctx.lineWidth = lw * 2.35; drawRaw(ctx, pts, closed);`,
    `    ctx.globalAlpha = alpha * 0.28 * glowAmt; ctx.lineWidth = lw * 1.48; drawRaw(ctx, pts, closed);`,
    `  }`,
    `  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = lw; drawRaw(ctx, pts, closed);`,
    `  if (mode === "chalk-grunge") {`,
    `    const amp = Math.max(0.9, lw * 0.095);`,
    `    const jit = pts.map((p, i) => { const s = seed * 31.7 + i * 7.1 + tick * 0.37; return { x: p.x + (hash(s) - 0.5) * 2 * amp, y: p.y + (hash(s + 13.7) - 0.5) * 2 * amp }; });`,
    `    ctx.globalAlpha = alpha * 0.28; ctx.lineWidth = lw * 1.18; drawRaw(ctx, jit, closed);`,
    `  }`,
    `  ctx.restore();`,
    `};`,
    `const drawSpark = (ctx, pt, color, r, alpha) => {`,
    `  if (alpha <= 0.01) return;`,
    `  ctx.save(); ctx.globalAlpha = alpha * 0.32; ctx.fillStyle = color;`,
    `  ctx.beginPath(); ctx.arc(pt.x, pt.y, r * 2.4, 0, Math.PI * 2); ctx.fill();`,
    `  ctx.globalAlpha = alpha; ctx.fillStyle = "#FFFFFF";`,
    `  ctx.beginPath(); ctx.arc(pt.x, pt.y, r * 0.85, 0, Math.PI * 2); ctx.fill();`,
    `  ctx.restore();`,
    `};`,
    `const makeBackdrop = () => {`,
    `  const c = document.createElement("canvas"); c.width = 960; c.height = 540;`,
    `  const g = c.getContext("2d"); if (!g) return null;`,
    `  g.fillStyle = "#060608"; g.fillRect(0, 0, 960, 540);`,
    `  const bg = g.createRadialGradient(480, 248, 40, 480, 270, 624);`,
    `  bg.addColorStop(0, "#14131A"); bg.addColorStop(0.58, "#09090D"); bg.addColorStop(1, "#040406");`,
    `  g.fillStyle = bg; g.fillRect(0, 0, 960, 540);`,
    `  const vig = g.createRadialGradient(480, 270, 184, 480, 270, 595);`,
    `  vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(0,0,0,0.55)");`,
    `  g.fillStyle = vig; g.fillRect(0, 0, 960, 540);`,
    `  return c;`,
    `};`,
    `const makeGrain = () => {`,
    `  const c = document.createElement("canvas"); c.width = 320; c.height = 180;`,
    `  const g = c.getContext("2d"); if (!g) return null;`,
    `  const img = g.createImageData(320, 180), d = img.data;`,
    `  for (let i = 0; i < 57600; i++) {`,
    `    const n = hash(i * 1.13 + 7.91), v = n > 0.5 ? 255 : 0, a = Math.floor(Math.abs(n - 0.5) * 510), k = i * 4;`,
    `    d[k] = v; d[k + 1] = v; d[k + 2] = v; d[k + 3] = a;`,
    `  }`,
    `  g.putImageData(img, 0, 0); return c;`,
    `};`,
    `const decodedStrokes = CONFIG.strokes.map((st) => ({ pts: unpack(st.p), closed: !!st.c, accent: st.a || null, weight: st.w || 1, stagger: st.s }));`,
    `const backdrop = makeBackdrop();`,
    `const grain = makeGrain();`,
    `const renderFrame = (ctx, time) => {`,
    `  const t = Math.max(0, Math.min(DURATION, time));`,
    `  const tick = Math.floor(t * 14);`,
    `  const accent = CONFIG.accentPrimary;`,
    `  const mode = CONFIG.textureMode;`,
    `  ctx.save(); ctx.scale(ctx.canvas.width / STAGE_W, ctx.canvas.height / STAGE_H);`,
    `  if (backdrop) ctx.drawImage(backdrop, 0, 0, STAGE_W, STAGE_H); else { ctx.fillStyle = "#060608"; ctx.fillRect(0, 0, STAGE_W, STAGE_H); }`,
    `  const bloom = easeOutExpo(seg(t, 4.38, 5.2));`,
    `  if (bloom > 0.01) {`,
    `    const gr = ctx.createRadialGradient(STAGE_W * 0.5, CONFIG.bounds.cy, 20, STAGE_W * 0.5, CONFIG.bounds.cy, 620);`,
    `    gr.addColorStop(0, CONFIG.accentTint); gr.addColorStop(1, "rgba(6,6,8,0)");`,
    `    ctx.save(); ctx.globalAlpha = 0.48 * bloom; ctx.fillStyle = gr; ctx.fillRect(0, 0, STAGE_W, STAGE_H); ctx.restore();`,
    `  }`,
    `  const push = lerp(0.965, 1.03, easeOutCubic(t / DURATION));`,
    `  let sx = 0, sy = 0;`,
    `  if (t >= 4.37 && t <= 4.78) { const dt = t - 4.37, dm = Math.exp(-dt * 14), amp = mode === "clean-vector" ? 5 : 11; sx = Math.sin(dt * 95) * amp * dm; sy = Math.cos(dt * 120) * amp * 0.65 * dm; }`,
    `  ctx.save(); ctx.translate(STAGE_W / 2 + sx, STAGE_H / 2 + sy); ctx.scale(push, push); ctx.translate(-STAGE_W / 2, -STAGE_H / 2);`,
    `  if (CONFIG.showCourtGuide) {`,
    `    const din = easeOutCubic(seg(t, 0, 1.35)), fout = 1 - easeInOutCubic(seg(t, 2.05, 3.15));`,
    `    if (din > 0.001 && fout > 0.001) {`,
    `      const cx = STAGE_W / 2, cy = STAGE_H / 2;`,
    `      const lines = [`,
    `        { p: [{ x: cx, y: cy - 390 }, { x: cx, y: cy + 390 }], d: 0 },`,
    `        { p: [{ x: cx - 440, y: cy }, { x: cx + 440, y: cy }], d: 0.08 },`,
    `        { p: triadPts("circle", cx, cy - 225, 118, 0), d: 0.12 },`,
    `        { p: [{ x: cx - 44, y: cy - 115 }, { x: cx - 44, y: cy - 68 }], d: 0.22 },`,
    `        { p: [{ x: cx + 44, y: cy - 115 }, { x: cx + 44, y: cy - 68 }], d: 0.22 },`,
    `        { p: [{ x: cx, y: cy - 118 }, { x: cx + 235, y: cy + 165 }, { x: cx - 235, y: cy + 165 }], c: true, d: 0.28 },`,
    `        { p: [{ x: cx - 235, y: cy + 165 }, { x: cx + 235, y: cy + 165 }, { x: cx + 235, y: cy + 355 }, { x: cx - 235, y: cy + 355 }], c: true, d: 0.38 }`,
    `      ];`,
    `      const col = mixHex("#E7E4DC", accent, Math.sin(seg(t, 1.52, 1.92) * Math.PI) * 0.45);`,
    `      lines.forEach((ln, i) => {`,
    `        const lp = easeOutCubic(clamp01((din - ln.d) / (1 - ln.d)));`,
    `        drawStroke(ctx, samplePoly(ln.p, lp, !!ln.c), col, 2.5, 0.2 * fout, false, mode, null, 0, 100 + i, tick);`,
    `      });`,
    `    }`,
    `  }`,
    `  const pulse = Math.sin(seg(t, 1.52, 1.94) * Math.PI);`,
    `  const revealP = easeOutExpo(seg(t, 4.38, 4.92));`,
    `  const starts = { circle: { x: 960, y: 315, r: 74, ts: 0.12, te: 0.85, md: 0 }, triangle: { x: 960, y: 558, r: 78, ts: 0.48, te: 1.24, md: 0.1 }, square: { x: 960, y: 798, r: 74, ts: 0.84, te: 1.58, md: 0.2 } };`,
    `  ["circle", "triangle", "square"].forEach((sh) => {`,
    `    const st = starts[sh], tg = CONFIG.triad[sh], tp = easeOutCubic(seg(t, st.ts, st.te));`,
    `    if (tp <= 0.001) return;`,
    `    const ms = 1.75 + st.md, me = 2.85 + st.md * 0.5, mp = easeInOutQuart(seg(t, ms, me));`,
    `    let vis = 1;`,
    `    if (tg.e) vis = sh === "square" ? 1 - easeInOutCubic(seg(t, 2.78, 3.25)) : 1 - seg(t, 2.86, 3.12);`,
    `    if (vis <= 0.005) return;`,
    `    if (mp > 0.04 && mp < 0.94) {`,
    `      [0.07, 0.035].forEach((lag) => {`,
    `        const lp = easeInOutQuart(seg(t - lag, ms, me));`,
    `        const gPts = triadPts(sh, lerp(st.x, tg.x, lp), lerp(st.y, tg.y, lp), lerp(st.r, tg.r, lp), Math.sin(lp * Math.PI) * (sh === "square" ? Math.PI * 0.25 : 0.24));`,
    `        drawStroke(ctx, gPts, accent, Math.max(4, CONFIG.strokeWidth * 0.55), 0.22 * vis * Math.sin(mp * Math.PI), sh !== "circle", "clean-vector", null, 0, 300, tick);`,
    `      });`,
    `    }`,
    `    const rot = Math.sin(mp * Math.PI) * (sh === "square" ? Math.PI * 0.25 : sh === "triangle" ? 0.22 : 0);`,
    `    const closed = sh !== "circle";`,
    `    const full = triadPts(sh, lerp(st.x, tg.x, mp), lerp(st.y, tg.y, mp), lerp(st.r, tg.r, mp), rot);`,
    `    const drawn = tp < 0.999 ? samplePoly(full, tp, closed) : full;`,
    `    const lw = tg.e ? lerp(11.5, CONFIG.strokeWidth * 1.04, mp) : lerp(11.5, Math.max(4.5, CONFIG.strokeWidth * 0.34), mp);`,
    `    const cmix = tg.e ? clamp01(pulse * 0.85) : clamp01(pulse * 0.85 + revealP);`,
    `    drawStroke(ctx, drawn, mixHex("#F5F3EE", accent, cmix), lw, vis, tp >= 0.999 && closed, mode, cmix > 0.2 ? accent : null, cmix, sh === "circle" ? 11 : sh === "triangle" ? 23 : 37, tick);`,
    `    if (tp > 0.02 && tp < 0.98 && drawn.length) drawSpark(ctx, drawn[drawn.length - 1], accent, 7.5, 0.95);`,
    `  });`,
    `  if (t >= 2.5) {`,
    `    const impDecay = Math.exp(-Math.max(0, t - 4.38) * 7.2);`,
    `    const hasImp = t >= 4.36 && t <= 5.2;`,
    `    const chroma = hasImp ? impDecay * (mode === "vhs-glitch" ? 24 : mode === "chalk-grunge" ? 13 : 6) : 0;`,
    `    const gin = easeOutCubic(seg(t, 2.55, 2.95)), gout = 1 - easeInOutCubic(seg(t, 4.05, 4.38));`,
    `    if (gin * gout * 0.16 > 0.005) {`,
    `      ctx.save(); ctx.strokeStyle = "#F4F3F0"; ctx.lineWidth = 1.5; ctx.globalAlpha = gin * gout * 0.16;`,
    `      const x1 = lerp(CONFIG.bounds.cx, CONFIG.bounds.l - 70, gin), x2 = lerp(CONFIG.bounds.cx, CONFIG.bounds.r + 70, gin);`,
    `      [CONFIG.bounds.t - 18, CONFIG.bounds.b + 18].forEach((y) => { ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); });`,
    `      ctx.restore();`,
    `    }`,
    `    const drawPass = (ox, overrideCol, aScale, pMode) => {`,
    `      decodedStrokes.forEach((s, i) => {`,
    `        const isTri = s.accent === "c" || s.accent === "t";`,
    `        let dp = 1, sa = 1;`,
    `        if (isTri) { sa = seg(t, 2.86, 3.12); } else { const ls = 2.55 + s.stagger * 0.92; dp = easeOutCubic(seg(t, ls, Math.min(4.32, ls + 0.72))); }`,
    `        if (dp <= 0.001 || sa <= 0.004) return;`,
    `        const rawPts = dp < 0.999 ? samplePoly(s.pts, dp, s.closed) : s.pts;`,
    `        const pts = ox ? rawPts.map((p) => ({ x: p.x + ox, y: p.y })) : rawPts;`,
    `        const baseCol = overrideCol || (isTri ? mixHex("#F5F3EE", accent, revealP) : "#F5F3EE");`,
    `        const col = !overrideCol && !isTri && hasImp && impDecay > 0.35 ? mixHex(baseCol, "#FFFFFF", impDecay * 0.5) : baseCol;`,
    `        drawStroke(ctx, pts, col, CONFIG.strokeWidth * s.weight, sa * aScale, dp >= 0.999 && s.closed, pMode, !overrideCol && isTri && revealP > 0.08 ? accent : null, !overrideCol && isTri ? revealP : 0, 400 + i * 3, tick);`,
    `        if (!overrideCol && !isTri && dp > 0.03 && dp < 0.97 && pts.length) drawSpark(ctx, pts[pts.length - 1], accent, 6.5, 0.88);`,
    `      });`,
    `    };`,
    `    if (chroma > 0.6) { drawPass(-chroma, "#22D3EE", 0.42 * impDecay, "clean-vector"); drawPass(chroma, accent, 0.52 * impDecay, "clean-vector"); }`,
    `    drawPass(0, null, 1, mode);`,
    `  }`,
    `  const shockP = seg(t, 4.38, 5.05);`,
    `  if (shockP > 0 && shockP < 1) {`,
    `    const se = easeOutExpo(shockP);`,
    `    ctx.save(); ctx.strokeStyle = accent; ctx.lineWidth = lerp(4, 1, se); ctx.globalAlpha = (1 - se) * 0.42;`,
    `    ctx.beginPath(); ctx.arc(STAGE_W / 2, CONFIG.bounds.cy, lerp(90, 560, se), 0, Math.PI * 2); ctx.stroke(); ctx.restore();`,
    `  }`,
    `  const crestRev = easeOutExpo(seg(t, 4.38, 5.15));`,
    `  if (crestRev > 0.005) {`,
    `    const cx = STAGE_W / 2, cy = CONFIG.bounds.b + Math.max(58, (CONFIG.subtitleY - CONFIG.bounds.b) * 0.46);`,
    `    const cr = Math.max(13, Math.min(20, CONFIG.strokeWidth * 0.95)), sp = cr * 3.15;`,
    `    const halfSpan = Math.min(320, Math.max(150, (CONFIG.bounds.r - CONFIG.bounds.l) * 0.34)), gap = sp + cr * 2.2, cur = lerp(gap, halfSpan, crestRev);`,
    `    ctx.save(); ctx.strokeStyle = accent; ctx.globalAlpha = 0.55 * crestRev; ctx.lineWidth = 2;`,
    `    ctx.beginPath(); ctx.moveTo(cx - gap, cy); ctx.lineTo(cx - cur, cy); ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + cur, cy); ctx.stroke(); ctx.restore();`,
    `    [["circle", cx - sp], ["triangle", cx], ["square", cx + sp]].forEach(([sh, x], idx) => {`,
    `      if (!CONFIG.triad[sh].e) return;`,
    `      const ip = easeOutCubic(seg(t, 4.38 + idx * 0.07, 4.9 + idx * 0.07));`,
    `      if (ip <= 0.01) return;`,
    `      drawStroke(ctx, triadPts(sh, x, cy, cr * lerp(0.75, 1, ip), 0), accent, 3.4, 0.95 * ip, sh !== "circle", mode === "chalk-grunge" ? "chalk-grunge" : "clean-vector", accent, ip * 0.85, 900 + idx * 17, tick);`,
    `    });`,
    `    if (CONFIG.showSubtitle && CONFIG.subtitle) {`,
    `      const subP = easeOutExpo(seg(t, 4.52, 5.25));`,
    `      if (subP > 0.005) {`,
    `        ctx.save(); ctx.globalAlpha = 0.92 * subP; ctx.fillStyle = "#EAE7E0";`,
    `        ctx.font = "600 " + Math.round(CONFIG.subtitleFontSize) + 'px "Noto Sans KR","Outfit",system-ui,sans-serif';`,
    `        ctx.textAlign = "center"; ctx.textBaseline = "middle";`,
    `        const chars = Array.from(CONFIG.subtitle), tr = lerp(18, 9, subP), ws = chars.map((ch) => ctx.measureText(ch).width);`,
    `        const tw = ws.reduce((a, b) => a + b, 0) + Math.max(0, chars.length - 1) * tr;`,
    `        let curX = cx - tw / 2, subY = CONFIG.subtitleY + lerp(14, 0, subP);`,
    `        for (let i = 0; i < chars.length; i++) { ctx.fillText(chars[i], curX + ws[i] / 2, subY); curX += ws[i] + tr; }`,
    `        ctx.restore();`,
    `      }`,
    `    }`,
    `  }`,
    `  const pdt = t - 4.38;`,
    `  if (pdt >= 0 && pdt <= 2.4) {`,
    `    ctx.save();`,
    `    [CONFIG.triad.circle, CONFIG.triad.triangle, CONFIG.triad.square].forEach((o, oi) => {`,
    `      for (let i = 0; i < 12; i++) {`,
    `        const sd = oi * 100 + i * 7.3, ang = hash(sd) * Math.PI * 2, spd = 90 + hash(sd + 1.9) * 240, life = 0.8 + hash(sd + 3.1) * 1.4, pr = clamp01(pdt / life);`,
    `        if (pr >= 1) continue;`,
    `        const dist = easeOutExpo(pr) * spd;`,
    `        ctx.globalAlpha = (1 - pr) * 0.72; ctx.fillStyle = i % 3 === 0 ? accent : "#F4F3F0";`,
    `        ctx.beginPath(); ctx.arc(o.x + Math.cos(ang) * (o.r * 0.75 + dist), o.y + Math.sin(ang) * (o.r * 0.75 + dist) + pr * 18, (1.6 + hash(sd + 5.4) * 3) * (1 - pr * 0.65), 0, Math.PI * 2); ctx.fill();`,
    `      }`,
    `    });`,
    `    ctx.restore();`,
    `  }`,
    `  ctx.restore();`,
    `  const impS = t >= 4.36 && t <= 4.95 ? Math.exp(-(t - 4.36) * 8) : 0;`,
    `  if (mode === "vhs-glitch") { ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.2)"; for (let y = 0; y < STAGE_H; y += 8) ctx.fillRect(0, y, STAGE_W, 2); ctx.restore(); }`,
    `  if ((mode === "vhs-glitch" && (impS > 0.08 || hash(tick * 3.7) > 0.86)) || (mode === "chalk-grunge" && impS > 0.32)) {`,
    `    ctx.save();`,
    `    for (let i = 0; i < (mode === "vhs-glitch" ? 5 : 2); i++) {`,
    `      const hs = tick * 17.3 + i * 9.1, y = Math.floor(hash(hs) * STAGE_H), h = 4 + Math.floor(hash(hs + 2.2) * 18), w = 180 + Math.floor(hash(hs + 4.4) * 900), x = Math.floor(hash(hs + 6.6) * (STAGE_W - w));`,
    `      ctx.globalAlpha = 0.08 + impS * 0.18; ctx.fillStyle = i % 2 === 0 ? accent : "#E2E8F0"; ctx.fillRect(x, y, w, h);`,
    `    }`,
    `    ctx.restore();`,
    `  }`,
    `  if (grain) {`,
    `    const ga = mode === "vhs-glitch" ? 0.08 : mode === "chalk-grunge" ? 0.045 : 0.012;`,
    `    const fx = hash(tick * 5.3) > 0.5 ? -1 : 1, fy = hash(tick * 9.7) > 0.5 ? -1 : 1;`,
    `    ctx.save(); ctx.globalAlpha = ga; ctx.translate(fx < 0 ? STAGE_W : 0, fy < 0 ? STAGE_H : 0); ctx.scale(fx, fy); ctx.drawImage(grain, 0, 0, STAGE_W, STAGE_H); ctx.restore();`,
    `  }`,
    `  ctx.restore();`,
    `};`,
  ];
  return lines.map((line) => `${indent}${line}`).join('\n');
}

export function buildStandaloneHtml(
  config: TitleCardConfig,
  sizing: ExportSizingMode = 'responsive',
): string {
  const layout = layoutTitleCard(config.line1, config.line2, STAGE_WIDTH, STAGE_HEIGHT);
  const payload = serializeLayoutPayload(config, layout);
  const displayTitle = `${payload.line1}${payload.line2 ? ` ${payload.line2}` : ''}`;
  const safeTitle = escapeHtml(displayTitle);
  const payloadJson = safeJsonForScript(payload);

  const containerCss =
    sizing === 'fullscreen'
      ? `    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      background: #060608;
      overflow: hidden;
    }
    .title-card-stage {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #060608;
    }
    .title-card-stage canvas {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }`
      : `    html, body {
      margin: 0;
      background: #060608;
    }
    .title-card-stage {
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #060608;
      overflow: hidden;
    }
    .title-card-stage canvas {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} — Title Card Animation</title>
  <style>
${containerCss}
  </style>
</head>
<body>
  <div class="title-card-stage">
    <canvas id="squid-title-canvas" role="img" aria-label="${safeTitle} animated title card"></canvas>
  </div>
  <script>
(() => {
  const CONFIG = ${payloadJson};
  const canvas = document.getElementById("squid-title-canvas");
  if (!canvas) return;
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

${buildRendererCoreJs('  ')}

  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    renderFrame(ctx, 5.8);
    return;
  }

  let elapsed = 0;
  let last = performance.now();
  const tickLoop = (now) => {
    const dt = Math.min(0.12, Math.max(0, (now - last) / 1000));
    last = now;
    elapsed += dt * CONFIG.speed;
    if (elapsed >= DURATION) {
      if (CONFIG.loop) {
        elapsed = 0;
      } else {
        elapsed = DURATION;
        renderFrame(ctx, elapsed);
        return;
      }
    }
    renderFrame(ctx, elapsed);
    requestAnimationFrame(tickLoop);
  };

  renderFrame(ctx, 0);
  requestAnimationFrame(tickLoop);
})();
  </script>
</body>
</html>
`;
}

export function buildReactComponent(
  config: TitleCardConfig,
  sizing: ExportSizingMode = 'responsive',
): string {
  const layout = layoutTitleCard(config.line1, config.line2, STAGE_WIDTH, STAGE_HEIGHT);
  const payload = serializeLayoutPayload(config, layout);
  const componentName = buildComponentName(config);
  const displayTitle = `${payload.line1}${payload.line2 ? ` ${payload.line2}` : ''}`;
  const payloadJson = safeJsonForScript(payload);

  const wrapperStyle =
    sizing === 'fullscreen'
      ? `{ width: "100vw", height: "100vh", background: "#060608", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }`
      : `{ width: "100%", aspectRatio: "16 / 9", background: "#060608", overflow: "hidden" }`;

  return `import { useEffect, useRef } from "react";

export interface ${componentName}Props {
  className?: string;
  loop?: boolean;
  speed?: number;
  respectReducedMotion?: boolean;
}

const CONFIG = ${payloadJson} as const;

export default function ${componentName}({
  className,
  loop = ${payload.loop},
  speed = ${payload.speed},
  respectReducedMotion = true,
}: ${componentName}Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

${buildRendererCoreJs('    ')
  .replace(/const clamp01 = \(v\) =>/g, 'const clamp01 = (v: number) =>')
  .replace(/const lerp = \(a, b, t\) =>/g, 'const lerp = (a: number, b: number, t: number) =>')
  .replace(/const seg = \(t, s, e\) =>/g, 'const seg = (t: number, s: number, e: number) =>')
  .replace(/const easeOutCubic = \(t\) =>/g, 'const easeOutCubic = (t: number) =>')
  .replace(/const easeInOutCubic = \(t\) =>/g, 'const easeInOutCubic = (t: number) =>')
  .replace(/const easeOutExpo = \(t\) =>/g, 'const easeOutExpo = (t: number) =>')
  .replace(/const easeInOutQuart = \(t\) =>/g, 'const easeInOutQuart = (t: number) =>')
  .replace(/const hash = \(s\) =>/g, 'const hash = (s: number) =>')
  .replace(/const hexRgb = \(h\) =>/g, 'const hexRgb = (h: string): [number, number, number] =>')
  .replace(/const mixHex = \(a, b, t\) =>/g, 'const mixHex = (a: string, b: string, t: number) =>')
  .replace(/const unpack = \(flat\) =>/g, 'const unpack = (flat: readonly number[]) =>')
  .replace(/const samplePoly = \(pts, endR, closed\) =>/g, 'const samplePoly = (pts: Array<{ x: number; y: number }>, endR: number, closed: boolean) =>')
  .replace(/const triadPts = \(shape, cx, cy, r, rot\) =>/g, 'const triadPts = (shape: string, cx: number, cy: number, r: number, rot: number) =>')
  .replace(/const R = \(x, y\) =>/g, 'const R = (x: number, y: number) =>')
  .replace(/const drawRaw = \(ctx, pts, closed\) =>/g, 'const drawRaw = (ctx: CanvasRenderingContext2D, pts: Array<{ x: number; y: number }>, closed: boolean) =>')
  .replace(/const drawStroke = \(ctx, pts, color, lw, alpha, closed, mode, glowCol, glowAmt, seed, tick\) =>/g, 'const drawStroke = (ctx: CanvasRenderingContext2D, pts: Array<{ x: number; y: number }>, color: string, lw: number, alpha: number, closed: boolean, mode: string, glowCol: string | null, glowAmt: number, seed: number, tick: number) =>')
  .replace(/const drawSpark = \(ctx, pt, color, r, alpha\) =>/g, 'const drawSpark = (ctx: CanvasRenderingContext2D, pt: { x: number; y: number }, color: string, r: number, alpha: number) =>')
  .replace(/const renderFrame = \(ctx, time\) =>/g, 'const renderFrame = (ctx: CanvasRenderingContext2D, time: number) =>')
  .replace(/const drawPass = \(ox, overrideCol, aScale, pMode\) =>/g, 'const drawPass = (ox: number, overrideCol: string | null, aScale: number, pMode: string) =>')
  .replace(/const starts = \{/g, 'const starts: Record<string, { x: number; y: number; r: number; ts: number; te: number; md: number }> = {')
  .replace(/const tg = CONFIG\.triad\[sh\]/g, 'const tg = CONFIG.triad[sh as "circle" | "triangle" | "square"]')
  .replace(/if \(!CONFIG\.triad\[sh\]\.e\) return;/g, 'if (!CONFIG.triad[sh as "circle" | "triangle" | "square"].e) return;')
  .replace(/\[\["circle", cx - sp\], \["triangle", cx\], \["square", cx \+ sp\]\]\.forEach\(\(\[sh, x\], idx\) =>/g, '([["circle", cx - sp], ["triangle", cx], ["square", cx + sp]] as Array<["circle" | "triangle" | "square", number]>).forEach(([sh, x], idx) =>')
  .replace(/const decodedStrokes = CONFIG\.strokes\.map\(\(st\) =>/g, 'const decodedStrokes = CONFIG.strokes.map((st: { p: readonly number[]; c?: number; a?: string; w?: number; s: number }) =>')}

    const prefersReduced =
      respectReducedMotion &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      renderFrame(ctx, 5.8);
      return;
    }

    let rafId = 0;
    let elapsed = 0;
    let last = performance.now();

    const tickLoop = (now: number) => {
      const dt = Math.min(0.12, Math.max(0, (now - last) / 1000));
      last = now;
      elapsed += dt * speed;
      if (elapsed >= DURATION) {
        if (loop) {
          elapsed = 0;
        } else {
          elapsed = DURATION;
          renderFrame(ctx, elapsed);
          return;
        }
      }
      renderFrame(ctx, elapsed);
      rafId = requestAnimationFrame(tickLoop);
    };

    renderFrame(ctx, 0);
    rafId = requestAnimationFrame(tickLoop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [loop, speed, respectReducedMotion]);

  return (
    <div className={className} style={${wrapperStyle}}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label=${JSON.stringify(`${displayTitle} animated title card`)}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
    </div>
  );
}
`;
}

export function generateCodeArtifact(
  config: TitleCardConfig,
  format: ExportCodeFormat,
  sizing: ExportSizingMode,
): ExportedCodeArtifact {
  const code =
    format === 'html'
      ? buildStandaloneHtml(config, sizing)
      : buildReactComponent(config, sizing);

  const byteSize = new TextEncoder().encode(code).length;
  const lineCount = code.split('\n').length;

  return {
    format,
    sizing,
    filename: buildExportFilename(config, format),
    componentName: buildComponentName(config),
    mimeType:
      format === 'html'
        ? 'text/html;charset=utf-8'
        : 'text/typescript;charset=utf-8',
    code,
    lineCount,
    byteSize,
  };
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
