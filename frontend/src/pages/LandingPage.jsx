// change: Design system landing page with Hero and improved layout; revert: restore previous version
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useApi from '../hooks/useApi';
import ProductGrid from '../components/ProductGrid';
import FiltersBar from '../components/FiltersBar';
import Hero from '../components/Hero';

export default function LandingPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        console.log('Fetching products...');
        const data = await api.get('/products');
        console.log('Products received:', data);
        if (isMounted) {
          const productsList = Array.isArray(data) ? data : (data?.items ?? []);
          // Sort deterministically: by rank if present, else by title
          const sorted = [...productsList].sort((a, b) => {
            if (a.rank !== undefined && b.rank !== undefined) {
              return a.rank - b.rank;
            }
            const titleA = (a.title || a.name || '').toLowerCase();
            const titleB = (b.title || b.name || '').toLowerCase();
            return titleA.localeCompare(titleB);
          });
          setAllProducts(sorted);
          setFilteredProducts(sorted);
          setLoading(false);
        }
      } catch (e) {
        console.error('Error loading products:', e);
        if (isMounted) {
          setError(e?.message || 'Failed to load products');
          setLoading(false);
        }
      }
    })();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCustomize(productId) {
    navigate(`/customize/${productId}`);
  }

  // Extract unique colors and styles from products
  const { availableColors, availableStyles } = useMemo(() => {
    const colors = new Set();
    const styles = new Set();
    allProducts.forEach(p => {
      if (Array.isArray(p.colors)) {
        p.colors.forEach(c => colors.add(c));
      }
      // Extract style keywords from description
      const desc = (p.description || '').toLowerCase();
      if (desc.includes('gradient')) styles.add('Gradient');
      if (desc.includes('camo')) styles.add('Camo');
      if (desc.includes('stripe')) styles.add('Stripe');
      if (desc.includes('arrow')) styles.add('Arrow');
    });
    return {
      availableColors: Array.from(colors),
      availableStyles: Array.from(styles)
    };
  }, [allProducts]);

  const handleFilterChange = (filtered) => {
    setFilteredProducts(filtered);
  };

  // Handle URL search param
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  useEffect(() => {
    if (urlSearch && allProducts.length > 0) {
      const filtered = allProducts.filter(p => {
        const title = (p.title || p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return title.includes(urlSearch.toLowerCase()) || desc.includes(urlSearch.toLowerCase());
      });
      setFilteredProducts(filtered);
    }
  }, [urlSearch, allProducts]);

  if (loading) return <div className="site-container" style={{ padding: '40px', textAlign: 'center' }}>Loading products...</div>;
  if (error) return <div className="site-container"><div className="error">{error}</div></div>;

  return (
    <>
      <Hero />
      <section className="products-section" id="products">
        <div className="site-container">
          <h2 className="section-heading">Explore Jerseys</h2>
          <FiltersBar
            products={allProducts}
            onFilterChange={handleFilterChange}
            availableColors={availableColors}
            availableStyles={availableStyles}
          />
          <ProductGrid products={filteredProducts} onCustomize={handleCustomize} loading={loading} />
        </div>
      </section>
    </>
  );
}


