import type {
  AccountState,
  AccountStatus,
  AccountSummary,
} from '../shared/account.js'
import { pool, query } from './db.js'

interface AccountRow {
  id: string
  name: string
  username: string | null
  email: string
  role: AccountState['role']
  status: AccountStatus
  createdAt: Date
}

const ACCOUNT_COLUMNS = 'id, name, username, email, role, status, "createdAt"'

function toAccountSummary(row: AccountRow): AccountSummary {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listAccounts(): Promise<AccountSummary[]> {
  const rows = await query<AccountRow>(
    `select ${ACCOUNT_COLUMNS} from "user" order by "createdAt" desc`,
  )

  return rows.map(toAccountSummary)
}

export async function findAccountById(
  id: string,
): Promise<AccountSummary | null> {
  const rows = await query<AccountRow>(
    `select ${ACCOUNT_COLUMNS} from "user" where id = $1`,
    [id],
  )

  return rows[0] ? toAccountSummary(rows[0]) : null
}

export async function findAccountState(
  id: string,
): Promise<AccountState | null> {
  const rows = await query<AccountState>(
    'select role, status from "user" where id = $1',
    [id],
  )

  return rows[0] ?? null
}

export async function setAccountStatus(
  id: string,
  status: AccountStatus,
  banReason: string | null = null,
): Promise<AccountSummary | null> {
  const client = await pool.connect()

  try {
    await client.query('begin')

    const { rows } = await client.query<AccountRow>(
      `update "user"
          set status = $1, ban_reason = $2, "updatedAt" = now()
        where id = $3
        returning ${ACCOUNT_COLUMNS}`,
      [status, status === 'banned' ? banReason : null, id],
    )

    if (status === 'banned') {
      await client.query('delete from session where "userId" = $1', [id])
    }

    await client.query('commit')

    return rows[0] ? toAccountSummary(rows[0]) : null
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

export async function deleteAccount(id: string): Promise<boolean> {
  const client = await pool.connect()

  try {
    await client.query('begin')
    await client.query('delete from verification where value = $1', [id])
    await client.query('delete from session where "userId" = $1', [id])
    await client.query('delete from account where "userId" = $1', [id])
    const removed = await client.query('delete from "user" where id = $1', [id])
    await client.query('commit')

    return (removed.rowCount ?? 0) > 0
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}
