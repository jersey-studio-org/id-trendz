/**
 * QuantityControl - Reusable quantity selector component
 * @param {number} value - Current quantity
 * @param {function} onChange - Callback with new quantity
 * @param {number} min - Minimum quantity (default: 1)
 */
export default function QuantityControl({ value, onChange, min = 1 }) {
  function handleDecrease() {
    if (value > min) {
      onChange(value - 1);
    }
  }

  function handleIncrease() {
    onChange(value + 1);
  }

  return (
    <div className="quantity-control">
      <button
        onClick={handleDecrease}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="qty-btn"
      >
        −
      </button>
      <span className="qty-value" aria-label={`Quantity: ${value}`}>
        {value}
      </span>
      <button
        onClick={handleIncrease}
        aria-label="Increase quantity"
        className="qty-btn"
      >
        +
      </button>
    </div>
  );
}




