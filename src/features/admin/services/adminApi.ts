import type { AccountSummary } from '../../../../shared/account'

interface UsersResponse {
  users: AccountSummary[]
}

interface UserResponse {
  user: AccountSummary
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
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

export const adminApi = {
  async list(): Promise<AccountSummary[]> {
    const { users } = await request<UsersResponse>('/users')
    return users
  },

  async approve(id: string): Promise<AccountSummary> {
    const { user } = await request<UserResponse>(`/users/${id}/approve`, {
      method: 'POST',
    })
    return user
  },

  async ban(id: string): Promise<AccountSummary> {
    const { user } = await request<UserResponse>(`/users/${id}/ban`, {
      method: 'POST',
    })
    return user
  },

  async unban(id: string): Promise<AccountSummary> {
    const { user } = await request<UserResponse>(`/users/${id}/unban`, {
      method: 'POST',
    })
    return user
  },

  async remove(id: string): Promise<void> {
    await request<void>(`/users/${id}`, { method: 'DELETE' })
  },
}
