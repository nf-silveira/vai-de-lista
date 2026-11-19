import { useCallback, useEffect, useState } from 'react'
import type { PurchaseSummary } from '../../../../shared/shopping-list'
import { describeApiError } from '../../../lib/apiError'
import { historyApi } from '../services/historyApi'

type Status = 'loading' | 'ready' | 'error'

export function usePurchases() {
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    historyApi
      .list()
      .then((loaded) => {
        if (!isActive) return
        setPurchases(loaded)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setErrorMessage(
          describeApiError(error, 'Não foi possível carregar o histórico.'),
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
      setPurchases(await historyApi.list())
      setStatus('ready')
    } catch (error: unknown) {
      setErrorMessage(
        describeApiError(error, 'Não foi possível carregar o histórico.'),
      )
      setStatus('error')
    }
  }, [])

  return { purchases, status, errorMessage, reload }
}
