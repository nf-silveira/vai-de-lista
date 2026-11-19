import { hashPassword } from 'better-auth/crypto'
import { pool } from '../server/db.js'

const MIN_PASSWORD_LENGTH = 8

function readCredentials(): { email: string; password: string } {
  const email = (process.env.RESET_USER_EMAIL ?? '').trim().toLowerCase()
  const password = process.env.RESET_USER_PASSWORD ?? ''

  if (email.length === 0) {
    throw new Error('Defina RESET_USER_EMAIL no .env.local com o e-mail da conta.')
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Defina RESET_USER_PASSWORD com pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    )
  }

  return { email, password }
}

async function run(): Promise<void> {
  const { email, password } = readCredentials()
  const client = await pool.connect()

  try {
    await client.query('begin')

    const { rows } = await client.query<{ id: string }>(
      'select id from "user" where lower(email) = $1',
      [email],
    )
    const userId = rows[0]?.id

    if (!userId) {
      throw new Error(`Nenhuma conta cadastrada com o e-mail ${email}.`)
    }

    const passwordHash = await hashPassword(password)

    const updated = await client.query(
      'update account set password = $1, "updatedAt" = now() where "userId" = $2 and "providerId" = $3',
      [passwordHash, userId, 'credential'],
    )

    // Contas inseridas manualmente no banco não têm a linha de credencial que o
    // better-auth usa para validar a senha; criamos a linha no mesmo formato dele.
    if (updated.rowCount === 0) {
      await client.query(
        `insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         values (gen_random_uuid()::text, $1, $2, $1, $3, now(), now())`,
        [userId, 'credential', passwordHash],
      )
    }

    await client.query('delete from session where "userId" = $1', [userId])
    await client.query('commit')

    console.log(`Senha redefinida para ${email}. Todas as sessões foram encerradas.`)
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

run()
  .catch((error: unknown) => {
    console.error('Falha ao redefinir a senha:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
