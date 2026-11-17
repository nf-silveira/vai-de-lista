import {
  DEFAULT_ITEM_UNIT,
  ITEM_UNITS,
  type ItemUnit,
  type ShoppingItem,
} from '../../../../shared/shopping-list'

export const MIN_NAME_LENGTH = 2
export const MAX_NAME_LENGTH = 80

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

  const quantity = parseDecimal(draft.quantity)

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { ok: false, message: 'A quantidade deve ser maior que zero.' }
  }

  const unit = ITEM_UNITS.find((candidate) => candidate === draft.unit)

  if (!unit) {
    return { ok: false, message: 'Selecione uma unidade válida.' }
  }

  const isPriceEmpty = draft.unitPrice.trim() === ''
  const unitPrice = isPriceEmpty ? null : parseDecimal(draft.unitPrice)

  if (unitPrice !== null && (!Number.isFinite(unitPrice) || unitPrice < 0)) {
    return { ok: false, message: 'O preço não pode ser negativo.' }
  }

  return { ok: true, value: { name, quantity, unit, unitPrice } }
}
