import { pool, query } from '../server/db.js'

async function run(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()

  if (email.length === 0) {
    throw new Error(
      'Defina ADMIN_EMAIL no .env.local com o e-mail da conta que será administradora.',
    )
  }

  const rows = await query<{ id: string; username: string | null }>(
    `update "user"
        set role = 'admin', status = 'active', ban_reason = null, "updatedAt" = now()
      where lower(email) = $1
      returning id, username`,
    [email],
  )

  const account = rows[0]

  if (!account) {
    throw new Error(
      `Nenhuma conta cadastrada com ${email}. Crie a conta antes de promovê-la.`,
    )
  }

  console.log(
    `Conta ${account.username ?? account.id} (${email}) agora é administradora ativa.`,
  )
}

run()
  .catch((error: unknown) => {
    console.error('Falha ao promover a conta:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
