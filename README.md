# Vai de Lista

> Anotou. Comprou. Economizou.

Aplicativo mobile-first para registrar a compra do mercado: adicionar produtos, informar preços, acompanhar o total e, futuramente, comparar com compras anteriores. A lista é **compartilhada** entre duas contas.

## Stack

- **React 19 + TypeScript + Vite**
- **Bootstrap 5** (grid, formulários e componentes) + **CSS Modules** e design tokens
- **React Router 7** (rotas com guarda de sessão)
- **Better Auth** (nick + senha, e-mail para recuperação, sessão em cookie) sobre **Neon PostgreSQL** (`pg`)
- **Express** para a API, executada no dev server do Vite e como função da Vercel em produção

## Estrutura

```text
api/                      # função serverless da Vercel (encaminha para server/app.ts)
server/
├── app.ts                # Express: /api/auth, /api/me, /api/items, /api/admin
├── auth.ts               # Better Auth + autoaprovação de ALLOWED_EMAILS
├── sessionGuard.ts       # sessão válida + conta ativa
├── accounts.ts           # consultas de papel, status e exclusão de contas
├── admin.ts              # rotas do painel de contas
├── db.ts                 # pool do Neon e helper de query
├── devApiPlugin.ts       # monta a API no dev server do Vite
├── items.ts              # SQL dos itens da lista ativa
├── lists.ts              # lista ativa, finalização e consultas do histórico
├── comparisonQueries.ts  # busca de produtos e comparação de preços
├── priceComparison.ts    # regras puras das janelas e variações
├── products.ts           # normalização de produto e preço por unidade
├── itemValidation.ts     # validação dos payloads de item
└── rateLimit.ts          # limite de requisições por IP
scripts/
├── migrate.ts            # tabelas do Better Auth (via getMigrations) + shopping_items
└── seed.ts               # cria as contas permitidas
shared/shopping-list.ts   # tipos compartilhados entre API e app
src/
├── app/                  # router, layout e guarda de rota
├── components/           # AppHeader, BottomNavigation, LoadingState, PlaceholderPage
├── features/
│   ├── admin/            # painel de contas (somente admin)
│   ├── auth/pages/       # LoginPage, SignUpPage, AccountStatusPage
│   ├── comparison/       # busca de produto e comparação de preços
│   ├── history/          # histórico e detalhe das compras finalizadas
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
| `ALLOWED_EMAILS`                                 | e-mails que já nascem aprovados no cadastro      |
| `ADMIN_EMAIL`                                    | conta promovida a administradora por `db:grant-admin` |
| `RESEND_API_KEY`                                 | chave do Resend usada no e-mail de redefinição   |
| `RESET_EMAIL_FROM`                               | remetente verificado no Resend (obrigatório em produção) |
| `SEED_USER_1_EMAIL` / `SEED_USER_1_PASSWORD`     | credenciais da primeira conta permitida          |
| `SEED_USER_2_EMAIL` / `SEED_USER_2_PASSWORD`     | credenciais da segunda conta permitida           |

A lista é única e compartilhada entre as contas da casa. Toda conta nasce **pendente** e só lê e altera itens depois de aprovada pelo administrador; contas banidas perdem o acesso e as sessões abertas.

2. Aplique o schema e crie as contas:

```bash
npm run db:migrate
npm run db:seed
```

Em produção as migrations rodam com o owner (`MIGRATION_DATABASE_URL`) e a API conecta com um role só de `SELECT/INSERT/UPDATE/DELETE`, criado por `npm run db:setup-runtime-role`.

As URLs do Neon vêm com `sslmode=require`. `server/pgConnection.ts` normaliza esse valor para `verify-full` antes de abrir o pool: é o comportamento atual do pg 8 tornado explícito, porque no pg 9 `require` deixa de validar a cadeia do certificado.

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
| `npm run test:auth` | Integração de login/redefinição e CRUD da API (usa `DATABASE_URL`) |
| `npm run verify`    | Lint + testes + build (usado antes do commit e no CI) |
| `npm run db:migrate`| Cria/atualiza tabelas do auth, listas e preços       |
| `npm run db:seed`   | Cria as duas contas permitidas                        |
| `npm run db:remove-seed`| Apaga as contas de seed (idempotente)            |
| `npm run db:reset-password`| Redefine a senha de uma conta existente     |
| `npm run db:grant-admin`| Promove `ADMIN_EMAIL` a administradora ativa |
| `npm run db:setup-runtime-role`| Cria/atualiza o role de runtime com grants  |

## Autenticação

- Cadastro em `/cadastro` (Nick, E-mail e Senha) cria a conta já autenticada, com sessão em cookie do Better Auth. O login é feito pelo **nick**; o e-mail serve para recuperar a senha.
- Todo cadastro nasce com status `pending` e vê a tela de espera; os e-mails de `ALLOWED_EMAILS` já nascem `active`.
- O administrador (`role = 'admin'`) vê o atalho **Contas** no cabeçalho (`/admin`) e aprova, bane, desbane e exclui contas. O painel nunca altera a própria conta do administrador.
- `role`, `status` e `ban_reason` entram em `public.user` pelo `npm run db:migrate`. A primeira conta administradora precisa existir antes de `ADMIN_EMAIL=seu@email npm run db:grant-admin`, que a deixa `admin` e `active`.
- Banir encerra todas as sessões da conta; excluir remove credencial, sessões e tokens de redefinição junto com o usuário.
- O nick aceita de 3 a 20 caracteres (letras, números, ponto ou `_`), é único e não diferencia maiúsculas de minúsculas. As colunas `username` e `displayUsername` entram em `public.user` pelo `npm run db:migrate`.
- Sessão em cookie gerenciada pelo Better Auth; rotas do app passam por `ProtectedRoute`.
- O app autentica pelas tabelas do Better Auth no schema `public` (`public.user`, `public.account`). O schema `neon_auth`, quando existir no banco, pertence ao Neon Auth e **não** é lido por este código: contas criadas lá não entram no app e a redefinição de senha do app não as alcança.
- Recuperação de senha em `/esqueci-senha`: o Better Auth gera um link válido por 1 hora e o app o envia via Resend. Configure `RESEND_API_KEY` e `RESET_EMAIL_FROM` com um domínio verificado no Resend — o remetente de teste `onboarding@resend.dev` só entrega para o dono da conta Resend, por isso não é usado em produção.
- Sem `RESEND_API_KEY`, fora de produção nenhum e-mail sai: o link aparece no terminal do `npm run dev` (`[auth] RESEND_API_KEY ausente...`) e pode ser aberto dali.
- Se a senha de um membro se perder, também é possível redefinir pela máquina de confiança:

```bash
RESET_USER_EMAIL=alguem@exemplo.com RESET_USER_PASSWORD='nova-senha-com-8+' npm run db:reset-password
```

O comando grava o hash do Better Auth, encerra as sessões abertas daquela conta, cria a credencial se a conta não tiver uma e avisa quando o e-mail não existe.

## API

Todas as rotas de itens e do histórico exigem sessão de conta **ativa**. Não há RLS no Postgres: a API é a fronteira de segurança, valida a sessão e o status da conta antes de qualquer query, e o cliente nunca acessa o banco. Quantidade aceita até 3 casas decimais (máximo `999999`) e preço até 2 casas (máximo `999999.99`) — fora disso a resposta é `400`, nunca um erro de banco.

Finalizar uma compra marca a lista como concluída em transação e grava um registro em `price_records` por item com preço. Repetir a finalização com o mesmo `listId` devolve a mesma compra, sem duplicar preços; itens sem preço continuam no histórico, mas não geram registro. Excluir uma compra remove o retrato e mantém os `price_records` (o vínculo vira nulo).

A comparação usa sempre o preço mais recente do produto e três referências: a compra imediatamente anterior, o registro mais recente dos últimos 7 dias e o registro mais recente do mês-calendário anterior. Unidades compatíveis são comparadas por unidade equivalente (kg↔g, l↔ml); casos como caixa ou unidades diferentes são bloqueados com explicação. Percentual só existe quando o preço de referência é maior que zero.

| Método   | Rota             | Descrição                         |
| -------- | ---------------- | --------------------------------- |
| `GET`    | `/api/items`     | Lista ativa (itens + id/nome)     |
| `POST`   | `/api/items`     | Adiciona item (nome, qtd, un., preço) |
| `PATCH`  | `/api/items/:id` | Edita campos parciais do item (`name`, `quantity`, `unit`, `unitPrice`, `isChecked`) |
| `DELETE` | `/api/items/:id` | Remove item                       |
| `GET`    | `/api/purchases` | Compras finalizadas (histórico)   |
| `POST`   | `/api/purchases` | Finaliza a lista (`{ listId }`)   |
| `GET`    | `/api/purchases/:id` | Detalhe da compra             |
| `DELETE` | `/api/purchases/:id` | Exclui a compra do histórico  |
| `GET`    | `/api/products`  | Busca produtos com preço (`search`) |
| `GET`    | `/api/comparisons` | Compara o preço atual (`productKey`) |
| `GET`    | `/api/me`        | Conta da sessão, com papel e status |
| `GET`    | `/api/admin/users` | Lista contas (somente admin)     |
| `POST`   | `/api/admin/users/:id/approve` | Aprova o cadastro  |
| `POST`   | `/api/admin/users/:id/ban` | Bane a conta e encerra as sessões |
| `POST`   | `/api/admin/users/:id/unban` | Desbane a conta              |
| `DELETE` | `/api/admin/users/:id` | Exclui a conta            |
| `*`      | `/api/auth/*`    | Better Auth                       |

## Deploy

A SPA e a função `api/[...all].ts` sobem juntas na Vercel. Configure `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (domínio de produção), os `SEED_USER_*` e, para o e-mail de redefinição, `RESEND_API_KEY` e `RESET_EMAIL_FROM` nas variáveis de ambiente do projeto; depois rode `npm run db:migrate` apontando para o banco de produção.

## Git

- Desenvolvimento em `develop`; `main` só recebe via Pull Request com `npm run verify` verde.
- O CI sobe um Postgres 17 de serviço, roda `npm run db:migrate` e depois executa `npm run test:auth`, então os testes de integração (login, CRUD, finalização e comparação) também são gate de regressão.
