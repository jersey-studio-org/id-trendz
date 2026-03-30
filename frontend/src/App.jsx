// change: Design system - added Footer component; revert: remove Footer import and usage
import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './hooks/useCart';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import CustomizePage from './pages/CustomizePage';
import CartPage from './pages/CartPage';
import './styles.css';

function App() {
  console.log('App component rendering...');
  
  try {
    return (
      <CartProvider>
        <div className="app-root" style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
          <Header />
          <main className="main">
            <Routes>
              <Route path="/" element={<LandingPage />} />
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


