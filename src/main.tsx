import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'

// Bloqueia Popunders de redes de anúncio (Adcash/Adsterra): interrompe a
// propagação do clique no container do React (fase de captura). Os listeners
// do React (em #root) continuam funcionando, mas o evento nunca sobe até o
// document/window, onde as libs de popunder escutam.
document
  .getElementById('root')
  ?.addEventListener('click', (e) => e.stopPropagation(), true)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
