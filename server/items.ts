import type { NewShoppingItem, ShoppingItem } from '../shared/shopping-list'
import { query } from './db'

interface ShoppingItemRow {
  id: string
  name: string
  quantity: string
  unit_price: string | null
  is_checked: boolean
  created_at: Date
}

function toShoppingItem(row: ShoppingItemRow): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    quantity: Number(row.quantity),
    unitPrice: row.unit_price === null ? null : Number(row.unit_price),
    isChecked: row.is_checked,
    createdAt: row.created_at.toISOString(),
  }
}

const ITEM_COLUMNS =
  'id, name, quantity, unit_price, is_checked, created_at'

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
    `insert into shopping_items (name, quantity, unit_price)
     values ($1, $2, $3)
     returning ${ITEM_COLUMNS}`,
    [item.name, item.quantity, item.unitPrice],
  )

  return toShoppingItem(row)
}

export async function setShoppingItemChecked(
  id: string,
  isChecked: boolean,
): Promise<ShoppingItem | null> {
  const [row] = await query<ShoppingItemRow>(
    `update shopping_items
        set is_checked = $2, updated_at = now()
      where id = $1
      returning ${ITEM_COLUMNS}`,
    [id, isChecked],
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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidItemId(id: string): boolean {
  return UUID_PATTERN.test(id)
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string }

export function validateNewItem(body: unknown): ValidationResult<NewShoppingItem> {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, message: 'Corpo da requisição inválido.' }
  }

  const { name, quantity, unitPrice } = body as Record<string, unknown>
  const trimmedName = typeof name === 'string' ? name.trim() : ''

  if (trimmedName.length < 2) {
    return { ok: false, message: 'Informe o nome do produto.' }
  }

  if (trimmedName.length > 80) {
    return { ok: false, message: 'O nome do produto deve ter até 80 caracteres.' }
  }

  const parsedQuantity = quantity === undefined ? 1 : Number(quantity)

  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return { ok: false, message: 'A quantidade deve ser maior que zero.' }
  }

  const parsedPrice =
    unitPrice === undefined || unitPrice === null || unitPrice === ''
      ? null
      : Number(unitPrice)

  if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
    return { ok: false, message: 'O preço unitário não pode ser negativo.' }
  }

  return {
    ok: true,
    value: {
      name: trimmedName,
      quantity: parsedQuantity,
      unitPrice: parsedPrice,
    },
  }
}

export function validateCheckedPatch(
  body: unknown,
): ValidationResult<boolean> {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, message: 'Corpo da requisição inválido.' }
  }

  const { isChecked } = body as Record<string, unknown>

  if (typeof isChecked !== 'boolean') {
    return { ok: false, message: 'O campo isChecked deve ser booleano.' }
  }

  return { ok: true, value: isChecked }
}
