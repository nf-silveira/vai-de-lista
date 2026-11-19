import { Navigate } from 'react-router-dom'
import { LoadingState } from '../../../components/LoadingState/LoadingState'
import { useAccount } from '../../../lib/account'
import { AccountRow } from '../components/AccountRow/AccountRow'
import { useAdminAccounts } from '../hooks/useAdminAccounts'
import styles from './AdminPage.module.css'

export function AdminPage() {
  const { account: currentAccount, status: accountStatus } = useAccount()
  const {
    users,
    status,
    errorMessage,
    busyUserId,
    approve,
    ban,
    unban,
    remove,
  } = useAdminAccounts()

  if (accountStatus === 'ready' && currentAccount?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  if (status === 'loading') {
    return <LoadingState message="Carregando contas..." />
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>Contas</h2>
        <p className={styles.hint}>
          Aprove cadastros, bana quem não deve acessar e exclua contas
          definitivamente.
        </p>
      </header>

      {errorMessage && (
        <div className="alert alert-danger py-2" role="alert">
          {errorMessage}
        </div>
      )}

      {users.length === 0 ? (
        <p className={styles.empty}>Nenhuma conta cadastrada.</p>
      ) : (
        <ul className={`list-group ${styles.list}`}>
          {users.map((user) => (
            <AccountRow
              key={user.id}
              account={user}
              isSelf={user.id === currentAccount?.id}
              isBusy={busyUserId === user.id}
              onApprove={approve}
              onBan={ban}
              onUnban={unban}
              onRemove={(account) => void remove(account)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
