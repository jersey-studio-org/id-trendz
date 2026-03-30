import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import QuantityControl from '../components/QuantityControl';
import OrderModal from '../components/OrderModal';

/**
 * CartPage - Full cart page with checkout functionality
 */
export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart } = useCart();
  const [showModal, setShowModal] = useState(false);

  // Calculate totals
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.price) * Number(it.quantity || 1),
    0
  );
  // Tax: 5% of subtotal (you can change this calculation)
  const tax = subtotal * 0.05;
  // Shipping: Flat rate or "TBD" (you can change this)
  const shipping = subtotal > 0 ? 10 : 0; // Flat $10 shipping
  const grandTotal = subtotal + tax + shipping;

  function handleQuantityChange(cartId, newQty) {
    updateQuantity(cartId, newQty);
  }

  function handleRemove(cartId) {
    if (window.confirm('Remove this item from cart?')) {
      removeFromCart(cartId);
    }
  }

  function handleCheckout() {
    if (!items || items.length === 0) return;
    
    // Notify user
    alert("Attempting to open your default email client. If it doesn't open automatically, the order details will be shown in a popup.");

    // Generate order ID
    const orderId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `order-${Date.now()}`;

    // Build order data
    const orderData = {
      orderId,
      dateTime: new Date().toISOString(),
      customer: 'Name / Email (to be filled in)',
      items: items.map((it) => ({
        title: it.title,
        options: it.options || {},
        quantity: it.quantity || 1,
        price: Number(it.price),
        subtotal: Number(it.price) * Number(it.quantity || 1),
        imageUrl: it.thumbnail,
      })),
      subtotal,
      shipping: shipping > 0 ? `$${shipping.toFixed(2)}` : 'TBD',
      tax,
      grandTotal,
    };

    // Build mailto body
    const lines = [];
    lines.push(`Order ID: ${orderId}`);
    lines.push(`Date: ${new Date().toLocaleString()}`);
    lines.push(`Customer: Name / Email (to be filled in)`);
    lines.push(encodeURIComponent('\n'));
    lines.push(`Items:`);
    orderData.items.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.title}`);
      if (item.options && Object.keys(item.options).length > 0) {
        lines.push(`   Options: ${JSON.stringify(item.options)}`);
      }
      lines.push(`   Quantity: ${item.quantity}`);
      lines.push(`   Price: $${item.price.toFixed(2)}`);
      lines.push(`   Subtotal: $${item.subtotal.toFixed(2)}`);
      if (item.imageUrl) {
        lines.push(`   Image: ${item.imageUrl}`);
      }
      lines.push('');
    });
    lines.push(`Subtotal: $${subtotal.toFixed(2)}`);
    lines.push(`Shipping: ${orderData.shipping}`);
    lines.push(`Tax: $${tax.toFixed(2)}`);
    lines.push(`Grand Total: $${grandTotal.toFixed(2)}`);

    const bodyText = lines.join('\n');
    const encodedBody = encodeURIComponent(bodyText).replace(/%0A/g, '%0D%0A');

    // Check if body would exceed ~1900 characters (safe limit for most mail clients)
    // Create a simple email template with minimal formatting
    const emailSubject = 'Order from Jersey Studio';
    const simpleBody = `Order Details:\n\n` +
      `Order ID: ${orderId}\n` +
      `Date: ${new Date().toLocaleString()}\n\n` +
      `Items:\n` +
      items.map((item, idx) => 
        `${idx + 1}. ${item.title} - Quantity: ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}\n`
      ).join('') +
      `\nSubtotal: $${subtotal.toFixed(2)}\n` +
      `Shipping: ${shipping > 0 ? `$${shipping.toFixed(2)}` : 'TBD'}\n` +
      `Tax: $${tax.toFixed(2)}\n` +
      `Total: $${grandTotal.toFixed(2)}`;

    // Create both a simple mailto link and a backup link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(simpleBody)}`;

    // Create a hidden anchor element for the mailto
    const mailtoAnchor = document.createElement('a');
    mailtoAnchor.href = mailtoLink;
    mailtoAnchor.style.display = 'none';
    document.body.appendChild(mailtoAnchor);

    // Try to click the link
    try {
      mailtoAnchor.click();
      // Remove the anchor after a short delay
      setTimeout(() => {
        document.body.removeChild(mailtoAnchor);
      }, 100);

      // Show modal as backup after a delay if email client didn't open
      setTimeout(() => {
        if (!document.hidden) {
          setShowModal(orderData);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to open email client:', error);
      // If clicking fails, try direct navigation
      try {
        window.location.href = mailtoLink;
      } catch (err) {
        console.error('Failed to redirect to mailto:', err);
        // If all else fails, show the modal
        setShowModal(orderData);
      }
    }
  }

  function handleExport() {
    const orderData = {
      orderId: `export-${Date.now()}`,
      dateTime: new Date().toISOString(),
      items: items.map((it) => ({
        title: it.title,
        options: it.options || {},
        quantity: it.quantity || 1,
        price: Number(it.price),
        subtotal: Number(it.price) * Number(it.quantity || 1),
        imageUrl: it.thumbnail,
      })),
      subtotal,
      shipping,
      tax,
      grandTotal,
    };
    const blob = new Blob([JSON.stringify(orderData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cart-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (items.length === 0) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>
            Your cart is empty
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Start shopping to add items to your cart
          </p>
          <button onClick={() => navigate('/')} className="primary">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">Shopping Cart</h1>

      <div className="cart-page-layout">
        {/* Cart Items */}
        <div className="cart-items-section">
          {items.map((item) => (
            <div key={item.cartId} className="cart-item-row">
              <div className="cart-item-thumb">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="thumb-placeholder">No image</div>
                )}
              </div>
              <div className="cart-item-details">
                <h3 className="cart-item-title">{item.title}</h3>
                {item.options && Object.keys(item.options).length > 0 && (
                  <div className="cart-item-options">
                    {Object.entries(item.options)
                      .filter(([_, val]) => val)
                      .map(([key, val]) => (
                        <span key={key} className="option-tag">
                          {key}: {val}
                        </span>
                      ))}
                  </div>
                )}
                <div className="cart-item-price-unit">
                  ${Number(item.price).toFixed(2)} each
                </div>
              </div>
              <div className="cart-item-controls">
                <QuantityControl
                  value={item.quantity || 1}
                  onChange={(newQty) => handleQuantityChange(item.cartId, newQty)}
                />
                <div className="cart-item-subtotal">
                  ${(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}
                </div>
                <button
                  onClick={() => handleRemove(item.cartId)}
                  className="remove-btn"
                  aria-label="Remove item"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <aside className="cart-summary">
          <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>
            Order Summary
          </h2>
          <div className="summary-line">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Shipping</span>
            <span>{shipping > 0 ? `$${shipping.toFixed(2)}` : 'TBD'}</span>
          </div>
          <div className="summary-line">
            <span>Tax (5%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-total">
            <span>Grand Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="checkout-btn"
            aria-label="Checkout by email"
          >
            Checkout by Email
          </button>
          <button
            onClick={handleExport}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            aria-label="Export cart as JSON"
          >
            Export JSON
          </button>
        </aside>
      </div>

      {showModal && (
        <OrderModal
          orderData={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}




