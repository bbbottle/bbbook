import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SWRConfig } from 'swr'
import App from './app/App'
import { apiLoadingMiddleware } from './shared/api/loading.js'
import './i18n'
import './index.css'

const swrConfig = { use: [apiLoadingMiddleware] }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SWRConfig value={swrConfig}>
      <App />
    </SWRConfig>
  </StrictMode>
)
