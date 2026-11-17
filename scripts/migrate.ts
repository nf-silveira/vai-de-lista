import { getMigrations } from 'better-auth/db/migration'
import { auth } from '../server/auth'
import { pool, query } from '../server/db'

const SHOPPING_ITEMS_TABLE = `
  create table if not exists shopping_items (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    quantity numeric(10, 3) not null default 1 check (quantity > 0),
    unit_price numeric(10, 2) check (unit_price >= 0),
    is_checked boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )
`

async function run(): Promise<void> {
  const { runMigrations } = await getMigrations(auth.options)
  await runMigrations()
  console.log('Tabelas de autenticação do Better Auth aplicadas.')

  await query(SHOPPING_ITEMS_TABLE)
  console.log('Tabela shopping_items aplicada.')
}

run()
  .catch((error: unknown) => {
    console.error('Falha ao migrar o banco:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
