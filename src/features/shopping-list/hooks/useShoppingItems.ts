import { useCallback, useEffect, useState } from 'react'
import type {
  NewShoppingItem,
  ShoppingItem,
  ShoppingItemPatch,
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

  const reload = useCallback(async () => {
    setStatus('loading')
    setErrorMessage(null)

    try {
      setItems(await shoppingListApi.list())
      setStatus('ready')
    } catch (error: unknown) {
      setErrorMessage(describeError(error))
      setStatus('error')
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

  const updateItem = useCallback(
    async (item: ShoppingItem, patch: ShoppingItemPatch) => {
      setBusyItemId(item.id)
      setErrorMessage(null)

      try {
        const updated = await shoppingListApi.update(item.id, patch)
        setItems((current) =>
          current.map((currentItem) =>
            currentItem.id === updated.id ? updated : currentItem,
          ),
        )
        return true
      } catch (error: unknown) {
        setErrorMessage(describeError(error))
        return false
      } finally {
        setBusyItemId(null)
      }
    },
    [],
  )

  const toggleItem = useCallback(
    async (item: ShoppingItem) => {
      await updateItem(item, { isChecked: !item.isChecked })
    },
    [updateItem],
  )

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
    reload,
    addItem,
    updateItem,
    toggleItem,
    removeItem,
  }
}
