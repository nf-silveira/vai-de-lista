/** Contrato compartilhado entre a API e o app para os itens da lista. */
export const ITEM_UNITS = ['un', 'kg', 'g', 'l', 'ml', 'cx'] as const

export type ItemUnit = (typeof ITEM_UNITS)[number]

export const DEFAULT_ITEM_UNIT: ItemUnit = 'un'

export interface ShoppingItem {
  id: string
  name: string
  quantity: number
  unit: ItemUnit
  unitPrice: number | null
  isChecked: boolean
  createdAt: string
}

export interface NewShoppingItem {
  name: string
  quantity: number
  unit?: ItemUnit
  unitPrice: number | null
}

export interface ShoppingItemPatch {
  name?: string
  quantity?: number
  unit?: ItemUnit
  unitPrice?: number | null
  isChecked?: boolean
}
