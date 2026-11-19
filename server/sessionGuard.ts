import type { NextFunction, Request, Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import type { AccountState, AccountStatus } from '../shared/account.js'

export interface SessionUser {
  id: string
  email: string
}

export interface SessionLike {
  user: SessionUser
}

export interface SessionGuardOptions {
  getSession: (headers: Headers) => Promise<SessionLike | null>
  getAccountState: (userId: string) => Promise<AccountState | null>
  /** Falso apenas em rotas que precisam devolver o motivo do bloqueio. */
  requireActive?: boolean
}

const STATUS_ERRORS: Record<
  Exclude<AccountStatus, 'active'>,
  { code: string; message: string }
> = {
  pending: {
    code: 'ACCOUNT_PENDING',
    message:
      'Seu cadastro foi recebido e está aguardando aprovação do administrador.',
  },
  banned: {
    code: 'ACCOUNT_BANNED',
    message: 'Esta conta foi banida. Fale com o administrador da lista.',
  },
}

export function createSessionGuard({
  getSession,
  getAccountState,
  requireActive = true,
}: SessionGuardOptions) {
  return async function requireSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const session = await getSession(fromNodeHeaders(req.headers))

    if (!session) {
      res.status(401).json({ error: 'Sessão expirada. Entre novamente.' })
      return
    }

    const account = await getAccountState(session.user.id)

    if (!account) {
      res.status(401).json({ error: 'Sessão expirada. Entre novamente.' })
      return
    }

    if (requireActive && account.status !== 'active') {
      const { code, message } = STATUS_ERRORS[account.status]
      res.status(403).json({ error: message, code })
      return
    }

    res.locals.userId = session.user.id
    res.locals.email = session.user.email
    res.locals.account = account
    next()
  }
}
