import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from '@/App'
import { requestPersistentStorage } from '@/lib/persistence'
import '@/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root não encontrado.')

// Pedido único, no arranque: impede que o navegador descarte os dados do app
// sob pressão de espaço. Falha silenciosa é aceitável — o lembrete de backup
// em Ajustes é a rede de segurança que não depende do navegador cooperar.
void requestPersistentStorage()

createRoot(root).render(
  <StrictMode>
    {/* `basename` acompanha a base do build: sem isso as rotas quebram quando
        o app é servido em subdiretório (GitHub Pages). */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
