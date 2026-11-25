import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildComponentName,
  buildExportFilename,
  buildReactComponent,
  buildStandaloneHtml,
  formatByteSize,
  generateCodeArtifact,
} from './codeExporter';
import { DEFAULT_CONFIG } from './presets';

test('buildExportFilename creates clean html and tsx filenames', () => {
  assert.equal(buildExportFilename(DEFAULT_CONFIG, 'html'), 'squid-game-title-card.html');
  assert.equal(buildExportFilename(DEFAULT_CONFIG, 'react'), 'SquidGameTitleCard.tsx');

  const numericConfig = { ...DEFAULT_CONFIG, line1: '456', line2: '' };
  assert.equal(buildComponentName(numericConfig), 'TitleCard456');
  assert.equal(buildExportFilename(numericConfig, 'react'), 'TitleCard456.tsx');
  assert.equal(buildExportFilename(numericConfig, 'html'), '456-title-card.html');
});

test('buildStandaloneHtml produces self-contained silent HTML and escapes unsafe script strings', () => {
  const unsafeConfig = {
    ...DEFAULT_CONFIG,
    line1: 'PLAYER',
    line2: '456',
    subtitle: '</script><img src=x onerror=alert(1)>',
    accentTheme: 'tracksuit-teal' as const,
  };
  const html = buildStandaloneHtml(unsafeConfig, 'responsive');

  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('aspect-ratio: 16 / 9;'));
  assert.ok(html.includes('#12A895'));
  // Ensure user subtitle cannot break out of <script>
  assert.equal(html.includes('</script><img'), false);
  assert.ok(html.includes('\\u003c/script\\u003e'));
  // Clean silent animation only: no AudioContext or UI buttons inside exported HTML
  assert.equal(html.includes('AudioContext'), false);
  assert.equal(html.includes('<button'), false);
});

test('buildStandaloneHtml respects fullscreen sizing mode', () => {
  const html = buildStandaloneHtml(DEFAULT_CONFIG, 'fullscreen');
  assert.ok(html.includes('width: 100vw;'));
  assert.ok(html.includes('height: 100vh;'));
});

test('buildReactComponent produces clean zero-dependency TypeScript component', () => {
  const tsx = buildReactComponent(
    { ...DEFAULT_CONFIG, line1: 'FRONT', line2: 'MAN', loop: false, speed: 1.25 },
    'responsive',
  );
  assert.ok(tsx.includes('import { useEffect, useRef } from "react";'));
  assert.ok(tsx.includes('export default function FrontManTitleCard('));
  assert.ok(tsx.includes('loop = false'));
  assert.ok(tsx.includes('speed = 1.25'));
  assert.ok(tsx.includes('cancelAnimationFrame(rafId)'));
  assert.equal(tsx.includes('AudioContext'), false);
  assert.equal(tsx.includes('<button'), false);
});

test('generateCodeArtifact computes accurate metadata and byte sizes', () => {
  const artifact = generateCodeArtifact(DEFAULT_CONFIG, 'html', 'responsive');
  assert.equal(artifact.filename, 'squid-game-title-card.html');
  assert.ok(artifact.lineCount > 80);
  assert.ok(artifact.byteSize > 4000);
  assert.equal(formatByteSize(512), '512 B');
  assert.equal(formatByteSize(11264), '11.0 KB');
});
