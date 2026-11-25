import { ANIMATION_ACTS, formatTimecode, getActAtTime, getActMidpoint } from '../animation/timeline';
import type { ActId } from '../animation/types';

interface ChoreographyBreakdownProps {
  currentTime: number;
  onJumpToAct: (seconds: number, actId: ActId) => void;
}

export function ChoreographyBreakdown({
  currentTime,
  onJumpToAct,
}: ChoreographyBreakdownProps) {
  const activeAct = getActAtTime(currentTime);

  return (
    <section
      id="breakdown"
      aria-labelledby="heading-choreography"
      className="mt-10 border-t border-[#1D1D25] pt-8"
    >
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2
            id="heading-choreography"
            className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[#F4F3F0]"
          >
            Sequence Choreography
          </h2>
          <p className="mt-1 text-sm text-[#9B9AA7]">
            Select any beat to jump directly to that frame on the cinema stage.
          </p>
        </div>
        <div className="text-xs text-[#8B8A97]">
          <span>1920×1080 Canvas</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>60 fps Trim Paths</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>Space to Play/Pause</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ANIMATION_ACTS.map((act) => {
          const isCurrent = act.id === activeAct.id;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => onJumpToAct(getActMidpoint(act.id), act.id)}
              className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
                isCurrent
                  ? 'border-[#ED1B76]/60 bg-[#171117]'
                  : 'border-[#21212B] bg-[#0E0E13] hover:border-[#343444] hover:bg-[#13131A]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-[family-name:var(--font-mono)] font-medium tabular-nums ${
                      isCurrent ? 'text-[#ED1B76]' : 'text-[#8B8A97]'
                    }`}
                  >
                    {act.index}. {act.label}
                  </span>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-[#A4A3B0]">
                  {act.description}
                </p>
              </div>
              <div className="mt-4 font-[family-name:var(--font-mono)] text-[11px] tabular-nums text-[#777684]">
                {formatTimecode(act.start)} – {formatTimecode(act.end)}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
