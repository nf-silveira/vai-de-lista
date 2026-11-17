/**
 * Migrations rodam com o role owner, via `MIGRATION_DATABASE_URL`; o runtime
 * usa `DATABASE_URL`, que deve apontar para o role de privilégio mínimo.
 */
function preferOwnerConnection(): void {
  const ownerUrl = process.env.MIGRATION_DATABASE_URL

  if (ownerUrl) {
    process.env.DATABASE_URL = ownerUrl
  }
}

const SHOPPING_ITEMS_TABLE = `
  create table if not exists shopping_items (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    quantity numeric(10, 3) not null default 1 check (quantity > 0),
    unit text not null default 'un',
    unit_price numeric(10, 2) check (unit_price >= 0),
    is_checked boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )
`

const SHOPPING_ITEMS_UNIT_COLUMN = `
  alter table shopping_items
    add column if not exists unit text not null default 'un'
`

async function run(): Promise<void> {
  preferOwnerConnection()

  const { getMigrations } = await import('better-auth/db/migration')
  const { auth } = await import('../server/auth.js')
  const { pool, query } = await import('../server/db.js')

  try {
    const { runMigrations } = await getMigrations(auth.options)
    await runMigrations()
    console.log('Tabelas de autenticação do Better Auth aplicadas.')

    await query(SHOPPING_ITEMS_TABLE)
    await query(SHOPPING_ITEMS_UNIT_COLUMN)
    console.log('Tabela shopping_items aplicada.')
  } finally {
    await pool.end()
  }
}

run().catch((error: unknown) => {
  console.error('Falha ao migrar o banco:', error)
  process.exitCode = 1
})
