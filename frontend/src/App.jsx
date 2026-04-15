// change: Design system - added Footer component; revert: remove Footer import and usage
import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './hooks/useCart';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import CustomizePage from './pages/CustomizePage';
import CartPage from './pages/CartPage';
import SchoolPage from './pages/SchoolPage';
import './styles.css';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';

  const storedTheme = window.localStorage.getItem('theme');
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);
  
  try {
    return (
      <CartProvider>
        <div className="app-root">
          <Header theme={theme} onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')} />
          <main className="main">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/schools" element={<LandingPage />} />
              <Route path="/schools/:divisionSlug/:regionSlug/:schoolSlug" element={<SchoolPage />} />
              <Route path="/customize/:id" element={<CustomizePage />} />
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    );
  } catch (error) {
    console.error('App error:', error);
    return (
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh', backgroundColor: '#fff' }}>
        <h1 style={{ color: 'red' }}>Error loading app</h1>
        <p>{error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }
}

export default App;


