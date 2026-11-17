import { useCallback, useEffect, useState } from 'react'
import type {
  NewShoppingItem,
  ShoppingItem,
} from '../../../../shared/shopping-list'
import { shoppingListApi } from '../services/shoppingListApi'

type Status = 'loading' | 'ready' | 'error'

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Não foi possível carregar a lista.'
}

export function useShoppingItems() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [busyItemId, setBusyItemId] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    shoppingListApi
      .list()
      .then((loadedItems) => {
        if (!isActive) return
        setItems(loadedItems)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setErrorMessage(describeError(error))
        setStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [])

  const addItem = useCallback(async (item: NewShoppingItem) => {
    setIsAdding(true)
    setErrorMessage(null)

    try {
      const created = await shoppingListApi.create(item)
      setItems((current) => [...current, created])
      return true
    } catch (error: unknown) {
      setErrorMessage(describeError(error))
      return false
    } finally {
      setIsAdding(false)
    }
  }, [])

  const toggleItem = useCallback(async (item: ShoppingItem) => {
    setBusyItemId(item.id)
    setErrorMessage(null)

    try {
      const updated = await shoppingListApi.setChecked(item.id, !item.isChecked)
      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === updated.id ? updated : currentItem,
        ),
      )
    } catch (error: unknown) {
      setErrorMessage(describeError(error))
    } finally {
      setBusyItemId(null)
    }
  }, [])

  const removeItem = useCallback(async (item: ShoppingItem) => {
    setBusyItemId(item.id)
    setErrorMessage(null)

    try {
      await shoppingListApi.remove(item.id)
      setItems((current) =>
        current.filter((currentItem) => currentItem.id !== item.id),
      )
    } catch (error: unknown) {
      setErrorMessage(describeError(error))
    } finally {
      setBusyItemId(null)
    }
  }, [])

  return {
    items,
    status,
    errorMessage,
    isAdding,
    busyItemId,
    addItem,
    toggleItem,
    removeItem,
  }
}
