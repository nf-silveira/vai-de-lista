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
| `DATABASE_URL`                                   | conexão do runtime; use o role de privilégio mínimo |
| `MIGRATION_DATABASE_URL`                         | conexão do owner, usada só nas migrations        |
| `APP_DB_USER` / `APP_DB_PASSWORD`                | role de runtime criado por `db:setup-runtime-role` |
| `BETTER_AUTH_SECRET`                             | segredo de assinatura das sessões (obrigatória)  |
| `BETTER_AUTH_URL`                                | URL do app (ex.: `http://localhost:5174`)        |
| `ALLOWED_EMAILS`                                 | e-mails que acessam a lista (obrigatória em produção) |
| `ALLOW_PUBLIC_SIGNUP`                            | `true` libera o cadastro para qualquer e-mail    |
| `SEED_USER_1_EMAIL` / `SEED_USER_1_PASSWORD`     | credenciais da primeira conta permitida          |
| `SEED_USER_2_EMAIL` / `SEED_USER_2_PASSWORD`     | credenciais da segunda conta permitida           |

A lista é única e compartilhada entre as contas da casa. Só quem está em `ALLOWED_EMAILS` lê e altera itens: em produção, sem essa variável, o acesso é negado. Fora de produção, sem ela, qualquer sessão acessa.

2. Aplique o schema e crie as contas:

```bash
npm run db:migrate
npm run db:seed
```

Em produção as migrations rodam com o owner (`MIGRATION_DATABASE_URL`) e a API conecta com um role só de `SELECT/INSERT/UPDATE/DELETE`, criado por `npm run db:setup-runtime-role`.

### Rotacionar a senha do role de runtime

O script é idempotente: rodar de novo com a mesma senha não muda nada; com uma senha nova, troca a credencial e aplica os grants de novo.

```bash
# 1. defina a nova senha (mínimo 24 caracteres) no .env.local, em APP_DB_PASSWORD
npm run db:setup-runtime-role

# 2. atualize a DATABASE_URL local e a da Vercel com a senha nova
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production

# 3. redeploy para a função serverless reconectar
```

Repita o passo 2 para o ambiente `preview`. A senha do owner (`MIGRATION_DATABASE_URL`) não é alterada por esse script: se precisar trocá-la, faça no console do Neon e atualize a variável. Depois da troca, valide com `curl -i https://vai-de-lista.vercel.app/api/items` (esperado `401` sem sessão, e nenhum `permission denied` nos logs).

## Scripts

| Script              | Descrição                                             |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | App + API na porta fixa `5174` (Vite + Express)       |
| `npm run build`     | Checagem de tipos (`tsc -b`) e build de produção      |
| `npm run lint`      | ESLint em todo o projeto                              |
| `npm run typecheck` | Somente a checagem de tipos                           |
| `npm run test`      | Testes de totalização e validação (`node:test`)       |
| `npm run verify`    | Lint + testes + build (usado antes do commit e no CI) |
| `npm run db:migrate`| Cria/atualiza tabelas do auth e `shopping_items`      |
| `npm run db:seed`   | Cria as duas contas permitidas                        |
| `npm run db:remove-seed`| Apaga as contas de seed (idempotente)            |
| `npm run db:reset-password`| Redefine a senha de uma conta existente     |
| `npm run db:setup-runtime-role`| Cria/atualiza o role de runtime com grants  |

## Autenticação

- Cadastro em `/cadastro` (Nome, E-mail e Senha) cria a conta já autenticada, com sessão em cookie do Better Auth.
- Com `ALLOW_PUBLIC_SIGNUP=true` qualquer e-mail pode se cadastrar; sem ele, só os e-mails de `ALLOWED_EMAILS` e das contas de seed passam (os demais recebem `403`).
- Em produção (`NODE_ENV=production`) o cadastro público só funciona com `ALLOW_PUBLIC_SIGNUP=true` explícito.
- Sessão em cookie gerenciada pelo Better Auth; rotas do app passam por `ProtectedRoute`.
- Não há recuperação de senha por e-mail. Se a senha de um membro se perder, redefina pela máquina de confiança:

```bash
RESET_USER_EMAIL=alguem@exemplo.com RESET_USER_PASSWORD='nova-senha-com-8+' npm run db:reset-password
```

O comando grava o hash do Better Auth, encerra as sessões abertas daquela conta e avisa quando o e-mail não existe ou a conta não tem credencial de senha.

## API

Todas as rotas de itens exigem sessão ativa.

| Método   | Rota             | Descrição                         |
| -------- | ---------------- | --------------------------------- |
| `GET`    | `/api/items`     | Lista compartilhada               |
| `POST`   | `/api/items`     | Adiciona item (nome, qtd, un., preço) |
| `PATCH`  | `/api/items/:id` | Edita campos parciais do item (`name`, `quantity`, `unit`, `unitPrice`, `isChecked`) |
| `DELETE` | `/api/items/:id` | Remove item                       |
| `*`      | `/api/auth/*`    | Better Auth                       |

## Deploy

A SPA e a função `api/[...all].ts` sobem juntas na Vercel. Configure `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (domínio de produção) e os `SEED_USER_*` nas variáveis de ambiente do projeto; depois rode `npm run db:migrate` apontando para o banco de produção.

## Git

- Desenvolvimento em `develop`; `main` só recebe via Pull Request com `npm run verify` verde.
