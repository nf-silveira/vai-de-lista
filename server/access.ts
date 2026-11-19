export type EnvMap = Record<string, string | undefined>

export function parseEmailList(value: string | undefined): string[] {
  const emails = (value ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)

  return [...new Set(emails)]
}

/**
 * E-mails que já nascem aprovados. Como o acesso agora depende do status da
 * conta aprovado pelo administrador, `ALLOWED_EMAILS` deixou de ser uma
 * allowlist de acesso e passou a ser apenas a lista de confiança do cadastro.
 */
export function readAutoApprovedEmails(env: EnvMap): string[] {
  return parseEmailList(env.ALLOWED_EMAILS)
}

export function isAutoApproved(
  email: string,
  autoApprovedEmails: string[],
): boolean {
  return autoApprovedEmails.includes(email.trim().toLowerCase())
}
