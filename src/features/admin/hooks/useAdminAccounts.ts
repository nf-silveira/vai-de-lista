import { useCallback, useEffect, useState } from 'react'
import type { AccountSummary } from '../../../../shared/account'
import { adminApi } from '../services/adminApi'

type Status = 'loading' | 'ready' | 'error'

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Não foi possível carregar as contas.'
}

export function useAdminAccounts() {
  const [users, setUsers] = useState<AccountSummary[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    adminApi
      .list()
      .then((loadedUsers) => {
        if (!isActive) return
        setUsers(loadedUsers)
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

  const act = useCallback(
    async (
      userId: string,
      action: () => Promise<AccountSummary | null>,
    ): Promise<boolean> => {
      setBusyUserId(userId)
      setErrorMessage(null)

      try {
        const updated = await action()
        setUsers((current) =>
          updated
            ? current.map((user) => (user.id === updated.id ? updated : user))
            : current.filter((user) => user.id !== userId),
        )
        return true
      } catch (error: unknown) {
        setErrorMessage(describeError(error))
        return false
      } finally {
        setBusyUserId(null)
      }
    },
    [],
  )

  const approve = useCallback(
    (user: AccountSummary) => act(user.id, () => adminApi.approve(user.id)),
    [act],
  )

  const ban = useCallback(
    (user: AccountSummary) => act(user.id, () => adminApi.ban(user.id)),
    [act],
  )

  const unban = useCallback(
    (user: AccountSummary) => act(user.id, () => adminApi.unban(user.id)),
    [act],
  )

  const remove = useCallback(
    (user: AccountSummary) =>
      act(user.id, async () => {
        await adminApi.remove(user.id)
        return null
      }),
    [act],
  )

  return {
    users,
    status,
    errorMessage,
    busyUserId,
    approve,
    ban,
    unban,
    remove,
  }
}
