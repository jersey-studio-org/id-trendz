export default function CartPanel({ items = [], onClose, onCheckout, onExport }) {
  const total = items.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity ?? 1)), 0);
  return (
    <aside className="cart-panel">
      <div className="cart-header">
        <div>Cart</div>
        <button className="icon" onClick={onClose} aria-label="Close cart">✕</button>
      </div>
      <div className="cart-content">
        {items.length === 0 && <div>Your cart is empty.</div>}
        {items.map((it) => (
          <div key={it.cartId || it.id} className="cart-item">
            {it.thumbnail && (
              <img
                src={it.thumbnail}
                alt={it.title || it.name}
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  marginRight: '12px',
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cart-item-name">{it.title || it.name}</div>
              <div className="cart-item-meta">x{it.quantity ?? 1}</div>
            </div>
            <div className="cart-item-price">${Number(it.price ?? 0).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div className="cart-footer">
        <div>Total</div>
        <div>${total.toFixed(2)}</div>
      </div>
      <div style={{ display: 'flex', gap: 12, padding: '16px 24px' }}>
        <button className="primary" onClick={onCheckout} disabled={items.length === 0}>Checkout</button>
        <button onClick={onExport} disabled={items.length === 0} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>Export JSON</button>
      </div>
    </aside>
  );
}


