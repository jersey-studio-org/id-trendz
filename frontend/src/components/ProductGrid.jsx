// change: Design system ProductGrid with skeleton loading; revert: restore previous version
import ProductCard from './ProductCard';

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton skeleton-line medium"></div>
        <div className="skeleton skeleton-line short"></div>
        <div className="skeleton skeleton-button"></div>
      </div>
    </div>
  );
}

export default function ProductGrid({ products, onCustomize, loading = false }) {
  const safeProducts = Array.isArray(products) ? products : [];
  
  if (loading) {
    return (
      <div className="product-grid">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="product-grid">
      {safeProducts.map((p) => (
        <ProductCard key={p.id} product={p} onCustomize={onCustomize} />
      ))}
      {safeProducts.length === 0 && (
        <div className="empty-state muted-text">
          <p>No products available. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}


