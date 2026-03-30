/**
 * CartIcon - Shopping cart icon with badge showing item count
 * @param {number} count - Number of items in cart
 */
export default function CartIcon({ count = 0 }) {
  return (
    <div className="cart-icon-wrapper" aria-label="Shopping cart">
      <svg
        className="cart-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span className="cart-badge" aria-label={`${count} items in cart`}>
          {count}
        </span>
      )}
    </div>
  );
}




