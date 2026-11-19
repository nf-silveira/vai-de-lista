import { Router, type Request, type Response } from 'express'
import { mayManageAccount } from '../shared/account.js'
import type { AccountState } from '../shared/account.js'
import { deleteAccount, listAccounts, setAccountStatus } from './accounts.js'

const MAX_BAN_REASON_LENGTH = 200

export const adminRouter = Router()

adminRouter.use((_req, res, next) => {
  const account = res.locals.account as AccountState | undefined

  if (account?.role !== 'admin') {
    res.status(403).json({ error: 'Apenas o administrador gerencia contas.' })
    return
  }

  next()
})

function readBanReason(req: Request): string | null {
  const reason = (req.body as { reason?: unknown } | undefined)?.reason

  if (typeof reason !== 'string') {
    return null
  }

  const trimmed = reason.trim().slice(0, MAX_BAN_REASON_LENGTH)
  return trimmed.length > 0 ? trimmed : null
}

function mayActOnTarget(
  req: Request<{ id: string }>,
  res: Response,
): boolean {
  const targetId = req.params.id

  if (!mayManageAccount(res.locals.userId as string, targetId)) {
    res.status(400).json({ error: 'Você não pode alterar a própria conta.' })
    return false
  }

  return true
}

adminRouter.get('/users', async (_req, res) => {
  res.json({ users: await listAccounts() })
})

adminRouter.post<{ id: string }>('/users/:id/approve', async (req, res) => {
  if (!mayActOnTarget(req, res)) return

  const user = await setAccountStatus(req.params.id, 'active')

  if (!user) {
    res.status(404).json({ error: 'Conta não encontrada.' })
    return
  }

  res.json({ user })
})

adminRouter.post<{ id: string }>('/users/:id/ban', async (req, res) => {
  if (!mayActOnTarget(req, res)) return

  const user = await setAccountStatus(req.params.id, 'banned', readBanReason(req))

  if (!user) {
    res.status(404).json({ error: 'Conta não encontrada.' })
    return
  }

  res.json({ user })
})

adminRouter.post<{ id: string }>('/users/:id/unban', async (req, res) => {
  if (!mayActOnTarget(req, res)) return

  const user = await setAccountStatus(req.params.id, 'active')

  if (!user) {
    res.status(404).json({ error: 'Conta não encontrada.' })
    return
  }

  res.json({ user })
})

adminRouter.delete<{ id: string }>('/users/:id', async (req, res) => {
  if (!mayActOnTarget(req, res)) return

  const removed = await deleteAccount(req.params.id)

  if (!removed) {
    res.status(404).json({ error: 'Conta não encontrada.' })
    return
  }

  res.status(204).end()
})
