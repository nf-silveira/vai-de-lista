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

const SHOPPING_LISTS_TABLE = `
  create table if not exists shopping_lists (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    completed_at timestamptz,
    updated_at timestamptz not null default now(),
    constraint shopping_lists_status_check
      check (status in ('active', 'completed')),
    constraint shopping_lists_completed_check
      check ((status = 'completed') = (completed_at is not null))
  )
`

const SHOPPING_LIST_ITEMS_TABLE = `
  create table if not exists shopping_list_items (
    id uuid primary key default gen_random_uuid(),
    list_id uuid not null references shopping_lists(id) on delete cascade,
    product_name text not null,
    quantity numeric(12, 3) not null default 1 check (quantity > 0),
    unit text not null default 'un',
    unit_price numeric(12, 2) check (unit_price is null or unit_price >= 0),
    is_collected boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )
`

const SHOPPING_LIST_ITEMS_INDEX = `
  create index if not exists shopping_list_items_list_idx
    on shopping_list_items(list_id)
`

const PRICE_RECORDS_TABLE = `
  create table if not exists price_records (
    id uuid primary key default gen_random_uuid(),
    recorded_by text references "user"(id) on delete set null,
    list_item_id uuid references shopping_list_items(id) on delete set null,
    product_key text not null,
    product_name text not null,
    quantity numeric(12, 3) not null check (quantity > 0),
    unit text not null,
    unit_price numeric(12, 2) not null check (unit_price >= 0),
    normalized_unit text,
    normalized_unit_price numeric(12, 4),
    purchased_at timestamptz not null,
    created_at timestamptz not null default now()
  )
`

const PRICE_RECORDS_INDEXES = [
  `create index if not exists price_records_product_date_idx
     on price_records(product_key, purchased_at desc)`,
  // Impede registro duplicado na finalização, mesmo se ela for repetida.
  `create unique index if not exists price_records_list_item_key
     on price_records(list_item_id) where list_item_id is not null`,
]

/** Colunas de papel, aprovação e banimento usadas pelo painel de contas. */
const USER_ACCOUNT_COLUMNS = [
  `alter table "user" add column if not exists role text not null default 'user'`,
  `alter table "user" add column if not exists status text not null default 'pending'`,
  `alter table "user" add column if not exists ban_reason text`,
  `alter table "user" drop constraint if exists user_role_check`,
  `alter table "user" add constraint user_role_check check (role in ('admin', 'user'))`,
  `alter table "user" drop constraint if exists user_status_check`,
  `alter table "user" add constraint user_status_check check (status in ('pending', 'active', 'banned'))`,
]

async function run(): Promise<void> {
  preferOwnerConnection()

  const { getMigrations } = await import('better-auth/db/migration')
  const { auth } = await import('../server/auth.js')
  const { pool, query } = await import('../server/db.js')

  try {
    const { runMigrations } = await getMigrations(auth.options)
    await runMigrations()
    console.log('Tabelas de autenticação do Better Auth aplicadas.')

    await query(SHOPPING_LISTS_TABLE)
    await query(SHOPPING_LIST_ITEMS_TABLE)
    await query(SHOPPING_LIST_ITEMS_INDEX)
    await query(PRICE_RECORDS_TABLE)

    for (const statement of PRICE_RECORDS_INDEXES) {
      await query(statement)
    }

    console.log('Listas, itens de compra e registros de preço aplicados.')

    for (const statement of USER_ACCOUNT_COLUMNS) {
      await query(statement)
    }
    console.log('Colunas de papel e status de conta aplicadas.')
  } finally {
    await pool.end()
  }
}

run().catch((error: unknown) => {
  console.error('Falha ao migrar o banco:', error)
  process.exitCode = 1
})
