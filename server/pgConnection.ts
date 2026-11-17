const LEGACY_SSL_MODES = new Set(['prefer', 'require', 'verify-ca'])

/**
 * O pg 8 trata `prefer`, `require` e `verify-ca` como `verify-full`. No pg 9 o
 * comportamento muda e a conexão com o Neon passaria a aceitar certificado sem
 * validar a cadeia. Fixar `verify-full` mantém a proteção atual e dispensa o
 * aviso de segurança que o driver imprime a cada conexão.
 */
export function withExplicitSsl(url: string): string {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    return url
  }

  const mode = parsed.searchParams.get('sslmode')

  if (mode && LEGACY_SSL_MODES.has(mode)) {
    parsed.searchParams.set('sslmode', 'verify-full')
  }

  return parsed.toString()
}
