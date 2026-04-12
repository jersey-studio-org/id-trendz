export function getBasePath(base = '/') {
  return base.endsWith('/') ? base : `${base}/`;
}

export function withBase(path, base = '/') {
  const normalizedBase = getBasePath(base);
  if (!path) return normalizedBase;
  return path.startsWith('/') ? `${normalizedBase}${path.slice(1)}` : `${normalizedBase}${path}`;
}

export function findProductByPath(path, products) {
  if (path === '/products') return products;

  if (path.startsWith('/products/')) {
    const id = path.split('/products/')[1];
    return products.find((product) => product.id === id) ?? null;
  }

  return null;
}
