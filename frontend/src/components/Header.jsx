// Header with 3-column layout: Search (left), Logo (center), Nav (right)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import CartPanel from './CartPanel';
import CartIcon from './CartIcon';
import { calculateCartTotals } from '../utils/cartHelpers';
import { buildCheckoutEmail, buildOrderData, createOrderZip, downloadBlob } from '../utils/orderBundle';
import { getStoreSettings, loadStoreConfig } from '../utils/storeConfig';
import logoSvg from '@images/branding/logo.svg';
import logoPlaceholder from '@images/branding/logo-placeholder.png';
import logoPng from '@images/branding/logo-main.png';

export default function Header({ onSearch, theme = 'light', onToggleTheme }) {
  const { items, getCount } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoSrc, setLogoSrc] = useState(logoPng || logoPlaceholder || logoSvg);
  const [logoErrorCount, setLogoErrorCount] = useState(0);

  const handleLogoError = () => {
    if (logoErrorCount === 0) {
      setLogoSrc(logoPlaceholder || logoSvg);
      setLogoErrorCount(1);
    } else if (logoErrorCount === 1) {
      setLogoSrc(logoSvg);
      setLogoErrorCount(2);
    }
  };

  function handleCheckout() {
    if (!items || items.length === 0) return;

    (async () => {
      const storeSettings = getStoreSettings(await loadStoreConfig());
      const { subtotal, tax, shipping, grandTotal } = calculateCartTotals(items, storeSettings);
      const orderData = buildOrderData(items, { subtotal, shipping, tax, grandTotal });
      const { zipBlob, zipFilename } = await createOrderZip(orderData);
      downloadBlob(zipBlob, zipFilename);
      const email = buildCheckoutEmail(orderData, zipFilename);
      window.location.href = `mailto:?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    })().catch((error) => {
      console.error('Failed to prepare order bundle:', error);
    });
  }

  function handleExport() {
    if (!items || items.length === 0) return;

    (async () => {
      const storeSettings = getStoreSettings(await loadStoreConfig());
      const { subtotal, tax, shipping, grandTotal } = calculateCartTotals(items, storeSettings);
      const orderData = buildOrderData(items, { subtotal, shipping, tax, grandTotal });
      const { zipBlob, zipFilename } = await createOrderZip(orderData);
      downloadBlob(zipBlob, zipFilename);
    })().catch((error) => {
      console.error('Failed to export order bundle:', error);
    });
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      e.target.focus();
    }
  };

  return (
    <header className="app-header">
      <div className="site-container header-inner">
        <div className="header-left">
          <form className="header-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="header-search-input"
              placeholder="Search jerseys, colors, styles... (Ctrl/Cmd+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              aria-label="Search jerseys, colors, styles"
            />
            <button type="submit" className="header-search-button" aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </form>
        </div>

        <div className="header-center">
          <Link to="/" className="brand-logo" aria-label="Home">
            <img
              src={logoSrc}
              alt="Logo"
              width="240"
              height="70"
              className="brand-logo-image"
              onError={handleLogoError}
            />
          </Link>
        </div>

        <div className="header-right">
          <nav className="nav">
            <Link to="/">Home</Link>
            <Link to="/cart" className="cart-icon-link" aria-label="View cart">
              <CartIcon count={getCount()} />
            </Link>
            <Link to="/schools" className="nav-button">Store</Link>
            <button
              type="button"
              className="theme-toggle"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="theme-toggle-icon" aria-hidden="true">
                {theme === 'dark' ? 'Sun' : 'Moon'}
              </span>
              <span className="theme-toggle-label">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>
          </nav>
        </div>
      </div>
      {open && (
        <CartPanel
          items={items}
          onClose={() => setOpen(false)}
          onCheckout={handleCheckout}
          onExport={handleExport}
        />
      )}
    </header>
  );
}
