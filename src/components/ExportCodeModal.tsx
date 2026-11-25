import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Code2, Copy, Download, Eye, RotateCcw, X } from 'lucide-react';
import {
  buildStandaloneHtml,
  formatByteSize,
  generateCodeArtifact,
  type ExportCodeFormat,
  type ExportSizingMode,
} from '../animation/codeExporter';
import type { TitleCardConfig } from '../animation/types';

interface ExportCodeModalProps {
  open: boolean;
  config: TitleCardConfig;
  onClose: () => void;
}

type ModalViewMode = 'code' | 'preview';

export function ExportCodeModal({ open, config, onClose }: ExportCodeModalProps) {
  const [format, setFormat] = useState<ExportCodeFormat>('html');
  const [sizing, setSizing] = useState<ExportSizingMode>('responsive');
  const [viewMode, setViewMode] = useState<ModalViewMode>('code');
  const [previewNonce, setPreviewNonce] = useState<number>(0);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const artifact = useMemo(
    () => generateCodeArtifact(config, format, sizing),
    [config, format, sizing],
  );

  // Always drive the sandboxed live preview from the real generated standalone HTML
  const previewHtml = useMemo(
    () => buildStandaloneHtml(config, 'responsive'),
    [config],
  );

  // Escape-to-close & initial focus
  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Reset transient copy feedback when format/sizing/open changes
  useEffect(() => {
    setCopyStatus('idle');
  }, [format, sizing, open]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(artifact.code);
      } else {
        const ta = document.createElement('textarea');
        ta.value = artifact.code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.code], { type: artifact.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = artifact.filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-code-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[#282834] bg-[#111116] text-[#F4F3F0] shadow-[0_32px_90px_rgba(0,0,0,0.8)]"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#22222C] px-5 py-4">
          <div className="min-w-0">
            <h2
              id="export-code-title"
              className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[#F4F3F0]"
            >
              Export Website Code
            </h2>
            <p className="mt-0.5 text-xs text-[#9C9BA8]">
              Clean, silent, zero-dependency animation baked with your exact title and style.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close export code modal"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2B2B36] bg-[#17171F] text-[#C8C7D2] transition-colors hover:border-[#3E3E4E] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Options Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#202029] bg-[#0D0D12] px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Format segmented switcher */}
            <div
              role="group"
              aria-label="Export code format"
              className="inline-flex rounded-lg border border-[#24242F] bg-[#08080C] p-1"
            >
              <button
                type="button"
                onClick={() => setFormat('html')}
                aria-pressed={format === 'html'}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
                  format === 'html'
                    ? 'bg-[#22222E] text-white'
                    : 'text-[#9695A4] hover:text-[#E5E4EC]'
                }`}
              >
                Standalone HTML
              </button>
              <button
                type="button"
                onClick={() => setFormat('react')}
                aria-pressed={format === 'react'}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
                  format === 'react'
                    ? 'bg-[#22222E] text-white'
                    : 'text-[#9695A4] hover:text-[#E5E4EC]'
                }`}
              >
                React Component
              </button>
            </div>

            {/* Container sizing segmented switcher */}
            <div
              role="group"
              aria-label="Export container sizing"
              className="inline-flex rounded-lg border border-[#24242F] bg-[#08080C] p-1"
            >
              <button
                type="button"
                onClick={() => setSizing('responsive')}
                aria-pressed={sizing === 'responsive'}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
                  sizing === 'responsive'
                    ? 'bg-[#22222E] text-white'
                    : 'text-[#9695A4] hover:text-[#E5E4EC]'
                }`}
              >
                Responsive 16:9
              </button>
              <button
                type="button"
                onClick={() => setSizing('fullscreen')}
                aria-pressed={sizing === 'fullscreen'}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
                  sizing === 'fullscreen'
                    ? 'bg-[#22222E] text-white'
                    : 'text-[#9695A4] hover:text-[#E5E4EC]'
                }`}
              >
                Full Viewport
              </button>
            </div>
          </div>

          {/* Code vs Live Sandbox Preview switcher */}
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Inspector view mode"
              className="inline-flex rounded-lg border border-[#24242F] bg-[#08080C] p-1"
            >
              <button
                type="button"
                onClick={() => setViewMode('code')}
                aria-pressed={viewMode === 'code'}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
                  viewMode === 'code'
                    ? 'bg-[#22222E] text-white'
                    : 'text-[#9695A4] hover:text-[#E5E4EC]'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('preview');
                  setPreviewNonce((n) => n + 1);
                }}
                aria-pressed={viewMode === 'preview'}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76] ${
                  viewMode === 'preview'
                    ? 'bg-[#22222E] text-white'
                    : 'text-[#9695A4] hover:text-[#E5E4EC]'
                }`}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Live Preview</span>
              </button>
            </div>

            {viewMode === 'preview' && (
              <button
                type="button"
                onClick={() => setPreviewNonce((n) => n + 1)}
                aria-label="Replay exported preview"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#2B2B36] bg-[#16161E] px-2.5 text-xs font-medium text-[#DFDEE6] transition-colors hover:border-[#3E3E50] hover:text-white whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Replay</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Viewport: Code Viewer or Live Sandboxed Preview */}
        <div className="min-h-0 flex-1 overflow-auto bg-[#08080B] p-4 sm:p-5">
          {viewMode === 'code' ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[#9C9BA8]">
                {format === 'html'
                  ? 'Drop this file directly onto your server or embed it with an <iframe>. No build step or libraries required.'
                  : `Import <${artifact.componentName} /> into any React or Next.js page. Accepts optional className, loop, and speed props.`}
              </p>
              <pre
                data-testid="exported-code-block"
                className="max-h-[46vh] overflow-auto rounded-lg border border-[#202029] bg-[#0B0B10] p-4 font-[family-name:var(--font-mono)] text-xs leading-relaxed text-[#DFDEE8] select-all"
              >
                <code>{artifact.code}</code>
              </pre>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="aspect-video w-full overflow-hidden rounded-lg border border-[#24242F] bg-[#060608]">
                <iframe
                  key={previewNonce}
                  data-testid="export-live-preview-frame"
                  title="Live sandbox preview of exported title card code"
                  sandbox="allow-scripts"
                  srcDoc={previewHtml}
                  className="block h-full w-full border-0"
                />
              </div>
              <p className="text-xs text-[#9C9BA8]">
                Running the exact generated standalone HTML in an isolated sandbox — zero studio controls, zero external scripts.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer: Unboxed metadata + Copy / Download actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22222C] bg-[#111116] px-5 py-3.5">
          <div className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[#9B9AA8]">
            <span className="text-[#E4E3EC]">{artifact.filename}</span>
            <span className="mx-2 text-[#5B5A66]" aria-hidden="true">·</span>
            <span>{artifact.lineCount} lines</span>
            <span className="mx-2 text-[#5B5A66]" aria-hidden="true">·</span>
            <span>{formatByteSize(artifact.byteSize)}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {copyStatus === 'error' && (
              <span role="status" className="text-xs text-[#F59E0B]">
                Clipboard unavailable — use Download File.
              </span>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#2D2D3A] bg-[#171720] px-4 text-xs font-medium text-[#F4F3F0] transition-colors hover:border-[#424255] hover:bg-[#1F1F2B] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED1B76]"
            >
              {copyStatus === 'copied' ? (
                <>
                  <Check className="h-4 w-4 text-[#12A895]" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#ED1B76] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#D8166A] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4F3F0]"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
