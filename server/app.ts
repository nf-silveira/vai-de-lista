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

export const app = express()

app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())

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

app.post('/api/items', requireSession, async (req, res) => {
  const validation = validateNewItem(req.body)

  if (!validation.ok) {
    res.status(400).json({ error: validation.message })
    return
  }

  const item = await createShoppingItem(validation.value)
  res.status(201).json({ item })
})

app.patch<{ id: string }>('/api/items/:id', requireSession, async (req, res) => {
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
})

app.delete<{ id: string }>('/api/items/:id', requireSession, async (req, res) => {
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
})

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Recurso não encontrado.' })
})
