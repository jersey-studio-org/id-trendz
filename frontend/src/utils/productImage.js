export function resolveAssetUrl(src, basePath = '/') {
  if (!src) return src;
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  if (src.startsWith('/')) {
    const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    return `${normalizedBase}${src}`;
  }

  return src;
}
