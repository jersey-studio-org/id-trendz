import { useState } from 'react';

/**
 * OrderModal - Modal for displaying order summary when mailto body is too long
 * @param {object} orderData - The complete order data
 * @param {function} onClose - Callback to close modal
 */
export default function OrderModal({ orderData, onClose }) {
  const [copied, setCopied] = useState(false);

  // Format order as plain text
  function formatOrderText() {
    const lines = [];
    lines.push(`Order ID: ${orderData.orderId}`);
    lines.push(`Date: ${orderData.dateTime}`);
    lines.push(`Customer: ${orderData.customer}`);
    lines.push('');
    lines.push('Items:');
    orderData.items.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.title}`);
      if (item.options && Object.keys(item.options).length > 0) {
        lines.push(`   Options: ${JSON.stringify(item.options)}`);
      }
      lines.push(`   Quantity: ${item.quantity}`);
      lines.push(`   Price: $${Number(item.price).toFixed(2)}`);
      lines.push(`   Subtotal: $${Number(item.subtotal).toFixed(2)}`);
      if (item.imageUrl) {
        lines.push(`   Image: ${item.imageUrl}`);
      }
      lines.push('');
    });
    lines.push(`Subtotal: $${Number(orderData.subtotal).toFixed(2)}`);
    lines.push(`Shipping: ${orderData.shipping}`);
    lines.push(`Tax: $${Number(orderData.tax).toFixed(2)}`);
    lines.push(`Grand Total: $${Number(orderData.grandTotal).toFixed(2)}`);
    return lines.join('\n');
  }

  async function handleCopy() {
    try {
      const text = formatOrderText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  }

  function handleDownload() {
    try {
      const blob = new Blob([JSON.stringify(orderData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-${orderData.orderId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download:', err);
      alert('Failed to download order file');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order Summary</h2>
          <button onClick={onClose} className="icon" aria-label="Close modal">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Your order is ready! Copy the summary below and paste it into your
            email client, or download the JSON file.
          </p>
          <pre className="order-text">{formatOrderText()}</pre>
        </div>
        <div className="modal-footer">
          <button
            className="primary"
            onClick={handleCopy}
            style={{ flex: 1 }}
            aria-label="Copy order summary to clipboard"
          >
            {copied ? '✓ Copied!' : 'Copy Order Summary'}
          </button>
          <button
            onClick={handleDownload}
            style={{
              flex: 1,
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            aria-label="Download order as JSON"
          >
            Download JSON
          </button>
        </div>
      </div>
    </div>
  );
}




