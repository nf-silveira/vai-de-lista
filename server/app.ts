import express, { type NextFunction, type Request, type Response } from 'express'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth.js'
import {
  createShoppingItem,
  deleteShoppingItem,
  listShoppingItems,
  updateShoppingItem,
} from './items.js'
import {
  isValidItemId,
  validateItemPatch,
  validateNewItem,
} from './itemValidation.js'
import { createRateLimiter, type RateLimiter } from './rateLimit.js'
import {
  deletePurchase,
  ensureActiveList,
  finalizePurchase,
  findPurchase,
  listPurchases,
} from './lists.js'
import { adminRouter } from './admin.js'
import { findAccountById, findAccountState } from './accounts.js'
import { getComparison, listProducts } from './comparisonQueries.js'
import { createSessionGuard } from './sessionGuard.js'

export const app = express()

/** A aplicação só roda atrás do proxy da Vercel. */
app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains',
  )
  next()
})

/**
 * Com `trust proxy` configurado, `req.ip` é o IP que o proxy da Vercel registra.
 * Ler `X-Forwarded-For` direto permitiria ao cliente forjar o IP e burlar o limite.
 */
function clientIp(req: Request): string {
  return req.ip || 'desconhecido'
}

function rateLimit(limiter: RateLimiter, message: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const decision = limiter.check(clientIp(req))

    if (!decision.allowed) {
      res.setHeader('Retry-After', String(decision.retryAfterSeconds))
      res.status(429).json({ error: message })
      return
    }

    next()
  }
}

const credentialLimiter = createRateLimiter({ windowMs: 5 * 60_000, max: 5 })
// Balde separado: tentativas de login erradas não podem bloquear a recuperação
// de senha, que é justamente o que o usuário precisa depois de errar a senha.
const resetLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 5 })
const authLimiter = createRateLimiter({ windowMs: 60_000, max: 100 })
const itemWriteLimiter = createRateLimiter({ windowMs: 60_000, max: 60 })

const tooManyAttempts = 'Muitas tentativas. Aguarde alguns minutos.'
const tooManyResets = 'Muitos pedidos de redefinição. Aguarde alguns minutos.'
const tooManyWrites = 'Muitas alterações em pouco tempo. Aguarde um instante.'

app.post(
  ['/api/auth/sign-up/email', '/api/auth/sign-in/email', '/api/auth/sign-in/username'],
  rateLimit(credentialLimiter, tooManyAttempts),
)
app.post(
  '/api/auth/request-password-reset',
  rateLimit(resetLimiter, tooManyResets),
)
app.use('/api/auth', rateLimit(authLimiter, tooManyAttempts))
app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json({ limit: '32kb' }))

const getSession = (headers: Headers) => auth.api.getSession({ headers })

const requireSession = createSessionGuard({
  getSession,
  getAccountState: findAccountState,
})

// A rota de perfil também responde para contas pendentes ou banidas: é ela que
// informa ao app por que o acesso está bloqueado.
const readSession = createSessionGuard({
  getSession,
  getAccountState: findAccountState,
  requireActive: false,
})

app.get('/api/me', readSession, async (_req, res) => {
  const account = await findAccountById(res.locals.userId as string)

  if (!account) {
    res.status(401).json({ error: 'Sessão expirada. Entre novamente.' })
    return
  }

  res.json({ account })
})

app.use('/api/admin', requireSession, adminRouter)

app.get('/api/items', requireSession, async (_req, res) => {
  const list = await ensureActiveList()
  res.json({ items: await listShoppingItems(list.id), list })
})

app.post(
  '/api/items',
  requireSession,
  rateLimit(itemWriteLimiter, tooManyWrites),
  async (req, res) => {
    const validation = validateNewItem(req.body)

    if (!validation.ok) {
      res.status(400).json({ error: validation.message })
      return
    }

    const list = await ensureActiveList()
    const item = await createShoppingItem(list.id, validation.value)
    res.status(201).json({ item })
  },
)

