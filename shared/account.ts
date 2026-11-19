export type AccountRole = 'admin' | 'user'

export type AccountStatus = 'pending' | 'active' | 'banned'

export interface AccountState {
  role: AccountRole
  status: AccountStatus
}

export interface AccountSummary extends AccountState {
  id: string
  name: string
  username: string | null
  email: string
  createdAt: string
}

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  pending: 'Aguardando aprovação',
  active: 'Ativa',
  banned: 'Banida',
}

export const ACCOUNT_STATUS_BADGES: Record<AccountStatus, string> = {
  pending: 'text-bg-warning',
  active: 'text-bg-success',
  banned: 'text-bg-danger',
}

export function isAccountRole(value: unknown): value is AccountRole {
  return value === 'admin' || value === 'user'
}

export function isAccountStatus(value: unknown): value is AccountStatus {
  return value === 'pending' || value === 'active' || value === 'banned'
}

/** O administrador não age sobre a própria conta: evita perder o único acesso. */
export function mayManageAccount(actorId: string, targetId: string): boolean {
  return actorId !== targetId
}
