import { useCallback, useEffect, useState } from 'react'
import type {
  ActiveList,
  NewShoppingItem,
  PurchaseDetail,
  ShoppingItem,
  ShoppingItemPatch,
} from '../../../../shared/shopping-list'
import { describeApiError } from '../../../lib/apiError'
import { shoppingListApi } from '../services/shoppingListApi'

type Status = 'loading' | 'ready' | 'error'

export function useShoppingItems() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [list, setList] = useState<ActiveList | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [busyItemId, setBusyItemId] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    shoppingListApi
      .list()
      .then((snapshot) => {
        if (!isActive) return
        setItems(snapshot.items)
        setList(snapshot.list)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setErrorMessage(
          describeApiError(error, 'Não foi possível carregar a lista.'),
        )
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
      const snapshot = await shoppingListApi.list()
      setItems(snapshot.items)
      setList(snapshot.list)
      setStatus('ready')
    } catch (error: unknown) {
      setErrorMessage(
        describeApiError(error, 'Não foi possível carregar a lista.'),
      )
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
      setErrorMessage(
        describeApiError(error, 'Não foi possível adicionar o item.'),
      )
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
        setErrorMessage(
          describeApiError(error, 'Não foi possível salvar o item.'),
        )
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
      setErrorMessage(
        describeApiError(error, 'Não foi possível remover o item.'),
      )
    } finally {
      setBusyItemId(null)
    }
  }, [])

  const finalize = useCallback(async (): Promise<PurchaseDetail | null> => {
    if (!list) return null

    setIsFinishing(true)
    setErrorMessage(null)

    try {
      const purchase = await shoppingListApi.finalize(list.id)
      setItems([])
      setList(null)
      return purchase
    } catch (error: unknown) {
      setErrorMessage(
        describeApiError(error, 'Não foi possível finalizar a compra.'),
      )
      return null
    } finally {
      setIsFinishing(false)
    }
  }, [list])

  return {
    items,
    list,
    status,
    errorMessage,
    isAdding,
    isFinishing,
    busyItemId,
    reload,
    addItem,
    updateItem,
    toggleItem,
    removeItem,
    finalize,
  }
}
