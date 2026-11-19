import type {
  ActiveList,
  PurchaseDetail,
  PurchaseSummary,
  ShoppingItem,
} from '../shared/shopping-list.js'
import { pool, query } from './db.js'
import { ITEM_COLUMNS, toShoppingItem, type ItemRow } from './items.js'
import { normalizePrice, normalizeProductKey } from './products.js'

export const DEFAULT_LIST_NAME = 'Lista da casa'

interface ListRow {
  id: string
  name: string
  status: 'active' | 'completed'
  created_at: Date
  completed_at: Date | null
}

interface SummaryRow {
  id: string
  name: string
  completed_at: Date
  item_count: number
  items_without_price: number
  total: string
}

const LIST_COLUMNS = 'id, name, status, created_at, completed_at'

const PURCHASE_SUMMARY_SELECT = `
  select l.id,
         l.name,
         l.completed_at,
         count(i.id)::int as item_count,
         count(i.id) filter (where i.unit_price is null)::int as items_without_price,
         coalesce(sum(i.quantity * i.unit_price), 0)::text as total
    from shopping_lists l
    left join shopping_list_items i on i.list_id = l.id
`

const PURCHASE_SUMMARY_GROUP_BY = 'group by l.id, l.name, l.completed_at'

function toPurchaseSummary(row: SummaryRow): PurchaseSummary {
  return {
    id: row.id,
    name: row.name,
    itemCount: row.item_count,
    itemsWithoutPrice: row.items_without_price,
    total: Number(row.total),
    purchasedAt: row.completed_at.toISOString(),
  }
}

function toPurchaseDetail(
  list: { id: string; name: string; completedAt: Date },
  items: ShoppingItem[],
): PurchaseDetail {
  return {
    id: list.id,
    name: list.name,
    itemCount: items.length,
    itemsWithoutPrice: items.filter((item) => item.unitPrice === null).length,
    total: items.reduce(
      (total, item) =>
        item.unitPrice === null ? total : total + item.quantity * item.unitPrice,
      0,
    ),
    purchasedAt: list.completedAt.toISOString(),
    items,
  }
}

/** A lista ativa é única por convenção; em caso de corrida vale a mais antiga. */
export async function getActiveList(): Promise<ActiveList | null> {
  const rows = await query<ActiveList>(
    `select id, name
       from shopping_lists
      where status = 'active'
      order by created_at asc
      limit 1`,
  )

  return rows[0] ?? null
}

/** Cria a lista ativa na primeira visita depois de uma finalização. */
export async function ensureActiveList(): Promise<ActiveList> {
  const existing = await getActiveList()

  if (existing) return existing

  await query(
    'insert into shopping_lists (name, status) values ($1, $2)',
    [DEFAULT_LIST_NAME, 'active'],
  )

  const created = await getActiveList()

  if (!created) {
    throw new Error('Não foi possível abrir a lista ativa.')
  }

  return created
}

export type FinalizeResult =
  | { ok: true; purchase: PurchaseDetail; alreadyCompleted: boolean }
  | { ok: false; reason: 'not_found' | 'empty' }

/**
 * Finaliza uma lista em transação: marca como concluída e grava um registro de
 * preço por item com preço conhecido. Repetir com o mesmo id devolve a compra
 * existente e não cria registros novos.
 */
export async function finalizePurchase(
  listId: string,
  userId: string,
): Promise<FinalizeResult> {
  const client = await pool.connect()

  try {
    await client.query('begin')

    const listResult = await client.query<ListRow>(
      `select ${LIST_COLUMNS} from shopping_lists where id = $1 for update`,
      [listId],
    )
    const list = listResult.rows[0]

    if (!list) {
      await client.query('rollback')
      return { ok: false, reason: 'not_found' }
    }

    const itemsResult = await client.query<ItemRow>(
      `select ${ITEM_COLUMNS}
         from shopping_list_items
        where list_id = $1
        order by created_at asc`,
      [listId],
    )
    const items = itemsResult.rows.map(toShoppingItem)

    if (list.status === 'completed' && list.completed_at) {
      await client.query('commit')
      return {
        ok: true,
        alreadyCompleted: true,
        purchase: toPurchaseDetail(
          { id: list.id, name: list.name, completedAt: list.completed_at },
          items,
        ),
      }
    }

    if (items.length === 0) {
      await client.query('rollback')
      return { ok: false, reason: 'empty' }
    }

    const completed = await client.query<{ completed_at: Date }>(
      `update shopping_lists
          set status = 'completed', completed_at = now(), updated_at = now()
        where id = $1
        returning completed_at`,
      [listId],
    )
    const completedAt = completed.rows[0].completed_at

    for (const item of items) {
      if (item.unitPrice === null) continue

      const normalized = normalizePrice(item.unit, item.unitPrice)

      await client.query(
        `insert into price_records
           (recorded_by, list_item_id, product_key, product_name, quantity,
            unit, unit_price, normalized_unit, normalized_unit_price,
            purchased_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (list_item_id) where list_item_id is not null do nothing`,
        [
          userId,
          item.id,
          normalizeProductKey(item.name),
          item.name,
          item.quantity,
          item.unit,
          item.unitPrice,
          normalized.unit,
          normalized.price,
          completedAt,
        ],
      )
    }

    await client.query('commit')

    return {
      ok: true,
      alreadyCompleted: false,
      purchase: toPurchaseDetail(
        { id: list.id, name: list.name, completedAt },
        items,
      ),
    }
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

export async function listPurchases(): Promise<PurchaseSummary[]> {
  const rows = await query<SummaryRow>(
    `${PURCHASE_SUMMARY_SELECT}
      where l.status = 'completed'
      ${PURCHASE_SUMMARY_GROUP_BY}
      order by l.completed_at desc`,
  )

  return rows.map(toPurchaseSummary)
}

export async function findPurchase(id: string): Promise<PurchaseDetail | null> {
  const rows = await query<SummaryRow>(
    `${PURCHASE_SUMMARY_SELECT}
      where l.status = 'completed' and l.id = $1
      ${PURCHASE_SUMMARY_GROUP_BY}`,
    [id],
  )

  const summary = rows[0]

  if (!summary) return null

  const items = await query<ItemRow>(
    `select ${ITEM_COLUMNS}
       from shopping_list_items
      where list_id = $1
      order by created_at asc`,
    [id],
  )

  return {
    ...toPurchaseSummary(summary),
    items: items.map(toShoppingItem),
  }
}

export type DeletePurchaseResult = 'deleted' | 'not_found' | 'active'

/** Excluir a compra remove o retrato, mas `price_records` permanecem. */
export async function deletePurchase(
  id: string,
): Promise<DeletePurchaseResult> {
  const deleted = await query<{ id: string }>(
    `delete from shopping_lists
      where id = $1 and status = 'completed'
      returning id`,
    [id],
  )

  if (deleted.length > 0) return 'deleted'

  const rows = await query<{ status: string }>(
    'select status from shopping_lists where id = $1',
    [id],
  )

  if (!rows[0]) return 'not_found'

  return rows[0].status === 'active' ? 'active' : 'not_found'
}
