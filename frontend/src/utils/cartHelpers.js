export function formatOptionValue(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;

  if (typeof value === 'object') {
    if (Array.isArray(value.elements)) {
      return `${value.elements.length} design element${value.elements.length === 1 ? '' : 's'}`;
    }

    const keys = Object.keys(value);
    return keys.length > 0 ? keys.join(', ') : '';
  }

  return String(value);
}

export function clampQuantity(quantity) {
  return Math.max(1, Number(quantity) || 1);
}

export function normalizeCartItem(item, createId) {
  return {
    cartId: createId(),
    productId: item.productId,
    title: item.title,
    thumbnail: item.previewImageURL || item.thumbnail,
    previewImageURL: item.previewImageURL || item.thumbnail,
    options: item.options || {},
    metadata: item.metadata || {},
    quantity: clampQuantity(item.quantity),
    price: Number(item.price ?? 0),
  };
}

export function getCartCount(items) {
  return items.reduce((sum, item) => sum + clampQuantity(item.quantity), 0);
}

export function getCartTotal(items) {
  return items.reduce((sum, item) => sum + Number(item.price || 0) * clampQuantity(item.quantity), 0);
}

export function calculateCartTotals(items, taxRate = 0.05, shippingRate = 10) {
  const subtotal = getCartTotal(items);
  const tax = subtotal * taxRate;
  const shipping = subtotal > 0 ? shippingRate : 0;

  return {
    subtotal,
    tax,
    shipping,
    grandTotal: subtotal + tax + shipping,
  };
}
