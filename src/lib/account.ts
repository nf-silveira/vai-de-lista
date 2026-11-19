import { useCallback, useEffect, useState } from 'react'
import type { AccountSummary } from '../../shared/account'

type LoadStatus = 'loading' | 'ready' | 'error'

let cachedAccount: AccountSummary | null = null

/** O cache é do processo da SPA: limpe-o ao sair para não vazar a conta anterior. */
export function resetAccountCache(): void {
  cachedAccount = null
}

async function fetchAccount(): Promise<AccountSummary | null> {
  const response = await fetch('/api/me', { credentials: 'include' })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error('Não foi possível verificar sua conta.')
  }

  const payload = (await response.json()) as { account: AccountSummary }
  return payload.account
}

export function useAccount() {
  const [account, setAccount] = useState<AccountSummary | null>(cachedAccount)
  const [status, setStatus] = useState<LoadStatus>(
    cachedAccount ? 'ready' : 'loading',
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setStatus('loading')
    setErrorMessage(null)

    try {
      const loaded = await fetchAccount()
      cachedAccount = loaded
      setAccount(loaded)
      setStatus('ready')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível verificar sua conta.',
      )
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (cachedAccount) return

    let isActive = true

    fetchAccount()
      .then((loaded) => {
        cachedAccount = loaded
        if (!isActive) return
        setAccount(loaded)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível verificar sua conta.',
        )
        setStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [])

  return { account, status, errorMessage, reload }
}
