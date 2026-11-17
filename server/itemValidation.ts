import {
  DEFAULT_ITEM_UNIT,
  ITEM_UNITS,
  type ItemUnit,
  type NewShoppingItem,
  type ShoppingItemPatch,
} from '../shared/shopping-list'

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string }

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 80

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidItemId(id: string): boolean {
  return UUID_PATTERN.test(id)
}

export function parseItemName(value: unknown): ValidationResult<string> {
  const trimmed = typeof value === 'string' ? value.trim() : ''

  if (trimmed.length < NAME_MIN_LENGTH) {
    return { ok: false, message: 'Informe o nome do produto.' }
  }

  if (trimmed.length > NAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `O nome do produto deve ter até ${NAME_MAX_LENGTH} caracteres.`,
    }
  }

  return { ok: true, value: trimmed }
}

export function parseItemQuantity(value: unknown): ValidationResult<number> {
  const parsed = value === undefined || value === '' ? 1 : Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { ok: false, message: 'A quantidade deve ser maior que zero.' }
  }

  return { ok: true, value: parsed }
}

export function parseItemUnit(value: unknown): ValidationResult<ItemUnit> {
  if (value === undefined) {
    return { ok: true, value: DEFAULT_ITEM_UNIT }
  }

  const unit = ITEM_UNITS.find((candidate) => candidate === value)

  if (!unit) {
    return { ok: false, message: 'Unidade inválida.' }
  }

  return { ok: true, value: unit }
}

/** `null` representa preço ainda desconhecido; `undefined` é entrada inválida. */
export function parseItemPrice(
  value: unknown,
): ValidationResult<number | null> {
  if (value === undefined || value === null || value === '') {
    return { ok: true, value: null }
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return { ok: false, message: 'O preço unitário não pode ser negativo.' }
  }

  return { ok: true, value: parsed }
}

export function validateNewItem(
  body: unknown,
): ValidationResult<NewShoppingItem> {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, message: 'Corpo da requisição inválido.' }
  }

  const { name, quantity, unit, unitPrice } = body as Record<string, unknown>

  const nameResult = parseItemName(name)
  if (!nameResult.ok) return nameResult

  const quantityResult = parseItemQuantity(quantity)
  if (!quantityResult.ok) return quantityResult

  const unitResult = parseItemUnit(unit)
  if (!unitResult.ok) return unitResult

  const priceResult = parseItemPrice(unitPrice)
  if (!priceResult.ok) return priceResult

  return {
    ok: true,
    value: {
      name: nameResult.value,
      quantity: quantityResult.value,
      unit: unitResult.value,
      unitPrice: priceResult.value,
    },
  }
}

function parseChecked(value: unknown): ValidationResult<boolean> {
  if (typeof value !== 'boolean') {
    return { ok: false, message: 'O campo isChecked deve ser booleano.' }
  }

  return { ok: true, value }
}

/** `undefined` em uma chave significa que ela não deve ser alterada. */
export function validateItemPatch(
  body: unknown,
): ValidationResult<ShoppingItemPatch> {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, message: 'Corpo da requisição inválido.' }
  }

  const { name, quantity, unit, unitPrice, isChecked } =
    body as Record<string, unknown>

  const patch: ShoppingItemPatch = {}

  if (name !== undefined) {
    const nameResult = parseItemName(name)
    if (!nameResult.ok) return nameResult
    patch.name = nameResult.value
  }

  if (quantity !== undefined) {
    const quantityResult = parseItemQuantity(quantity)
    if (!quantityResult.ok) return quantityResult
    patch.quantity = quantityResult.value
  }

  if (unit !== undefined) {
    const unitResult = parseItemUnit(unit)
    if (!unitResult.ok) return unitResult
    patch.unit = unitResult.value
  }

  if (unitPrice !== undefined) {
    const priceResult = parseItemPrice(unitPrice)
    if (!priceResult.ok) return priceResult
    patch.unitPrice = priceResult.value
  }

  if (isChecked !== undefined) {
    const checkedResult = parseChecked(isChecked)
    if (!checkedResult.ok) return checkedResult
    patch.isChecked = checkedResult.value
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, message: 'Informe ao menos um campo para atualizar.' }
  }

  return { ok: true, value: patch }
}
