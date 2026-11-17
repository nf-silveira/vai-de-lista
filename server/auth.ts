import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { pool } from './db'

function readAllowedEmails(): string[] {
  const candidates = [
    ...(process.env.ALLOWED_EMAILS ?? '').split(','),
    process.env.SEED_USER_1_EMAIL ?? '',
    process.env.SEED_USER_2_EMAIL ?? '',
  ]

  return candidates
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
}

const allowedEmails = readAllowedEmails()

function isSignUpAllowed(email: string): boolean {
  if (allowedEmails.includes(email)) {
    return true
  }

  const isLocalOrOptIn =
    process.env.ALLOW_PUBLIC_SIGNUP === 'true' || process.env.NODE_ENV !== 'production'

  return isLocalOrOptIn
}

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
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
