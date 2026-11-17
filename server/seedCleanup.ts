export interface CleanupClient {
  query<R extends object>(
    sql: string,
    values?: readonly unknown[],
  ): Promise<{ rows: R[] }>
}

export interface SeedTargets {
  targets: string[]
  ignored: string[]
}

export interface SeedCleanupResult {
  removed: number
  alreadyGone: boolean
}

/**
 * As contas de seed só saem se não estiverem em `ALLOWED_EMAILS`: quem foi
 * promovido a membro da casa não pode ser apagado por um script de limpeza.
 */
export function selectSeedTargets(
  seedEmails: string[],
  memberEmails: string[],
): SeedTargets {
  return {
    targets: seedEmails.filter((email) => !memberEmails.includes(email)),
    ignored: seedEmails.filter((email) => memberEmails.includes(email)),
  }
}

export async function removeSeedAccounts(
  client: CleanupClient,
  targets: string[],
): Promise<SeedCleanupResult> {
  if (targets.length === 0) {
    return { removed: 0, alreadyGone: true }
  }

  const existing = await client.query<{ id: string }>(
    'select id from "user" where lower(email) = any($1::text[])',
    [targets],
  )
  const userIds = existing.rows.map((row) => row.id)

  if (userIds.length === 0) {
    return { removed: 0, alreadyGone: true }
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

  return { removed: userIds.length, alreadyGone: false }
}
