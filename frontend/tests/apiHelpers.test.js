import test from 'node:test';
import assert from 'node:assert/strict';
import { findProductByPath, getBasePath, withBase } from '../src/utils/apiHelpers.js';

test('getBasePath always returns a trailing slash', () => {
  assert.equal(getBasePath('/repo'), '/repo/');
  assert.equal(getBasePath('/repo/'), '/repo/');
});

test('withBase prefixes root-relative paths with the vite base', () => {
  assert.equal(withBase('products.json', '/repo/'), '/repo/products.json');
  assert.equal(withBase('/products.json', '/repo/'), '/repo/products.json');
});

test('findProductByPath resolves collection and detail routes', () => {
  const products = [{ id: 'a' }, { id: 'b' }];

  assert.equal(findProductByPath('/products', products), products);
  assert.deepEqual(findProductByPath('/products/b', products), { id: 'b' });
  assert.equal(findProductByPath('/products/missing', products), null);
});
