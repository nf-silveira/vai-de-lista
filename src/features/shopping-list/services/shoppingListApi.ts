import type {
  ActiveList,
  NewShoppingItem,
  PurchaseDetail,
  ShoppingItem,
  ShoppingItemPatch,
} from '../../../../shared/shopping-list'
import { apiRequest } from '../../../lib/apiRequest'

export interface ShoppingItemsSnapshot {
  items: ShoppingItem[]
  list: ActiveList
}

interface ItemResponse {
  item: ShoppingItem
}

interface PurchaseResponse {
  purchase: PurchaseDetail
}

export const shoppingListApi = {
  list(): Promise<ShoppingItemsSnapshot> {
    return apiRequest<ShoppingItemsSnapshot>('/api/items')
  },

  async create(item: NewShoppingItem): Promise<ShoppingItem> {
    const { item: created } = await apiRequest<ItemResponse>('/api/items', {
      method: 'POST',
      body: JSON.stringify(item),
    })
    return created
  },

  async update(id: string, patch: ShoppingItemPatch): Promise<ShoppingItem> {
    const { item } = await apiRequest<ItemResponse>(`/api/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    return item
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/api/items/${id}`, { method: 'DELETE' })
  },

  async finalize(listId: string): Promise<PurchaseDetail> {
    const { purchase } = await apiRequest<PurchaseResponse>('/api/purchases', {
      method: 'POST',
      body: JSON.stringify({ listId }),
    })
    return purchase
  },
}
