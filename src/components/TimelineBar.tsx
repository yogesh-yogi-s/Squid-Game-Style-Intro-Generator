import {
  Maximize2,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ANIMATION_ACTS,
  formatTimecode,
  getActAtTime,
  getActMidpoint,
  TOTAL_DURATION,
} from '../animation/timeline';
import type { ActId } from '../animation/types';

interface TimelineBarProps {
  currentTime: number;
  isPlaying: boolean;
  loop: boolean;
  soundEnabled: boolean;
  onTogglePlay: () => void;
  onReplay: () => void;
  onSeek: (seconds: number) => void;
  onToggleLoop: () => void;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
}

export function TimelineBar({
  currentTime,
  isPlaying,
  loop,
  soundEnabled,
  onTogglePlay,
  onReplay,
  onSeek,
  onToggleLoop,
  onToggleSound,
  onToggleFullscreen,
}: TimelineBarProps) {
  const activeAct = getActAtTime(currentTime);
  const progressPct = Math.min(100, Math.max(0, (currentTime / TOTAL_DURATION) * 100));

  const handleJumpAct = (actId: ActId) => {
    onSeek(getActMidpoint(actId));
  };

  return (
    <div className="rounded-xl border border-[#23232C] bg-[#111116] p-4">
      {/* Top row: Scrubber track + 5 act markers */}
      <div className="mb-3">
        <div className="relative flex items-center py-2">
          {/* Background track */}
          <div className="pointer-events-none h-1.5 w-full overflow-hidden rounded-full bg-[#24242E]">
            <div
              className="h-full bg-[#ED1B76] transition-[width] duration-75"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Interactive range input */}
          <input
            type="range"
            min={0}
            max={TOTAL_DURATION}
            step={0.05}
            value={currentTime}
            onChange={(e) => onSeek(Number.parseFloat(e.target.value))}
            aria-label="Animation timeline scrubber"
            aria-valuetext={`${formatTimecode(currentTime)} of ${formatTimecode(TOTAL_DURATION)}, ${activeAct.label}`}
            className="studio-scrubber absolute inset-0 h-full w-full"
          />
        </div>

        {/* 5-act jump bar */}
        <div className="mt-1 grid grid-cols-5 gap-1 sm:gap-1.5">
          {ANIMATION_ACTS.map((act) => {
            const isCurrent = act.id === activeAct.id;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => handleJumpAct(act.id)}
                className={`flex items-center justify-center gap-1.5 rounded-md px-1 py-1.5 sm:px-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
                  isCurrent
                    ? 'bg-[#20161D] text-[#F4F3F0] ring-1 ring-[#ED1B76]/50'
                    : 'text-[#8B8A97] hover:bg-[#191922] hover:text-[#DFDEE6]'
                }`}
              >
                <span className="hidden sm:inline font-[family-name:var(--font-mono)] text-[11px] tabular-nums opacity-70">
                  {act.index}
                </span>
                <span>{act.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom row: Transport controls & Timecode */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#202028] pt-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F4F3F0] px-4 text-sm font-semibold text-[#0A0A0D] transition-colors duration-150 hover:bg-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76]"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden="true" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReplay}
            aria-label="Replay from start"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#282833] bg-[#16161D] px-3 text-sm font-medium text-[#E4E3EC] transition-colors duration-150 hover:border-[#3A3A4A] hover:bg-[#1D1D27] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Replay</span>
          </button>

          <button
            type="button"
            onClick={onToggleLoop}
            aria-pressed={loop}
            aria-label={loop ? 'Disable loop' : 'Enable loop'}
            className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
              loop
                ? 'border-[#ED1B76]/50 bg-[#24131D] text-[#F9C6DC]'
                : 'border-[#282833] bg-[#16161D] text-[#A1A0AC] hover:text-[#F4F3F0]'
            }`}
          >
            <Repeat className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Loop</span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Mute sound design' : 'Enable sound design'}
            className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
              soundEnabled
                ? 'border-[#ED1B76]/50 bg-[#24131D] text-[#F9C6DC]'
                : 'border-[#282833] bg-[#16161D] text-[#A1A0AC] hover:text-[#F4F3F0]'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </button>
        </div>

        {/* Right: Tabular Timecode + Fullscreen */}
        <div className="flex items-center gap-3">
          <div className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[#B4B3BE]">
            <span className="text-[#F4F3F0]">{formatTimecode(currentTime)}</span>
            <span className="mx-1.5 text-[#5D5C68]" aria-hidden="true">
              /
            </span>
            <span>{formatTimecode(TOTAL_DURATION)}</span>
          </div>

          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label="Toggle fullscreen preview"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#282833] bg-[#16161D] text-[#C8C7D2] transition-colors duration-150 hover:border-[#3A3A4A] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76]"
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
