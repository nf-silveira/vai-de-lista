import type { ShoppingItem } from '../../../../shared/shopping-list'

export interface ShoppingListSummary {
  total: number
  checkedCount: number
  itemsWithoutPrice: number
}

export function summarizeItems(items: ShoppingItem[]): ShoppingListSummary {
  return items.reduce<ShoppingListSummary>(
    (summary, item) => ({
      total:
        item.unitPrice === null
          ? summary.total
          : summary.total + item.quantity * item.unitPrice,
      checkedCount: summary.checkedCount + (item.isChecked ? 1 : 0),
      itemsWithoutPrice:
        summary.itemsWithoutPrice + (item.unitPrice === null ? 1 : 0),
    }),
    { total: 0, checkedCount: 0, itemsWithoutPrice: 0 },
  )
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(
    quantity,
  )
}
