import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  clampQuantity,
  formatOptionValue,
  getCartCount,
  getCartTotal,
  normalizeCartItem,
} from '../src/utils/cartHelpers.js';

test('formatOptionValue safely handles nested design objects', () => {
  assert.equal(formatOptionValue({ elements: [{ id: 1 }, { id: 2 }] }), '2 design elements');
  assert.equal(formatOptionValue({ color: '#fff', size: 'L' }), 'color, size');
  assert.equal(formatOptionValue(['a']), '1 item');
});

test('clampQuantity never returns less than one', () => {
  assert.equal(clampQuantity(0), 1);
  assert.equal(clampQuantity(-5), 1);
  assert.equal(clampQuantity(3), 3);
});

test('normalizeCartItem builds a stable cart payload', () => {
  const item = normalizeCartItem(
    { productId: 'jersey-1', title: 'Match Jersey', thumbnail: 'thumb.png', quantity: 2, price: '19.99' },
    () => 'cart-123'
  );

  assert.deepEqual(item, {
    cartId: 'cart-123',
    productId: 'jersey-1',
    title: 'Match Jersey',
    thumbnail: 'thumb.png',
    previewImageURL: 'thumb.png',
    options: {},
    quantity: 2,
    price: 19.99,
  });
});

test('cart aggregates use quantity and price consistently', () => {
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 },
  ];

  assert.equal(getCartCount(items), 5);
  assert.equal(getCartTotal(items), 35);
  assert.deepEqual(calculateCartTotals(items), {
    subtotal: 35,
    tax: 2.1,
    shipping: 4.99,
    grandTotal: 42.09,
  });
});
