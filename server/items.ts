import type {
  ItemUnit,
  NewShoppingItem,
  ShoppingItem,
  ShoppingItemPatch,
} from '../shared/shopping-list.js'
import { query } from './db.js'

export interface ItemRow {
  id: string
  product_name: string
  quantity: string
  unit: ItemUnit
  unit_price: string | null
  is_collected: boolean
  created_at: Date
}

export const ITEM_COLUMNS =
  'id, product_name, quantity, unit, unit_price, is_collected, created_at'

export function toShoppingItem(row: ItemRow): ShoppingItem {
  return {
    id: row.id,
    name: row.product_name,
    quantity: Number(row.quantity),
    unit: row.unit,
    unitPrice: row.unit_price === null ? null : Number(row.unit_price),
    isChecked: row.is_collected,
    createdAt: row.created_at.toISOString(),
  }
}

export async function listShoppingItems(
  listId: string,
): Promise<ShoppingItem[]> {
  const rows = await query<ItemRow>(
    `select ${ITEM_COLUMNS}
       from shopping_list_items
      where list_id = $1
      order by is_collected asc, created_at asc`,
    [listId],
  )

  return rows.map(toShoppingItem)
}

export async function createShoppingItem(
  listId: string,
  item: NewShoppingItem,
): Promise<ShoppingItem> {
  const [row] = await query<ItemRow>(
    `insert into shopping_list_items
       (list_id, product_name, quantity, unit, unit_price)
     values ($1, $2, $3, $4, $5)
     returning ${ITEM_COLUMNS}`,
    [listId, item.name, item.quantity, item.unit ?? 'un', item.unitPrice],
  )

  return toShoppingItem(row)
}

export async function updateShoppingItem(
  listId: string,
  id: string,
  patch: ShoppingItemPatch,
): Promise<ShoppingItem | null> {
  const assignments: string[] = []
  const values: unknown[] = []

  function assign(column: string, value: unknown): void {
    values.push(value)
    assignments.push(`${column} = $${values.length}`)
  }

  if (patch.name !== undefined) assign('product_name', patch.name)
  if (patch.quantity !== undefined) assign('quantity', patch.quantity)
  if (patch.unit !== undefined) assign('unit', patch.unit)
  if (patch.unitPrice !== undefined) assign('unit_price', patch.unitPrice)
  if (patch.isChecked !== undefined) assign('is_collected', patch.isChecked)

  assignments.push('updated_at = now()')
  values.push(id)
  values.push(listId)

  const [row] = await query<ItemRow>(
    `update shopping_list_items
        set ${assignments.join(', ')}
      where id = $${values.length - 1}
        and list_id = $${values.length}
      returning ${ITEM_COLUMNS}`,
    values,
  )

  return row ? toShoppingItem(row) : null
}

export async function deleteShoppingItem(
  listId: string,
  id: string,
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `delete from shopping_list_items
      where id = $1
        and list_id = $2
      returning id`,
    [id, listId],
  )

  return rows.length > 0
}
