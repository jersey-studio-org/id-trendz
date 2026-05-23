import { useState } from 'react';
import ContactModal from './ContactModal';

export default function Footer() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <footer className="app-footer">
      <div className="site-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <p>&copy; {new Date().getFullYear()} IDTrendz. All rights reserved.</p>
          <button 
            onClick={() => setIsContactOpen(true)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline'
            }}
          >
            Contact Us
          </button>
        </div>
        <a href="mailto:sales@idtrendz.com" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>
          sales@idtrendz.com
        </a>
      </div>
      {isContactOpen && <ContactModal onClose={() => setIsContactOpen(false)} />}
    </footer>
  );
}

