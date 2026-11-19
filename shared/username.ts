export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 20

const USERNAME_PATTERN = /^[a-z0-9._]+$/i

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export function isValidUsername(value: string): boolean {
  const normalized = normalizeUsername(value)

  return (
    normalized.length >= USERNAME_MIN_LENGTH &&
    normalized.length <= USERNAME_MAX_LENGTH &&
    USERNAME_PATTERN.test(normalized)
  )
}

/**
 * Nick determinístico para as contas de seed, que só têm e-mail configurado.
 * Assim o `db:seed` continua criando contas que conseguem entrar pelo nick.
 */
export function usernameFromEmail(email: string): string {
  const local = normalizeUsername(email.split('@')[0] ?? '')
  const cleaned = local.replace(/[^a-z0-9._]/g, '').slice(0, USERNAME_MAX_LENGTH)
  const padded = cleaned.length >= USERNAME_MIN_LENGTH ? cleaned : `user${cleaned}`

  return padded.slice(0, USERNAME_MAX_LENGTH)
}
