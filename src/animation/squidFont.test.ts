import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getGlyph,
  getSupportedGlyphKeys,
  layoutTitleCard,
  sanitizeTitleLine,
} from './squidFont';

test('all A-Z and 0-9 glyphs exist with valid stroke geometry', () => {
  const keys = getSupportedGlyphKeys();
  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    assert.ok(keys.includes(ch), `Missing glyph for ${ch}`);
    const glyph = getGlyph(ch);
    assert.ok(glyph.width > 0.2 && glyph.width <= 1.1, `Invalid width for ${ch}`);
    assert.ok(glyph.strokes.length >= 1, `Glyph ${ch} has no strokes`);
    for (const stroke of glyph.strokes) {
      assert.ok(stroke.points.length >= 2, `Glyph ${ch} stroke needs >= 2 points`);
    }
  }
});

test('sanitizeTitleLine uppercases, filters invalid symbols, and caps length', () => {
  assert.equal(sanitizeTitleLine('  squid game!  '), 'SQUID GAME!');
  assert.equal(sanitizeTitleLine('player #456$$$'), 'PLAYER 456');
  assert.equal(sanitizeTitleLine('ABCDEFGHIJKLMNOPQRST').length, 14);
});

test('layoutTitleCard embeds circle into Q and triangle into A for SQUID / GAME', () => {
  const layout = layoutTitleCard('SQUID', 'GAME', 1920, 1080);
  assert.equal(layout.line1Text, 'SQUID');
  assert.equal(layout.line2Text, 'GAME');
  assert.equal(layout.triadTargets.circle.embeddedInGlyph, true);
  assert.equal(layout.triadTargets.triangle.embeddedInGlyph, true);
  assert.equal(layout.triadTargets.square.embeddedInGlyph, true);

  // Bounds stay cleanly inside cinema safe frame
  assert.ok(layout.titleBounds.left > 180);
  assert.ok(layout.titleBounds.right < 1740);
  assert.ok(layout.titleBounds.top > 120);
  assert.ok(layout.titleBounds.bottom < 860);

  // Circle accent assigned to Q stroke, triangle accent assigned to A stroke
  const circleAccents = layout.strokes.filter((s) => s.accentRole === 'circle');
  const triangleAccents = layout.strokes.filter((s) => s.accentRole === 'triangle');
  assert.equal(circleAccents.length, 1);
  assert.equal(triangleAccents.length, 1);
});

test('layoutTitleCard falls back gracefully for strings without O/Q or A/V', () => {
  const layout = layoutTitleCard('TEST', '123', 1920, 1080);
  assert.equal(layout.triadTargets.circle.embeddedInGlyph, false);
  assert.equal(layout.triadTargets.triangle.embeddedInGlyph, false);
  assert.ok(layout.strokes.length > 0);
});
