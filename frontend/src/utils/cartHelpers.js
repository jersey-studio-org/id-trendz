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
  const metadata =
    item.metadata && typeof item.metadata === 'object' && Object.keys(item.metadata).length > 0
      ? { metadata: item.metadata }
      : {};

  return {
    cartId: createId(),
    productId: item.productId,
    title: item.title,
    thumbnail: item.previewImageURL || item.thumbnail,
    previewImageURL: item.previewImageURL || item.thumbnail,
    options: item.options || {},
    ...metadata,
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

export function calculateShipping(subtotal, shippingRules = {}) {
  if (subtotal <= 0) return 0;

  const flatFee = Number(shippingRules.flatFee ?? 4.99);
  const freeThreshold = Number(shippingRules.freeThreshold);

  if (Number.isFinite(freeThreshold) && subtotal >= freeThreshold) {
    return 0;
  }

  return Number.isFinite(flatFee) ? flatFee : 0;
}

export function calculateCartTotals(items, config = {}) {
  const subtotal = getCartTotal(items);
  const taxRate = Number(config.taxRate ?? 0.06);
  const shipping = calculateShipping(subtotal, config.shipping);
  const tax = subtotal * taxRate;

  return {
    subtotal,
    tax,
    shipping,
    grandTotal: subtotal + tax + shipping,
  };
}
