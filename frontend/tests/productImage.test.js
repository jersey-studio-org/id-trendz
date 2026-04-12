import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAssetUrl } from '../src/utils/productImage.js';

test('resolveAssetUrl preserves external and data urls', () => {
  assert.equal(resolveAssetUrl('https://example.com/file.png', '/repo/'), 'https://example.com/file.png');
  assert.equal(resolveAssetUrl('data:image/png;base64,abc', '/repo/'), 'data:image/png;base64,abc');
});

test('resolveAssetUrl applies the base path to root-relative assets', () => {
  assert.equal(resolveAssetUrl('/product-images/jersey.png', '/repo/'), '/repo/product-images/jersey.png');
  assert.equal(resolveAssetUrl('relative.png', '/repo/'), 'relative.png');
});
