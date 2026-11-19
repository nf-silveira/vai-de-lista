import { useCallback, useEffect, useState } from 'react'
import type { PurchaseDetail } from '../../../../shared/shopping-list'
import { describeApiError } from '../../../lib/apiError'
import { historyApi } from '../services/historyApi'

type Status = 'loading' | 'ready' | 'error'

export function usePurchase(id: string | undefined) {
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let isActive = true

    historyApi
      .get(id)
      .then((loaded) => {
        if (!isActive) return
        setPurchase(loaded)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setErrorMessage(
          describeApiError(error, 'Não foi possível carregar a compra.'),
        )
        setStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [id])

  const reload = useCallback(async () => {
    if (!id) return

    setStatus('loading')
    setErrorMessage(null)

    try {
      setPurchase(await historyApi.get(id))
      setStatus('ready')
    } catch (error: unknown) {
      setErrorMessage(
        describeApiError(error, 'Não foi possível carregar a compra.'),
      )
      setStatus('error')
    }
  }, [id])

  return { purchase, status, errorMessage, reload }
}
