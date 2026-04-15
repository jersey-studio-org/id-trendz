// Header with 3-column layout: Search (left), Logo (center), Nav (right)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import CartPanel from './CartPanel';
import CartIcon from './CartIcon';
import logoSvg from '@images/branding/logo.svg';
import logoPlaceholder from '@images/branding/logo-placeholder.png';
import logoPng from '@images/branding/logo-main.png';

export default function Header({ onSearch, theme = 'light', onToggleTheme }) {
  const { items, clearCart, getCount } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoSrc, setLogoSrc] = useState(logoPng || logoPlaceholder || logoSvg);
  const [logoErrorCount, setLogoErrorCount] = useState(0);

  // Handle logo load errors with fallback chain
  // Priority: logo.png > logo-placeholder.png > logo.svg
  const handleLogoError = () => {
    if (logoErrorCount === 0) {
      // logo.png failed, try placeholder
      setLogoSrc(logoPlaceholder || logoSvg);
      setLogoErrorCount(1);
    } else if (logoErrorCount === 1) {
      // placeholder also failed, use SVG
      setLogoSrc(logoSvg);
      setLogoErrorCount(2);
    }
    // If SVG also fails, we're out of options (shouldn't happen)
  };

  function handleCheckout() {
    if (!items || items.length === 0) return;
    const site = 'Jersey Studio';
    const subject = `Order from ${site}`;
    const lines = [];
    items.forEach((it, idx) => {
      lines.push(`#${idx + 1} ${it.title} x${it.quantity} - $${Number(it.price).toFixed(2)}`);
      if (it.thumbnail) lines.push(`Image: ${it.thumbnail}`);
      if (it.options && Object.keys(it.options).length > 0) {
        lines.push(`Options: ${JSON.stringify(it.options)}`);
      }
      lines.push('');
    });
    const total = items.reduce((s, it) => s + Number(it.price) * Number(it.quantity || 1), 0);
    lines.push(`Total: $${total.toFixed(2)}`);
    const body = encodeURIComponent(lines.join('\n'));
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mailto;
  }

  function handleExport() {
    const data = JSON.stringify(items, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'order.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
    // Ctrl/Cmd + K to focus search
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
            <Link to="/schools" className="nav-button">Schools</Link>
            <button
              type="button"
              className="theme-toggle"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="theme-toggle-icon" aria-hidden="true">
                {theme === 'dark' ? '☀' : '☾'}
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


