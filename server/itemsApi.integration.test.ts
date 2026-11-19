import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { describe, it } from 'node:test'
import type { ShoppingItem } from '../shared/shopping-list.js'

const email = `items-api-${Date.now()}@example.com`
const username = `items${Date.now()}`
const password = 'items-pass-123'
const itemName = `Teste API ${Date.now()}`

interface ItemsPayload {
  items: ShoppingItem[]
}

interface ItemPayload {
  item: ShoppingItem
}

/**
 * Exercita as rotas como o navegador faz: HTTP de verdade, cookie de sessão do
 * Better Auth e banco de `DATABASE_URL`. O cadastro nasce pendente, então o
 * teste aprova a conta direto no banco antes de chamar a API. Sem `DATABASE_URL`
 * (como no CI do `npm run verify`) o teste é pulado.
 */
describe('API de itens', {
  skip: process.env.DATABASE_URL
    ? false
    : 'Defina DATABASE_URL (npm run test:auth) para rodar o teste de integração.',
}, () => {
  it('exige sessão, rejeita payload inválido e faz o CRUD completo', async () => {
    const { app } = await import('./app.js')
    const { auth } = await import('./auth.js')
    const { pool } = await import('./db.js')

    const userIdLookup = 'select id from "user" where email = $1'

    async function cleanup(): Promise<void> {
      await pool.query('delete from shopping_items where name = $1', [itemName])
      await pool.query(
        `delete from session where "userId" in (${userIdLookup})`,
        [email],
      )
      await pool.query(
        `delete from account where "userId" in (${userIdLookup})`,
        [email],
      )
      await pool.query(
        `delete from verification where value in (${userIdLookup})`,
        [email],
      )
      await pool.query('delete from "user" where email = $1', [email])
    }

    await cleanup()

    const server = app.listen(0)
    const { port } = server.address() as AddressInfo
    const baseUrl = `http://127.0.0.1:${port}`
    let cookie = ''

    function call(path: string, init: RequestInit = {}): Promise<Response> {
      return fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
        },
      })
    }

    try {
      const anonymousRead = await call('/api/items')
      assert.equal(anonymousRead.status, 401, 'sem sessão deve responder 401')

      const anonymousWrite = await call('/api/items', {
        method: 'POST',
        body: JSON.stringify({ name: itemName }),
      })
      assert.equal(anonymousWrite.status, 401)

      await auth.api.signUpEmail({
        body: { email, password, name: username, username },
      })
      await pool.query('update "user" set status = $2 where email = $1', [
        email,
        'active',
      ])

      const signIn = await auth.api.signInUsername({
        body: { username, password },
        asResponse: true,
      })
      const setCookie = signIn.headers.get('set-cookie')
      assert.ok(setCookie, 'o login deveria devolver o cookie de sessão')
      cookie = setCookie.split(';')[0] ?? ''

      const invalidPayload = await call('/api/items', {
        method: 'POST',
        body: JSON.stringify({ name: 'x' }),
      })
      assert.equal(invalidPayload.status, 400)

      const created = await call('/api/items', {
        method: 'POST',
        body: JSON.stringify({
          name: itemName,
          quantity: 2,
          unit: 'kg',
          unitPrice: 12.5,
        }),
      })
      assert.equal(created.status, 201)
      const { item } = (await created.json()) as ItemPayload

      const listed = await call('/api/items')
      assert.equal(listed.status, 200)
      const { items } = (await listed.json()) as ItemsPayload
      assert.ok(items.some((candidate) => candidate.id === item.id))

      const patched = await call(`/api/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: 3, isChecked: true }),
      })
      assert.equal(patched.status, 200)
      const updated = (await patched.json()) as ItemPayload
      assert.equal(updated.item.quantity, 3)
      assert.equal(updated.item.isChecked, true)

      const removed = await call(`/api/items/${item.id}`, { method: 'DELETE' })
      assert.equal(removed.status, 204)

      const afterDelete = (await (await call('/api/items')).json()) as ItemsPayload
      assert.equal(
        afterDelete.items.some((candidate) => candidate.id === item.id),
        false,
      )
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
      await cleanup()
      await pool.end()
    }
  })
})
