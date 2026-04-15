import { useState } from 'react';
import { buildCheckoutEmail, createOrderZip, downloadBlob, formatOrderSummaryText } from '../utils/orderBundle';

/**
 * OrderModal - Modal for displaying order summary when mailto body is too long
 * @param {object} orderData - The complete order data
 * @param {function} onClose - Callback to close modal
 */
export default function OrderModal({ orderData, onClose }) {
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  function formatOrderText() {
    return formatOrderSummaryText(orderData);
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

  async function handleCopyEmail() {
    try {
      const email = buildCheckoutEmail(orderData, `jersey-order-${orderData.orderId}.zip`);
      await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email instructions:', err);
      alert('Failed to copy email instructions');
    }
  }

  function handleDownload() {
    createOrderZip(orderData)
      .then(({ zipBlob, zipFilename }) => {
        downloadBlob(zipBlob, zipFilename);
      })
      .catch((err) => {
        console.error('Failed to download:', err);
        alert('Failed to download order bundle');
      });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order Summary</h2>
          <button onClick={onClose} className="icon" aria-label="Close modal">
            x
          </button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Your order package is ready. Download the ZIP bundle, then use the
            email instructions below when you send it across.
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
            {copied ? 'Copied!' : 'Copy Order Summary'}
          </button>
          <button
            onClick={handleCopyEmail}
            style={{
              flex: 1,
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            aria-label="Copy email instructions"
          >
            {emailCopied ? 'Copied!' : 'Copy Email Instructions'}
          </button>
          <button
            onClick={handleDownload}
            style={{
              flex: 1,
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            aria-label="Download order bundle as ZIP"
          >
            Download ZIP
          </button>
        </div>
      </div>
    </div>
  );
}
