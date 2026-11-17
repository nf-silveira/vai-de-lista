# Vai de Lista

> Anotou. Comprou. Economizou.

Aplicativo mobile-first para registrar a compra do mercado: adicionar produtos, informar preços, acompanhar o total e, futuramente, comparar com compras anteriores. A lista é **compartilhada** entre duas contas.

## Stack

- **React 19 + TypeScript + Vite**
- **Bootstrap 5** (grid, formulários e componentes) + **CSS Modules** e design tokens
- **React Router 7** (rotas com guarda de sessão)
- **Better Auth** (e-mail/senha, sessão em cookie) sobre **Neon PostgreSQL** (`pg`)
- **Express** para a API, executada no dev server do Vite e como função da Vercel em produção

## Estrutura

```text
api/                      # função serverless da Vercel (encaminha para server/app.ts)
server/
├── app.ts                # Express: /api/auth/*, /api/items
├── auth.ts               # instância do Better Auth + allowlist de e-mails
├── db.ts                 # pool do Neon e helper de query
├── devApiPlugin.ts       # monta a API no dev server do Vite
└── items.ts              # SQL e validação dos itens
scripts/
├── migrate.ts            # tabelas do Better Auth (via getMigrations) + shopping_items
└── seed.ts               # cria as contas permitidas
shared/shopping-list.ts   # tipos compartilhados entre API e app
src/
├── app/                  # router, layout e guarda de rota
├── components/           # AppHeader, BottomNavigation, LoadingState, PlaceholderPage
├── features/
│   ├── auth/pages/       # LoginPage
│   └── shopping-list/    # components, hooks, services, utils, pages
├── lib/auth-client.ts    # cliente Better Auth
├── config/brand.ts
└── styles/               # tokens, tema do Bootstrap e global
```

## Configuração

1. Copie `.env.example` para `.env.local` e preencha:

| Variável                                         | Uso                                              |
| ------------------------------------------------ | ------------------------------------------------ |
| `DATABASE_URL`                                   | string de conexão do Neon (obrigatória)          |
| `BETTER_AUTH_SECRET`                             | segredo de assinatura das sessões (obrigatória)  |
| `BETTER_AUTH_URL`                                | URL do app (ex.: `http://localhost:5173`)        |
| `ALLOWED_EMAILS`                                 | e-mails autorizados além das contas de seed      |
| `SEED_USER_1_EMAIL` / `SEED_USER_1_PASSWORD`     | credenciais da primeira conta permitida          |
| `SEED_USER_2_EMAIL` / `SEED_USER_2_PASSWORD`     | credenciais da segunda conta permitida           |

2. Aplique o schema e crie as contas:

```bash
npm run db:migrate
npm run db:seed
```

## Scripts

| Script              | Descrição                                             |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | App + API (Express montada no dev server do Vite)     |
| `npm run build`     | Checagem de tipos (`tsc -b`) e build de produção      |
| `npm run lint`      | ESLint em todo o projeto                              |
| `npm run typecheck` | Somente a checagem de tipos                           |
| `npm run verify`    | Lint + build (usado antes do commit)                  |
| `npm run db:migrate`| Cria/atualiza tabelas do auth e `shopping_items`      |
| `npm run db:seed`   | Cria as duas contas permitidas                        |

## Autenticação

- Somente os e-mails de `ALLOWED_EMAILS` e das contas de seed podem se cadastrar; qualquer outro recebe `403`.
- Não existe tela de cadastro: as duas contas são provisionadas por `npm run db:seed`.
- Sessão em cookie gerenciada pelo Better Auth; rotas do app passam por `ProtectedRoute`.

## API

Todas as rotas de itens exigem sessão ativa.

| Método   | Rota             | Descrição                         |
| -------- | ---------------- | --------------------------------- |
| `GET`    | `/api/items`     | Lista compartilhada               |
| `POST`   | `/api/items`     | Adiciona item (nome, qtd, preço)  |
| `PATCH`  | `/api/items/:id` | Marca como comprado (`isChecked`) |
| `DELETE` | `/api/items/:id` | Remove item                       |
| `*`      | `/api/auth/*`    | Better Auth                       |

## Deploy

A SPA e a função `api/[...all].ts` sobem juntas na Vercel. Configure `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (domínio de produção) e os `SEED_USER_*` nas variáveis de ambiente do projeto; depois rode `npm run db:migrate` apontando para o banco de produção.

## Documentação

Contratos de produto/design e regras de engenharia em [`.docs/`](.docs/README.md).

## Git

- Desenvolvimento em `develop`; `main` só recebe via Pull Request com `npm run verify` verde.
