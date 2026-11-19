const GENERIC_ERROR = 'Não foi possível concluir a operação.'

function readErrorMessage(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    return String(payload.error)
  }

  return GENERIC_ERROR
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers)

  if (init?.body) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(path, {
      ...init,
      credentials: 'include',
      headers,
    })
  } catch {
    throw new Error(
      'Não foi possível conectar. Verifique sua internet e tente novamente.',
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(readErrorMessage(payload))
  }

  return payload as T
}
