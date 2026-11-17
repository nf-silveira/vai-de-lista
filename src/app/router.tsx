import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PlaceholderPage } from '../components/PlaceholderPage/PlaceholderPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { ShoppingListPage } from '../features/shopping-list/pages/ShoppingListPage'
import { AppLayout } from './AppLayout'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <ShoppingListPage /> },
          {
            path: 'historico',
            element: (
              <PlaceholderPage
                title="Histórico"
                description="Suas compras finalizadas vão aparecer aqui para consulta e comparação."
              />
            ),
          },
          {
            path: 'comparar',
            element: (
              <PlaceholderPage
                title="Comparar preços"
                description="Em breve você poderá ver se o preço subiu ou caiu desde a última compra."
              />
            ),
          },
          {
            path: 'configuracoes',
            element: (
              <PlaceholderPage
                title="Configurações"
                description="Preferências da conta e da lista compartilhada."
              />
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
