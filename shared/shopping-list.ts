/** Contrato compartilhado entre a API e o app para os itens da lista. */
export interface ShoppingItem {
  id: string
  name: string
  quantity: number
  unitPrice: number | null
  isChecked: boolean
  createdAt: string
}

export interface NewShoppingItem {
  name: string
  quantity: number
  unitPrice: number | null
}

export interface ShoppingItemPatch {
  isChecked: boolean
}
