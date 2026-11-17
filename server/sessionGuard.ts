import type { NextFunction, Request, Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { checkMemberAccess } from './access.js'

export interface SessionUser {
  id: string
  email: string
}

export interface SessionLike {
  user: SessionUser
}

export interface SessionGuardOptions {
  getSession: (headers: Headers) => Promise<SessionLike | null>
  memberEmails: string[]
  isProduction: boolean
}

export function createSessionGuard({
  getSession,
  memberEmails,
  isProduction,
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

    const access = checkMemberAccess(session.user.email, memberEmails, {
      isProduction,
    })

    if (!access.allowed) {
      res.status(403).json({ error: 'Esta conta não tem acesso à lista.' })
      return
    }

    res.locals.userId = session.user.id
    next()
  }
}
