import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { APP_NAME, APP_SLOGAN } from '../../../config/brand'
import { signIn, useSession } from '../../../lib/auth-client'
import styles from './LoginPage.module.css'

function describeSignInError(error: { status?: number; message?: string }): string {
  if (error.status === 401) {
    return 'E-mail ou senha inválidos.'
  }

  if (error.status === 403) {
    return 'Este e-mail não está autorizado a acessar a lista.'
  }

  return error.message ?? 'Não foi possível entrar. Tente novamente.'
}

export function LoginPage() {
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isPending && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: signInError } = await signIn.email({ email, password })

    setIsSubmitting(false)

    if (signInError) {
      setError(describeSignInError(signInError))
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div className={styles.shell}>
      <header className={styles.brand}>
        <h1 className={styles.title}>{APP_NAME}</h1>
        <p className={styles.slogan}>{APP_SLOGAN}</p>
      </header>

      <form className={`card shadow-sm ${styles.card}`} onSubmit={handleSubmit}>
        <div className="card-body d-flex flex-column gap-3">
          <div>
            <h2 className={styles.cardTitle}>Entrar</h2>
            <p className={styles.cardHint}>
              A lista é compartilhada entre as duas contas da casa.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 mb-0" role="alert">
              {error}
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>

        </div>
      </form>
    </div>
  )
}
