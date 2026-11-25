import { Film, Loader2 } from 'lucide-react';

interface TopBarProps {
  isExporting: boolean;
  exportProgress: number;
  onExportVideo: () => void;
}

export function TopBar({ isExporting, exportProgress, onExportVideo }: TopBarProps) {
  return (
    <header className="w-full border-b border-[#22222A] bg-[#070709]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element brand wordmark */}
        <a
          href="#stage"
          className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[#F4F3F0] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ED1B76]"
        >
          Squid Title Studio
        </a>

        {/* Zone 2: Clean single-line text nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#A4A3AE]"
        >
          <a
            href="#stage"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#F4F3F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ED1B76]"
          >
            Stage
          </a>
          <a
            href="#presets"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#F4F3F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ED1B76]"
          >
            Presets
          </a>
          <a
            href="#breakdown"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#F4F3F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ED1B76]"
          >
            Breakdown
          </a>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onExportVideo}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#ED1B76] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#D8166A] disabled:cursor-not-allowed disabled:opacity-70 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4F3F0]"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="tabular-nums">Recording {Math.round(exportProgress * 100)}%</span>
              </>
            ) : (
              <>
                <Film className="h-4 w-4" aria-hidden="true" />
                <span>Export Video</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
