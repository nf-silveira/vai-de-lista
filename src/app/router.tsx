import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PlaceholderPage } from '../components/PlaceholderPage/PlaceholderPage'
import { AdminPage } from '../features/admin/pages/AdminPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { SignUpPage } from '../features/auth/pages/SignUpPage'
import { ShoppingListPage } from '../features/shopping-list/pages/ShoppingListPage'
import { AppLayout } from './AppLayout'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <SignUpPage /> },
  { path: '/esqueci-senha', element: <ForgotPasswordPage /> },
  { path: '/redefinir-senha', element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <ShoppingListPage /> },
          { path: 'admin', element: <AdminPage /> },
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
