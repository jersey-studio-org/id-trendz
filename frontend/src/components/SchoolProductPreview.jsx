import ProductImage from './ProductImage';

export default function SchoolProductPreview({ school, className = '' }) {
  if (school?.image) {
    return <ProductImage src={school.image} alt={`${school.name} t-shirt`} className={className} />;
  }

  return (
    <div className={`school-product-empty ${className}`.trim()}>
      <span>Empty</span>
    </div>
  );
}
