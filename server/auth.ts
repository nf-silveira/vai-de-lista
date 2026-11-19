import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { Resend } from 'resend'
import { parseEmailList } from './access.js'
import { pool } from './db.js'
import { createPasswordResetEmailSender } from './passwordResetEmail.js'

function readAllowedEmails(): string[] {
  const candidates = [
    process.env.ALLOWED_EMAILS ?? '',
    process.env.SEED_USER_1_EMAIL ?? '',
    process.env.SEED_USER_2_EMAIL ?? '',
  ]

  return parseEmailList(candidates.join(','))
}

const allowedEmails = readAllowedEmails()
const isProduction = process.env.NODE_ENV === 'production'

const secret = process.env.BETTER_AUTH_SECRET ?? ''

if (isProduction && secret.length < 32) {
  throw new Error(
    'BETTER_AUTH_SECRET ausente ou curto demais. Use pelo menos 32 caracteres em produção.',
  )
}

function isSignUpAllowed(email: string): boolean {
  if (allowedEmails.includes(email)) {
    return true
  }

  const isLocalOrOptIn =
    process.env.ALLOW_PUBLIC_SIGNUP === 'true' || !isProduction

  return isLocalOrOptIn
}

const sendPasswordResetEmail = createPasswordResetEmailSender({
  client: process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null,
  from: process.env.RESET_EMAIL_FROM?.trim() ?? '',
  isProduction,
})

export const auth = betterAuth({
  database: pool,
  secret: secret || undefined,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? ''].filter(Boolean),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url)
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email.toLowerCase()

          if (!isSignUpAllowed(email)) {
            throw new APIError('FORBIDDEN', {
              message:
                'Cadastro desativado. Este e-mail não está na lista de contas autorizadas.',
            })
          }
        },
      },
    },
  },
})
