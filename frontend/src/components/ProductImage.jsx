// POLISH UPDATE - Created ProductImage component with placeholder fallback
import { useState } from 'react';
import placeholderJersey from '../assets/placeholder-jersey.svg';
import { resolveAssetUrl } from '../utils/productImage';

export default function ProductImage({ src, alt = 'Product', className = '' }) {
  const encodedSrc = src ? encodeURI(resolveAssetUrl(src, import.meta.env.BASE_URL || '/')) : src;
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

