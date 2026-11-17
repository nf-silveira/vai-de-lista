import { parseEmailList } from '../server/access.js'
import { pool } from '../server/db.js'

function readSeedEmails(): string[] {
  const candidates = [
    process.env.SEED_USER_1_EMAIL ?? '',
    process.env.SEED_USER_2_EMAIL ?? '',
  ]

  return parseEmailList(candidates.join(','))
}

async function run(): Promise<void> {
  const seedEmails = readSeedEmails()

  if (seedEmails.length === 0) {
    throw new Error(
      'Defina SEED_USER_1_EMAIL e SEED_USER_2_EMAIL no .env.local para saber quem remover.',
    )
  }

  const memberEmails = parseEmailList(process.env.ALLOWED_EMAILS)
  const targets = seedEmails.filter((email) => !memberEmails.includes(email))

  for (const email of seedEmails.filter((email) => memberEmails.includes(email))) {
    console.log(`Ignorada, está em ALLOWED_EMAILS: ${email}`)
  }

  if (targets.length === 0) {
    console.log('Nada a remover.')
    return
  }

  const client = await pool.connect()

  try {
    await client.query('begin')

    const userIds = (
      await client.query<{ id: string }>(
        'select id from "user" where lower(email) = any($1::text[])',
        [targets],
      )
    ).rows.map((row) => row.id)

    if (userIds.length === 0) {
      await client.query('commit')
      console.log('Nada a remover: as contas de seed já não existem.')
      return
    }

    await client.query('delete from session where "userId" = any($1::text[])', [
      userIds,
    ])
    await client.query('delete from account where "userId" = any($1::text[])', [
      userIds,
    ])
    await client.query('delete from "user" where id = any($1::text[])', [
      userIds,
    ])

    await client.query('commit')
    console.log(`Contas removidas: ${userIds.length}`)
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

run()
  .catch((error: unknown) => {
    console.error('Falha ao remover as contas de seed:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
