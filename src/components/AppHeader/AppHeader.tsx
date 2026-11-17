import { APP_NAME, APP_SLOGAN } from '../../config/brand'
import styles from './AppHeader.module.css'

interface AppHeaderProps {
  userName?: string
  onSignOut: () => void
  isSigningOut?: boolean
}

export function AppHeader({
  userName,
  onSignOut,
  isSigningOut = false,
}: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <h1 className={styles.title}>{APP_NAME}</h1>
        <p className={styles.slogan}>{APP_SLOGAN}</p>
      </div>

      <div className={styles.account}>
        <span className={styles.userName}>{userName}</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={onSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </header>
  )
}
