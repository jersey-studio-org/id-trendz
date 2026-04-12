import test from 'node:test';
import assert from 'node:assert/strict';
import { getTrimColor, normalizeCollarStyle, normalizeSleeveStyle } from '../src/utils/jerseyOptions.js';

test('normalizeCollarStyle maps booleans to supported values', () => {
  assert.equal(normalizeCollarStyle(true), 'collared');
  assert.equal(normalizeCollarStyle(false), 'round-neck');
});

test('normalizeSleeveStyle maps booleans to supported values', () => {
  assert.equal(normalizeSleeveStyle(true), 'full');
  assert.equal(normalizeSleeveStyle(false), 'half');
});

test('getTrimColor returns darker trim for light jerseys', () => {
  assert.equal(getTrimColor('#f2f2f2'), '#6b7280');
});

test('getTrimColor returns light trim for dark jerseys or invalid values', () => {
  assert.equal(getTrimColor('#222222'), '#e5e7eb');
  assert.equal(getTrimColor('bad-value'), '#d1d5db');
});
