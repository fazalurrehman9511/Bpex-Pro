import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/** Delay SW so first paint / LCP is not competing with service worker install */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const register = () => {
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({ immediate: false })
      })
      .catch(() => {})
  }
  if (document.readyState === 'complete') {
    window.setTimeout(register, 2500)
  } else {
    window.addEventListener('load', () => window.setTimeout(register, 2500), { once: true })
  }
}
