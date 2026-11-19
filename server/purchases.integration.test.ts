import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { describe, it } from 'node:test'
import type {
  ProductComparison,
  ProductOption,
} from '../shared/comparison.js'
import type {
  PurchaseDetail,
  PurchaseSummary,
} from '../shared/shopping-list.js'

const email = `purchases-api-${Date.now()}@example.com`
const username = `purch${Date.now()}`
const password = 'purchases-pass-123'
const listName = `Compra teste ${Date.now()}`
const productName = `Produto teste ${Date.now()}`
const productWithoutPrice = `Sem preço ${Date.now()}`

interface PurchasePayload {
  purchase: PurchaseDetail
  alreadyCompleted: boolean
}

/**
 * Cria uma lista e itens direto no banco (sem tocar na lista ativa
 * compartilhada), finaliza pela API e confere o histórico, a idempotência e a
 * preservação dos registros de preço.
 */
describe('finalização e histórico', {
  skip: process.env.DATABASE_URL
    ? false
    : 'Defina DATABASE_URL (npm run test:auth) para rodar o teste de integração.',
}, () => {
  it('finaliza uma vez, não duplica preços e mantém o histórico', async () => {
    const { app } = await import('./app.js')
    const { auth } = await import('./auth.js')
    const { pool } = await import('./db.js')

    const userIdLookup = 'select id from "user" where email = $1'

    async function cleanup(): Promise<void> {
      await pool.query('delete from price_records where product_name = $1', [
        productName,
      ])
      await pool.query('delete from shopping_lists where name = $1', [listName])
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

      const listResult = await pool.query<{ id: string }>(
        'insert into shopping_lists (name, status) values ($1, $2) returning id',
        [listName, 'active'],
      )
      const listId = listResult.rows[0]?.id
      assert.ok(listId, 'a lista de teste não foi criada')

      const pricedItem = await pool.query<{ id: string }>(
        `insert into shopping_list_items
           (list_id, product_name, quantity, unit, unit_price)
         values ($1, $2, 2, 'kg', 12.5)
         returning id`,
        [listId, productName],
      )
      await pool.query(
        `insert into shopping_list_items
           (list_id, product_name, quantity, unit, unit_price)
         values ($1, $2, 1, 'un', null)`,
        [listId, productWithoutPrice],
      )
      const pricedItemId = pricedItem.rows[0]?.id
      assert.ok(pricedItemId, 'o item com preço não foi criado')

      const finished = await call('/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ listId }),
      })
      assert.equal(finished.status, 201)
      const first = (await finished.json()) as PurchasePayload
      assert.equal(first.purchase.itemCount, 2)
      assert.equal(first.purchase.itemsWithoutPrice, 1)
      assert.equal(first.purchase.total, 25)
      assert.equal(first.alreadyCompleted, false)

      const repeated = await call('/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ listId }),
      })
      assert.equal(repeated.status, 200)
      const second = (await repeated.json()) as PurchasePayload
      assert.equal(second.alreadyCompleted, true)
      assert.equal(second.purchase.id, first.purchase.id)

      const { rows: priceRows } = await pool.query<{ count: string }>(
        'select count(*) from price_records where list_item_id = $1',
        [pricedItemId],
      )
      assert.equal(
        priceRows[0]?.count,
        '1',
        'a finalização repetida não pode duplicar registros de preço',
      )

      const listed = await call('/api/purchases')
      assert.equal(listed.status, 200)
      const { purchases } = (await listed.json()) as {
        purchases: PurchaseSummary[]
      }
      assert.ok(purchases.some((purchase) => purchase.id === first.purchase.id))

      const detail = await call(`/api/purchases/${first.purchase.id}`)
      assert.equal(detail.status, 200)
      const detailed = (await detail.json()) as { purchase: PurchaseDetail }
      const registered = detailed.purchase.items.find(
        (item) => item.id === pricedItemId,
      )
      assert.equal(registered?.unitPrice, 12.5)
      assert.equal(registered?.quantity, 2)

      const productKey = productName.toLowerCase()
      const productsResponse = await call(
        `/api/products?search=${encodeURIComponent('Produto teste')}`,
      )
      assert.equal(productsResponse.status, 200)
      const { products } = (await productsResponse.json()) as {
        products: ProductOption[]
      }
      assert.ok(
        products.some((product) => product.productKey === productKey),
        'o produto finalizado deve aparecer na busca',
      )

      const comparisonResponse = await call(
        `/api/comparisons?productKey=${encodeURIComponent(productKey)}`,
      )
      assert.equal(comparisonResponse.status, 200)
      const { comparison } = (await comparisonResponse.json()) as {
        comparison: ProductComparison
      }
      assert.equal(comparison.current.unitPrice, 12.5)
      assert.equal(comparison.references.length, 3)
      assert.ok(
        comparison.references.every((reference) => reference.observation === null),
        'com uma única compra não deve haver referência comparável',
      )

      const removed = await call(`/api/purchases/${first.purchase.id}`, {
        method: 'DELETE',
      })
      assert.equal(removed.status, 204)

      const { rows: orphanRows } = await pool.query<{ count: string }>(
        `select count(*) from price_records
          where product_name = $1 and list_item_id is null`,
        [productName],
      )
      assert.equal(
        orphanRows[0]?.count,
        '1',
        'excluir a compra deve manter o registro de preço',
      )
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
      await cleanup()
      await pool.end()
    }
  })
})
