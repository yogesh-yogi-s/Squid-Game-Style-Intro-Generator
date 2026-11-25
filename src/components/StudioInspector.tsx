import { Code2, Download, Film, Loader2 } from 'lucide-react';
import {
  ACCENT_THEMES,
  PLAYBACK_SPEEDS,
  TEXTURE_MODES,
  TITLE_PRESETS,
} from '../animation/presets';
import type {
  AccentThemeId,
  TextureMode,
  TitleCardConfig,
  TitlePreset,
} from '../animation/types';

interface StudioInspectorProps {
  config: TitleCardConfig;
  activePresetId: string | null;
  isExporting: boolean;
  exportProgress: number;
  exportMessage: string | null;
  onChangeConfig: (patch: Partial<TitleCardConfig>, replayAfter?: boolean) => void;
  onSelectPreset: (preset: TitlePreset) => void;
  onExportPng: () => void;
  onExportVideo: () => void;
  onOpenCodeModal: () => void;
}

const ACCENT_LIST: AccentThemeId[] = [
  'guard-pink',
  'tracksuit-teal',
  'vip-gold',
  'crimson',
];

export function StudioInspector({
  config,
  activePresetId,
  isExporting,
  exportProgress,
  exportMessage,
  onChangeConfig,
  onSelectPreset,
  onExportPng,
  onExportVideo,
  onOpenCodeModal,
}: StudioInspectorProps) {
  return (
    <aside
      aria-label="Title card controls"
      className="flex flex-col gap-3.5 rounded-xl border border-[#23232C] bg-[#111116] p-4"
    >
      {/* Section 1: Title Typography Inputs */}
      <section aria-labelledby="heading-title-copy">
        <div className="mb-2 flex items-baseline justify-between">
          <h2
            id="heading-title-copy"
            className="font-[family-name:var(--font-display)] text-sm font-semibold text-[#F4F3F0]"
          >
            Title Typography
          </h2>
          <span className="text-xs text-[#888794]">A–Z · 0–9 · Max 14</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="input-line1"
              className="mb-1 block text-xs font-medium text-[#B3B2BE]"
            >
              First Line
            </label>
            <input
              id="input-line1"
              type="text"
              maxLength={14}
              value={config.line1}
              onChange={(e) => onChangeConfig({ line1: e.target.value })}
              placeholder="SQUID"
              className="w-full rounded-lg border border-[#2B2B36] bg-[#0A0A0E] px-3 py-1.5 text-sm font-medium tracking-wide text-[#F4F3F0] placeholder-[#585764] transition-colors focus:border-[#ED1B76] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="input-line2"
              className="mb-1 block text-xs font-medium text-[#B3B2BE]"
            >
              Second Line
            </label>
            <input
              id="input-line2"
              type="text"
              maxLength={14}
              value={config.line2}
              onChange={(e) => onChangeConfig({ line2: e.target.value })}
              placeholder="GAME"
              className="w-full rounded-lg border border-[#2B2B36] bg-[#0A0A0E] px-3 py-1.5 text-sm font-medium tracking-wide text-[#F4F3F0] placeholder-[#585764] transition-colors focus:border-[#ED1B76] focus:outline-none"
            />
          </div>

          <div className="col-span-2">
            <label
              htmlFor="input-subtitle"
              className="mb-1 block text-xs font-medium text-[#B3B2BE]"
            >
              Subtitle Caption
            </label>
            <input
              id="input-subtitle"
              type="text"
              maxLength={32}
              value={config.subtitle}
              onChange={(e) => onChangeConfig({ subtitle: e.target.value })}
              placeholder="오징어 게임"
              className="w-full rounded-lg border border-[#2B2B36] bg-[#0A0A0E] px-3 py-1.5 text-sm text-[#F4F3F0] placeholder-[#585764] transition-colors focus:border-[#ED1B76] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#C8C7D2]">
            <input
              type="checkbox"
              checked={config.showSubtitle}
              onChange={(e) => onChangeConfig({ showSubtitle: e.target.checked })}
              className="h-4 w-4 rounded border-[#3A3A48] bg-[#0A0A0E] accent-[#ED1B76]"
            />
            <span>Show subtitle</span>
          </label>

          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#C8C7D2]">
            <input
              type="checkbox"
              checked={config.showCourtGuide}
              onChange={(e) => onChangeConfig({ showCourtGuide: e.target.checked })}
              className="h-4 w-4 rounded border-[#3A3A48] bg-[#0A0A0E] accent-[#ED1B76]"
            />
            <span>Show court guides</span>
          </label>
        </div>
      </section>

      <div className="h-px bg-[#202028]" aria-hidden="true" />

      {/* Section 2: Quick Presets */}
      <section id="presets" aria-labelledby="heading-presets">
        <h2
          id="heading-presets"
          className="mb-2 font-[family-name:var(--font-display)] text-sm font-semibold text-[#F4F3F0]"
        >
          Title Presets
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {TITLE_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
                  isSelected
                    ? 'border-[#ED1B76] bg-[#24131D] text-white'
                    : 'border-[#282834] bg-[#16161D] text-[#BDBCC8] hover:border-[#3E3E50] hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="h-px bg-[#202028]" aria-hidden="true" />

      {/* Section 3: Accent Color & Finish */}
      <section aria-labelledby="heading-visual-style" className="space-y-3">
        <h2
          id="heading-visual-style"
          className="font-[family-name:var(--font-display)] text-sm font-semibold text-[#F4F3F0]"
        >
          Visual Style
        </h2>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-[#B3B2BE]">
            Accent Palette
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {ACCENT_LIST.map((themeId) => {
              const theme = ACCENT_THEMES[themeId];
              const isSelected = config.accentTheme === themeId;
              return (
                <button
                  key={themeId}
                  type="button"
                  onClick={() => onChangeConfig({ accentTheme: themeId })}
                  aria-pressed={isSelected}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
                    isSelected
                      ? 'border-[#F4F3F0]/60 bg-[#1B1B24] text-white'
                      : 'border-[#272732] bg-[#14141B] text-[#B3B2BE] hover:border-[#3B3B4B] hover:text-white'
                  }`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: theme.primary }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-[#B3B2BE]">
            Surface Texture
          </span>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#0A0A0E] p-1 border border-[#23232C]">
            {TEXTURE_MODES.map((mode) => {
              const isSelected = config.textureMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onChangeConfig({ textureMode: mode.id as TextureMode })}
                  aria-pressed={isSelected}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
                    isSelected
                      ? 'bg-[#22222E] text-white'
                      : 'text-[#9695A4] hover:text-[#E5E4EC]'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-[#B3B2BE]">
            Playback Speed
          </span>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-[#0A0A0E] p-1 border border-[#23232C]">
            {PLAYBACK_SPEEDS.map((spd) => {
              const isSelected = config.speed === spd;
              return (
                <button
                  key={spd}
                  type="button"
                  onClick={() => onChangeConfig({ speed: spd })}
                  aria-pressed={isSelected}
                  className={`rounded-md py-1 font-[family-name:var(--font-mono)] text-xs font-medium tabular-nums transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
                    isSelected
                      ? 'bg-[#22222E] text-white'
                      : 'text-[#9695A4] hover:text-[#E5E4EC]'
                  }`}
                >
                  {spd}x
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-px bg-[#202028]" aria-hidden="true" />

      {/* Section 4: Export Actions */}
      <section aria-labelledby="heading-export" className="space-y-2">
        <h2
          id="heading-export"
          className="font-[family-name:var(--font-display)] text-sm font-semibold text-[#F4F3F0]"
        >
          Export Render
        </h2>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={onExportPng}
            aria-label="Save PNG"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#2D2D39] bg-[#16161E] px-2 text-xs font-medium text-[#EAE9F0] transition-colors duration-150 hover:border-[#424255] hover:bg-[#1E1E28] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76]"
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>PNG</span>
          </button>

          <button
            type="button"
            onClick={onExportVideo}
            disabled={isExporting}
            aria-label="Record WebM"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#2D2D39] bg-[#16161E] px-2 text-xs font-medium text-[#EAE9F0] transition-colors duration-150 hover:border-[#424255] hover:bg-[#1E1E28] disabled:cursor-not-allowed disabled:opacity-70 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76]"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                <span className="tabular-nums">{Math.round(exportProgress * 100)}%</span>
              </>
            ) : (
              <>
                <Film className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>WebM</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCodeModal}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#ED1B76] px-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#D8166A] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4F3F0]"
          >
            <Code2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Get Code</span>
          </button>
        </div>

        {exportMessage && (
          <p role="status" className="text-xs text-[#C8C7D2]">
            {exportMessage}
          </p>
        )}
      </section>
    </aside>
  );
}
