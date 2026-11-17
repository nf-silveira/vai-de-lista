import type {
  ItemUnit,
  NewShoppingItem,
  ShoppingItem,
  ShoppingItemPatch,
} from '../shared/shopping-list.js'
import { query } from './db.js'

interface ShoppingItemRow {
  id: string
  name: string
  quantity: string
  unit: ItemUnit
  unit_price: string | null
  is_checked: boolean
  created_at: Date
}

function toShoppingItem(row: ShoppingItemRow): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    quantity: Number(row.quantity),
    unit: row.unit,
    unitPrice: row.unit_price === null ? null : Number(row.unit_price),
    isChecked: row.is_checked,
    createdAt: row.created_at.toISOString(),
  }
}

const ITEM_COLUMNS =
  'id, name, quantity, unit, unit_price, is_checked, created_at'

export async function listShoppingItems(): Promise<ShoppingItem[]> {
  const rows = await query<ShoppingItemRow>(
    `select ${ITEM_COLUMNS}
       from shopping_items
      order by is_checked asc, created_at asc`,
  )

  return rows.map(toShoppingItem)
}

export async function createShoppingItem(
  item: NewShoppingItem,
): Promise<ShoppingItem> {
  const [row] = await query<ShoppingItemRow>(
    `insert into shopping_items (name, quantity, unit, unit_price)
     values ($1, $2, $3, $4)
     returning ${ITEM_COLUMNS}`,
    [item.name, item.quantity, item.unit ?? 'un', item.unitPrice],
  )

  return toShoppingItem(row)
}

export async function updateShoppingItem(
  id: string,
  patch: ShoppingItemPatch,
): Promise<ShoppingItem | null> {
  const assignments: string[] = []
  const values: unknown[] = []

  function assign(column: string, value: unknown): void {
    values.push(value)
    assignments.push(`${column} = $${values.length}`)
  }

  if (patch.name !== undefined) assign('name', patch.name)
  if (patch.quantity !== undefined) assign('quantity', patch.quantity)
  if (patch.unit !== undefined) assign('unit', patch.unit)
  if (patch.unitPrice !== undefined) assign('unit_price', patch.unitPrice)
  if (patch.isChecked !== undefined) assign('is_checked', patch.isChecked)

  assignments.push('updated_at = now()')
  values.push(id)

  const [row] = await query<ShoppingItemRow>(
    `update shopping_items
        set ${assignments.join(', ')}
      where id = $${values.length}
      returning ${ITEM_COLUMNS}`,
    values,
  )

  return row ? toShoppingItem(row) : null
}

export async function deleteShoppingItem(id: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    'delete from shopping_items where id = $1 returning id',
    [id],
  )

  return rows.length > 0
}
