import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { devApiPlugin } from './server/devApiPlugin.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [react(), devApiPlugin()],
    css: {
      preprocessorOptions: {
        scss: {
          // O Bootstrap 5.3 ainda compila com @import e funções globais
          // (twbs/bootstrap#40962). O aviso de import fica restrito ao wrapper
          // legado e os demais são silenciados apenas nas dependências.
          quietDeps: true,
          silenceDeprecations: ['import'],
        },
      },
    },
    server: {
      port: 5174,
      strictPort: true,
    },
  }
})
