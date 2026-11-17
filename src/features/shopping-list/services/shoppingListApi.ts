import type { NewShoppingItem, ShoppingItem } from '../../../../shared/shopping-list'

interface ItemsResponse {
  items: ShoppingItem[]
}

interface ItemResponse {
  item: ShoppingItem
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/items${path}`, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : 'Não foi possível concluir a operação.'

    throw new Error(message)
  }

  return payload as T
}

export const shoppingListApi = {
  async list(): Promise<ShoppingItem[]> {
    const { items } = await request<ItemsResponse>('')
    return items
  },

  async create(item: NewShoppingItem): Promise<ShoppingItem> {
    const { item: created } = await request<ItemResponse>('', {
      method: 'POST',
      body: JSON.stringify(item),
    })
    return created
  },

  async setChecked(id: string, isChecked: boolean): Promise<ShoppingItem> {
    const { item } = await request<ItemResponse>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isChecked }),
    })
    return item
  },

  async remove(id: string): Promise<void> {
    await request<void>(`/${id}`, { method: 'DELETE' })
  },
}
