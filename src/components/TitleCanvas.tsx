import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Play, Pause } from 'lucide-react';
import { renderTitleCardFrame, STAGE_HEIGHT, STAGE_WIDTH } from '../animation/renderer';
import { SquidSoundEngine } from '../animation/soundEngine';
import { layoutTitleCard } from '../animation/squidFont';
import { getActAtTime, TOTAL_DURATION } from '../animation/timeline';
import type { TitleCardConfig } from '../animation/types';

export interface TitleCanvasHandle {
  seekTo: (seconds: number) => void;
  replay: () => void;
  exportPng: () => void;
  exportWebM: (
    onProgress: (ratio: number) => void,
    onDone: (result: { ok: boolean; message: string }) => void,
  ) => void;
  toggleFullscreen: () => void;
}

interface TitleCanvasProps {
  config: TitleCardConfig;
  isPlaying: boolean;
  soundEnabled: boolean;
  onPlayingChange: (playing: boolean) => void;
  onTimeSync: (seconds: number) => void;
}

export const TitleCanvas = forwardRef<TitleCanvasHandle, TitleCanvasProps>(
  function TitleCanvas(
    { config, isPlaying, soundEnabled, onPlayingChange, onTimeSync },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const soundRef = useRef<SquidSoundEngine | null>(null);
    const timeRef = useRef<number>(0);
    const isPlayingRef = useRef<boolean>(isPlaying);
    const configRef = useRef<TitleCardConfig>(config);
    const onTimeSyncRef = useRef(onTimeSync);
    const onPlayingChangeRef = useRef(onPlayingChange);
    const recordingRef = useRef<boolean>(false);

    const layout = useMemo(
      () => layoutTitleCard(config.line1, config.line2, STAGE_WIDTH, STAGE_HEIGHT),
      [config.line1, config.line2],
    );
    const layoutRef = useRef(layout);

    useEffect(() => {
      configRef.current = config;
      layoutRef.current = layout;
      // Immediately repaint current frame when paused and config changes
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderTitleCardFrame(ctx, timeRef.current, layout, config);
        }
      }
    }, [config, layout]);

    useEffect(() => {
      isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    useEffect(() => {
      onTimeSyncRef.current = onTimeSync;
      onPlayingChangeRef.current = onPlayingChange;
    }, [onTimeSync, onPlayingChange]);

    useEffect(() => {
      if (!soundRef.current) {
        soundRef.current = new SquidSoundEngine();
      }
      soundRef.current.setEnabled(soundEnabled);
      if (soundEnabled) {
        soundRef.current.resetCues(timeRef.current);
      }
    }, [soundEnabled]);

    useImperativeHandle(ref, () => ({
      seekTo(seconds: number) {
        const clamped = Math.max(0, Math.min(TOTAL_DURATION, seconds));
        timeRef.current = clamped;
        soundRef.current?.resetCues(clamped);
        onTimeSyncRef.current(clamped);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            renderTitleCardFrame(ctx, clamped, layoutRef.current, configRef.current);
          }
        }
      },
      replay() {
        timeRef.current = 0;
        soundRef.current?.resetCues(0);
        onTimeSyncRef.current(0);
        onPlayingChangeRef.current(true);
      },
      exportPng() {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = STAGE_WIDTH;
        exportCanvas.height = STAGE_HEIGHT;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;
        renderTitleCardFrame(ctx, timeRef.current, layoutRef.current, configRef.current);
        const url = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        const slug = `${configRef.current.line1 || 'squid'}-${configRef.current.line2 || 'game'}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-');
        link.download = `${slug}-title-card.png`;
        link.href = url;
        link.click();
      },
      exportWebM(onProgress, onDone) {
        const canvas = canvasRef.current;
        if (!canvas || typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
          onDone({
            ok: false,
            message: 'Video recording is not supported in this browser. Try Save PNG Frame instead.',
          });
          return;
        }
        if (recordingRef.current) return;
        recordingRef.current = true;

        const mimeCandidates = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
        ];
        const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';

        try {
          const stream = canvas.captureStream(60);
          const recorder = mimeType
            ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 })
            : new MediaRecorder(stream);

          const chunks: BlobPart[] = [];
          recorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) chunks.push(ev.data);
          };

          recorder.onstop = () => {
            recordingRef.current = false;
            stream.getTracks().forEach((t) => t.stop());
            const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const slug = `${configRef.current.line1 || 'squid'}-${configRef.current.line2 || 'game'}`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-');
            a.href = url;
            a.download = `${slug}-title-card.webm`;
            a.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 4000);
            onProgress(1);
            onDone({ ok: true, message: 'WebM title card downloaded.' });
          };

          recorder.onerror = () => {
            recordingRef.current = false;
            stream.getTracks().forEach((t) => t.stop());
            onDone({ ok: false, message: 'Video recording failed. Try Save PNG Frame instead.' });
          };

          const wasPlaying = isPlayingRef.current;
          isPlayingRef.current = false;
          onPlayingChangeRef.current(false);

          const ctx = canvas.getContext('2d');
          const durationMs = (TOTAL_DURATION / configRef.current.speed) * 1000;
          const startPerf = performance.now();

          recorder.start(120);

          const stepRecord = (now: number) => {
            if (!recordingRef.current) return;
            const elapsedSec = ((now - startPerf) / 1000) * configRef.current.speed;
            const clamped = Math.min(TOTAL_DURATION, elapsedSec);
            timeRef.current = clamped;
            if (ctx) {
              renderTitleCardFrame(ctx, clamped, layoutRef.current, configRef.current);
            }
            onTimeSyncRef.current(clamped);
            onProgress(clamped / TOTAL_DURATION);

            if (now - startPerf < durationMs) {
              requestAnimationFrame(stepRecord);
            } else {
              recorder.stop();
              if (wasPlaying) {
                isPlayingRef.current = true;
                onPlayingChangeRef.current(true);
              }
            }
          };

          requestAnimationFrame(stepRecord);
        } catch {
          recordingRef.current = false;
          onDone({
            ok: false,
            message: 'Unable to start video capture in this browser context.',
          });
        }
      },
      toggleFullscreen() {
        const el = containerRef.current;
        if (!el) return;
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        } else if (el.requestFullscreen) {
          void el.requestFullscreen();
        }
      },
    }));

    // Mount single animation loop once
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Support ?t=<seconds> for direct frame inspection
      const params = new URLSearchParams(window.location.search);
      const initialT = Number.parseFloat(params.get('t') ?? '');
      if (!Number.isNaN(initialT) && initialT >= 0) {
        timeRef.current = Math.min(TOTAL_DURATION, initialT);
        isPlayingRef.current = false;
        onPlayingChangeRef.current(false);
        onTimeSyncRef.current(timeRef.current);
      }

      renderTitleCardFrame(ctx, timeRef.current, layoutRef.current, configRef.current);

      let rafId = 0;
      let lastPerf = performance.now();
      let lastSyncPerf = lastPerf;

      const loop = (now: number) => {
        const dt = Math.min(0.12, Math.max(0, (now - lastPerf) / 1000));
        lastPerf = now;

        if (isPlayingRef.current && !recordingRef.current) {
          let nextT = timeRef.current + dt * configRef.current.speed;
          if (nextT >= TOTAL_DURATION) {
            if (configRef.current.loop) {
              nextT = 0;
              soundRef.current?.resetCues(0);
            } else {
              nextT = TOTAL_DURATION;
              isPlayingRef.current = false;
              onPlayingChangeRef.current(false);
            }
          }
          timeRef.current = nextT;
          soundRef.current?.tick(nextT, true);
          renderTitleCardFrame(ctx, nextT, layoutRef.current, configRef.current);

          const act = getActAtTime(nextT);
          canvas.dataset.act = act.id;
          canvas.dataset.time = nextT.toFixed(2);

          if (now - lastSyncPerf >= 80) {
            lastSyncPerf = now;
            onTimeSyncRef.current(nextT);
          }
        }

        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(rafId);
        soundRef.current?.dispose();
        soundRef.current = null;
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className="group relative aspect-video w-full overflow-hidden rounded-xl border border-[#23232C] bg-[#060608] shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
      >
        <canvas
          ref={canvasRef}
          data-testid="title-card-canvas"
          data-playing={isPlaying ? 'true' : 'false'}
          data-act={getActAtTime(timeRef.current).id}
          data-time={timeRef.current.toFixed(2)}
          aria-label={`Animated Squid Game style title card displaying ${config.line1 || 'SQUID'} ${config.line2}`}
          role="img"
          className="block h-full w-full object-contain"
        />

        {/* Unobtrusive click-to-play/pause surface toggle with corner hover affordance */}
        <button
          type="button"
          onClick={() => onPlayingChange(!isPlaying)}
          aria-label={isPlaying ? 'Pause animation on stage' : 'Play animation on stage'}
          className="absolute inset-0 flex items-end justify-end p-4 bg-transparent focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#ED1B76]"
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-black/70 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 translate-x-0.5" aria-hidden="true" />
            )}
          </span>
        </button>
      </div>
    );
  },
);
