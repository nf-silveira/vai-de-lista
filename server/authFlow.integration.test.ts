import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const email = `auth-flow-${Date.now()}@example.com`
const initialPassword = 'initial-pass-123'
const newPassword = 'reset-pass-456'

/**
 * Testa o fluxo real contra o banco de `DATABASE_URL`: cadastro, login,
 * pedido de redefinição, troca de senha e login com a senha nova. Como ele
 * cria e apaga uma conta, roda apenas quando há um banco configurado — o CI
 * (`npm run verify`) não define `DATABASE_URL` e cai no `skip`.
 */
describe('fluxo de login e redefinição de senha', {
  skip: process.env.DATABASE_URL
    ? false
    : 'Defina DATABASE_URL (npm run test:auth) para rodar o teste de integração.',
}, () => {
  it('cria a conta, entra, redefine a senha e entra com a nova', async () => {
    const { auth } = await import('./auth.js')
    const { pool } = await import('./db.js')

    const userIdLookup = 'select id from "user" where email = $1'

    async function cleanup(): Promise<void> {
      await pool.query(`delete from session where "userId" in (${userIdLookup})`, [email])
      await pool.query(`delete from account where "userId" in (${userIdLookup})`, [email])
      await pool.query(`delete from verification where value in (${userIdLookup})`, [email])
      await pool.query('delete from "user" where email = $1', [email])
    }

    await cleanup()

    try {
      await auth.api.signUpEmail({
        body: { email, password: initialPassword, name: 'Teste de integração' },
      })

      const session = await auth.api.signInEmail({
        body: { email, password: initialPassword },
      })
      assert.equal(session.user.email, email)

      const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:5174'
      await auth.api.requestPasswordReset({
        body: { email, redirectTo: `${baseUrl}/redefinir-senha` },
      })

      const { rows } = await pool.query<{ identifier: string }>(
        `select identifier from verification
         where identifier like 'reset-password:%'
           and value = (${userIdLookup})
         order by "createdAt" desc limit 1`,
        [email],
      )
      const token = rows[0]?.identifier.replace('reset-password:', '')
      assert.ok(token, 'o pedido de redefinição não gerou token')

      await auth.api.resetPassword({ body: { newPassword, token } })

      const renewed = await auth.api.signInEmail({
        body: { email, password: newPassword },
      })
      assert.equal(renewed.user.email, email)

      await assert.rejects(
        auth.api.signInEmail({ body: { email, password: initialPassword } }),
        'a senha antiga deveria ser recusada depois da redefinição',
      )
    } finally {
      await cleanup()
      await pool.end()
    }
  })
})
