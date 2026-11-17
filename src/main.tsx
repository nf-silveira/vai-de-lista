import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import { router } from './app/router'
import './styles/theme.css'
import './styles/global.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento raiz #root não encontrado no HTML.')
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
