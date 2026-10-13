import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
import './index.css'
import { App } from './app/App'
import { ContaProvider } from './conta/ContaContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ContaProvider>
        <App />
      </ContaProvider>
    </BrowserRouter>
  </StrictMode>,
)
