import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../../lib/auth-client'
import { AuthShell } from '../components/AuthShell/AuthShell'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSent, setIsSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: requestError } = await requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })

    setIsSubmitting(false)

    if (requestError) {
      setError(requestError.message ?? 'Não foi possível enviar o e-mail. Tente novamente.')
      return
    }

    setIsSent(true)
  }

  return (
    <AuthShell
      title="Recuperar senha"
      hint="Enviaremos um link para definir uma nova senha."
      onSubmit={handleSubmit}
      error={error}
      footer={
        <span>
          Lembrou a senha? <Link to="/login">Voltar ao login</Link>
        </span>
      }
    >
      {isSent ? (
        <div className="alert alert-success mb-0" role="status">
          Se este e-mail estiver cadastrado, você receberá o link em instantes.
        </div>
      ) : (
        <>
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

          <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar link'}
          </button>
        </>
      )}
    </AuthShell>
  )
}
