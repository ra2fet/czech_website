import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import './i18n'; // Import i18n configuration
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Suppress Stripe beacon errors (r.stripe.com) which are often blocked by ad-blockers
// and cause "Uncaught in promise" noise in the console.
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (
    event.reason.message?.includes('r.stripe.com') ||
    event.reason.message?.includes('m.stripe.com')
  )) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </Router>
    </I18nextProvider>
  </StrictMode>
);
