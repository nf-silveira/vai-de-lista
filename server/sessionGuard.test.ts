import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { describe, it } from 'node:test'
import express from 'express'
import type { AccountState } from '../shared/account.js'
import { createSessionGuard, type SessionLike } from './sessionGuard.js'

interface GuardOptions {
  session: SessionLike | null
  account: AccountState | null
  requireActive?: boolean
}

const member: SessionLike = {
  user: { id: 'user-1', email: 'casa@exemplo.com' },
}

const active: AccountState = { role: 'user', status: 'active' }

async function request(
  options: GuardOptions,
): Promise<{
  status: number
  body: { error?: string; code?: string; ok?: boolean }
}> {
  const app = express()

  app.get(
    '/items',
    createSessionGuard({
      getSession: async () => options.session,
      getAccountState: async () => options.account,
      requireActive: options.requireActive,
    }),
    (_req, res) => {
      res.json({ ok: true })
    },
  )

  const server = app.listen(0)

  try {
    const { port } = server.address() as AddressInfo
    const response = await fetch(`http://127.0.0.1:${port}/items`)
    const body = (await response.json()) as {
      error?: string
      code?: string
      ok?: boolean
    }

    return { status: response.status, body }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

describe('requireSession', () => {
  it('responde 401 sem sessão', async () => {
    const { status, body } = await request({
      session: null,
      account: active,
    })

    assert.equal(status, 401)
    assert.match(body.error ?? '', /Sessão expirada/)
  })

  it('responde 401 quando a conta da sessão não existe mais', async () => {
    const { status } = await request({ session: member, account: null })

    assert.equal(status, 401)
  })

  it('responde 403 com código para cadastro pendente', async () => {
    const { status, body } = await request({
      session: member,
      account: { role: 'user', status: 'pending' },
    })

    assert.equal(status, 403)
    assert.equal(body.code, 'ACCOUNT_PENDING')
    assert.match(body.error ?? '', /aguardando aprovação/)
  })

  it('responde 403 com código para conta banida', async () => {
    const { status, body } = await request({
      session: member,
      account: { role: 'user', status: 'banned' },
    })

    assert.equal(status, 403)
    assert.equal(body.code, 'ACCOUNT_BANNED')
  })

  it('libera conta ativa', async () => {
    const { status, body } = await request({ session: member, account: active })

    assert.equal(status, 200)
    assert.deepEqual(body, { ok: true })
  })

  it('deixa a pendência passar quando a rota só lê o perfil', async () => {
    const { status } = await request({
      session: member,
      account: { role: 'user', status: 'pending' },
      requireActive: false,
    })

    assert.equal(status, 200)
  })
})
