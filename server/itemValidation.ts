import {
  DEFAULT_ITEM_UNIT,
  ITEM_UNITS,
  type ItemUnit,
  type NewShoppingItem,
  type ShoppingItemPatch,
} from '../shared/shopping-list.js'

export type ValidationFailure = { ok: false; message: string; value?: undefined }

export type ValidationResult<T> =
  | { ok: true; value: T; message?: undefined }
  | ValidationFailure

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 80
const QUANTITY_MAX = 999_999
const QUANTITY_DECIMALS = 3
const PRICE_MAX = 999_999.99
const PRICE_DECIMALS = 2
const SCALE_TOLERANCE = 1e-6

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

/**
 * Rejeita valores que não cabem na escala da coluna numérica; sem isso o banco
 * arredonda (ou estoura) e o usuário recebe um 500 em vez de uma mensagem.
 */
function fitScale(value: number, decimals: number): number | null {
  const factor = 10 ** decimals
  const scaled = value * factor
  const rounded = Math.round(scaled)

  if (Math.abs(scaled - rounded) > SCALE_TOLERANCE) {
    return null
  }

  return rounded / factor
}

export function parseItemQuantity(value: unknown): ValidationResult<number> {
  const parsed = value === undefined || value === '' ? 1 : Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { ok: false, message: 'A quantidade deve ser maior que zero.' }
  }

  const quantity = fitScale(parsed, QUANTITY_DECIMALS)

  if (quantity === null) {
    return {
      ok: false,
      message: `A quantidade deve ter no máximo ${QUANTITY_DECIMALS} casas decimais.`,
    }
  }

  if (quantity > QUANTITY_MAX) {
    return {
      ok: false,
      message: `A quantidade deve ser de no máximo ${QUANTITY_MAX}.`,
    }
  }

  return { ok: true, value: quantity }
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

  const price = fitScale(parsed, PRICE_DECIMALS)

  if (price === null) {
    return {
      ok: false,
      message: `O preço unitário deve ter no máximo ${PRICE_DECIMALS} casas decimais.`,
    }
  }

  if (price > PRICE_MAX) {
    return {
      ok: false,
      message: `O preço unitário deve ser de no máximo ${PRICE_MAX}.`,
    }
  }

  return { ok: true, value: price }
}

export function validateNewItem(
  body: unknown,
): ValidationResult<NewShoppingItem> {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, message: 'Corpo da requisição inválido.' }
  }

  const { name, quantity, unit, unitPrice } = body as Record<string, unknown>

  const nameResult = parseItemName(name)
  if (!nameResult.ok) return { ok: false, message: nameResult.message }

  const quantityResult = parseItemQuantity(quantity)
  if (!quantityResult.ok) {
    return { ok: false, message: quantityResult.message }
  }

  const unitResult = parseItemUnit(unit)
  if (!unitResult.ok) return { ok: false, message: unitResult.message }

  const priceResult = parseItemPrice(unitPrice)
  if (!priceResult.ok) return { ok: false, message: priceResult.message }

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
    if (!nameResult.ok) return { ok: false, message: nameResult.message }
    patch.name = nameResult.value
  }

  if (quantity !== undefined) {
    const quantityResult = parseItemQuantity(quantity)
    if (!quantityResult.ok) {
      return { ok: false, message: quantityResult.message }
    }
    patch.quantity = quantityResult.value
  }

  if (unit !== undefined) {
    const unitResult = parseItemUnit(unit)
    if (!unitResult.ok) return { ok: false, message: unitResult.message }
    patch.unit = unitResult.value
  }

  if (unitPrice !== undefined) {
    const priceResult = parseItemPrice(unitPrice)
    if (!priceResult.ok) return { ok: false, message: priceResult.message }
    patch.unitPrice = priceResult.value
  }

  if (isChecked !== undefined) {
    const checkedResult = parseChecked(isChecked)
    if (!checkedResult.ok) {
      return { ok: false, message: checkedResult.message }
    }
    patch.isChecked = checkedResult.value
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, message: 'Informe ao menos um campo para atualizar.' }
  }

  return { ok: true, value: patch }
}
