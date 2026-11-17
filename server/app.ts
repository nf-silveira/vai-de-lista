import express, { type NextFunction, type Request, type Response } from 'express'
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
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

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return raw?.split(',')[0]?.trim() || req.ip || 'desconhecido'
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
const authLimiter = createRateLimiter({ windowMs: 60_000, max: 100 })
const itemWriteLimiter = createRateLimiter({ windowMs: 60_000, max: 60 })

const tooManyAttempts = 'Muitas tentativas. Aguarde alguns minutos.'
const tooManyWrites = 'Muitas alterações em pouco tempo. Aguarde um instante.'

app.post(
  ['/api/auth/sign-up/email', '/api/auth/sign-in/email'],
  rateLimit(credentialLimiter, tooManyAttempts),
)
app.use('/api/auth', rateLimit(authLimiter, tooManyAttempts))
app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json({ limit: '32kb' }))

async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })

  if (!session) {
    res.status(401).json({ error: 'Sessão expirada. Entre novamente.' })
    return
  }

  res.locals.userId = session.user.id
  next()
}

app.get('/api/items', requireSession, async (_req, res) => {
  res.json({ items: await listShoppingItems() })
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

    const item = await createShoppingItem(validation.value)
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

    const item = await updateShoppingItem(id, validation.value)

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

    const removed = await deleteShoppingItem(id)

    if (!removed) {
      res.status(404).json({ error: 'Item não encontrado.' })
      return
    }

    res.status(204).end()
  },
)

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
