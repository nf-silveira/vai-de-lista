# 03 — Modelagem do banco (Neon PostgreSQL)

## Visão geral
O banco é um PostgreSQL gerenciado no Neon, acessado **somente pela API** (`server/`). Não há RLS nem acesso direto do navegador: a fronteira de segurança é a API, que valida a sessão do Better Auth antes de qualquer query.

Migrations e contas são aplicadas por `npm run db:migrate` e `npm run db:seed` (ver `README.md`).

## Tabelas do Better Auth
Criadas por `getMigrations()` (`scripts/migrate.ts`), a partir da configuração em `server/auth.ts`. Não editar à mão: mudanças de plugin/configuração exigem nova migração.

- **`user`** — `id text primary key`, `name`, `email` (único), `emailVerified`, `image`, `createdAt`, `updatedAt`.
- **`session`** — `id`, `token` (único), `userId`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt`, `updatedAt`.
- **`account`** — credenciais e provedores: `id`, `accountId`, `providerId`, `userId`, `password` (hash), tokens OAuth quando houver.
- **`verification`** — tokens temporários (verificação de e-mail, reset de senha).

Atenção: o `id` de `user` é `text` (não `uuid`). Qualquer tabela de domínio que referencie usuários deve usar `text`.

## Situação atual do domínio
A primeira versão tem **uma única lista compartilhada** entre as duas contas da casa. Por isso existe apenas uma tabela de domínio, sem `user_id`:

### `shopping_items`
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `quantity numeric(10,3) not null default 1 check (quantity > 0)`
- `unit text not null default 'un'` — `un`, `kg`, `g`, `l`, `ml` ou `cx`
- `unit_price numeric(10,2) null check (unit_price >= 0)` — `null` = preço ainda desconhecido
- `is_checked boolean not null default false` — marcado como comprado
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

```sql
create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity numeric(10, 3) not null default 1 check (quantity > 0),
  unit text not null default 'un',
  unit_price numeric(10, 2) check (unit_price >= 0),
  is_checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Evolução planejada
Quando entrarem histórico e comparação, o domínio passa a ter listas nomeadas, itens por lista e registros de preço. Mantendo o mesmo estilo:

```sql
create table if not exists shopping_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

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
);

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
);

create index if not exists shopping_items_list_idx
  on shopping_list_items(list_id);
create index if not exists price_records_product_date_idx
  on price_records(product_key, purchased_at desc);
```

`product_key` é normalizada no app (trim, espaços consecutivos, lowercase, remoção de acentos), mas `product_name` é preservado para exibição. Não assumir que nomes parecidos são o mesmo produto.

## Cuidados obrigatórios
- `DATABASE_URL` apenas no servidor; nunca em código do cliente nem em variável `VITE_*`.
- Toda rota de domínio valida a sessão (`auth.api.getSession`) antes de consultar dados.
- Consultas sempre parametrizadas (`$1`, `$2`); nunca concatenar valores em SQL.
- `unit_price` nulo não é zero: total considera apenas subtotais conhecidos.
- Ao finalizar uma lista, gravar `price_records` em transação e de forma idempotente (validar se a lista já foi finalizada) para não duplicar histórico.
- Excluir item ou lista concluída não deve apagar `price_records` (usar `on delete set null`).
- Atualizar `updated_at` explicitamente nos `update` (padrão já usado em `server/items.ts`).
- Tipos compartilhados entre API e SPA ficam em `shared/`; não duplicar o mesmo DTO dos dois lados.
