import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFontScale, getContrastColor, getLuminance } from '../src/utils/canvasHelpers.js';

test('getLuminance returns bright values for white', () => {
  assert.equal(getLuminance('#ffffff'), 1);
});

test('getContrastColor returns white for dark backgrounds', () => {
  assert.equal(getContrastColor('#101010'), '#FFFFFF');
});

test('calculateFontScale stays within the supported clamp range', () => {
  assert.equal(calculateFontScale(100), 0.5);
  assert.equal(calculateFontScale(400), 1);
  assert.equal(calculateFontScale(1200), 2);
});
