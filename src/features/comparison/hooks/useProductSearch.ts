import { useEffect, useState } from 'react'
import type { ProductOption } from '../../../../shared/comparison'
import { describeApiError } from '../../../lib/apiError'
import { comparisonApi } from '../services/comparisonApi'

type Status = 'loading' | 'ready' | 'error'

const SEARCH_DELAY_MS = 250

export function useProductSearch() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<ProductOption[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const timer = setTimeout(() => {
      setStatus('loading')

      comparisonApi
        .list(search)
        .then((loaded) => {
          if (!isActive) return
          setProducts(loaded)
          setStatus('ready')
        })
        .catch((error: unknown) => {
          if (!isActive) return
          setErrorMessage(
            describeApiError(error, 'Não foi possível buscar os produtos.'),
          )
          setStatus('error')
        })
    }, SEARCH_DELAY_MS)

    return () => {
      isActive = false
      clearTimeout(timer)
    }
  }, [search])

  return { search, setSearch, products, status, errorMessage }
}
