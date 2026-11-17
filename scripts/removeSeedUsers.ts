import { parseEmailList } from '../server/access.js'
import { pool } from '../server/db.js'
import { removeSeedAccounts, selectSeedTargets } from '../server/seedCleanup.js'

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
  const { targets, ignored } = selectSeedTargets(seedEmails, memberEmails)

  for (const email of ignored) {
    console.log(`Ignorada, está em ALLOWED_EMAILS: ${email}`)
  }

  if (targets.length === 0) {
    console.log('Nada a remover.')
    return
  }

  const client = await pool.connect()

  try {
    await client.query('begin')

    const result = await removeSeedAccounts(client, targets)

    await client.query('commit')

    console.log(
      result.alreadyGone
        ? 'Nada a remover: as contas de seed já não existem.'
        : `Contas removidas: ${result.removed}`,
    )
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
