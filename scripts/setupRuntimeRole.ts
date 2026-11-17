import { Pool } from 'pg'
import { withExplicitSsl } from '../server/pgConnection.js'

const SETTINGS_SQL = `
  select set_config('app.runtime_role', $1, false),
         set_config('app.runtime_password', $2, false)
`

const SETUP_SQL = `
  do $$
  declare
    runtime_role text := current_setting('app.runtime_role');
    runtime_password text := current_setting('app.runtime_password');
  begin
    if exists (select 1 from pg_roles where rolname = runtime_role) then
      execute format('alter role %I with login password %L', runtime_role, runtime_password);
    else
      execute format('create role %I with login password %L', runtime_role, runtime_password);
    end if;

    execute format('revoke create on schema public from %I', runtime_role);
    execute format('grant connect on database %I to %I', current_database(), runtime_role);
    execute format('grant usage on schema public to %I', runtime_role);
    execute format(
      'grant select, insert, update, delete on all tables in schema public to %I',
      runtime_role
    );
    execute format(
      'alter default privileges in schema public grant select, insert, update, delete on tables to %I',
      runtime_role
    );
  end
  $$;
`

const ROLE_NAME = /^[a-z_][a-z0-9_]{0,62}$/

function readCredentials(): { role: string; password: string } {
  const role = process.env.APP_DB_USER?.trim() ?? ''
  const password = process.env.APP_DB_PASSWORD ?? ''

  if (!ROLE_NAME.test(role) || password.length < 24) {
    throw new Error(
      'Defina APP_DB_USER (minúsculas, _ ou números) e APP_DB_PASSWORD (mínimo 24 caracteres).',
    )
  }

  return { role, password }
}

async function run(): Promise<void> {
  const { role, password } = readCredentials()
  const connectionString =
    process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('Defina MIGRATION_DATABASE_URL (owner) ou DATABASE_URL.')
  }

  const ownerPool = new Pool({ connectionString: withExplicitSsl(connectionString) })
  const client = await ownerPool.connect()

  try {
    await client.query(SETTINGS_SQL, [role, password])
    await client.query(SETUP_SQL)
    console.log(
      `Role ${role} pronta com SELECT/INSERT/UPDATE/DELETE nas tabelas.`,
    )
  } finally {
    client.release()
    await ownerPool.end()
  }
}

run().catch((error: unknown) => {
  console.error('Falha ao preparar o role de runtime:', error)
  process.exitCode = 1
})
