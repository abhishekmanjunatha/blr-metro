import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'

// Render app first, then register service worker
const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
  
  // Register service worker after app is mounted (delayed)
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      import('./utils/pwa').then(({ registerServiceWorker }) => {
        registerServiceWorker();
      }).catch(console.error);
    });
  }
} else {
  console.error('Root element not found');
}
