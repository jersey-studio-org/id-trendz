// POLISH UPDATE - Created ProductImage component with placeholder fallback
import { useState } from 'react';
import placeholderJersey from '../assets/placeholder-jersey.svg';

function resolveAssetUrl(src) {
  if (!src) return src;
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  if (src.startsWith('/')) {
    const base = import.meta.env.BASE_URL || '/';
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${normalizedBase}${src}`;
  }
  return src;
}

export default function ProductImage({ src, alt = 'Product', className = '' }) {
  // Properly encode the URL - encodeURI handles spaces and special chars
  const encodedSrc = src ? encodeURI(resolveAssetUrl(src)) : src;
  const [imgSrc, setImgSrc] = useState(encodedSrc);
  const [hasError, setHasError] = useState(false);

  const handleError = (e) => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(placeholderJersey);
      console.error('Failed to load image:', src, '\nAttempted URL:', e.target.src);
    }
  };

  return (
    <div className={`product-image-container ${className}`}>
      <img
        src={imgSrc || placeholderJersey}
        alt={alt}
        loading="lazy"
        onError={handleError}
        className="product-image"
      />
    </div>
  );
}

