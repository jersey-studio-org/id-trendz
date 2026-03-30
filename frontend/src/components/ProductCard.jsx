// change: Design system ProductCard with article.card structure; revert: restore previous structure
import ProductImage from './ProductImage';

export default function ProductCard({ product, onCustomize }) {
  const img = product?.thumbnails?.[0] || product?.images?.[0] || product?.image || '';
  const price = product?.price ?? product?.variants?.[0]?.price ?? '';
  const title = product?.title || product?.name || 'Product';

  return (
    <article className="card product-card">
      <ProductImage src={img} alt={title || 'Jersey'} />
      <div className="card-body">
        <h3 className="product-name">{title}</h3>
        {price !== '' && (
          <div className="product-price">
            {typeof price === 'number' ? `$${price.toFixed(2)}` : price}
          </div>
        )}
      </div>
      <div className="card-footer">
        <button className="button-primary" onClick={() => onCustomize(product?.id)}>
          Start Customizing
        </button>
      </div>
    </article>
  );
}


