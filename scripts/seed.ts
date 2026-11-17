import { auth } from '../server/auth.js'
import { pool, query } from '../server/db.js'

interface SeedUser {
  email: string
  password: string
  name: string
}

function readSeedUsers(): SeedUser[] {
  return [
    {
      email: process.env.SEED_USER_1_EMAIL ?? '',
      password: process.env.SEED_USER_1_PASSWORD ?? '',
      name: 'Usuário 1',
    },
    {
      email: process.env.SEED_USER_2_EMAIL ?? '',
      password: process.env.SEED_USER_2_PASSWORD ?? '',
      name: 'Usuário 2',
    },
  ].filter((user) => user.email && user.password)
}

async function userExists(email: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    'select id from "user" where email = $1 limit 1',
    [email.toLowerCase()],
  )

  return rows.length > 0
}

async function run(): Promise<void> {
  const users = readSeedUsers()

  if (users.length === 0) {
    throw new Error(
      'Defina SEED_USER_1_EMAIL/SEED_USER_1_PASSWORD (e o par do usuário 2) no .env.local.',
    )
  }

  for (const user of users) {
    if (await userExists(user.email)) {
      console.log(`Conta já existe: ${user.email}`)
      continue
    }

    await auth.api.signUpEmail({
      body: {
        email: user.email,
        password: user.password,
        name: user.name,
      },
    })

    console.log(`Conta criada: ${user.email}`)
  }
}

run()
  .catch((error: unknown) => {
    console.error('Falha ao criar as contas:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
