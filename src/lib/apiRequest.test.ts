import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { apiRequest } from './apiRequest'

const originalFetch = globalThis.fetch

function stubFetch(handler: () => Promise<Response>): void {
  globalThis.fetch = handler as typeof fetch
}

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('apiRequest', () => {
  it('devolve o JSON da resposta', async () => {
    stubFetch(async () => new Response(JSON.stringify({ ok: true })))

    const result = await apiRequest<{ ok: boolean }>('/api/teste')

    assert.deepEqual(result, { ok: true })
  })

  it('trata 204 como resposta vazia', async () => {
    stubFetch(async () => new Response(null, { status: 204 }))

    const result = await apiRequest<void>('/api/teste', { method: 'DELETE' })

    assert.equal(result, undefined)
  })

  it('usa a mensagem de erro devolvida pela API', async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ error: 'Sessão expirada.' }), {
          status: 401,
        }),
    )

    await assert.rejects(apiRequest('/api/teste'), /Sessão expirada\./)
  })

  it('explica falha de rede em português', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    await assert.rejects(apiRequest('/api/teste'), /Verifique sua internet/)
  })
})
