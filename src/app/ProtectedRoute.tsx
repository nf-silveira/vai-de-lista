import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState/LoadingState'
import { useSession } from '../lib/auth-client'

export function ProtectedRoute() {
  const { data: session, isPending } = useSession()
  const location = useLocation()

  if (isPending) {
    return <LoadingState message="Verificando sua sessão..." />
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
