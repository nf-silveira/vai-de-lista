import {
  DEFAULT_ITEM_UNIT,
  ITEM_UNITS,
  type ItemUnit,
  type ShoppingItem,
} from '../../../../shared/shopping-list'

export const MIN_NAME_LENGTH = 2
export const MAX_NAME_LENGTH = 80
const QUANTITY_DECIMALS = 3
const PRICE_DECIMALS = 2
const SCALE_TOLERANCE = 1e-6

export interface ItemDraft {
  name: string
  quantity: string
  unit: ItemUnit
  unitPrice: string
}

export interface ParsedItemDraft {
  name: string
  quantity: number
  unit: ItemUnit
  unitPrice: number | null
}

export type ItemDraftResult =
  | { ok: true; value: ParsedItemDraft }
  | { ok: false; message: string }

export function createItemDraft(item?: ShoppingItem): ItemDraft {
  if (!item) {
    return {
      name: '',
      quantity: '1',
      unit: DEFAULT_ITEM_UNIT,
      unitPrice: '',
    }
  }

  return {
    name: item.name,
    quantity: String(item.quantity).replace('.', ','),
    unit: item.unit,
    unitPrice: item.unitPrice === null ? '' : String(item.unitPrice).replace('.', ','),
  }
}

function parseDecimal(value: string): number {
  return Number(value.trim().replace(',', '.'))
}

function fitScale(value: number, decimals: number): number | null {
  const factor = 10 ** decimals
  const scaled = value * factor
  const rounded = Math.round(scaled)

  if (Math.abs(scaled - rounded) > SCALE_TOLERANCE) {
    return null
  }

  return rounded / factor
}

export function parseItemDraft(draft: ItemDraft): ItemDraftResult {
  const name = draft.name.trim()

  if (name.length < MIN_NAME_LENGTH) {
    return { ok: false, message: 'Informe o nome do produto.' }
  }

  if (name.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      message: `O nome do produto deve ter até ${MAX_NAME_LENGTH} caracteres.`,
    }
  }

  const parsedQuantity = parseDecimal(draft.quantity)

  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return { ok: false, message: 'A quantidade deve ser maior que zero.' }
  }

  const quantity = fitScale(parsedQuantity, QUANTITY_DECIMALS)

  if (quantity === null) {
    return {
      ok: false,
      message: `A quantidade deve ter no máximo ${QUANTITY_DECIMALS} casas decimais.`,
    }
  }

  const unit = ITEM_UNITS.find((candidate) => candidate === draft.unit)

  if (!unit) {
    return { ok: false, message: 'Selecione uma unidade válida.' }
  }

  const isPriceEmpty = draft.unitPrice.trim() === ''
  const parsedPrice = isPriceEmpty ? null : parseDecimal(draft.unitPrice)

  if (
    parsedPrice !== null &&
    (!Number.isFinite(parsedPrice) || parsedPrice < 0)
  ) {
    return { ok: false, message: 'O preço não pode ser negativo.' }
  }

  const unitPrice =
    parsedPrice === null ? null : fitScale(parsedPrice, PRICE_DECIMALS)

  if (parsedPrice !== null && unitPrice === null) {
    return {
      ok: false,
      message: `O preço deve ter no máximo ${PRICE_DECIMALS} casas decimais.`,
    }
  }

  return { ok: true, value: { name, quantity, unit, unitPrice } }
}
