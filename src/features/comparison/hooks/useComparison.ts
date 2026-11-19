import { useCallback, useEffect, useState } from 'react'
import type { ProductComparison } from '../../../../shared/comparison'
import { describeApiError } from '../../../lib/apiError'
import { comparisonApi } from '../services/comparisonApi'

interface ComparisonState {
  key: string | null
  status: 'loading' | 'ready' | 'error'
  comparison: ProductComparison | null
  errorMessage: string | null
}

export function useComparison(productKey: string | null) {
  const [state, setState] = useState<ComparisonState>({
    key: null,
    status: 'loading',
    comparison: null,
    errorMessage: null,
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!productKey) return

    let isActive = true

    comparisonApi
      .get(productKey)
      .then((comparison) => {
        if (!isActive) return
        setState({
          key: productKey,
          status: 'ready',
          comparison,
          errorMessage: null,
        })
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setState({
          key: productKey,
          status: 'error',
          comparison: null,
          errorMessage: describeApiError(
            error,
            'Não foi possível comparar este produto.',
          ),
        })
      })

    return () => {
      isActive = false
    }
  }, [productKey, attempt])

  const isCurrent = state.key === productKey
  const isLoading = productKey !== null && !isCurrent

  const reload = useCallback(() => {
    setAttempt((current) => current + 1)
  }, [])

  return {
    comparison: isCurrent ? state.comparison : null,
    isLoading: isLoading || (productKey !== null && state.status === 'loading'),
    isError: productKey !== null && isCurrent && state.status === 'error',
    errorMessage: isCurrent ? state.errorMessage : null,
    reload,
  }
}
