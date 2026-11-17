interface AuthErrorInfo {
  status?: number
  message?: string
}

export function describeSignInError(error: AuthErrorInfo): string {
  if (error.status === 401) {
    return 'E-mail ou senha inválidos.'
  }

  if (error.status === 403) {
    return 'Este e-mail não está autorizado a acessar a lista.'
  }

  return error.message ?? 'Não foi possível entrar. Tente novamente.'
}

export function describeSignUpError(error: AuthErrorInfo): string {
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
