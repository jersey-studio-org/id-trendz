import { useState } from 'react';

export default function ContactModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Contact Us</h2>
          <button onClick={onClose} className="icon" aria-label="Close modal">
            x
          </button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
            We'd love to hear from you. For sales, support, or any other inquiries, please reach out via email.
          </p>
          <a
            href="mailto:sales@idtrendz.com"
            className="button-primary"
            style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 24px' }}
          >
            Email: sales@idtrendz.com
          </a>
        </div>
      </div>
    </div>
  );
}
