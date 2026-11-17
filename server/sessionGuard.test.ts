import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { describe, it } from 'node:test'
import express from 'express'
import { createSessionGuard, type SessionLike } from './sessionGuard.js'

interface GuardOptions {
  session: SessionLike | null
  memberEmails: string[]
  isProduction: boolean
}

const member: SessionLike = {
  user: { id: 'user-1', email: 'casa@exemplo.com' },
}

const outsider: SessionLike = {
  user: { id: 'user-2', email: 'intruso@exemplo.com' },
}

async function request(
  options: GuardOptions,
): Promise<{ status: number; body: { error?: string; ok?: boolean } }> {
  const app = express()

  app.get(
    '/items',
    createSessionGuard({
      getSession: async () => options.session,
      memberEmails: options.memberEmails,
      isProduction: options.isProduction,
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
      memberEmails: [member.user.email],
      isProduction: true,
    })

    assert.equal(status, 401)
    assert.match(body.error ?? '', /Sessão expirada/)
  })

  it('em produção responde 403 para conta fora da allowlist', async () => {
    const { status, body } = await request({
      session: outsider,
      memberEmails: [member.user.email],
      isProduction: true,
    })

    assert.equal(status, 403)
    assert.match(body.error ?? '', /não tem acesso à lista/)
  })

  it('em produção responde 403 quando a allowlist está vazia', async () => {
    const { status } = await request({
      session: member,
      memberEmails: [],
      isProduction: true,
    })

    assert.equal(status, 403)
  })

  it('libera a conta da casa em produção', async () => {
    const { status, body } = await request({
      session: member,
      memberEmails: [member.user.email],
      isProduction: true,
    })

    assert.equal(status, 200)
    assert.deepEqual(body, { ok: true })
  })

  it('fora de produção libera qualquer sessão sem allowlist', async () => {
    const { status } = await request({
      session: outsider,
      memberEmails: [],
      isProduction: false,
    })

    assert.equal(status, 200)
  })
})
