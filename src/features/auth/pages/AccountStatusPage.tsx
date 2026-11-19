import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AccountStatus } from '../../../../shared/account'
import { resetAccountCache } from '../../../lib/account'
import { signOut } from '../../../lib/auth-client'
import styles from './AccountStatusPage.module.css'

interface AccountStatusPageProps {
  status: Exclude<AccountStatus, 'active'>
}

const COPY: Record<
  Exclude<AccountStatus, 'active'>,
  { title: string; message: string }
> = {
  pending: {
    title: 'Cadastro aguardando aprovação',
    message:
      'Sua conta foi criada. O administrador da lista precisa aprovar o cadastro antes de você entrar.',
  },
  banned: {
    title: 'Acesso bloqueado',
    message:
      'Esta conta foi banida pelo administrador e não acessa mais a lista.',
  },
}

export function AccountStatusPage({ status }: AccountStatusPageProps) {
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const copy = COPY[status]

  async function handleSignOut() {
    setIsSigningOut(true)

    try {
      await signOut()
      resetAccountCache()
      navigate('/login', { replace: true })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={`card ${styles.card}`}>
        <div className="card-body d-flex flex-column gap-3">
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.message}>{copy.message}</p>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      </div>
    </div>
  )
}
