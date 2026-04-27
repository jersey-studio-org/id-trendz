import { findProductByPath } from '../utils/apiHelpers';
import { flattenConfiguredProducts, loadStoreConfig } from '../utils/storeConfig';

// Cache for products.json to avoid repeated fetches
let productsCache = null;
let productsCachePromise = null;

async function loadProductsJson() {
  if (productsCache) return productsCache;
  if (productsCachePromise) return productsCachePromise;
  
  productsCachePromise = (async () => {
    let remoteProducts = [];

    try {
      const storeConfig = await loadStoreConfig();
      remoteProducts = flattenConfiguredProducts(storeConfig);
    } catch (error) {
      console.warn('Failed to load products.json:', error);
    }

    productsCache = remoteProducts;
    return remoteProducts;
  })();
  
  return productsCachePromise;
}

export default function useApi() {
  const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  async function get(path) {
    // Try to fetch from API first, but fallback to products.json if unavailable
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(`${baseUrl}${path}`, {
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // If API is unavailable, use products.json
      console.log('API unavailable, using products.json');
    }
    
    // Fallback to products.json
    if (path === '/products' || path.startsWith('/products/')) {
      const products = await loadProductsJson();
      const productMatch = findProductByPath(path, products);

      if (productMatch) {
        return productMatch;
      }

      if (path.startsWith('/products/')) {
        const id = path.split('/products/')[1];
        throw new Error(`Product ${id} not found`);
      }
    }
    
    throw new Error(`No data available for ${path}`);
  }

  async function post(path, body) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body ?? {}),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`POST ${path} failed: ${response.status} ${text}`);
    }
    return response.json();
  }

  return { get, post };
}


