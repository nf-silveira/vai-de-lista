import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { signIn, useSession } from '../../../lib/auth-client'
import { AuthShell } from '../components/AuthShell/AuthShell'
import { describeSignInError } from '../utils/describeAuthError'

export function LoginPage() {
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
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

    const { error: signInError } = await signIn.username({
      username: username.trim(),
      password,
    })

    setIsSubmitting(false)

    if (signInError) {
      setError(describeSignInError(signInError))
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <AuthShell
      title="Entrar"
      hint="A lista é compartilhada entre as contas da casa."
      onSubmit={handleSubmit}
      error={error}
      footer={
        <span>
          Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </span>
      }
    >
      <div>
        <label className="form-label" htmlFor="username">
          Nick
        </label>
        <input
          id="username"
          type="text"
          className="form-control"
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
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

      <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </button>

      <Link to="/esqueci-senha" className="text-center">
        Esqueci minha senha
      </Link>
    </AuthShell>
  )
}
