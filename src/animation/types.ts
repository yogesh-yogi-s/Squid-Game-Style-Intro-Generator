export type AccentThemeId = 'guard-pink' | 'tracksuit-teal' | 'vip-gold' | 'crimson';

export type TextureMode = 'chalk-grunge' | 'clean-vector' | 'vhs-glitch';

export type TriadShapeType = 'circle' | 'triangle' | 'square';

export type ActId = 'trace' | 'morph' | 'letters' | 'reveal' | 'hold';

export interface AccentTheme {
  id: AccentThemeId;
  name: string;
  primary: string;
  glow: string;
  secondary: string;
  tint: string;
}

export interface TitleCardConfig {
  line1: string;
  line2: string;
  subtitle: string;
  showSubtitle: boolean;
  showCourtGuide: boolean;
  accentTheme: AccentThemeId;
  textureMode: TextureMode;
  speed: number;
  loop: boolean;
}

export interface TitlePreset {
  id: string;
  label: string;
  line1: string;
  line2: string;
  subtitle: string;
  accentTheme: AccentThemeId;
  textureMode: TextureMode;
}

export interface ActDefinition {
  id: ActId;
  index: string;
  label: string;
  shortLabel: string;
  start: number;
  end: number;
  description: string;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface VectorStroke {
  points: Point2D[];
  closed?: boolean;
  accentRole?: TriadShapeType;
  /** Optional thicker or thinner relative stroke multiplier */
  weight?: number;
}

export interface GlyphDefinition {
  char: string;
  /** Normalized width ratio relative to unit height (typically 0.72 - 0.92) */
  width: number;
  strokes: VectorStroke[];
  /** Natural triad slot this glyph can host */
  preferredTriad?: TriadShapeType;
}

export interface PlacedStroke {
  points: Point2D[];
  closed?: boolean;
  accentRole?: TriadShapeType;
  weight: number;
  glyphIndex: number;
  lineIndex: 0 | 1;
  strokeIndex: number;
  /** Delay order 0..1 within the letter assembly act */
  staggerOrder: number;
}

export interface TriadTargetSlot {
  shape: TriadShapeType;
  centerX: number;
  centerY: number;
  radius: number;
  /** True when the triad shape is directly embedded inside a letterform */
  embeddedInGlyph: boolean;
  glyphIndex: number | null;
}

export interface TitleCardLayout {
  width: number;
  height: number;
  strokeWidth: number;
  line1Text: string;
  line2Text: string;
  strokes: PlacedStroke[];
  triadTargets: Record<TriadShapeType, TriadTargetSlot>;
  subtitleY: number;
  subtitleFontSize: number;
  titleBounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    centerX: number;
    centerY: number;
  };
}
