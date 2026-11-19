import { betterAuth } from 'better-auth'
import { username } from 'better-auth/plugins'
import { Resend } from 'resend'
import {
  isValidUsername,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../shared/username.js'
import { isAutoApproved, readAutoApprovedEmails } from './access.js'
import { pool, query } from './db.js'
import { createPasswordResetEmailSender } from './passwordResetEmail.js'

const autoApprovedEmails = readAutoApprovedEmails(process.env)
const isProduction = process.env.NODE_ENV === 'production'

const secret = process.env.BETTER_AUTH_SECRET ?? ''

if (isProduction && secret.length < 32) {
  throw new Error(
    'BETTER_AUTH_SECRET ausente ou curto demais. Use pelo menos 32 caracteres em produção.',
  )
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
  // O login é feito pelo nick; o e-mail existe para recuperação de senha.
  plugins: [
    username({
      minUsernameLength: USERNAME_MIN_LENGTH,
      maxUsernameLength: USERNAME_MAX_LENGTH,
      usernameValidator: isValidUsername,
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        // Toda conta nasce pendente e só entra na lista depois da aprovação do
        // administrador. Os e-mails de confiança já nascem aprovados.
        after: async (user) => {
          if (!isAutoApproved(user.email, autoApprovedEmails)) return

          await query(
            'update "user" set status = $1, "updatedAt" = now() where id = $2',
            ['active', user.id],
          )
        },
      },
    },
  },
})
