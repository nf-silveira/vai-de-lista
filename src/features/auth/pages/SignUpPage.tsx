import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  isValidUsername,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../../../../shared/username'
import { signUp, useSession } from '../../../lib/auth-client'
import { AuthShell } from '../components/AuthShell/AuthShell'
import { describeSignUpError } from '../utils/describeAuthError'

const MIN_PASSWORD_LENGTH = 8

export function SignUpPage() {
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
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

    if (!isValidUsername(username)) {
      setError(
        `O nick precisa ter de ${USERNAME_MIN_LENGTH} a ${USERNAME_MAX_LENGTH} caracteres, com letras, números, ponto ou _.`,
      )
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }

    setIsSubmitting(true)

    const { error: signUpError } = await signUp.email({
      name: username.trim(),
      email: email.trim(),
      password,
      username: username.trim(),
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
      hint="O cadastro precisa ser aprovado pelo administrador antes de acessar a lista."
      onSubmit={handleSubmit}
      error={error}
      footer={
        <span>
          Já tem conta? <Link to="/login">Entrar</Link>
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
          minLength={USERNAME_MIN_LENGTH}
          maxLength={USERNAME_MAX_LENGTH}
          pattern="[A-Za-z0-9._]+"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <p className="form-text">
          De {USERNAME_MIN_LENGTH} a {USERNAME_MAX_LENGTH} caracteres: letras, números, ponto ou _.
        </p>
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
        <p className="form-text">Usado para recuperar a senha.</p>
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
