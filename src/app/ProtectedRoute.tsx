import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState/LoadingState'
import { useAccount } from '../lib/account'
import { useSession } from '../lib/auth-client'
import { AccountStatusPage } from '../features/auth/pages/AccountStatusPage'

export function ProtectedRoute() {
  const { data: session, isPending } = useSession()
  const { account, status, errorMessage } = useAccount()
  const location = useLocation()

  if (isPending) {
    return <LoadingState message="Verificando sua sessão..." />
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (status === 'loading') {
    return <LoadingState message="Verificando o acesso..." />
  }

  if (status === 'error') {
    return (
      <div className="alert alert-danger m-3" role="alert">
        {errorMessage}
      </div>
    )
  }

  if (!account) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (account.status !== 'active') {
    return <AccountStatusPage status={account.status} />
  }

  return <Outlet />
}
