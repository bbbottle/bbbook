import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster, toast } from 'sonner'
import { SWRConfig } from 'swr'
import App from './app/App'
import { apiLoadingMiddleware } from './shared/api/loading.js'
import i18n from './i18n'
import { getErrorCode } from './shared/lib/errors.js'
import './index.css'

const swrConfig = {
  use: [apiLoadingMiddleware],
  onError: (error: unknown) => {
    const code = getErrorCode(error)
    toast.error(i18n.t(`errors.${code}`, { defaultValue: code }))
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SWRConfig value={swrConfig}>
      <App />
    </SWRConfig>
    <Toaster
      position="bottom-right"
      className="!z-40"
      toastOptions={{ className: '!rounded-none !border-ink' }}
    />
  </StrictMode>
)
