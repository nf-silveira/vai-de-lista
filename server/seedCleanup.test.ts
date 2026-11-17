import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  removeSeedAccounts,
  selectSeedTargets,
  type CleanupClient,
} from './seedCleanup.js'

interface FakeUser {
  id: string
  email: string
}

interface FakeRow {
  userId: string
}

class FakeDatabase implements CleanupClient {
  users: FakeUser[]
  sessions: FakeRow[]
  accounts: FakeRow[]
  deletes = 0

  constructor(users: FakeUser[]) {
    this.users = users
    this.sessions = users.map((user) => ({ userId: user.id }))
    this.accounts = users.map((user) => ({ userId: user.id }))
  }

  private idsIn(values: readonly unknown[] | undefined): string[] {
    const [list] = values ?? []

    return Array.isArray(list) ? (list as string[]) : []
  }

  async query<R extends object>(
    sql: string,
    values?: readonly unknown[],
  ): Promise<{ rows: R[] }> {
    const ids = this.idsIn(values)

    if (sql.startsWith('select id from "user"')) {
      const rows = this.users.filter((user) =>
        ids.includes(user.email.toLowerCase()),
      )

      return { rows: rows as unknown as R[] }
    }

    this.deletes += 1

    if (sql.startsWith('delete from session')) {
      this.sessions = this.sessions.filter((row) => !ids.includes(row.userId))
    } else if (sql.startsWith('delete from account')) {
      this.accounts = this.accounts.filter((row) => !ids.includes(row.userId))
    } else {
      this.users = this.users.filter((user) => !ids.includes(user.id))
    }

    return { rows: [] }
  }
}

const seedEmails = ['usuario1@vaidelista.app', 'usuario2@vaidelista.app']

describe('selectSeedTargets', () => {
  it('mantém na lista as contas que viraram membros da casa', () => {
    const { targets, ignored } = selectSeedTargets(seedEmails, [
      'usuario2@vaidelista.app',
    ])

    assert.deepEqual(targets, ['usuario1@vaidelista.app'])
    assert.deepEqual(ignored, ['usuario2@vaidelista.app'])
  })
})

describe('removeSeedAccounts', () => {
  it('apaga usuários, contas e sessões de seed', async () => {
    const database = new FakeDatabase([
      { id: 'seed-1', email: seedEmails[0] },
      { id: 'seed-2', email: seedEmails[1] },
      { id: 'owner', email: 'fecoder.dev@gmail.com' },
    ])

    const result = await removeSeedAccounts(database, seedEmails)

    assert.deepEqual(result, { removed: 2, alreadyGone: false })
    assert.deepEqual(database.users, [
      { id: 'owner', email: 'fecoder.dev@gmail.com' },
    ])
    assert.deepEqual(database.accounts, [{ userId: 'owner' }])
    assert.deepEqual(database.sessions, [{ userId: 'owner' }])
  })

  it('na segunda execução não remove nada e não dispara deletes', async () => {
    const database = new FakeDatabase([
      { id: 'seed-1', email: seedEmails[0] },
      { id: 'seed-2', email: seedEmails[1] },
    ])

    await removeSeedAccounts(database, seedEmails)
    const deletesAfterFirst = database.deletes

    const secondRun = await removeSeedAccounts(database, seedEmails)

    assert.deepEqual(secondRun, { removed: 0, alreadyGone: true })
    assert.equal(database.deletes, deletesAfterFirst)
    assert.deepEqual(database.users, [])
    assert.deepEqual(database.accounts, [])
    assert.deepEqual(database.sessions, [])
  })

  it('não toca no banco quando não há alvos', async () => {
    const database = new FakeDatabase([
      { id: 'owner', email: 'fecoder.dev@gmail.com' },
    ])

    const result = await removeSeedAccounts(database, [])

    assert.deepEqual(result, { removed: 0, alreadyGone: true })
    assert.equal(database.deletes, 0)
  })
})
