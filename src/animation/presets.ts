import type { AccentTheme, AccentThemeId, TextureMode, TitleCardConfig, TitlePreset } from './types';

export const ACCENT_THEMES: Record<AccentThemeId, AccentTheme> = {
  'guard-pink': {
    id: 'guard-pink',
    name: 'Guard Pink',
    primary: '#ED1B76',
    glow: 'rgba(237, 27, 118, 0.55)',
    secondary: '#FF4F9A',
    tint: '#3D0A22',
  },
  'tracksuit-teal': {
    id: 'tracksuit-teal',
    name: 'Tracksuit Teal',
    primary: '#12A895',
    glow: 'rgba(18, 168, 149, 0.5)',
    secondary: '#3CD8C3',
    tint: '#082E29',
  },
  'vip-gold': {
    id: 'vip-gold',
    name: 'VIP Gold',
    primary: '#D9A73E',
    glow: 'rgba(217, 167, 62, 0.5)',
    secondary: '#F3CB6E',
    tint: '#33250B',
  },
  crimson: {
    id: 'crimson',
    name: 'Elimination Red',
    primary: '#E11D48',
    glow: 'rgba(225, 29, 72, 0.55)',
    secondary: '#FB4B70',
    tint: '#380915',
  },
};

export const TEXTURE_MODES: Array<{
  id: TextureMode;
  label: string;
  description: string;
}> = [
  {
    id: 'chalk-grunge',
    label: 'Chalk Grunge',
    description: 'Organic pavement chalk roughness, subtle 35mm film grain, crisp impact split.',
  },
  {
    id: 'clean-vector',
    label: 'Clean Vector',
    description: 'Razor-sharp broadcast geometry with minimal grain and precision trim paths.',
  },
  {
    id: 'vhs-glitch',
    label: 'VHS Glitch',
    description: 'Heavy chromatic aberration, horizontal signal tears, and analog scanlines.',
  },
];

export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5] as const;

export const DEFAULT_CONFIG: TitleCardConfig = {
  line1: 'SQUID',
  line2: 'GAME',
  subtitle: '오징어 게임',
  showSubtitle: true,
  showCourtGuide: true,
  accentTheme: 'guard-pink',
  textureMode: 'chalk-grunge',
  speed: 1,
  loop: true,
};

export const TITLE_PRESETS: TitlePreset[] = [
  {
    id: 'squid-game',
    label: 'Squid Game',
    line1: 'SQUID',
    line2: 'GAME',
    subtitle: '오징어 게임',
    accentTheme: 'guard-pink',
    textureMode: 'chalk-grunge',
  },
  {
    id: 'player-456',
    label: 'Player 456',
    line1: 'PLAYER',
    line2: '456',
    subtitle: '제 456번 참가자',
    accentTheme: 'tracksuit-teal',
    textureMode: 'chalk-grunge',
  },
  {
    id: 'red-light',
    label: 'Red Light',
    line1: 'RED LIGHT',
    line2: 'GREEN LIGHT',
    subtitle: '무궁화 꽃이 피었습니다',
    accentTheme: 'guard-pink',
    textureMode: 'vhs-glitch',
  },
  {
    id: 'front-man',
    label: 'Front Man',
    line1: 'FRONT',
    line2: 'MAN',
    subtitle: 'THE HOST · ROUND SIX',
    accentTheme: 'vip-gold',
    textureMode: 'clean-vector',
  },
  {
    id: 'final-round',
    label: 'Final Round',
    line1: 'FINAL',
    line2: 'ROUND',
    subtitle: '오징어 게임 · EPISODE 09',
    accentTheme: 'crimson',
    textureMode: 'chalk-grunge',
  },
];
