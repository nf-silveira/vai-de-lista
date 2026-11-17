# 02 — Arquitetura e padrões técnicos

## Stack
React 19, TypeScript, Vite, Bootstrap 5 (grid/utilitários/componentes), CSS Modules com tokens próprios, React Router 7, Better Auth (e-mail/senha) e Neon PostgreSQL acessado por `pg` em uma API Express. Não adicionar biblioteca sem justificar o benefício.

## Decisão de arquitetura: API no servidor
Better Auth precisa de runtime de servidor e de acesso ao banco — não existe autenticação segura apenas no cliente. Por isso o projeto tem duas partes:

- **SPA** (`src/`): React + Vite, consome apenas `/api/*` por `fetch` com cookie de sessão.
- **API** (`server/`): Express com Better Auth e as rotas de domínio. Roda dentro do dev server do Vite (`server/devApiPlugin.ts`) e, em produção, como função serverless da Vercel (`api/[...all].ts`).

Consequências obrigatórias:
- `DATABASE_URL`, `BETTER_AUTH_SECRET` e qualquer credencial vivem apenas no servidor. Nunca usar prefixo `VITE_` em segredo.
- O banco não é exposto ao cliente; a autorização acontece na API, que valida a sessão antes de qualquer query.
- O cliente não fala com o Postgres diretamente e não conhece SQL.

## Organização atual
```text
api/
  [...all].ts            # entrada serverless (encaminha para server/app.ts)
server/
  app.ts                 # rotas Express: /api/auth/* e /api/items
  auth.ts                # Better Auth + allowlist de e-mails
  db.ts                  # pool do Neon + helper de query tipado
  devApiPlugin.ts        # monta a API no dev server do Vite
  items.ts               # SQL e validações dos itens
shared/
  shopping-list.ts       # tipos compartilhados entre API e SPA
scripts/
  migrate.ts             # tabelas do Better Auth + shopping_items
  seed.ts                # contas permitidas
src/
  app/
    AppLayout.tsx        # shell mobile (header + conteúdo + bottom nav)
    router.tsx           # rotas
    ProtectedRoute.tsx   # guarda de sessão
  components/
    AppHeader/
    BottomNavigation/
    LoadingState/
    PlaceholderPage/
  config/
    brand.ts
  features/
    auth/
      pages/
    shopping-list/
      components/
      hooks/
      pages/
      services/
      utils/
  lib/
    auth-client.ts       # cliente Better Auth
  styles/
    tokens.css
    theme.css            # ponte tokens → Bootstrap
    global.css           # reset + base
  main.tsx
```

Quando a feature crescer, ela ganha `types/` e `utils/` próprios — não criar pastas vazias por simetria.

## Regras de arquitetura
- Componentes de apresentação não chamam `fetch` diretamente: usam `services` da feature.
- Hooks coordenam estado e casos de uso; não concentram regras de negócio extensas.
- Regras de cálculo ficam em funções puras testáveis (`utils/summarizeItems.ts`).
- Componentes visuais não acessam banco nem sessão de servidor.
- Evitar componentes gigantes; extrair quando houver responsabilidade distinta ou repetição real.
- Não criar abstrações genéricas prematuras.
- Não usar `any`; modelar tipos e validar dados externos na API (`validateNewItem`, `validateCheckedPatch`).
- Tratar `null` explicitamente — `unit_price` nulo significa preço desconhecido, não zero.
- Não duplicar estado derivável: total é calculado dos itens, nunca guardado em estado paralelo.
- Rotas novas entram em `src/app/router.tsx`; rotas protegidas ficam sob `ProtectedRoute`.

## Estado e sincronização
- Começar com estado local por feature e serviços assíncronos.
- Atualizações otimistas somente quando houver estratégia de rollback.
- Exibir loading, erro e vazio em cada tela.
- Não assumir que a API sempre responderá: mapear `4xx`/`5xx` em mensagens para o usuário.
- Sessão vive em cookie httpOnly gerenciado pelo Better Auth; não armazenar token em `localStorage`.
- Não armazenar dados sensíveis no cliente; rascunhos offline, se existirem, precisam de escopo documentado.

## Formatação monetária
- Exibir em `pt-BR` com `Intl.NumberFormat`.
- Não usar `parseFloat` como única garantia de precisão monetária.
- Preço no banco como `numeric(10,2)`; no frontend, centralizar conversão/aritmética e testar arredondamento.
- Nunca concatenar strings de moeda para calcular.

## Convenções
- Componentes: funções nomeadas (`export function Component({...})`), sem `React.FC`.
- Props tipadas com interface; desestruturação no parâmetro com default nativo.
- `on*` para props de evento, `handle*` para manipuladores internos.
- Componentes e tipos: PascalCase. Variáveis/funções: camelCase. Constantes globais: UPPER_SNAKE_CASE quando fizer sentido.
- Um componente por arquivo quando facilitar leitura.
- Imports organizados; remover código morto e dependências não utilizadas.
- CSS por componente/feature em CSS Modules; tokens em `styles/tokens.css`; Bootstrap para o que ele já resolve.
