interface AuthErrorInfo {
  status?: number
  code?: string
  message?: string
}

const USERNAME_ERRORS: Record<string, string> = {
  USERNAME_IS_ALREADY_TAKEN: 'Este nick já está em uso. Escolha outro.',
  USERNAME_TOO_SHORT: 'O nick precisa ter pelo menos 3 caracteres.',
  USERNAME_TOO_LONG: 'O nick pode ter no máximo 20 caracteres.',
  INVALID_USERNAME: 'Use apenas letras, números, ponto ou _ no nick.',
}

export function describeSignInError(error: AuthErrorInfo): string {
  if (error.status === 401) {
    return 'Nick/e-mail ou senha inválidos.'
  }

  if (error.status === 403) {
    return 'Esta conta não está autorizada a acessar a lista.'
  }

  return error.message ?? 'Não foi possível entrar. Tente novamente.'
}

export function describeSignUpError(error: AuthErrorInfo): string {
  const usernameMessage = error.code ? USERNAME_ERRORS[error.code] : undefined

  if (usernameMessage) {
    return usernameMessage
  }

  if (error.status === 422) {
    return 'Já existe uma conta com este e-mail. Tente entrar.'
  }

  if (error.status === 403) {
    return 'Cadastro desativado neste ambiente. Use uma conta autorizada.'
  }

  if (error.status === 400) {
    return error.message ?? 'Confira os dados: a senha precisa ter pelo menos 8 caracteres.'
  }

  return error.message ?? 'Não foi possível criar a conta. Tente novamente.'
}
