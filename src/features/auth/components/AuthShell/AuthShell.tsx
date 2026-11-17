import type { FormEvent, ReactNode } from 'react'
import { APP_NAME, APP_SLOGAN } from '../../../../config/brand'
import styles from './AuthShell.module.css'

interface AuthShellProps {
  title: string
  hint: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  error?: string | null
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ title, hint, onSubmit, error, children, footer }: AuthShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.brand}>
        <h1 className={styles.title}>{APP_NAME}</h1>
        <p className={styles.slogan}>{APP_SLOGAN}</p>
      </header>

      <form className={`card shadow-sm ${styles.card}`} onSubmit={onSubmit}>
        <div className="card-body d-flex flex-column gap-3">
          <div>
            <h2 className={styles.cardTitle}>{title}</h2>
            <p className={styles.cardHint}>{hint}</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 mb-0" role="alert">
              {error}
            </div>
          )}

          {children}

          <div className={styles.footer}>{footer}</div>
        </div>
      </form>
    </div>
  )
}
