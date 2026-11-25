import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_CONFIG, TITLE_PRESETS } from './animation/presets';
import type { TitleCardConfig, TitlePreset } from './animation/types';
import { ChoreographyBreakdown } from './components/ChoreographyBreakdown';
import { ExportCodeModal } from './components/ExportCodeModal';
import { StudioInspector } from './components/StudioInspector';
import { TimelineBar } from './components/TimelineBar';
import { TitleCanvas, type TitleCanvasHandle } from './components/TitleCanvas';
import { TopBar } from './components/TopBar';

export default function App() {
  const canvasRef = useRef<TitleCanvasHandle | null>(null);

  const [config, setConfig] = useState<TitleCardConfig>(DEFAULT_CONFIG);
  const [activePresetId, setActivePresetId] = useState<string | null>(TITLE_PRESETS[0].id);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [codeModalOpen, setCodeModalOpen] = useState<boolean>(false);

  const handleChangeConfig = useCallback(
    (patch: Partial<TitleCardConfig>, replayAfter = false) => {
      setConfig((prev) => ({ ...prev, ...patch }));
      if ('line1' in patch || 'line2' in patch || 'subtitle' in patch) {
        setActivePresetId(null);
      }
      if (replayAfter) {
        canvasRef.current?.replay();
      }
    },
    [],
  );

  const handleSelectPreset = useCallback((preset: TitlePreset) => {
    setActivePresetId(preset.id);
    setConfig((prev) => ({
      ...prev,
      line1: preset.line1,
      line2: preset.line2,
      subtitle: preset.subtitle,
      showSubtitle: true,
      accentTheme: preset.accentTheme,
      textureMode: preset.textureMode,
    }));
    canvasRef.current?.replay();
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleReplay = useCallback(() => {
    canvasRef.current?.replay();
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    canvasRef.current?.seekTo(seconds);
  }, []);

  const handleExportPng = useCallback(() => {
    canvasRef.current?.exportPng();
    setExportMessage('Saved 1920×1080 PNG frame.');
  }, []);

  const handleExportVideo = useCallback(() => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportMessage('Recording full 7.5s title card sequence…');
    canvasRef.current?.exportWebM(
      (ratio) => setExportProgress(ratio),
      (result) => {
        setIsExporting(false);
        setExportMessage(result.message);
      },
    );
  }, [isExporting]);

  const handleToggleFullscreen = useCallback(() => {
    canvasRef.current?.toggleFullscreen();
  }, []);

  const handleJumpToAct = useCallback((seconds: number) => {
    canvasRef.current?.seekTo(seconds);
    setIsPlaying(false);
    document.getElementById('stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Keyboard shortcuts (Space: Play/Pause, R: Replay, M: Sound, F: Fullscreen)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (codeModalOpen) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        canvasRef.current?.replay();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setSoundEnabled((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        canvasRef.current?.toggleFullscreen();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [codeModalOpen]);

  return (
    <div className="min-h-screen bg-[#070709] text-[#F4F3F0]">
      <TopBar
        isExporting={isExporting}
        exportProgress={exportProgress}
        onExportVideo={handleExportVideo}
      />

      <main
        id="stage"
        className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-5"
      >
        {/* Studio Header Row */}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#F4F3F0] sm:text-3xl text-balance">
              Geometric Title Card Sequence
            </h1>
            <p className="mt-1 text-sm text-[#A1A0AD]">
              Chalk-drawn triad morph, trim-path vector typography, and pink ignition reveal.
            </p>
          </div>

          <div className="text-xs text-[#8D8C9A]">
            <span>{config.line1.trim() || 'SQUID'} {config.line2.trim()}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>1920×1080</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>7.5s Sequence</span>
          </div>
        </div>

        {/* Main 2-column Studio Workspace: 16:9 Stage + Timeline on left, Inspector on right */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-4">
            <TitleCanvas
              ref={canvasRef}
              config={config}
              isPlaying={isPlaying}
              soundEnabled={soundEnabled}
              onPlayingChange={setIsPlaying}
              onTimeSync={setCurrentTime}
            />

            <TimelineBar
              currentTime={currentTime}
              isPlaying={isPlaying}
              loop={config.loop}
              soundEnabled={soundEnabled}
              onTogglePlay={handleTogglePlay}
              onReplay={handleReplay}
              onSeek={handleSeek}
              onToggleLoop={() => handleChangeConfig({ loop: !config.loop })}
              onToggleSound={() => setSoundEnabled((prev) => !prev)}
              onToggleFullscreen={handleToggleFullscreen}
            />
          </div>

          <StudioInspector
            config={config}
            activePresetId={activePresetId}
            isExporting={isExporting}
            exportProgress={exportProgress}
            exportMessage={exportMessage}
            onChangeConfig={handleChangeConfig}
            onSelectPreset={handleSelectPreset}
            onExportPng={handleExportPng}
            onExportVideo={handleExportVideo}
            onOpenCodeModal={() => setCodeModalOpen(true)}
          />
        </div>

        {/* Below-the-fold interactive Choreography Breakdown */}
        <ChoreographyBreakdown
          currentTime={currentTime}
          onJumpToAct={handleJumpToAct}
        />
      </main>

      <ExportCodeModal
        open={codeModalOpen}
        config={config}
        onClose={() => setCodeModalOpen(false)}
      />
    </div>
  );
}
