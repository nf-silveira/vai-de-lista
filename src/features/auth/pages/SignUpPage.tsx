import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { signUp, useSession } from '../../../lib/auth-client'
import { AuthShell } from '../components/AuthShell/AuthShell'
import { describeSignUpError } from '../utils/describeAuthError'

const MIN_PASSWORD_LENGTH = 8

export function SignUpPage() {
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()
  const [name, setName] = useState('')
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

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }

    setIsSubmitting(true)

    const { error: signUpError } = await signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    })

    setIsSubmitting(false)

    if (signUpError) {
      setError(describeSignUpError(signUpError))
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <AuthShell
      title="Criar conta"
      hint="A conta dá acesso à mesma lista compartilhada da casa."
      onSubmit={handleSubmit}
      error={error}
      footer={
        <span>
          Já tem conta? <Link to="/login">Entrar</Link>
        </span>
      }
    >
      <div>
        <label className="form-label" htmlFor="name">
          Nome
        </label>
        <input
          id="name"
          type="text"
          className="form-control"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

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
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="form-text">Mínimo de {MIN_PASSWORD_LENGTH} caracteres.</p>
      </div>

      <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
        {isSubmitting ? 'Criando conta...' : 'Criar conta'}
      </button>
    </AuthShell>
  )
}
