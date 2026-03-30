import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found!');
}

const root = createRoot(rootElement);

console.log('main.jsx loaded, starting React render...');

try {
  root.render(
    <React.StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
  console.log('✓ React app rendered successfully');
} catch (error) {
  console.error('✗ Failed to render app:', error);
  rootElement.style.backgroundColor = '#fff';
  rootElement.style.padding = '40px';
  rootElement.innerHTML = `
    <div style="padding: 40px; text-align: center; font-family: Arial; background: white; min-height: 100vh;">
      <h1 style="color: red;">Failed to Load App</h1>
      <p><strong>Error:</strong> ${error.message}</p>
      <pre style="text-align: left; background: #f5f5f5; padding: 20px; border-radius: 4px;">${error.stack}</pre>
      <p>Check the console (F12) for more details.</p>
    </div>
  `;
}


