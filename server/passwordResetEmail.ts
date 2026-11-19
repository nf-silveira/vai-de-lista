/** Remetente de teste do Resend: só entrega para o dono da conta. */
export const DEFAULT_RESET_EMAIL_FROM = 'Vai de Lista <onboarding@resend.dev>'

export interface PasswordResetEmail {
  from: string
  to: string
  subject: string
  text: string
}

export interface ResetEmailClient {
  emails: {
    send(email: PasswordResetEmail): Promise<{ error: { message: string } | null }>
  }
}

export interface PasswordResetEmailDeps {
  client: ResetEmailClient | null
  from: string
  isProduction: boolean
  warn?: (message: string) => void
}

export type SendPasswordResetEmail = (email: string, url: string) => Promise<void>

export function createPasswordResetEmailSender({
  client,
  from,
  isProduction,
  warn = console.warn,
}: PasswordResetEmailDeps): SendPasswordResetEmail {
  return async function sendPasswordResetEmail(email: string, url: string): Promise<void> {
    if (!client) {
      if (isProduction) {
        throw new Error('RESEND_API_KEY não configurada: não é possível enviar o e-mail.')
      }

      warn(`[auth] RESEND_API_KEY ausente. Link de redefinição (dev): ${url}`)
      return
    }

    // O remetente de teste do Resend (onboarding@resend.dev) só entrega para o
    // dono da conta. Em produção o domínio precisa estar verificado no Resend e o
    // remetente definido em RESET_EMAIL_FROM, senão o e-mail nunca chega.
    if (isProduction && !from) {
      throw new Error(
        'RESET_EMAIL_FROM não configurado: defina um remetente de domínio verificado no Resend.',
      )
    }

    const { error } = await client.emails.send({
      from: from || DEFAULT_RESET_EMAIL_FROM,
      to: email,
      subject: 'Redefinir sua senha',
      text: `Use este link para definir uma nova senha. Ele expira em 1 hora:\n\n${url}\n\nSe você não pediu isso, ignore este e-mail.`,
    })

    if (error) {
      throw new Error(`Falha ao enviar o e-mail de redefinição: ${error.message}`)
    }
  }
}
