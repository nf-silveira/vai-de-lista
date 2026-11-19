import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../../lib/auth-client'
import { AuthShell } from '../components/AuthShell/AuthShell'

const MIN_PASSWORD_LENGTH = 8

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }

    if (password !== confirmation) {
      setError('As senhas não coincidem.')
      return
    }

    if (!token) {
      setError('Link inválido. Solicite um novo.')
      return
    }

    setIsSubmitting(true)

    const { error: resetError } = await resetPassword({ newPassword: password, token })

    setIsSubmitting(false)

    if (resetError) {
      setError('Link inválido ou expirado. Solicite um novo.')
      return
    }

    setIsDone(true)
  }

  return (
    <AuthShell
      title="Nova senha"
      hint="Escolha uma senha com pelo menos 8 caracteres."
      onSubmit={handleSubmit}
      error={error}
      footer={
        <span>
          <Link to="/login">Voltar ao login</Link>
        </span>
      }
    >
      {isDone ? (
        <div className="alert alert-success mb-0" role="status">
          Senha redefinida. <Link to="/login">Entrar agora</Link>
        </div>
      ) : (
        <>
          <div>
            <label className="form-label" htmlFor="password">
              Nova senha
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
          </div>

          <div>
            <label className="form-label" htmlFor="confirmation">
              Confirmar senha
            </label>
            <input
              id="confirmation"
              type="password"
              className="form-control"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </>
      )}
    </AuthShell>
  )
}
