import type { AccountSummary } from '../../../../../shared/account'
import {
  ACCOUNT_STATUS_BADGES,
  ACCOUNT_STATUS_LABELS,
} from '../../../../../shared/account'
import styles from './AccountRow.module.css'

interface AccountRowProps {
  account: AccountSummary
  isSelf: boolean
  isBusy: boolean
  onApprove: (account: AccountSummary) => void
  onBan: (account: AccountSummary) => void
  onUnban: (account: AccountSummary) => void
  onRemove: (account: AccountSummary) => void
}

export function AccountRow({
  account,
  isSelf,
  isBusy,
  onApprove,
  onBan,
  onUnban,
  onRemove,
}: AccountRowProps) {
  const displayName = account.username ?? account.name

  return (
    <li className={`list-group-item ${styles.row}`}>
      <div className={styles.identity}>
        <p className={styles.name}>
          {displayName}
          {isSelf && <span className={styles.self}> (você)</span>}
        </p>
        <p className={styles.email}>{account.email}</p>
        <div className={styles.badges}>
          <span className={`badge ${ACCOUNT_STATUS_BADGES[account.status]}`}>
            {ACCOUNT_STATUS_LABELS[account.status]}
          </span>
          {account.role === 'admin' && (
            <span className="badge text-bg-primary">Admin</span>
          )}
        </div>
      </div>

      {!isSelf && (
        <div className={styles.actions}>
          {account.status === 'pending' && (
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={() => onApprove(account)}
              disabled={isBusy}
            >
              Aprovar
            </button>
          )}

          {account.status === 'active' && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => onBan(account)}
              disabled={isBusy}
            >
              Banir
            </button>
          )}

          {account.status === 'banned' && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onUnban(account)}
              disabled={isBusy}
            >
              Desbanir
            </button>
          )}

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => onRemove(account)}
            disabled={isBusy}
          >
            Excluir
          </button>
        </div>
      )}
    </li>
  )
}
