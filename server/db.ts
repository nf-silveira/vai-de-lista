import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL não configurada. Defina a variável de ambiente antes de iniciar o servidor.',
  )
}

export const pool = new Pool({ connectionString })

export async function query<T extends object>(
  text: string,
  values: readonly unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, [...values])
  return result.rows
}
