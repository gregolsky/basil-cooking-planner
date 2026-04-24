import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './styles/theme.css';
import './i18n/index';

// Apply persisted theme before first render to avoid FOUC
try {
  const raw = localStorage.getItem('family-cooking-planner');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.state?.theme === 'prl') document.documentElement.dataset.theme = 'prl';
  }
} catch { /* ignore */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