app.patch<{ id: string }>(
  '/api/items/:id',
  requireSession,
  rateLimit(itemWriteLimiter, tooManyWrites),
  async (req, res) => {
    const { id } = req.params

    if (!isValidItemId(id)) {
      res.status(400).json({ error: 'Identificador de item inválido.' })
      return
    }

    const validation = validateItemPatch(req.body)

    if (!validation.ok) {
      res.status(400).json({ error: validation.message })
      return
    }

    const list = await ensureActiveList()
    const item = await updateShoppingItem(list.id, id, validation.value)

    if (!item) {
      res.status(404).json({ error: 'Item não encontrado.' })
      return
    }

    res.json({ item })
  },
)

app.delete<{ id: string }>(
  '/api/items/:id',
  requireSession,
  rateLimit(itemWriteLimiter, tooManyWrites),
  async (req, res) => {
    const { id } = req.params

    if (!isValidItemId(id)) {
      res.status(400).json({ error: 'Identificador de item inválido.' })
      return
    }

    const list = await ensureActiveList()
    const removed = await deleteShoppingItem(list.id, id)

    if (!removed) {
      res.status(404).json({ error: 'Item não encontrado.' })
      return
    }

    res.status(204).end()
  },
)

app.get('/api/purchases', requireSession, async (_req, res) => {
  res.json({ purchases: await listPurchases() })
})

app.post(
  '/api/purchases',
  requireSession,
  rateLimit(itemWriteLimiter, tooManyWrites),
  async (req, res) => {
    const listId = (req.body as { listId?: unknown } | null)?.listId

    if (typeof listId !== 'string' || !isValidItemId(listId)) {
      res.status(400).json({ error: 'Lista inválida.' })
      return
    }

    const result = await finalizePurchase(
      listId,
      res.locals.userId as string,
    )

    if (!result.ok) {
      if (result.reason === 'empty') {
        res
          .status(400)
          .json({ error: 'Adicione ao menos um item antes de finalizar.' })
        return
      }

      res.status(404).json({ error: 'Lista não encontrada.' })
      return
    }

    res.status(result.alreadyCompleted ? 200 : 201).json({
      purchase: result.purchase,
      alreadyCompleted: result.alreadyCompleted,
    })
  },
)

app.get<{ id: string }>(
  '/api/purchases/:id',
  requireSession,
  async (req, res) => {
    const { id } = req.params

    if (!isValidItemId(id)) {
      res.status(400).json({ error: 'Compra inválida.' })
      return
    }

    const purchase = await findPurchase(id)

    if (!purchase) {
      res.status(404).json({ error: 'Compra não encontrada.' })
      return
    }

    res.json({ purchase })
  },
)

app.delete<{ id: string }>(
  '/api/purchases/:id',
  requireSession,
  rateLimit(itemWriteLimiter, tooManyWrites),
  async (req, res) => {
    const { id } = req.params

    if (!isValidItemId(id)) {
      res.status(400).json({ error: 'Compra inválida.' })
      return
    }

    const result = await deletePurchase(id)

    if (result === 'deleted') {
      res.status(204).end()
      return
    }

    if (result === 'active') {
      res
        .status(409)
        .json({ error: 'A lista ativa não pode ser excluída por aqui.' })
      return
    }

    res.status(404).json({ error: 'Compra não encontrada.' })
  },
)

app.get('/api/products', requireSession, async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : ''
  res.json({ products: await listProducts(search) })
})

app.get('/api/comparisons', requireSession, async (req, res) => {
  const productKey =
    typeof req.query.productKey === 'string' ? req.query.productKey : ''

  if (!productKey.trim()) {
    res.status(400).json({ error: 'Informe o produto para comparar.' })
    return
  }

  const comparison = await getComparison(productKey.trim())

  if (!comparison) {
    res.status(404).json({ error: 'Produto sem registros de preço.' })
    return
  }

  res.json({ comparison })
})

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Recurso não encontrado.' })
})

interface BodyTooLargeError {
  type: 'entity.too.large'
}

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}

function isBodyTooLarge(error: unknown): error is BodyTooLargeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  )
}

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) {
    console.error('[api] erro após resposta enviada:', describeError(error))
    return
  }

  if (isBodyTooLarge(error)) {
    res.status(413).json({ error: 'Requisição muito grande.' })
    return
  }

  console.error('[api] erro não tratado:', describeError(error))
  res.status(500).json({ error: 'Erro interno. Tente novamente.' })
})
