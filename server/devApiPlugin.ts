import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

type ExpressApp = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (error?: unknown) => void,
) => void

/**
 * Executa a API Express dentro do dev server do Vite, mantendo um único
 * processo (`npm run dev`) e o mesmo caminho `/api` usado em produção.
 */
export function devApiPlugin(): Plugin {
  return {
    name: 'vaidelista-dev-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          next()
          return
        }

        server
          .ssrLoadModule('/server/app.ts')
          .then((module) => {
            const expressApp = (module as { app: ExpressApp }).app
            expressApp(req, res, next)
          })
          .catch(next)
      })
    },
  }
}
