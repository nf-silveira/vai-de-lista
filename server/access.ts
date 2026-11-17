export type EnvMap = Record<string, string | undefined>

export interface MemberAccess {
  allowed: boolean
  reason: 'allowed' | 'not-listed' | 'not-configured'
}

export function parseEmailList(value: string | undefined): string[] {
  const emails = (value ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)

  return [...new Set(emails)]
}

/**
 * Quem pode ler e alterar a lista compartilhada. Só `ALLOWED_EMAILS`: as contas
 * de seed ficam de fora de propósito, porque têm senha conhecida.
 */
export function readMemberEmails(env: EnvMap): string[] {
  return parseEmailList(env.ALLOWED_EMAILS)
}

/**
 * Sem allowlist configurada o acesso é liberado apenas fora de produção; em
 * produção a falha é fechada, para que um esquecimento não exponha a lista.
 */
export function checkMemberAccess(
  email: string,
  memberEmails: string[],
  { isProduction }: { isProduction: boolean },
): MemberAccess {
  if (memberEmails.length === 0) {
    return { allowed: !isProduction, reason: 'not-configured' }
  }

  const normalized = email.trim().toLowerCase()
  const listed = memberEmails.includes(normalized)

  return { allowed: listed, reason: listed ? 'allowed' : 'not-listed' }
}
