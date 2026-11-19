/** Contrato compartilhado entre a API e o app para a lista e o histórico. */
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

/** Lista aberta no momento; a API garante uma lista ativa compartilhada. */
export interface ActiveList {
  id: string
  name: string
}

/** Compra finalizada, exibida no histórico sem os itens. */
export interface PurchaseSummary {
  id: string
  name: string
  itemCount: number
  itemsWithoutPrice: number
  total: number
  purchasedAt: string
}

/** Retrato da compra no momento da finalização. */
export interface PurchaseDetail extends PurchaseSummary {
  items: ShoppingItem[]
}
