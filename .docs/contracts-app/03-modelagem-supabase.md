# 03 — Modelagem Supabase

## Entidades principais

### `shopping_lists`
- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `name text not null`
- `status text not null` — `active` ou `completed`
- `created_at timestamptz not null default now()`
- `completed_at timestamptz null`
- `updated_at timestamptz not null default now()`

### `shopping_list_items`
- `id uuid primary key`
- `list_id uuid not null references shopping_lists(id) on delete cascade`
- `product_name text not null`
- `quantity numeric(12,3) not null default 1`
- `unit text not null default 'un'`
- `unit_price numeric(12,2) null`
- `is_collected boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `price_records`
Registro histórico imutável de preço observado em uma compra concluída.
- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `list_item_id uuid null references shopping_list_items(id) on delete set null`
- `product_key text not null`
- `product_name text not null`
- `quantity numeric(12,3) not null`
- `unit text not null`
- `unit_price numeric(12,2) not null`
- `normalized_unit text null`
- `normalized_unit_price numeric(12,4) null`
- `purchased_at timestamptz not null`
- `created_at timestamptz not null default now()`

`product_key` deve ser normalizada no app (trim, espaços consecutivos, lowercase e remoção de acentos para busca), mas preservar `product_name` para exibição. Não assumir que nomes parecidos são o mesmo produto; permitir que o usuário escolha/associe produtos em versão futura.

## SQL inicial (revisar antes de executar)
```sql
create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active','completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  product_name text not null,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit text not null default 'un',
  unit_price numeric(12,2) check (unit_price is null or unit_price >= 0),
  is_collected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.price_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_item_id uuid references public.shopping_list_items(id) on delete set null,
  product_key text not null,
  product_name text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  normalized_unit text,
  normalized_unit_price numeric(12,4),
  purchased_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index shopping_lists_user_created_idx
  on public.shopping_lists(user_id, created_at desc);
create index shopping_items_list_idx
  on public.shopping_list_items(list_id);
create index price_records_user_product_date_idx
  on public.price_records(user_id, product_key, purchased_at desc);

alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.price_records enable row level security;

create policy "Users manage own lists"
on public.shopping_lists for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage items in own lists"
on public.shopping_list_items for all
using (
  exists (
    select 1 from public.shopping_lists l
    where l.id = list_id and l.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.shopping_lists l
    where l.id = list_id and l.user_id = auth.uid()
  )
);

create policy "Users manage own price records"
on public.price_records for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## Cuidados obrigatórios
- Não colocar `service_role` no frontend.
- Usar somente chave anon/public no cliente, com RLS habilitado.
- Criar usuário/autenticação antes de depender de `auth.uid()`. Para protótipo sem login, decidir conscientemente a estratégia; não desativar RLS em produção.
- Ao finalizar uma lista, gravar `price_records` em uma operação consistente (idealmente função RPC/transação) para não duplicar registros em tentativas repetidas. Usar chave/idempotência ou validar se a lista já foi finalizada.
- Se um item for excluído após a compra, o registro histórico deve permanecer.
- Criar tipos TypeScript a partir do schema Supabase (CLI) e mantê-los sincronizados.
- Atualizar `updated_at` via trigger ou explicitamente nos serviços.
