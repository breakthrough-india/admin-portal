import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

let App;
try {
  App = (await import('./App.jsx')).default;
} catch (e) {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fafafa">
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:2rem 2.5rem;max-width:560px;width:90%">
        <h1 style="margin:0 0 0.75rem;font-size:1.15rem;color:#dc2626">Configuration error</h1>
        <pre style="margin:0;font-size:0.8rem;white-space:pre-wrap;color:#374151">${e.message}</pre>
      </div>
    </div>`;
  throw e;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
