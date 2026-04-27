import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import QuantityControl from '../components/QuantityControl';
import OrderModal from '../components/OrderModal';
import { calculateCartTotals, formatOptionValue } from '../utils/cartHelpers';
import { buildCheckoutEmail, buildOrderData, createOrderZip, downloadBlob } from '../utils/orderBundle';
import { getStoreSettings, loadStoreConfig } from '../utils/storeConfig';

/**
 * CartPage - Full cart page with checkout functionality
 */
export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [storeSettings, setStoreSettings] = useState(() => getStoreSettings(null));

  useEffect(() => {
    let isMounted = true;

    loadStoreConfig().then((config) => {
      if (isMounted) {
        setStoreSettings(getStoreSettings(config));
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate totals
  const { subtotal, tax, shipping, grandTotal } = calculateCartTotals(items, storeSettings);

  function handleQuantityChange(cartId, newQty) {
    updateQuantity(cartId, newQty);
  }

  function handleRemove(cartId) {
    if (window.confirm('Remove this item from cart?')) {
      removeFromCart(cartId);
    }
  }

  function handleEdit(item) {
    // Persist the full config + the cart item id so CustomizePage can restore & save back
    const editConfig = item.options?.config ?? {
      color: item.options?.color ?? '#888888',
      size: item.options?.size ?? 'M',
      sleeveType: item.options?.sleeveType ?? 'half',
      neckType: item.options?.neckType ?? 'round',
      activeSide: 'front',
      sides: {
        front: item.options?.sides?.front ?? item.options?.frontDesign ?? { text: '', number: '', elements: [] },
        back: item.options?.sides?.back ?? item.options?.backDesign ?? { text: '', number: '', elements: [] },
        left: item.options?.sides?.left ?? { text: '', number: '', elements: [] },
        right: item.options?.sides?.right ?? { text: '', number: '', elements: [] },
      },
    };
    try {
      localStorage.setItem('editConfig', JSON.stringify(editConfig));
      localStorage.setItem('editCartId', item.cartId);
      localStorage.setItem('editProductId', String(item.productId));
    } catch (e) {
      console.error('Failed to save edit state:', e);
    }
    navigate(`/customize/${item.productId}`);
  }

  function handleCheckout() {
    if (!items || items.length === 0) return;

    (async () => {
      const orderData = buildOrderData(items, { subtotal, shipping, tax, grandTotal });
      try {
        const { zipBlob, zipFilename } = await createOrderZip(orderData);
        downloadBlob(zipBlob, zipFilename);

        const email = buildCheckoutEmail(orderData, zipFilename);
        const mailtoLink = `mailto:?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
        window.location.href = mailtoLink;
      } catch (error) {
        console.error('Failed to prepare order bundle:', error);
      } finally {
        setShowModal(orderData);
      }
    })();
  }

  function handleExport() {
    (async () => {
      const orderData = buildOrderData(items, { subtotal, shipping, tax, grandTotal });
      const { zipBlob, zipFilename } = await createOrderZip(orderData);
      downloadBlob(zipBlob, zipFilename);
    })().catch((error) => {
      console.error('Failed to export ZIP bundle:', error);
    });
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
                          {key}: {formatOptionValue(val)}
                        </span>
                      ))}
                  </div>
                )}
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
                <button
                  onClick={() => handleEdit(item)}
                  className="button-secondary"
                  style={{ fontSize: '13px', padding: '6px 14px' }}
                  aria-label="Edit item customization"
                >
                  ✏️ Edit
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
            <span>{shipping > 0 ? `$${shipping.toFixed(2)}` : 'Free'}</span>
          </div>
          <div className="summary-line">
            <span>Tax ({(Number(storeSettings.taxRate ?? 0.06) * 100).toFixed(0)}%)</span>
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
            aria-label="Download cart order bundle as ZIP"
          >
            Download ZIP Bundle
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




